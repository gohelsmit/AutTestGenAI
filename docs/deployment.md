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

## Vercel troubleshooting (deployment shows "Error")

If a deployment shows **Error** in Vercel (e.g. for a commit like "Merge remote main, keep NextGen README"):

1. **Set Root Directory**  
   **Project → Settings → General → Root Directory**  
   Set to `frontend` and save. Without this, Vercel builds from the repo root where there is no Next.js app, so the build fails.

2. **Redeploy**  
   **Deployments** tab → open the failed deployment → **Redeploy**, or push a new commit.

3. **Environment variables**  
   **Settings → Environment Variables**  
   Ensure `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set for Production (and Preview if you use preview URLs).

4. **Build logs**  
   Open the failed deployment and check **Building** / **Logs** for the exact error (e.g. missing env, TypeScript error, or "no such file"). The message "Command \"npm run build\" exited with 1" is only the exit code—scroll up in the log to see the real TypeScript or build error.

5. **Ensure latest code is deployed**  
   Push and deploy the commit that includes the `server.ts` fetch type fix (parameter types for `url` and `init`). If the build was from an older commit, redeploy after pushing.
