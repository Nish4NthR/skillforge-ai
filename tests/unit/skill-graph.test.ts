import { describe, expect, it } from "vitest";
import { buildSkillGraph, getDependents, getMissingPrerequisites, getPrerequisites, topologicalSort } from "@/lib/skills/skill-graph";

describe("skill graph", () => {
  const edges = [{ skillId: "react", prerequisiteId: "js" }, { skillId: "next", prerequisiteId: "react" }, { skillId: "next", prerequisiteId: "node" }];
  it("sorts prerequisite chains", () => { const graph = buildSkillGraph(edges, ["js", "node", "react", "next"]); expect(topologicalSort(graph).indexOf("js")).toBeLessThan(topologicalSort(graph).indexOf("react")); });
  it("supports multiple prerequisites and lookups", () => { const graph = buildSkillGraph(edges); expect(getPrerequisites(graph, "next")).toHaveLength(2); expect(getDependents(graph, "react")).toEqual(["next"]); });
  it("rejects cycles", () => expect(() => buildSkillGraph([...edges, { skillId: "js", prerequisiteId: "next" }])).toThrow(/Circular/));
  it("finds missing prerequisites", () => expect(getMissingPrerequisites(buildSkillGraph(edges), "next", new Set(["node"]))).toEqual(["react"]));
  it("keeps disconnected nodes", () => expect(topologicalSort(buildSkillGraph([], ["a", "b"]))).toEqual(["a", "b"]));
});
