import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { UserRole } from '@/lib/utils';
import { normalizeRole } from '@/lib/utils';

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type CookieOptions = Parameters<CookieStore['set']>[2];

/** Parse role from get_my_role() RPC response. */
function parseRoleFromRpc(data: unknown): string | null {
  if (typeof data === 'string' && data.trim()) return data.trim();
  if (Array.isArray(data) && data.length > 0) {
    const first = data[0];
    if (typeof first === 'string' && first.trim()) return first.trim();
    if (first != null && typeof first === 'object' && 'role' in first && typeof (first as { role: unknown }).role === 'string')
      return ((first as { role: string }).role).trim();
  }
  if (data != null && typeof data === 'object' && 'role' in data && typeof (data as { role: unknown }).role === 'string')
    return ((data as { role: string }).role).trim();
  return null;
}

/**
 * Get current user's role from DB (get_my_role RPC first to avoid profiles RLS recursion).
 * Use this in all dashboard server components so doctor/patient role is consistent.
 */
export async function getCurrentUserRole(
  supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>,
  userId: string
): Promise<UserRole> {
  let roleFromDb: string | null = null;
  const { data: roleData } = await supabase.rpc('get_my_role');
  const parsed = parseRoleFromRpc(roleData);
  if (parsed) roleFromDb = parsed;
  if (!roleFromDb) {
    await supabase.rpc('ensure_my_profile');
    const { data: retryRole } = await supabase.rpc('get_my_role');
    roleFromDb = parseRoleFromRpc(retryRole);
  }
  if (!roleFromDb) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', userId).maybeSingle();
    roleFromDb = profile?.role != null ? String(profile.role) : null;
  }
  return normalizeRole(roleFromDb);
}

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set(name, value, options);
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set(name, '', { ...options, maxAge: 0 });
        },
      },
      global: {
        fetch: (url, init) => fetch(url, { ...init, cache: 'no-store' }),
      },
    }
  );
}
