import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

/**
 * GET /api/supabase-check — verify Supabase connection and that DB returns data.
 * Open in browser: http://localhost:3000/api/supabase-check
 */
export async function GET() {
  const hasUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL?.trim());
  const hasKey = Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim());

  if (!hasUrl || !hasKey) {
    return NextResponse.json(
      {
        ok: false,
        error: 'Missing env: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY',
        env: { hasUrl, hasKey },
      },
      { status: 503 }
    );
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { data: session } = await supabase.auth.getSession();
    const user = session?.session?.user;

    // 1. Verify profiles table: get count + one row (safe fields only)
    const { count: profilesCount, error: profilesError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('id, email, role, full_name')
      .limit(1)
      .maybeSingle();

    // 2. Verify organizations (no RLS issue for listing)
    const { count: orgsCount, error: orgsError } = await supabase
      .from('organizations')
      .select('*', { count: 'exact', head: true });

    // 3. Patients count (RLS applies; may be 0 for anon)
    const { count: patientsCount, error: patientsError } = await supabase
      .from('patients')
      .select('*', { count: 'exact', head: true });

    const dbError = profilesError?.message ?? orgsError?.message ?? patientsError?.message;

    return NextResponse.json({
      ok: true,
      env: { hasUrl, hasKey },
      session: user ? { email: user.email, id: user.id } : 'anonymous',
      verify: {
        profiles: profilesError
          ? { error: profilesError.message }
          : { count: profilesCount ?? 0, sample: profileRow ?? null },
        organizations: orgsError ? { error: orgsError.message } : { count: orgsCount ?? 0 },
        patients: patientsError
          ? { error: patientsError.message }
          : { count: patientsCount ?? 0 },
      },
      db: dbError ? 'error' : 'ok',
      ...(dbError && { error: dbError }),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: message, env: { hasUrl, hasKey } },
      { status: 503 }
    );
  }
}
