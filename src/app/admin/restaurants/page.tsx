import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'All listings — KosherEats Admin' };

export default async function AdminRestaurantsPage({
  searchParams
}: {
  searchParams: { q?: string; updated?: string; error?: string };
}) {
  const supabase = createClient();
  const q = (searchParams.q ?? '').trim();

  let query = supabase
    .from('restaurants')
    .select(
      'id, name, slug, zip, verification_status, restaurant_certifications(certification:certifications(agency_short_name, agency_name))'
    )
    .eq('active', true)
    .order('name', { ascending: true })
    .limit(100);

  if (q) {
    const escaped = q.replace(/[%_\\]/g, (m) => '\\' + m);
    query = query.ilike('name', `%${escaped}%`);
  }

  const { data } = await query;
  const rows = data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-serif text-xl font-semibold text-brand-900">All listings</h1>
        <Link
          href="/admin/restaurants/new"
          className="rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-900"
        >
          + Add
        </Link>
      </div>

      {searchParams.updated && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          Saved changes to “{searchParams.updated}”.
        </p>
      )}
      {searchParams.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{searchParams.error}</p>
      )}

      <form className="flex gap-2">
        <input
          name="q"
          defaultValue={q}
          placeholder="Search listings by name…"
          className="flex-1 rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm text-brand-900 placeholder:text-brand-500 focus:border-accent-500 focus:outline-none"
        />
        <button className="rounded-lg border border-brand-100 bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:border-accent-500">
          Search
        </button>
      </form>

      <p className="text-xs text-brand-500">
        {rows.length}
        {rows.length === 100 ? '+' : ''} shown{q ? ` for “${q}”` : ''}. Showing up to 100 — search to
        narrow.
      </p>

      <ul className="divide-y divide-brand-100 overflow-hidden rounded-xl bg-white shadow-sm">
        {rows.map((r: any) => {
          const cert = (r.restaurant_certifications ?? [])
            .map((rc: any) => {
              const c = Array.isArray(rc.certification) ? rc.certification[0] : rc.certification;
              return c?.agency_short_name ?? c?.agency_name;
            })
            .filter(Boolean)[0];

          return (
            <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <p className="truncate font-medium text-brand-900">{r.name}</p>
                <p className="flex items-center gap-2 text-xs text-brand-500">
                  <span>{r.zip}</span>
                  {cert && <span className="text-verify">{cert}</span>}
                  <StatusBadge status={r.verification_status} />
                </p>
              </div>
              <Link
                href={`/admin/restaurants/${r.id}/edit`}
                className="flex-shrink-0 rounded-lg border border-brand-100 px-3 py-1.5 text-sm font-medium text-brand-700 hover:border-accent-500"
              >
                Edit
              </Link>
            </li>
          );
        })}
        {rows.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-brand-500">No listings match.</li>
        )}
      </ul>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    verified: 'bg-verify-soft text-verify',
    pending: 'bg-accent-400/20 text-accent-600',
    expired: 'bg-red-100 text-red-800',
    unverified: 'bg-brand-50 text-brand-500'
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${map[status] ?? map.unverified}`}>
      {status}
    </span>
  );
}
