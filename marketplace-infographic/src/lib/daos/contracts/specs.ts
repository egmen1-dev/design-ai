import type { DAOSBaseSpecification } from "./base";

export type ProductBrief = DAOSBaseSpecification & {
  rawPrompt: string;
  productName?: string;
  category?: string;
  marketplace?: "wildberries" | "ozon" | "amazon" | "other";
  commercialGoal?: "ctr" | "conversion" | "trust" | "premium" | "clarity" | "balanced";
  imageSize?: {
    width: number;
    height: number;
  };
};

export type ResearchSpec = DAOSBaseSpecification & {
  facts: string[];
  sources: string[];
  competitors?: string[];
  buyerInsights?: string[];
};

export type KnowledgeSpec = DAOSBaseSpecification & {
  patterns: string[];
  designGenome?: string[];
  marketplaceRules?: string[];
};

export type CommercialSpec = DAOSBaseSpecification & {
  mainMessage: string;
  usp: string[];
  buyerPainPoints: string[];
  trustDrivers: string[];
  hierarchy: string[];
};

export type CreativeSpec = DAOSBaseSpecification & {
  concept: string;
  visualHook: string;
  mood: string;
  rejectedConcepts?: {
    concept: string;
    reason: string;
  }[];
};

export type VisualBlueprint = DAOSBaseSpecification & {
  scene: string;
  composition: string;
  lighting: string;
  camera?: string;
  productPlacement?: string;
  safeZones?: string[];
};

export type RenderBlueprint = DAOSBaseSpecification & {
  renderStrategy: "background_only" | "hybrid_shadow_scene" | "integrated_scene";
  provider?: string;
  promptAllowedOnlyInAdapter: true;
};

export type VisionReport = DAOSBaseSpecification & {
  passed: boolean;
  score: number;
  problems: string[];
};

export type LearningReport = DAOSBaseSpecification & {
  updates: string[];
};
