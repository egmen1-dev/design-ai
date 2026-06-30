/**
 * Chapter 7.23 — Senior Art Director Agent types
 * Lead design expert — holistic professional art direction audit.
 */
import type { AgentContractId } from "./agent-contracts";
import type { CameraDirectorAgentBlueprint } from "./camera-director-agent-types";
import type { CommercialCriticAgentReport } from "./commercial-critic-agent-types";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { LightingDirectorAgentBlueprint } from "./lighting-director-agent-types";
import type { MarketplaceDirectorAgentBlueprint } from "./marketplace-director-agent-types";
import type { MaterialDirectorAgentBlueprint } from "./material-director-agent-types";
import type { PatternDirectorAgentBlueprint } from "./pattern-director-agent-types";
import type { PhotographyDirectorAgentBlueprint } from "./photography-director-agent-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import type { TypographyDirectorAgentBlueprint } from "./typography-director-agent-types";
import type { VisionCriticAgentReport } from "./vision-critic-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";

export const SENIOR_ART_DIRECTOR_AGENT_ID: AgentContractId = "senior-art-director";

/** Ch 7.23 internal agent modules (7) */
export const SeniorArtDirectorAgentModule = {
  DESIGN_HARMONY_ANALYZER: "design_harmony_analyzer",
  MODERN_DESIGN_EVALUATOR: "modern_design_evaluator",
  PREMIUM_QUALITY_INSPECTOR: "premium_quality_inspector",
  CREATIVE_DIRECTION_ENGINE: "creative_direction_engine",
  DESIGN_CONSISTENCY_VALIDATOR: "design_consistency_validator",
  ART_DIRECTOR_VALIDATOR: "art_director_validator",
  ART_DIRECTOR_REPORT_BUILDER: "art_director_report_builder",
} as const;

export type SeniorArtDirectorAgentModuleId =
  (typeof SeniorArtDirectorAgentModule)[keyof typeof SeniorArtDirectorAgentModule];

export type SeniorArtDirectorAgentProblem = {
  id: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  modules?: string[];
};

export type SeniorArtDirectorAgentRecommendation = {
  id: string;
  target: string;
  action: string;
  priority: "low" | "medium" | "high";
};

/** Ch 7.23 SeniorArtDirectorInput — agent contract */
export type SeniorArtDirectorAgentInput = {
  storyBlueprint: VisualStoryDirectorAgentBlueprint;
  sceneBlueprint: SceneDirectorAgentBlueprint;
  layoutBlueprint: CompositionDirectorAgentBlueprint;
  photographyBlueprint: PhotographyDirectorAgentBlueprint;
  lightingBlueprint: LightingDirectorAgentBlueprint;
  cameraBlueprint: CameraDirectorAgentBlueprint;
  materialBlueprint: MaterialDirectorAgentBlueprint;
  typographyBlueprint: TypographyDirectorAgentBlueprint;
  marketplaceBlueprint: MarketplaceDirectorAgentBlueprint;
  patternBlueprint: PatternDirectorAgentBlueprint;
  visionReport: VisionCriticAgentReport;
  commercialReport: CommercialCriticAgentReport;
};

/** Ch 7.23 ArtDirectorReport — agent output contract */
export type SeniorArtDirectorAgentReport = {
  overallDesignScore: number;
  modernityScore: number;
  premiumScore: number;
  visualTaste: number;
  designConsistency: number;
  creativeQuality: number;
  criticalProblems: SeniorArtDirectorAgentProblem[];
  recommendations: SeniorArtDirectorAgentRecommendation[];
  retryRequired: boolean;
  confidence: number;
};

export type SeniorArtDirectorAgentModuleRecord = {
  module: SeniorArtDirectorAgentModuleId;
  at: number;
  detail?: string;
};

export type SeniorArtDirectorAgentKpi = {
  designEvaluationAccuracy: number;
  premiumDetectionAccuracy: number;
  modernityPrediction: number;
  designConsistencyAccuracy: number;
  recommendationQuality: number;
  retryPrecision: number;
  confidenceScore: number;
};

export type SeniorArtDirectorAgentViolationRecord = {
  code: SeniorArtDirectorAgentFailureCode;
  module?: SeniorArtDirectorAgentModuleId;
  message: string;
};

export type SeniorArtDirectorAgentRetryBranch = "harmony_modernity_consistency" | "full";

export type SeniorArtDirectorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof SENIOR_ART_DIRECTOR_AGENT_ID;
  violations: SeniorArtDirectorAgentViolationRecord[];
  modulesCompleted: SeniorArtDirectorAgentModuleId[];
  moduleRecords: SeniorArtDirectorAgentModuleRecord[];
  input: SeniorArtDirectorAgentInput;
  report?: SeniorArtDirectorAgentReport;
  confidence: number;
  retryCount: number;
  retryBranch?: SeniorArtDirectorAgentRetryBranch;
  durationMs: number;
  kpis: SeniorArtDirectorAgentKpi;
  pipelineMediated: boolean;
  doesNotFixErrors: boolean;
  goldenRuleSatisfied: boolean;
};

export type SeniorArtDirectorAgentValidationReport = {
  valid: boolean;
  violations: SeniorArtDirectorAgentViolationRecord[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type SeniorArtDirectorAgentContext = {
  lowDesignScore?: boolean;
  outdatedDesign?: boolean;
  lackOfHarmony?: boolean;
  lowPremiumQuality?: boolean;
  designInconsistency?: boolean;
  injectCriticalProblem?: boolean;
  lowConfidence?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type SeniorArtDirectorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "LOW_DESIGN_SCORE"
  | "OUTDATED_DESIGN_UNDETECTED"
  | "HARMONY_FAILURE"
  | "LOW_PREMIUM_QUALITY"
  | "DESIGN_INCONSISTENCY_UNDETECTED"
  | "CRITICAL_PROBLEM_MISSED"
  | "REPORT_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "FALSE_POSITIVE_SPIKE"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type SeniorArtDirectorAgentModuleDefinition = {
  id: SeniorArtDirectorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type SeniorArtDirectorAgentPipelineLink = {
  from: string;
  to: string;
};
