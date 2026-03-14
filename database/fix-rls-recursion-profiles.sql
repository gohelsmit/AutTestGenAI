-- Fix: infinite recursion in RLS for relation "profiles"
-- Policies that do (SELECT ... FROM profiles WHERE id = auth.uid()) trigger
-- RLS on profiles again when reading patients/studies/reports. Use SECURITY DEFINER
-- helpers so the read runs with definer's privileges (PG 15+) and does not recurse.
-- Run this in Supabase SQL Editor once.

-- ============ HELPERS (SECURITY DEFINER = read profiles without triggering RLS in PG15+) ============
CREATE OR REPLACE FUNCTION public.get_my_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid() LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_organization_id() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_my_linked_patient_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT linked_patient_id FROM public.profiles WHERE id = auth.uid() AND role = 'patient' AND linked_patient_id IS NOT NULL LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION public.get_my_linked_patient_id() TO authenticated;

-- Ensure these exist and use definer context (re-create for consistency)
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

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- ============ PROFILES: use get_my_role() instead of inline SELECT (stops recursion) ============
DROP POLICY IF EXISTS "Patients can view staff profiles" ON public.profiles;
CREATE POLICY "Patients can view staff profiles" ON public.profiles FOR SELECT USING (
  public.get_my_role() = 'patient'
  AND public.profiles.role IN ('doctor', 'radiologist', 'technician', 'admin')
);

-- ============ PATIENTS ============
DROP POLICY IF EXISTS "Users can manage patients in their org" ON public.patients;
CREATE POLICY "Users can manage patients in their org" ON public.patients FOR ALL USING (
  public.get_my_role() IS DISTINCT FROM 'patient'
  AND (organization_id IS NOT DISTINCT FROM public.get_my_organization_id() OR public.current_user_is_admin())
);
DROP POLICY IF EXISTS "Staff with no org can view all patients" ON public.patients;
CREATE POLICY "Staff with no org can view all patients" ON public.patients FOR ALL USING (
  public.get_my_role() IN ('doctor', 'radiologist', 'technician')
  AND public.get_my_organization_id() IS NULL
);
DROP POLICY IF EXISTS "Patient can view own linked record" ON public.patients;
CREATE POLICY "Patient can view own linked record" ON public.patients FOR SELECT USING (
  id = public.get_my_linked_patient_id()
);
DROP POLICY IF EXISTS "Staff can view all patients" ON public.patients;
CREATE POLICY "Staff can view all patients" ON public.patients FOR SELECT USING (
  public.get_my_role() IN ('doctor', 'radiologist', 'technician', 'admin')
);

-- ============ STUDIES ============
DROP POLICY IF EXISTS "Users can manage studies in their org" ON public.studies;
CREATE POLICY "Users can manage studies in their org" ON public.studies FOR ALL USING (
  public.get_my_role() IS DISTINCT FROM 'patient'
  AND (organization_id IS NOT DISTINCT FROM public.get_my_organization_id() OR public.current_user_is_admin())
);
DROP POLICY IF EXISTS "Staff with no org can view all studies" ON public.studies;
CREATE POLICY "Staff with no org can view all studies" ON public.studies FOR ALL USING (
  public.get_my_role() IN ('doctor', 'radiologist', 'technician')
  AND public.get_my_organization_id() IS NULL
);
DROP POLICY IF EXISTS "Patient can view own studies" ON public.studies;
CREATE POLICY "Patient can view own studies" ON public.studies FOR SELECT USING (
  patient_id = public.get_my_linked_patient_id()
);
DROP POLICY IF EXISTS "Staff can view all studies" ON public.studies;
CREATE POLICY "Staff can view all studies" ON public.studies FOR SELECT USING (
  public.get_my_role() IN ('doctor', 'radiologist', 'technician', 'admin')
);

-- ============ IMAGES ============
DROP POLICY IF EXISTS "Users can manage images for accessible studies" ON public.images;
CREATE POLICY "Users can manage images for accessible studies" ON public.images FOR ALL USING (
  public.get_my_role() IS DISTINCT FROM 'patient'
  AND EXISTS (
    SELECT 1 FROM public.studies s
    WHERE s.id = images.study_id
    AND (s.organization_id IS NOT DISTINCT FROM public.get_my_organization_id() OR public.current_user_is_admin())
  )
);
DROP POLICY IF EXISTS "Staff with no org can view all images" ON public.images;
CREATE POLICY "Staff with no org can view all images" ON public.images FOR ALL USING (
  public.get_my_role() IN ('doctor', 'radiologist', 'technician')
  AND public.get_my_organization_id() IS NULL
);
DROP POLICY IF EXISTS "Patient can view own study images" ON public.images;
CREATE POLICY "Patient can view own study images" ON public.images FOR SELECT USING (
  study_id IN (SELECT id FROM public.studies WHERE patient_id = public.get_my_linked_patient_id())
);
DROP POLICY IF EXISTS "Staff can view all images" ON public.images;
CREATE POLICY "Staff can view all images" ON public.images FOR SELECT USING (
  public.get_my_role() IN ('doctor', 'radiologist', 'technician', 'admin')
);

-- ============ ANNOTATIONS ============
DROP POLICY IF EXISTS "Users can manage annotations for accessible images" ON public.annotations;
CREATE POLICY "Users can manage annotations for accessible images" ON public.annotations FOR ALL USING (
  public.get_my_role() IS DISTINCT FROM 'patient'
  AND EXISTS (
    SELECT 1 FROM public.images i
    JOIN public.studies s ON s.id = i.study_id
    WHERE i.id = annotations.image_id
    AND (s.organization_id IS NOT DISTINCT FROM public.get_my_organization_id() OR public.current_user_is_admin())
  )
);
DROP POLICY IF EXISTS "Patient can view own annotations" ON public.annotations;
CREATE POLICY "Patient can view own annotations" ON public.annotations FOR SELECT USING (
  image_id IN (SELECT i.id FROM public.images i WHERE i.study_id IN (SELECT id FROM public.studies WHERE patient_id = public.get_my_linked_patient_id()))
);

-- ============ REPORTS ============
DROP POLICY IF EXISTS "Users can manage reports for accessible studies" ON public.reports;
CREATE POLICY "Users can manage reports for accessible studies" ON public.reports FOR ALL USING (
  public.get_my_role() IS DISTINCT FROM 'patient'
  AND EXISTS (
    SELECT 1 FROM public.studies s
    WHERE s.id = reports.study_id
    AND (s.organization_id IS NOT DISTINCT FROM public.get_my_organization_id() OR public.current_user_is_admin())
  )
);
DROP POLICY IF EXISTS "Staff with no org can view all reports" ON public.reports;
CREATE POLICY "Staff with no org can view all reports" ON public.reports FOR ALL USING (
  public.get_my_role() IN ('doctor', 'radiologist', 'technician')
  AND public.get_my_organization_id() IS NULL
);
DROP POLICY IF EXISTS "Patient can view own reports" ON public.reports;
CREATE POLICY "Patient can view own reports" ON public.reports FOR SELECT USING (
  study_id IN (SELECT id FROM public.studies WHERE patient_id = public.get_my_linked_patient_id())
);
DROP POLICY IF EXISTS "Staff can view all reports" ON public.reports;
CREATE POLICY "Staff can view all reports" ON public.reports FOR SELECT USING (
  public.get_my_role() IN ('doctor', 'radiologist', 'technician', 'admin')
);

-- ============ APPOINTMENTS ============
DROP POLICY IF EXISTS "Users can manage appointments in their org" ON public.appointments;
CREATE POLICY "Users can manage appointments in their org" ON public.appointments FOR ALL USING (
  organization_id IS NOT DISTINCT FROM public.get_my_organization_id()
  OR public.current_user_is_admin()
);

-- ============ AI ANALYSIS ============
DROP POLICY IF EXISTS "AI analysis with study access" ON public.ai_analysis;
CREATE POLICY "AI analysis with study access" ON public.ai_analysis FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.studies s
    WHERE s.id = ai_analysis.study_id
    AND (s.organization_id IS NOT DISTINCT FROM public.get_my_organization_id() OR public.current_user_is_admin())
  )
);

-- ============ EQUIPMENT ============
DROP POLICY IF EXISTS "Equipment by org" ON public.equipment;
CREATE POLICY "Equipment by org" ON public.equipment FOR ALL USING (
  organization_id IS NOT DISTINCT FROM public.get_my_organization_id()
  OR public.current_user_is_admin()
);
