-- Fix RLS "new row violates row-level security" for patients/studies when organization_id is NULL
-- Run in Supabase SQL Editor. Uses IS NOT DISTINCT FROM so NULL = NULL is allowed.

-- Patients
DROP POLICY IF EXISTS "Users can manage patients in their org" ON public.patients;
CREATE POLICY "Users can manage patients in their org" ON public.patients FOR ALL USING (
  organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR public.current_user_is_admin()
);

-- Studies
DROP POLICY IF EXISTS "Users can manage studies in their org" ON public.studies;
CREATE POLICY "Users can manage studies in their org" ON public.studies FOR ALL USING (
  organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR public.current_user_is_admin()
);

-- Images
DROP POLICY IF EXISTS "Users can manage images for accessible studies" ON public.images;
CREATE POLICY "Users can manage images for accessible studies" ON public.images FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.studies s
    WHERE s.id = images.study_id
    AND (s.organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
         OR public.current_user_is_admin())
  )
);

-- Annotations
DROP POLICY IF EXISTS "Users can manage annotations for accessible images" ON public.annotations;
CREATE POLICY "Users can manage annotations for accessible images" ON public.annotations FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.images i
    JOIN public.studies s ON s.id = i.study_id
    WHERE i.id = annotations.image_id
    AND (s.organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
         OR public.current_user_is_admin())
  )
);

-- Reports
DROP POLICY IF EXISTS "Users can manage reports for accessible studies" ON public.reports;
CREATE POLICY "Users can manage reports for accessible studies" ON public.reports FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.studies s
    WHERE s.id = reports.study_id
    AND (s.organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
         OR public.current_user_is_admin())
  )
);

-- Appointments
DROP POLICY IF EXISTS "Users can manage appointments in their org" ON public.appointments;
CREATE POLICY "Users can manage appointments in their org" ON public.appointments FOR ALL USING (
  organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR public.current_user_is_admin()
);

-- AI analysis
DROP POLICY IF EXISTS "AI analysis with study access" ON public.ai_analysis;
CREATE POLICY "AI analysis with study access" ON public.ai_analysis FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.studies s
    WHERE s.id = ai_analysis.study_id
    AND (s.organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
         OR public.current_user_is_admin())
  )
);

-- Equipment
DROP POLICY IF EXISTS "Equipment by org" ON public.equipment;
CREATE POLICY "Equipment by org" ON public.equipment FOR ALL USING (
  organization_id IS NOT DISTINCT FROM (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  OR public.current_user_is_admin()
);
