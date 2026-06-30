/**
 * Chapter 5.9 — Photography Knowledge types
 */
import type { AgentContractId } from "./agent-contracts";

export const PhotographyTopic = {
  LIGHTING: "lighting",
  LENS: "lens",
  PERSPECTIVE: "perspective",
  DEPTH_OF_FIELD: "depth_of_field",
  EXPOSURE: "exposure",
  REFLECTION: "reflection",
  MATERIAL: "material",
  PHYSICAL_REALISM: "physical_realism",
  COMMERCIAL: "commercial",
} as const;

export type PhotographyTopicId = (typeof PhotographyTopic)[keyof typeof PhotographyTopic];

export const LightingKnowledgeScheme = {
  SOFT_WINDOW: "soft_window_light",
  STUDIO_SOFTBOX: "studio_softbox",
  RIM: "rim_lighting",
  TOP: "top_light",
  BACK: "back_light",
  THREE_POINT: "three_point_lighting",
  PRODUCT_TABLE: "product_table_lighting",
} as const;

export type LightingKnowledgeSchemeId =
  (typeof LightingKnowledgeScheme)[keyof typeof LightingKnowledgeScheme];

export const LensProfile = {
  MM_35: "35mm",
  MM_50: "50mm",
  MM_85: "85mm",
  MACRO_100: "100mm_macro",
} as const;

export type LensProfileId = (typeof LensProfile)[keyof typeof LensProfile];

export const ExposureMode = {
  HIGH_KEY: "high_key",
  LOW_KEY: "low_key",
  BALANCED: "balanced_exposure",
  PRODUCT_COMPENSATION: "product_exposure_compensation",
} as const;

export type ExposureModeId = (typeof ExposureMode)[keyof typeof ExposureMode];

export const MaterialType = {
  GLASS: "glass",
  METAL: "metal",
  PLASTIC: "plastic",
  WOOD: "wood",
  FABRIC: "fabric",
  CERAMIC: "ceramic",
  LEATHER: "leather",
} as const;

export type MaterialTypeId = (typeof MaterialType)[keyof typeof MaterialType];

export type PhotographyCondition = {
  field: string;
  operator: "eq" | "in";
  value: string | string[];
};

export type PhotographyExample = {
  id: string;
  description: string;
  category?: string;
};

/** Distinct from Ch 5.2 KnowledgeSource */
export type PhotographyKnowledgeReference = {
  id: string;
  label: string;
  evidenceLevel: number;
};

export type PhotographyKnowledge = {
  id: string;
  topic: PhotographyTopicId;
  rule: string;
  conditions: PhotographyCondition[];
  examples: PhotographyExample[];
  confidence: number;
  references: PhotographyKnowledgeReference[];
  agentIds?: AgentContractId[];
  commercialRationale?: string;
};

export type PhotographySelectionContext = {
  category?: string;
  material?: string;
  styleId?: string;
  storyType?: string;
  productGoal?: string;
  marketplace?: string;
};

export type PhotographyBlueprintCheck = {
  lighting?: string;
  lens?: string;
  perspective?: string;
  depthOfField?: string;
  exposure?: string;
  material?: string;
  reflections?: string;
  shadowDirection?: string;
  lightDirection?: string;
  storyFocus?: string;
  storyType?: string;
  primarySubject?: string;
  physicsViolations?: string[];
};

export type PhotographyConsistencyViolation = {
  aspect: string;
  message: string;
  agents: string[];
};

export type PhotographyBlueprintValidation = {
  valid: boolean;
  violations: PhotographyConsistencyViolation[];
  retryRecommended: boolean;
  explainable: boolean;
};

export type PhotographyKnowledgeContext = {
  randomLighting?: boolean;
  physicsViolation?: boolean;
  perspectiveStoryMismatch?: boolean;
  materialLightingDisconnect?: boolean;
  unexplainedDecision?: boolean;
};

export type PhotographyKnowledgeViolation = {
  code: PhotographyKnowledgeFailureCode;
  message: string;
  knowledgeId?: string;
};

export type PhotographyKnowledgeReport = {
  valid: boolean;
  violations: PhotographyKnowledgeViolation[];
  knowledge: PhotographyKnowledge[];
  topics: PhotographyTopicId[];
  goldenRuleSatisfied: boolean;
  productFirst: boolean;
  physicallyRealistic: boolean;
  evolutionReady: boolean;
};

export type PhotographyKnowledgeFailureCode =
  | "RANDOM_LIGHTING_SELECTION"
  | "PHYSICS_VIOLATION"
  | "PERSPECTIVE_STORY_MISMATCH"
  | "MATERIAL_LIGHTING_DISCONNECT"
  | "UNEXPLAINED_PHOTOGRAPHY_DECISION"
  | "PRODUCT_NOT_FIRST"
  | "PHOTOGRAPHY_INCONSISTENCY"
  | "UNKNOWN_KNOWLEDGE";
