-- Add get_my_role() so the app reads role as plain text from DB (fixes "doctor in DB but shows patient").
-- Run in Supabase SQL Editor once.

CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO authenticated;
