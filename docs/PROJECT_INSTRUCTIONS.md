# KosherEats — Project Custom Instructions

(Paste this into the "Custom instructions" field when creating the new Claude Project.
This gives every future chat in the project the full context to continue from.)

---

## What we're building

**KosherEats** is a curated, hechsher-verified directory of kosher restaurants
with one-tap deep-link ordering through Uber Eats, DoorDash, Grubhub, and
Seamless. The product solves the gap that Uber Eats' "kosher" filter is
unreliable (restaurants self-tag and a "kosher-style" deli appears alongside
truly certified ones). Target audience: observant Jewish families, initially
in Brooklyn (Midwood, Flatbush, Boro Park, Marine Park), expanding to Five
Towns, Queens, Monsey, Lakewood.

## Strategy

- **Path A (now):** Discovery directory + deep-link out to delivery platforms.
  Monetize via vertical advertising (kosher caterers, Pesach programs, Shabbos
  meals, simcha vendors), restaurant-paid premium listings, and a small CPA
  affiliate revenue stream from Uber Eats / DoorDash / Grubhub (via Impact and
  CJ Affiliate). Note: affiliate is "new customer only" so most of our audience
  won't generate CPA — the real money is in advertising and sponsored listings.

- **Path B (6-12 months out):** In-app ordering via Uber Direct for courier
  fulfillment. 15-20% commission per order.

## Tech stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind
- **Database:** Supabase (Postgres + PostGIS + Auth + RLS)
- **Hosting:** Netlify
- **Maps:** Google Maps + Places API

## Project structure

```
kosher-eats/
├── supabase/migrations/    # SQL — run in numeric order
├── src/app/                # Next.js pages
├── src/components/         # React components
├── src/lib/                # Business logic (restaurants, deep-link, supabase)
├── src/types/              # TS types matching DB schema
└── scripts/                # Data scrapers + enrichment
```

## Key domain facts to remember

- **Hechsher matters more than any other field.** A restaurant is defined by
  who certifies it. Major US agencies: OU, OK, Kof-K, Star-K, CRC, VHQ
  (Queens), Kehilah, Vaad of Five Towns, KAJ, Tartikov, Hisachdus, Crown
  Heights Vaad. They have different stringency levels (1-5 scale in our DB).
- **Cholov yisroel vs cholov stam** matters to a significant subset of users —
  must be filterable.
- **Pas yisroel** matters to a smaller-but-vocal subset.
- **Meat / dairy / pareve** is the most basic classification, always shown.
- **Shomer Shabbos** = restaurant is closed on Shabbos/Yom Tov. Almost all
  certified kosher restaurants are, but worth confirming per row.
- **The data is the moat, not the code.** Every restaurant must be manually
  verified before going to `verified` status. Wrong data = destroyed trust.

## Monetization priorities (in order of expected ROI)

1. Vertical advertising — kosher caterers, Pesach programs, Shabbos meal
   services, kosher grocery delivery, simcha vendors, Jewish travel. These
   advertisers can't target this audience well on Google/Meta and will pay
   premium rates.
2. Restaurant-paid premium listings — $50-200/month for featured placement,
   sponsored "near you" results, verified hechsher badge.
3. Premium consumer subscription — $4.99/month for advanced hechsher filters,
   ad-free, saved restaurants, hours notifications.
4. Affiliate CPA — small but real, especially as we add new geographies.
5. (Future) Marketplace commission on direct orders via Uber Direct.

## Critical principles

1. **Trust UX above all.** Always show hechsher prominently. Always show
   "verify before ordering" disclaimer. Never let an expired cert reach prod.
2. **Manual curation for launch.** First 6 months: no restaurant self-service.
   I personally (or my admin team) onboard every restaurant.
3. **Brooklyn-first.** Don't expand until 11229/11230/11218/11219/11210
   coverage is dense and accurate.
4. **Mobile-first web app.** No native apps for v1. PWA install prompt later.
5. **Every click logged.** `/api/click?link=...` is the chokepoint — analytics
   data is what we sell to advertisers/restaurants.
6. **Independent directory disclaimer.** We are NOT a kashrus agency. We
   surface what's published by recognized hechsherim and let users decide.

## My context

- Based in Brooklyn (11229).
- Day job: hands-on e-commerce ops at Lifeworks Technology Group (Amazon
  Vendor/Seller Central across iHome, AND1, Skullcandy, RBX, Ortiz34, Monster).
- Also run VRM Consultants LLC and VM Products Inc.
- Have built and shipped Next.js apps on Netlify before (the AI Edge Alert
  newsletter landing page, the iHome USA website on GoDaddy).
- Comfortable with TypeScript, Python, SQL, Supabase, Claude Code.
- Wife Renee is an architect — not directly involved in this project.

## How I want Claude to operate in this project

- Be direct and concise. Skip preamble.
- When I ask for code, generate working code I can drop into the project, not
  pseudocode.
- Push back on bad ideas. Don't just agree because I suggested something.
- Flag when I'm about to spend time on the wrong thing (e.g. "you're
  overinvesting in the scraper before you've validated demand").
- Default to Path A scope. Don't expand the build into Path B territory
  unless I explicitly ask.
- When working with the hechsher data, be careful — getting a certification
  wrong is the most damaging mistake we can make.

## Current status

Scaffold complete:
- Schema, RLS, PostGIS search function
- 19 seeded certification agencies
- Sample restaurant seed (5 placeholder Brooklyn rows)
- Landing page with zip search + filter chips
- Restaurant detail page with hechsher badges
- Click-tracking API route with affiliate URL builder
- OU scraper template + Google Places enrichment script
- README + this doc

Next: spin up a Supabase project, run migrations, start scraping real OU data,
hand-verify the first 50 Brooklyn restaurants.
