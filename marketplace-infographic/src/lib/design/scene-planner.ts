import type { CoverConceptId } from "@/lib/cover-concepts";
import { resolveCoverConcept } from "@/lib/cover-concepts";
import type { VisualHook } from "@/lib/design-process/types";
import type { InfographicStyle } from "@/lib/design-trends";
import {
  analyzeProductPrompt,
  type ProductAnalysis,
  type ProductCategory,
} from "@/lib/product-analysis";
import type { CompositionScenarioId } from "./types";
import { createSeededRng, pickRange } from "./variability";

export type ProductOrientation = "portrait" | "landscape" | "square";
export type ProductShape = "tall" | "wide" | "compact" | "standard";
export type SurfaceType =
  | "studio_floor"
  | "glass"
  | "tile"
  | "water"
  | "gloss"
  | "grass"
  | "earth"
  | "fabric"
  | "matte";

export type SafeZone = {
  id: string;
  purpose: "headline" | "bullets" | "plaques" | "product";
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ProductSafeZone = {
  centerX: [number, number];
  centerY: [number, number];
  widthPct: [number, number];
  heightPct: [number, number];
  scale: [number, number];
};

export type ScenePlan = {
  cameraAngle: string;
  cameraHeight: string;
  cameraDistance: string;
  lightingDirection: string;
  lightingTemperature: string;
  backgroundType: string;
  depthOfField: string;
  textSafeZones: SafeZone[];
  productSafeZone: ProductSafeZone;
  horizon: string;
  visualMood: string;
  colorHarmony: string;
  compositionScenario: CompositionScenarioId;
  surfaceType: SurfaceType;
  reflectionEnabled: boolean;
  shadowProfile: "contact" | "ambient" | "directional" | "mixed";
  cardStyle: string;
  coverConceptId: CoverConceptId;
  seed: string;
};

export type ProductVisualProfile = {
  orientation: ProductOrientation;
  shape: ProductShape;
  dominantColors: string[];
  aspectRatio: number;
};

export type ScenePlannerInput = {
  prompt: string;
  coverConceptId?: CoverConceptId;
  visualHook?: VisualHook;
  styleHint?: InfographicStyle;
  seed: string;
  productVisual?: ProductVisualProfile;
  sceneNarrative?: string;
  compositionScenarioId?: CompositionScenarioId;
};

const CONCEPT_TO_SCENARIO: Record<CoverConceptId, CompositionScenarioId> = {
  commercial_studio: "commercial_studio",
  outdoor_lifestyle: "lifestyle",
  home_interior: "lifestyle",
  garden_scene: "lifestyle",
  tech_showcase: "tech_showcase",
  premium_minimal: "minimal_premium",
};

const HOOK_SCENARIO_OVERRIDE: Partial<
  Record<VisualHook["type"], CompositionScenarioId>
> = {
  lifestyle_scene: "lifestyle",
  tech_showcase: "tech_showcase",
  luxury_minimal: "minimal_premium",
  dynamic_diagonal: "dynamic_diagonal",
  oversized_product: "hero_product",
  emotional_background: "lifestyle",
};

const CATEGORY_CAMERA: Record<
  ProductCategory,
  Pick<ScenePlan, "cameraAngle" | "cameraHeight" | "cameraDistance">
> = {
  garden_tools: {
    cameraAngle: "three-quarter front-right",
    cameraHeight: "waist-level",
    cameraDistance: "medium-close",
  },
  electronics: {
    cameraAngle: "slight low-angle hero",
    cameraHeight: "table-level",
    cameraDistance: "close-up",
  },
  cosmetics: {
    cameraAngle: "frontal beauty",
    cameraHeight: "eye-level",
    cameraDistance: "intimate close-up",
  },
  fashion: {
    cameraAngle: "three-quarter editorial",
    cameraHeight: "chest-level",
    cameraDistance: "medium",
  },
  home_appliances: {
    cameraAngle: "three-quarter catalog",
    cameraHeight: "counter-level",
    cameraDistance: "medium-wide",
  },
  food: {
    cameraAngle: "overhead slight tilt",
    cameraHeight: "table-level",
    cameraDistance: "close-up",
  },
  sport: {
    cameraAngle: "dynamic three-quarter",
    cameraHeight: "ground-level",
    cameraDistance: "medium",
  },
  kids: {
    cameraAngle: "playful low-angle",
    cameraHeight: "child-eye-level",
    cameraDistance: "medium-close",
  },
  auto: {
    cameraAngle: "low hero angle",
    cameraHeight: "knee-level",
    cameraDistance: "wide-medium",
  },
  premium: {
    cameraAngle: "editorial hero",
    cameraHeight: "eye-level",
    cameraDistance: "medium-close",
  },
  generic: {
    cameraAngle: "three-quarter commercial",
    cameraHeight: "table-level",
    cameraDistance: "medium-close",
  },
};

const CONCEPT_SURFACE: Record<CoverConceptId, SurfaceType> = {
  commercial_studio: "studio_floor",
  outdoor_lifestyle: "grass",
  home_interior: "matte",
  garden_scene: "grass",
  tech_showcase: "gloss",
  premium_minimal: "studio_floor",
};

function inferShape(orientation: ProductOrientation, aspectRatio: number): ProductShape {
  if (orientation === "square" || (aspectRatio > 0.85 && aspectRatio < 1.15)) {
    return "compact";
  }
  if (orientation === "portrait" || aspectRatio < 0.75) return "tall";
  if (orientation === "landscape" || aspectRatio > 1.35) return "wide";
  return "standard";
}

function resolveColorHarmony(analysis: ProductAnalysis, conceptId: CoverConceptId): string {
  if (analysis.priceSegment === "premium") return "analogous muted luxury";
  if (conceptId === "tech_showcase") return "complementary cool-warm contrast";
  if (conceptId === "garden_scene") return "natural greens with warm accents";
  if (conceptId === "home_interior") return "warm neutrals with soft contrast";
  return "triadic commercial balance";
}

function resolveVisualMood(
  analysis: ProductAnalysis,
  conceptId: CoverConceptId,
  hook?: VisualHook,
): string {
  if (hook?.type === "luxury_minimal") return "refined aspirational calm";
  if (hook?.type === "emotional_background") return "warm lifestyle aspiration";
  if (analysis.priceSegment === "premium") return "premium confident";
  if (conceptId === "tech_showcase") return "sleek futuristic";
  if (conceptId === "garden_scene") return "outdoor energetic";
  return "trustworthy commercial";
}

function buildTextSafeZones(
  rng: () => number,
  textSide: "left" | "right",
): SafeZone[] {
  const headline: SafeZone = {
    id: "headline",
    purpose: "headline",
    left: textSide === "left" ? 5 : 38,
    top: 6,
    width: textSide === "left" ? 52 : 55,
    height: 16,
  };
  const bullets: SafeZone = {
    id: "bullets",
    purpose: "bullets",
    left: textSide === "left" ? 5 : 68,
    top: 48,
    width: 28,
    height: 28,
  };
  const plaques: SafeZone = {
    id: "plaques",
    purpose: "plaques",
    left: textSide === "left" ? 5 : 82,
    top: 18,
    width: 14,
    height: 32,
  };
  const jitter = (v: number, spread: number) =>
    Math.round((v + (rng() - 0.5) * spread) * 10) / 10;

  return [headline, bullets, plaques].map((z) => ({
    ...z,
    left: jitter(z.left, 2),
    top: jitter(z.top, 1.5),
  }));
}

function buildProductSafeZone(
  rng: () => number,
  shape: ProductShape,
  textSide: "left" | "right",
): ProductSafeZone {
  const shapeBias =
    shape === "tall"
      ? { w: [52, 62] as [number, number], h: [62, 74] as [number, number] }
      : shape === "wide"
        ? { w: [58, 72] as [number, number], h: [48, 58] as [number, number] }
        : { w: [54, 68] as [number, number], h: [55, 68] as [number, number] };

  const centerX: [number, number] =
    textSide === "left" ? [52, 62] : [38, 52];
  const centerY: [number, number] = [48, 58];

  return {
    centerX: [
      pickRange(rng, centerX[0], centerX[0] + 2),
      pickRange(rng, centerX[1] - 2, centerX[1]),
    ],
    centerY: [
      pickRange(rng, centerY[0], centerY[0] + 2),
      pickRange(rng, centerY[1] - 2, centerY[1]),
    ],
    widthPct: [
      pickRange(rng, shapeBias.w[0], shapeBias.w[0] + 3),
      pickRange(rng, shapeBias.w[1] - 3, shapeBias.w[1]),
    ],
    heightPct: [
      pickRange(rng, shapeBias.h[0], shapeBias.h[0] + 3),
      pickRange(rng, shapeBias.h[1] - 3, shapeBias.h[1]),
    ],
    scale: [58, 72],
  };
}

function surfaceAllowsReflection(surface: SurfaceType): boolean {
  return ["studio_floor", "glass", "tile", "water", "gloss"].includes(surface);
}

/** Анализирует товар и проектирует сцену до генерации фона */
export function planScene(input: ScenePlannerInput): {
  analysis: ProductAnalysis;
  scene: ScenePlan;
  productVisual: ProductVisualProfile;
} {
  const analysis = analyzeProductPrompt(input.prompt);
  const concept = resolveCoverConcept(input.coverConceptId, analysis.category);
  const rng = createSeededRng(`scene:${input.seed}`);

  let productVisual: ProductVisualProfile;
  if (input.productVisual) {
    productVisual = input.productVisual;
  } else {
    const aspectRatio = 1;
    const orientation: ProductOrientation = "square";
    productVisual = {
      orientation,
      shape: inferShape(orientation, aspectRatio),
      dominantColors: ["#f5f5f5", "#333333"],
      aspectRatio,
    };
  }

  const textSide: "left" | "right" =
    analysis.category === "electronics" || rng() > 0.45 ? "left" : "right";

  let compositionScenario =
    input.compositionScenarioId ??
    HOOK_SCENARIO_OVERRIDE[input.visualHook?.type ?? ""] ??
    CONCEPT_TO_SCENARIO[concept.id];

  if (analysis.priceSegment === "premium" && compositionScenario === "lifestyle") {
    compositionScenario = rng() > 0.5 ? "luxury_advertising" : "minimal_premium";
  }

  const camera = CATEGORY_CAMERA[analysis.category];
  const surfaceType = CONCEPT_SURFACE[concept.id];
  const reflectionEnabled =
    concept.reflection && surfaceAllowsReflection(surfaceType);

  const depthOfField =
    concept.id === "premium_minimal"
      ? "very shallow, creamy bokeh"
      : concept.id === "garden_scene" || concept.id === "outdoor_lifestyle"
        ? "moderate, environmental blur"
        : "shallow studio bokeh";

  const scene: ScenePlan = {
    cameraAngle: camera.cameraAngle,
    cameraHeight: camera.cameraHeight,
    cameraDistance: camera.cameraDistance,
    lightingDirection: concept.lightDirection,
    lightingTemperature: concept.lightTemperature,
    backgroundType: concept.label,
    depthOfField,
    textSafeZones: buildTextSafeZones(rng, textSide),
    productSafeZone: buildProductSafeZone(rng, productVisual.shape, textSide),
    horizon:
      concept.id === "garden_scene" || concept.id === "outdoor_lifestyle"
        ? "low horizon, upper third sky"
        : concept.id === "home_interior"
          ? "interior vanishing point mid-frame"
          : "no visible horizon, studio infinity",
    visualMood: resolveVisualMood(analysis, concept.id, input.visualHook),
    colorHarmony: resolveColorHarmony(analysis, concept.id),
    compositionScenario,
    surfaceType,
    reflectionEnabled,
    shadowProfile:
      concept.shadowType.includes("ambient")
        ? "ambient"
        : concept.shadowType.includes("hard")
          ? "contact"
          : "mixed",
    cardStyle: input.styleHint ?? analysis.priceSegment,
    coverConceptId: concept.id,
    seed: input.seed,
  };

  return { analysis, scene, productVisual };
}
