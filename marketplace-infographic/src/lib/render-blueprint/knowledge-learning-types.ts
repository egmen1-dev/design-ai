/**
 * Chapter 5.19 — Knowledge Learning types
 */

export const KnowledgeLearningSource = {
  GENERATION_RESULT: "generation_result",
  VISION_REPORT: "vision_report",
  COMMERCIAL_SCORE: "commercial_score",
  CTR_PREDICTION: "ctr_prediction",
  RETRY_RESULT: "retry_result",
  USER_FEEDBACK: "user_feedback",
  MARKETPLACE_ANALYTICS: "marketplace_analytics",
  EXPERT_REVIEW: "expert_review",
  RESEARCH: "research",
  DESIGN_MEMORY: "design_memory",
} as const;

export type KnowledgeLearningSourceId =
  (typeof KnowledgeLearningSource)[keyof typeof KnowledgeLearningSource];

export const KnowledgeLearningStage = {
  GENERATION: "generation",
  EVALUATION: "evaluation",
  FEEDBACK_COLLECTION: "feedback_collection",
  PATTERN_DETECTION: "pattern_detection",
  KNOWLEDGE_PROPOSAL: "knowledge_proposal",
  VALIDATION: "validation",
  KNOWLEDGE_UPDATE: "knowledge_update",
  KNOWLEDGE_ENGINE: "knowledge_engine",
} as const;

export type KnowledgeLearningStageId =
  (typeof KnowledgeLearningStage)[keyof typeof KnowledgeLearningStage];

export const KnowledgeProposalKind = {
  PATTERN: "pattern",
  ANTI_PATTERN: "anti_pattern",
  RULE_UPDATE: "rule_update",
  CONFIDENCE_ADJUSTMENT: "confidence_adjustment",
} as const;

export type KnowledgeProposalKindId =
  (typeof KnowledgeProposalKind)[keyof typeof KnowledgeProposalKind];

export const KnowledgeProposalStatus = {
  PROPOSED: "proposed",
  PENDING_VALIDATION: "pending_validation",
  PENDING_EXPERT_REVIEW: "pending_expert_review",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

export type KnowledgeProposalStatusId =
  (typeof KnowledgeProposalStatus)[keyof typeof KnowledgeProposalStatus];

/** Design decision object for learning — not image-level */
export type KnowledgeLearningObject = {
  generationId: string;
  composition?: string;
  style?: string;
  lighting?: string;
  camera?: string;
  materials?: string;
  colorPalette?: string;
  patternId?: string;
  antiPatternId?: string;
  marketplace?: string;
  category?: string;
};

export type KnowledgeLearningOutcome = {
  visionScore: number;
  commercialScore: number;
  ctrPrediction?: number;
  retryCount: number;
  userSatisfaction?: number;
};

export type KnowledgeLearningFeedback = {
  source: KnowledgeLearningSourceId;
  trustWeight: number;
  generationId: string;
  ruleId?: string;
  learningObject: KnowledgeLearningObject;
  outcome: KnowledgeLearningOutcome;
  userRating?: "positive" | "negative" | "neutral";
  expertApproved?: boolean;
  timestamp: Date;
};

export type KnowledgeConfidenceAdjustment = {
  ruleId: string;
  previousConfidence: number;
  newConfidence: number;
  delta: number;
  reason: string;
  stable: boolean;
  sampleCount: number;
};

export type KnowledgePatternProposal = {
  id: string;
  kind: KnowledgeProposalKindId;
  status: KnowledgeProposalStatusId;
  title: string;
  description: string;
  dimensions: Partial<KnowledgeLearningObject>;
  successRate: number;
  sampleCount: number;
  marketplace?: string;
  requiresExpertReview: boolean;
  evidenceSources: KnowledgeLearningSourceId[];
};

export type KnowledgeLearningMetrics = {
  visionScoreAvg: number;
  commercialScoreAvg: number;
  ctrPredictionAvg: number;
  retryRate: number;
  patternSuccessRate: number;
  antiPatternFrequency: number;
  userSatisfactionAvg: number;
  confidenceGrowth: number;
};

export type KnowledgeLearningViolation = {
  code: KnowledgeLearningFailureCode;
  stage: KnowledgeLearningStageId;
  message: string;
  ruleId?: string;
  proposalId?: string;
};

export type KnowledgeLearningStageResult = {
  stage: KnowledgeLearningStageId;
  passed: boolean;
  violations: KnowledgeLearningViolation[];
};

export type KnowledgeLearningCycleReport = {
  generationId: string;
  pipelineComplete: boolean;
  stages: KnowledgeLearningStageResult[];
  violations: KnowledgeLearningViolation[];
  confidenceAdjustments: KnowledgeConfidenceAdjustment[];
  patternProposals: KnowledgePatternProposal[];
  antiPatternProposals: KnowledgePatternProposal[];
  metrics: KnowledgeLearningMetrics;
  knowledgeUpdated: boolean;
  validationRequired: boolean;
};

export type KnowledgeLearningSystemReport = {
  valid: boolean;
  violations: KnowledgeLearningViolation[];
  goldenRuleSatisfied: boolean;
  continuousLearningReady: boolean;
  stabilityMaintained: boolean;
  safetyMechanismsActive: boolean;
  proposalCount: number;
  approvedProposalCount: number;
};

export type KnowledgeLearningContext = {
  skipValidation?: boolean;
  allowUnvalidatedProposal?: boolean;
  singleFeedbackOverride?: boolean;
  bypassStability?: boolean;
  marketplace?: string;
};

export type KnowledgeLearningFailureCode =
  | "UNVALIDATED_PROPOSAL"
  | "CHAOTIC_CONFIDENCE"
  | "MISSING_EXPERT_REVIEW"
  | "INSUFFICIENT_FEEDBACK"
  | "STABILITY_VIOLATION"
  | "KNOWLEDGE_DEGRADATION"
  | "REPEATED_ERROR"
  | "SIMULATION_REQUIRED"
  | "REGRESSION_REQUIRED"
  | "COMPATIBILITY_REQUIRED"
  | "SINGLE_FEEDBACK_OVERRIDE"
  | "PIPELINE_INCOMPLETE";
