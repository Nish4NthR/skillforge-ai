# Security audit status

## Verified in source

- Private route handlers call `requireUser()` and derive the user ID from the Supabase session.
- New learner-owned tables have RLS policies scoped to `auth.uid()`.
- Assessment answer keys are stored separately from learner-readable question rows.
- The service-role key is referenced only by `src/lib/supabase/admin.ts`, which is imported by server route handlers.
- Gemini keys and prompts are not imported by client components.
- BKT, grading, gap scoring, and prerequisite ordering are deterministic TypeScript logic.
- AI outputs are validated through Zod schemas.
- API errors no longer return arbitrary database or model error messages.
- `.env.example` contains placeholders only; server credentials are not committed there.
- Next middleware is located beside `src/app` and the production build includes a non-empty middleware manifest for protected-route checks.

## Requires external verification

- Apply migrations `001`–`006` to Supabase.
- Run a two-user isolation test for profiles, roadmaps, assessments, attempts, mastery history, mentor messages, and agent runs.
- Confirm the service-role key is absent from browser bundles and Vercel client environment variables.
- Configure rate limiting for Gemini-backed endpoints before public deployment.
- Verify Supabase Realtime publication and cleanup in production.
- Rotate any credential-shaped values that may previously have been used outside the repository, then configure fresh values only in local/deployment secret stores.
