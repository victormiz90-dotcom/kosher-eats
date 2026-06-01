import Link from 'next/link';
import { signIn, signUp, signInWithMagicLink } from './actions';

interface LoginPageProps {
  searchParams: { error?: string; message?: string; next?: string };
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  const next = searchParams.next ?? '/';

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold tracking-tight text-brand-900">Sign in to KosherEats</h1>
        <p className="mt-1 text-sm text-brand-700">
          Save your favorite spots and sync them across devices.
        </p>

        {searchParams.error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
            {searchParams.error}
          </p>
        )}
        {searchParams.message && (
          <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">
            {searchParams.message}
          </p>
        )}

        <form className="mt-5 space-y-3">
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="email" className="block text-xs font-medium uppercase tracking-wide text-brand-700">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-lg border border-brand-100 bg-white px-3 py-2 text-base text-brand-900 placeholder:text-brand-500 focus:border-brand-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-xs font-medium uppercase tracking-wide text-brand-700">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              className="mt-1 w-full rounded-lg border border-brand-100 bg-white px-3 py-2 text-base text-brand-900 placeholder:text-brand-500 focus:border-brand-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <div className="flex gap-2 pt-1">
            <button
              formAction={signIn}
              className="flex-1 rounded-lg bg-brand-700 px-4 py-2 text-sm font-medium text-white hover:bg-brand-900"
            >
              Sign in
            </button>
            <button
              formAction={signUp}
              className="flex-1 rounded-lg border border-brand-100 bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:border-brand-500"
            >
              Create account
            </button>
          </div>
        </form>

        <div className="my-5 flex items-center gap-3 text-xs text-brand-500">
          <span className="h-px flex-1 bg-brand-100" />
          or
          <span className="h-px flex-1 bg-brand-100" />
        </div>

        <form className="space-y-2">
          <input type="hidden" name="next" value={next} />
          <label htmlFor="ml-email" className="block text-xs font-medium uppercase tracking-wide text-brand-700">
            Email me a sign-in link
          </label>
          <div className="flex gap-2">
            <input
              id="ml-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="flex-1 rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm text-brand-900 placeholder:text-brand-500 focus:border-brand-500 focus:outline-none"
              placeholder="you@example.com"
            />
            <button
              formAction={signInWithMagicLink}
              className="rounded-lg border border-brand-100 bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:border-brand-500"
            >
              Send link
            </button>
          </div>
        </form>
      </div>

      <Link href="/" className="mt-6 text-center text-sm text-brand-700 hover:text-brand-900">
        ← Back to restaurants
      </Link>
    </main>
  );
}
