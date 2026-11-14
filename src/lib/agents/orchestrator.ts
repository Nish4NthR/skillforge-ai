import type { SupabaseClient } from "@supabase/supabase-js";
import { careerAnalysisAgentOrder, agentRegistry } from "@/lib/agents/agent-registry";
import { loadAgentContext } from "@/lib/agents/execution-context";
import { persistAgentMessage } from "@/lib/agents/message-bus";
import { createAgentRun, finishAgentRun } from "@/lib/agents/run-manager";
import { normalizeAgentError } from "@/lib/ai/errors";
import type { AgentContext, AgentName, AgentOutputMap } from "@/lib/agents/types";

async function persistRoadmap(supabase: SupabaseClient, context: AgentContext, runId: string, outputs: Partial<AgentOutputMap>) {
  const roadmap = outputs.roadmap;
  const analysis = outputs.skill_gap;
  if (!roadmap || !analysis) return null;
  const { data: latest, error: latestError } = await supabase.from("roadmaps").select("version").eq("user_id", context.userId).order("version", { ascending: false }).limit(1).maybeSingle();
  if (latestError) throw latestError;
  const { data: activeRoadmap, error: activeRoadmapError } = await supabase.from("roadmaps").select("id").eq("user_id", context.userId).eq("status", "active").order("version", { ascending: false }).limit(1).maybeSingle();
  if (activeRoadmapError) throw activeRoadmapError;
  const previousStatuses = new Map<string, string>();
  if (activeRoadmap) {
    const { data: previousSteps, error: previousStepsError } = await supabase.from("roadmap_steps").select("skill_id,status").eq("roadmap_id", String((activeRoadmap as { id: string }).id));
    if (previousStepsError) throw previousStepsError;
    for (const step of (previousSteps ?? []) as Array<Record<string, unknown>>) previousStatuses.set(String(step.skill_id), String(step.status));
  }
  const nextVersion = Number((latest as { version?: number } | null)?.version ?? 0) + 1;
  const { error: archiveError } = await supabase.from("roadmaps").update({ status: "archived" }).eq("user_id", context.userId).eq("status", "active");
  if (archiveError) throw archiveError;
  const { data: roadmapRow, error: roadmapError } = await supabase.from("roadmaps").insert({ user_id: context.userId, role_id: analysis.role.id, version: nextVersion, status: "active", summary: roadmap.summary, source_run_id: runId }).select("id").single();
  if (roadmapError) throw roadmapError;
  const resourceBySkill = new Map((outputs.resource?.recommendations ?? []).map((item) => [item.skillId, item.resourceIds]));
  const steps = roadmap.steps.map((step, index) => ({ roadmap_id: String((roadmapRow as { id: string }).id), skill_id: step.skillId, position: index + 1, objective: step.objective, reason: step.reason, estimated_minutes: step.estimatedMinutes, priority: step.priority, completion_criteria: step.completionCriteria, status: ["completed", "in_progress", "needs_review"].includes(previousStatuses.get(step.skillId) ?? "") ? previousStatuses.get(step.skillId) : step.status, prerequisite_skill_ids: step.prerequisiteSkillIds, resource_ids: resourceBySkill.get(step.skillId) ?? [] }));
  if (steps.length) {
    const { error: stepsError } = await supabase.from("roadmap_steps").insert(steps);
    if (stepsError) throw stepsError;
  }
  return String((roadmapRow as { id: string }).id);
}

export async function runAdaptiveRecovery(supabase: SupabaseClient, userId: string, input: { skillId: string; score: number; weakConcepts: string[]; roleId?: string }) {
  let effectiveRoleId = input.roleId;
  if (!effectiveRoleId) {
    const { data: goal, error } = await supabase.from("goals").select("role_id").eq("user_id", userId).eq("active", true).maybeSingle();
    if (error) throw error;
    effectiveRoleId = goal ? String((goal as { role_id: string }).role_id) : undefined;
  }
  const context = await loadAgentContext(supabase, userId, effectiveRoleId);
  context.question = `The learner scored ${Math.round(input.score * 100)}% on an assessment. Weak concepts: ${input.weakConcepts.join(", ") || "general fundamentals"}. Explain the remediation plan and why the roadmap changed.`;
  context.selectedSkillId = input.skillId;
  const runId = await createAgentRun(supabase, userId, "adaptation", input);
  const outputs: Partial<AgentOutputMap> = {};
  try {
    for (const name of ["skill_gap", "roadmap", "resource"] as const) {
      const agent = agentRegistry[name];
      await persistAgentMessage(supabase, runId, { senderAgent: "orchestrator", receiverAgent: name, messageType: "input", payload: { dependencyOutputs: Object.keys(outputs), trigger: "assessment_below_threshold" } });
      const result = await agent.run(context, outputs);
      outputs[name] = result.output as never;
      await persistAgentMessage(supabase, runId, { senderAgent: name, receiverAgent: name === "skill_gap" ? "roadmap" : name === "roadmap" ? "resource" : "mentor", messageType: "output", payload: { output: result.output, explanation: result.explanation } });
    }
    const roadmapId = await persistRoadmap(supabase, context, runId, outputs);
    const analysis = outputs.skill_gap;
    const roadmap = outputs.roadmap;
    if (roadmapId && analysis && roadmap) context.activeRoadmap = { id: roadmapId, roleId: analysis.role.id, version: (context.activeRoadmap?.version ?? 0) + 1, status: "active", summary: roadmap.summary };
    const mentorResult = await agentRegistry.mentor.run(context, outputs);
    outputs.mentor = mentorResult.output as AgentOutputMap["mentor"];
    await persistAgentMessage(supabase, runId, { senderAgent: "mentor", messageType: "output", payload: { output: mentorResult.output, explanation: mentorResult.explanation } });
    const decision = {
      selectedPlan: "remedial-roadmap",
      proposals: [
        { agent: "skill_gap", summary: analysis ? `${analysis.gaps.length} role gaps recalculated` : "Gap analysis unavailable" },
        { agent: "roadmap", summary: roadmap?.summary ?? "Roadmap unavailable" },
        { agent: "resource", summary: `${outputs.resource?.recommendations.length ?? 0} remedial resource mappings` },
      ],
      rationale: "The learner fell below the 60% threshold, so prerequisite-aware remediation was selected and the Mentor Agent explained the next steps.",
    };
    await persistAgentMessage(supabase, runId, { senderAgent: "orchestrator", messageType: "decision", payload: decision });
    const result = { runId, roadmapId, analysis: outputs.skill_gap, roadmap: outputs.roadmap, resources: outputs.resource, mentor: outputs.mentor, decision };
    await finishAgentRun(supabase, runId, "completed", result);
    return result;
  } catch (error) {
    const normalized = normalizeAgentError(error);
    const message = normalized.message;
    await persistAgentMessage(supabase, runId, { senderAgent: "orchestrator", messageType: "error", payload: { message } });
    await finishAgentRun(supabase, runId, Object.keys(outputs).length ? "partial" : "failed", { outputs }, message);
    throw normalized;
  }
}

export async function runCareerAnalysis(supabase: SupabaseClient, userId: string, selectedRoleId?: string) {
  let effectiveRoleId = selectedRoleId;
  if (!effectiveRoleId) {
    const { data: goal, error } = await supabase.from("goals").select("role_id").eq("user_id", userId).eq("active", true).maybeSingle();
    if (error) throw error;
    effectiveRoleId = goal ? String((goal as { role_id: string }).role_id) : undefined;
  }
  const context = await loadAgentContext(supabase, userId, effectiveRoleId);
  const runId = await createAgentRun(supabase, userId, "career_analysis", { selectedRoleId: effectiveRoleId ?? null });
  const outputs: Partial<AgentOutputMap> = {};
  try {
    for (const name of careerAnalysisAgentOrder) {
      const agent = agentRegistry[name];
      await persistAgentMessage(supabase, runId, { senderAgent: "orchestrator", receiverAgent: name, messageType: "input", payload: { dependencyOutputs: Object.keys(outputs) } });
      const result = await agent.run(context, outputs);
      outputs[name] = result.output as never;
      await persistAgentMessage(supabase, runId, { senderAgent: name, receiverAgent: name === "profile" ? "skill_gap" : name === "skill_gap" ? "roadmap" : name === "roadmap" ? "resource" : undefined, messageType: "output", payload: { output: result.output, explanation: result.explanation } });
    }
    const decision = {
      selectedPlan: "roadmap",
      proposals: [
        { agent: "roadmap", summary: outputs.roadmap?.summary ?? "" },
        { agent: "resource", summary: `${outputs.resource?.recommendations.length ?? 0} resource mappings` },
      ],
      rationale: "The roadmap proposal wins because it satisfies prerequisite ordering; the Resource Agent enriches it with verified learning resources.",
    };
    await persistAgentMessage(supabase, runId, { senderAgent: "orchestrator", messageType: "decision", payload: decision });
    const roadmapId = await persistRoadmap(supabase, context, runId, outputs);
    const result = { runId, roadmapId, profile: outputs.profile, analysis: outputs.skill_gap, roadmap: outputs.roadmap, resources: outputs.resource, decision };
    await finishAgentRun(supabase, runId, "completed", result);
    return result;
  } catch (error) {
    const normalized = normalizeAgentError(error);
    const message = normalized.message;
    await persistAgentMessage(supabase, runId, { senderAgent: "orchestrator", messageType: "error", payload: { message } });
    await finishAgentRun(supabase, runId, Object.keys(outputs).length ? "partial" : "failed", { outputs }, message);
    throw normalized;
  }
}

export async function runSingleAgent(supabase: SupabaseClient, userId: string, agentName: Exclude<AgentName, "profile" | "skill_gap" | "roadmap" | "resource">, input: { roleId?: string; skillId?: string; question?: string }) {
  const context = await loadAgentContext(supabase, userId, input.roleId);
  context.question = input.question;
  context.selectedSkillId = input.skillId;
  const runType = agentName === "assessment" ? "assessment" : "mentor";
  const runId = await createAgentRun(supabase, userId, runType, input);
  try {
    const result = await agentRegistry[agentName].run(context, {});
    await persistAgentMessage(supabase, runId, { senderAgent: "orchestrator", receiverAgent: agentName, messageType: "output", payload: { output: result.output, explanation: result.explanation } });
    await finishAgentRun(supabase, runId, "completed", result.output);
    return { runId, ...result };
  } catch (error) {
    const normalized = normalizeAgentError(error);
    const message = normalized.message;
    await finishAgentRun(supabase, runId, "failed", undefined, message);
    throw normalized;
  }
}
