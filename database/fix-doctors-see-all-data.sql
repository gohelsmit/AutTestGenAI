-- Let doctors and all staff (doctor, radiologist, technician, admin) view ALL patients, studies, reports, images
-- regardless of organization. Run in Supabase SQL Editor once so existing data shows for doctors.

-- Patients
DROP POLICY IF EXISTS "Staff can view all patients" ON public.patients;
CREATE POLICY "Staff can view all patients" ON public.patients FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('doctor', 'radiologist', 'technician', 'admin')
);

-- Studies
DROP POLICY IF EXISTS "Staff can view all studies" ON public.studies;
CREATE POLICY "Staff can view all studies" ON public.studies FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('doctor', 'radiologist', 'technician', 'admin')
);

-- Reports
DROP POLICY IF EXISTS "Staff can view all reports" ON public.reports;
CREATE POLICY "Staff can view all reports" ON public.reports FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('doctor', 'radiologist', 'technician', 'admin')
);

-- Images
DROP POLICY IF EXISTS "Staff can view all images" ON public.images;
CREATE POLICY "Staff can view all images" ON public.images FOR SELECT USING (
  (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('doctor', 'radiologist', 'technician', 'admin')
);
