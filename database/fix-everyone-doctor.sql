-- Make everyone a doctor: default role = doctor, and set all existing users to doctor.
-- Run in Supabase SQL Editor once.

-- 1) New signups get role 'doctor'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'doctor');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) ensure_my_profile() creates new profiles as doctor
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
    INSERT INTO public.profiles (id, email, full_name, role) VALUES (u_id, u_email, u_name, 'doctor');
  END IF;
END;
$$;

-- 3) Set table default so any new rows get doctor
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'doctor';

-- 4) Set all existing users to doctor
UPDATE public.profiles SET role = 'doctor' WHERE role != 'doctor';
