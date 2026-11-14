import { buildSkillGraph, getMissingPrerequisites } from "./skill-graph";
import type { SkillPrerequisite } from "@/types/skill";

export function validatePrerequisiteEdge(edges: SkillPrerequisite[], edge: SkillPrerequisite, nodeIds: string[] = []) {
  if (!nodeIds.includes(edge.skillId) || !nodeIds.includes(edge.prerequisiteId)) return { valid: false, reason: "Both skills must exist" };
  try { buildSkillGraph([...edges, edge], nodeIds); return { valid: true as const }; }
  catch (error) { return { valid: false as const, reason: error instanceof Error ? error.message : "Invalid graph" }; }
}

export function blockedSkillRelationships(edges: SkillPrerequisite[], skillId: string, masteredSkillIds: Set<string>, nodeIds: string[] = []) {
  const graph = buildSkillGraph(edges, nodeIds);
  return getMissingPrerequisites(graph, skillId, masteredSkillIds);
}
