import type { SkillPrerequisite } from "@/types/skill";

export interface SkillGraph {
  nodes: Set<string>;
  prerequisites: Map<string, Set<string>>;
  dependents: Map<string, Set<string>>;
}

export function buildSkillGraph(edges: SkillPrerequisite[], nodeIds: string[] = []): SkillGraph {
  const nodes = new Set(nodeIds);
  const prerequisites = new Map<string, Set<string>>();
  const dependents = new Map<string, Set<string>>();
  for (const edge of edges) {
    if (!edge.skillId || !edge.prerequisiteId || edge.skillId === edge.prerequisiteId) throw new Error("Invalid prerequisite edge");
    nodes.add(edge.skillId); nodes.add(edge.prerequisiteId);
    if (!prerequisites.has(edge.skillId)) prerequisites.set(edge.skillId, new Set());
    if (!dependents.has(edge.prerequisiteId)) dependents.set(edge.prerequisiteId, new Set());
    prerequisites.get(edge.skillId)!.add(edge.prerequisiteId);
    dependents.get(edge.prerequisiteId)!.add(edge.skillId);
  }
  if (hasCycle({ nodes, prerequisites, dependents })) throw new Error("Circular prerequisite dependency detected");
  return { nodes, prerequisites, dependents };
}

export function hasCycle(graph: SkillGraph) {
  try { topologicalSort(graph); return false; } catch { return true; }
}

export function topologicalSort(graph: SkillGraph): string[] {
  const indegree = new Map<string, number>();
  for (const node of graph.nodes) indegree.set(node, graph.prerequisites.get(node)?.size ?? 0);
  const queue = [...graph.nodes].filter((node) => indegree.get(node) === 0).sort();
  const result: string[] = [];
  while (queue.length) {
    const node = queue.shift()!; result.push(node);
    for (const dependent of graph.dependents.get(node) ?? []) {
      const next = indegree.get(dependent)! - 1; indegree.set(dependent, next);
      if (next === 0) queue.push(dependent);
    }
  }
  if (result.length !== graph.nodes.size) throw new Error("Circular prerequisite dependency detected");
  return result;
}

export function getPrerequisites(graph: SkillGraph, skillId: string) { return [...(graph.prerequisites.get(skillId) ?? [])]; }
export function getDependents(graph: SkillGraph, skillId: string) { return [...(graph.dependents.get(skillId) ?? [])]; }

export function getMissingPrerequisites(graph: SkillGraph, skillId: string, masteredSkillIds: Set<string>) {
  return getPrerequisites(graph, skillId).filter((id) => !masteredSkillIds.has(id));
}
