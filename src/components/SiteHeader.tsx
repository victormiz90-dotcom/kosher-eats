import Link from 'next/link';
import { Check } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/login/actions';
import type { UserRole } from '@/types/database';

export async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let role: UserRole = 'user';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile) role = (profile.role as UserRole) ?? 'user';
  }

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100 bg-brand-50/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-700 text-accent-500 ring-1 ring-inset ring-accent-500/40">
            <Check className="h-[18px] w-[18px]" strokeWidth={3} />
          </span>
          <span className="leading-tight">
            <span className="font-serif text-xl font-semibold tracking-tight text-brand-900">
              Kosher<span className="text-accent-500">Eats</span>
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-brand-500">
              Verified · Brooklyn
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {user ? (
            <>
              {role === 'admin' && (
                <Link
                  href="/admin"
                  className="rounded-md px-2.5 py-1.5 font-medium text-accent-600 hover:bg-white"
                >
                  Admin
                </Link>
              )}
              <Link href="/saved" className="rounded-md px-2.5 py-1.5 text-brand-700 hover:bg-white">
                Saved
              </Link>
              <form action={signOut}>
                <button type="submit" className="rounded-md px-2.5 py-1.5 text-brand-700 hover:bg-white">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-brand-700 px-3.5 py-1.5 font-medium text-white transition hover:bg-brand-900"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
