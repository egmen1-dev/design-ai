import type { ProductCategory } from "@/lib/product-analysis";

export const KNOWLEDGE_ENGINE_VERSION = "1.0";
export const EMA_ALPHA = 0.12;
export const ANALYSIS_INTERVAL = 100;
export const RETRIEVAL_LIMIT = 20;
export const DIVERSITY_OVERUSE_THRESHOLD = 4;
export const DIVERSITY_WINDOW = 25;

export type KnowledgeCategory =
  | "tools"
  | "electronics"
  | "cosmetics"
  | "furniture"
  | "kids"
  | "clothes"
  | "auto"
  | "pets"
  | "kitchen"
  | "sports"
  | "home"
  | "generator"
  | "generic";

export type PatternSnapshot = {
  category: KnowledgeCategory;
  layoutTemplate: string;
  compositionType: string;
  backgroundType: string;
  lightingType: string;
  fontFamily: string;
  badgeStyle: string;
  productScale: number;
  textDensity: number;
  negativeSpace: number;
  primaryColor: string;
  secondaryColor: string;
};

export type GenerationScores = {
  designScore?: number;
  artDirectorScore?: number;
  marketplaceScore?: number;
  photographerScore?: number;
  ctrPrediction?: number;
  userLiked?: boolean | null;
};

export type CategoryInsights = {
  category: KnowledgeCategory;
  topLayouts: Array<{ key: string; weight: number; avgScore: number; sharePct: number }>;
  topFonts: Array<{ key: string; weight: number; avgScore: number }>;
  topBackgrounds: Array<{ key: string; weight: number; avgScore: number }>;
  topLighting: Array<{ key: string; weight: number; avgScore: number }>;
  topColors: Array<{ key: string; weight: number }>;
  optimalProductScale: [number, number];
  avgTopDesignScore: number;
  sampleCount: number;
};

export type KnowledgeContext = {
  category: KnowledgeCategory;
  promptBlock: string;
  patterns: PatternSnapshot[];
  insights?: CategoryInsights;
};

export type EvolutionInput = GenerationScores & {
  patternKey: string;
  category: KnowledgeCategory;
  snapshot: PatternSnapshot;
  successful: boolean;
};

export const PRODUCT_TO_KNOWLEDGE: Record<ProductCategory, KnowledgeCategory> = {
  garden_tools: "tools",
  electronics: "electronics",
  cosmetics: "cosmetics",
  home_appliances: "home",
  fashion: "clothes",
  food: "kitchen",
  sport: "sports",
  kids: "kids",
  auto: "auto",
  premium: "home",
  generic: "generic",
};
