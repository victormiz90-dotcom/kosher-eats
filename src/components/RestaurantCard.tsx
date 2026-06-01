import Link from 'next/link';
import { Check } from 'lucide-react';
import type { RestaurantNearResult } from '@/types/database';
import { FavoriteButton } from '@/components/FavoriteButton';

export function RestaurantCard({
  restaurant,
  initialFavorited = false,
  isAuthed = false,
  showDistance = true
}: {
  restaurant: RestaurantNearResult;
  initialFavorited?: boolean;
  isAuthed?: boolean;
  showDistance?: boolean;
}) {
  const cert = restaurant.primary_cert;
  const certLabel = cert ? cert.short ?? cert.name : null;

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/r/${restaurant.slug}`} className="flex gap-4 p-4 pr-14">
        <LogoAvatar
          name={restaurant.name}
          category={restaurant.category}
          src={restaurant.hero_image_url}
        />

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="truncate font-serif text-lg font-semibold leading-tight text-brand-900">
              {restaurant.name}
            </h3>
            {showDistance && (
              <span className="flex-shrink-0 text-xs font-medium text-brand-500">
                {restaurant.distance_miles.toFixed(1)} mi
              </span>
            )}
          </div>

          <p className="mt-0.5 truncate text-xs text-brand-500">
            {restaurant.address} · {restaurant.city}
          </p>

          {/* Hechsher — the loudest element. Green = we verified who certifies it. */}
          <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-verify-soft px-2 py-1">
            <span className="grid h-4 w-4 place-items-center rounded bg-verify text-white">
              <Check className="h-3 w-3" strokeWidth={3.5} />
            </span>
            <span className="text-xs font-semibold text-verify">
              {certLabel ?? 'Verified'}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <CategoryBadge category={restaurant.category} />
            {restaurant.cholov_yisroel && <Pill>Cholov Yisroel</Pill>}
            {restaurant.pas_yisroel && <Pill>Pas Yisroel</Pill>}
          </div>
        </div>
      </Link>

      {/* Heart sits on top of the link so tapping it saves instead of navigating. */}
      <div className="absolute right-3 top-3">
        <FavoriteButton
          restaurantId={restaurant.id}
          initialFavorited={initialFavorited}
          isAuthed={isAuthed}
        />
      </div>
    </div>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    meat: 'bg-[#f6e7e5] text-[#9b3b32]',
    dairy: 'bg-[#e4eef6] text-[#2c5d86]',
    pareve: 'bg-[#eaf0e1] text-[#5b7a3a]',
    mixed: 'bg-brand-50 text-brand-500'
  };
  return (
    <span
      className={`rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
        styles[category] ?? styles.mixed
      }`}
    >
      {category}
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-brand-100 px-2 py-0.5 text-[10px] font-medium text-brand-500">
      {children}
    </span>
  );
}

const AVATAR_BG: Record<string, string> = {
  meat: 'bg-[#9b3b32]',
  dairy: 'bg-[#2c5d86]',
  pareve: 'bg-[#5b7a3a]',
  mixed: 'bg-brand-700'
};

function LogoAvatar({
  name,
  category,
  src
}: {
  name: string;
  category: string;
  src: string | null;
}) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const bg = AVATAR_BG[category] ?? AVATAR_BG.mixed;

  return (
    <div className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl ${bg}`}>
      {/* Always-rendered letter fallback. If the img loads on top it covers this; if it fails, the letter remains. */}
      <div className="absolute inset-0 flex items-center justify-center font-serif text-3xl font-semibold text-white">
        {initial}
      </div>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" loading="lazy" className="relative h-full w-full object-cover" />
      )}
    </div>
  );
}
