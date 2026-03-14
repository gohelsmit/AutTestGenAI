-- Seed data for development (optional)
-- Run after schema.sql

INSERT INTO public.organizations (id, name, slug) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'NextGen Demo Hospital', 'demo-hospital');

-- Create demo users via Supabase Auth (use Dashboard or API), then:
-- UPDATE public.profiles SET role = 'admin', organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE email = 'admin@nextgen.io';
-- UPDATE public.profiles SET role = 'radiologist', organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE email = 'radio@nextgen.io';
-- UPDATE public.profiles SET role = 'technician', organization_id = 'a0000000-0000-0000-0000-000000000001' WHERE email = 'tech@nextgen.io';

INSERT INTO public.patients (organization_id, mrn, first_name, last_name, date_of_birth, gender) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'MRN001', 'John', 'Doe', '1980-05-15', 'M'),
  ('a0000000-0000-0000-0000-000000000001', 'MRN002', 'Jane', 'Smith', '1975-08-22', 'F');
