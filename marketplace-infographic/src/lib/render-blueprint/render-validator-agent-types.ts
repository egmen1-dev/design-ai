/**
 * Chapter 7.28 — Render Validator Agent types
 * Final technical quality gate — compares rendered image to approved blueprints.
 */
import type { AgentContractId } from "./agent-contracts";
import type { ChiefDesignDirectorAgentFinalDecision } from "./chief-design-director-agent-types";
import type { CameraDirectorAgentBlueprint } from "./camera-director-agent-types";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { LightingDirectorAgentBlueprint } from "./lighting-director-agent-types";
import type { MarketplaceDirectorAgentBlueprint } from "./marketplace-director-agent-types";
import type { MaterialDirectorAgentBlueprint } from "./material-director-agent-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import type { TypographyDirectorAgentBlueprint } from "./typography-director-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";

export const RENDER_VALIDATOR_AGENT_ID: AgentContractId = "render-validator";

/** Ch 7.28 internal agent modules (7) */
export const RenderValidatorAgentModule = {
  IMAGE_ANALYZER: "image_analyzer",
  BLUEPRINT_COMPARATOR: "blueprint_comparator",
  QUALITY_INSPECTOR: "quality_inspector",
  ARTIFACT_DETECTOR: "artifact_detector",
  COMPLIANCE_CHECKER: "compliance_checker",
  VALIDATION_ENGINE: "validation_engine",
  VALIDATION_REPORT_BUILDER: "validation_report_builder",
} as const;

export type RenderValidatorAgentModuleId =
  (typeof RenderValidatorAgentModule)[keyof typeof RenderValidatorAgentModule];

export type RenderValidatorAgentRenderedImage = {
  imageRef: string;
  width: number;
  height: number;
  heroProductRatio: number;
  detectedLighting: string;
  detectedScene: string;
  detectedStoryCue: string;
  sharpnessScore: number;
  contrastScore: number;
  textReadable: boolean;
  artifactCount: number;
  safeZoneCompliant: boolean;
};

export type RenderValidatorAgentProblem = {
  id: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  retryStage?: string;
};

/** Ch 7.28 RenderValidatorInput — agent contract */
export type RenderValidatorAgentInput = {
  renderedImage: RenderValidatorAgentRenderedImage;
  storyBlueprint: VisualStoryDirectorAgentBlueprint;
  sceneBlueprint: SceneDirectorAgentBlueprint;
  layoutBlueprint: CompositionDirectorAgentBlueprint;
  lightingBlueprint: LightingDirectorAgentBlueprint;
  cameraBlueprint: CameraDirectorAgentBlueprint;
  materialBlueprint: MaterialDirectorAgentBlueprint;
  typographyBlueprint: TypographyDirectorAgentBlueprint;
  marketplaceBlueprint: MarketplaceDirectorAgentBlueprint;
  finalDecision: ChiefDesignDirectorAgentFinalDecision;
};

/** Ch 7.28 RenderValidationReport — agent output contract */
export type RenderValidatorAgentReport = {
  approved: boolean;
  overallScore: number;
  layoutMatch: number;
  storyMatch: number;
  lightingMatch: number;
  qualityScore: number;
  renderProblems: RenderValidatorAgentProblem[];
  retryRequired: boolean;
  confidence: number;
};

export type RenderValidatorAgentImageAnalysis = {
  heroProductRatio: number;
  compositionSummary: string;
  lightingSummary: string;
  materialSummary: string;
  textDetected: boolean;
  backgroundSummary: string;
};

export type RenderValidatorAgentModuleRecord = {
  module: RenderValidatorAgentModuleId;
  at: number;
  detail?: string;
};

export type RenderValidatorAgentKpi = {
  validationAccuracy: number;
  artifactDetectionRate: number;
  blueprintMatchAccuracy: number;
  retryPrecision: number;
  marketplaceCompliance: number;
  falseRejectionRate: number;
  confidenceScore: number;
};

export type RenderValidatorAgentViolationRecord = {
  code: RenderValidatorAgentFailureCode;
  module?: RenderValidatorAgentModuleId;
  message: string;
};

export type RenderValidatorAgentRetryBranch = "overlay_retry" | "lighting_retry" | "full_render_retry";

export type RenderValidatorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof RENDER_VALIDATOR_AGENT_ID;
  violations: RenderValidatorAgentViolationRecord[];
  modulesCompleted: RenderValidatorAgentModuleId[];
  moduleRecords: RenderValidatorAgentModuleRecord[];
  input: RenderValidatorAgentInput;
  report?: RenderValidatorAgentReport;
  confidence: number;
  retryCount: number;
  retryBranch?: RenderValidatorAgentRetryBranch;
  durationMs: number;
  kpis: RenderValidatorAgentKpi;
  pipelineMediated: boolean;
  doesNotCreateImages: boolean;
  goldenRuleSatisfied: boolean;
};

export type RenderValidatorAgentValidationReport = {
  valid: boolean;
  violations: RenderValidatorAgentViolationRecord[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type RenderValidatorAgentContext = {
  heroRatioMismatch?: boolean;
  lightingConflict?: boolean;
  injectArtifact?: boolean;
  marketplaceComplianceFailure?: boolean;
  lowQuality?: boolean;
  storyMismatch?: boolean;
  lowConfidence?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type RenderValidatorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "HERO_MISMATCH_UNDETECTED"
  | "LIGHTING_CONFLICT_UNDETECTED"
  | "ARTIFACT_MISSED"
  | "MARKETPLACE_NONCOMPLIANT"
  | "FALSE_APPROVAL"
  | "FALSE_REJECTION"
  | "REPORT_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type RenderValidatorAgentModuleDefinition = {
  id: RenderValidatorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type RenderValidatorAgentPipelineLink = {
  from: string;
  to: string;
};
