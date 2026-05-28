/**
 * enrich-google-places.ts
 *
 * Takes a JSON file of restaurants (name + address + zip) and enriches each
 * one with Google Places data: lat/lng, place_id, photos, hours, phone.
 *
 * Usage:
 *   GOOGLE_PLACES_API_KEY=... pnpm enrich:places -- scripts/output/ou-restaurants.json
 *
 * Output: writes alongside input with .enriched.json suffix.
 */

import { readFileSync, writeFileSync } from 'node:fs';

const API_KEY = process.env.GOOGLE_PLACES_API_KEY;
if (!API_KEY) {
  console.error('Set GOOGLE_PLACES_API_KEY in your environment');
  process.exit(1);
}

const inputFile = process.argv[2];
if (!inputFile) {
  console.error('Usage: tsx scripts/enrich-google-places.ts <input.json>');
  process.exit(1);
}

const outputFile = inputFile.replace(/\.json$/, '.enriched.json');

interface RawRestaurant {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  [key: string]: any;
}

interface EnrichedRestaurant extends RawRestaurant {
  google_place_id?: string;
  lat?: number;
  lng?: number;
  google_phone?: string;
  google_website?: string;
  google_hours?: Record<string, { open: string; close: string } | null>;
  google_photos?: string[];
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function findPlace(name: string, address: string): Promise<string | null> {
  const query = `${name} ${address}`;
  const url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(
    query
  )}&inputtype=textquery&fields=place_id&key=${API_KEY}`;

  const res = await fetch(url);
  const data = await res.json();
  return data?.candidates?.[0]?.place_id ?? null;
}

async function fetchPlaceDetails(placeId: string) {
  const fields = [
    'geometry/location',
    'formatted_phone_number',
    'website',
    'opening_hours',
    'photos'
  ].join(',');

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=${fields}&key=${API_KEY}`;
  const res = await fetch(url);
  const data = await res.json();
  return data?.result;
}

function parseHours(openingHours: any): Record<string, { open: string; close: string } | null> {
  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  const result: Record<string, { open: string; close: string } | null> = {};
  days.forEach((d) => (result[d] = null));

  if (!openingHours?.periods) return result;

  for (const period of openingHours.periods) {
    if (!period.open) continue;
    const dayKey = days[period.open.day];
    result[dayKey] = {
      open: `${period.open.time.slice(0, 2)}:${period.open.time.slice(2)}`,
      close: period.close ? `${period.close.time.slice(0, 2)}:${period.close.time.slice(2)}` : '23:59'
    };
  }
  return result;
}

async function main() {
  const restaurants: RawRestaurant[] = JSON.parse(readFileSync(inputFile, 'utf-8'));
  console.log(`Enriching ${restaurants.length} restaurants...`);

  const enriched: EnrichedRestaurant[] = [];

  for (const r of restaurants) {
    process.stdout.write(`${r.name} … `);
    try {
      const placeId = await findPlace(r.name, r.address);
      if (!placeId) {
        console.log('not found');
        enriched.push(r);
        continue;
      }

      const details = await fetchPlaceDetails(placeId);
      enriched.push({
        ...r,
        google_place_id: placeId,
        lat: details?.geometry?.location?.lat,
        lng: details?.geometry?.location?.lng,
        google_phone: details?.formatted_phone_number,
        google_website: details?.website,
        google_hours: parseHours(details?.opening_hours),
        google_photos: details?.photos?.slice(0, 3).map((p: any) => p.photo_reference)
      });
      console.log('✓');
    } catch (err) {
      console.log('error:', err);
      enriched.push(r);
    }
    await sleep(200); // stay under quota
  }

  writeFileSync(outputFile, JSON.stringify(enriched, null, 2));
  console.log(`\nWrote ${enriched.length} enriched rows to ${outputFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
