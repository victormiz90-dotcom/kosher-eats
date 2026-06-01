import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { RestaurantForm, type RestaurantFormInitial } from '@/components/admin/RestaurantForm';

export const metadata = { title: 'Edit listing — KosherEats Admin' };

export default async function EditRestaurantPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { error?: string };
}) {
  const supabase = createClient();

  const [{ data: restaurant }, { data: certs }, { data: certRows }, { data: links }] =
    await Promise.all([
      supabase.from('restaurants').select('*').eq('id', params.id).single(),
      supabase
        .from('certifications')
        .select('id, agency_name, agency_short_name')
        .order('agency_name', { ascending: true }),
      supabase
        .from('restaurant_certifications')
        .select('certification_id, valid_through, certificate_url, certification:certifications(stringency_level)')
        .eq('restaurant_id', params.id),
      supabase
        .from('delivery_links')
        .select('platform, url')
        .eq('restaurant_id', params.id)
        .eq('active', true)
    ]);

  if (!restaurant) notFound();

  const certOptions = (certs ?? []).map((c: any) => ({
    id: c.id as string,
    label: c.agency_short_name ? `${c.agency_short_name} — ${c.agency_name}` : c.agency_name
  }));

  // Pick the most-stringent existing cert as the editable "primary".
  const primaryCert = (certRows ?? [])
    .map((rc: any) => ({
      certification_id: rc.certification_id as string,
      valid_through: (rc.valid_through as string | null) ?? '',
      certificate_url: (rc.certificate_url as string | null) ?? '',
      level: (Array.isArray(rc.certification) ? rc.certification[0] : rc.certification)?.stringency_level ?? 0
    }))
    .sort((a, b) => b.level - a.level)[0];

  const linkFor = (platform: string) =>
    (links ?? []).find((l: any) => l.platform === platform)?.url ?? '';

  const initial: RestaurantFormInitial = {
    id: restaurant.id,
    name: restaurant.name ?? '',
    slug: restaurant.slug ?? '',
    category: restaurant.category ?? 'meat',
    description: restaurant.description ?? '',
    address: restaurant.address ?? '',
    city: restaurant.city ?? 'Brooklyn',
    state: restaurant.state ?? 'NY',
    zip: restaurant.zip ?? '',
    lat: restaurant.lat != null ? String(restaurant.lat) : '',
    lng: restaurant.lng != null ? String(restaurant.lng) : '',
    shomer_shabbos: !!restaurant.shomer_shabbos,
    cholov_yisroel: !!restaurant.cholov_yisroel,
    pas_yisroel: !!restaurant.pas_yisroel,
    bishul_yisroel: !!restaurant.bishul_yisroel,
    certification_id: primaryCert?.certification_id ?? '',
    valid_through: primaryCert?.valid_through ?? '',
    certificate_url: primaryCert?.certificate_url ?? '',
    phone: restaurant.phone ?? '',
    website: restaurant.website ?? '',
    hero_image_url: restaurant.hero_image_url ?? '',
    cuisine_tags: (restaurant.cuisine_tags ?? []).join(', '),
    price_level: restaurant.price_level != null ? String(restaurant.price_level) : '',
    url_ubereats: linkFor('ubereats'),
    url_doordash: linkFor('doordash'),
    url_grubhub: linkFor('grubhub')
  };

  return (
    <div>
      <h1 className="mb-1 font-serif text-xl font-semibold text-brand-900">Edit listing</h1>
      <p className="mb-4 text-sm text-brand-500">
        Editing <strong>{restaurant.name}</strong> · status stays{' '}
        <strong>{restaurant.verification_status}</strong>.
      </p>

      {searchParams.error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          {searchParams.error}
        </p>
      )}

      <RestaurantForm certOptions={certOptions} initial={initial} />
    </div>
  );
}
