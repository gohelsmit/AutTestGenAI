-- Add ensure_my_profile() so the app can create a missing profile for the current user (role = patient).
-- Run in Supabase SQL Editor if your schema doesn't have this function yet.

CREATE OR REPLACE FUNCTION public.ensure_my_profile()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  u_id uuid := auth.uid();
  u_email text;
  u_name text;
BEGIN
  IF u_id IS NULL THEN RETURN; END IF;
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = u_id) THEN RETURN; END IF;
  SELECT u.email, COALESCE(u.raw_user_meta_data->>'full_name', u.email) INTO u_email, u_name FROM auth.users u WHERE u.id = u_id;
  IF u_email IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, role) VALUES (u_id, u_email, u_name, 'patient');
  END IF;
END;
$$;
GRANT EXECUTE ON FUNCTION public.ensure_my_profile() TO authenticated;
