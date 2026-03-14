-- Supabase Storage RLS policies
-- Run this in Supabase SQL Editor AFTER creating buckets: dicom-files, reports (Dashboard → Storage)

-- Allow authenticated users to upload DICOM
CREATE POLICY "Users can upload DICOM in own org"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'dicom-files');

-- Allow authenticated users to read DICOM
CREATE POLICY "Users can read DICOM in accessible org"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'dicom-files');

-- Allow authenticated users to upload reports
CREATE POLICY "Users can upload reports"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'reports');

-- Allow authenticated users to read reports
CREATE POLICY "Users can read reports"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'reports');
