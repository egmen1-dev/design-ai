/**
 * Chapter 7.25 — Learning Agent types
 * Platform self-learning — improves future generations from completed projects.
 */
import type { AgentContractId } from "./agent-contracts";
import type { DesignAntiPattern } from "./anti-pattern-library-types";
import type { ChiefDesignDirectorAgentFinalDecision } from "./chief-design-director-agent-types";
import type { CommercialCriticAgentReport } from "./commercial-critic-agent-types";
import type { CameraDirectorAgentBlueprint } from "./camera-director-agent-types";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { DesignPattern } from "./pattern-library-types";
import type { LightingDirectorAgentBlueprint } from "./lighting-director-agent-types";
import type { MarketplaceDirectorAgentBlueprint } from "./marketplace-director-agent-types";
import type { MaterialDirectorAgentBlueprint } from "./material-director-agent-types";
import type { PatternDirectorAgentBlueprint } from "./pattern-director-agent-types";
import type { PhotographyDirectorAgentBlueprint } from "./photography-director-agent-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import type { SeniorArtDirectorAgentReport } from "./senior-art-director-agent-types";
import type { TypographyDirectorAgentBlueprint } from "./typography-director-agent-types";
import type { VisionCriticAgentReport } from "./vision-critic-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";

export const LEARNING_AGENT_ID: AgentContractId = "learning-agent";

/** Ch 7.25 internal agent modules (7) */
export const LearningAgentModule = {
  EXPERIENCE_COLLECTOR: "experience_collector",
  PATTERN_DISCOVERY: "pattern_discovery",
  FAILURE_ANALYSIS: "failure_analysis",
  KNOWLEDGE_EVOLUTION: "knowledge_evolution",
  MEMORY_UPDATER: "memory_updater",
  LEARNING_VALIDATOR: "learning_validator",
  LEARNING_PACKAGE_BUILDER: "learning_package_builder",
} as const;

export type LearningAgentModuleId =
  (typeof LearningAgentModule)[keyof typeof LearningAgentModule];

/** Ch 7.25 CompleteBlueprint — full project blueprint stack */
export type LearningAgentProjectBlueprint = {
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
};

export type LearningAgentRetryHistory = {
  attempts: number;
  reasons: string[];
  agentsRestarted: string[];
  strategiesUsed: string[];
};

export type LearningAgentRenderMetrics = {
  generationTimeMs: number;
  renderProvider: string;
  imageExported: boolean;
  estimatedCostCents?: number;
};

export type LearningAgentUserFeedback = {
  rating: "like" | "dislike" | "neutral";
  exported: boolean;
  republished: boolean;
  manualEdit: boolean;
  comment?: string;
};

export type LearningAgentMarketplaceAnalytics = {
  marketplace: string;
  ctr: number;
  conversion: number;
  impressions: number;
  salesLift?: number;
};

/** Ch 7.25 LearningAgentInput — agent contract */
export type LearningAgentInput = {
  projectBlueprint: LearningAgentProjectBlueprint;
  visionReport: VisionCriticAgentReport;
  commercialReport: CommercialCriticAgentReport;
  artDirectorReport: SeniorArtDirectorAgentReport;
  finalDecision: ChiefDesignDirectorAgentFinalDecision;
  retryHistory: LearningAgentRetryHistory;
  renderMetrics: LearningAgentRenderMetrics;
  userFeedback: LearningAgentUserFeedback;
  marketplaceAnalytics: LearningAgentMarketplaceAnalytics;
};

export type LearningAgentKnowledgeUpdate = {
  id: string;
  domain: string;
  proposal: string;
  confidenceDelta: number;
  status: "proposed" | "pending_validation";
};

export type LearningAgentMemoryRecord = {
  id: string;
  category: string;
  patternKey: string;
  successRate: number;
  sampleCount: number;
  lastUpdatedAt: number;
};

/** Ch 7.25 LearningPackage — agent output contract */
export type LearningAgentPackage = {
  newPatterns: DesignPattern[];
  updatedPatterns: DesignPattern[];
  newAntiPatterns: DesignAntiPattern[];
  knowledgeUpdates: LearningAgentKnowledgeUpdate[];
  memoryUpdates: LearningAgentMemoryRecord[];
  learningConfidence: number;
};

export type LearningAgentModuleRecord = {
  module: LearningAgentModuleId;
  at: number;
  detail?: string;
};

export type LearningAgentKpi = {
  patternDiscoveryAccuracy: number;
  knowledgeEvolutionQuality: number;
  falseLearningRate: number;
  memoryGrowthQuality: number;
  ctrImprovementRate: number;
  commercialImprovementRate: number;
  confidenceScore: number;
};

export type LearningAgentViolationRecord = {
  code: LearningAgentFailureCode;
  module?: LearningAgentModuleId;
  message: string;
};

export type LearningAgentRetryBranch = "insufficient_statistics" | "full";

export type LearningAgentExecutionReport = {
  valid: boolean;
  agentId: typeof LEARNING_AGENT_ID;
  violations: LearningAgentViolationRecord[];
  modulesCompleted: LearningAgentModuleId[];
  moduleRecords: LearningAgentModuleRecord[];
  input: LearningAgentInput;
  package?: LearningAgentPackage;
  confidence: number;
  retryCount: number;
  retryBranch?: LearningAgentRetryBranch;
  durationMs: number;
  kpis: LearningAgentKpi;
  pipelineMediated: boolean;
  doesNotMutateCurrentProject: boolean;
  goldenRuleSatisfied: boolean;
};

export type LearningAgentValidationReport = {
  valid: boolean;
  violations: LearningAgentViolationRecord[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type LearningAgentContext = {
  insufficientStatistics?: boolean;
  lowConfidence?: boolean;
  singleCategoryOnly?: boolean;
  contradictsHistorical?: boolean;
  injectFalsePattern?: boolean;
  weakCommercialOutcome?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type LearningAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "INSUFFICIENT_STATISTICS"
  | "FALSE_LEARNING_DETECTED"
  | "HISTORICAL_CONTRADICTION"
  | "PACKAGE_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type LearningAgentModuleDefinition = {
  id: LearningAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type LearningAgentPipelineLink = {
  from: string;
  to: string;
};

export type LearningAgentExperienceSnapshot = {
  visionScore: number;
  commercialScore: number;
  artDirectionScore: number;
  overallDecisionScore: number;
  ctr: number;
  conversion: number;
  retryAttempts: number;
  userRating: LearningAgentUserFeedback["rating"];
  generationTimeMs: number;
};
