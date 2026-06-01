'use client';

import { useState, useTransition } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Heart } from 'lucide-react';
import { toggleFavorite } from '@/lib/favorites';

export function FavoriteButton({
  restaurantId,
  initialFavorited,
  isAuthed,
  className = ''
}: {
  restaurantId: string;
  initialFavorited: boolean;
  isAuthed: boolean;
  className?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [favorited, setFavorited] = useState(initialFavorited);
  const [pending, startTransition] = useTransition();

  function onClick(e: React.MouseEvent) {
    // The card is a link; don't navigate when tapping the heart.
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthed) {
      router.push(`/login?next=${encodeURIComponent(pathname || '/')}`);
      return;
    }

    const optimistic = !favorited;
    setFavorited(optimistic);
    startTransition(async () => {
      const res = await toggleFavorite(restaurantId);
      if (!res.ok) {
        // Roll back on failure.
        setFavorited(!optimistic);
        if (res.needsAuth) router.push(`/login?next=${encodeURIComponent(pathname || '/')}`);
      } else {
        setFavorited(res.favorited);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={favorited}
      aria-label={favorited ? 'Remove from saved' : 'Save restaurant'}
      className={`grid h-9 w-9 place-items-center rounded-full border border-brand-100 bg-white text-brand-500 transition hover:border-accent-500 hover:text-accent-500 disabled:opacity-60 ${className}`}
    >
      <Heart
        className="h-[18px] w-[18px]"
        fill={favorited ? 'currentColor' : 'none'}
        color={favorited ? '#b88a2e' : 'currentColor'}
      />
    </button>
  );
}
