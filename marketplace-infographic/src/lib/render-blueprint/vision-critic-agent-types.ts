/**
 * Chapter 7.21 — Vision Critic Agent types
 * Independent visual quality expert — evaluates perception, never creates design.
 */
import type { AgentContractId } from "./agent-contracts";
import type { AntiPatternDirectorAgentReport } from "./anti-pattern-director-agent-types";
import type { CameraDirectorAgentBlueprint } from "./camera-director-agent-types";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { LightingDirectorAgentBlueprint } from "./lighting-director-agent-types";
import type { MarketplaceDirectorAgentBlueprint } from "./marketplace-director-agent-types";
import type { MaterialDirectorAgentBlueprint } from "./material-director-agent-types";
import type { PatternDirectorAgentBlueprint } from "./pattern-director-agent-types";
import type { PhotographyDirectorAgentBlueprint } from "./photography-director-agent-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import type { TypographyDirectorAgentBlueprint } from "./typography-director-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";

export const VISION_CRITIC_AGENT_ID: AgentContractId = "vision-critic";

/** Ch 7.21 internal agent modules (7) */
export const VisionCriticAgentModule = {
  COMPOSITION_INSPECTOR: "composition_inspector",
  HIERARCHY_INSPECTOR: "hierarchy_inspector",
  BALANCE_INSPECTOR: "balance_inspector",
  VISUAL_NOISE_DETECTOR: "visual_noise_detector",
  READABILITY_INSPECTOR: "readability_inspector",
  VISION_VALIDATOR: "vision_validator",
  VISION_REPORT_BUILDER: "vision_report_builder",
} as const;

export type VisionCriticAgentModuleId =
  (typeof VisionCriticAgentModule)[keyof typeof VisionCriticAgentModule];

export type VisionCriticAgentProblem = {
  id: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  rootCause?: string;
};

export type VisionCriticAgentRecommendation = {
  id: string;
  target: string;
  action: string;
  priority: "low" | "medium" | "high";
};

/** Ch 7.21 VisionCriticInput — agent contract */
export type VisionCriticAgentInput = {
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
  antiPatternReport: AntiPatternDirectorAgentReport;
};

/** Ch 7.21 VisionReport — agent output contract */
export type VisionCriticAgentReport = {
  overallScore: number;
  compositionScore: number;
  hierarchyScore: number;
  balanceScore: number;
  readabilityScore: number;
  clarityScore: number;
  visualProblems: VisionCriticAgentProblem[];
  recommendations: VisionCriticAgentRecommendation[];
  retryRequired: boolean;
  confidence: number;
};

export type VisionCriticAgentModuleRecord = {
  module: VisionCriticAgentModuleId;
  at: number;
  detail?: string;
};

export type VisionCriticAgentKpi = {
  visionAccuracy: number;
  problemDetectionRate: number;
  recommendationQuality: number;
  falsePositiveRate: number;
  retryPrecision: number;
  constitutionCompliance: number;
  confidenceScore: number;
};

export type VisionCriticAgentViolationRecord = {
  code: VisionCriticAgentFailureCode;
  module?: VisionCriticAgentModuleId;
  message: string;
};

export type VisionCriticAgentRetryBranch = "inspection_scoring_validation" | "full";

export type VisionCriticAgentExecutionReport = {
  valid: boolean;
  agentId: typeof VISION_CRITIC_AGENT_ID;
  violations: VisionCriticAgentViolationRecord[];
  modulesCompleted: VisionCriticAgentModuleId[];
  moduleRecords: VisionCriticAgentModuleRecord[];
  input: VisionCriticAgentInput;
  report?: VisionCriticAgentReport;
  confidence: number;
  retryCount: number;
  retryBranch?: VisionCriticAgentRetryBranch;
  durationMs: number;
  kpis: VisionCriticAgentKpi;
  pipelineMediated: boolean;
  blueprintUnmodified: boolean;
  goldenRuleSatisfied: boolean;
};

export type VisionCriticAgentValidationReport = {
  valid: boolean;
  violations: VisionCriticAgentViolationRecord[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type VisionCriticAgentContext = {
  lowOverallVisionScore?: boolean;
  poorHeroReadability?: boolean;
  constitutionViolation?: boolean;
  missingHierarchy?: boolean;
  criticalPerceptionProblems?: boolean;
  injectVisualNoise?: boolean;
  lowConfidence?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type VisionCriticAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "VISION_SCORE_TOO_LOW"
  | "HERO_UNREADABLE"
  | "HIERARCHY_MISSING"
  | "CONSTITUTION_VIOLATION"
  | "CRITICAL_PERCEPTION_MISSED"
  | "REPORT_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "FALSE_POSITIVE_SPIKE"
  | "BLUEPRINT_MODIFIED"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type VisionCriticAgentModuleDefinition = {
  id: VisionCriticAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type VisionCriticAgentPipelineLink = {
  from: string;
  to: string;
};
