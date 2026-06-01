'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export interface ToggleFavoriteResult {
  ok: boolean;
  favorited: boolean;
  needsAuth?: boolean;
  error?: string;
}

/**
 * Toggle a restaurant in the signed-in user's favorites. RLS guarantees a user
 * can only ever touch their own rows, so we rely on auth.uid() server-side.
 */
export async function toggleFavorite(restaurantId: string): Promise<ToggleFavoriteResult> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, favorited: false, needsAuth: true };
  }

  // Is it already saved?
  const { data: existing } = await supabase
    .from('favorites')
    .select('restaurant_id')
    .eq('user_id', user.id)
    .eq('restaurant_id', restaurantId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('restaurant_id', restaurantId);
    if (error) return { ok: false, favorited: true, error: error.message };
    revalidatePath('/saved');
    return { ok: true, favorited: false };
  }

  const { error } = await supabase
    .from('favorites')
    .insert({ user_id: user.id, restaurant_id: restaurantId });
  if (error) return { ok: false, favorited: false, error: error.message };
  revalidatePath('/saved');
  return { ok: true, favorited: true };
}

/**
 * Return the set of restaurant IDs the current user has favorited.
 * Empty set when signed out. Call from server components to seed the UI.
 */
export async function getFavoritedIds(): Promise<Set<string>> {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  if (!user) return new Set();

  const { data } = await supabase
    .from('favorites')
    .select('restaurant_id')
    .eq('user_id', user.id);

  return new Set((data ?? []).map((r: { restaurant_id: string }) => r.restaurant_id));
}
