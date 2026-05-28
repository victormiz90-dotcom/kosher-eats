import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getRestaurantBySlug } from '@/lib/restaurants';
import { getPlatformLabel } from '@/lib/deep-link';
import type { DeliveryPlatform } from '@/types/database';

// Brand icons. UE + DD come from jsDelivr's simple-icons mirror (monochrome
// SVGs that need inverting to render white on the dark button). Grubhub +
// Seamless are vendored full-color brand logos in /public/icons/ so we
// control hosting and they can't break from external CDN changes.
type PlatformIcon = { url: string; invert: boolean };
const PLATFORM_ICONS: Partial<Record<DeliveryPlatform, PlatformIcon>> = {
  ubereats: {
    url: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/ubereats.svg',
    invert: true
  },
  doordash: {
    url: 'https://cdn.jsdelivr.net/npm/simple-icons@latest/icons/doordash.svg',
    invert: true
  },
  grubhub: {
    url: '/icons/grubhub.png',
    invert: false
  },
  seamless: {
    url: '/icons/seamless.jpg',
    invert: false
  }
};

// The four delivery platforms we surface on every restaurant. Order matters —
// this is the visual order shown in the Order section.
const ALL_PLATFORMS: DeliveryPlatform[] = ['ubereats', 'doordash', 'grubhub', 'seamless'];

/**
 * Generate a search URL on the given platform for a restaurant we don't have
 * a direct delivery_links row for. The user lands on that platform's search
 * results pre-filtered by name + zip — one extra click vs a direct link, but
 * the button always works, even for restaurants we haven't manually crawled.
 */
function searchFallbackUrl(platform: DeliveryPlatform, name: string, zip: string): string {
  const q = encodeURIComponent(`${name} ${zip}`.trim());
  switch (platform) {
    case 'ubereats':
      return `https://www.ubereats.com/search?q=${q}`;
    case 'doordash':
      return `https://www.doordash.com/search/store/${q}`;
    case 'grubhub':
      return `https://www.grubhub.com/search?searchTerm=${q}`;
    case 'seamless':
      return `https://www.seamless.com/search?searchTerm=${q}`;
    default:
      return '';
  }
}

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

          {/* Order buttons — always render all four platforms. If we have a
              direct delivery_links row, link through /api/click (logged +
              affiliate-wrapped) labeled "Order on X". Otherwise, send the
              user to the platform's search page pre-filled with the
              restaurant name + zip, labeled "Find on X" so they know it's
              one extra click instead of a direct link. */}
          <section className="mt-6 space-y-2">
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-700">
              Order
            </h2>
            {ALL_PLATFORMS.map((platform) => {
              const direct = restaurant.delivery_links.find((l) => l.platform === platform);
              const icon = PLATFORM_ICONS[platform];
              const href = direct
                ? `/api/click?link=${direct.id}`
                : searchFallbackUrl(platform, restaurant.name, restaurant.zip);
              const verb = direct ? 'Order on' : 'Find on';
              return (
                <a
                  key={platform}
                  href={href}
                  rel="nofollow noopener"
                  target={direct ? undefined : '_blank'}
                  className={`flex w-full items-center justify-between rounded-lg px-4 py-3 text-white transition ${
                    direct
                      ? 'bg-brand-700 hover:bg-brand-900'
                      : 'bg-brand-700/70 hover:bg-brand-700'
                  }`}
                >
                  <span className="flex items-center gap-3 font-medium">
                    {icon && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={icon.url}
                        alt=""
                        width={24}
                        height={24}
                        className={`h-6 w-6 rounded object-contain ${
                          icon.invert ? 'invert' : 'bg-white p-0.5'
                        }`}
                      />
                    )}
                    {verb} {getPlatformLabel(platform)}
                  </span>
                  <span aria-hidden>→</span>
                </a>
              );
            })}
          </section>

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
