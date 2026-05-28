'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import type { CertOption } from '@/lib/restaurants';

const RADIUS_OPTIONS = [5, 10, 20, 50];
const CATEGORY_OPTIONS: { value: string; label: string }[] = [
  { value: 'meat', label: 'Meat' },
  { value: 'dairy', label: 'Dairy' },
  { value: 'pareve', label: 'Pareve' },
  { value: 'mixed', label: 'Mixed' }
];

export function FilterBar({ certOptions }: { certOptions: CertOption[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const rawSp = useSearchParams();
  // useSearchParams can technically be null; normalize so the rest of the component
  // can use it without optional chaining everywhere.
  const sp = rawSp ?? new URLSearchParams();

  const currentRadius = sp.get('radius') ?? '10';
  const currentCert = sp.get('cert') ?? '';
  const currentCat = sp.get('cat') ?? '';

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(sp.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    // Any filter change resets paging to page 1
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  }

  function toggleCategory(value: string) {
    updateParam('cat', currentCat === value ? '' : value);
  }

  return (
    <div className="mt-4 space-y-3">
      {/* Category chips */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-brand-700">
          Type:
        </span>
        {CATEGORY_OPTIONS.map((opt) => {
          const active = currentCat === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleCategory(opt.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                active
                  ? 'border-brand-700 bg-brand-700 text-white'
                  : 'border-brand-100 bg-white text-brand-700 hover:border-brand-500'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Dropdowns row */}
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-brand-700">
          <span className="font-medium uppercase tracking-wide">Within:</span>
          <select
            value={currentRadius}
            onChange={(e) => updateParam('radius', e.target.value)}
            className="rounded-md border border-brand-100 bg-white px-2 py-1 text-sm text-brand-900 focus:border-brand-500 focus:outline-none"
          >
            {RADIUS_OPTIONS.map((r) => (
              <option key={r} value={String(r)}>
                {r} mi
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-xs text-brand-700">
          <span className="font-medium uppercase tracking-wide">Hechsher:</span>
          <select
            value={currentCert}
            onChange={(e) => updateParam('cert', e.target.value)}
            className="rounded-md border border-brand-100 bg-white px-2 py-1 text-sm text-brand-900 focus:border-brand-500 focus:outline-none"
          >
            <option value="">Any</option>
            {certOptions.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.short_name ?? c.name}
              </option>
            ))}
          </select>
        </label>

        {(currentCat || currentCert || currentRadius !== '10') && (
          <button
            type="button"
            onClick={() => {
              const params = new URLSearchParams(sp.toString());
              params.delete('cat');
              params.delete('cert');
              params.delete('radius');
              params.delete('page');
              router.push(`${pathname}?${params.toString()}`);
            }}
            className="text-xs text-brand-700 underline-offset-2 hover:text-brand-900 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>
    </div>
  );
}
