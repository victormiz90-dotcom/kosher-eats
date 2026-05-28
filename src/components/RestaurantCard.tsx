import Link from 'next/link';
import type { RestaurantNearResult } from '@/types/database';

export function RestaurantCard({ restaurant }: { restaurant: RestaurantNearResult }) {
  return (
    <Link
      href={`/r/${restaurant.slug}`}
      className="flex items-center gap-4 rounded-lg bg-white p-4 shadow-sm transition hover:shadow-md"
    >
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-brand-100">
        {restaurant.hero_image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.hero_image_url}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl text-brand-500">
            🍽️
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="truncate font-semibold text-brand-900">{restaurant.name}</h3>
        <p className="truncate text-xs text-brand-700">
          {restaurant.address} · {restaurant.city}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
          <CategoryBadge category={restaurant.category} />
          {restaurant.cholov_yisroel && <Pill>Cholov Yisroel</Pill>}
          {restaurant.pas_yisroel && <Pill>Pas Yisroel</Pill>}
        </div>
      </div>

      <div className="flex-shrink-0 text-right">
        <span className="text-xs font-medium text-brand-700">
          {restaurant.distance_miles.toFixed(1)} mi
        </span>
      </div>
    </Link>
  );
}

function CategoryBadge({ category }: { category: string }) {
  const styles: Record<string, string> = {
    meat: 'bg-red-100 text-red-800',
    dairy: 'bg-blue-100 text-blue-800',
    pareve: 'bg-green-100 text-green-800',
    mixed: 'bg-gray-100 text-gray-800'
  };
  return (
    <span
      className={`rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ${
        styles[category] ?? styles.mixed
      }`}
    >
      {category}
    </span>
  );
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-accent-400/20 px-1.5 py-0.5 text-[10px] font-medium text-accent-600">
      {children}
    </span>
  );
}
