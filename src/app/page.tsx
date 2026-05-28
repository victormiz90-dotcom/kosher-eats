import { findRestaurantsNear, geocodeZip } from '@/lib/restaurants';
import { RestaurantCard } from '@/components/RestaurantCard';
import { ZipSearchForm } from '@/components/ZipSearchForm';

interface PageProps {
  searchParams: { zip?: string; lat?: string; lng?: string; cy?: string; py?: string };
}

export default async function HomePage({ searchParams }: PageProps) {
  const zip = searchParams.zip ?? process.env.NEXT_PUBLIC_DEFAULT_ZIP ?? '11230';

  let coords: { lat: number; lng: number } | null = null;
  if (searchParams.lat && searchParams.lng) {
    coords = { lat: parseFloat(searchParams.lat), lng: parseFloat(searchParams.lng) };
  } else {
    coords = await geocodeZip(zip);
  }

  const restaurants = coords
    ? await findRestaurantsNear(coords.lat, coords.lng, {
        cholovYisroelOnly: searchParams.cy === '1',
        pasYisroelOnly: searchParams.py === '1',
        maxDistanceMiles: 10
      })
    : [];

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight text-brand-900">KosherEats</h1>
        <p className="mt-1 text-sm text-brand-700">
          Verified kosher restaurants. One tap to order on Uber Eats, DoorDash, or Grubhub.
        </p>
      </header>

      <ZipSearchForm defaultZip={zip} />

      <div className="mt-6 flex flex-wrap gap-2">
        <FilterChip label="Cholov Yisroel" param="cy" active={searchParams.cy === '1'} searchParams={searchParams} />
        <FilterChip label="Pas Yisroel" param="py" active={searchParams.py === '1'} searchParams={searchParams} />
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-brand-700">
          {restaurants.length} restaurant{restaurants.length === 1 ? '' : 's'} near {zip}
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
