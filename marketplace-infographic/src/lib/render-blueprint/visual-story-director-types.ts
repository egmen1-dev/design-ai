/**
 * Chapter 4.10 — Visual Story Director types
 */
import type { StoryBlueprint } from "./types";

export const StoryType = {
  PROBLEM_SOLUTION: "problem_solution",
  TRANSFORMATION: "transformation",
  PREMIUM_LIFESTYLE: "premium_lifestyle",
  PROFESSIONAL_AUTHORITY: "professional_authority",
  COMFORT: "comfort",
  SAFETY: "safety",
  INNOVATION: "innovation",
  MINIMAL_LUXURY: "minimal_luxury",
  SPEED: "speed",
  EFFICIENCY: "efficiency",
  EMOTIONAL_GIFT: "emotional_gift",
  TRUST: "trust",
  HEALTH: "health",
  FAMILY: "family",
  TECHNOLOGY: "technology",
  BEFORE_AFTER: "before_after",
} as const;

export type StoryTypeId = (typeof StoryType)[keyof typeof StoryType];

export const CommercialGoal = {
  INCREASE_TRUST: "increase_trust",
  INCREASE_DESIRE: "increase_desire",
  HIGHLIGHT_INNOVATION: "highlight_innovation",
  REDUCE_ANXIETY: "reduce_purchase_anxiety",
  INCREASE_PREMIUM: "increase_premium_perception",
  INCREASE_CTR: "increase_ctr",
  INCREASE_CONVERSION: "increase_conversion",
  EMPHASIZE_CONVENIENCE: "emphasize_convenience",
} as const;

export type CommercialGoalId = (typeof CommercialGoal)[keyof typeof CommercialGoal];

export const CustomerIntent = {
  COMPARE: "compare",
  CHOOSE: "choose",
  VERIFY_QUALITY: "verify_quality",
  FIND_GIFT: "find_gift",
  SOLVE_PROBLEM: "solve_problem",
  BUY_QUICKLY: "buy_quickly",
  RESEARCH: "research_product",
} as const;

export type CustomerIntentId = (typeof CustomerIntent)[keyof typeof CustomerIntent];

export const VisualHook = {
  UNEXPECTED_PERSPECTIVE: "unexpected_perspective",
  STRONG_CONTRAST: "strong_contrast",
  LUXURY_SIMPLICITY: "luxury_simplicity",
  POWERFUL_EMOTION: "powerful_emotion",
  PROFESSIONAL_DETAIL: "professional_detail",
  EXTREME_CLEANLINESS: "extreme_cleanliness",
  DYNAMIC_MOTION: "dynamic_motion",
} as const;

export type VisualHookId = (typeof VisualHook)[keyof typeof VisualHook];

export const PrimaryEmotion = {
  TRUST: "trust",
  EXCITEMENT: "excitement",
  COMFORT: "comfort",
  LUXURY: "luxury",
  SAFETY: "safety",
  CURIOSITY: "curiosity",
  CONFIDENCE: "confidence",
  JOY: "joy",
  CALMNESS: "calmness",
} as const;

export type PrimaryEmotionId = (typeof PrimaryEmotion)[keyof typeof PrimaryEmotion];

export type StoryTypeDefinition = {
  id: StoryTypeId;
  name: string;
  summary: string;
};

/** Chapter 4.10 — enriched story section (meaning layer, not scene/composition/prompt) */
export type StorySection = {
  storyType: StoryTypeId;
  customerIntent: CustomerIntentId;
  visualHook: VisualHookId;
  primaryEmotion: PrimaryEmotionId;
  storyBlueprint: StoryBlueprint;
  commercialGoal: CommercialGoalId;
  /** Normalized 0.0..1.0 */
  confidence: number;
};

export type StoryDirectorContext = {
  productCategory: string;
  subCategory?: string;
  creativeGoal: string;
  marketplace: string;
  priceSegment: string;
  audience: string;
  productEmotion?: string;
};

export type StoryExplainabilityReport = {
  agentId: "visual-story-director";
  selectedStoryType: StoryTypeId;
  commercialGoal: CommercialGoalId;
  alternativesConsidered: StoryTypeId[];
  rejectedAlternatives: { id: StoryTypeId; reason: string }[];
  sectionsUsed: string[];
  commercialTask: string;
  reasoning: string[];
};

export type StoryValidationReport = {
  valid: boolean;
  violations: string[];
  section?: StorySection;
};

export type StoryFailureCode =
  | "MISSING_COMMERCIAL_GOAL"
  | "CATEGORY_MISMATCH"
  | "MISSING_PRIMARY_EMOTION"
  | "PRODUCT_CONFLICT"
  | "NOT_VISUALLY_REALIZABLE"
  | "NO_PURCHASE_HELP"
  | "CONTAINS_SCENE_DECISION"
  | "CONTAINS_COMPOSITION_DECISION"
  | "CONTAINS_PROMPT";
