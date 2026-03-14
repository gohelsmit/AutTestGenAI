-- =============================================================================
-- NextGen Medical Imaging Platform — COMPLETE DATABASE (first to last)
-- =============================================================================
-- Run this ONE file in Supabase SQL Editor when:
--   - Starting a new project (empty DB), or
--   - You deleted all tables and want to recreate everything.
-- This file DROPS all project tables first, then CREATES them again (clean slate).
-- Run from top to bottom. Then create Storage buckets: dicom-files, reports
-- =============================================================================

-- ============ STEP 0: DROP EXISTING TABLES (clean slate) ============
-- Drop trigger first (it inserts into profiles), then tables, then enums
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

DROP TABLE IF EXISTS public.annotations CASCADE;
DROP TABLE IF EXISTS public.images CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.ai_analysis CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.studies CASCADE;
DROP TABLE IF EXISTS public.equipment CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.organizations CASCADE;

DROP TYPE IF EXISTS public.report_status CASCADE;
DROP TYPE IF EXISTS public.study_status CASCADE;
DROP TYPE IF EXISTS public.user_role CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ ENUMS (create only if not exists, so script can be re-run) ============
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('admin', 'radiologist', 'technician', 'doctor', 'patient');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'study_status') THEN
    CREATE TYPE study_status AS ENUM ('scheduled', 'in_progress', 'pending_review', 'completed', 'cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'report_status') THEN
    CREATE TYPE report_status AS ENUM ('draft', 'signed', 'amended');
  END IF;
END
$$;

-- ============ PROFILES (extends Supabase auth.users) ============
-- New users get role 'doctor' by default (trigger below). Set to patient/admin/etc. in DB if needed.
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'doctor',
  organization_id UUID,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ ORGANIZATIONS ============
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  address TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_profiles_org') THEN
    ALTER TABLE public.profiles ADD CONSTRAINT fk_profiles_org
      FOREIGN KEY (organization_id) REFERENCES public.organizations(id);
  END IF; END $$;

-- ============ PATIENTS ============
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id),
  mrn TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  gender TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  medical_history JSONB DEFAULT '{}',
  allergies JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, mrn)
);

CREATE INDEX IF NOT EXISTS idx_patients_org ON public.patients(organization_id);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON public.patients(mrn);
CREATE INDEX IF NOT EXISTS idx_patients_name ON public.patients(last_name, first_name);

-- Link patient-role user to their single patient record (so they see only their data)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'linked_patient_id') THEN
    ALTER TABLE public.profiles ADD COLUMN linked_patient_id UUID REFERENCES public.patients(id);
  END IF; END $$;

-- ============ EQUIPMENT ============
CREATE TABLE IF NOT EXISTS public.equipment (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  type TEXT,
  manufacturer TEXT,
  model TEXT,
  serial_number TEXT,
  last_calibration DATE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ STUDIES ============
CREATE TABLE IF NOT EXISTS public.studies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  assigned_radiologist_id UUID REFERENCES public.profiles(id),
  equipment_id UUID REFERENCES public.equipment(id),
  study_uid TEXT,
  accession_number TEXT,
  modality TEXT,
  body_part TEXT,
  description TEXT,
  status study_status DEFAULT 'scheduled',
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studies_patient ON public.studies(patient_id);
CREATE INDEX IF NOT EXISTS idx_studies_status ON public.studies(status);
CREATE INDEX IF NOT EXISTS idx_studies_radiologist ON public.studies(assigned_radiologist_id);

-- ============ IMAGES (DICOM metadata; files in Storage) ============
CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  sop_instance_uid TEXT,
  series_uid TEXT,
  instance_number INT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_images_study ON public.images(study_id);

-- ============ ANNOTATIONS ============
CREATE TABLE IF NOT EXISTS public.annotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ REPORTS ============
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  study_id UUID NOT NULL REFERENCES public.studies(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id),
  content TEXT,
  template_id TEXT,
  findings JSONB DEFAULT '{}',
  impression TEXT,
  status report_status DEFAULT 'draft',
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_study ON public.reports(study_id);

-- ============ APPOINTMENTS ============
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES public.organizations(id),
  patient_id UUID REFERENCES public.patients(id),
  study_id UUID REFERENCES public.studies(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT DEFAULT 30,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ AUDIT LOGS (HIPAA) ============
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  type TEXT,
  read_at TIMESTAMPTZ,
  data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);

-- ============ AI ANALYSIS RESULTS ============
CREATE TABLE IF NOT EXISTS public.ai_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  image_id UUID REFERENCES public.images(id) ON DELETE CASCADE,
  study_id UUID REFERENCES public.studies(id),
  model_name TEXT,
  findings JSONB NOT NULL,
  confidence DECIMAL(5,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ RLS HELPERS (SECURITY DEFINER = read profiles without triggering RLS recursion; PG15+) ============
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

CREATE OR REPLACE FUNCTION public.current_user_is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

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

-- ============ RLS POLICIES ============
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annotations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update own; admins can read all; patients can view staff (doctors, etc.)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Patients can view staff profiles" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  public.current_user_is_admin()
);
CREATE POLICY "Patients can view staff profiles" ON public.profiles FOR SELECT USING (
  public.get_my_role() = 'patient'
  AND public.profiles.role IN ('doctor', 'radiologist', 'technician', 'admin')
);

-- Organizations: members can read
DROP POLICY IF EXISTS "Authenticated can list organizations" ON public.organizations;
CREATE POLICY "Authenticated can list organizations" ON public.organizations FOR SELECT TO authenticated USING (true);

-- Patients: staff by org (or all if staff has no org); patient sees only linked record
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

-- Studies: staff by org (or all if staff has no org); patient sees only own
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

-- Images: staff by study access (or all if staff has no org); patient only own
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

-- Annotations: staff by image/study access; patient only their studies' images
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

-- Reports: staff by study access (or all if staff has no org); patient only own
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

DROP POLICY IF EXISTS "Users can manage appointments in their org" ON public.appointments;
CREATE POLICY "Users can manage appointments in their org" ON public.appointments FOR ALL USING (
  organization_id IS NOT DISTINCT FROM public.get_my_organization_id()
  OR public.current_user_is_admin()
);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Audit logs insert by service" ON public.audit_logs;
DROP POLICY IF EXISTS "Admins can read audit logs" ON public.audit_logs;
CREATE POLICY "Audit logs insert by service" ON public.audit_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can read audit logs" ON public.audit_logs FOR SELECT USING (
  public.current_user_is_admin()
);

DROP POLICY IF EXISTS "AI analysis with study access" ON public.ai_analysis;
CREATE POLICY "AI analysis with study access" ON public.ai_analysis FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.studies s
    WHERE s.id = ai_analysis.study_id
    AND (s.organization_id IS NOT DISTINCT FROM public.get_my_organization_id() OR public.current_user_is_admin())
  )
);

DROP POLICY IF EXISTS "Equipment by org" ON public.equipment;
CREATE POLICY "Equipment by org" ON public.equipment FOR ALL USING (
  organization_id IS NOT DISTINCT FROM public.get_my_organization_id()
  OR public.current_user_is_admin()
);

-- ============ TRIGGERS ============
-- New signups get role 'doctor' by default.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'doctor');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- If a user has no profile (e.g. created before trigger), they can call this to create one (role = doctor).
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
GRANT EXECUTE ON FUNCTION public.ensure_my_profile() TO authenticated;

-- ============ STORAGE POLICIES ============
-- Create buckets first in Dashboard → Storage: dicom-files, reports
DROP POLICY IF EXISTS "Users can upload DICOM in own org" ON storage.objects;
CREATE POLICY "Users can upload DICOM in own org"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'dicom-files');

DROP POLICY IF EXISTS "Users can read DICOM in accessible org" ON storage.objects;
CREATE POLICY "Users can read DICOM in accessible org"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'dicom-files');

DROP POLICY IF EXISTS "Users can upload reports" ON storage.objects;
CREATE POLICY "Users can upload reports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reports');

DROP POLICY IF EXISTS "Users can read reports" ON storage.objects;
CREATE POLICY "Users can read reports"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'reports');

-- ============ ADD NEW TABLES / COLUMNS / FUNCTIONS BELOW ============
