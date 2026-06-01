import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Handles the redirect from a magic link or email confirmation. Supabase sends
 * the user back here with a `code` we exchange for a session, then forwards them
 * to wherever they were headed (`next`, default `/`).
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/';

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=Could not sign you in. Try again.`);
}
