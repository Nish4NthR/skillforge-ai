create table if not exists public.roadmaps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete restrict,
  version integer not null default 1 check (version > 0),
  status text not null default 'active' check (status in ('draft', 'active', 'archived')),
  summary text not null default '',
  source_run_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, version)
);

create table if not exists public.roadmap_steps (
  id uuid primary key default gen_random_uuid(),
  roadmap_id uuid not null references public.roadmaps(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  position integer not null check (position > 0),
  objective text not null,
  reason text not null,
  estimated_minutes integer not null check (estimated_minutes > 0),
  priority text not null check (priority in ('high', 'medium', 'low')),
  completion_criteria text not null,
  status text not null default 'locked' check (status in ('locked', 'not_started', 'in_progress', 'completed', 'needs_review')),
  prerequisite_skill_ids uuid[] not null default '{}',
  resource_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(roadmap_id, position)
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  roadmap_step_id uuid references public.roadmap_steps(id) on delete set null,
  status text not null default 'ready' check (status in ('ready', 'in_progress', 'submitted', 'expired')),
  difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'advanced')),
  question_count integer not null default 0 check (question_count >= 0),
  score numeric check (score is null or (score between 0 and 1)),
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);

create table if not exists public.questions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  question_text text not null,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  options jsonb not null check (jsonb_typeof(options) = 'array'),
  correct_answer text not null,
  explanation text not null,
  concept text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.attempts (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  correct_count integer not null check (correct_count >= 0),
  total_count integer not null check (total_count > 0),
  score numeric not null check (score between 0 and 1),
  created_at timestamptz not null default now(),
  unique(assessment_id, user_id)
);

create table if not exists public.attempt_answers (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.attempts(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete restrict,
  answer text not null,
  is_correct boolean not null,
  created_at timestamptz not null default now(),
  unique(attempt_id, question_id)
);

create table if not exists public.mastery_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  skill_id uuid not null references public.skills(id) on delete restrict,
  attempt_id uuid references public.attempts(id) on delete set null,
  source text not null check (source in ('onboarding', 'assessment', 'manual', 'adaptation')),
  observation text not null check (observation in ('prior', 'correct', 'incorrect')),
  prior_p_known numeric not null check (prior_p_known between 0 and 1),
  posterior_p_known numeric not null check (posterior_p_known between 0 and 1),
  updated_p_known numeric not null check (updated_p_known between 0 and 1),
  created_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  run_type text not null check (run_type in ('career_analysis', 'assessment', 'mentor', 'adaptation', 'simulation')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed', 'partial')),
  input jsonb not null default '{}'::jsonb,
  final_result jsonb,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'roadmaps_source_run_fk') then
    alter table public.roadmaps add constraint roadmaps_source_run_fk foreign key (source_run_id) references public.agent_runs(id) on delete set null;
  end if;
end $$;

create table if not exists public.agent_messages (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.agent_runs(id) on delete cascade,
  sender_agent text not null,
  receiver_agent text,
  message_type text not null check (message_type in ('input', 'output', 'recommendation', 'decision', 'error')),
  payload jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.mentor_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null check (char_length(content) between 1 and 12000),
  context jsonb not null default '{}'::jsonb,
  agent_run_id uuid references public.agent_runs(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.sim_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  persona text not null check (persona in ('fast_learner', 'struggling_learner', 'career_switcher')),
  status text not null default 'queued' check (status in ('queued', 'running', 'completed', 'failed')),
  input jsonb not null default '{}'::jsonb,
  result jsonb,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

alter table public.sim_runs add column if not exists user_id uuid references auth.users(id) on delete cascade;

create index if not exists roadmaps_user_status_idx on public.roadmaps(user_id, status);
create index if not exists roadmap_steps_roadmap_position_idx on public.roadmap_steps(roadmap_id, position);
create index if not exists assessments_user_created_idx on public.assessments(user_id, created_at desc);
create index if not exists questions_assessment_idx on public.questions(assessment_id);
create index if not exists attempts_user_created_idx on public.attempts(user_id, created_at desc);
create index if not exists mastery_history_user_skill_idx on public.mastery_history(user_id, skill_id, created_at desc);
create index if not exists agent_runs_user_created_idx on public.agent_runs(user_id, created_at desc);
create index if not exists agent_messages_run_created_idx on public.agent_messages(run_id, created_at);
create index if not exists mentor_messages_user_created_idx on public.mentor_messages(user_id, created_at);
create index if not exists sim_runs_user_created_idx on public.sim_runs(user_id, created_at desc);

drop trigger if exists roadmaps_updated_at on public.roadmaps;
create trigger roadmaps_updated_at before update on public.roadmaps for each row execute procedure public.set_updated_at();
drop trigger if exists roadmap_steps_updated_at on public.roadmap_steps;
create trigger roadmap_steps_updated_at before update on public.roadmap_steps for each row execute procedure public.set_updated_at();

alter table public.roadmaps enable row level security;
alter table public.roadmap_steps enable row level security;
alter table public.assessments enable row level security;
alter table public.questions enable row level security;
alter table public.attempts enable row level security;
alter table public.attempt_answers enable row level security;
alter table public.mastery_history enable row level security;
alter table public.agent_runs enable row level security;
alter table public.agent_messages enable row level security;
alter table public.mentor_messages enable row level security;
alter table public.sim_runs enable row level security;

drop policy if exists "roadmaps own rows" on public.roadmaps;
create policy "roadmaps own rows" on public.roadmaps for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "roadmap steps own rows" on public.roadmap_steps;
create policy "roadmap steps own rows" on public.roadmap_steps for all using (exists (select 1 from public.roadmaps r where r.id = roadmap_id and r.user_id = auth.uid())) with check (exists (select 1 from public.roadmaps r where r.id = roadmap_id and r.user_id = auth.uid()));
drop policy if exists "assessments own rows" on public.assessments;
create policy "assessments own rows" on public.assessments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "questions own rows" on public.questions;
create policy "questions own rows" on public.questions for all using (exists (select 1 from public.assessments a where a.id = assessment_id and a.user_id = auth.uid())) with check (exists (select 1 from public.assessments a where a.id = assessment_id and a.user_id = auth.uid()));
drop policy if exists "attempts own rows" on public.attempts;
create policy "attempts own rows" on public.attempts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "attempt answers own rows" on public.attempt_answers;
create policy "attempt answers own rows" on public.attempt_answers for all using (exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = auth.uid())) with check (exists (select 1 from public.attempts a where a.id = attempt_id and a.user_id = auth.uid()));
drop policy if exists "mastery history own rows" on public.mastery_history;
create policy "mastery history own rows" on public.mastery_history for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "agent runs own rows" on public.agent_runs;
create policy "agent runs own rows" on public.agent_runs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "agent messages own rows" on public.agent_messages;
create policy "agent messages own rows" on public.agent_messages for all using (exists (select 1 from public.agent_runs r where r.id = run_id and r.user_id = auth.uid())) with check (exists (select 1 from public.agent_runs r where r.id = run_id and r.user_id = auth.uid()));
drop policy if exists "mentor messages own rows" on public.mentor_messages;
create policy "mentor messages own rows" on public.mentor_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "simulation runs own rows" on public.sim_runs;
create policy "simulation runs own rows" on public.sim_runs for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
