/**
 * Chapter 4.22 — Blueprint Evolution types
 */
import type { AgentContractId } from "./agent-contracts";
import type { BlueprintSection } from "./types";

export const EvolutionLayer = {
  BUSINESS: "business",
  SPATIAL: "spatial",
  LAYOUT: "layout",
  PHOTOGRAPHY: "photography",
  LIGHTING: "lighting",
  CAMERA: "camera",
  MATERIAL: "material",
  VALIDATION: "validation",
} as const;

export type EvolutionLayerId = (typeof EvolutionLayer)[keyof typeof EvolutionLayer];

export const SectionCompletenessState = {
  EMPTY: "empty",
  PARTIAL: "partial",
  FILLED: "filled",
  SKIPPED: "skipped",
  ERROR: "error",
} as const;

export type SectionCompletenessStateId =
  (typeof SectionCompletenessState)[keyof typeof SectionCompletenessState];

export type EvolutionStage = {
  step: number;
  section: BlueprintSection;
  layer: EvolutionLayerId;
  agentId: AgentContractId;
};

export type SectionCompleteness = {
  section: BlueprintSection;
  layer: EvolutionLayerId;
  state: SectionCompletenessStateId;
  version: number;
  owner?: AgentContractId;
};

export type MutationHistoryEntry = {
  section: BlueprintSection;
  version: number;
  agentId: AgentContractId;
  action: "set" | "patch";
  timestamp: number;
  explanation?: string;
};

export type EvolutionSnapshot = {
  revision: number;
  completeness: number;
  filledSections: BlueprintSection[];
  layers: EvolutionLayerId[];
};

export type EvolutionViolation = {
  code:
    | "BACKWARD_MODIFICATION"
    | "MISSING_HISTORY"
    | "RETRY_DESTROYED_SECTION"
    | "CYCLIC_DEPENDENCY"
    | "INCOMPLETE_SECTION"
    | "UNKNOWN_SECTION"
    | "CONSISTENCY_CONFLICT"
    | "NOT_RENDER_READY"
    | "NON_INCREMENTAL"
    | "PROVIDER_DEPENDENCY";
  message: string;
  section?: BlueprintSection;
  agentId?: AgentContractId;
};

export type EvolutionExplainabilityEntry = {
  section: BlueprintSection;
  agentId: AgentContractId;
  version: number;
  timestamp: number;
  reason: string;
  current: boolean;
};

export type ConsistencyValidationReport = {
  valid: boolean;
  violations: EvolutionViolation[];
  completeness: SectionCompleteness[];
};

export type RenderReadinessReport = {
  ready: boolean;
  violations: EvolutionViolation[];
  mandatorySections: BlueprintSection[];
  missingSections: BlueprintSection[];
  completenessScore: number;
};

export type BlueprintEvolutionReport = {
  valid: boolean;
  violations: EvolutionViolation[];
  completeness: SectionCompleteness[];
  mutationHistory: MutationHistoryEntry[];
  explainability: EvolutionExplainabilityEntry[];
  snapshot: EvolutionSnapshot;
  renderReadiness: RenderReadinessReport;
  providerIndependent: boolean;
};

export type EvolutionValidationContext = {
  agentId?: AgentContractId;
  mutationSections?: BlueprintSection[];
  previousBlueprint?: import("./types").RenderBlueprint;
  retrySection?: BlueprintSection;
};

export type EvolutionFailureCode = EvolutionViolation["code"];
