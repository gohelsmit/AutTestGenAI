# Database (Supabase)

## Fresh or empty DB: one file (first to last)

**`full-database.sql`** — Run this **one file** in Supabase SQL Editor when you want a clean database. It **drops** all project tables and enums first, then **creates** them again (so you get new empty tables). Run from top to bottom. Then create Storage buckets: `dicom-files`, `reports` (Dashboard → Storage).

---

## Main file: use this for everything

**`schema.sql`** — Full database definition. Use this file for all new work.

- Tables, enums, indexes  
- RLS policies  
- Triggers and functions (`handle_new_user`, `ensure_my_profile`, `get_my_role`, `get_my_organization_id`, `get_my_linked_patient_id`, `current_user_is_admin`)  
- Storage policies (after you create buckets `dicom-files` and `reports` in Dashboard → Storage)

**When you add something new** (table, column, policy, function): add it to **`schema.sql`**, in the right section or at the end under “ADD NEW … BELOW”.

Run **`schema.sql`** in Supabase SQL Editor for a new project (or to re-apply the full schema).

---

## Other files (optional / one-time)

| File | When to use |
|------|-------------|
| **seed.sql** | Optional sample data (orgs, etc.). Run after schema if you want seed data. |
| **fix-default-role-patient.sql** | Existing DB only: set default role to `patient`, add `linked_patient_id`, fix `handle_new_user`. |
| **fix-ensure-my-profile.sql** | Existing DB only: add `ensure_my_profile()` if missing. |
| **fix-get-my-role.sql** | Existing DB only: add `get_my_role()` if missing. |
| **fix-linked-patient-rls.sql** | Existing DB only: patient-only RLS and org policy updates. |
| **fix-patients-view-doctors.sql** | Existing DB only: allow patients to view staff profiles. |
| **fix-staff-no-org-see-all.sql** | Existing DB only: staff with no org can see all patients/studies/reports/images. |
| **fix-rls-organization-null.sql** | Existing DB only: RLS fixes for null organization. |
| **fix-rls-recursion-profiles.sql** | **Run if you see "infinite recursion detected in policy for relation profiles".** Adds RLS-safe helpers and updates policies so doctors can load data. |
| **fix-everyone-doctor.sql** | Set default role to doctor and make all existing users doctors (new signups and ensure_my_profile also use doctor). |
| **backfill-profiles.sql** | One-time: create `profiles` rows for auth users that don’t have one. |

**storage-policies.sql** — Same content as the storage section in `schema.sql`. Kept for reference; prefer running **schema.sql** so everything stays in one place.
