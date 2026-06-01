import Link from 'next/link';
import { Check, Star } from 'lucide-react';
import type { RestaurantNearResult, DeliveryPlatform } from '@/types/database';
import { getPlatformLabel } from '@/lib/deep-link';
import { FavoriteButton } from '@/components/FavoriteButton';

const GRAD: Record<string, string> = {
  meat: 'from-[#6a3d3a] to-[#9b3b32]',
  dairy: 'from-[#1d3557] to-[#457b9d]',
  pareve: 'from-[#3a5a40] to-[#588157]',
  mixed: 'from-[#3d405b] to-[#5c6184]'
};

function orderBtnClass(platform: DeliveryPlatform): string {
  switch (platform) {
    case 'ubereats':
      return 'bg-[#06c167] text-white hover:brightness-95';
    case 'doordash':
      return 'border border-[#ef3340]/40 bg-white text-[#ef3340] hover:border-[#ef3340]';
    case 'grubhub':
    case 'seamless':
      return 'border border-[#e8730c]/40 bg-white text-[#e8730c] hover:border-[#e8730c]';
    default:
      return 'border border-brand-100 bg-white text-brand-700 hover:border-accent-500';
  }
}

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
  const links = restaurant.order_links ?? [];
  const grad = GRAD[restaurant.category] ?? GRAD.mixed;
  const initials =
    restaurant.name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('') || '?';

  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <Link href={`/r/${restaurant.slug}`} className="relative block h-36 overflow-hidden">
        {restaurant.hero_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.hero_image_url}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
          />
        ) : (
          <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${grad}`}>
            <span className="font-serif text-4xl font-semibold tracking-wide text-white/95">
              {initials}
            </span>
          </div>
        )}
        {restaurant.featured && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-md bg-accent-500 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow">
            <Star className="h-3 w-3" fill="currentColor" /> Featured
          </span>
        )}
        {showDistance && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-brand-700">
            {restaurant.distance_miles.toFixed(1)} mi
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/r/${restaurant.slug}`} className="min-w-0">
            <h3 className="truncate font-serif text-lg font-semibold leading-tight text-brand-900">
              {restaurant.name}
            </h3>
            <p className="mt-0.5 truncate text-xs text-brand-500">
              {restaurant.address} · {restaurant.city}
            </p>
          </Link>
          <FavoriteButton
            restaurantId={restaurant.id}
            initialFavorited={initialFavorited}
            isAuthed={isAuthed}
            className="flex-shrink-0"
          />
        </div>

        {/* Hechsher — the loudest element. Green = we verified who certifies it. */}
        <div className="inline-flex w-fit items-center gap-1.5 rounded-lg bg-verify-soft px-2 py-1">
          <span className="grid h-4 w-4 place-items-center rounded bg-verify text-white">
            <Check className="h-3 w-3" strokeWidth={3.5} />
          </span>
          <span className="text-xs font-semibold text-verify">{certLabel ?? 'Verified'}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <CategoryBadge category={restaurant.category} />
          {restaurant.cholov_yisroel && <Pill>Cholov Yisroel</Pill>}
          {restaurant.pas_yisroel && <Pill>Pas Yisroel</Pill>}
        </div>

        <div className="mt-auto pt-1">
          {links.length > 0 ? (
            <>
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-brand-500">
                Order now
              </p>
              <div className="flex gap-1.5">
                {links.map((l) => (
                  <a
                    key={l.id}
                    href={`/api/click?link=${l.id}`}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className={`flex-1 rounded-lg px-2 py-2 text-center text-xs font-bold transition ${orderBtnClass(
                      l.platform
                    )}`}
                  >
                    {getPlatformLabel(l.platform)}
                  </a>
                ))}
              </div>
            </>
          ) : (
            <Link
              href={`/r/${restaurant.slug}`}
              className="block rounded-lg border border-brand-100 px-3 py-2 text-center text-xs font-semibold text-brand-700 transition hover:border-accent-500"
            >
              View details →
            </Link>
          )}
          <p className="mt-2 flex items-center gap-1 text-[10px] text-brand-500">
            <span className="text-accent-500">ⓘ</span> Confirm current kashrus before ordering.
          </p>
        </div>
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
