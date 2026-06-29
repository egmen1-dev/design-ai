/**
 * Chapter 4.6 — Agent Context types
 */
import type { AgentContractId } from "./agent-contracts";
import type { PipelineConfiguration } from "./agent-discovery-types";
import type { DiagnosticContext } from "./observability-types";
import type { BlueprintSnapshot } from "./snapshot-types";
import type { BlueprintSection, RenderBlueprint } from "./types";

export type AgentDiagnosticContext = DiagnosticContext & {
  /** Stage identifier — mirrors currentStage for explainability */
  stageId?: DiagnosticContext["currentStage"];
  executionNumber?: number;
  retryCount?: number;
  agentVersion?: string;
  buildVersion?: string;
};

export type RuntimeContext = {
  provider?: string;
  gpu?: string;
  availableMemoryMb?: number;
  executionLimitMs?: number;
  timeoutMs?: number;
  /** Future extension — user preferences without changing Execute() */
  userPreferences?: Record<string, unknown>;
  experiments?: Record<string, boolean>;
  featureFlags?: Record<string, boolean>;
};

/** Chapter 4.6 — canonical agent input package (data only, no business logic) */
export type AgentContextPackage = {
  blueprint: Readonly<RenderBlueprint>;
  snapshot?: Readonly<BlueprintSnapshot>;
  configuration: PipelineConfiguration;
  diagnostics: Readonly<AgentDiagnosticContext>;
  runtime: Readonly<RuntimeContext>;
};

export type AgentContextBuildInput = {
  blueprint: RenderBlueprint;
  snapshot?: BlueprintSnapshot;
  configuration?: PipelineConfiguration;
  diagnostics?: Partial<AgentDiagnosticContext>;
  runtime?: Partial<RuntimeContext>;
  pipelineId?: string;
  agentId?: AgentContractId;
  agentVersion?: string;
};

export type ContextViolationCode =
  | "STRUCTURE_INVALID"
  | "BLUEPRINT_MISSING"
  | "BLUEPRINT_REVISION_MISMATCH"
  | "SNAPSHOT_CORRUPT"
  | "SNAPSHOT_REVISION_MISMATCH"
  | "CONFIGURATION_MISSING"
  | "DIAGNOSTICS_MISSING"
  | "RUNTIME_MISSING"
  | "SECRET_DETECTED"
  | "NON_SERIALIZABLE"
  | "CONTEXT_MUTATED";

export type ContextViolation = {
  code: ContextViolationCode;
  message: string;
  field?: string;
};

export type ContextValidationReport = {
  valid: boolean;
  violations: ContextViolation[];
};

export type ContextProjection = {
  agentId: AgentContractId;
  sections: BlueprintSection[];
  blueprint: Readonly<RenderBlueprint>;
  /** Estimated JSON byte size of full blueprint */
  fullBlueprintBytes: number;
  /** Estimated JSON byte size of projected blueprint */
  projectedBlueprintBytes: number;
};

export type ContextExplainabilityEntry = {
  section: BlueprintSection;
  label: string;
  used: boolean;
  available: boolean;
};

export type ContextExplainabilityReport = {
  agentId: AgentContractId;
  entries: ContextExplainabilityEntry[];
  unusedAvailable: BlueprintSection[];
  missingRequired: BlueprintSection[];
};

export type SerializedAgentContext = {
  version: string;
  blueprint: RenderBlueprint;
  snapshot?: BlueprintSnapshot;
  configuration: PipelineConfiguration;
  diagnostics: AgentDiagnosticContext;
  runtime: RuntimeContext;
};
