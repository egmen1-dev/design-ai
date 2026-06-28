/** Render Engine v17 — renderer-centric architecture */

export type RenderEngineVersion = "17.0";

export type RenderProviderId =
  | "pollinations"
  | "huggingface"
  | "comfyui"
  | "openai"
  | "local_flux";

export type RenderModelId =
  | "flux"
  | "kontext"
  | "gptimage"
  | "seedream";

export type RenderProfileId =
  | "industrial"
  | "kitchen"
  | "beauty"
  | "medical"
  | "construction"
  | "luxury"
  | "electronics"
  | "furniture"
  | "outdoor"
  | "minimal"
  | "premium_product"
  | "lifestyle";

export type RenderSceneBlock = {
  type: string;
  atmosphere: string;
  depth: string;
  environment: string;
  floor: string;
  background: string;
  visualDensity: number;
};

export type RenderLayoutBlock = {
  templateId?: string;
  heroPosition: string;
  whitespaceTarget: number;
  heroZone?: { x: number; y: number; width: number; height: number };
  headlineZone?: { x: number; y: number; width: number; height: number };
  productPlacementPct?: { cx: number; cy: number };
  textSafeZones: Array<{
    purpose: string;
    left: number;
    top: number;
    width: number;
    height: number;
  }>;
  palette: string[];
  maxColors: number;
};

export type RenderLightingBlock = {
  preset?: string;
  key: string;
  fill: string;
  rim?: string;
  back?: string;
  temperatureK?: number;
  direction?: string;
};

export type RenderMaterialsBlock = {
  surface: string;
  floor: string;
  reflection: string;
  atmosphere: string;
};

export type RenderCameraBlock = {
  lensMm: number;
  height: string;
  distance: string;
  angle: string;
  depthOfField: string;
};

export type RenderQualityBlock = {
  target: "8k" | "4k";
  photorealistic: boolean;
  marketplaceOptimized: boolean;
  colorDiscipline: string;
};

export type RenderNegativeBlock = {
  terms: string[];
  zoneExclusions: string[];
};

export type ProviderHints = {
  preferredModel?: RenderModelId;
  referenceImageUrl?: string;
  enhancePrompt?: boolean;
  nologo?: boolean;
  safe?: boolean;
  guidanceScale?: number;
  [key: string]: unknown;
};

/** Universal rendering description — NEVER a giant prose prompt */
export type RenderRequest = {
  version: RenderEngineVersion;
  requestId: string;
  profileId: RenderProfileId;
  modelId: RenderModelId;
  providerId: RenderProviderId;
  category: string;
  canvas: { width: number; height: number };
  scene: RenderSceneBlock;
  layout: RenderLayoutBlock;
  lighting: RenderLightingBlock;
  materials: RenderMaterialsBlock;
  camera: RenderCameraBlock;
  quality: RenderQualityBlock;
  negative: RenderNegativeBlock;
  providerHints: ProviderHints;
  /** Structured metadata for explainability — not sent to model */
  metadata?: {
    constitutionPassed?: boolean;
    compositionScore?: number;
    sceneScore?: number;
    luxuryScore?: number;
    visualBlueprint?: import("@/lib/design/visual-pipeline/types").VisualSceneBlueprint;
    coverConceptId?: import("@/lib/cover-concepts").CoverConceptId;
  };
};

export type CompiledRenderPayload = {
  model: string;
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  seed?: number;
  referenceImageUrl?: string;
  extraParams?: Record<string, string | number | boolean>;
  /** Modules that were included in compilation */
  modulesUsed: string[];
  /** Modules ignored because model doesn't support them */
  modulesIgnored: string[];
};

export interface RenderAdapter {
  readonly id: string;
  readonly modelId: RenderModelId;
  readonly providerId: RenderProviderId;
  compile(request: RenderRequest): CompiledRenderPayload;
}

export type ProviderCapabilities = {
  negativePrompt: boolean;
  aspectRatio: boolean;
  seed: boolean;
  imageInput: boolean;
  models: RenderModelId[];
};

export type ProviderHealth = {
  ok: boolean;
  latencyMs?: number;
  message?: string;
};

export type ProviderPricing = {
  currency: string;
  estimatedCostPerImage: number;
  freeTier: boolean;
};

export type RenderResult = {
  imageBuffer: Buffer;
  imageUrl?: string;
  providerId: RenderProviderId;
  modelId: RenderModelId;
  seed?: number;
  latencyMs: number;
  compiled: CompiledRenderPayload;
};

export interface RenderingProvider {
  readonly id: RenderProviderId;
  render(payload: CompiledRenderPayload, options?: RenderProviderOptions): Promise<RenderResult>;
  health(): Promise<ProviderHealth>;
  capabilities(): ProviderCapabilities;
  pricing(): ProviderPricing;
  supportsNegativePrompt(): boolean;
  supportsAspectRatio(): boolean;
  supportsSeed(): boolean;
  supportsImageInput(): boolean;
}

export type RenderProviderOptions = {
  seedSuffix?: string;
  timeoutMs?: number;
  maxAttempts?: number;
  /** Scene hints for moderation fallback prompts */
  moderationHints?: { atmosphere?: string; environment?: string };
};

export type RenderAttempt = {
  attemptIndex: number;
  modelId: RenderModelId;
  providerId: RenderProviderId;
  profileId: RenderProfileId;
  result?: RenderResult;
  qualityScore?: number;
  qualityBreakdown?: import("./quality/render-quality").RenderQualityScores;
  passed: boolean;
  error?: string;
};

export type RenderEngineResult = {
  backgroundBuffer: Buffer;
  backgroundUrl: string;
  backgroundSource: "provider" | "fallback";
  request: RenderRequest;
  attempts: RenderAttempt[];
  selectedAttempt: RenderAttempt;
  overallScore: number;
};

export type CanvasComposeInput = {
  backgroundBuffer: Buffer;
  productCutoutPath: string;
  scenePlan: import("@/lib/design/scene-planner").ScenePlan;
  compositionLayout?: import("@/lib/composition/types").CompositionLayout;
  objectScale?: number;
  /** v17: product NEVER regenerated — always original PNG cutout */
  preserveProductPixels: true;
};

export type CanvasComposeResult = {
  mergedBuffer: Buffer;
  mergedPath: string;
  lighting: import("@/lib/compositing/scene-analysis").SceneLightingProfile;
  productPlacement: { left: number; top: number; width: number; height: number };
};

export const RENDER_ENGINE_VERSION: RenderEngineVersion = "17.0";
export const RENDER_QUALITY_PASS_THRESHOLD = 85;
