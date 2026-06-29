/**
 * Chapter 4.4 — Agent Discovery types
 */
import type { AgentContractId } from "./agent-contracts";
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { AgentRegistry } from "./agent-registry";
import type { AgentCategoryId } from "./universal-agent-contract-types";
import type { BlueprintSection, RenderBlueprint } from "./types";

export const PipelineMode = {
  STANDARD: "standard",
  FAST_GENERATION: "fast_generation",
  HIGH_QUALITY: "high_quality",
  BACKGROUND_RETRY: "background_retry",
  COMPOSITE_RETRY: "composite_retry",
} as const;

export type PipelineModeId = (typeof PipelineMode)[keyof typeof PipelineMode];

export type PipelineConfiguration = {
  mode: PipelineModeId;
  enableExperimental?: boolean;
  enablePlugins?: boolean;
  requireChiefReview?: boolean;
  criticsReportedIssues?: boolean;
  postGeneration?: boolean;
};

export type DiscoveryContext = {
  blueprint: RenderBlueprint;
  registry: AgentRegistry;
  configuration: PipelineConfiguration;
  lifecycle: BlueprintLifecycle;
  /** Agents already executed on this lifecycle stage */
  executedOnStage?: AgentContractId[];
};

export type ExecutionNode = {
  agentId: AgentContractId;
  version: string;
  stage: BlueprintLifecycle;
  category?: AgentCategoryId;
  produces: BlueprintSection[];
  consumes: BlueprintSection[];
};

export type ExecutionEdge = {
  from: AgentContractId | BlueprintSection;
  to: AgentContractId | BlueprintSection;
  kind: "section" | "stage";
};

export type ExecutionGroup = {
  id: string;
  agentIds: AgentContractId[];
  parallel: boolean;
};

export type ExecutionPlan = {
  agents: ExecutionNode[];
  executionGraph: ExecutionEdge[];
  parallelGroups: ExecutionGroup[];
  lifecycle: BlueprintLifecycle;
  mode: PipelineModeId;
  cached: boolean;
};

export type DiscoveryExclusion = {
  agentId: AgentContractId;
  reason: string;
  code: DiscoveryExclusionCode;
};

export type DiscoveryExclusionCode =
  | "NOT_REGISTERED"
  | "INACTIVE"
  | "DEPENDENCY_MISSING"
  | "SECTION_MISSING"
  | "LIFECYCLE_MISMATCH"
  | "ALREADY_EXECUTED"
  | "MODE_FILTERED"
  | "CAPABILITY_MISMATCH"
  | "CONDITIONAL_SKIP";

export type DiscoveryReport = {
  included: ExecutionNode[];
  excluded: DiscoveryExclusion[];
  executionGraph: ExecutionEdge[];
  parallelGroups: ExecutionGroup[];
  plan: ExecutionPlan;
  discoveredAt: number;
  blueprintRevision: number;
};

export type DiscoveryCacheKey = string;
