import type { LightingPresetId, SceneLighting } from "./types";

export const LIGHTING_PRESETS: Record<LightingPresetId, Omit<SceneLighting, "preset">> = {
  soft_studio: {
    key: "soft diffused key from top-left",
    fill: "low neutral fill",
    rim: "subtle cool rim",
    back: "soft gradient backlight",
    temperatureK: 5200,
  },
  luxury_softbox: {
    key: "large softbox key, feathered falloff",
    fill: "very low fill, deep shadows preserved",
    rim: "warm gold rim accent",
    back: "muted cool separation light",
    temperatureK: 4800,
  },
  warm_spotlight: {
    key: "focused warm spotlight",
    fill: "minimal fill",
    rim: "amber edge",
    back: "dark warm gradient",
    temperatureK: 4200,
  },
  cold_industrial: {
    key: "hard cool key from side",
    fill: "low blue fill",
    rim: "steel blue rim",
    back: "cool industrial backlight",
    temperatureK: 6500,
  },
  sunset_rim: {
    key: "warm low sun key",
    fill: "soft orange fill",
    rim: "strong orange rim",
    back: "cool blue sky separation",
    temperatureK: 3800,
  },
  high_contrast_commercial: {
    key: "strong directional key",
    fill: "minimal fill",
    rim: "bright specular rim",
    back: "high contrast backlight",
    temperatureK: 5600,
  },
  top_product: {
    key: "overhead product key",
    fill: "balanced soft fill",
    rim: "subtle side rim",
    back: "clean studio back",
    temperatureK: 5400,
  },
};

export function resolveLighting(preset: LightingPresetId): SceneLighting {
  return { preset, ...LIGHTING_PRESETS[preset] };
}
