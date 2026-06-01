import { createClient } from '@/lib/supabase/server';
import type {
  RestaurantNearResult,
  RestaurantWithDetails,
  DeliveryPlatform
} from '@/types/database';

export interface SearchFilters {
  cholovYisroelOnly?: boolean;
  pasYisroelOnly?: boolean;
  shomerShabbosOnly?: boolean;
  category?: 'meat' | 'dairy' | 'pareve' | 'mixed';
  cuisine?: string;
  certSlugs?: string[];
  maxDistanceMiles?: number;
}

export interface CertOption {
  slug: string;
  name: string;
  short_name: string | null;
}

const PLATFORM_ORDER: DeliveryPlatform[] = [
  'ubereats',
  'doordash',
  'grubhub',
  'seamless',
  'caviar',
  'direct',
  'other'
];

/**
 * Enrich list results with everything a card needs: the primary (most stringent)
 * hechsher, the `featured` flag, and active delivery links for the order buttons.
 * Three batched queries for all visible IDs. Exported so /saved can reuse it.
 */
export async function attachCardData(
  results: RestaurantNearResult[]
): Promise<RestaurantNearResult[]> {
  if (results.length === 0) return results;
  const supabase = createClient();
  const ids = results.map((r) => r.id);

  const [certsRes, featRes, linksRes] = await Promise.all([
    supabase
      .from('restaurant_certifications')
      .select(
        'restaurant_id, certification:certifications(agency_short_name, agency_name, stringency_level)'
      )
      .in('restaurant_id', ids),
    supabase.from('restaurants').select('id, featured').in('id', ids),
    supabase
      .from('delivery_links')
      .select('id, restaurant_id, platform')
      .eq('active', true)
      .in('restaurant_id', ids)
  ]);

  const bestCert = new Map<string, { short: string | null; name: string; level: number }>();
  for (const row of (certsRes.data ?? []) as any[]) {
    const c = Array.isArray(row.certification) ? row.certification[0] : row.certification;
    if (!c) continue;
    const level = c.stringency_level ?? 0;
    const existing = bestCert.get(row.restaurant_id);
    if (!existing || level > existing.level) {
      bestCert.set(row.restaurant_id, {
        short: c.agency_short_name ?? null,
        name: c.agency_name,
        level
      });
    }
  }

  const featuredMap = new Map<string, boolean>();
  for (const row of (featRes.data ?? []) as any[]) featuredMap.set(row.id, !!row.featured);

  const linksMap = new Map<string, { id: string; platform: DeliveryPlatform }[]>();
  for (const row of (linksRes.data ?? []) as any[]) {
    const arr = linksMap.get(row.restaurant_id) ?? [];
    arr.push({ id: row.id, platform: row.platform });
    linksMap.set(row.restaurant_id, arr);
  }
  for (const arr of linksMap.values()) {
    arr.sort(
      (a, b) => PLATFORM_ORDER.indexOf(a.platform) - PLATFORM_ORDER.indexOf(b.platform)
    );
  }

  return results.map((r) => {
    const c = bestCert.get(r.id);
    return {
      ...r,
      primary_cert: c ? { short: c.short, name: c.name } : null,
      featured: featuredMap.get(r.id) ?? false,
      order_links: linksMap.get(r.id) ?? []
    };
  });
}

/**
 * Find restaurants near a lat/lng with optional filters.
 * Uses the PostGIS function `restaurants_near` defined in the schema.
 */
export async function findRestaurantsNear(
  lat: number,
  lng: number,
  filters: SearchFilters = {}
): Promise<RestaurantNearResult[]> {
  const supabase = createClient();
  const radius = filters.maxDistanceMiles ?? 10;

  const { data, error } = await supabase.rpc('restaurants_near', {
    user_lat: lat,
    user_lng: lng,
    radius_miles: radius
  });

  if (error) {
    console.error('restaurants_near failed:', error);
    return [];
  }

  let results = (data ?? []) as RestaurantNearResult[];

  // Apply client-side filters that aren't part of the RPC
  if (filters.cholovYisroelOnly) {
    results = results.filter((r) => r.cholov_yisroel);
  }
  if (filters.pasYisroelOnly) {
    results = results.filter((r) => r.pas_yisroel);
  }
  if (filters.category) {
    results = results.filter((r) => r.category === filters.category);
  }

  // Cert filter: pull restaurant_ids that have any of the requested cert slugs,
  // then intersect with the radius result.
  if (filters.certSlugs && filters.certSlugs.length > 0) {
    const { data: certRows } = await supabase
      .from('restaurant_certifications')
      .select('restaurant_id, certification:certifications!inner(agency_slug)')
      .in('certification.agency_slug', filters.certSlugs);
    const matchingIds = new Set((certRows ?? []).map((r: any) => r.restaurant_id));
    results = results.filter((r) => matchingIds.has(r.id));
  }

  return attachCardData(results);
}

/**
 * Search active verified restaurants by name (case-insensitive substring).
 * Used when the user types into the search bar — bypasses the radius/PostGIS
 * search so they can find restaurants anywhere in the directory, not just
 * within their current location radius.
 *
 * Applies the same secondary filters (CY/PY/category/cert) as the radius search.
 */
export async function searchRestaurantsByName(
  q: string,
  filters: SearchFilters = {}
): Promise<RestaurantNearResult[]> {
  const supabase = createClient();
  const term = q.trim();
  if (!term) return [];

  // Escape % and _ in the search term so they're treated as literals, not wildcards.
  const escaped = term.replace(/[%_\\]/g, (m) => '\\' + m);

  let query = supabase
    .from('restaurants')
    .select(
      'id, name, slug, address, city, zip, category, cholov_yisroel, pas_yisroel, hero_image_url'
    )
    .eq('active', true)
    .eq('verification_status', 'verified')
    .ilike('name', `%${escaped}%`)
    .order('name', { ascending: true })
    .limit(200);

  if (filters.cholovYisroelOnly) query = query.eq('cholov_yisroel', true);
  if (filters.pasYisroelOnly) query = query.eq('pas_yisroel', true);
  if (filters.category) query = query.eq('category', filters.category);

  const { data, error } = await query;
  if (error || !data) {
    console.error('searchRestaurantsByName failed:', error);
    return [];
  }

  let results = data.map((r: any) => ({
    ...r,
    distance_miles: 0
  })) as RestaurantNearResult[];

  // Cert filter via secondary query (same pattern as findRestaurantsNear)
  if (filters.certSlugs && filters.certSlugs.length > 0) {
    const { data: certRows } = await supabase
      .from('restaurant_certifications')
      .select('restaurant_id, certification:certifications!inner(agency_slug)')
      .in('certification.agency_slug', filters.certSlugs);
    const matchingIds = new Set((certRows ?? []).map((r: any) => r.restaurant_id));
    results = results.filter((r) => matchingIds.has(r.id));
  }

  return attachCardData(results);
}

/**
 * Return all active certification agencies for use in the kashrus filter dropdown.
 * Ordered by name. Skips internal "Local Rabbi Supervision" catch-all from the dropdown
 * since it's not a real agency users would filter by.
 */
export async function getCertOptions(): Promise<CertOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from('certifications')
    .select('agency_slug, agency_name, agency_short_name')
    .neq('agency_slug', 'local-rabbi')
    .order('agency_name', { ascending: true });
  if (error || !data) return [];
  return data.map((c: any) => ({
    slug: c.agency_slug,
    name: c.agency_name,
    short_name: c.agency_short_name
  }));
}

/**
 * Fetch one restaurant by slug, including its certifications and delivery links.
 */
export async function getRestaurantBySlug(slug: string): Promise<RestaurantWithDetails | null> {
  const supabase = createClient();

  const { data: restaurant, error } = await supabase
    .from('restaurants')
    .select('*')
    .eq('slug', slug)
    .eq('active', true)
    .single();

  if (error || !restaurant) return null;

  const [{ data: certData }, { data: linkData }] = await Promise.all([
    supabase
      .from('restaurant_certifications')
      .select('certification:certifications(*)')
      .eq('restaurant_id', restaurant.id),
    supabase
      .from('delivery_links')
      .select('*')
      .eq('restaurant_id', restaurant.id)
      .eq('active', true)
  ]);

  return {
    ...restaurant,
    certifications: (certData ?? []).map((row: any) => row.certification).filter(Boolean),
    delivery_links: linkData ?? []
  };
}

/**
 * Geocode a US zip code to lat/lng using a cached zip → lat/lng table.
 * For MVP, we use a tiny hardcoded set of high-priority zips.
 * Replace with a real geocoder (Google Geocoding API) or zip database (~40k US zips) later.
 */
const ZIP_FALLBACK: Record<string, { lat: number; lng: number; city: string }> = {
  // Brooklyn priority zips
  '11229': { lat: 40.5990, lng: -73.9445, city: 'Brooklyn' }, // Sheepshead Bay / Marine Park
  '11230': { lat: 40.6225, lng: -73.9626, city: 'Brooklyn' }, // Midwood / Flatbush
  '11218': { lat: 40.6432, lng: -73.9776, city: 'Brooklyn' }, // Kensington / Flatbush
  '11219': { lat: 40.6332, lng: -73.9925, city: 'Brooklyn' }, // Boro Park
  '11204': { lat: 40.6191, lng: -73.9852, city: 'Brooklyn' }, // Bensonhurst / Boro Park
  '11210': { lat: 40.6276, lng: -73.9498, city: 'Brooklyn' }, // Flatbush / Midwood
  '11223': { lat: 40.5985, lng: -73.9700, city: 'Brooklyn' }, // Gravesend
  '11234': { lat: 40.6182, lng: -73.9210, city: 'Brooklyn' }, // Mill Basin / Flatlands
  '11235': { lat: 40.5849, lng: -73.9460, city: 'Brooklyn' }, // Brighton Beach / Sheepshead Bay
  '11211': { lat: 40.7095, lng: -73.9571, city: 'Brooklyn' }, // Williamsburg
  '11213': { lat: 40.6688, lng: -73.9412, city: 'Brooklyn' }, // Crown Heights

  // Five Towns
  '11516': { lat: 40.6291, lng: -73.7332, city: 'Cedarhurst' },
  '11559': { lat: 40.6298, lng: -73.7193, city: 'Lawrence' },
  '11598': { lat: 40.6373, lng: -73.7115, city: 'Woodmere' },
  '11691': { lat: 40.6020, lng: -73.7560, city: 'Far Rockaway' },

  // Other priority
  '10977': { lat: 41.1170, lng: -74.0686, city: 'Spring Valley' }, // Monsey
  '08701': { lat: 40.0721, lng: -74.2179, city: 'Lakewood' },
  '10463': { lat: 40.8810, lng: -73.9091, city: 'Riverdale' }
};

export async function geocodeZip(zip: string): Promise<{ lat: number; lng: number } | null> {
  const fallback = ZIP_FALLBACK[zip];
  if (fallback) return { lat: fallback.lat, lng: fallback.lng };

  // TODO: call Google Geocoding API for unknown zips and cache the result
  return null;
}

/**
 * Reverse-geocode lat/lng to the nearest known zip in our fallback table.
 * Used when a user hits "📍 use my location" so the UI can honestly show
 * "X restaurants near 11230" instead of lying about the default zip.
 *
 * Returns null if no known zip is within `maxMiles` of the given point —
 * caller should fall back to a generic "your location" label in that case.
 */
export function findNearestZip(
  lat: number,
  lng: number,
  maxMiles = 15
): { zip: string; city: string; distanceMiles: number } | null {
  let best: { zip: string; city: string; distanceMiles: number } | null = null;
  for (const [zip, { lat: zLat, lng: zLng, city }] of Object.entries(ZIP_FALLBACK)) {
    const miles = haversineMiles(lat, lng, zLat, zLng);
    if (miles <= maxMiles && (!best || miles < best.distanceMiles)) {
      best = { zip, city, distanceMiles: miles };
    }
  }
  return best;
}

function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.8; // earth radius in miles
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}
