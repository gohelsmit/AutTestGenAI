import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * Supabase OAuth callback. Add this URL in Supabase Dashboard:
 * Authentication → URL Configuration → Redirect URLs:
 *   http://localhost:3000/auth/callback
 *   https://your-domain.com/auth/callback
 *
 * If you use email/password only, you can ignore OAuth errors and always sign in from /login.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=OAuth+callback+missing+code', request.url));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      console.error('[auth/callback] exchangeCodeForSession:', error.message);
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error.message)}`, request.url)
      );
    }
    return NextResponse.redirect(new URL(next, request.url));
  } catch (e) {
    const message = e instanceof Error ? e.message : 'OAuth failed';
    console.error('[auth/callback]', e);
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(message)}`, request.url)
    );
  }
}
