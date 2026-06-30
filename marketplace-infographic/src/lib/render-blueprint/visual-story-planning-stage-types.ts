/**
 * Chapter 6.6 — Visual Story Planning Stage types
 * Distinct from Ch 4.10 StorySection and types.ts StoryBlueprint.
 */
import type { BusinessUnderstandingSection } from "./business-understanding-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";
import type { StorySection } from "./visual-story-director-types";
import type { StoryBlueprint } from "./types";

export const VisualStoryPlanningStage = {
  INPUT_ASSEMBLY: "input_assembly",
  STORY_OBJECTIVE: "story_objective",
  PATTERN_SELECTION: "pattern_selection",
  PRIMARY_MESSAGE: "primary_message",
  EMOTIONAL_TONE: "emotional_tone",
  HERO_MOMENT: "hero_moment",
  NARRATIVE_STRUCTURE: "narrative_structure",
  STORY_CONSTRAINTS: "story_constraints",
  BLUEPRINT_ASSEMBLY: "blueprint_assembly",
  CONSISTENCY_CHECK: "consistency_check",
  VALIDATION: "validation",
  AGENT_HANDOFF: "agent_handoff",
} as const;

export type VisualStoryPlanningStageId =
  (typeof VisualStoryPlanningStage)[keyof typeof VisualStoryPlanningStage];

export const StoryPattern = {
  PROBLEM_SOLUTION: "problem_solution",
  HERO_PRODUCT: "hero_product",
  LIFESTYLE: "lifestyle",
  PREMIUM_EXPERIENCE: "premium_experience",
  FEATURE_SHOWCASE: "feature_showcase",
} as const;

export type StoryPatternId = (typeof StoryPattern)[keyof typeof StoryPattern];

export const StoryObjective = {
  BUILD_TRUST: "build_trust",
  SHOW_BENEFIT: "show_benefit",
  DEMONSTRATE_QUALITY: "demonstrate_quality",
  EXPLAIN_HOW_IT_WORKS: "explain_how_it_works",
  CREATE_DESIRE: "create_desire",
  REDUCE_PURCHASE_FEAR: "reduce_purchase_fear",
} as const;

export type StoryObjectiveId = (typeof StoryObjective)[keyof typeof StoryObjective];

/** Ch 6.6 Story Blueprint — spec StoryBlueprint */
export type PlannedStoryBlueprint = {
  storyPattern: string;
  primaryMessage: string;
  secondaryMessages: string[];
  heroMoment: string;
  emotionalTone: string;
  visualFocus: string;
  storyFlow: string[];
  priority: number;
};

export type StoryPlanningConstraints = {
  avoid: string[];
  require: string[];
};

export type VisualStoryPlanningInput = {
  profile: AnalyzedProductProfile;
  business: BusinessUnderstandingSection;
  knowledge: StagedKnowledgePackage;
  marketplace: string;
  brand?: string;
};

export type VisualStoryPlanningSection = {
  plannedBlueprint: PlannedStoryBlueprint;
  storyObjective: StoryObjectiveId;
  storyPattern: StoryPatternId;
  constraints: StoryPlanningConstraints;
  renderStory: StoryBlueprint;
  directorSection: StorySection;
  stagesCompleted: VisualStoryPlanningStageId[];
  confidence: number;
};

export type VisualStoryPlanningViolation = {
  code: VisualStoryPlanningFailureCode;
  message: string;
  stage?: VisualStoryPlanningStageId;
};

export type VisualStoryPlanningReport = {
  valid: boolean;
  violations: VisualStoryPlanningViolation[];
  section?: VisualStoryPlanningSection;
  stagesCompleted: VisualStoryPlanningStageId[];
  durationMs: number;
};

export type VisualStoryPlanningContext = {
  missingPrimaryMessage?: boolean;
  multiplePrimaryMessages?: boolean;
  missingHeroMoment?: boolean;
  missingEmotionalTone?: boolean;
  businessModelConflict?: boolean;
};

export type VisualStoryPlanningSystemReport = {
  valid: boolean;
  violations: VisualStoryPlanningViolation[];
  goldenRuleSatisfied: boolean;
  singleStoryIdea: boolean;
  businessGoalAligned: boolean;
  heroMomentDefined: boolean;
  emotionalToneDefined: boolean;
  downstreamReady: boolean;
};

export type VisualStoryPlanningFailureCode =
  | "MISSING_BUSINESS_MODEL"
  | "MISSING_PROFILE"
  | "MISSING_PRIMARY_MESSAGE"
  | "MULTIPLE_PRIMARY_MESSAGES"
  | "MISSING_HERO_MOMENT"
  | "MISSING_EMOTIONAL_TONE"
  | "BUSINESS_MODEL_CONFLICT"
  | "INVALID_STORY_PATTERN"
  | "STORY_INCONSISTENT"
  | "DESIGN_DECISION_DETECTED"
  | "DIRECTOR_VALIDATION_FAILED";
