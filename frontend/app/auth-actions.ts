'use server';

import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';

function buildRedirect(path: string, params: Record<string, string | null | undefined>) {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      search.set(key, value);
    }
  });

  const query = search.toString();
  return query ? `${path}?${query}` : path;
}

export async function login(formData: FormData) {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect(buildRedirect('/login', { error: 'Email and password are required.' }));
  }

  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    redirect(buildRedirect('/login', { error: error.message }));
  }

  redirect('/dashboard');
}

export async function register(formData: FormData) {
  const fullName = String(formData.get('fullName') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    redirect(buildRedirect('/register', { error: 'Email and password are required.' }));
  }

  const supabase = await createServerSupabaseClient();
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
    redirect(buildRedirect('/register', { error: error.message }));
  }

  if (data.session) {
    redirect('/dashboard');
  }

  redirect(buildRedirect('/login', { message: 'Account created. Please sign in.' }));
}
