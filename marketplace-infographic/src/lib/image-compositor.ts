import type { CompositionLayout } from "@/lib/composition/types";
import type { CompositingHints } from "@/lib/design-brief/schema";
import type { ScenePlan } from "@/lib/design/scene-planner";
import {
  compositeProductIntoScene,
  mergedToDataUrl,
  softenBackgroundCenter,
} from "@/lib/compositing/scene-compositor";

export type MergeOptions = {
  reflection?: boolean;
  layout?: "center" | "marketplace";
  compositingHints?: CompositingHints;
  compositionLayout?: CompositionLayout;
  scene?: ScenePlan;
};

/** Объединяет фон и товар — обёртка над scene-compositor */
export async function mergeProductWithBackground(
  backgroundUrl: string,
  productUrl: string,
  options?: MergeOptions,
): Promise<string> {
  const scene: ScenePlan =
    options?.scene ??
    ({
      cameraAngle: "three-quarter",
      cameraHeight: "table-level",
      cameraDistance: "medium-close",
      lightingDirection: options?.compositingHints?.lightDirection ?? "top-left",
      lightingTemperature: `${options?.compositingHints?.lightTemperature ?? 5500}K`,
      backgroundType: "studio",
      depthOfField: "shallow",
      textSafeZones: [],
      productSafeZone: {
        centerX: [48, 58],
        centerY: [48, 56],
        widthPct: [54, 68],
        heightPct: [55, 68],
        scale: [58, 72],
      },
      horizon: "studio infinity",
      visualMood: "commercial",
      colorHarmony: "balanced",
      compositionScenario: "commercial_studio",
      surfaceType: "studio_floor",
      reflectionEnabled: options?.reflection ?? options?.compositingHints?.reflection ?? false,
      shadowProfile: "mixed",
      cardStyle: "mid",
      coverConceptId: "commercial_studio",
      seed: "legacy",
    } as ScenePlan);

  const result = await compositeProductIntoScene(backgroundUrl, productUrl, {
    layout: options?.layout ?? "marketplace",
    scene,
    compositionLayout: options?.compositionLayout,
    objectScale: options?.compositingHints?.objectScale,
  });

  return result.mergedPath;
}

export { mergedToDataUrl, softenBackgroundCenter };
