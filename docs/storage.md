# Supabase Storage Setup

## Buckets

Create these buckets in Supabase Dashboard → Storage:

1. **dicom-files** – Private, for DICOM images. Path: `{org_id}/{study_id}/{filename}`.
2. **reports** – Private, for generated PDF reports.

## RLS for Storage

**Do not run `storage.md` in the SQL Editor** — it is Markdown, not SQL.

In Supabase **SQL Editor**, open and run the file **`database/storage-policies.sql`** (copy its contents into the editor and run). That file contains only the storage policies.

## Frontend Usage

Use `supabase.storage.from('dicom-files').upload(path, file)` and `createSignedUrl()` for viewer access.
