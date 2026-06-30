/**
 * Chapter 6.18 — Pipeline Completion & Delivery Stage types
 * Distinct from Ch 6 DesignPipelineOutput and Ch 3.8 blueprint snapshots.
 */
import type { PipelineAssemblyMetadata } from "./blueprint-assembly-stage-types";
import type { PlannedCommercialReport } from "./commercial-validation-stage-types";
import type { PlannedDirectorReport } from "./chief-design-director-review-stage-types";
import type {
  PlannedLearningFinalScores,
  PlannedLearningPackage,
  PlannedLearningRetryHistory,
} from "./learning-feedback-stage-types";
import type { PlannedVisionReport } from "./vision-validation-stage-types";
import type { RenderBlueprint } from "./types";

export const PipelineCompletionStage = {
  INPUT_ASSEMBLY: "input_assembly",
  FINAL_APPROVAL_CHECK: "final_approval_check",
  PROJECT_REGISTRATION: "project_registration",
  ARTIFACT_STORAGE: "artifact_storage",
  BLUEPRINT_ARCHIVE: "blueprint_archive",
  METRICS_REGISTRATION: "metrics_registration",
  ANALYTICS_UPDATE: "analytics_update",
  DELIVERY_PACKAGE_BUILD: "delivery_package_build",
  REPRODUCIBILITY_RECORD: "reproducibility_record",
  USER_DELIVERY: "user_delivery",
  PIPELINE_FINALIZATION: "pipeline_finalization",
  PROJECT_STATUS: "project_status",
  EXPLAINABILITY: "explainability",
  VALIDATION: "validation",
  STAGE_COMPLETE: "stage_complete",
} as const;

export type PipelineCompletionStageId =
  (typeof PipelineCompletionStage)[keyof typeof PipelineCompletionStage];

export const ProjectCompletionStatus = {
  COMPLETED: "completed",
  COMPLETED_WITH_NOTES: "completed_with_notes",
  ARCHIVED: "archived",
  LEARNING_ONLY: "learning_only",
} as const;

export type ProjectCompletionStatusId =
  (typeof ProjectCompletionStatus)[keyof typeof ProjectCompletionStatus];

export const PipelineFinalizationState = {
  CREATED: "created",
  PLANNING: "planning",
  RENDERING: "rendering",
  VALIDATION: "validation",
  LEARNING: "learning",
  COMPLETED: "completed",
} as const;

export type PipelineFinalizationStateId =
  (typeof PipelineFinalizationState)[keyof typeof PipelineFinalizationState];

/** Ch 6.18 PlannedFinalImage — spec Image */
export type PlannedFinalImage = {
  ref: string;
  format: string;
  width: number;
  height: number;
};

/** Ch 6.18 PlannedProjectMetadata — spec ProjectMetadata */
export type PlannedProjectMetadata = {
  projectId: string;
  createdAt: number;
  completedAt: number;
  pipelineVersion: string;
  knowledgeEngineVersion: string;
  patternsUsed: string[];
  providersUsed: string[];
  finalScores: PlannedLearningFinalScores;
  marketplace: string;
  generationTimeMs: number;
  retryCount: number;
};

/** Ch 6.18 PlannedFinalProject — spec FinalProject */
export type PlannedFinalProject = {
  projectId: string;
  image: PlannedFinalImage;
  blueprint: RenderBlueprint;
  vision: PlannedVisionReport;
  commercial: PlannedCommercialReport;
  director: PlannedDirectorReport;
  learning: PlannedLearningPackage;
  metadata: PlannedProjectMetadata;
};

export type PlannedArtifactStorage = {
  blueprint: RenderBlueprint;
  renderPrompt: string;
  negativePrompt: string;
  providerParameters: Record<string, unknown>;
  pipelineSnapshots: string[];
  consensusReportId?: string;
  retryHistory: PlannedLearningRetryHistory;
  finalScores: PlannedLearningFinalScores;
};

export type PlannedDeliveryArtifact = {
  type: string;
  ref: string;
  label: string;
};

/** Ch 6.18 PlannedDeliveryPackage — user-facing delivery bundle */
export type PlannedDeliveryPackage = {
  imagePng: string;
  blueprintRef: string;
  commercialReportRef: string;
  versionHistoryRef: string;
  artifacts: PlannedDeliveryArtifact[];
};

export type PlannedMetricsRegistration = {
  visionScore: number;
  commercialScore: number;
  professionalScore: number;
  ctrPrediction: number;
  retryCount: number;
  generationTimeMs: number;
  patternsUsed: string[];
  success: boolean;
};

export type PlannedAnalyticsUpdate = {
  category: string;
  marketplace: string;
  patternEffectiveness: number;
  storyEffectiveness: number;
  compositionEffectiveness: number;
  photographyEffectiveness: number;
  sampleCount: number;
};

export type PlannedReproducibilityRecord = {
  pipelineVersion: string;
  knowledgeEngineVersion: string;
  renderIntentVersion: string;
  providerProfile: string;
  seed: number;
  blueprintChecksum: string;
};

export type PipelineCompletionInput = {
  learningPackage: PlannedLearningPackage;
  renderPrompt: string;
  negativePrompt: string;
  providerParameters: Record<string, unknown>;
  generationTimeMs: number;
  consensusReportId?: string;
  pipelineSnapshots?: string[];
};

export type PipelineCompletionSection = {
  finalProject: PlannedFinalProject;
  artifactStorage: PlannedArtifactStorage;
  deliveryPackage: PlannedDeliveryPackage;
  metrics: PlannedMetricsRegistration;
  analytics: PlannedAnalyticsUpdate;
  reproducibility: PlannedReproducibilityRecord;
  projectStatus: ProjectCompletionStatusId;
  pipelineState: PipelineFinalizationStateId;
  blueprint: RenderBlueprint;
  stagesCompleted: PipelineCompletionStageId[];
  confidence: number;
};

export type PipelineCompletionStageViolation = {
  code: PipelineCompletionStageFailureCode;
  message: string;
  stage?: PipelineCompletionStageId;
};

export type PipelineCompletionReport = {
  valid: boolean;
  violations: PipelineCompletionStageViolation[];
  section?: PipelineCompletionSection;
  stagesCompleted: PipelineCompletionStageId[];
  durationMs: number;
};

export type PipelineCompletionContext = {
  missingLearningPackage?: boolean;
  missingImage?: boolean;
  injectCorruptedExport?: boolean;
  injectLearningOnly?: boolean;
  injectArchived?: boolean;
  marketplace?: string;
  providerId?: string;
};

export type PipelineCompletionSystemReport = {
  valid: boolean;
  violations: PipelineCompletionStageViolation[];
  goldenRuleSatisfied: boolean;
  finalProjectBuilt: boolean;
  artifactsStored: boolean;
  analyticsUpdated: boolean;
  deliveryReady: boolean;
  reproducibilityRecorded: boolean;
  downstreamReady: boolean;
};

export type PipelineCompletionStageFailureCode =
  | "MISSING_LEARNING_PACKAGE"
  | "MISSING_IMAGE"
  | "MISSING_FINAL_PROJECT"
  | "ARTIFACTS_NOT_STORED"
  | "BLUEPRINT_LOST"
  | "ANALYTICS_NOT_UPDATED"
  | "DELIVERY_FAILED"
  | "REPRODUCIBILITY_LOST"
  | "LEARNING_PACKAGE_NOT_SAVED"
  | "INCOMPLETE_REGISTRATION"
  | "BLUEPRINT_MUTATED";
