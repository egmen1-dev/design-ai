/**
 * Chapter 4.28 — Agent Ecosystem Summary types
 */
import type { AgentContractId } from "./agent-contracts";
import type { BlueprintSection } from "./types";

export const EcosystemLayer = {
  BUSINESS: "business",
  CREATIVE: "creative",
  TECHNICAL: "technical",
  RENDERING: "rendering",
  VALIDATION: "validation",
  LEARNING: "learning",
} as const;

export type EcosystemLayerId = (typeof EcosystemLayer)[keyof typeof EcosystemLayer];

export const EngineeringPrinciple = {
  SINGLE_RESPONSIBILITY: "single_responsibility",
  IMMUTABLE_BLUEPRINT: "immutable_blueprint",
  STRUCTURED_COMMUNICATION: "structured_communication",
  EXPLAINABILITY: "explainability",
  PROVIDER_INDEPENDENCE: "provider_independence",
  CONTINUOUS_LEARNING: "continuous_learning",
} as const;

export type EngineeringPrincipleId = (typeof EngineeringPrinciple)[keyof typeof EngineeringPrinciple];

export type EcosystemPipelineStage = {
  id: string;
  label: string;
  layer: EcosystemLayerId;
  agentId?: AgentContractId;
  blueprintSections?: BlueprintSection[];
  responsibility: string;
};

export type LayerDefinition = {
  id: EcosystemLayerId;
  name: string;
  summary: string;
  agents: AgentContractId[];
};

export type EngineeringPrincipleDefinition = {
  id: EngineeringPrincipleId;
  name: string;
  summary: string;
  chapter?: string;
};

export type ExpectedOutcome = {
  id: string;
  description: string;
  validated: boolean;
  evidence?: string;
};

export type ScalabilityCapability = {
  extension: string;
  supported: boolean;
  mechanism: string;
};

export type EcosystemCohesionCheck = {
  id: string;
  passed: boolean;
  message: string;
};

export type AgentEcosystemSummaryContext = {
  blueprintRevision?: number;
  implementedChapters?: string[];
  provider?: string;
};

export type AgentEcosystemSummaryReport = {
  complete: boolean;
  violations: EcosystemSummaryViolation[];
  pipeline: EcosystemPipelineStage[];
  layers: LayerDefinition[];
  principles: EngineeringPrincipleDefinition[];
  expectedOutcomes: ExpectedOutcome[];
  scalability: ScalabilityCapability[];
  cohesionChecks: EcosystemCohesionCheck[];
  goldenRuleSatisfied: boolean;
};

export type EcosystemSummaryViolation = {
  code: EcosystemSummaryFailureCode;
  message: string;
  stage?: string;
};

export type EcosystemSummaryFailureCode =
  | "INCOMPLETE_PIPELINE"
  | "MISSING_LAYER"
  | "PRINCIPLE_NOT_IMPLEMENTED"
  | "BLUEPRINT_NOT_CENTRAL"
  | "AGENT_NOT_INDEPENDENT"
  | "MISSING_EXPLAINABILITY"
  | "PROVIDER_NOT_SWAPPABLE"
  | "LEARNING_NOT_POST_PIPELINE"
  | "EXPECTED_OUTCOME_UNMET";
