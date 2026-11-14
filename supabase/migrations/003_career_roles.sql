-- Career roles and their weighted requirements are seeded in supabase/seed.sql.
-- A learner may keep historical inactive goals, but only one can be active.
alter table public.goals drop constraint if exists one_active_goal_per_user;
create unique index if not exists one_active_goal_per_user_idx on public.goals(user_id) where active;
