# Data not showing – checklist

If **Patients**, **Studies**, or **Reports** (or dashboard counts) are empty but you have rows in the DB, use this checklist.

## 1. Check you are logged in

- Open the app, confirm you see the dashboard (not the login page).
- If you see the login page, sign in with the same user that has data in the DB.

## 2. Check your role in the database

- In **Supabase → Table Editor → `profiles`**, find the row where **email** = your login email.
- Check **role**. For staff (doctors, admins):
  - **doctor** / **admin** / **technician** / **radiologist** → can see data (subject to org below).
  - **patient** → can only see data linked via `linked_patient_id` (one patient, their studies/reports).

## 3. Organization (staff only)

RLS uses **organization_id**:

- **Staff with `organization_id` = NULL**  
  → Can see **all** patients, studies, and reports (no org filter).
- **Staff with `organization_id` = some UUID**  
  → Can only see rows (patients, studies, etc.) that have the **same** `organization_id`.

So:

- To see **all** data: set **`profiles.organization_id`** to **NULL** for your user (in `profiles` table).
- To see only one org’s data: create an organization, set your `profiles.organization_id` to that org’s id, and set the same `organization_id` on the **patients** (and studies) you want to see.

## 4. Patient role

- If your **role** is **patient**, you only see:
  - The **one** patient row where `patients.id` = your **`profiles.linked_patient_id`**.
  - Studies and reports for that patient only.
- If **`linked_patient_id`** is **NULL** → you see no patients/studies/reports until an admin/doctor links your profile to a patient.

## 5. Error message on the page

- If the app shows **“Could not load patients/studies/reports: …”** with a message, that is the Supabase/RLS error.
- Use that message to fix (e.g. missing table, RLS policy, or permission).

## 6. Quick test: see all data as staff

1. In **Supabase → profiles**, set your user’s **organization_id** to **NULL** and **role** to **doctor** (or **admin**).
2. Refresh the app and open **Patients** / **Studies** / **Reports** again.

You should then see all rows that exist in the DB (for that project).
