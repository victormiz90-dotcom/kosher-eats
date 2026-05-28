import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { buildDeepLink } from '@/lib/deep-link';

// ============================================================================
// /api/click?link=<delivery_link_id>
// ============================================================================
// Logs the click to `click_events` (anonymous or attributed if user is signed in)
// then 302-redirects to the delivery platform with affiliate params appended.
// This is the entire monetization+analytics chokepoint of the MVP.
// ============================================================================

export async function GET(request: NextRequest) {
  const linkId = request.nextUrl.searchParams.get('link');
  if (!linkId) {
    return NextResponse.json({ error: 'missing link param' }, { status: 400 });
  }

  const supabase = createClient();

  const { data: link, error } = await supabase
    .from('delivery_links')
    .select('*, restaurant:restaurants(id, slug, zip)')
    .eq('id', linkId)
    .eq('active', true)
    .single();

  if (error || !link) {
    return NextResponse.json({ error: 'link not found' }, { status: 404 });
  }

  // Log the click (fire-and-forget — never block the redirect on logging)
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const clickPromise = supabase.from('click_events').insert({
    user_id: user?.id ?? null,
    restaurant_id: (link.restaurant as any)?.id ?? link.restaurant_id,
    platform: link.platform,
    user_zip: request.nextUrl.searchParams.get('zip'),
    user_agent: request.headers.get('user-agent')
  });

  // Don't await — let it run in the background. If logging fails, redirect anyway.
  clickPromise.then(({ error: insertError }) => {
    if (insertError) console.error('click log failed:', insertError);
  });

  const finalUrl = buildDeepLink(link);

  return NextResponse.redirect(finalUrl, { status: 302 });
}
