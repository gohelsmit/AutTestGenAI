# NextGen Medical Imaging – Setup

## 1. Supabase

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run the contents of `database/schema.sql`.
3. (Optional) Run `database/seed.sql` for demo data.
4. In **Storage**, create buckets:
   - `dicom-files` (private)
   - `reports` (private)
5. Add storage policies as in `docs/storage.md`.
6. Copy **Project URL** and **anon key** (and **service_role** for server use).

## 2. Environment

```bash
# Frontend (frontend/.env.local)
cp .env.example .env.local
# Edit .env.local with NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# Optional: AI_SERVICE_URL, NEXT_PUBLIC_AI_SERVICE_URL
```

## 3. Install and run

```bash
# From repo root
npm install
cd frontend && npm install && npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## 4. AI service (optional)

```bash
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload --port 8001
```

Then set `AI_SERVICE_URL=http://localhost:8001` (and optionally `NEXT_PUBLIC_AI_SERVICE_URL`) so the frontend can call `/api/ai-analysis`.

## 5. First user

1. Register via **Register** on the landing page.
2. Confirm email if Supabase email confirmation is enabled.
3. In Supabase **Table Editor** → `profiles`, set your user’s `role` to `admin` and optionally `organization_id` to a row in `organizations`.
