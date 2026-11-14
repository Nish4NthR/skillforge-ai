# SkillForge architecture

SkillForge keeps numerical learning decisions deterministic and uses Gemini for bounded explanation and content generation.

```text
Next.js UI
  -> authenticated route handlers
    -> Supabase session + RLS
      -> deterministic learning services (BKT, graph, gap, grading)
      -> persisted agent orchestrator
        Profile -> Skill Gap -> Roadmap -> Resource
        Assessment and Mentor run independently
          -> agent_runs / agent_messages
          -> roadmaps / assessments / mastery_history / mentor_messages
```

The orchestrator is sequential where outputs are dependencies. Each run is persisted before execution and marked completed, partial, or failed. A serverless request can therefore be inspected after refresh; the current implementation is bounded and synchronous, with a future durable queue as the natural scale-up path.

Gemini is server-only. All model output is parsed with Zod, and the model is never trusted to calculate mastery, gaps, prerequisite order, grading, or authorization.
