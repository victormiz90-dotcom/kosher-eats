import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Check, ShieldCheck } from 'lucide-react';
import { getRestaurantBySlug } from '@/lib/restaurants';
import { getPlatformLabel } from '@/lib/deep-link';
import type { DeliveryPlatform } from '@/types/database';

// Brand icons vendored locally from simple-icons, rendered white via `invert`.
// Seamless is owned by Grubhub and shares branding, so it reuses the grubhub icon.
const PLATFORM_ICON_URL: Partial<Record<DeliveryPlatform, string>> = {
  ubereats: '/icons/ubereats.svg',
  doordash: '/icons/doordash.svg',
  grubhub: '/icons/grubhub.svg',
  seamless: '/icons/grubhub.svg'
};

interface PageProps {
  params: { slug: string };
}

export default async function RestaurantPage({ params }: PageProps) {
  const restaurant = await getRestaurantBySlug(params.slug);
  if (!restaurant) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1.5 text-sm text-brand-500 transition hover:text-brand-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to results
      </Link>

      <div className="overflow-hidden rounded-2xl border border-brand-100 bg-white shadow-sm">
        {restaurant.hero_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={restaurant.hero_image_url} alt={restaurant.name} className="h-52 w-full object-cover" />
        )}

        <div className="p-6">
          <h1 className="font-serif text-3xl font-semibold tracking-tight text-brand-900">
            {restaurant.name}
          </h1>
          <p className="mt-1 text-sm text-brand-500">
            {restaurant.address}, {restaurant.city}, {restaurant.state} {restaurant.zip}
          </p>

          {/* Hechsher — the defining, most prominent block. */}
          {restaurant.certifications.length > 0 && (
            <section className="mt-5 rounded-xl border border-verify/20 bg-verify-soft p-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-verify">
                <ShieldCheck className="h-4 w-4" /> Certified kosher
              </div>
              <ul className="mt-2 flex flex-wrap gap-2">
                {restaurant.certifications.map((c) => (
                  <li
                    key={c.id}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-verify shadow-sm"
                  >
                    <span className="grid h-4 w-4 place-items-center rounded bg-verify text-white">
                      <Check className="h-3 w-3" strokeWidth={3.5} />
                    </span>
                    {c.agency_short_name ?? c.agency_name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Kashrus detail tags */}
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-md bg-brand-700 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              {restaurant.category}
            </span>
            {restaurant.cholov_yisroel && <Badge>Cholov Yisroel</Badge>}
            {restaurant.pas_yisroel && <Badge>Pas Yisroel</Badge>}
            {restaurant.bishul_yisroel && <Badge>Bishul Yisroel</Badge>}
            {restaurant.shomer_shabbos && <Badge>Shomer Shabbos</Badge>}
          </div>

          {restaurant.description && (
            <p className="mt-5 text-sm leading-relaxed text-brand-900">{restaurant.description}</p>
          )}

          {/* Order buttons — only for restaurants with real delivery_links rows.
              We deliberately do NOT generate fallback search links. */}
          {restaurant.delivery_links.length > 0 && (
            <section className="mt-6">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-brand-500">Order now</h2>
              <div className="space-y-2">
                {restaurant.delivery_links.map((link) => {
                  const iconUrl = PLATFORM_ICON_URL[link.platform];
                  return (
                    <a
                      key={link.id}
                      href={`/api/click?link=${link.id}`}
                      target="_blank"
                      rel="nofollow noopener noreferrer"
                      className="flex w-full items-center justify-between rounded-xl bg-brand-700 px-4 py-3.5 text-white transition hover:bg-brand-900"
                    >
                      <span className="flex items-center gap-3 font-semibold">
                        {iconUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={iconUrl} alt="" width={20} height={20} className="h-5 w-5 invert" />
                        )}
                        Order on {getPlatformLabel(link.platform)}
                      </span>
                      <span aria-hidden>→</span>
                    </a>
                  );
                })}
              </div>
            </section>
          )}

          {restaurant.phone && (
            <a
              href={`tel:${restaurant.phone}`}
              className="mt-2 flex w-full items-center justify-center rounded-xl border border-brand-100 bg-white px-4 py-3 text-sm font-medium text-brand-700 transition hover:border-accent-500"
            >
              📞 {restaurant.phone}
            </a>
          )}
        </div>
      </div>

      <p className="mt-4 px-2 text-xs leading-relaxed text-brand-500">
        Verify current kashrus status before ordering. Hechshers change. KosherEats is an independent
        directory and is not a kashrus agency.
      </p>
    </main>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-md border border-brand-100 px-2.5 py-1 text-xs font-medium text-brand-500">
      {children}
    </span>
  );
}
