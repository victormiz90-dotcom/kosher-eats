-- ============================================================================
-- KosherEats MVP — Initial Schema
-- ============================================================================
-- Run this in the Supabase SQL editor or via `supabase db push`.
-- Requires the PostGIS extension for geospatial queries.
-- ============================================================================

create extension if not exists postgis;
create extension if not exists "uuid-ossp";

-- ============================================================================
-- ENUMS
-- ============================================================================

create type kashrus_category as enum ('meat', 'dairy', 'pareve', 'mixed');
create type verification_status as enum ('verified', 'pending', 'unverified', 'expired');
create type delivery_platform as enum ('ubereats', 'doordash', 'grubhub', 'seamless', 'direct', 'caviar', 'other');
create type subscription_tier as enum ('free', 'premium');
create type user_role as enum ('user', 'admin', 'restaurant_owner');

-- ============================================================================
-- CERTIFICATIONS (hechsher agencies)
-- ============================================================================
-- Seeded with major US agencies. stringency_level is a rough sort order
-- (1 = most lenient mainstream, 5 = most stringent), used for default filtering.

create table certifications (
  id uuid primary key default uuid_generate_v4(),
  agency_name text not null unique,
  agency_slug text not null unique,
  agency_short_name text,
  agency_logo_url text,
  agency_website text,
  stringency_level smallint default 3 check (stringency_level between 1 and 5),
  description text,
  created_at timestamptz not null default now()
);

-- ============================================================================
-- RESTAURANTS
-- ============================================================================

create table restaurants (
  id uuid primary key default uuid_generate_v4(),
  slug text not null unique,
  name text not null,

  -- Location
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  lat double precision not null,
  lng double precision not null,
  location geography(point, 4326)
    generated always as (st_setsrid(st_makepoint(lng, lat), 4326)::geography) stored,

  -- Contact
  phone text,
  website text,
  google_place_id text,

  -- Classification
  cuisine_tags text[] default '{}',
  price_level smallint check (price_level between 1 and 4),
  description text,

  -- Kashrus details
  category kashrus_category not null default 'pareve',
  cholov_yisroel boolean default false,
  pas_yisroel boolean default false,
  bishul_yisroel boolean default false,
  shomer_shabbos boolean default true,

  -- Hours stored as JSON: { "mon": {"open":"11:00","close":"22:00"}, ... }
  hours_json jsonb default '{}'::jsonb,

  -- Media
  image_urls text[] default '{}',
  hero_image_url text,

  -- Status
  verification_status verification_status not null default 'pending',
  last_verified_at timestamptz,
  featured boolean default false,
  active boolean default true,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index restaurants_location_idx on restaurants using gist (location);
create index restaurants_zip_idx on restaurants (zip);
create index restaurants_active_idx on restaurants (active) where active = true;
create index restaurants_cuisine_idx on restaurants using gin (cuisine_tags);

-- ============================================================================
-- RESTAURANT ↔ CERTIFICATION (many-to-many)
-- ============================================================================

create table restaurant_certifications (
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  certification_id uuid not null references certifications(id) on delete restrict,
  valid_through date,
  certificate_url text,
  notes text,
  created_at timestamptz not null default now(),
  primary key (restaurant_id, certification_id)
);

-- ============================================================================
-- DELIVERY LINKS (the deep-link routing table)
-- ============================================================================

create table delivery_links (
  id uuid primary key default uuid_generate_v4(),
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  platform delivery_platform not null,
  url text not null,
  affiliate_param text,
  active boolean default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (restaurant_id, platform)
);

create index delivery_links_restaurant_idx on delivery_links (restaurant_id);

-- ============================================================================
-- USER PROFILES (extends Supabase auth.users)
-- ============================================================================

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  home_zip text,
  role user_role not null default 'user',
  subscription_tier subscription_tier not null default 'free',

  -- Filter preferences (persist across sessions)
  pref_cholov_yisroel_only boolean default false,
  pref_pas_yisroel_only boolean default false,
  pref_shomer_shabbos_only boolean default true,
  pref_max_distance_miles smallint default 10,
  pref_certification_ids uuid[] default '{}',

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Auto-create profile on signup
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================================
-- FAVORITES
-- ============================================================================

create table favorites (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

-- ============================================================================
-- CLICK LOGGING (analytics gold)
-- ============================================================================

create table click_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  platform delivery_platform not null,
  user_zip text,
  user_lat double precision,
  user_lng double precision,
  user_agent text,
  created_at timestamptz not null default now()
);

create index click_events_restaurant_idx on click_events (restaurant_id, created_at desc);
create index click_events_created_idx on click_events (created_at desc);

-- ============================================================================
-- RESTAURANT OWNERS (future: self-service portal)
-- ============================================================================

create table restaurant_owners (
  user_id uuid not null references auth.users(id) on delete cascade,
  restaurant_id uuid not null references restaurants(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  primary key (user_id, restaurant_id)
);

-- ============================================================================
-- AUTO-UPDATE updated_at
-- ============================================================================

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger restaurants_updated_at before update on restaurants
  for each row execute function set_updated_at();

create trigger profiles_updated_at before update on profiles
  for each row execute function set_updated_at();

-- ============================================================================
-- GEOSPATIAL SEARCH HELPER
-- ============================================================================
-- Find restaurants within N miles of a point, ordered by distance.
-- Usage: select * from restaurants_near(40.6, -73.95, 5);

create or replace function restaurants_near(
  user_lat double precision,
  user_lng double precision,
  radius_miles double precision default 5
)
returns table (
  id uuid,
  name text,
  slug text,
  address text,
  city text,
  zip text,
  category kashrus_category,
  cholov_yisroel boolean,
  pas_yisroel boolean,
  hero_image_url text,
  distance_miles double precision
)
language sql stable as $$
  select
    r.id, r.name, r.slug, r.address, r.city, r.zip,
    r.category, r.cholov_yisroel, r.pas_yisroel, r.hero_image_url,
    st_distance(
      r.location,
      st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography
    ) / 1609.344 as distance_miles
  from restaurants r
  where r.active = true
    and r.verification_status = 'verified'
    and st_dwithin(
      r.location,
      st_setsrid(st_makepoint(user_lng, user_lat), 4326)::geography,
      radius_miles * 1609.344
    )
  order by distance_miles asc;
$$;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

alter table restaurants enable row level security;
alter table certifications enable row level security;
alter table restaurant_certifications enable row level security;
alter table delivery_links enable row level security;
alter table profiles enable row level security;
alter table favorites enable row level security;
alter table click_events enable row level security;
alter table restaurant_owners enable row level security;

-- Public read access for the core catalog
create policy "restaurants are publicly readable"
  on restaurants for select using (active = true);

create policy "certifications are publicly readable"
  on certifications for select using (true);

create policy "restaurant_certifications are publicly readable"
  on restaurant_certifications for select using (true);

create policy "delivery_links are publicly readable"
  on delivery_links for select using (active = true);

-- Profiles: users can read/update only their own
create policy "users read own profile"
  on profiles for select using (auth.uid() = id);

create policy "users update own profile"
  on profiles for update using (auth.uid() = id);

-- Favorites: users manage their own
create policy "users read own favorites"
  on favorites for select using (auth.uid() = user_id);

create policy "users insert own favorites"
  on favorites for insert with check (auth.uid() = user_id);

create policy "users delete own favorites"
  on favorites for delete using (auth.uid() = user_id);

-- Click events: anyone can insert (anonymous tracking), only admins read
create policy "anyone can log clicks"
  on click_events for insert with check (true);

create policy "admins read clicks"
  on click_events for select using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

-- Admin write policies for catalog management
create policy "admins manage restaurants"
  on restaurants for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admins manage certifications"
  on certifications for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admins manage restaurant_certifications"
  on restaurant_certifications for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "admins manage delivery_links"
  on delivery_links for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );
