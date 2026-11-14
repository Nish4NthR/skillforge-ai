# Vercel deployment checklist

Configure these environment variables in Vercel:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)
- `GEMINI_API_KEY`
- `GEMINI_MODEL` (recommended: `gemini-3.8-flash`; keep this on a currently available stable Gemini model)

Before deploying:

1. Apply all six migrations to the production Supabase project.
2. Run the seed script once.
3. Enable email/password Auth.
4. Set the Supabase Site URL and `/auth/callback` redirect to the Vercel URL.
5. Verify RLS with two separate users.
6. Run `npm run build` and check `/login`, onboarding, `/roadmap`, `/assessment/[id]`, `/mentor`, and `/activity`.
7. Confirm Gemini failures return safe errors and do not expose the API key.
8. Install the Playwright Chromium browser before running `npm run test:e2e`; authenticated journeys require a configured test Supabase project.

No real credentials belong in `.env.example`, source control, or client-side code.
