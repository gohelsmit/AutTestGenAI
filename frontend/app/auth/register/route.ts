import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

type CookieOptions = Parameters<NextResponse['cookies']['set']>[2];

function buildRedirect(request: NextRequest, pathname: string, params?: Record<string, string>) {
  const url = new URL(pathname, request.url);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return url;
}

export async function POST(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    return NextResponse.redirect(buildRedirect(request, '/register', { error: 'Supabase not configured' }));
  }
  const formData = await request.formData();
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  const response = NextResponse.redirect(buildRedirect(request, '/dashboard'));
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.delete(name);
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  });

  if (error) {
    return NextResponse.redirect(
      buildRedirect(request, '/register', { error: error.message })
    );
  }

  if (!data.session) {
    return NextResponse.redirect(
      buildRedirect(request, '/login', { message: 'Account created. Please sign in.' })
    );
  }

  await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  return response;
}
