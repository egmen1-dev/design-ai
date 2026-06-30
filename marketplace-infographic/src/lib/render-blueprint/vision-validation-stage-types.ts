/**
 * Chapter 6.14 — Vision Validation Stage types
 * Distinct from Ch 3.18 VisionReport and Ch 4.18 VisionQualityReport.
 */
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";
import type { PlannedRenderResult } from "./rendering-stage-types";
import type { VisionQualityExplainabilityReport, VisionQualityReport } from "./vision-quality-director-types";
import type { ConstraintSet } from "./constraint-types";
import type { RenderBlueprint } from "./types";

export const VisionValidationStage = {
  INPUT_ASSEMBLY: "input_assembly",
  TECHNICAL_VALIDATION: "technical_validation",
  COMPOSITION_VALIDATION: "composition_validation",
  PHOTOGRAPHY_VALIDATION: "photography_validation",
  BLUEPRINT_MATCHING: "blueprint_matching",
  HERO_PRODUCT_VALIDATION: "hero_product_validation",
  ARTIFACT_DETECTION: "artifact_detection",
  MARKETPLACE_VALIDATION: "marketplace_validation",
  TECHNICAL_QUALITY: "technical_quality",
  VISION_SCORE: "vision_score",
  RETRY_PLANNING: "retry_planning",
  EXPLAINABILITY: "explainability",
  APPROVAL_DECISION: "approval_decision",
  VALIDATION: "validation",
  STAGE_COMPLETE: "stage_complete",
} as const;

export type VisionValidationStageId =
  (typeof VisionValidationStage)[keyof typeof VisionValidationStage];

/** Ch 6.14 PlannedVisionViolation — spec Violation */
export type PlannedVisionViolation = {
  id: string;
  category: string;
  description: string;
  severity: string;
  reason: string;
  recommendation: string;
  expected?: string;
  actual?: string;
};

/** Ch 6.14 PlannedVisionRecommendation — spec Recommendation */
export type PlannedVisionRecommendation = {
  target: string;
  action: string;
  reason: string;
};

/** Ch 6.14 PlannedVisionReport — spec VisionReport */
export type PlannedVisionReport = {
  overallScore: number;
  technicalScore: number;
  compositionScore: number;
  photographyScore: number;
  renderAccuracy: number;
  artifactScore: number;
  violations: PlannedVisionViolation[];
  recommendations: PlannedVisionRecommendation[];
  approved: boolean;
};

export type VisionLayerScores = {
  technical: number;
  composition: number;
  photography: number;
  blueprintMatching: number;
  artifacts: number;
  marketplace: number;
};

export type VisionValidationInput = {
  profile: AnalyzedProductProfile;
  blueprint: RenderBlueprint;
  renderResult: PlannedRenderResult;
  imageRef: string;
  constraintSet: ConstraintSet;
  knowledge: StagedKnowledgePackage;
  marketplace: string;
};

export type VisionValidationSection = {
  plannedReport: PlannedVisionReport;
  layerScores: VisionLayerScores;
  engineReport: VisionQualityReport;
  explainability: VisionQualityExplainabilityReport;
  blueprint: RenderBlueprint;
  stagesCompleted: VisionValidationStageId[];
  confidence: number;
};

export type VisionValidationStageViolation = {
  code: VisionValidationStageFailureCode;
  message: string;
  stage?: VisionValidationStageId;
};

export type VisionValidationReport = {
  valid: boolean;
  violations: VisionValidationStageViolation[];
  section?: VisionValidationSection;
  stagesCompleted: VisionValidationStageId[];
  durationMs: number;
};

export type VisionValidationContext = {
  missingImage?: boolean;
  missingBlueprint?: boolean;
  injectHeroTooSmall?: boolean;
  injectDuplicateObjects?: boolean;
  injectLightingDrift?: boolean;
  injectCriticalArtifact?: boolean;
  marketplace?: string;
  providerId?: string;
};

export type VisionValidationSystemReport = {
  valid: boolean;
  violations: VisionValidationStageViolation[];
  goldenRuleSatisfied: boolean;
  blueprintCompared: boolean;
  artifactsDetected: boolean;
  explainabilityComplete: boolean;
  retryTargeted: boolean;
  downstreamReady: boolean;
};

export type VisionValidationStageFailureCode =
  | "MISSING_IMAGE"
  | "MISSING_BLUEPRINT"
  | "MISSING_RENDER_RESULT"
  | "UNAPPROVED_WITH_CRITICAL_VIOLATIONS"
  | "HERO_PRODUCT_LOST"
  | "BLUEPRINT_IGNORED"
  | "ARTIFACT_MISSED"
  | "MISSING_EXPLAINABILITY"
  | "AESTHETIC_ONLY_JUDGMENT"
  | "MISSING_VISION_REPORT";
