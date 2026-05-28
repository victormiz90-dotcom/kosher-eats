# KosherEats

The trusted directory of certified kosher restaurants with one-tap deep-link
ordering through Uber Eats, DoorDash, and Grubhub. Filter by hechsher, cholov
yisroel, pas yisroel, and more.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind
- **Backend:** Supabase (Postgres + PostGIS + Auth)
- **Hosting:** Netlify
- **Maps:** Google Maps + Places API

## Quick Start

```bash
# 1. Install deps (use pnpm, npm, or yarn — your call)
npm install

# 2. Set up Supabase project
#    - Create a project at supabase.com
#    - In the SQL editor, run the migration files IN ORDER:
#      supabase/migrations/0001_initial_schema.sql
#      supabase/migrations/0002_seed_certifications.sql
#      supabase/migrations/0003_seed_sample_restaurants.sql

# 3. Copy env template and fill in values
cp .env.example .env.local

# 4. Run dev server
npm run dev
```

Visit `http://localhost:3000` and try zip `11230`.

## Project Structure

```
kosher-eats/
├── supabase/
│   └── migrations/        # SQL migrations (run in numeric order)
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── page.tsx       # Landing + search
│   │   ├── r/[slug]/      # Restaurant detail
│   │   └── api/click/     # Click-tracking + deep link redirect
│   ├── components/        # UI components
│   ├── lib/
│   │   ├── supabase/      # DB clients (browser + server)
│   │   ├── restaurants.ts # Search + lookup helpers
│   │   └── deep-link.ts   # Affiliate URL builder
│   └── types/             # TS type definitions
├── scripts/
│   ├── scrape-ou.ts       # OU restaurant directory scraper
│   └── enrich-google-places.ts  # Add lat/lng/hours/photos
└── docs/
    └── data-curation.md   # How to build the restaurant catalog
```

## The Three Things That Actually Matter

1. **Restaurant data quality.** The code is the easy part. The moat is a
   manually curated, hechsher-verified catalog. Plan to spend more time on
   data than on code.

2. **Click tracking.** Every "Order on Uber Eats" tap goes through
   `/api/click?link=...` so we (a) attribute affiliate revenue and (b) build
   the click-volume data we can later sell to restaurants as sponsored
   placement.

3. **Trust UX.** Always show the hechsher prominently. Always show a
   "verify before ordering" disclaimer. Never let an expired cert ship to
   production.

## Affiliate Program Setup

- **Uber Eats:** Apply via [Impact](https://impact.com) — search for "Uber"
- **DoorDash:** Apply via [Impact](https://impact.com)
- **Grubhub/Seamless:** Apply via [CJ Affiliate](https://cj.com)

All three are CPA programs (paid on net-new customers). For audiences that
already use these platforms, focus on Path B monetization (restaurant-paid
listings, sponsored placements, vertical advertising).

## Roadmap

- [x] Schema + PostGIS search
- [x] Landing page with zip search + filters
- [x] Restaurant detail page with deep-link order buttons
- [x] Click tracking
- [ ] Admin panel for restaurant CRUD
- [ ] User auth + favorites
- [ ] Hechsher filter
- [ ] Map view
- [ ] Scrapers for Kof-K, Star-K, CRC, VHQ, Kehilah
- [ ] PWA manifest + install prompt
- [ ] Multi-region expansion (Five Towns, Monsey, Lakewood, Queens)

## Disclaimer

KosherEats is an independent directory and is not a kashrus certification
agency. Users must verify the current kashrus status of any establishment
directly before ordering. Hechshers change.
