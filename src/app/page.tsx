import { findRestaurantsNear, findNearestZip, geocodeZip, getCertOptions } from '@/lib/restaurants';
import { RestaurantCard } from '@/components/RestaurantCard';
import { ZipSearchForm } from '@/components/ZipSearchForm';
import { FilterBar } from '@/components/FilterBar';

interface PageProps {
  searchParams: {
    zip?: string;
    lat?: string;
    lng?: string;
    cy?: string;
    py?: string;
    cat?: string;
    cert?: string;
    radius?: string;
    page?: string;
  };
}

const PAGE_SIZE = 25;
const VALID_RADII = new Set([5, 10, 20, 50]);
const VALID_CATEGORIES = new Set(['meat', 'dairy', 'pareve', 'mixed']);

export default async function HomePage({ searchParams }: PageProps) {
  const defaultZip = process.env.NEXT_PUBLIC_DEFAULT_ZIP ?? '11230';

  let coords: { lat: number; lng: number } | null = null;
  let zip = searchParams.zip ?? defaultZip;
  let locationLabel = `near ${zip}`;
  let usingGeolocation = false;

  if (searchParams.lat && searchParams.lng) {
    // User hit "use my location" — derive nearest known zip for honest UX.
    coords = { lat: parseFloat(searchParams.lat), lng: parseFloat(searchParams.lng) };
    usingGeolocation = true;
    const nearest = findNearestZip(coords.lat, coords.lng);
    if (nearest) {
      zip = nearest.zip;
      locationLabel = `near you (${nearest.city} ${nearest.zip})`;
    } else {
      // Outside our coverage map; don't pretend a zip we don't know
      zip = '';
      locationLabel = 'near your location';
    }
  } else {
    coords = await geocodeZip(zip);
  }

  // Parse filter URL params (whitelist values so the UI stays honest)
  const parsedRadius = parseInt(searchParams.radius ?? '10', 10);
  const radius = VALID_RADII.has(parsedRadius) ? parsedRadius : 10;
  const category = VALID_CATEGORIES.has(searchParams.cat ?? '')
    ? (searchParams.cat as 'meat' | 'dairy' | 'pareve' | 'mixed')
    : undefined;
  const certSlug = searchParams.cert && searchParams.cert.length > 0 ? searchParams.cert : undefined;

  const [allRestaurants, certOptions] = await Promise.all([
    coords
      ? findRestaurantsNear(coords.lat, coords.lng, {
          cholovYisroelOnly: searchParams.cy === '1',
          pasYisroelOnly: searchParams.py === '1',
          category,
          certSlugs: certSlug ? [certSlug] : undefined,
          maxDistanceMiles: radius
        })
      : Promise.resolve([]),
    getCertOptions()
  ]);

  // Pagination
  const totalCount = allRestaurants.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const requestedPage = parseInt(searchParams.page ?? '1', 10);
  const currentPage = Math.min(Math.max(1, isNaN(requestedPage) ? 1 : requestedPage), totalPages);
  const startIdx = (currentPage - 1) * PAGE_SIZE;
  const restaurants = allRestaurants.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-brand-900">KosherEats</h1>
        <p className="mt-1 text-sm text-brand-700">
          Verified kosher restaurants. One tap to order on Uber Eats, DoorDash, or Grubhub.
        </p>
      </header>

      <ZipSearchForm defaultZip={zip} />

      {usingGeolocation && (
        <p className="mt-2 text-xs text-brand-700">
          📍 Showing results {locationLabel}.
        </p>
      )}

      <FilterBar certOptions={certOptions} />

      <div className="mt-3 flex flex-wrap gap-2">
        <FilterChip label="Cholov Yisroel" param="cy" active={searchParams.cy === '1'} searchParams={searchParams} />
        <FilterChip label="Pas Yisroel" param="py" active={searchParams.py === '1'} searchParams={searchParams} />
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-brand-700">
          {totalCount} restaurant{totalCount === 1 ? '' : 's'} {locationLabel}
          {totalPages > 1 && (
            <span className="ml-2 normal-case text-brand-500">
              · page {currentPage} of {totalPages}
            </span>
          )}
        </h2>

        {!coords && (
          <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-900">
            We don&apos;t recognize that zip yet. We&apos;re launching neighborhood by neighborhood — try{' '}
            <strong>11230</strong> (Midwood/Flatbush) or <strong>11219</strong> (Boro Park).
          </div>
        )}

        <ul className="space-y-3">
          {restaurants.map((r) => (
            <li key={r.id}>
              <RestaurantCard restaurant={r} />
            </li>
          ))}
        </ul>

        {coords && restaurants.length === 0 && (
          <p className="rounded-lg bg-white p-6 text-center text-sm text-brand-700 shadow-sm">
            No verified restaurants in this area yet. We&apos;re actively expanding — check back soon.
          </p>
        )}

        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            searchParams={searchParams}
          />
        )}
      </section>

      <footer className="mt-12 border-t border-brand-100 pt-6 text-xs text-brand-700">
        <p>
          KosherEats is an independent directory. Always verify current kashrus status with the
          establishment before ordering. We are not a kashrus agency.
        </p>
      </footer>
    </main>
  );
}

function FilterChip({
  label,
  param,
  active,
  searchParams
}: {
  label: string;
  param: string;
  active: boolean;
  searchParams: Record<string, string | undefined>;
}) {
  const next = new URLSearchParams();
  Object.entries(searchParams).forEach(([k, v]) => {
    if (v) next.set(k, v);
  });
  // Filter changes reset paging to 1
  next.delete('page');
  if (active) {
    next.delete(param);
  } else {
    next.set(param, '1');
  }

  return (
    <a
      href={`/?${next.toString()}`}
      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
        active
          ? 'border-accent-500 bg-accent-500 text-white'
          : 'border-brand-100 bg-white text-brand-700 hover:border-brand-500'
      }`}
    >
      {label}
    </a>
  );
}

function Pagination({
  currentPage,
  totalPages,
  searchParams
}: {
  currentPage: number;
  totalPages: number;
  searchParams: Record<string, string | undefined>;
}) {
  function urlForPage(p: number) {
    const next = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => {
      if (v && k !== 'page') next.set(k, v);
    });
    if (p > 1) next.set('page', String(p));
    return `/?${next.toString()}`;
  }

  const prevDisabled = currentPage <= 1;
  const nextDisabled = currentPage >= totalPages;

  // Build a compact page-number window: 1, ..., curr-1, curr, curr+1, ..., total
  const pages: (number | 'ellipsis')[] = [];
  const window = 1;
  const add = (n: number) => {
    if (!pages.includes(n) && n >= 1 && n <= totalPages) pages.push(n);
  };
  add(1);
  if (currentPage - window > 2) pages.push('ellipsis');
  for (let i = currentPage - window; i <= currentPage + window; i++) add(i);
  if (currentPage + window < totalPages - 1) pages.push('ellipsis');
  add(totalPages);

  return (
    <nav
      aria-label="Pagination"
      className="mt-6 flex items-center justify-center gap-2 text-sm"
    >
      {prevDisabled ? (
        <span className="cursor-not-allowed rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-500">
          ← Prev
        </span>
      ) : (
        <a
          href={urlForPage(currentPage - 1)}
          className="rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-700 hover:border-brand-500"
        >
          ← Prev
        </a>
      )}

      {pages.map((p, idx) =>
        p === 'ellipsis' ? (
          <span key={`e-${idx}`} className="px-2 text-brand-500">
            …
          </span>
        ) : p === currentPage ? (
          <span
            key={p}
            aria-current="page"
            className="rounded-md bg-brand-700 px-3 py-2 font-medium text-white"
          >
            {p}
          </span>
        ) : (
          <a
            key={p}
            href={urlForPage(p)}
            className="rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-700 hover:border-brand-500"
          >
            {p}
          </a>
        )
      )}

      {nextDisabled ? (
        <span className="cursor-not-allowed rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-500">
          Next →
        </span>
      ) : (
        <a
          href={urlForPage(currentPage + 1)}
          className="rounded-md border border-brand-100 bg-white px-3 py-2 text-brand-700 hover:border-brand-500"
        >
          Next →
        </a>
      )}
    </nav>
  );
}
