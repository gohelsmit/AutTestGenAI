-- Let staff (doctor, radiologist, technician) with organization_id = NULL see all patients, studies, reports, images.
-- Run in Supabase SQL Editor so "No patients show" is fixed when doctor has no org set.

-- Patients
DROP POLICY IF EXISTS "Staff with no org can view all patients" ON public.patients;
CREATE POLICY "Staff with no org can view all patients" ON public.patients FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('doctor', 'radiologist', 'technician')
  AND (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) IS NULL
);

-- Studies
DROP POLICY IF EXISTS "Staff with no org can view all studies" ON public.studies;
CREATE POLICY "Staff with no org can view all studies" ON public.studies FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('doctor', 'radiologist', 'technician')
  AND (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) IS NULL
);

-- Reports
DROP POLICY IF EXISTS "Staff with no org can view all reports" ON public.reports;
CREATE POLICY "Staff with no org can view all reports" ON public.reports FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('doctor', 'radiologist', 'technician')
  AND (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) IS NULL
);

-- Images
DROP POLICY IF EXISTS "Staff with no org can view all images" ON public.images;
CREATE POLICY "Staff with no org can view all images" ON public.images FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('doctor', 'radiologist', 'technician')
  AND (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) IS NULL
);
