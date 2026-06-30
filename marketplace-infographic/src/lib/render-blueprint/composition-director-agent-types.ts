/**
 * Chapter 7.12 — Composition Director Agent types
 * Intelligent agent specification — distinct from Ch 4.12 and Ch 6.8 pipeline APIs.
 */
import type { AgentContractId } from "./agent-contracts";
import type { BusinessUnderstandingAgentModel } from "./business-understanding-agent-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { MarketplaceProfile } from "./marketplace-knowledge-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";
import type { LayoutRect } from "./types";

export const COMPOSITION_DIRECTOR_AGENT_ID: AgentContractId = "composition-director";

/** Ch 7.12 internal agent modules (7) */
export const CompositionDirectorAgentModule = {
  LAYOUT_SELECTOR: "layout_selector",
  HERO_PLACEMENT_ENGINE: "hero_placement_engine",
  HIERARCHY_BUILDER: "hierarchy_builder",
  READING_FLOW_PLANNER: "reading_flow_planner",
  NEGATIVE_SPACE_PLANNER: "negative_space_planner",
  LAYOUT_VALIDATOR: "layout_validator",
  LAYOUT_BLUEPRINT_BUILDER: "layout_blueprint_builder",
} as const;

export type CompositionDirectorAgentModuleId =
  (typeof CompositionDirectorAgentModule)[keyof typeof CompositionDirectorAgentModule];

/** Normalized attention waypoint for reading flow */
export type CompositionDirectorAgentPoint = {
  x: number;
  y: number;
};

/** Ch 7.12 CompositionDirectorInput — agent contract */
export type CompositionDirectorAgentInput = {
  productProfile: AnalyzedProductProfile;
  businessModel: BusinessUnderstandingAgentModel;
  storyBlueprint: VisualStoryDirectorAgentBlueprint;
  sceneBlueprint: SceneDirectorAgentBlueprint;
  knowledgePackage: StagedKnowledgePackage;
  marketplaceProfile: MarketplaceProfile;
};

/** Ch 7.12 LayoutBlueprint — agent output contract */
export type CompositionDirectorAgentBlueprint = {
  layoutPattern: string;
  heroPlacement: LayoutRect;
  textZones: LayoutRect[];
  badgeZones: LayoutRect[];
  negativeSpace: LayoutRect[];
  readingFlow: CompositionDirectorAgentPoint[];
  visualHierarchy: string[];
  balanceScore: number;
  confidence: number;
};

export type CompositionDirectorAgentModuleRecord = {
  module: CompositionDirectorAgentModuleId;
  at: number;
  detail?: string;
};

export type CompositionDirectorAgentKpi = {
  heroVisibilityScore: number;
  readingFlowQuality: number;
  balanceScore: number;
  negativeSpaceQuality: number;
  marketplaceFit: number;
  layoutClarity: number;
  retryRate: number;
  confidenceScore: number;
};

export type CompositionDirectorAgentViolation = {
  code: CompositionDirectorAgentFailureCode;
  module?: CompositionDirectorAgentModuleId;
  message: string;
};

export type CompositionDirectorAgentRetryBranch = "layout_hero_reading_balance" | "full";

export type CompositionDirectorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof COMPOSITION_DIRECTOR_AGENT_ID;
  violations: CompositionDirectorAgentViolation[];
  modulesCompleted: CompositionDirectorAgentModuleId[];
  moduleRecords: CompositionDirectorAgentModuleRecord[];
  input: CompositionDirectorAgentInput;
  blueprint?: CompositionDirectorAgentBlueprint;
  planningSection?: import("./composition-planning-stage-types").CompositionPlanningSection;
  confidence: number;
  retryCount: number;
  retryBranch?: CompositionDirectorAgentRetryBranch;
  durationMs: number;
  kpis: CompositionDirectorAgentKpi;
  pipelineMediated: boolean;
  photographyExcluded: boolean;
  goldenRuleSatisfied: boolean;
};

export type CompositionDirectorAgentValidationReport = {
  valid: boolean;
  violations: CompositionDirectorAgentViolation[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type CompositionDirectorAgentContext = {
  missingHero?: boolean;
  chaoticFlow?: boolean;
  overloadedLayout?: boolean;
  balanceViolated?: boolean;
  overlayConflictsHero?: boolean;
  heroTooSmall?: boolean;
  lowConfidence?: boolean;
  storyReadingMismatch?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type CompositionDirectorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "NO_HERO_PRODUCT"
  | "HERO_TOO_SMALL"
  | "CHAOTIC_READING_FLOW"
  | "OVERLOADED_LAYOUT"
  | "BALANCE_VIOLATION"
  | "OVERLAY_HERO_CONFLICT"
  | "STORY_READING_MISMATCH"
  | "BLUEPRINT_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DESIGN_DECISION_DETECTED"
  | "CONTAINS_PHOTOGRAPHY_DECISION"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type CompositionDirectorAgentModuleDefinition = {
  id: CompositionDirectorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type CompositionDirectorAgentPipelineLink = {
  from: string;
  to: string;
};
