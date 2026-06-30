/**
 * Chapter 4.8 — Agent Decision Model types
 */
import type { AgentContractId } from "./agent-contracts";
import type { BlueprintMutation } from "./mutation-types";
import type { BlueprintSection } from "./types";

export const DecisionStage = {
  OBSERVE: "observe",
  INTERPRET: "interpret",
  REASON: "reason",
  COMPARE: "compare",
  EVALUATE: "evaluate",
  DECIDE: "decide",
  EXPLAIN: "explain",
  PUBLISH: "publish",
} as const;

export type DecisionStageId = (typeof DecisionStage)[keyof typeof DecisionStage];

export const DECISION_STAGE_ORDER: DecisionStageId[] = [
  DecisionStage.OBSERVE,
  DecisionStage.INTERPRET,
  DecisionStage.REASON,
  DecisionStage.COMPARE,
  DecisionStage.EVALUATE,
  DecisionStage.DECIDE,
  DecisionStage.EXPLAIN,
  DecisionStage.PUBLISH,
];

export const DecisionQualityCriterion = {
  CORRECTNESS: "correctness",
  CONSISTENCY: "consistency",
  COMMERCIAL_VALUE: "commercial_value",
  VISUAL_QUALITY: "visual_quality",
  EXPLAINABILITY: "explainability",
  CONFIDENCE: "confidence",
} as const;

export type DecisionQualityCriterionId =
  (typeof DecisionQualityCriterion)[keyof typeof DecisionQualityCriterion];

export const DecisionConstraintKind = {
  DESIGN_LAWS: "design_laws",
  MARKETPLACE_RULES: "marketplace_rules",
  PRODUCT_FIDELITY: "product_fidelity",
  USER_INTENT: "user_intent",
  BRAND_CONSTRAINTS: "brand_constraints",
  PROVIDER_CAPABILITIES: "provider_capabilities",
  BLUEPRINT_CONSISTENCY: "blueprint_consistency",
} as const;

export type DecisionConstraintKindId =
  (typeof DecisionConstraintKind)[keyof typeof DecisionConstraintKind];

export type DecisionAlternative = {
  id: string;
  label: string;
  summary: string;
  scores: Partial<Record<DecisionQualityCriterionId, number>>;
  rejected?: boolean;
  rejectionReason?: string;
};

export type DecisionEvaluation = {
  alternativeId: string;
  scores: Record<DecisionQualityCriterionId, number>;
  weightedTotal: number;
  notes: string[];
};

/** Chapter 4.8 structured decision trace — distinct from observability DecisionTrace */
export type AgentDecisionTrace = {
  agentId: AgentContractId;
  timestamp: number;
  inputs: string[];
  alternatives: string[];
  selectedDecision: string;
  reasoning: string;
  /** Normalized 0.0..1.0 */
  confidence: number;
  stagesCompleted: DecisionStageId[];
  constraintsConsidered: DecisionConstraintKindId[];
  rejectedAlternatives: string[];
  qualityScores: Partial<Record<DecisionQualityCriterionId, number>>;
};

export type DecisionStageRecord = {
  stage: DecisionStageId;
  at: number;
  summary: string;
  data?: Record<string, unknown>;
};

export type DecisionPipelineState = {
  agentId: AgentContractId;
  startedAt: number;
  stages: DecisionStageRecord[];
  inputs: string[];
  interpretation: string[];
  reasoning: string[];
  alternatives: DecisionAlternative[];
  evaluations: DecisionEvaluation[];
  selectedAlternativeId?: string;
  explanation: string[];
  constraints: DecisionConstraintKindId[];
  mutations: BlueprintMutation[];
  confidence: number;
  completed: boolean;
};

export type DecisionViolationCode =
  | "STAGE_SKIPPED"
  | "STAGE_OUT_OF_ORDER"
  | "INSUFFICIENT_ALTERNATIVES"
  | "MISSING_EXPLANATION"
  | "MISSING_SELECTED_DECISION"
  | "MULTIPLE_ACTIVE_DECISIONS"
  | "PROMPT_THINKING"
  | "PROVIDER_REFERENCE"
  | "DIRECT_BLUEPRINT_MUTATION"
  | "QUALITY_THRESHOLD"
  | "MISSING_CONSTRAINTS"
  | "INVALID_CONFIDENCE";

export type DecisionViolation = {
  code: DecisionViolationCode;
  message: string;
  stage?: DecisionStageId;
};

export type DecisionValidationReport = {
  valid: boolean;
  agentId: AgentContractId;
  violations: DecisionViolation[];
  trace?: AgentDecisionTrace;
};

export type DecisionQualityReport = {
  complete: boolean;
  scores: Record<DecisionQualityCriterionId, number>;
  minimumScore: number;
  failingCriteria: DecisionQualityCriterionId[];
};

export type SerializedDecisionReplay = {
  version: string;
  trace: AgentDecisionTrace;
  pipeline: DecisionPipelineState;
};
