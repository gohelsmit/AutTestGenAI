# NextGen Medical Imaging Platform

Cloud-native PACS (Picture Archiving and Communication System) for digital X-ray imaging, patient management, radiologist workflows, AI diagnostics, and secure cloud storage. Built with **Next.js 14**, **Supabase**, and **Vercel**.

## Features

- **Patient management** – Registration, demographics, medical history, imaging timeline
- **Study management** – Create studies, attach DICOM images, assign radiologist, track status
- **DICOM** – Upload, store in Supabase Storage, metadata in PostgreSQL
- **Medical image viewer** – Placeholder for Cornerstone.js (zoom, pan, WL); DICOM upload and list
- **Radiologist workflow** – Pending studies, open viewer, create reports, sign diagnosis
- **Report generation** – Structured content, impression, draft/signed, digital signature support
- **AI diagnostics** – FastAPI microservice for analysis (fractures, lung opacity, quality); frontend calls `/api/ai-analysis`
- **Auth & security** – Supabase Auth, role-based access (Admin, Radiologist, Technician, Doctor, Patient), RLS, audit-ready design
- **Cloud storage** – Supabase Storage (S3-compatible), secure access

## Tech stack

| Layer     | Technology |
|----------|------------|
| Frontend | Next.js 14 (App Router), TypeScript, TailwindCSS, Shadcn UI |
| Backend  | Supabase (PostgreSQL, Auth, Storage) |
| Medical  | DICOM upload & storage; Cornerstone.js/DICOMweb can be added for full viewer (zoom, WL) |
| AI       | Python FastAPI microservice |
| Hosting  | Vercel (frontend), Supabase (DB/Auth/Storage) |

## Quick start

### Prerequisites

- Node.js 18+
- Supabase account
- (Optional) Python 3.10+ for AI service

### 1. Clone and env

```bash
cd hack-2026
cp .env.example .env.local
```

Edit `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` – from Supabase project settings
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – from Supabase project settings

### 2. Supabase setup

1. Create a new project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run `database/schema.sql`.
3. In **Storage**, create buckets: `dicom-files`, `reports` (private). Add policies per `docs/storage.md`.

### 3. Install and run

```bash
npm install
cd frontend && npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Register a user; then in Supabase **Table Editor** → `profiles`, set `role` to `admin` and optionally link `organization_id`.

### 4. (Optional) AI service

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Set `AI_SERVICE_URL=http://localhost:8001` in `.env.local` to use AI analysis from the app.

## Project structure

```
frontend/       Next.js 14 app (App Router)
ai-service/     FastAPI AI microservice
database/       Supabase schema and seed
scripts/        Setup helpers
docs/           Storage and deployment
```

## Environment variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only (e.g. Edge Functions) |
| `AI_SERVICE_URL` | AI service base URL for API route proxy |
| `NEXT_PUBLIC_AI_SERVICE_URL` | Optional; if frontend calls AI directly |

## Deployment

- **Frontend**: Deploy `frontend` to Vercel; set root directory to `frontend` and add env vars.
- **Database/Auth/Storage**: Handled by Supabase.
- **AI**: Deploy `ai-service` to a container or serverless platform and set `AI_SERVICE_URL`.

See `docs/deployment.md` and `scripts/setup.md` for step-by-step instructions.

## License

Proprietary – for healthcare use. Ensure HIPAA and local compliance for your deployment.
