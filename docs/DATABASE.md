# Database guide

Run migrations in order:

1. `001_initial_schema.sql` — learner profile, catalog, roles, goals.
2. `002_skill_catalog.sql` — catalog constraints.
3. `003_career_roles.sql` — career checkpoint.
4. `004_rls_policies.sql` — Phase 1 ownership and catalog policies.
5. `005_learning_agents.sql` — roadmaps, assessments, attempts, mastery history, agent runs/messages, mentor messages, simulations, and RLS.
6. `006_assessment_answer_key_security.sql` — moves assessment answer keys to a server-only table and removes them from learner-readable questions.

Learner-owned tables derive ownership from `auth.uid()`. The `questions` table contains only learner-safe question data. Answer keys are stored in `assessment_answer_keys`, which has no anon/authenticated access and is read only through the server service-role client. Grading reads the key server-side, inserts an immutable attempt, and then updates learner mastery through BKT.
