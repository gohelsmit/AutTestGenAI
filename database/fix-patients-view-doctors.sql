-- Let patients see staff profiles (doctors, radiologists, etc.) so doctors list is not empty for patients.
-- Run in Supabase SQL Editor.

DROP POLICY IF EXISTS "Patients can view staff profiles" ON public.profiles;
CREATE POLICY "Patients can view staff profiles" ON public.profiles FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'patient'
  AND public.profiles.role IN ('doctor', 'radiologist', 'technician', 'admin')
);
