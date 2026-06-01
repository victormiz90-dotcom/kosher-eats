import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { verifyRestaurant } from '@/app/admin/actions';

export const metadata = { title: 'Verification queue — KosherEats Admin' };

export default async function QueuePage({
  searchParams
}: {
  searchParams: { added?: string; verified?: string; error?: string };
}) {
  const supabase = createClient();

  const { data: pending } = await supabase
    .from('restaurants')
    .select(
      'id, name, slug, address, city, zip, category, cholov_yisroel, pas_yisroel, created_at, restaurant_certifications(certification:certifications(agency_short_name, agency_name))'
    )
    .eq('verification_status', 'pending')
    .eq('active', true)
    .order('created_at', { ascending: false });

  const rows = pending ?? [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-serif text-xl font-semibold text-brand-900">Verification queue</h1>
        <p className="text-sm text-brand-700">
          {rows.length} pending. Confirm the hechsher against the agency&apos;s published list, then
          verify to make it live.
        </p>
      </div>

      {searchParams.added && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          Added “{searchParams.added}” to the queue.
        </p>
      )}
      {searchParams.verified && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
          Verified — it&apos;s now live in search.
        </p>
      )}
      {searchParams.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{searchParams.error}</p>
      )}

      {rows.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-sm text-brand-700 shadow-sm">
          Nothing pending. <Link href="/admin/restaurants/new" className="font-medium underline">Add a restaurant</Link>.
        </p>
      ) : (
        <ul className="space-y-3">
          {rows.map((r: any) => {
            const certs = (r.restaurant_certifications ?? [])
              .map((rc: any) => {
                const c = Array.isArray(rc.certification) ? rc.certification[0] : rc.certification;
                return c?.agency_short_name ?? c?.agency_name;
              })
              .filter(Boolean);

            return (
              <li key={r.id} className="rounded-lg bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-brand-900">{r.name}</h3>
                    <p className="text-xs text-brand-700">
                      {r.address} · {r.city} {r.zip}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-brand-700">
                      <span className="rounded bg-brand-50 px-1.5 py-0.5 uppercase">{r.category}</span>
                      {certs.length > 0 ? (
                        certs.map((c: string) => (
                          <span
                            key={c}
                            className="rounded bg-accent-400/20 px-1.5 py-0.5 font-medium text-accent-600"
                          >
                            {c}
                          </span>
                        ))
                      ) : (
                        <span className="rounded bg-red-100 px-1.5 py-0.5 font-medium text-red-800">
                          ⚠ No hechsher — add one before verifying
                        </span>
                      )}
                      {r.cholov_yisroel && <span>Cholov Yisroel</span>}
                      {r.pas_yisroel && <span>Pas Yisroel</span>}
                    </div>
                  </div>

                  <div className="flex flex-shrink-0 flex-col items-end gap-2">
                    <form action={verifyRestaurant}>
                      <input type="hidden" name="id" value={r.id} />
                      <button
                        type="submit"
                        disabled={certs.length === 0}
                        className="rounded-lg bg-brand-700 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-40"
                        title={certs.length === 0 ? 'Add a hechsher first' : 'Verify and publish'}
                      >
                        Verify
                      </button>
                    </form>
                    <Link href={`/admin/restaurants/${r.id}/edit`} className="text-xs text-brand-700 hover:underline">
                      Edit
                    </Link>
                    <Link href={`/r/${r.slug}`} className="text-xs text-brand-500 hover:underline">
                      Preview
                    </Link>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
