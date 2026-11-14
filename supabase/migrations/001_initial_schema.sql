create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 100),
  github_username text check (github_username is null or char_length(github_username) between 1 and 39),
  hours_per_week numeric not null default 5 check (hours_per_week between 1 and 80),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.certifications (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, issuer text not null, year integer not null check (year between 1950 and extract(year from now())::integer),
  unique(user_id, title, issuer)
);
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null, description text, repo_url text check (repo_url is null or repo_url ~* '^https?://'), unique(user_id, title)
);

create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(), name text not null unique, category text not null, description text not null default ''
);
create table if not exists public.skill_prerequisites (
  skill_id uuid not null references public.skills(id) on delete cascade,
  prerequisite_id uuid not null references public.skills(id) on delete cascade,
  primary key(skill_id, prerequisite_id), check(skill_id <> prerequisite_id)
);
create table if not exists public.learner_skills (
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  claimed_level integer not null default 0 check (claimed_level between 0 and 5),
  evidence_score numeric not null default 0 check (evidence_score between 0 and 1),
  p_known numeric not null default 0.1 check (p_known between 0 and 1),
  confidence numeric not null default 0 check (confidence between 0 and 1),
  status text not null default 'developing' check (status in ('mastered', 'developing', 'not_started')),
  updated_at timestamptz not null default now(), primary key(user_id, skill_id)
);
create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(), name text not null unique, description text not null default ''
);
create table if not exists public.role_skills (
  role_id uuid not null references public.roles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete cascade,
  required_level numeric not null check (required_level between 0 and 1), importance numeric not null check (importance between 0 and 1),
  primary key(role_id, skill_id)
);
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(), skill_id uuid not null references public.skills(id) on delete cascade,
  title text not null, url text not null check (url ~* '^https?://'), type text not null check (type in ('documentation','course','tutorial','video','book')),
  difficulty text not null default 'beginner' check (difficulty in ('beginner','intermediate','advanced')), est_minutes integer not null check (est_minutes > 0), provider text not null
);
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict, active boolean not null default true, created_at timestamptz not null default now()
);

create index if not exists learner_skills_user_idx on public.learner_skills(user_id);
create index if not exists resources_skill_idx on public.resources(skill_id);
create index if not exists goals_user_active_idx on public.goals(user_id, active);
create index if not exists role_skills_role_idx on public.role_skills(role_id);

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute procedure public.set_updated_at();
