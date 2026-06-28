import type { RenderModelId } from "./types";

export type RenderModelChoice = "auto" | RenderModelId;

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
    description: "Премиум-редакционный стиль, luxury и beauty",
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
