-- New signups get role 'patient' only. This script does NOT change existing users (doctors stay doctor).
-- It only: (1) sets column default to 'patient' for new rows, (2) adds linked_patient_id if missing,
-- (3) fixes handle_new_user() so new registrations get 'patient'. Existing profiles.role are unchanged.
-- Run in Supabase SQL Editor.

ALTER TABLE public.profiles
  ALTER COLUMN role SET DEFAULT 'patient';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'linked_patient_id') THEN
    ALTER TABLE public.profiles ADD COLUMN linked_patient_id UUID REFERENCES public.patients(id);
  END IF; END $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'patient');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
