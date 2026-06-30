/**
 * Chapter 7.20 — Anti-Pattern Director Agent types
 * Quality guardian — detects errors before render pipeline.
 */
import type { AgentContractId } from "./agent-contracts";
import type { CameraDirectorAgentBlueprint } from "./camera-director-agent-types";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { LightingDirectorAgentBlueprint } from "./lighting-director-agent-types";
import type { MarketplaceDirectorAgentBlueprint } from "./marketplace-director-agent-types";
import type { MaterialDirectorAgentBlueprint } from "./material-director-agent-types";
import type { PatternDirectorAgentBlueprint } from "./pattern-director-agent-types";
import type { PhotographyDirectorAgentBlueprint } from "./photography-director-agent-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import type { TypographyDirectorAgentBlueprint } from "./typography-director-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";

export const ANTI_PATTERN_DIRECTOR_AGENT_ID: AgentContractId = "anti-pattern-director";

/** Ch 7.20 internal agent modules (7) */
export const AntiPatternDirectorAgentModule = {
  VISUAL_ANTI_PATTERN_DETECTOR: "visual_anti_pattern_detector",
  COMMERCIAL_ERROR_ANALYZER: "commercial_error_analyzer",
  MARKETPLACE_VIOLATION_CHECKER: "marketplace_violation_checker",
  CONSISTENCY_VALIDATOR: "consistency_validator",
  RISK_ASSESSMENT_ENGINE: "risk_assessment_engine",
  RECOMMENDATION_BUILDER: "recommendation_builder",
  ANTI_PATTERN_REPORT_BUILDER: "anti_pattern_report_builder",
} as const;

export type AntiPatternDirectorAgentModuleId =
  (typeof AntiPatternDirectorAgentModule)[keyof typeof AntiPatternDirectorAgentModule];

export type AntiPatternDirectorAgentRiskLevel = "low" | "medium" | "high" | "critical";

export type AntiPatternDirectorAgentProblem = {
  id: string;
  category: string;
  severity: AntiPatternDirectorAgentRiskLevel;
  message: string;
  source: string;
};

export type AntiPatternDirectorAgentViolation = {
  id: string;
  code: string;
  severity: AntiPatternDirectorAgentRiskLevel;
  message: string;
  antiPatternId?: string;
};

export type AntiPatternDirectorAgentRecommendation = {
  id: string;
  target: string;
  action: string;
  priority: "low" | "medium" | "high";
};

/** Ch 7.20 AntiPatternDirectorInput — agent contract */
export type AntiPatternDirectorAgentInput = {
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
  knowledgePackage: StagedKnowledgePackage;
};

/** Ch 7.20 AntiPatternReport — agent output contract */
export type AntiPatternDirectorAgentReport = {
  detectedProblems: AntiPatternDirectorAgentProblem[];
  criticalViolations: AntiPatternDirectorAgentViolation[];
  recommendations: AntiPatternDirectorAgentRecommendation[];
  retryRequired: boolean;
  overallRisk: number;
  confidence: number;
};

export type AntiPatternDirectorAgentModuleRecord = {
  module: AntiPatternDirectorAgentModuleId;
  at: number;
  detail?: string;
};

export type AntiPatternDirectorAgentKpi = {
  detectionAccuracy: number;
  falsePositiveRate: number;
  commercialErrorDetection: number;
  constitutionCompliance: number;
  retryPrecision: number;
  marketplaceViolationDetection: number;
  confidenceScore: number;
};

export type AntiPatternDirectorAgentViolationRecord = {
  code: AntiPatternDirectorAgentFailureCode;
  module?: AntiPatternDirectorAgentModuleId;
  message: string;
};

export type AntiPatternDirectorAgentRetryBranch = "detection_risk_recommendation" | "full";

export type AntiPatternDirectorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof ANTI_PATTERN_DIRECTOR_AGENT_ID;
  violations: AntiPatternDirectorAgentViolationRecord[];
  modulesCompleted: AntiPatternDirectorAgentModuleId[];
  moduleRecords: AntiPatternDirectorAgentModuleRecord[];
  input: AntiPatternDirectorAgentInput;
  report?: AntiPatternDirectorAgentReport;
  confidence: number;
  retryCount: number;
  retryBranch?: AntiPatternDirectorAgentRetryBranch;
  durationMs: number;
  kpis: AntiPatternDirectorAgentKpi;
  pipelineMediated: boolean;
  doesNotFixErrors: boolean;
  goldenRuleSatisfied: boolean;
};

export type AntiPatternDirectorAgentValidationReport = {
  valid: boolean;
  violations: AntiPatternDirectorAgentViolationRecord[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type AntiPatternDirectorAgentContext = {
  injectCriticalViolations?: boolean;
  highOverallRisk?: boolean;
  constitutionViolated?: boolean;
  agentInconsistency?: boolean;
  lowCommercialScore?: boolean;
  lowConfidence?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type AntiPatternDirectorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "CRITICAL_VIOLATIONS_UNDETECTED"
  | "CRITICAL_VIOLATIONS_PRESENT"
  | "HIGH_OVERALL_RISK"
  | "CONSTITUTION_VIOLATED"
  | "AGENT_INCONSISTENCY_UNDETECTED"
  | "COMMERCIAL_SCORE_TOO_LOW"
  | "REPORT_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "FALSE_POSITIVE_SPIKE"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type AntiPatternDirectorAgentModuleDefinition = {
  id: AntiPatternDirectorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type AntiPatternDirectorAgentPipelineLink = {
  from: string;
  to: string;
};
