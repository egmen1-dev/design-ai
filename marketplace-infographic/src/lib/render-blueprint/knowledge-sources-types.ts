/**
 * Chapter 5.3 — Knowledge Sources types
 */
import type { KnowledgeEvidenceSourceId } from "./design-knowledge-philosophy-types";

export const KnowledgeSourceLevel = {
  EXPERT: 1,
  SCIENTIFIC_RESEARCH: 2,
  MARKETPLACE_ANALYTICS: 3,
  INTERNAL_PLATFORM: 4,
  AI_GENERATED: 5,
} as const;

export type KnowledgeSourceLevelId =
  (typeof KnowledgeSourceLevel)[keyof typeof KnowledgeSourceLevel];

export const KnowledgeSourceType = {
  EXPERT: "expert",
  SCIENTIFIC: "scientific",
  MARKETPLACE: "marketplace",
  INTERNAL_ANALYTICS: "internal_analytics",
  DESIGN_MEMORY: "design_memory",
  HUMAN_FEEDBACK: "human_feedback",
  AI_HYPOTHESIS: "ai_hypothesis",
} as const;

export type KnowledgeSourceTypeId = (typeof KnowledgeSourceType)[keyof typeof KnowledgeSourceType];

/** Chapter 5.3 — full source attribution (distinct from Ch 5.2 KnowledgeSource summary) */
export type AttributedKnowledgeSource = {
  type: KnowledgeSourceTypeId;
  name: string;
  evidenceLevel: number;
  confidence: number;
  date: string;
  version: string;
  level: KnowledgeSourceLevelId;
  evidenceId?: KnowledgeEvidenceSourceId;
  independent: boolean;
};

export type SourceWeightUpdate = {
  sourceId: string;
  previousWeight: number;
  newWeight: number;
  reason: string;
  confirmedBy?: KnowledgeSourceTypeId[];
};

export type SourceConflict = {
  ruleId: string;
  sources: AttributedKnowledgeSource[];
  message: string;
  resolution: "preserve_both" | "escalate_to_evaluation";
};

export type MultiSourceValidation = {
  ruleId: string;
  sources: AttributedKnowledgeSource[];
  independentSourceCount: number;
  combinedConfidence: number;
  validated: boolean;
};

export type HumanFeedbackImpact = {
  rating: "positive" | "negative";
  affectedRuleIds: string[];
  weightDelta: number;
  createsNewRule: boolean;
};

export type AiHypothesisSubmission = {
  id: string;
  hypothesis: string;
  proposedBy: "ai_hypothesis";
  sampleCount: number;
  approved: boolean;
  reason: string;
};

export type KnowledgeSourcesContext = {
  ruleId?: string;
  sources?: AttributedKnowledgeSource[];
  llmOnlyRule?: boolean;
  mixedWithoutDistinction?: boolean;
  singleFeedbackCreatesRule?: boolean;
  aiHypothesisAutoAccepted?: boolean;
  circularAttribution?: { from: KnowledgeSourceTypeId; to: KnowledgeSourceTypeId };
};

export type KnowledgeSourcesViolation = {
  code: KnowledgeSourcesFailureCode;
  message: string;
  ruleId?: string;
  sourceType?: KnowledgeSourceTypeId;
};

export type KnowledgeSourcesReport = {
  valid: boolean;
  violations: KnowledgeSourcesViolation[];
  sourceHierarchy: KnowledgeSourceLevelId[];
  catalog: AttributedKnowledgeSource[];
  goldenRuleSatisfied: boolean;
  traceable: boolean;
  multiSourceValidated: boolean;
};

export type KnowledgeSourcesFailureCode =
  | "UNKNOWN_ORIGIN"
  | "LLM_ONLY_SOURCE"
  | "MISSING_SOURCE_VALIDATION"
  | "MIXED_SOURCES_UNDISTINGUISHED"
  | "SINGLE_FEEDBACK_RULE"
  | "AI_HYPOTHESIS_AUTO_ACCEPTED"
  | "CIRCULAR_ATTRIBUTION"
  | "INSUFFICIENT_INDEPENDENT_SOURCES"
  | "MISSING_ATTRIBUTION";
