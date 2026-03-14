# Deployment

## Vercel (Frontend)

1. Push the repo to GitHub and import the project in Vercel.
2. Set **Root Directory** to `frontend`.
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `AI_SERVICE_URL` or `NEXT_PUBLIC_AI_SERVICE_URL` (if using AI)
4. Deploy. The app uses Next.js 14 App Router and server components.

## Supabase

- Database and Auth are already in Supabase; no extra backend deploy for them.
- Storage is Supabase Storage; ensure buckets and RLS are set as in `docs/storage.md`.

### Auth URL configuration (fixes "OAuth authorization request does not exist")

In **Supabase Dashboard → Authentication → URL Configuration** set:

- **Site URL:** `http://localhost:3000` (dev) or `https://your-domain.com` (prod)
- **Redirect URLs:** add:
  - `http://localhost:3000/auth/callback`
  - `https://your-domain.com/auth/callback` (when deployed)

If you only use **email/password** login, always open the app at `/login` and sign in there; ignore old OAuth links or emails.

## AI service

- Deploy the `ai-service` (FastAPI) to a container host (e.g. Railway, Render, Fly.io, or a VM).
- Set the deployed URL in Vercel env as `AI_SERVICE_URL` / `NEXT_PUBLIC_AI_SERVICE_URL` so `/api/ai-analysis` can proxy to it.

## Checklist

- [ ] Supabase project created and schema run
- [ ] Storage buckets and policies configured
- [ ] Env vars set in Vercel
- [ ] AI service deployed and URL configured (if used)
- [ ] First user created and role set in `profiles`
