/**
 * Chapter 6.8 — Composition Planning Stage types
 * Distinct from Ch 4.12 LayoutSection and types.ts CompositionBlueprint.
 */
import type { LayoutRect } from "./types";
import type { BusinessUnderstandingSection } from "./business-understanding-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";
import type { LayoutSection } from "./composition-director-types";
import type { CompositionBlueprint } from "./types";
import type { PlannedSceneBlueprint } from "./scene-planning-stage-types";
import type { PlannedStoryBlueprint } from "./visual-story-planning-stage-types";

export type CompositionArea = LayoutRect;

export const CompositionPlanningStage = {
  INPUT_ASSEMBLY: "input_assembly",
  COMPOSITION_OBJECTIVE: "composition_objective",
  LAYOUT_PATTERN_SELECTION: "layout_pattern_selection",
  HERO_PLACEMENT: "hero_placement",
  VISUAL_HIERARCHY: "visual_hierarchy",
  READING_FLOW: "reading_flow",
  NEGATIVE_SPACE: "negative_space",
  OVERLAY_ZONES: "overlay_zones",
  SAFE_ZONES: "safe_zones",
  VISUAL_BALANCE: "visual_balance",
  ADAPTIVE_LAYOUT: "adaptive_layout",
  BLUEPRINT_ASSEMBLY: "blueprint_assembly",
  CONSISTENCY_CHECK: "consistency_check",
  VALIDATION: "validation",
  AGENT_HANDOFF: "agent_handoff",
} as const;

export type CompositionPlanningStageId =
  (typeof CompositionPlanningStage)[keyof typeof CompositionPlanningStage];

export const LayoutPattern = {
  CENTERED_HERO: "centered_hero",
  DIAGONAL_FLOW: "diagonal_flow",
  GOLDEN_RATIO: "golden_ratio",
  SPLIT_LAYOUT: "split_layout",
  FEATURE_GRID: "feature_grid",
  MARKETPLACE_SPLIT: "marketplace_split",
} as const;

export type LayoutPatternId = (typeof LayoutPattern)[keyof typeof LayoutPattern];

export const CompositionObjective = {
  SHOW_PRODUCT_FAST: "show_product_fast",
  GUIDE_ATTENTION_PATH: "guide_attention_path",
  COMFORTABLE_INFORMATION: "comfortable_information",
} as const;

export type CompositionObjectiveId = (typeof CompositionObjective)[keyof typeof CompositionObjective];

/** Ch 6.8 Composition Blueprint — spec CompositionBlueprint */
export type PlannedCompositionBlueprint = {
  layoutPattern: string;
  heroPlacement: CompositionArea;
  textAreas: CompositionArea[];
  badgeAreas: CompositionArea[];
  negativeSpace: CompositionArea[];
  visualHierarchy: string[];
  readingFlow: string[];
  safeZones: CompositionArea[];
};

export type CompositionPlanningInput = {
  profile: AnalyzedProductProfile;
  business: BusinessUnderstandingSection;
  story: PlannedStoryBlueprint;
  scene: PlannedSceneBlueprint;
  knowledge: StagedKnowledgePackage;
  marketplace: string;
  brand?: string;
};

export type CompositionPlanningSection = {
  plannedBlueprint: PlannedCompositionBlueprint;
  layoutPattern: LayoutPatternId;
  objectives: CompositionObjectiveId[];
  directorSection: LayoutSection;
  renderComposition: CompositionBlueprint;
  stagesCompleted: CompositionPlanningStageId[];
  confidence: number;
};

export type CompositionPlanningViolation = {
  code: CompositionPlanningFailureCode;
  message: string;
  stage?: CompositionPlanningStageId;
};

export type CompositionPlanningReport = {
  valid: boolean;
  violations: CompositionPlanningViolation[];
  section?: CompositionPlanningSection;
  stagesCompleted: CompositionPlanningStageId[];
  durationMs: number;
};

export type CompositionPlanningContext = {
  missingHero?: boolean;
  overlayConflictsHero?: boolean;
  chaoticFlow?: boolean;
  overloadedLayout?: boolean;
  balanceViolated?: boolean;
  storyReadingMismatch?: boolean;
};

export type CompositionPlanningSystemReport = {
  valid: boolean;
  violations: CompositionPlanningViolation[];
  goldenRuleSatisfied: boolean;
  heroDominant: boolean;
  hierarchyValid: boolean;
  readingFlowAligned: boolean;
  overlayZonesReserved: boolean;
  downstreamReady: boolean;
};

export type CompositionPlanningFailureCode =
  | "MISSING_PROFILE"
  | "MISSING_STORY"
  | "MISSING_SCENE"
  | "MISSING_BUSINESS_MODEL"
  | "NO_HERO_PRODUCT"
  | "CHAOTIC_READING_FLOW"
  | "OVERLAY_HERO_CONFLICT"
  | "OVERLOADED_LAYOUT"
  | "BALANCE_VIOLATION"
  | "STORY_READING_MISMATCH"
  | "DESIGN_DECISION_DETECTED"
  | "DIRECTOR_VALIDATION_FAILED";
