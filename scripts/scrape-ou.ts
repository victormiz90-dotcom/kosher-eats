/**
 * scrape-ou.ts
 *
 * Pulls restaurant listings from the Orthodox Union's public restaurant
 * database (oukosher.org). Writes JSON output to ./scripts/output/ou-restaurants.json.
 *
 * Usage:
 *   pnpm scrape:ou
 *
 * Notes:
 * - The OU restaurant finder uses an internal JSON API; we hit it directly.
 *   If they change the endpoint, update OU_API below.
 * - Be respectful: throttle to 1 request/sec, identify yourself in User-Agent.
 * - This file is a STARTER TEMPLATE. You will likely need to inspect the OU
 *   site's network tab in Chrome DevTools to confirm current endpoint shapes.
 * - We do NOT commit anything we scrape — we just dump JSON for manual review,
 *   then you (or an admin) import vetted rows via the admin UI.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const OU_API = 'https://oukosher.org/wp-admin/admin-ajax.php';
const OUTPUT_DIR = join(process.cwd(), 'scripts', 'output');
const OUTPUT_FILE = join(OUTPUT_DIR, 'ou-restaurants.json');

const USER_AGENT = 'KosherEats-Bot/0.1 (research; contact: hello@koshereats.example)';

// Brooklyn-area zips we care about for the initial launch
const TARGET_ZIPS = [
  '11229', '11230', '11218', '11219', '11204', '11210',
  '11223', '11234', '11235', '11211', '11213'
];

interface OURestaurant {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  phone?: string;
  website?: string;
  category?: string;
  certification: string;
  source_url?: string;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchOuByZip(zip: string): Promise<OURestaurant[]> {
  // NOTE: This is illustrative. The real OU site uses a specific WP AJAX
  // action name + nonce. Inspect their network tab and fill these in.
  const body = new URLSearchParams({
    action: 'ou_restaurant_search',
    zip,
    radius: '5'
  });

  const res = await fetch(OU_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
      Accept: 'application/json'
    },
    body
  });

  if (!res.ok) {
    console.warn(`OU API returned ${res.status} for zip ${zip}`);
    return [];
  }

  const data = await res.json().catch(() => null);
  if (!data || !Array.isArray(data?.results)) return [];

  return data.results.map((r: any): OURestaurant => ({
    name: r.name ?? r.title ?? '',
    address: r.address ?? '',
    city: r.city ?? '',
    state: r.state ?? 'NY',
    zip: r.zip ?? zip,
    phone: r.phone,
    website: r.website,
    category: r.category,
    certification: 'OU',
    source_url: r.permalink
  }));
}

async function main() {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const all: OURestaurant[] = [];

  for (const zip of TARGET_ZIPS) {
    console.log(`Fetching OU restaurants near ${zip}...`);
    try {
      const batch = await fetchOuByZip(zip);
      console.log(`  → ${batch.length} results`);
      all.push(...batch);
    } catch (err) {
      console.error(`  ✗ failed for ${zip}:`, err);
    }
    await sleep(1200); // be polite
  }

  // Deduplicate by name + address
  const seen = new Set<string>();
  const unique = all.filter((r) => {
    const key = `${r.name}|${r.address}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  writeFileSync(OUTPUT_FILE, JSON.stringify(unique, null, 2));
  console.log(`\n✓ wrote ${unique.length} unique restaurants to ${OUTPUT_FILE}`);
  console.log('\nNext steps:');
  console.log('  1. Manually review the JSON file');
  console.log('  2. Verify each restaurant is still certified (call them if unsure)');
  console.log('  3. Use the admin import tool to load vetted rows into Supabase');
  console.log('  4. Enrich each row with Google Places (lat/lng, photos, hours)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
