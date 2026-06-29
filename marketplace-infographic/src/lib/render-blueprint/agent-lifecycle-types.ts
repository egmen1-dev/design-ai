/**
 * Chapter 4.2 — Agent Lifecycle types
 */
import type { AgentContractId } from "./agent-contracts";
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { BlueprintSnapshot } from "./snapshot-types";
import type { RenderBlueprint } from "./types";
import type { UniversalAgentResult, UniversalBlueprintAgent } from "./universal-agent-contract-types";

export const AgentLifecycleStage = {
  REGISTERED: "registered",
  DISCOVERED: "discovered",
  VALIDATED: "validated",
  INITIALIZED: "initialized",
  EXECUTE: "execute",
  DECISION: "decision",
  MUTATION: "mutation",
  VALIDATION: "validation",
  COMPLETED: "completed",
  DISPOSED: "disposed",
} as const;

export type AgentLifecycleStageId =
  (typeof AgentLifecycleStage)[keyof typeof AgentLifecycleStage];

export type AgentLifecycleStageRecord = {
  stage: AgentLifecycleStageId;
  at: number;
  detail?: string;
};

export type AgentLifecycleFailure = {
  stage: AgentLifecycleStageId;
  code: string;
  message: string;
  recoveryRecommendations?: UniversalAgentResult["recommendations"];
};

export type AgentLifecycleResult = {
  success: boolean;
  /** Agent was not required at this pipeline stage */
  skipped?: boolean;
  agentId: string;
  blueprint: RenderBlueprint;
  result?: UniversalAgentResult;
  stages: AgentLifecycleStageRecord[];
  failure?: AgentLifecycleFailure;
  revisionBefore: number;
  revisionAfter: number;
  disposed: boolean;
};

export type AgentLifecycleRunInput = {
  agent: UniversalBlueprintAgent;
  blueprint: RenderBlueprint;
  pipelineStage: BlueprintLifecycle;
  snapshot?: BlueprintSnapshot;
  pipelineId?: string;
  debug?: boolean;
  /** Skip discovery — force run (tests) */
  force?: boolean;
};

export type AgentLifecycleOrchestratorOptions = {
  minAgentVersion?: string;
};

export type AgentLifecycleGuarantee = {
  id: string;
  description: string;
};
