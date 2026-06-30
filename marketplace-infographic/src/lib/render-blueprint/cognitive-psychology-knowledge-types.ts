/**
 * Chapter 5.12 — Cognitive Psychology Knowledge types
 */

export const GestaltPrinciple = {
  PROXIMITY: "proximity",
  SIMILARITY: "similarity",
  CONTINUITY: "continuity",
  CLOSURE: "closure",
  FIGURE_GROUND: "figure_ground",
  COMMON_REGION: "common_region",
  COMMON_FATE: "common_fate",
} as const;

export type GestaltPrincipleId = (typeof GestaltPrinciple)[keyof typeof GestaltPrinciple];

export const RecognitionPriority = {
  SHAPE: "shape",
  IMAGE: "image",
  COLOR: "color",
  TEXT: "text",
} as const;

export type RecognitionPriorityId = (typeof RecognitionPriority)[keyof typeof RecognitionPriority];

export const EmotionalTrigger = {
  SAFETY: "safety",
  RELIABILITY: "reliability",
  TECHNOLOGY: "technology",
  COMFORT: "comfort",
  SPEED: "speed",
  CLEANLINESS: "cleanliness",
  ECO: "eco",
  STATUS: "status",
  PROFESSIONALISM: "professionalism",
} as const;

export type EmotionalTriggerId = (typeof EmotionalTrigger)[keyof typeof EmotionalTrigger];

export const LifeContextPattern = {
  KITCHEN: "kitchen",
  WORKSHOP: "workshop",
  GARDEN: "garden",
  OFFICE: "office",
  MEDICAL: "medical",
} as const;

export type LifeContextPatternId = (typeof LifeContextPattern)[keyof typeof LifeContextPattern];

export type CognitivePsychologyCondition = {
  field: string;
  operator: "eq" | "in" | "gte" | "lte";
  value: string | number | string[];
};

export type CognitivePsychologyKnowledge = {
  id: string;
  rule: string;
  purpose: string;
  conditions: CognitivePsychologyCondition[];
  recommendation: string;
  confidence: number;
  triggerId?: EmotionalTriggerId;
};

export type EyeMovementStep = {
  rank: number;
  role: string;
  examples: string[];
};

export type TrustSignal = {
  id: string;
  name: string;
  description: string;
};

export type CognitivePsychologySelectionContext = {
  category?: string;
  marketplace?: string;
  storyType?: string;
  emotionalGoal?: EmotionalTriggerId;
  productComplexity?: "low" | "medium" | "high";
  imageContext?: string;
};

export type CognitiveBlueprintCheck = {
  competingFocalPoints?: number;
  cognitiveLoad?: number;
  semanticBlockCount?: number;
  productRecognizable?: boolean;
  textOnlyMeaning?: boolean;
  eyeMovementOrder?: string[];
  gestaltViolations?: GestaltPrincipleId[];
  trustSignalsPresent?: string[];
  trustSignalsMissing?: string[];
  perceptionTimeMs?: number;
  productHeroRatio?: number;
  paletteColorCount?: number;
  chaoticGaze?: boolean;
  marketplaceScanOptimized?: boolean;
  emotionalTrigger?: EmotionalTriggerId;
};

export type CognitiveValidationViolation = {
  code: CognitivePsychologyKnowledgeFailureCode;
  aspect: string;
  message: string;
};

export type CognitiveBlueprintValidation = {
  valid: boolean;
  violations: CognitiveValidationViolation[];
  retryRecommended: boolean;
  explainable: boolean;
  estimatedCognitiveLoad?: number;
};

export type CognitivePsychologyKnowledgeContext = {
  overloadedComposition?: boolean;
  missingFocalPoint?: boolean;
  slowPerception?: boolean;
  textOnlyMeaning?: boolean;
  perceptionContradictsPsychology?: boolean;
};

export type CognitivePsychologyKnowledgeViolation = {
  code: CognitivePsychologyKnowledgeFailureCode;
  message: string;
  knowledgeId?: string;
};

export type CognitivePsychologyKnowledgeReport = {
  valid: boolean;
  violations: CognitivePsychologyKnowledgeViolation[];
  knowledge: CognitivePsychologyKnowledge[];
  eyeMovementPath: EyeMovementStep[];
  goldenRuleSatisfied: boolean;
  attentionManaged: boolean;
  trustAware: boolean;
  evolutionReady: boolean;
};

export type CognitivePsychologyKnowledgeFailureCode =
  | "EXCESSIVE_COGNITIVE_LOAD"
  | "MISSING_FOCAL_POINT"
  | "COMPETING_ATTENTION_CENTERS"
  | "SLOW_VISUAL_PERCEPTION"
  | "TEXT_ONLY_MEANING"
  | "CHAOTIC_EYE_MOVEMENT"
  | "GESTALT_VIOLATION"
  | "INSUFFICIENT_TRUST_SIGNALS"
  | "PRODUCT_NOT_RECOGNIZABLE"
  | "MARKETPLACE_SCAN_MISMATCH";
