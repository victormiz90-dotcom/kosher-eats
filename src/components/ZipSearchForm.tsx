'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ZipSearchForm({ defaultZip }: { defaultZip: string }) {
  const router = useRouter();
  const [zip, setZip] = useState(defaultZip);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    router.push(`/?zip=${encodeURIComponent(zip)}`);
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        router.push(`/?lat=${pos.coords.latitude}&lng=${pos.coords.longitude}`);
      },
      (err) => {
        console.warn('Geolocation denied:', err);
      }
    );
  }

  return (
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
        className="rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm text-brand-700 hover:border-brand-500"
        aria-label="Use my location"
        title="Use my location"
      >
        📍
      </button>
    </form>
  );
}
