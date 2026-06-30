/**
 * Chapter 7.5 — Agent Memory Model types
 * Six-tier platform memory architecture — distinct from Ch 4.7 layer package API.
 */
import type { AgentContractId } from "./agent-contracts";
import type { AgentContextPackage } from "./agent-context-types";
import type { BaseAgentTelemetry } from "./base-agent-architecture-types";
import type { ConstraintSet } from "./constraint-types";
import type { RenderBlueprint } from "./types";
import type { UniversalAgentResult } from "./universal-agent-contract-types";

/** Ch 7.5 memory tiers (6) */
export const AgentMemoryTier = {
  WORKING: "working",
  PIPELINE: "pipeline",
  DESIGN: "design",
  KNOWLEDGE: "knowledge",
  LEARNING: "learning",
  ANALYTICS: "analytics",
} as const;

export type AgentMemoryTierId = (typeof AgentMemoryTier)[keyof typeof AgentMemoryTier];

/** Tier owners per Ch 7.5 */
export const AgentMemoryModelOwner = {
  AGENT: "agent",
  PIPELINE_ORCHESTRATOR: "pipeline_orchestrator",
  LEARNING_ENGINE: "learning_engine",
  KNOWLEDGE_ENGINE: "knowledge_engine",
  OBSERVABILITY_PLATFORM: "observability_platform",
} as const;

export type AgentMemoryModelOwnerId =
  (typeof AgentMemoryModelOwner)[keyof typeof AgentMemoryModelOwner];

export const AgentMemoryAccessPermission = {
  READ: "read",
  WRITE: "write",
  NONE: "none",
} as const;

export type AgentMemoryAccessPermissionId =
  (typeof AgentMemoryAccessPermission)[keyof typeof AgentMemoryAccessPermission];

/** Ch 7.5 memory lifecycle flow */
export const AgentMemoryLifecycleStage = {
  WORKING: "working",
  PIPELINE: "pipeline",
  LEARNING_PACKAGE: "learning_package",
  DESIGN: "design",
  KNOWLEDGE_UPDATE: "knowledge_update",
} as const;

export type AgentMemoryLifecycleStageId =
  (typeof AgentMemoryLifecycleStage)[keyof typeof AgentMemoryLifecycleStage];

export const AgentMemoryOptimizationStrategy = {
  CONTEXT_COMPRESSION: "context_compression",
  LAZY_LOADING: "lazy_loading",
  SEMANTIC_RETRIEVAL: "semantic_retrieval",
  MEMORY_CACHING: "memory_caching",
  INCREMENTAL_LOADING: "incremental_loading",
} as const;

export type AgentMemoryOptimizationStrategyId =
  (typeof AgentMemoryOptimizationStrategy)[keyof typeof AgentMemoryOptimizationStrategy];

export type AgentMemoryTierDefinition = {
  id: AgentMemoryTierId;
  order: number;
  label: string;
  owner: AgentMemoryModelOwnerId;
  lifetime: "agent_session" | "generation" | "long_term";
  mutable: boolean;
  responsibility: string;
};

export type AgentMemoryTierAccess = {
  agentId: AgentContractId;
  tiers: Partial<Record<AgentMemoryTierId, AgentMemoryAccessPermissionId>>;
};

export type MemoryConsistencyVersions = {
  knowledgeVersion: string;
  patternVersion: string;
  marketplaceVersion: string;
  capturedAt: number;
};

export type MemorySnapshot = {
  snapshotId: string;
  pipelineId: string;
  blueprintId: string;
  blueprintRevision: number;
  pipelineContext: Readonly<AgentContextPackage>;
  versions: MemoryConsistencyVersions;
  constraints: ConstraintSet;
  decisionReports: string[];
  capturedAt: number;
};

export type AgentWorkingMemoryState = {
  locals: Record<string, unknown>;
  scratch: unknown[];
  reasoningNotes: string[];
  tempScores: Record<string, number>;
};

export type AgentMemoryModelViolation = {
  code: AgentMemoryModelFailureCode;
  tier?: AgentMemoryTierId;
  message: string;
  agentId?: AgentContractId;
};

export type AgentMemorySessionReport = {
  valid: boolean;
  agentId: AgentContractId;
  violations: AgentMemoryModelViolation[];
  tiersAccessed: AgentMemoryTierId[];
  workingMemoryReleased: boolean;
  snapshot?: MemorySnapshot;
  versions: MemoryConsistencyVersions;
  telemetry?: BaseAgentTelemetry;
  result?: UniversalAgentResult;
  lifecycleStagesCompleted: AgentMemoryLifecycleStageId[];
  statelessVerified: boolean;
};

export type AgentMemoryModelValidationReport = {
  valid: boolean;
  violations: AgentMemoryModelViolation[];
  tiersComplete: boolean;
  ownershipDefined: boolean;
  statelessDesign: boolean;
  reproducibilityReady: boolean;
  kitchenExecutionValid: boolean;
  goldenRuleSatisfied: boolean;
  successCriteriaMet: boolean;
};

export type AgentMemoryModelContext = {
  /** Agent retains working memory after session — failure */
  retainWorkingMemory?: boolean;
  /** Attempt to write design memory directly */
  writeDesignMemory?: boolean;
  /** Attempt to read analytics for decision */
  useAnalyticsInDecision?: boolean;
  /** Cross-agent working memory sharing */
  sharedWorkingMemory?: boolean;
  /** Skip snapshot creation */
  skipSnapshot?: boolean;
};

export type AgentMemoryModelFailureCode =
  | "TIER_MIXING"
  | "UNAUTHORIZED_TIER_ACCESS"
  | "UNAUTHORIZED_TIER_WRITE"
  | "WORKING_MEMORY_LEAK"
  | "HIDDEN_LONG_TERM_STATE"
  | "SHARED_WORKING_MEMORY"
  | "ANALYTICS_IN_DECISION"
  | "DESIGN_MEMORY_DIRECT_WRITE"
  | "MISSING_SNAPSHOT"
  | "VERSION_INCONSISTENCY"
  | "MEMORY_ISOLATION_BREACH"
  | "EXECUTION_FAILED";
