import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";
import type { ParametricBadgeModel } from "@/lib/design/design-assets-intelligence/types";
import type { DesignDNA } from "@/lib/design/types";
import type { CompositionScenarioId } from "@/lib/design/types";
import type { LayoutTemplateId } from "@/lib/layout-engine/types";
import type { ProductCategory } from "@/lib/product-analysis";

export const GENOME_VERSION = "1.0";
export const GENOME_EMA_ALPHA = 0.12;
export const GENOME_MIX_WEIGHTS = [0.4, 0.3, 0.3] as const;

export type GenomeProductSection = {
  category: ProductCategory;
  subcategory: string;
  weight: string;
  shape: string;
  aspectRatio: number;
  visualComplexity: number;
  dominantColor: string;
};

export type GenomeStorySection = {
  problem: string;
  solution: string;
  emotion: string;
  marketingHook: string;
  customerIntent: string;
  buyerMotivation: string;
  heroConcept: string;
};

export type GenomeSceneSection = {
  environment: string;
  timeOfDay: string;
  weather: string;
  season: string;
  indoorOutdoor: "indoor" | "outdoor" | "studio";
  premiumScore: number;
  narrative: string;
};

export type GenomeCameraSection = {
  cameraAngle: string;
  cameraHeight: string;
  lens: string;
  distance: string;
  perspective: string;
  heroAngle: string;
};

export type GenomeLightSection = {
  keyLight: string;
  fillLight: string;
  rimLight: string;
  ambient: string;
  temperature: string;
  shadowSoftness: string;
  reflection: boolean;
  volumetricLight: boolean;
};

export type GenomeCompositionSection = {
  compositionType: CompositionScenarioId;
  layoutTemplate: LayoutTemplateId;
  heroPosition: string;
  negativeSpacePct: number;
  readingFlow: string;
  visualHierarchy: string;
  ruleOfThirds: boolean;
  goldenRatio: boolean;
  foregroundDepth: string;
  backgroundDepth: string;
  focus: string;
  productScalePct: number;
};

export type GenomeTypographySection = {
  fontFamily: string;
  fontWeight: string;
  fontScale: number;
  tracking: string;
  lineHeight: number;
  contrast: number;
};

export type GenomeBadgeSection = {
  style: string;
  radius: number;
  paddingX: number;
  paddingY: number;
  border: string;
  gradient: string;
  opacity: number;
  shadow: string;
  icon: string;
  parametric?: ParametricBadgeModel;
};

export type GenomePaletteSection = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  contrast: number;
  emotion: string;
  name: string;
};

export type GenomeMarketplaceSection = {
  ctrPrediction: number;
  readability: number;
  attentionScore: number;
  visualBalance: number;
  professionalScore: number;
};

export type GenomeRankings = {
  marketplaceScore: number;
  professionalScore: number;
  commercialScore: number;
  readability: number;
  ctrPrediction: number;
  visualImpact: number;
  originality: number;
  trendScore: number;
  reuseScore: number;
};

export type DesignGenomeRecord = {
  version: string;
  genomeKey: string;
  knowledgeCategory: KnowledgeCategory;
  product: GenomeProductSection;
  story: GenomeStorySection;
  scene: GenomeSceneSection;
  camera: GenomeCameraSection;
  light: GenomeLightSection;
  composition: GenomeCompositionSection;
  typography: GenomeTypographySection;
  badge: GenomeBadgeSection;
  palette: GenomePaletteSection;
  marketplace: GenomeMarketplaceSection;
  dna: DesignDNA;
  rankings: GenomeRankings;
};

export type StoryBlueprint = {
  customerIntent: string;
  problem: string;
  solution: string;
  emotion: string;
  marketingHook: string;
  heroConcept: string;
  sceneNarrative: string;
  buyerMotivation: string;
  visualHookType?: string;
  compositionScenarioId?: CompositionScenarioId;
  agentSnippet: string;
};

export type CommercialPhotographyBlueprint = {
  sceneType: string;
  location: string;
  floorMaterial: string;
  wallMaterial: string;
  lightSource: string;
  colorTemperature: string;
  rimLight: string;
  contactShadow: string;
  reflections: string;
  depthOfField: string;
  atmosphere: string;
  qualityTarget: string;
  backgroundNarrative: string;
    scenePatch: {
      cameraAngle?: string;
      cameraHeight?: string;
      cameraDistance?: string;
      lightingDirection?: string;
      lightingTemperature?: string;
      backgroundType?: string;
      depthOfField?: string;
      visualMood?: string;
      colorHarmony?: string;
      shadowProfile?: "contact" | "ambient" | "directional" | "mixed";
    };
  agentSnippet: string;
};

export type GenomeIntelligenceContext = {
  category: KnowledgeCategory;
  promptBlock: string;
  agentSnippet: string;
  selectedGenome: DesignGenomeRecord;
  mutatedGenome: DesignGenomeRecord;
  storyBlueprint: StoryBlueprint;
  photoBlueprint: CommercialPhotographyBlueprint;
  mixSources?: string[];
};

export type GenomeBuildInput = {
  prompt: string;
  productCategory: ProductCategory;
  knowledgeCategory: KnowledgeCategory;
  customerIntent?: string;
  heroConcept?: string;
  sceneNarrative?: string;
  story?: Partial<GenomeStorySection>;
  scenePlan?: import("@/lib/design/scene-planner").ScenePlan;
  compositionTemplate?: LayoutTemplateId;
  productScalePct?: number;
  negativeSpacePct?: number;
  fontFamily?: string;
  badge?: GenomeBadgeSection;
  palette?: GenomePaletteSection;
  dna?: DesignDNA;
  ctrPrediction?: number;
  designScore?: number;
  seniorAdScore?: number;
  ctrScore?: number;
  photoScore?: number;
  productVisual?: import("@/lib/design/scene-planner").ProductVisualProfile;
};
