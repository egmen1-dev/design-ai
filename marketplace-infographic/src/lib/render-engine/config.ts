/** Render Engine v17 configuration */

export const USE_RENDER_ENGINE_V17 =
  process.env.RENDER_ENGINE_V17 === "1" || process.env.PIPELINE_V17 === "1";

export const RENDER_ENGINE_CONFIG = {
  defaultProvider: (process.env.RENDER_PROVIDER ?? "pollinations") as
    | "pollinations"
    | "huggingface",
  pollinations: {
    baseUrl:
      process.env.POLLINATIONS_BASE_URL?.replace(/\/$/, "") ??
      "https://gen.pollinations.ai",
    apiKey: process.env.POLLINATIONS_API_KEY ?? process.env.POLLINATIONS_KEY,
    defaultModel: (process.env.POLLINATIONS_MODEL ?? "flux") as string,
    timeoutMs: Number(process.env.POLLINATIONS_TIMEOUT_MS ?? 90_000),
    maxAttempts: Number(process.env.POLLINATIONS_MAX_ATTEMPTS ?? 4),
    /** Models known broken on some API keys (gptimage → 422 moderation on any prompt) */
    skipInAutoChain: (process.env.POLLINATIONS_SKIP_MODELS ?? "gptimage")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean) as import("./types").RenderModelId[],
  },
  huggingface: {
    enabled: !!process.env.HF_API_KEY,
  },
  retry: {
    maxAttempts: Number(process.env.RENDER_MAX_ATTEMPTS ?? 3),
    passThreshold: Number(process.env.RENDER_QUALITY_THRESHOLD ?? 85),
  },
  canvas: {
    width: 900,
    height: 1200,
  },
} as const;

export type ModelSelectionRule = {
  profileId: string;
  category?: string;
  priceSegment?: string;
  sceneType?: string;
  modelId: import("./types").RenderModelId;
  priority: number;
};

/** Configurable model selection rules */
export const MODEL_SELECTION_RULES: ModelSelectionRule[] = [
  { profileId: "industrial", modelId: "kontext", priority: 100 },
  { profileId: "construction", modelId: "kontext", priority: 100 },
  { profileId: "luxury", modelId: "flux", priority: 100 },
  { profileId: "beauty", modelId: "flux", priority: 90 },
  { profileId: "minimal", modelId: "flux", priority: 100 },
  { profileId: "premium_product", modelId: "flux", priority: 80 },
  { profileId: "lifestyle", modelId: "seedream", priority: 100 },
  { profileId: "outdoor", modelId: "seedream", priority: 90 },
  { profileId: "kitchen", modelId: "flux", priority: 80 },
  { profileId: "electronics", modelId: "kontext", priority: 85 },
  { profileId: "medical", modelId: "flux", priority: 80 },
  { profileId: "furniture", modelId: "seedream", priority: 85 },
];

/** Retry fallback chain — flux first; gptimage omitted (often 422 on paid keys) */
export const RETRY_MODEL_CHAIN: import("./types").RenderModelId[] = [
  "flux",
  "kontext",
  "seedream",
];
