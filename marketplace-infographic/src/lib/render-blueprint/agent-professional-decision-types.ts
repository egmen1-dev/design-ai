/**
 * Chapter 7.6 — Agent Professional Decision Engine types
 * Eight-stage expert decision pipeline — distinct from Ch 4.8 observe→publish stages.
 */
import type { AgentContractId } from "./agent-contracts";
import type { KnowledgePackage } from "./knowledge-retrieval-types";
import type { RenderBlueprint } from "./types";

/** Ch 7.6 decision pipeline stages (8) */
export const ProfessionalDecisionStage = {
  PROBLEM_ANALYSIS: "problem_analysis",
  KNOWLEDGE_RETRIEVAL: "knowledge_retrieval",
  OPTION_GENERATION: "option_generation",
  RULE_EVALUATION: "rule_evaluation",
  SCORING: "scoring",
  CONFLICT_DETECTION: "conflict_detection",
  DECISION_SELECTION: "decision_selection",
  DECISION_EXPLANATION: "decision_explanation",
} as const;

export type ProfessionalDecisionStageId =
  (typeof ProfessionalDecisionStage)[keyof typeof ProfessionalDecisionStage];

/** Ch 7.6 multi-criteria scoring dimensions */
export const ProfessionalDecisionCriterion = {
  BUSINESS_MATCH: "business_match",
  MARKETPLACE_FIT: "marketplace_fit",
  COMMERCIAL_IMPACT: "commercial_impact",
  KNOWLEDGE_CONFIDENCE: "knowledge_confidence",
  HISTORICAL_SUCCESS: "historical_success",
} as const;

export type ProfessionalDecisionCriterionId =
  (typeof ProfessionalDecisionCriterion)[keyof typeof ProfessionalDecisionCriterion];

export type ProfessionalDecisionCriterionWeight = {
  criterion: ProfessionalDecisionCriterionId;
  weight: number;
};

export type ProfessionalDecisionCandidate = {
  id: string;
  label: string;
  summary: string;
  payload: Record<string, string | number | boolean>;
  scores: Partial<Record<ProfessionalDecisionCriterionId, number>>;
  rejected?: boolean;
  rejectionReason?: string;
};

export type ProfessionalDecisionConflict = {
  code: string;
  sections: string[];
  description: string;
};

/** Ch 7.6 DecisionResult */
export type ProfessionalDecisionResult = {
  decision: Record<string, unknown>;
  confidence: number;
  alternatives: ProfessionalDecisionCandidate[];
  reasoning: string[];
  violations: string[];
};

/** Ch 7.6 DecisionReport */
export type ProfessionalDecisionReport = {
  selectedOption: string;
  confidence: number;
  decisionScore: number;
  alternatives: string[];
  rulesApplied: string[];
  knowledgeSources: string[];
  reasoning: string[];
};

export type ProfessionalDecisionStageRecord = {
  stage: ProfessionalDecisionStageId;
  at: number;
  detail?: string;
};

export type ProfessionalDecisionProblem = {
  agentId: AgentContractId;
  businessGoal: string;
  professionalQuestion: string;
  contextSummary: string[];
};

export type ProfessionalDecisionPipelineState = {
  agentId: AgentContractId;
  problem?: ProfessionalDecisionProblem;
  knowledge?: KnowledgePackage;
  candidates: ProfessionalDecisionCandidate[];
  rulesApplied: string[];
  conflicts: ProfessionalDecisionConflict[];
  selectedCandidateId?: string;
  confidence: number;
  decisionScore: number;
  reasoning: string[];
  stagesCompleted: ProfessionalDecisionStageId[];
  stageRecords: ProfessionalDecisionStageRecord[];
};

export type ProfessionalDecisionViolation = {
  code: ProfessionalDecisionFailureCode;
  stage?: ProfessionalDecisionStageId;
  message: string;
  agentId?: AgentContractId;
};

export type ProfessionalDecisionExecutionReport = {
  valid: boolean;
  agentId: AgentContractId;
  violations: ProfessionalDecisionViolation[];
  state: ProfessionalDecisionPipelineState;
  result?: ProfessionalDecisionResult;
  report?: ProfessionalDecisionReport;
  deterministic: boolean;
  goldenRuleSatisfied: boolean;
};

export type ProfessionalDecisionValidationReport = {
  valid: boolean;
  violations: ProfessionalDecisionViolation[];
  pipelineComplete: boolean;
  multiCandidateRequired: boolean;
  explainabilityRequired: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type ProfessionalDecisionContext = {
  /** Skip alternative generation — failure */
  singleOptionOnly?: boolean;
  /** Skip explanation — failure */
  skipExplanation?: boolean;
  /** Ignore knowledge — failure */
  ignoreKnowledge?: boolean;
  /** Inject blueprint conflict */
  forceConflict?: boolean;
  seed?: number;
  marketplace?: string;
};

export type ProfessionalDecisionFailureCode =
  | "INCOMPLETE_PIPELINE"
  | "SINGLE_OPTION_SELECTED"
  | "MISSING_ALTERNATIVES"
  | "KNOWLEDGE_IGNORED"
  | "RULE_VIOLATION"
  | "UNRESOLVED_CONFLICT"
  | "MISSING_EXPLANATION"
  | "MISSING_CONFIDENCE"
  | "NON_DETERMINISTIC"
  | "PROMPT_DECISION"
  | "DIRECT_BLUEPRINT_MUTATION"
  | "EXECUTION_FAILED";

export type ProfessionalDecisionStageDefinition = {
  id: ProfessionalDecisionStageId;
  order: number;
  label: string;
  responsibility: string;
};
