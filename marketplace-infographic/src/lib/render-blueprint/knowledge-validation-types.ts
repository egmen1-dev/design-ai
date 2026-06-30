/**
 * Chapter 5.17 — Knowledge Validation types
 */

export const ValidatableKnowledgeKind = {
  RULE: "rule",
  PATTERN: "pattern",
  ANTI_PATTERN: "anti_pattern",
  TYPOGRAPHY: "typography",
  COLOR: "color",
  PHOTOGRAPHY: "photography",
  PSYCHOLOGY: "psychology",
  CONSUMER: "consumer",
} as const;

export type ValidatableKnowledgeKindId =
  (typeof ValidatableKnowledgeKind)[keyof typeof ValidatableKnowledgeKind];

export const KnowledgeValidationStage = {
  KNOWLEDGE_CREATION: "knowledge_creation",
  SCHEMA_VALIDATION: "schema_validation",
  SEMANTIC_VALIDATION: "semantic_validation",
  CONFLICT_ANALYSIS: "conflict_analysis",
  EVIDENCE_VALIDATION: "evidence_validation",
  SIMULATION: "simulation",
  APPROVAL: "approval",
  KNOWLEDGE_REPOSITORY: "knowledge_repository",
} as const;

export type KnowledgeValidationStageId =
  (typeof KnowledgeValidationStage)[keyof typeof KnowledgeValidationStage];

export const KnowledgeValidationStatus = {
  APPROVED: "approved",
  REJECTED: "rejected",
  NEEDS_REVIEW: "needs_review",
  PENDING_SIMULATION: "pending_simulation",
} as const;

export type KnowledgeValidationStatusId =
  (typeof KnowledgeValidationStatus)[keyof typeof KnowledgeValidationStatus];

/** Unified entry for Ch 5.17 validation — distinct from Ch 5.2 KnowledgeObject */
export type ValidatableKnowledgeEntry = {
  id: string;
  kind: ValidatableKnowledgeKindId;
  category: string;
  title: string;
  description: string;
  recommendation: string;
  purpose: string;
  confidence: number;
  version: string;
  evidenceSources: string[];
  references: string[];
  conditions: string[];
  explainable: string;
  businessGoal?: string;
  previousVersion?: string;
};

export type KnowledgeConflictRecord = {
  entryA: string;
  entryB: string;
  reason: string;
  requiresExpertReview: boolean;
  context?: string;
};

export type KnowledgeDuplicateCandidate = {
  entryA: string;
  entryB: string;
  similarity: number;
  mergeRecommended: boolean;
};

export type KnowledgeSimulationInput = {
  blueprintCount?: number;
  commercialScoreDelta?: number;
  visionScoreDelta?: number;
  retryRate?: number;
  stableDecisions?: boolean;
};

export type KnowledgeValidationViolation = {
  code: KnowledgeValidationFailureCode;
  stage: KnowledgeValidationStageId;
  message: string;
  entryId?: string;
};

export type KnowledgeValidationStageResult = {
  stage: KnowledgeValidationStageId;
  passed: boolean;
  violations: KnowledgeValidationViolation[];
};

export type KnowledgeEntryValidationReport = {
  entryId: string;
  status: KnowledgeValidationStatusId;
  approved: boolean;
  confidence: number;
  stages: KnowledgeValidationStageResult[];
  violations: KnowledgeValidationViolation[];
  conflicts: KnowledgeConflictRecord[];
  duplicateCandidates: KnowledgeDuplicateCandidate[];
  recommendations: string[];
  explainable: boolean;
  pipelineComplete: boolean;
};

export type KnowledgeCatalogValidationReport = {
  valid: boolean;
  violations: KnowledgeValidationViolation[];
  entryReports: KnowledgeEntryValidationReport[];
  conflicts: KnowledgeConflictRecord[];
  duplicates: KnowledgeDuplicateCandidate[];
  approvedCount: number;
  rejectedCount: number;
  needsReviewCount: number;
  goldenRuleSatisfied: boolean;
  continuousValidationReady: boolean;
  evolutionReady: boolean;
};

export type KnowledgeValidationContext = {
  publishWithoutValidation?: boolean;
  missingConflictControl?: boolean;
  unknownProvenance?: boolean;
  containsDuplicates?: boolean;
  noRevalidation?: boolean;
};

export type KnowledgeValidationFailureCode =
  | "SCHEMA_INVALID"
  | "SEMANTIC_INVALID"
  | "KNOWLEDGE_CONFLICT"
  | "MISSING_EVIDENCE"
  | "BROKEN_DEPENDENCY"
  | "DUPLICATE_KNOWLEDGE"
  | "SIMULATION_FAILED"
  | "LOW_CONFIDENCE"
  | "VERSION_INCOMPATIBLE"
  | "UNEXPLAINABLE_KNOWLEDGE"
  | "UNPUBLISHED_KNOWLEDGE"
  | "CONTINUOUS_VALIDATION_REQUIRED";
