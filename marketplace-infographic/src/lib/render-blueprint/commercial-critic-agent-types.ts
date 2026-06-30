/**
 * Chapter 7.22 — Commercial Critic Agent types
 * Commercial effectiveness expert — buyer and marketer perspective.
 */
import type { AgentContractId } from "./agent-contracts";
import type { BusinessUnderstandingAgentModel } from "./business-understanding-agent-types";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { MarketplaceDirectorAgentBlueprint } from "./marketplace-director-agent-types";
import type { TypographyDirectorAgentBlueprint } from "./typography-director-agent-types";
import type { VisionCriticAgentReport } from "./vision-critic-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";

export const COMMERCIAL_CRITIC_AGENT_ID: AgentContractId = "commercial-critic";

/** Ch 7.22 internal agent modules (7) */
export const CommercialCriticAgentModule = {
  CTR_PREDICTOR: "ctr_predictor",
  SELLING_POWER_ANALYZER: "selling_power_analyzer",
  TRUST_EVALUATOR: "trust_evaluator",
  EMOTION_ANALYZER: "emotion_analyzer",
  COMMERCIAL_RISK_ENGINE: "commercial_risk_engine",
  COMMERCIAL_VALIDATOR: "commercial_validator",
  COMMERCIAL_REPORT_BUILDER: "commercial_report_builder",
} as const;

export type CommercialCriticAgentModuleId =
  (typeof CommercialCriticAgentModule)[keyof typeof CommercialCriticAgentModule];

export type CommercialCriticAgentRecommendation = {
  id: string;
  target: string;
  action: string;
  priority: "low" | "medium" | "high";
};

export type CommercialCriticAgentRisk = {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
};

/** Ch 7.22 CommercialCriticInput — agent contract */
export type CommercialCriticAgentInput = {
  productProfile: AnalyzedProductProfile;
  businessModel: BusinessUnderstandingAgentModel;
  storyBlueprint: VisualStoryDirectorAgentBlueprint;
  layoutBlueprint: CompositionDirectorAgentBlueprint;
  typographyBlueprint: TypographyDirectorAgentBlueprint;
  marketplaceBlueprint: MarketplaceDirectorAgentBlueprint;
  visionReport: VisionCriticAgentReport;
};

/** Ch 7.22 CommercialReport — agent output contract */
export type CommercialCriticAgentReport = {
  overallCommercialScore: number;
  ctrPrediction: number;
  sellingPower: number;
  trustScore: number;
  clarityScore: number;
  emotionScore: number;
  recommendations: CommercialCriticAgentRecommendation[];
  retryRequired: boolean;
  confidence: number;
};

export type CommercialCriticAgentModuleRecord = {
  module: CommercialCriticAgentModuleId;
  at: number;
  detail?: string;
};

export type CommercialCriticAgentKpi = {
  ctrPredictionAccuracy: number;
  sellingPowerAccuracy: number;
  trustPredictionAccuracy: number;
  commercialRiskDetection: number;
  recommendationQuality: number;
  retryPrecision: number;
  confidenceScore: number;
};

export type CommercialCriticAgentViolationRecord = {
  code: CommercialCriticAgentFailureCode;
  module?: CommercialCriticAgentModuleId;
  message: string;
};

export type CommercialCriticAgentRetryBranch = "ctr_selling_trust_emotion" | "full";

export type CommercialCriticAgentExecutionReport = {
  valid: boolean;
  agentId: typeof COMMERCIAL_CRITIC_AGENT_ID;
  violations: CommercialCriticAgentViolationRecord[];
  modulesCompleted: CommercialCriticAgentModuleId[];
  moduleRecords: CommercialCriticAgentModuleRecord[];
  input: CommercialCriticAgentInput;
  report?: CommercialCriticAgentReport;
  confidence: number;
  retryCount: number;
  retryBranch?: CommercialCriticAgentRetryBranch;
  durationMs: number;
  kpis: CommercialCriticAgentKpi;
  pipelineMediated: boolean;
  doesNotFixErrors: boolean;
  goldenRuleSatisfied: boolean;
};

export type CommercialCriticAgentValidationReport = {
  valid: boolean;
  violations: CommercialCriticAgentViolationRecord[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type CommercialCriticAgentContext = {
  lowCtrPrediction?: boolean;
  weakSellingPower?: boolean;
  lowTrustScore?: boolean;
  weakEmotion?: boolean;
  lowCommercialScore?: boolean;
  injectCommercialRisk?: boolean;
  lowConfidence?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type CommercialCriticAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "LOW_CTR_PREDICTION"
  | "WEAK_SELLING_POWER"
  | "LOW_TRUST_SCORE"
  | "WEAK_EMOTION"
  | "LOW_COMMERCIAL_SCORE"
  | "COMMERCIAL_RISK_UNDETECTED"
  | "REPORT_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "FALSE_POSITIVE_SPIKE"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type CommercialCriticAgentModuleDefinition = {
  id: CommercialCriticAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type CommercialCriticAgentPipelineLink = {
  from: string;
  to: string;
};
