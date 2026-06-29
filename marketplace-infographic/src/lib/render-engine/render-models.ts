import type { RenderModelId } from "./types";
import { RENDER_ENGINE_CONFIG } from "./config";

export type RenderModelChoice = "auto" | RenderModelId;

const ALL_MODELS: RenderModelId[] = ["flux", "kontext", "gptimage", "seedream"];

/** Build model chain: user pick first, then fallbacks. Auto omits broken models (e.g. gptimage). */
export function buildRenderModelsChain(userModel?: RenderModelId): RenderModelId[] {
  const skip = new Set(RENDER_ENGINE_CONFIG.pollinations.skipInAutoChain);
  const working = ALL_MODELS.filter((m) => !skip.has(m));
  if (!userModel) return working.length > 0 ? working : ["flux"];
  const rest = ALL_MODELS.filter((m) => m !== userModel && !skip.has(m));
  return [userModel, ...rest];
}

export const RENDER_MODEL_OPTIONS: Array<{
  id: RenderModelChoice;
  label: string;
  description: string;
  /** Shown in UI but not recommended (Pollinations key block) */
  disabled?: boolean;
}> = [
  {
    id: "auto",
    label: "Авто",
    description: "Flux → Kontext → Seedream (рекомендуется)",
  },
  {
    id: "flux",
    label: "Flux",
    description: "Фотореализм, студийные фоны, универсальный выбор",
  },
  {
    id: "kontext",
    label: "Kontext",
    description: "Чистый фон под товар, техника и индустрия",
  },
  {
    id: "seedream",
    label: "Seedream",
    description: "Lifestyle-сцены, естественная атмосфера",
  },
  {
    id: "gptimage",
    label: "GPT Image",
    description: "Недоступен на текущем ключе Pollinations — будет Flux",
    disabled: true,
  },
];

/** Options for UI select — excludes disabled models */
export function getActiveRenderModelOptions() {
  return RENDER_MODEL_OPTIONS.filter((o) => !o.disabled);
}

export const RENDER_MODEL_IDS = ["flux", "kontext", "gptimage", "seedream"] as const;

export function isRenderModelId(value: string): value is RenderModelId {
  return (RENDER_MODEL_IDS as readonly string[]).includes(value);
}
