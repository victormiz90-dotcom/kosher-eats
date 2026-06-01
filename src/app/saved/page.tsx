import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { attachCardData } from '@/lib/restaurants';
import { RestaurantCard } from '@/components/RestaurantCard';
import type { RestaurantNearResult } from '@/types/database';

export const metadata = { title: 'Saved restaurants — KosherEats' };

export default async function SavedPage() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?next=/saved');
  }

  const { data } = await supabase
    .from('favorites')
    .select(
      'created_at, restaurant:restaurants(id, name, slug, address, city, zip, category, cholov_yisroel, pas_yisroel, hero_image_url)'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const saved: RestaurantNearResult[] = (data ?? [])
    .map((row: any) => {
      const r = Array.isArray(row.restaurant) ? row.restaurant[0] : row.restaurant;
      return r ? ({ ...r, distance_miles: 0 } as RestaurantNearResult) : null;
    })
    .filter((r: RestaurantNearResult | null): r is RestaurantNearResult => r !== null);

  const cards = await attachCardData(saved);

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <header className="mb-6">
        <h1 className="font-serif text-2xl font-semibold tracking-tight text-brand-900">
          Saved restaurants
        </h1>
        <p className="mt-1 text-sm text-brand-500">
          {cards.length} saved · always confirm current kashrus before ordering.
        </p>
      </header>

      {cards.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-sm text-brand-500 shadow-sm">
          You haven&apos;t saved any restaurants yet. Tap the heart on any listing to save it.{' '}
          <Link href="/" className="font-medium text-brand-900 underline-offset-2 hover:underline">
            Browse restaurants
          </Link>
        </p>
      ) : (
        <ul className="space-y-3">
          {cards.map((r) => (
            <li key={r.id}>
              <RestaurantCard restaurant={r} isAuthed initialFavorited showDistance={false} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
