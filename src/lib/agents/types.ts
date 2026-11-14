import type { CareerAnalysis, Role, RoleSkill } from "@/types/career";
import type { Profile } from "@/types/profile";
import type { LearnerSkill, Skill, SkillPrerequisite } from "@/types/skill";
import type { AssessmentAgentOutput, MentorAgentOutput, ProfileAgentOutput, ResourceAgentOutput, RoadmapAgentOutput } from "@/lib/ai/schemas";

export type AgentName = "profile" | "skill_gap" | "roadmap" | "resource" | "assessment" | "mentor";
export type AgentRunType = "career_analysis" | "assessment" | "mentor" | "adaptation" | "simulation";

export interface AgentContext {
  userId: string;
  profile: Profile | null;
  certifications: Array<Record<string, unknown>>;
  projects: Array<Record<string, unknown>>;
  skills: Skill[];
  learnerSkills: LearnerSkill[];
  prerequisites: SkillPrerequisite[];
  roles: Role[];
  roleSkills: RoleSkill[];
  resources: ResourceRecord[];
  selectedRoleId?: string;
  selectedSkillId?: string;
  question?: string;
  activeRoadmap?: RoadmapRecord | null;
}

export interface ResourceRecord {
  id: string;
  skillId: string;
  title: string;
  url: string;
  type: string;
  difficulty: string;
  estMinutes: number;
  provider: string;
}

export interface RoadmapRecord {
  id: string;
  roleId: string;
  version: number;
  status: string;
  summary: string;
}

export interface AgentOutputMap {
  profile: ProfileAgentOutput;
  skill_gap: CareerAnalysis;
  roadmap: RoadmapAgentOutput;
  resource: ResourceAgentOutput;
  assessment: AssessmentAgentOutput;
  mentor: MentorAgentOutput;
}

export interface AgentMessage<T = unknown> {
  senderAgent: AgentName | "orchestrator";
  receiverAgent?: AgentName;
  messageType: "input" | "output" | "recommendation" | "decision" | "error";
  payload: T;
}

export interface AgentRunResult<T extends AgentName = AgentName> {
  agent: T;
  output: AgentOutputMap[T];
  explanation: string;
}

export interface Agent<T extends AgentName = AgentName> {
  name: T;
  run(context: AgentContext, previous: Partial<AgentOutputMap>): Promise<AgentRunResult<T>>;
}
