/**
 * DESIGN AI v18 — RenderBlueprint
 * Single source of truth. Agents mutate assigned sections only.
 */
import type { ProductCategory } from "@/lib/product-analysis";
import type { LayoutTemplateId } from "@/lib/layout-engine/types";
import type { LayoutGeometry } from "@/lib/design/composition-director/types";
import type {
  DepthLevel,
  LightingPresetId,
  MaterialId,
} from "@/lib/design/scene-blueprint/types";
import type {
  TargetEmotionId,
  WeatherId,
  TimeOfDayId,
} from "@/lib/design/visual-pipeline/types";
import type { SceneEnvironmentId } from "./environment";

export const RENDER_BLUEPRINT_VERSION = "18.0" as const;

export type BlueprintSection =
  | "knowledge"
  | "creativeIntent"
  | "story"
  | "scene"
  | "photography"
  | "layout"
  | "lighting"
  | "camera"
  | "materials"
  | "palette"
  | "constraints"
  | "render";

export type AgentSectionOwner =
  | "knowledge-engine"
  | "creative-intent"
  | "visual-story-director"
  | "scene-director"
  | "commercial-photo-director"
  | "composition-director"
  | "lighting-director"
  | "camera-director"
  | "material-director"
  | "flux-adapter";

/** Какой агент владеет какой секцией */
export const SECTION_OWNERS: Record<Exclude<BlueprintSection, "palette" | "constraints" | "render">, AgentSectionOwner> = {
  knowledge: "knowledge-engine",
  creativeIntent: "creative-intent",
  story: "visual-story-director",
  scene: "scene-director",
  photography: "commercial-photo-director",
  layout: "composition-director",
  lighting: "lighting-director",
  camera: "camera-director",
  materials: "material-director",
};

export type BlueprintTraceEntry = {
  agentId: AgentSectionOwner | "system";
  section: BlueprintSection;
  action: "set" | "patch" | "merge";
  at: string;
};

export type RenderKnowledgeSection = {
  marketSnippet?: string;
  genomeId?: string;
  memoryPatterns?: string[];
  trendSnippet?: string;
  category?: ProductCategory;
};

export type RenderCreativeIntentSection = {
  customerNeed: string;
  sellingAngle: string;
  priceSegment: "budget" | "mid" | "premium";
};

/** Design Language — не Flux tokens */
export type RenderStorySection = {
  emotion: TargetEmotionId | "security" | "reliability";
  customerNeed: string;
  visualNarrative: string;
  storyType?: "industrial_product" | "lifestyle" | "workshop" | "premium" | "technical" | "domestic";
  usageContext?: "home" | "outdoor" | "professional" | "retail" | "utility";
};

/** Единственное поле локации — scene.environment */
export type RenderSceneSection = {
  environment: SceneEnvironmentId;
  time: TimeOfDayId;
  weather: WeatherId;
  depth: DepthLevel;
  visualDensity: number;
};

export type DepthOfFieldId = "shallow" | "medium" | "deep";

/** Photography Language — бриф съёмки (Commercial Photo Director) */
export type RenderPhotographySection = {
  lensMm: number;
  cameraHeight: "eye_level" | "low_hero" | "three_quarter" | "top_down";
  distance: "close" | "medium" | "wide";
  depthOfField: DepthOfFieldId;
  lightingPreset: LightingPresetId | "warm_directional" | "luxury_softbox";
  framing?: "product_hero" | "environment_context";
};

export type RenderLightingSection = {
  preset: LightingPresetId;
  keyLight: "soft" | "directional" | "spot" | "overhead";
  fill: "minimal" | "balanced" | "ambient";
  rim: "none" | "subtle" | "strong";
  temperatureK: number;
  contrast: "low" | "medium" | "high";
  shadowStyle: "soft" | "contact" | "directional";
};

export type RenderCameraSection = {
  lensMm: number;
  angle: "eye_level" | "low_hero" | "three_quarter" | "top_down";
  distance: "close" | "medium" | "wide";
  framing: "product_hero" | "environment_context";
  perspective: "natural" | "compressed" | "wide";
};

export type RenderLayoutSection = {
  templateId: LayoutTemplateId;
  geometry: LayoutGeometry;
  whitespaceTarget: number;
  heroScale: number;
  heroPosition: "left" | "right" | "center";
  negativeSpace: "left" | "right" | "top" | "balanced";
};

export type RenderMaterialsSection = {
  floor: MaterialId;
  background: MaterialId;
  surface: MaterialId;
  reflection: "none" | "subtle" | "moderate" | "glossy";
  texture: "matte" | "brushed" | "glossy" | "concrete";
};

export type RenderConstraintsSection = {
  noProduct: true;
  noText: true;
  noLogos: true;
  noPeople: true;
  backdropOnly: true;
};

/** Заполняется только Flux Adapter — агенты read-only */
export type RenderAdapterSection = {
  model: "flux" | "kontext" | "seedream" | "gptimage";
  compiledPrompt?: string;
  negativePrompt?: string;
  compiledAt?: string;
};

export type RenderBlueprint = {
  version: typeof RENDER_BLUEPRINT_VERSION;
  meta: {
    category: ProductCategory;
    seed: string;
    locked: boolean;
    trace: BlueprintTraceEntry[];
  };
  knowledge: RenderKnowledgeSection;
  creativeIntent: RenderCreativeIntentSection;
  story: RenderStorySection;
  scene: RenderSceneSection;
  photography: RenderPhotographySection;
  layout: RenderLayoutSection;
  lighting: RenderLightingSection;
  camera: RenderCameraSection;
  materials: RenderMaterialsSection;
  palette: string[];
  constraints: RenderConstraintsSection;
  render: RenderAdapterSection;
};

export type RenderBlueprintInput = {
  category: ProductCategory;
  seed: string;
  customerNeed?: string;
  environment?: SceneEnvironmentId;
  palette?: string[];
};
