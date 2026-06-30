/**
 * Chapter 6.17 — Learning & Feedback Stage types
 * Distinct from Ch 5.19 KnowledgeLearningFeedback cycle types.
 */
import type { PipelineAssemblyMetadata } from "./blueprint-assembly-stage-types";
import type { DesignPattern } from "./pattern-library-types";
import type { DesignAntiPattern } from "./anti-pattern-library-types";
import type { MemoryUpdate } from "./design-memory-types";
import type { KnowledgeLearningCycleReport, KnowledgePatternProposal } from "./knowledge-learning-types";
import type { PlannedCommercialReport } from "./commercial-validation-stage-types";
import type { PlannedDirectorReport } from "./chief-design-director-review-stage-types";
import type { PlannedVisionReport } from "./vision-validation-stage-types";
import type { RenderBlueprint } from "./types";

export const LearningFeedbackStage = {
  INPUT_ASSEMBLY: "input_assembly",
  SOURCE_COLLECTION: "source_collection",
  COMMERCIAL_METRICS: "commercial_metrics",
  RETRY_HISTORY: "retry_history",
  PATTERN_LEARNING: "pattern_learning",
  ANTI_PATTERN_LEARNING: "anti_pattern_learning",
  KNOWLEDGE_FEEDBACK: "knowledge_feedback",
  DESIGN_MEMORY_UPDATE: "design_memory_update",
  TREND_DETECTION: "trend_detection",
  MARKETPLACE_LEARNING: "marketplace_learning",
  LEARNING_PACKAGE_BUILD: "learning_package_build",
  KNOWLEDGE_HANDOFF: "knowledge_handoff",
  VALIDATION: "validation",
  STAGE_COMPLETE: "stage_complete",
} as const;

export type LearningFeedbackStageId =
  (typeof LearningFeedbackStage)[keyof typeof LearningFeedbackStage];

/** Ch 6.17 PlannedLearningRetryHistory — spec RetryHistory */
export type PlannedLearningRetryHistory = {
  attempts: number;
  reasons: string[];
  fixedIssues: string[];
  strategiesUsed: string[];
};

/** Ch 6.17 PlannedLearningFinalScores — spec FinalScores */
export type PlannedLearningFinalScores = {
  visionScore: number;
  commercialScore: number;
  professionalScore: number;
  ctrPrediction: number;
  marketplaceFit: number;
};

/** Ch 6.17 PlannedUserFeedback — spec Feedback */
export type PlannedUserFeedback = {
  rating: "positive" | "negative" | "neutral";
  comment?: string;
  timestamp: number;
};

/** Ch 6.17 PlannedLearningPackage — spec LearningPackage */
export type PlannedLearningPackage = {
  projectId: string;
  blueprint: RenderBlueprint;
  vision: PlannedVisionReport;
  commercial: PlannedCommercialReport;
  director: PlannedDirectorReport;
  retryHistory: PlannedLearningRetryHistory;
  finalScores: PlannedLearningFinalScores;
  metadata: PipelineAssemblyMetadata;
  imageRef: string;
  marketplace: string;
  userFeedback?: PlannedUserFeedback;
};

export type PlannedPatternStatisticsUpdate = {
  patternId: string;
  patternName: string;
  usageCount: number;
  successRate: number;
  commercialScore: number;
};

export type PlannedAntiPatternStatisticsUpdate = {
  antiPatternId: string;
  antiPatternName: string;
  detectedCount: number;
  successfullyFixed: number;
  retryImpact: "low" | "medium" | "high";
};

export type PlannedKnowledgeFeedbackProposal = {
  kind: "rule_update" | "pattern_candidate" | "anti_pattern_proposal";
  title: string;
  description: string;
  confidenceDelta: number;
  status: "proposed" | "pending_validation";
};

export type PlannedMarketplaceLearningInsight = {
  marketplace: string;
  insight: string;
  sampleCount: number;
  avgCommercialScore: number;
};

export type LearningFeedbackInput = {
  learningPackage: PlannedLearningPackage;
};

export type LearningFeedbackSection = {
  learningPackage: PlannedLearningPackage;
  patternUpdates: PlannedPatternStatisticsUpdate[];
  antiPatternUpdates: PlannedAntiPatternStatisticsUpdate[];
  knowledgeProposals: PlannedKnowledgeFeedbackProposal[];
  marketplaceInsights: PlannedMarketplaceLearningInsight[];
  memoryUpdate: MemoryUpdate;
  knowledgeCycle?: KnowledgeLearningCycleReport;
  learningPackageId: string;
  blueprint: RenderBlueprint;
  stagesCompleted: LearningFeedbackStageId[];
  confidence: number;
};

export type LearningFeedbackStageViolation = {
  code: LearningFeedbackStageFailureCode;
  message: string;
  stage?: LearningFeedbackStageId;
};

export type LearningFeedbackReport = {
  valid: boolean;
  violations: LearningFeedbackStageViolation[];
  section?: LearningFeedbackSection;
  stagesCompleted: LearningFeedbackStageId[];
  durationMs: number;
};

export type LearningFeedbackContext = {
  missingDirectorReport?: boolean;
  missingCommercialReport?: boolean;
  missingVisionReport?: boolean;
  skipKnowledgeHandoff?: boolean;
  injectUserFeedback?: PlannedUserFeedback;
  injectRepeatingAntiPattern?: boolean;
  injectNoPatternUpdate?: boolean;
  marketplace?: string;
  providerId?: string;
};

export type LearningFeedbackSystemReport = {
  valid: boolean;
  violations: LearningFeedbackStageViolation[];
  goldenRuleSatisfied: boolean;
  learningPackageBuilt: boolean;
  patternStatisticsUpdated: boolean;
  antiPatternStatisticsUpdated: boolean;
  designMemoryUpdated: boolean;
  knowledgeHandoffComplete: boolean;
  downstreamReady: boolean;
};

export type LearningFeedbackStageFailureCode =
  | "MISSING_VISION_REPORT"
  | "MISSING_COMMERCIAL_REPORT"
  | "MISSING_DIRECTOR_REPORT"
  | "MISSING_LEARNING_PACKAGE"
  | "PATTERN_STATS_NOT_UPDATED"
  | "ANTI_PATTERN_STATS_NOT_UPDATED"
  | "DESIGN_MEMORY_NOT_UPDATED"
  | "KNOWLEDGE_HANDOFF_FAILED"
  | "USER_FEEDBACK_IGNORED"
  | "BLUEPRINT_MUTATED"
  | "KNOWLEDGE_DEGRADED";
