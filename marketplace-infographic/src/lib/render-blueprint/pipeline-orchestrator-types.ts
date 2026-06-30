/**
 * Chapter 6.1 — Pipeline Orchestrator types
 */

import type { AgentContractId } from "./agent-contracts";
import type { KnowledgePackage } from "./knowledge-retrieval-engine";
import type { RenderBlueprint } from "./types";

export const OrchestratorPipelineState = {
  CREATED: "created",
  KNOWLEDGE_LOADING: "knowledge_loading",
  CREATIVE_PLANNING: "creative_planning",
  TECHNICAL_PLANNING: "technical_planning",
  RENDERING: "rendering",
  VALIDATION: "validation",
  APPROVED: "approved",
  LEARNING: "learning",
  COMPLETED: "completed",
  RETRY: "retry",
  FAILED: "failed",
} as const;

export type OrchestratorPipelineStateId =
  (typeof OrchestratorPipelineState)[keyof typeof OrchestratorPipelineState];

export const OrchestratorPipelineEvent = {
  PIPELINE_STARTED: "PipelineStarted",
  STORY_COMPLETED: "StoryCompleted",
  SCENE_COMPLETED: "SceneCompleted",
  BLUEPRINT_UPDATED: "BlueprintUpdated",
  RENDER_FINISHED: "RenderFinished",
  VALIDATION_PASSED: "ValidationPassed",
  VALIDATION_FAILED: "ValidationFailed",
  RETRY_STARTED: "RetryStarted",
  PIPELINE_COMPLETED: "PipelineCompleted",
  AGENT_FAILED: "AgentFailed",
} as const;

export type OrchestratorPipelineEventId =
  (typeof OrchestratorPipelineEvent)[keyof typeof OrchestratorPipelineEvent];

/** Per-generation context — distinct from Ch 3.14 PipelineContext and Ch 6 DesignPipelineContext */
export type OrchestratorPipelineContext = {
  pipelineId: string;
  projectId: string;
  marketplace: string;
  product: Record<string, unknown>;
  businessGoal: Record<string, unknown>;
  blueprint: RenderBlueprint;
  knowledge: KnowledgePackage;
  metadata: Record<string, unknown>;
  state: OrchestratorPipelineStateId;
  completedAgents: AgentContractId[];
  lastSnapshotStage?: string;
};

export type AgentDependencyNode = {
  agentId: AgentContractId;
  dependsOn: AgentContractId[];
  blueprintSections: string[];
  layer: string;
};

export type OrchestratorEventRecord = {
  type: OrchestratorPipelineEventId;
  pipelineId: string;
  agentId?: AgentContractId;
  timestamp: number;
  payload?: Record<string, string | number | boolean>;
};

export type OrchestratorTelemetry = {
  pipelineId: string;
  agentDurationsMs: Record<string, number>;
  retryCount: number;
  errorCount: number;
  knowledgePackageSize: number;
  visionScore?: number;
  commercialScore?: number;
};

export type LocalizedRetryPlan = {
  failedAgentId: AgentContractId;
  agentsToRetry: AgentContractId[];
  agentsPreserved: AgentContractId[];
  reason: string;
  fullRestartRequired: boolean;
};

export type OrchestratorAgentRun = {
  agentId: AgentContractId;
  passed: boolean;
  durationMs: number;
  parallelGroup?: number;
  violations: OrchestratorViolation[];
};

export type OrchestratorViolation = {
  code: PipelineOrchestratorFailureCode;
  message: string;
  agentId?: AgentContractId;
  pipelineId?: string;
};

export type OrchestratorRunReport = {
  pipelineId: string;
  completed: boolean;
  state: OrchestratorPipelineStateId;
  agentRuns: OrchestratorAgentRun[];
  events: OrchestratorEventRecord[];
  telemetry: OrchestratorTelemetry;
  violations: OrchestratorViolation[];
  retryPlans: LocalizedRetryPlan[];
  recoveredFromSnapshot: boolean;
};

export type PipelineOrchestratorSystemReport = {
  valid: boolean;
  violations: OrchestratorViolation[];
  goldenRuleSatisfied: boolean;
  dependencyGraphReady: boolean;
  parallelExecutionReady: boolean;
  eventDrivenReady: boolean;
  recoveryReady: boolean;
  orchestrationOnly: boolean;
};

export type PipelineOrchestratorContext = {
  directAgentCalls?: boolean;
  missingDependencies?: boolean;
  fullRestartOnError?: boolean;
  orchestratorMutatesBlueprint?: boolean;
  crossSectionWrite?: boolean;
  noRecovery?: boolean;
};

export type PipelineOrchestratorFailureCode =
  | "DIRECT_AGENT_CALL"
  | "MISSING_DEPENDENCY_CONTROL"
  | "FULL_RESTART_ON_ERROR"
  | "ORCHESTRATOR_MUTATES_BLUEPRINT"
  | "CROSS_SECTION_WRITE"
  | "NO_RECOVERY"
  | "INVALID_STATE_TRANSITION"
  | "AGENT_NOT_READY"
  | "ORCHESTRATION_INCOMPLETE";
