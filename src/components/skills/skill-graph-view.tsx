"use client";

import { Background, Controls, MiniMap, ReactFlow, type Edge, type Node } from "@xyflow/react";
import { useMemo } from "react";

type Skill = { id: string; name: string; category: string };
type LearnerSkill = { skill_id: string; p_known: number; status: string };
type Prerequisite = { skill_id: string; prerequisite_id: string };

export function SkillGraphView({ skills, learnerSkills, prerequisites }: { skills: Skill[]; learnerSkills: LearnerSkill[]; prerequisites: Prerequisite[] }) {
  const { nodes, edges } = useMemo(() => {
    const learnerIds = new Set(learnerSkills.map((item) => item.skill_id));
    const relatedIds = new Set(learnerIds);
    prerequisites.forEach((edge) => { if (learnerIds.has(edge.skill_id) || learnerIds.has(edge.prerequisite_id)) { relatedIds.add(edge.skill_id); relatedIds.add(edge.prerequisite_id); } });
    const visible = skills.filter((skill) => relatedIds.has(skill.id)).slice(0, 30);
    const visibleIds = new Set(visible.map((skill) => skill.id));
    const mastery = new Map(learnerSkills.map((item) => [item.skill_id, item]));
    const graphNodes: Node[] = visible.map((skill, index) => {
      const learner = mastery.get(skill.id);
      const color = learner?.status === "mastered" ? "#34d399" : learner ? "#67e8f9" : "#a78bfa";
      return { id: skill.id, position: { x: (index % 4) * 230, y: Math.floor(index / 4) * 105 }, data: { label: <div className="text-xs"><p className="font-medium">{skill.name}</p><p className="mt-1 opacity-70">{learner ? `${Math.round(learner.p_known * 100)}% mastery` : "not started"}</p></div> }, style: { border: `1px solid ${color}`, borderRadius: 12, background: "#0d1220", color: "#f8fafc", padding: 10, width: 180 } };
    });
    const graphEdges: Edge[] = prerequisites.filter((edge) => visibleIds.has(edge.skill_id) && visibleIds.has(edge.prerequisite_id)).map((edge) => ({ id: `${edge.prerequisite_id}-${edge.skill_id}`, source: edge.prerequisite_id, target: edge.skill_id, animated: false, style: { stroke: "#64748b" } }));
    return { nodes: graphNodes, edges: graphEdges };
  }, [skills, learnerSkills, prerequisites]);
  if (!nodes.length) return <p className="text-sm text-slate-500">Complete onboarding to see your prerequisite graph.</p>;
  return <div className="h-[480px] overflow-hidden rounded-2xl border border-white/10 bg-[#080b14]"><ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.2 }}><MiniMap nodeColor={(node) => String(node.style?.borderColor ?? "#a78bfa")} /><Controls /><Background color="#1e293b" gap={24} /></ReactFlow></div>;
}
