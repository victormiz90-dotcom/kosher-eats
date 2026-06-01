'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { LocateFixed, Search } from 'lucide-react';

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

  // Ask for location on first load when no explicit location is set, so the
  // default isn't a stale hardcoded zip. Browsers remember a denial and won't
  // nag; we attempt once per mount, and after it resolves the URL carries
  // lat/lng (hasExplicitLocation = true) so this won't re-fire.
  const triedAuto = useRef(false);
  useEffect(() => {
    if (hasExplicitLocation || triedAuto.current || !navigator.geolocation) return;
    triedAuto.current = true;
    navigator.geolocation.getCurrentPosition(
      (pos) => router.replace(`/?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`),
      () => {
        /* denied or unavailable — fall back to the default zip silently */
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
    );
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
          placeholder="Enter your zip"
          className="min-w-0 flex-1 rounded-xl border border-brand-100 bg-brand-50/60 px-4 py-2.5 text-base text-brand-900 placeholder:text-brand-500 focus:border-accent-500 focus:bg-white focus:outline-none"
        />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-xl bg-brand-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-900"
        >
          <Search className="h-4 w-4" />
          <span className="hidden sm:inline">Search</span>
        </button>
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="inline-flex items-center gap-1.5 rounded-xl border border-brand-100 bg-white px-3 py-2.5 text-sm font-medium text-brand-700 transition hover:border-accent-500 hover:text-accent-600 disabled:opacity-60"
          aria-label="Use my location"
          title="Use my location"
        >
          <LocateFixed className={`h-4 w-4 ${locating ? 'animate-pulse' : ''}`} />
          <span className="hidden sm:inline">{locating ? 'Locating…' : 'Near me'}</span>
        </button>
      </form>
      {geoError && <p className="mt-1.5 px-1 text-xs text-red-700">{geoError}</p>}
    </div>
  );
}
