/**
 * Chapter 7.17 — Typography Director Agent types
 * Intelligent agent specification — overlay typography layer.
 */
import type { AgentContractId } from "./agent-contracts";
import type { BusinessUnderstandingAgentModel } from "./business-understanding-agent-types";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { MarketplaceProfile } from "./marketplace-knowledge-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";
import type { LayoutRect } from "./types";

export const TYPOGRAPHY_DIRECTOR_AGENT_ID: AgentContractId = "typography-director";

/** Ch 7.17 internal agent modules (7) */
export const TypographyDirectorAgentModule = {
  TYPOGRAPHY_STRATEGY_SELECTOR: "typography_strategy_selector",
  HIERARCHY_BUILDER: "hierarchy_builder",
  READABILITY_ENGINE: "readability_engine",
  TEXT_LAYOUT_PLANNER: "text_layout_planner",
  CONTRAST_CONTROLLER: "contrast_controller",
  TYPOGRAPHY_VALIDATOR: "typography_validator",
  TYPOGRAPHY_BLUEPRINT_BUILDER: "typography_blueprint_builder",
} as const;

export type TypographyDirectorAgentModuleId =
  (typeof TypographyDirectorAgentModule)[keyof typeof TypographyDirectorAgentModule];

/** Text hierarchy layer in Typography Blueprint */
export type TypographyDirectorAgentTextLayer = {
  level: number;
  role: string;
  content: string;
  weight: string;
  maxWords: number;
};

/** Ch 7.17 TypographyDirectorInput — agent contract */
export type TypographyDirectorAgentInput = {
  storyBlueprint: VisualStoryDirectorAgentBlueprint;
  layoutBlueprint: CompositionDirectorAgentBlueprint;
  businessModel: BusinessUnderstandingAgentModel;
  marketplaceProfile: MarketplaceProfile;
  knowledgePackage: StagedKnowledgePackage;
};

/** Ch 7.17 TypographyBlueprint — agent output contract */
export type TypographyDirectorAgentBlueprint = {
  headingStyle: string;
  subheadingStyle: string;
  bodyStyle: string;
  fontFamily: string;
  fontWeights: string[];
  textHierarchy: TypographyDirectorAgentTextLayer[];
  alignment: string;
  contrastProfile: string;
  safeZones: LayoutRect[];
  confidence: number;
};

export type TypographyDirectorAgentModuleRecord = {
  module: TypographyDirectorAgentModuleId;
  at: number;
  detail?: string;
};

export type TypographyDirectorAgentKpi = {
  readabilityScore: number;
  typographyConsistency: number;
  marketplaceFit: number;
  informationDensity: number;
  hierarchyQuality: number;
  overlaySafety: number;
  retryRate: number;
  confidenceScore: number;
};

export type TypographyDirectorAgentViolation = {
  code: TypographyDirectorAgentFailureCode;
  module?: TypographyDirectorAgentModuleId;
  message: string;
};

export type TypographyDirectorAgentRetryBranch = "hierarchy_readability_layout" | "full";

export type TypographyDirectorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof TYPOGRAPHY_DIRECTOR_AGENT_ID;
  violations: TypographyDirectorAgentViolation[];
  modulesCompleted: TypographyDirectorAgentModuleId[];
  moduleRecords: TypographyDirectorAgentModuleRecord[];
  input: TypographyDirectorAgentInput;
  blueprint?: TypographyDirectorAgentBlueprint;
  confidence: number;
  retryCount: number;
  retryBranch?: TypographyDirectorAgentRetryBranch;
  durationMs: number;
  kpis: TypographyDirectorAgentKpi;
  pipelineMediated: boolean;
  photoExcluded: boolean;
  materialExcluded: boolean;
  goldenRuleSatisfied: boolean;
};

export type TypographyDirectorAgentValidationReport = {
  valid: boolean;
  violations: TypographyDirectorAgentViolation[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type TypographyDirectorAgentContext = {
  poorReadability?: boolean;
  hierarchyConflict?: boolean;
  textOutsideSafeZones?: boolean;
  overlayObscuresHero?: boolean;
  lowContrastScore?: boolean;
  lowConfidence?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type TypographyDirectorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "POOR_READABILITY"
  | "HIERARCHY_CONFLICT"
  | "TEXT_OUTSIDE_SAFE_ZONES"
  | "OVERLAY_OBSCURES_HERO"
  | "LOW_CONTRAST_SCORE"
  | "EXCESSIVE_TEXT_DENSITY"
  | "BLUEPRINT_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DESIGN_DECISION_DETECTED"
  | "CONTAINS_PHOTO_DECISION"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type TypographyDirectorAgentModuleDefinition = {
  id: TypographyDirectorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type TypographyDirectorAgentPipelineLink = {
  from: string;
  to: string;
};
