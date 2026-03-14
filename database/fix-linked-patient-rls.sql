-- Add linked_patient_id and RLS so patient sees ONLY their own data (not other patients).
-- Run in Supabase SQL Editor if you already have the schema applied.

-- 1. Add column if missing
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'linked_patient_id') THEN
    ALTER TABLE public.profiles ADD COLUMN linked_patient_id UUID REFERENCES public.patients(id);
  END IF; END $$;

-- 2. Exclude patient role from org-based policies (so patient gets only "own" policies)
DROP POLICY IF EXISTS "Users can manage patients in their org" ON public.patients;
CREATE POLICY "Users can manage patients in their org" ON public.patients FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IS DISTINCT FROM 'patient'
  AND ( organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.current_user_is_admin() )
);

DROP POLICY IF EXISTS "Users can manage studies in their org" ON public.studies;
CREATE POLICY "Users can manage studies in their org" ON public.studies FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IS DISTINCT FROM 'patient'
  AND ( organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.current_user_is_admin() )
);

DROP POLICY IF EXISTS "Users can manage images for accessible studies" ON public.images;
CREATE POLICY "Users can manage images for accessible studies" ON public.images FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IS DISTINCT FROM 'patient'
  AND EXISTS ( SELECT 1 FROM public.studies s WHERE s.id = images.study_id AND (s.organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.current_user_is_admin()) )
);

DROP POLICY IF EXISTS "Users can manage annotations for accessible images" ON public.annotations;
CREATE POLICY "Users can manage annotations for accessible images" ON public.annotations FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IS DISTINCT FROM 'patient'
  AND EXISTS ( SELECT 1 FROM public.images i JOIN public.studies s ON s.id = i.study_id WHERE i.id = annotations.image_id AND (s.organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.current_user_is_admin()) )
);

DROP POLICY IF EXISTS "Users can manage reports for accessible studies" ON public.reports;
CREATE POLICY "Users can manage reports for accessible studies" ON public.reports FOR ALL USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IS DISTINCT FROM 'patient'
  AND EXISTS ( SELECT 1 FROM public.studies s WHERE s.id = reports.study_id AND (s.organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR public.current_user_is_admin()) )
);

-- 3. Patient can view ONLY their linked patient record (no other patients)
DROP POLICY IF EXISTS "Patient can view own linked record" ON public.patients;
CREATE POLICY "Patient can view own linked record" ON public.patients FOR SELECT USING (
  id = (SELECT linked_patient_id FROM public.profiles WHERE id = auth.uid() AND role = 'patient' AND linked_patient_id IS NOT NULL)
);

-- 4. Patient can view only their studies
DROP POLICY IF EXISTS "Patient can view own studies" ON public.studies;
CREATE POLICY "Patient can view own studies" ON public.studies FOR SELECT USING (
  patient_id = (SELECT linked_patient_id FROM public.profiles WHERE id = auth.uid() AND role = 'patient' AND linked_patient_id IS NOT NULL)
);

-- 5. Patient can view only their reports
DROP POLICY IF EXISTS "Patient can view own reports" ON public.reports;
CREATE POLICY "Patient can view own reports" ON public.reports FOR SELECT USING (
  study_id IN (SELECT id FROM public.studies WHERE patient_id = (SELECT linked_patient_id FROM public.profiles WHERE id = auth.uid() AND role = 'patient' AND linked_patient_id IS NOT NULL))
);

-- 6. Patient can view images only for their studies
DROP POLICY IF EXISTS "Patient can view own study images" ON public.images;
CREATE POLICY "Patient can view own study images" ON public.images FOR SELECT USING (
  study_id IN (SELECT id FROM public.studies WHERE patient_id = (SELECT linked_patient_id FROM public.profiles WHERE id = auth.uid() AND role = 'patient' AND linked_patient_id IS NOT NULL))
);

-- 7. Patient can view annotations only on their studies' images
DROP POLICY IF EXISTS "Patient can view own annotations" ON public.annotations;
CREATE POLICY "Patient can view own annotations" ON public.annotations FOR SELECT USING (
  image_id IN (SELECT i.id FROM public.images i WHERE i.study_id IN (SELECT id FROM public.studies WHERE patient_id = (SELECT linked_patient_id FROM public.profiles WHERE id = auth.uid() AND role = 'patient' AND linked_patient_id IS NOT NULL)))
);
