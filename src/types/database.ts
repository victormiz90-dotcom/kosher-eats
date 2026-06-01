// ============================================================================
// Database types — keep in sync with supabase/migrations/0001_initial_schema.sql
// ============================================================================
// In production, you can auto-generate this with:
//   supabase gen types typescript --project-id <id> > src/types/database.ts
// This file is the hand-written starter version.
// ============================================================================

export type KashrusCategory = 'meat' | 'dairy' | 'pareve' | 'mixed';
export type VerificationStatus = 'verified' | 'pending' | 'unverified' | 'expired';
export type DeliveryPlatform =
  | 'ubereats'
  | 'doordash'
  | 'grubhub'
  | 'seamless'
  | 'direct'
  | 'caviar'
  | 'other';
export type SubscriptionTier = 'free' | 'premium';
export type UserRole = 'user' | 'admin' | 'restaurant_owner';

export interface Certification {
  id: string;
  agency_name: string;
  agency_slug: string;
  agency_short_name: string | null;
  agency_logo_url: string | null;
  agency_website: string | null;
  stringency_level: number;
  description: string | null;
  created_at: string;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  phone: string | null;
  website: string | null;
  google_place_id: string | null;
  cuisine_tags: string[];
  price_level: number | null;
  description: string | null;
  category: KashrusCategory;
  cholov_yisroel: boolean;
  pas_yisroel: boolean;
  bishul_yisroel: boolean;
  shomer_shabbos: boolean;
  hours_json: Record<string, { open: string; close: string } | null>;
  image_urls: string[];
  hero_image_url: string | null;
  verification_status: VerificationStatus;
  last_verified_at: string | null;
  featured: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DeliveryLink {
  id: string;
  restaurant_id: string;
  platform: DeliveryPlatform;
  url: string;
  affiliate_param: string | null;
  active: boolean;
  last_checked_at: string | null;
  created_at: string;
}

export interface Profile {
  id: string;
  display_name: string | null;
  home_zip: string | null;
  role: UserRole;
  subscription_tier: SubscriptionTier;
  pref_cholov_yisroel_only: boolean;
  pref_pas_yisroel_only: boolean;
  pref_shomer_shabbos_only: boolean;
  pref_max_distance_miles: number;
  pref_certification_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface RestaurantNearResult {
  id: string;
  name: string;
  slug: string;
  address: string;
  city: string;
  zip: string;
  category: KashrusCategory;
  cholov_yisroel: boolean;
  pas_yisroel: boolean;
  hero_image_url: string | null;
  distance_miles: number;
  // Attached after the geo/name query so each card can show who certifies the
  // restaurant, whether it's a paid feature, and its order links.
  primary_cert?: { short: string | null; name: string } | null;
  featured?: boolean;
  order_links?: { id: string; platform: DeliveryPlatform }[];
}

// Composite type used in the detail page
export interface RestaurantWithDetails extends Restaurant {
  certifications: Certification[];
  delivery_links: DeliveryLink[];
}
