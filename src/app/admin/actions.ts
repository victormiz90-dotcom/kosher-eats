'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { KashrusCategory } from '@/types/database';

const CATEGORIES: KashrusCategory[] = ['meat', 'dairy', 'pareve', 'mixed'];

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Ensure the caller is a signed-in admin. Redirects otherwise. */
async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?next=/admin');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();
  if (profile?.role !== 'admin') redirect('/');

  return supabase;
}

export async function createRestaurant(formData: FormData) {
  const supabase = await requireAdmin();

  const get = (k: string) => String(formData.get(k) ?? '').trim();
  const checked = (k: string) => formData.get(k) === 'on';

  const name = get('name');
  if (!name) redirect('/admin/restaurants/new?error=Name is required');

  const slug = slugify(get('slug') || name);
  const rawCategory = get('category');
  const category: KashrusCategory = CATEGORIES.includes(rawCategory as KashrusCategory)
    ? (rawCategory as KashrusCategory)
    : 'pareve';

  const lat = parseFloat(get('lat'));
  const lng = parseFloat(get('lng'));
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    redirect('/admin/restaurants/new?error=Valid latitude and longitude are required');
  }

  const priceRaw = parseInt(get('price_level'), 10);
  const price_level = priceRaw >= 1 && priceRaw <= 4 ? priceRaw : null;

  const cuisine_tags = get('cuisine_tags')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  const { data: inserted, error: insertError } = await supabase
    .from('restaurants')
    .insert({
      slug,
      name,
      address: get('address'),
      city: get('city'),
      state: get('state') || 'NY',
      zip: get('zip'),
      lat,
      lng,
      phone: get('phone') || null,
      website: get('website') || null,
      description: get('description') || null,
      hero_image_url: get('hero_image_url') || null,
      category,
      cholov_yisroel: checked('cholov_yisroel'),
      pas_yisroel: checked('pas_yisroel'),
      bishul_yisroel: checked('bishul_yisroel'),
      shomer_shabbos: checked('shomer_shabbos'),
      cuisine_tags,
      price_level,
      // Never auto-verify. Everything lands in the queue for a human to confirm.
      verification_status: 'pending',
      active: true
    })
    .select('id')
    .single();

  if (insertError || !inserted) {
    const msg =
      insertError?.code === '23505'
        ? `A restaurant with slug "${slug}" already exists. Edit the slug and retry.`
        : insertError?.message ?? 'Could not create restaurant';
    redirect(`/admin/restaurants/new?error=${encodeURIComponent(msg)}`);
  }

  const restaurantId = inserted.id;

  // Hechsher — the defining field. Form requires an agency.
  const certId = get('certification_id');
  if (certId) {
    const { error: certError } = await supabase.from('restaurant_certifications').insert({
      restaurant_id: restaurantId,
      certification_id: certId,
      valid_through: get('valid_through') || null,
      certificate_url: get('certificate_url') || null
    });
    if (certError) {
      redirect(
        `/admin/queue?error=${encodeURIComponent(
          `Restaurant saved but the hechsher link failed: ${certError.message}. Add it before verifying.`
        )}`
      );
    }
  }

  // Delivery deep-links (optional). One row per platform that has a URL.
  const platforms: { platform: string; key: string }[] = [
    { platform: 'ubereats', key: 'url_ubereats' },
    { platform: 'doordash', key: 'url_doordash' },
    { platform: 'grubhub', key: 'url_grubhub' }
  ];
  const links = platforms
    .map((p) => ({ platform: p.platform, url: get(p.key) }))
    .filter((l) => l.url.length > 0)
    .map((l) => ({ restaurant_id: restaurantId, platform: l.platform, url: l.url }));

  if (links.length > 0) {
    await supabase.from('delivery_links').insert(links);
  }

  revalidatePath('/admin/queue');
  redirect(`/admin/queue?added=${encodeURIComponent(name)}`);
}

export async function verifyRestaurant(formData: FormData) {
  const supabase = await requireAdmin();
  const id = String(formData.get('id') ?? '');
  if (!id) redirect('/admin/queue?error=Missing restaurant id');

  const { error } = await supabase
    .from('restaurants')
    .update({ verification_status: 'verified', last_verified_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    redirect(`/admin/queue?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath('/admin/queue');
  revalidatePath('/');
  redirect('/admin/queue?verified=1');
}
