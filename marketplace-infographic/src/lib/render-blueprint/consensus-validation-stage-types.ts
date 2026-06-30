/**
 * Chapter 6.11 — Consensus Validation Stage types
 * Distinct from Ch 4.23 ConsensusReport and ConsensusValidationReport.
 */
import type { AssemblyConflict, PipelineAssemblyMetadata } from "./blueprint-assembly-stage-types";
import type { BusinessUnderstandingSection } from "./business-understanding-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";
import type { ConsensusReport as EngineConsensusReport } from "./consensus-engine-types";
import type { ConstraintSet } from "./constraint-types";
import type { RenderBlueprint } from "./types";

export const ConsensusValidationStage = {
  INPUT_ASSEMBLY: "input_assembly",
  BUSINESS_VALIDATION: "business_validation",
  STORY_VALIDATION: "story_validation",
  SCENE_VALIDATION: "scene_validation",
  COMPOSITION_VALIDATION: "composition_validation",
  PHOTOGRAPHY_VALIDATION: "photography_validation",
  MARKETPLACE_VALIDATION: "marketplace_validation",
  KNOWLEDGE_VALIDATION: "knowledge_validation",
  CONFLICT_GRAPH: "conflict_graph",
  CONSENSUS_SCORE: "consensus_score",
  RETRY_PLANNING: "retry_planning",
  EXPLAINABILITY: "explainability",
  APPROVAL_DECISION: "approval_decision",
  VALIDATION: "validation",
  STAGE_COMPLETE: "stage_complete",
} as const;

export type ConsensusValidationStageId =
  (typeof ConsensusValidationStage)[keyof typeof ConsensusValidationStage];

export const ConsensusStatus = {
  APPROVED: "approved",
  RETRY_REQUIRED: "retry_required",
  INCONSISTENT: "inconsistent",
} as const;

export type ConsensusStatusId = (typeof ConsensusStatus)[keyof typeof ConsensusStatus];

/** Ch 6.11 Consensus Report — spec ConsensusReport */
export type PlannedConsensusConflict = {
  id: string;
  modules: string[];
  description: string;
  severity: string;
  reason: string;
  recommendation: string;
};

export type PlannedConsensusRecommendation = {
  target: string;
  action: string;
  reason: string;
};

export type PlannedConsensusReport = {
  overallScore: number;
  status: string;
  conflicts: PlannedConsensusConflict[];
  recommendations: PlannedConsensusRecommendation[];
  retryRequired: boolean;
  retryTargets: string[];
  approved: boolean;
};

export type ConsensusLayerScores = {
  business: number;
  story: number;
  scene: number;
  composition: number;
  photography: number;
  marketplace: number;
  knowledge: number;
};

export type ConsensusValidationInput = {
  profile: AnalyzedProductProfile;
  business: BusinessUnderstandingSection;
  blueprint: RenderBlueprint;
  constraintSet: ConstraintSet;
  metadata: PipelineAssemblyMetadata;
  knowledge: StagedKnowledgePackage;
  assemblyConflicts: AssemblyConflict[];
  marketplace: string;
};

export type ConsensusValidationSection = {
  plannedReport: PlannedConsensusReport;
  layerScores: ConsensusLayerScores;
  engineReport: EngineConsensusReport;
  blueprint: RenderBlueprint;
  stagesCompleted: ConsensusValidationStageId[];
  confidence: number;
};

export type ConsensusValidationViolation = {
  code: ConsensusValidationFailureCode;
  message: string;
  stage?: ConsensusValidationStageId;
};

export type ConsensusValidationReport = {
  valid: boolean;
  violations: ConsensusValidationViolation[];
  section?: ConsensusValidationSection;
  stagesCompleted: ConsensusValidationStageId[];
  durationMs: number;
};

export type ConsensusValidationContext = {
  missingBlueprint?: boolean;
  missingBusinessModel?: boolean;
  injectPremiumBudgetConflict?: boolean;
  injectStorySceneConflict?: boolean;
  forceCriticalConflict?: boolean;
  businessGoalIgnored?: boolean;
};

export type ConsensusValidationSystemReport = {
  valid: boolean;
  violations: ConsensusValidationViolation[];
  goldenRuleSatisfied: boolean;
  conflictsDetected: boolean;
  businessGoalProtected: boolean;
  explainabilityComplete: boolean;
  retryMinimized: boolean;
  downstreamReady: boolean;
};

export type ConsensusValidationFailureCode =
  | "MISSING_BLUEPRINT"
  | "MISSING_BUSINESS_MODEL"
  | "MISSING_CONSTRAINT_SET"
  | "MISSING_KNOWLEDGE"
  | "UNAPPROVED_WITH_CRITICAL_CONFLICTS"
  | "BUSINESS_GOAL_IGNORED"
  | "MISSING_EXPLAINABILITY"
  | "DESIGN_DECISION_DETECTED"
  | "DIRECTOR_VALIDATION_FAILED";
