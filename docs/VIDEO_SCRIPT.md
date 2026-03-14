# Video Script — Doctor Side Only (5 min)

**Hackathon:** March 14, 2026 · 10 Hours · Solo  
**Stack:** Next.js + Supabase · **Deploy:** Vercel · **AI:** Claude CLI / Codex CLI

---

## 0:00 – 0:30 · Opening
- Hi, I'm [name]. This is **NextGen Medical Imaging** — a radiology workflow app for doctors, built with **Next.js** and **Supabase**, deployed on **Vercel**. I used **[Claude / Codex] CLI** throughout the 10-hour build.
- **Show:** Live app URL in browser.

---

## 0:30 – 1:00 · Login & Dashboard
- I log in as a doctor. The dashboard shows counts for **Patients**, **Studies**, and **Reports**, and a list of recent studies.
- **Show:** Login → Dashboard with stats and recent studies.

---

## 1:00 – 2:00 · Patients
- From **Patients** I can see all patients and **Add patient**. I'll add one: name, MRN, DOB, contact. After saving, they appear in the list. I can open a patient to see demographics and their imaging history.
- **Show:** Patients list → Add patient → fill form → save → open patient detail.

---

## 2:00 – 3:00 · Studies
- Under **Studies** I click **New study**, pick the patient I just added, set modality and body part, and save. The study appears in the list. I open it to see study info, and I can **upload DICOM** files here. There’s also an **AI Analysis** panel: I click **Run analysis** and get findings — it uses a mock when the AI service isn’t running, so the flow still works.
- **Show:** Studies → New study → select patient → save → open study → (optional) upload → Run analysis → show result.

---

## 3:00 – 4:00 · Reports
- For this study I open **Report**. I type findings and impression, then **Save draft**. When ready I can **Sign report**. Everything is stored in Supabase with Row Level Security so only the right roles see the right data.
- **Show:** Report tab → type content → Save draft → (optional) Sign report.

---

## 4:00 – 5:00 · Tech & Conclusion
- The app is **Next.js 14** and **Supabase** — auth, database, and storage — on **Vercel**. Access is controlled with RLS so doctors see full data. I used **[Claude / Codex] CLI** for the schema, policies, pages, and fixes.
- **Conclusion:** NextGen Medical Imaging — doctor workflow from dashboard to patients, studies, AI analysis, and reports — built in 10 hours with Next.js, Supabase, and **[Claude / Codex] CLI**. Thanks for watching.
- **Show:** Dashboard or login with your Vercel URL visible.
