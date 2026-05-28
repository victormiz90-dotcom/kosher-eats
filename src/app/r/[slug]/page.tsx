import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRestaurantBySlug } from '@/lib/restaurants';
import { getPlatformLabel } from '@/lib/deep-link';
import type { DeliveryPlatform } from '@/types/database';

// Brand icons served from jsDelivr's simple-icons mirror (cdn.simpleicons.org
// doesn't carry Grubhub or Seamless). These SVGs render in default black, so we
// apply a Tailwind `invert` filter at the call site to turn them white for the
// dark brand-700 button background. Seamless is owned by Grubhub and shares
// branding, so we reuse the grubhub icon.
const PLATFORM_ICON_URL: Partial<Record<DeliveryPlatform, string>> = {
  ubereats: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/ubereats.svg',
  doordash: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/doordash.svg',
  grubhub:  'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/grubhub.svg',
  seamless: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/grubhub.svg'
};

interface PageProps {
  params: { slug: string };
}

export default async function RestaurantPage({ params }: PageProps) {
  const restaurant = await getRestaurantBySlug(params.slug);
  if (!restaurant) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Link href="/" className="mb-4 inline-block text-sm text-brand-700 hover:text-brand-900">
        ← Back to results
      </Link>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        {restaurant.hero_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={restaurant.hero_image_url}
            alt={restaurant.name}
            className="h-48 w-full object-cover"
          />
        )}

        <div className="p-6">
          <h1 className="text-2xl font-bold text-brand-900">{restaurant.name}</h1>
          <p className="mt-1 text-sm text-brand-700">
            {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip}
          </p>

          {/* Kashrus badges */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded bg-brand-700 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {restaurant.category}
            </span>
            {restaurant.cholov_yisroel && <Badge>Cholov Yisroel</Badge>}
            {restaurant.pas_yisroel && <Badge>Pas Yisroel</Badge>}
            {restaurant.bishul_yisroel && <Badge>Bishul Yisroel</Badge>}
            {restaurant.shomer_shabbos && <Badge>Shomer Shabbos</Badge>}
          </div>

          {/* Hechsher list */}
          {restaurant.certifications.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
                Hechsher
              </h2>
              <ul className="flex flex-wrap gap-2">
                {restaurant.certifications.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-md border border-accent-500/30 bg-accent-400/10 px-3 py-2 text-sm font-medium text-accent-600"
                  >
                    {c.agency_short_name ?? c.agency_name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {restaurant.description && (
            <p className="mt-6 text-sm leading-relaxed text-brand-900">{restaurant.description}</p>
          )}

          {/* Order buttons */}
          {restaurant.delivery_links.length > 0 && (
            <section className="mt-6 space-y-2">
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
                Order
              </h2>
              {restaurant.delivery_links.map((link) => {
                const iconUrl = PLATFORM_ICON_URL[link.platform];
                return (
                  <a
                    key={link.id}
                    href={`/api/click?link=${link.id}`}
                    rel="nofollow noopener"
                    className="flex w-full items-center justify-between rounded-lg bg-brand-700 px-4 py-3 text-white transition hover:bg-brand-900"
                  >
                    <span className="flex items-center gap-3 font-medium">
                      {iconUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={iconUrl}
                          alt=""
                          width={20}
                          height={20}
                          className="h-5 w-5 invert"
                        />
                      )}
                      Order on {getPlatformLabel(link.platform)}
                    </span>
                    <span aria-hidden>→</span>
                  </a>
                );
              })}
            </section>
          )}

          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              className="mt-2 flex w-full items-center justify-center rounded-lg border border-brand-100 bg-white px-4 py-3 text-sm font-medium text-brand-700 hover:border-brand-500"
            >
              📞 {restaurant.phone}
            </a>
          )}
        </div>
      </div>

      <p className="mt-4 px-2 text-xs text-brand-700">
        Verify current kashrus status before ordering. Hechshers change. KosherEats is an
        independent directory and is not a kashrus agency.
      </p>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded bg-accent-400/20 px-2 py-1 text-xs font-medium text-accent-600">
      {children}
    </span>
  );
}
