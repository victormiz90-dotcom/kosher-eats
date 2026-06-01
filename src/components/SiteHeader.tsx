import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/login/actions';
import type { UserRole } from '@/types/database';

export async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  let role: UserRole = 'user';
  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, role')
      .eq('id', user.id)
      .single();
    if (profile) {
      role = (profile.role as UserRole) ?? 'user';
      displayName = profile.display_name ?? null;
    }
  }

  return (
    <header className="border-b border-brand-100 bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-3xl items-center justify-between px-4">
        <Link href="/" className="font-bold tracking-tight text-brand-900">
          Kosher<span className="text-accent-500">Eats</span>
        </Link>

        <nav className="flex items-center gap-1 text-sm">
          {user ? (
            <>
              {role === 'admin' && (
                <Link
                  href="/admin"
                  className="rounded-md px-2.5 py-1.5 font-medium text-accent-600 hover:bg-brand-50"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/saved"
                className="rounded-md px-2.5 py-1.5 text-brand-700 hover:bg-brand-50"
              >
                Saved
              </Link>
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-md px-2.5 py-1.5 text-brand-700 hover:bg-brand-50"
                  title={displayName ? `Signed in as ${displayName}` : undefined}
                >
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-md bg-brand-700 px-3 py-1.5 font-medium text-white hover:bg-brand-900"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
