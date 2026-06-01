import { createClient } from '@/lib/supabase/server';
import { RestaurantForm } from '@/components/admin/RestaurantForm';

export const metadata = { title: 'Add restaurant — KosherEats Admin' };

export default async function NewRestaurantPage({
  searchParams
}: {
  searchParams: { error?: string };
}) {
  const supabase = createClient();
  const { data: certs } = await supabase
    .from('certifications')
    .select('id, agency_name, agency_short_name')
    .order('agency_name', { ascending: true });

  const certOptions = (certs ?? []).map((c: any) => ({
    id: c.id as string,
    label: c.agency_short_name ? `${c.agency_short_name} — ${c.agency_name}` : c.agency_name
  }));

  return (
    <div>
      <h1 className="mb-1 font-serif text-xl font-semibold text-brand-900">Add a restaurant</h1>
      <p className="mb-4 text-sm text-brand-700">
        Saves as <strong>pending</strong>. It won&apos;t appear in search until you verify it.
      </p>

      {searchParams.error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {searchParams.error}
        </p>
      )}

      <RestaurantForm certOptions={certOptions} />
    </div>
  );
}
