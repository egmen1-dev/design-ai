/** Fully structured visual scene — Scene Director output, NOT natural language */
export type SceneTypeId =
  | "premium_studio"
  | "industrial_studio"
  | "luxury_minimal"
  | "technical_presentation"
  | "lifestyle"
  | "modern_dark"
  | "modern_white"
  | "technology"
  | "construction"
  | "medical"
  | "kitchen"
  | "workshop"
  | "nature"
  | "corporate";

export type DepthLevel = "shallow" | "medium" | "deep";
export type HeroAnchor = "ground" | "pedestal" | "surface";
export type HeroPosition =
  | "bottom-right"
  | "bottom-left"
  | "center-right"
  | "center-left"
  | "center";

export type LightingPresetId =
  | "soft_studio"
  | "luxury_softbox"
  | "warm_spotlight"
  | "cold_industrial"
  | "sunset_rim"
  | "high_contrast_commercial"
  | "top_product";

export type MaterialId =
  | "graphite"
  | "soft_concrete"
  | "frosted_acrylic"
  | "matte_aluminum"
  | "dark_steel"
  | "premium_plastic"
  | "glass"
  | "carbon_fiber"
  | "wood"
  | "stone";

export type SceneLighting = {
  preset: LightingPresetId;
  key: string;
  fill: string;
  rim: string;
  back: string;
  temperatureK: number;
};

export type SceneHero = {
  position: HeroPosition;
  rotationDeg: number;
  scale: number;
  anchor: HeroAnchor;
};

export type SceneHeadlineZone = {
  position: "top-left" | "top-right" | "top-center";
  widthRatio: number;
};

export type SceneAccent = {
  glow: boolean;
  particles: boolean;
  shapes: "none" | "minimal" | "moderate";
  maxGradients: number;
};

export type SceneCamera = {
  lensMm: number;
  height: "low" | "eye level" | "high";
  distance: "close" | "medium" | "wide";
  angle: string;
};

export type ProductInteraction = {
  groundPlane: boolean;
  softShadow: boolean;
  ambientOcclusion: boolean;
  backgroundInteraction: "subtle" | "moderate" | "none";
  lightWrapping: boolean;
  reflections: boolean;
  edgeHighlights: boolean;
  depthSeparation: "high" | "medium" | "low";
};

export type DecorativeDiscipline = {
  maxDensity: number;
  maxParticles: number;
  maxShapes: number;
  maxGradients: number;
  backgroundComplexity: "minimal" | "low" | "medium";
  whitespaceDominates: boolean;
};

export type SceneBlock = {
  type: SceneTypeId;
  environment: string;
  floor: string;
  background: string;
  depth: DepthLevel;
  atmosphere: string;
  material: MaterialId;
  visualDensity: number;
};

export type SceneBlueprint = {
  version: "1.0";
  scene: SceneBlock;
  lighting: SceneLighting;
  hero: SceneHero;
  headline: SceneHeadlineZone;
  accent: SceneAccent;
  camera: SceneCamera;
  productInteraction: ProductInteraction;
  decorative: DecorativeDiscipline;
  premiumFeeling: number;
  shadowStrategy: "contact-soft" | "ambient" | "directional" | "mixed";
};

export type SceneBlueprintQuality = {
  sceneQuality: number;
  lightingQuality: number;
  depthQuality: number;
  environmentQuality: number;
  luxuryFeeling: number;
  visualNoise: number;
  sceneCoherence: number;
  total: number;
  passed: boolean;
  issues: string[];
};

export type SceneDirectorInput = {
  prompt: string;
  analysis: import("@/lib/product-analysis").ProductAnalysis;
  storyDirection?: import("@/lib/agents/visual-story-director/types").VisualStoryDirectorResult;
  genomeContext?: import("@/lib/design/design-genome").GenomeIntelligenceContext;
  marketSnippet?: string;
  knowledgeCategory?: string;
  knowledgeSnippet?: string;
  trendSnippet?: string;
  productVisual?: import("@/lib/design/scene-planner").ProductVisualProfile;
  seed?: string;
};

export type SceneDirectorResult = {
  blueprint: SceneBlueprint;
  quality: SceneBlueprintQuality;
  approved: boolean;
  attempts: number;
  sceneType: SceneTypeId;
  agentSnippet: string;
  source: "heuristic" | "template";
};

export const SCENE_QUALITY_PASS_THRESHOLD = 76;
