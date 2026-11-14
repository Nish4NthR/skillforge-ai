create table if not exists public.assessment_answer_keys (
  question_id uuid primary key references public.questions(id) on delete cascade,
  correct_answer text not null,
  explanation text not null
);

do $$ begin
  if exists (select 1 from information_schema.columns where table_schema = 'public' and table_name = 'questions' and column_name = 'correct_answer') then
    insert into public.assessment_answer_keys(question_id, correct_answer, explanation)
    select id, correct_answer, explanation from public.questions
    where correct_answer is not null
    on conflict (question_id) do nothing;
  end if;
end $$;

alter table public.questions drop column if exists correct_answer;
alter table public.assessment_answer_keys enable row level security;
revoke all on public.assessment_answer_keys from anon, authenticated;
