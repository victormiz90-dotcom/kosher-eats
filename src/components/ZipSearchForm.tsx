'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function ZipSearchForm({
  defaultZip,
  hasExplicitLocation = false
}: {
  defaultZip: string;
  hasExplicitLocation?: boolean;
}) {
  const router = useRouter();
  const [zip, setZip] = useState(defaultZip);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Keep the input in sync when the page re-renders with a new zip (e.g. after
  // "use my location" resolves). Without this, the controlled input stays stuck
  // on whatever it first mounted with — the old "always shows 11230" bug.
  useEffect(() => {
    setZip(defaultZip);
  }, [defaultZip]);

  // Auto-locate returning visitors. We only do this when the URL has no explicit
  // location AND the browser has *already* granted geolocation permission, so we
  // never throw a surprise permission prompt at a first-time visitor — they get
  // the default zip until they tap the button.
  useEffect(() => {
    if (hasExplicitLocation || !navigator.geolocation) return;
    if (!navigator.permissions?.query) return;

    let cancelled = false;
    navigator.permissions
      .query({ name: 'geolocation' as PermissionName })
      .then((status) => {
        if (cancelled || status.state !== 'granted') return;
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (!cancelled) {
              router.replace(`/?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
            }
          },
          () => {
            /* already-granted permission failing is rare; stay on default */
          }
        );
      })
      .catch(() => {
        /* Permissions API unsupported — ignore, button still works */
      });

    return () => {
      cancelled = true;
    };
  }, [hasExplicitLocation, router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/?zip=${encodeURIComponent(zip)}`);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setGeoError('Your browser does not support location.');
      return;
    }
    setGeoError(null);
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        router.push(`/?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? 'Location blocked. Enable it in your browser, or type a zip.'
            : 'Could not get your location. Type a zip instead.'
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 60_000 }
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]{5}"
          maxLength={5}
          value={zip}
          onChange={(e) => setZip(e.target.value)}
          placeholder="Enter zip"
          className="flex-1 rounded-lg border border-brand-100 bg-white px-3 py-2 text-base text-brand-900 placeholder:text-brand-500 focus:border-brand-500 focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
        >
          Search
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm text-brand-700 hover:border-brand-500 disabled:opacity-60"
          aria-label="Use my location"
          title="Use my location"
        >
          {locating ? '…' : '📍'}
        </button>
      </form>
      {geoError && <p className="mt-1 text-xs text-red-700">{geoError}</p>}
    </div>
  );
}
