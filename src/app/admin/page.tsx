import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = { title: 'Admin — KosherEats' };

export default async function AdminDashboard() {
  const supabase = createClient();

  const [{ count: pending }, { count: verified }] = await Promise.all([
    supabase
      .from('restaurants')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'pending'),
    supabase
      .from('restaurants')
      .select('id', { count: 'exact', head: true })
      .eq('verification_status', 'verified')
  ]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl bg-white p-4 shadow-sm">
          <p className="text-3xl font-bold text-brand-900">{verified ?? 0}</p>
          <p className="text-sm text-brand-700">Verified &amp; live</p>
        </div>
        <Link
          href="/admin/queue"
          className="rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
        >
          <p className="text-3xl font-bold text-accent-600">{pending ?? 0}</p>
          <p className="text-sm text-brand-700">Pending verification →</p>
        </Link>
      </div>

      <Link
        href="/admin/restaurants/new"
        className="block rounded-xl bg-brand-700 p-4 text-center font-medium text-white transition hover:bg-brand-900"
      >
        + Add a restaurant
      </Link>

      <p className="text-xs text-brand-700">
        New restaurants land in the queue as <strong>pending</strong>. Cross-check the hechsher
        against the agency&apos;s published list before verifying — a wrong cert is the one mistake
        that breaks trust.
      </p>
    </div>
  );
}
