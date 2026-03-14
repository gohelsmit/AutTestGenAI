-- Create a profile row for every auth.users user that doesn't have one.
-- Run once in Supabase SQL Editor. Existing profile rows are NOT changed (doctors stay doctor).
-- New rows get role 'patient'; update them manually in the table to set doctor/admin etc.

INSERT INTO public.profiles (id, email, full_name, role)
SELECT
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email),
  'patient'
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);
