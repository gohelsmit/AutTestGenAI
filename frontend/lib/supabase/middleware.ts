import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

type CookieOptions = Parameters<NextResponse['cookies']['set']>[2];

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  });

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()) {
    return response;
  }

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

  await supabase.auth.getUser();
  return response;
}
