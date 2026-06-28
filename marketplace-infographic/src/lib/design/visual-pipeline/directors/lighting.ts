import type { LightingPresetId } from "@/lib/design/scene-blueprint/types";
import type { DirectorResult, LightingDecision, StoryDecision } from "../types";
import type { SceneEnvironmentDecision } from "../types";
import type { ProductAnalysis } from "@/lib/product-analysis";

const STORY_LIGHTING: Record<StoryDecision["storyType"], LightingPresetId> = {
  industrial_product: "cold_industrial",
  lifestyle: "warm_spotlight",
  workshop: "cold_industrial",
  premium: "luxury_softbox",
  technical: "top_product",
  domestic: "warm_spotlight",
};

const PRESET_DECISION: Record<
  LightingPresetId,
  Omit<LightingDecision, "preset" | "temperatureK">
> = {
  soft_studio: {
    keyLight: "soft",
    fill: "balanced",
    rim: "subtle",
    contrast: "low",
    shadowStyle: "soft",
  },
  luxury_softbox: {
    keyLight: "soft",
    fill: "minimal",
    rim: "subtle",
    contrast: "medium",
    shadowStyle: "soft",
  },
  warm_spotlight: {
    keyLight: "spot",
    fill: "minimal",
    rim: "subtle",
    contrast: "medium",
    shadowStyle: "contact",
  },
  cold_industrial: {
    keyLight: "directional",
    fill: "minimal",
    rim: "subtle",
    contrast: "high",
    shadowStyle: "directional",
  },
  sunset_rim: {
    keyLight: "directional",
    fill: "ambient",
    rim: "strong",
    contrast: "medium",
    shadowStyle: "soft",
  },
  high_contrast_commercial: {
    keyLight: "directional",
    fill: "minimal",
    rim: "strong",
    contrast: "high",
    shadowStyle: "directional",
  },
  top_product: {
    keyLight: "overhead",
    fill: "balanced",
    rim: "subtle",
    contrast: "medium",
    shadowStyle: "contact",
  },
};

const TEMPERATURE: Record<LightingPresetId, number> = {
  soft_studio: 5200,
  luxury_softbox: 4800,
  warm_spotlight: 4200,
  cold_industrial: 6500,
  sunset_rim: 3800,
  high_contrast_commercial: 5600,
  top_product: 5400,
};

export type LightingDirectorInput = {
  analysis: ProductAnalysis;
  story: StoryDecision;
  scene: SceneEnvironmentDecision;
};

export function runLightingDirector(
  input: LightingDirectorInput,
): DirectorResult<LightingDecision> {
  const preset = STORY_LIGHTING[input.story.storyType];
  const base = PRESET_DECISION[preset];
  const decision: LightingDecision = {
    preset,
    ...base,
    temperatureK: TEMPERATURE[preset],
  };
  return {
    decision,
    approved: true,
    score: 84,
    agentSnippet: `Light:${preset} ${decision.keyLight}`,
  };
}
