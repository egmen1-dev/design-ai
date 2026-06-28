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
}> = [
  {
    id: "auto",
    label: "Авто",
    description: "Подбор по категории товара и профилю сцены",
  },
  {
    id: "flux",
    label: "Flux",
    description: "Фотореализм, студийные фоны, универсальный выбор",
  },
  {
    id: "gptimage",
    label: "GPT Image",
    description: "Премиум-стиль (если недоступен — авто-переход на Flux)",
  },
  {
    id: "seedream",
    label: "Seedream",
    description: "Lifestyle-сцены, естественная атмосфера",
  },
  {
    id: "kontext",
    label: "Kontext",
    description: "Чистый фон под товар, техника и индустрия",
  },
];

export const RENDER_MODEL_IDS = ["flux", "kontext", "gptimage", "seedream"] as const;

export function isRenderModelId(value: string): value is RenderModelId {
  return (RENDER_MODEL_IDS as readonly string[]).includes(value);
}
