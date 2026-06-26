/** Быстрый режим по умолчанию — укладываемся в ~3–5 мин */
export const FAST_GENERATION = process.env.FAST_GENERATION !== "0";

export const MAX_SCENE_ATTEMPTS = FAST_GENERATION
  ? 1
  : Number(process.env.MAX_SCENE_ATTEMPTS ?? 3);

/** Sharp-only вырезка вместо imgly (экономит 30–90 с) */
export const USE_FAST_CUTOUT =
  FAST_GENERATION || process.env.DISABLE_IMGLY === "1";

export const COMPOSITION_MAX_ATTEMPTS = FAST_GENERATION ? 4 : 10;
export const COMPOSITION_MIN_SCORE = FAST_GENERATION ? 85 : 90;

export const MAX_PHOTO_BG_RETRIES = FAST_GENERATION ? 0 : 1;
export const MAX_SENIOR_AD_LAYOUT_RETRIES = FAST_GENERATION ? 2 : 4;
export const MAX_CONCEPT_RENDER_RETRIES = FAST_GENERATION ? 1 : 2;

export const SKIP_OLLAMA_QUALITY_RETRY = FAST_GENERATION;

export const OLLAMA_NUM_PREDICT = FAST_GENERATION ? 1800 : 2800;
export const OLLAMA_TIMEOUT_MS = Number(
  process.env.OLLAMA_TIMEOUT_MS ?? (FAST_GENERATION ? 90_000 : 120_000),
);

export const HF_MAX_ATTEMPTS = FAST_GENERATION ? 4 : 6;
export const HF_TOTAL_TIMEOUT_MS = FAST_GENERATION ? 120_000 : 180_000;
