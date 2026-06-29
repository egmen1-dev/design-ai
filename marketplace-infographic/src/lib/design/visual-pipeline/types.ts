/**
 * Visual Pipeline v2 — agents output structured decisions ONLY.
 * Prompt text is produced exclusively by PollinationsCompiler.
 */
import type { ProductCategory } from "@/lib/product-analysis";
import type {
  DepthLevel,
  HeroPosition,
  LightingPresetId,
  MaterialId,
  SceneTypeId,
} from "@/lib/design/scene-blueprint/types";

export type StoryTypeId =
  | "industrial_product"
  | "lifestyle"
  | "workshop"
  | "premium"
  | "technical"
  | "domestic";

export type TargetEmotionId =
  | "confidence"
  | "trust"
  | "luxury"
  | "energy"
  | "calm"
  | "professional";

export type UsageContextId =
  | "home"
  | "outdoor"
  | "professional"
  | "retail"
  | "utility";

export type StoryDecision = {
  storyType: StoryTypeId;
  targetEmotion: TargetEmotionId;
  usageContext: UsageContextId;
};

export type EnvironmentArchitectureId =
  | "studio"
  | "workshop"
  | "kitchen"
  | "outdoor"
  | "corporate"
  | "home_interior"
  | "tech_stage"
  | "nature";

export type WeatherId = "clear" | "overcast" | "indoor_controlled";
export type TimeOfDayId = "morning" | "noon" | "golden_hour" | "studio_neutral";

export type SceneEnvironmentDecision = {
  sceneType: SceneTypeId;
  architecture: EnvironmentArchitectureId;
  depth: DepthLevel;
  weather: WeatherId;
  time: TimeOfDayId;
  visualDensity: number;
};

export type LightingDecision = {
  preset: LightingPresetId;
  keyLight: "soft" | "directional" | "spot" | "overhead";
  fill: "minimal" | "balanced" | "ambient";
  rim: "none" | "subtle" | "strong";
  temperatureK: number;
  contrast: "low" | "medium" | "high";
  shadowStyle: "soft" | "contact" | "directional";
};

export type CameraDecision = {
  lensMm: number;
  angle: "eye_level" | "low_hero" | "three_quarter" | "top_down";
  distance: "close" | "medium" | "wide";
  framing: "product_hero" | "environment_context";
  perspective: "natural" | "compressed" | "wide";
};

export type MaterialDecision = {
  floor: MaterialId;
  background: MaterialId;
  surface: MaterialId;
  reflection: "none" | "subtle" | "moderate" | "glossy";
  texture: "matte" | "brushed" | "glossy" | "concrete";
};

export type CompositionSafeZone = {
  purpose: "headline" | "benefits" | "product" | "cta";
  left: number;
  top: number;
  width: number;
  height: number;
};

export type CompositionDecision = {
  heroPosition: HeroPosition;
  negativeSpace: "left" | "right" | "top" | "balanced";
  balance: "asymmetric_hero_right" | "asymmetric_hero_left" | "centered";
  visualWeight: { hero: number; background: number; headline: number };
  safeZones: CompositionSafeZone[];
};

export type VisualNegativeBlock = {
  terms: string[];
};

export type VisualConstraints = {
  noProduct: true;
  noText: true;
  noLogos: true;
  noPeople: true;
  backdropOnly: true;
};

/** Unified blueprint — no natural-language prompt fragments */
export type VisualSceneBlueprint = {
  version: "2.0";
  category: ProductCategory;
  story: StoryDecision;
  scene: SceneEnvironmentDecision;
  lighting: LightingDecision;
  camera: CameraDecision;
  materials: MaterialDecision;
  mood: TargetEmotionId;
  palette: string[];
  composition: CompositionDecision;
  negative: VisualNegativeBlock;
  constraints: VisualConstraints;
};

export type VisualPipelineInput = {
  prompt: string;
  analysis: import("@/lib/product-analysis").ProductAnalysis;
  story?: StoryDecision;
  sceneType?: SceneTypeId;
  palette?: string[];
  seed?: string;
};

export type DirectorResult<T> = {
  decision: T;
  approved: boolean;
  score: number;
  agentSnippet: string;
};
