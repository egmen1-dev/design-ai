/**
 * Chapter 7.2 — Base Agent Architecture types
 */
import type { AgentContractId } from "./agent-contracts";
import type { KnowledgePackage } from "./knowledge-retrieval-types";
import type { ConstraintSet } from "./constraint-types";
import type { BlueprintSection, RenderBlueprint } from "./types";
import type { AgentContextPackage } from "./agent-context-types";
import type { UniversalAgentResult } from "./universal-agent-contract-types";

export const BaseAgentPipelineStage = {
  PIPELINE_CONTEXT: "pipeline_context",
  INPUT_ADAPTER: "input_adapter",
  CONTEXT_ANALYZER: "context_analyzer",
  KNOWLEDGE_RETRIEVAL: "knowledge_retrieval",
  DECISION_ENGINE: "decision_engine",
  RULE_ENGINE: "rule_engine",
  BLUEPRINT_BUILDER: "blueprint_builder",
  SELF_VALIDATION: "self_validation",
  OUTPUT_ADAPTER: "output_adapter",
} as const;

export type BaseAgentPipelineStageId =
  (typeof BaseAgentPipelineStage)[keyof typeof BaseAgentPipelineStage];

export const BaseAgentArchitectureLayer = {
  INPUT: "input",
  CONTEXT: "context",
  KNOWLEDGE: "knowledge",
  DECISION: "decision",
  RULES: "rules",
  BLUEPRINT: "blueprint",
  VALIDATION: "validation",
  OUTPUT: "output",
  TELEMETRY: "telemetry",
} as const;

export type BaseAgentArchitectureLayerId =
  (typeof BaseAgentArchitectureLayer)[keyof typeof BaseAgentArchitectureLayer];

export const BaseAgentErrorCategory = {
  KNOWLEDGE_ERROR: "knowledge_error",
  RULE_CONFLICT: "rule_conflict",
  BLUEPRINT_VALIDATION_FAILED: "blueprint_validation_failed",
  MISSING_CONTEXT: "missing_context",
} as const;

export type BaseAgentErrorCategoryId =
  (typeof BaseAgentErrorCategory)[keyof typeof BaseAgentErrorCategory];

export const BaseAgentInjectableDependency = {
  KNOWLEDGE_ENGINE: "knowledge_engine",
  PATTERN_LIBRARY: "pattern_library",
  RULE_ENGINE: "rule_engine",
  MARKETPLACE_PROFILE: "marketplace_profile",
  LOGGER: "logger",
} as const;

export type BaseAgentInjectableDependencyId =
  (typeof BaseAgentInjectableDependency)[keyof typeof BaseAgentInjectableDependency];

export const BaseAgentExecutionStatus = {
  PENDING: "pending",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;

export type BaseAgentExecutionStatusId =
  (typeof BaseAgentExecutionStatus)[keyof typeof BaseAgentExecutionStatus];

/** Ch 7.2 AgentInput — normalized agent input package */
export type BaseAgentInput = {
  pipelineContext: AgentContextPackage;
  blueprint: Readonly<RenderBlueprint>;
  knowledge: KnowledgePackage;
  constraints: ConstraintSet;
};

/** Ch 7.2 AgentState — ephemeral execution state */
export type BaseAgentState = {
  status: BaseAgentExecutionStatusId;
  decisionScore: number;
  validationPassed: boolean;
  knowledgeVersion: string;
  retryCount: number;
};

/** Ch 7.2 AgentTelemetry — observability record */
export type BaseAgentTelemetry = {
  durationMs: number;
  knowledgeItemsUsed: number;
  rulesEvaluated: number;
  decisionScore: number;
  validationScore: number;
  retryCount: number;
  stagesCompleted: BaseAgentPipelineStageId[];
};

export type BaseAgentPipelineStageDefinition = {
  id: BaseAgentPipelineStageId;
  order: number;
  label: string;
  layer: BaseAgentArchitectureLayerId;
  moduleRef: string;
  responsibility: string;
};

export type BaseAgentLayerDefinition = {
  id: BaseAgentArchitectureLayerId;
  order: number;
  label: string;
  responsibility: string;
};

export type BaseAgentContextProjection = {
  agentId: AgentContractId;
  sections: BlueprintSection[];
  marketplace?: string;
};

export type BaseAgentArchitectureViolation = {
  code: BaseAgentArchitectureFailureCode;
  stage?: BaseAgentPipelineStageId;
  message: string;
  agentId?: string;
};

export type BaseAgentExecutionReport = {
  valid: boolean;
  agentId: AgentContractId;
  violations: BaseAgentArchitectureViolation[];
  stagesCompleted: BaseAgentPipelineStageId[];
  state: BaseAgentState;
  telemetry: BaseAgentTelemetry;
  result?: UniversalAgentResult;
};

export type BaseAgentArchitectureReport = {
  valid: boolean;
  violations: BaseAgentArchitectureViolation[];
  pipelineComplete: boolean;
  layersComplete: boolean;
  statelessDesign: boolean;
  dependencyInjectionReady: boolean;
  modularDesign: boolean;
  kitchenExecutionValid: boolean;
  goldenRuleSatisfied: boolean;
  successCriteriaMet: boolean;
};

export type BaseAgentArchitectureContext = {
  promptOnlyAgent?: boolean;
  monolithicLogic?: boolean;
  hiddenState?: boolean;
  selfCreatedDependencies?: boolean;
  skipSelfValidation?: boolean;
  mutateForeignBlueprint?: boolean;
  missingTelemetry?: boolean;
};

export type BaseAgentArchitectureFailureCode =
  | "PROMPT_ONLY_ARCHITECTURE"
  | "MONOLITHIC_LOGIC"
  | "INCOMPLETE_PIPELINE"
  | "INCOMPLETE_LAYERS"
  | "HIDDEN_STATE"
  | "SELF_CREATED_DEPENDENCY"
  | "MISSING_SELF_VALIDATION"
  | "FOREIGN_BLUEPRINT_MUTATION"
  | "MISSING_TELEMETRY"
  | "MISSING_CONTEXT"
  | "EXECUTION_FAILED"
  | "ARCHITECTURE_INCOMPLETE";
