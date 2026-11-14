import type { Agent, AgentName } from "@/lib/agents/types";
import { assessmentAgent } from "@/lib/agents/assessment-agent";
import { mentorAgent } from "@/lib/agents/mentor-agent";
import { profileAgent } from "@/lib/agents/profile-agent";
import { resourceAgent } from "@/lib/agents/resource-agent";
import { roadmapAgent } from "@/lib/agents/roadmap-agent";
import { skillGapAgent } from "@/lib/agents/skill-gap-agent";

export const agentRegistry: Record<AgentName, Agent> = { profile: profileAgent, skill_gap: skillGapAgent, roadmap: roadmapAgent, resource: resourceAgent, assessment: assessmentAgent, mentor: mentorAgent };
export const careerAnalysisAgentOrder: AgentName[] = ["profile", "skill_gap", "roadmap", "resource"];
