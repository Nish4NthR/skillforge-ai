-- Skill catalog relationships are seeded in supabase/seed.sql.
-- Keep this migration as a deployable catalog checkpoint for Supabase CLI workflows.
alter table public.skills add constraint skills_category_not_empty check (char_length(trim(category)) > 0);
