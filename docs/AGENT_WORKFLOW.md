# Agent workflow

## Career analysis

`POST /api/agents/run` with `{ "type": "career_analysis" }` creates a persisted run and executes:

1. Profile Agent separates claims from evidence.
2. Skill Gap Agent computes role coverage using deterministic gap scoring.
3. Roadmap Agent orders missing skills using the prerequisite graph.
4. Resource Agent attaches verified catalog resources.
5. The orchestrator persists the roadmap version and final result.

The Assessment Agent is invoked by `POST /api/assessment/generate`; the Mentor Agent is invoked by `POST /api/mentor`. All runs and messages are available through `/api/agents/runs` and the Agent Activity page.

The UI shows fallback behavior when `GEMINI_API_KEY` is absent. This is not presented as a live Gemini execution.

## Adaptive recovery

An assessment score below 60% starts an `adaptation` run. The orchestrator recalculates deterministic skill gaps, generates a prerequisite-aware roadmap, matches curated resources, and invokes the Mentor Agent with the weak concepts and proposed roadmap. The new roadmap version preserves prior `completed`, `in_progress`, and `needs_review` statuses for matching skills. The final decision and Mentor explanation are persisted in `agent_messages` and returned to the assessment UI.
