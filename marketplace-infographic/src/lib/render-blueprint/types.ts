/**
 * DESIGN AI v18 — Chapter 3: RenderBlueprint
 * Single source of truth. No prompts stored. No duplicate fields (Rule 001).
 */

export const RENDER_BLUEPRINT_VERSION = 18;

export type BlueprintSection =
  | "meta"
  | "creative"
  | "story"
  | "product"
  | "scene"
  | "photography"
  | "camera"
  | "lighting"
  | "materials"
  | "composition"
  | "background"
  | "render"
  | "constraints"
  | "validation";

export type RenderGeneratorId = "flux" | "gpt-image" | "imagen";

export type MetaBlueprint = {
  id: string;
  version: number;
  /** Blueprint schema SemVer — Ch 3.13 */
  schemaVersion?: string;
  /** Optimistic lock — bumped on every mutation (Ch 3.4) */
  revision: number;
  /** Только Flux Adapter — агенты не меняют */
  generator: RenderGeneratorId;
  createdAt: number;
  seed: number;
  retry: number;
  layout: "marketplace";
  locked?: boolean;
  audit?: BlueprintAuditEntry[];
};

export type BlueprintAuditEntry = {
  agentId: string;
  section: BlueprintSection;
  action: "set" | "patch";
  at: number;
};

export type MarketplaceId = "WB" | "Ozon" | "Amazon";

export type CreativeGoal =
  | "CTR"
  | "Premium"
  | "Luxury"
  | "Minimal"
  | "Technical"
  | "Lifestyle";

export type PriceSegmentId = "budget" | "middle" | "premium";

export type CreativeBlueprint = {
  marketplace: MarketplaceId;
  goal: CreativeGoal;
  priceSegment: PriceSegmentId;
  audience: string;
  emotion: string;
};

export type EmotionalToneId = "calm" | "confident" | "innovative" | "warm" | "luxury";

export type StoryBlueprint = {
  hook: string;
  customerProblem: string;
  customerDesire: string;
  visualPromise: string;
  emotionalTone: EmotionalToneId;
  narrative: string;
  /** Ch 4.10 — Visual Story Director metadata */
  storyType?: string;
  customerIntent?: string;
  visualHook?: string;
  primaryEmotion?: string;
  commercialGoal?: string;
};

export type ProductFinishId = "matte" | "gloss" | "mixed";

export type ProductBlueprint = {
  category: string;
  subCategory: string;
  dominantColor: string[];
  materials: string[];
  finish: ProductFinishId;
  shape: string;
  cutout: boolean;
};

/** Rule 001 — единственное поле локации: scene.environment */
export type SceneEnvironmentId =
  | "kitchen"
  | "bathroom"
  | "garage"
  | "garden"
  | "living_room"
  | "studio"
  | "workshop";

export type SceneArchitectureId = "modern" | "classic" | "industrial" | "minimal";

export type SceneTimeOfDayId = "morning" | "day" | "golden_hour" | "sunset" | "night";

export type SceneWeatherId = "clear" | "cloudy" | "rain";

export type SceneDepthId = "shallow" | "medium" | "deep";

export type SceneBlueprint = {
  environment: SceneEnvironmentId;
  architecture: SceneArchitectureId;
  timeOfDay: SceneTimeOfDayId;
  weather: SceneWeatherId;
  depth: SceneDepthId;
  surface: string;
  /** Ch 4.11 — Scene Director metadata */
  sceneType?: string;
  environmentType?: string;
  backgroundNarrative?: string;
  lightingMood?: string;
  materialPalette?: string[];
  depthProfile?: string;
  cameraEnvironment?: string;
  realismProfile?: string;
  providerHints?: string[];
};

export type PhotographyStyleId = "commercial" | "editorial" | "catalog" | "advertising";

export type ShotTypeId = "hero" | "wide" | "detail" | "macro";

export type ContrastLevelId = "soft" | "medium" | "high";

/** Photography — без camera.* (Rule 001). Без marketing-слов в visualMood. */
export type PhotographyBlueprint = {
  style: PhotographyStyleId;
  shotType: ShotTypeId;
  backgroundBlur: number;
  contrast: ContrastLevelId;
  visualMood: string;
  realism: number;
  /** Ch 4.13 — Commercial Photo Director shoot plan */
  photographyStyle?: string;
  photoMood?: string;
  depthProfile?: string;
  focusStrategy?: string;
  productInteraction?: string;
  shootingNarrative?: string;
  lightingIntent?: string;
  cameraIntent?: string;
  materialIntent?: string;
  providerHints?: string[];
};

export type CameraLensId = 35 | 50 | 70 | 85;

export type CameraHeightId = "low" | "eye" | "high";

export type CameraAngleId = "front" | "three-quarter" | "side";

export type CameraDistanceId = "close" | "medium" | "far";

export type CameraPerspectiveId = "natural" | "dramatic";

/** camera.distance — единственное место для дистанции (Rule 001) */
export type CameraBlueprint = {
  lens: CameraLensId;
  height: CameraHeightId;
  angle: CameraAngleId;
  distance: CameraDistanceId;
  perspective: CameraPerspectiveId;
  /** Ch 4.15 — Camera Director viewpoint model */
  cameraStyle?: string;
  cameraAngle?: string;
  cameraHeight?: string;
  focalLength?: number;
  perspectiveProfile?: string;
  heroScale?: number;
  depthOfField?: string;
  framingProfile?: string;
  providerHints?: string[];
};

export type LightingPresetId =
  | "studio"
  | "window"
  | "golden_hour"
  | "softbox"
  | "overcast";

export type LightingBlueprint = {
  preset: LightingPresetId;
  temperature: number;
  key: string;
  fill: string;
  rim: string;
  back: string;
  shadowSoftness: number;
  reflectionStrength: number;
  /** Ch 4.14 — Lighting Director physics model */
  lightingStyle?: string;
  lightingScheme?: string;
  keyLight?: import("./lighting-director-types").LightProfile;
  fillLight?: import("./lighting-director-types").LightProfile;
  rimLight?: import("./lighting-director-types").LightProfile;
  ambientLight?: import("./lighting-director-types").AmbientProfile;
  shadowProfile?: import("./lighting-director-types").ShadowProfile;
  contrastProfile?: import("./lighting-director-types").ContrastProfile;
  lightingMood?: string;
  providerHints?: string[];
};

export type MaterialReflectionId = "none" | "soft" | "medium";

export type MaterialBlueprint = {
  floor: string;
  walls: string;
  decor: string[];
  reflection: MaterialReflectionId;
  roughness: number;
};

export type CompositionTemplateId = "hero_left" | "hero_right" | "center";

/** Без legacy hero x/y — Ch 4.12 adds normalized layout zones */
export type LayoutRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type CompositionBlueprint = {
  template: CompositionTemplateId;
  heroWeight: number;
  negativeSpace: number;
  balance: number;
  eyeFlow: string[];
  foreground: boolean;
  midground: boolean;
  background: boolean;
  /** Ch 4.12 — Composition Director layout geometry */
  templateId?: string;
  heroArea?: LayoutRect;
  headlineArea?: LayoutRect;
  benefitsArea?: LayoutRect;
  badgeArea?: LayoutRect;
  ctaArea?: LayoutRect;
  safeZones?: LayoutRect[];
  visualHierarchy?: string[];
  eyeFlowProfile?: string;
  whiteSpace?: number;
};

export type BackgroundComplexityId = "minimal" | "medium" | "rich";

export type BackgroundBlueprint = {
  complexity: BackgroundComplexityId;
  containsPeople: boolean;
  containsAnimals: boolean;
  containsVehicles: boolean;
  decorDensity: number;
  secondaryObjects: string[];
};

export type RenderQualityId = "draft" | "production";

export type RenderResolution = {
  width: number;
  height: number;
};

/** Rule 004 — без prompt/negativePrompt. Только настройки рендера. */
export type RenderBlueprintSettings = {
  provider: string;
  quality: RenderQualityId;
  aspectRatio: "3:4";
  resolution: RenderResolution;
  negativePromptProfile: string;
};

export type ConstraintSet = import("./constraint-types").ConstraintSet;

export type ConstraintBlueprint = {
  mustLeaveHeadlineSpace: boolean;
  mustLeaveBadgeSpace: boolean;
  mustLeaveBenefitsSpace: boolean;
  mustAvoidText: boolean;
  mustAvoidDuplicateObjects: boolean;
  mustAvoidHeroOverlap: boolean;
  /** Merged constraint objects — typed payloads only (Ch 3.7) */
  set: ConstraintSet;
};

export type ValidationBlueprint = {
  storyApproved: boolean;
  sceneApproved: boolean;
  photoApproved: boolean;
  layoutApproved: boolean;
  chiefApproved: boolean;
  professionalScore: number;
  warnings: string[];
};

export type RenderBlueprint = {
  meta: MetaBlueprint;
  lifecycle: import("./lifecycle-types").BlueprintLifecycleMeta;
  creative: CreativeBlueprint;
  story: StoryBlueprint;
  product: ProductBlueprint;
  scene: SceneBlueprint;
  photography: PhotographyBlueprint;
  camera: CameraBlueprint;
  lighting: LightingBlueprint;
  materials: MaterialBlueprint;
  composition: CompositionBlueprint;
  background: BackgroundBlueprint;
  render: RenderBlueprintSettings;
  constraints: ConstraintBlueprint;
  validation: ValidationBlueprint;
};

/** Побочный продукт адаптера — не хранится в RenderBlueprint (Rule 004) */
export type FluxAdapterOutput = {
  prompt: string;
  negativePrompt: string;
  generator: RenderGeneratorId;
  compiledAt: number;
};

export type RenderBlueprintInput = {
  id?: string;
  seed: number;
  category: string;
  subCategory?: string;
  marketplace?: MarketplaceId;
  environment?: SceneEnvironmentId;
  dominantColor?: string[];
};
