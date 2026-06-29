/**
 * Chapter 4 — Agent Ecosystem types
 */
import type { AgentContractId, AgentResultBase, BlueprintAgent } from "./agent-contracts";
import type { BlueprintSection } from "./types";

export const AgentPrinciple = {
  SINGLE_RESPONSIBILITY: "single_responsibility",
  STATELESS: "stateless",
  DETERMINISTIC_INTENT: "deterministic_intent",
  BLUEPRINT_DRIVEN: "blueprint_driven",
  EXPLAINABLE_DECISION: "explainable_decision",
  NO_DIRECT_COMMUNICATION: "no_direct_communication",
  PROVIDER_INDEPENDENCE: "provider_independence",
  QUALITY_FIRST: "quality_first",
  CONTRACT_BASED: "contract_based",
} as const;

export type AgentPrincipleId = (typeof AgentPrinciple)[keyof typeof AgentPrinciple];

export const AgentEcosystemCategory = {
  CREATIVE_DIRECTOR: "creative_director",
  TECHNICAL_DIRECTOR: "technical_director",
  CRITIC: "critic",
  ORCHESTRATOR: "orchestrator",
  LEARNING_AGENT: "learning_agent",
} as const;

export type AgentEcosystemCategoryId =
  (typeof AgentEcosystemCategory)[keyof typeof AgentEcosystemCategory];

export type AgentPrincipleDefinition = {
  id: AgentPrincipleId;
  name: string;
  summary: string;
};

export type AgentCategoryDefinition = {
  id: AgentEcosystemCategoryId;
  name: string;
  summary: string;
  responsibility: string;
};

export type AgentEcosystemViolation = {
  principle: AgentPrincipleId;
  severity: "fatal" | "error" | "warning";
  message: string;
  agentId?: AgentContractId;
  evidence?: string;
};

export type AgentDecisionRecord = {
  agentId: AgentContractId;
  category: AgentEcosystemCategoryId;
  confidence: number;
  decisionTrace: string[];
  sectionsUsed: BlueprintSection[];
  constraintsConsidered: string[];
  reason: string;
  executedAt: number;
};

export type AgentEcosystemValidationReport = {
  valid: boolean;
  agentId: AgentContractId;
  category: AgentEcosystemCategoryId;
  principleCount: number;
  violations: AgentEcosystemViolation[];
  passed: AgentPrincipleId[];
  failed: AgentPrincipleId[];
};

export type AgentEcosystemValidationContext = {
  agent: BlueprintAgent<unknown, AgentResultBase>;
  result?: AgentResultBase;
  sectionsWritten?: BlueprintSection[];
  /** Agent invoked another agent directly */
  crossAgentCall?: { target: AgentContractId };
  /** Agent retained state between runs */
  retainedState?: boolean;
  /** Same blueprint produced different results */
  nonDeterministic?: boolean;
  /** Agent referenced external data outside blueprint */
  externalDataAccess?: string;
  /** Agent referenced render provider */
  providerReference?: string;
};

export type AgentEcosystemValidatorOptions = {
  minConfidence?: number;
  requireDecisionTrace?: boolean;
};
