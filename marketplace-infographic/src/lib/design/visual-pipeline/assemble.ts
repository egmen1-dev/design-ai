import type { SceneBlueprint } from "@/lib/design/scene-blueprint/types";
import { resolveLighting } from "@/lib/design/scene-blueprint/lighting";
import { MATERIAL_PROFILES } from "@/lib/design/scene-blueprint/materials";
import {
  ARCHITECTURE_VISUAL,
  DEPTH_VISUAL,
  TIME_VISUAL,
  WEATHER_VISUAL,
} from "./catalogs/environment";
import type {
  CameraDecision,
  CompositionDecision,
  LightingDecision,
  MaterialDecision,
  SceneEnvironmentDecision,
  StoryDecision,
  VisualNegativeBlock,
  VisualSceneBlueprint,
} from "./types";
import type { ProductCategory } from "@/lib/product-analysis";

const BASE_NEGATIVE: VisualNegativeBlock["terms"] = [
  "text",
  "logo",
  "watermark",
  "people",
  "duplicate objects",
  "clutter",
  "distortion",
  "low quality",
  "product",
  "equipment",
  "fully blurred background",
  "gaussian blur everywhere",
];

function cameraAngleToLegacy(angle: CameraDecision["angle"]): string {
  const map: Record<CameraDecision["angle"], string> = {
    eye_level: "eye level commercial",
    low_hero: "low hero angle",
    three_quarter: "three-quarter commercial hero",
    top_down: "overhead product view",
  };
  return map[angle];
}

/** Merge director decisions into unified VisualSceneBlueprint v2 */
export function assembleVisualSceneBlueprint(input: {
  category: ProductCategory;
  story: StoryDecision;
  scene: SceneEnvironmentDecision;
  lighting: LightingDecision;
  camera: CameraDecision;
  materials: MaterialDecision;
  composition: CompositionDecision;
  palette?: string[];
}): VisualSceneBlueprint {
  return {
    version: "2.0",
    category: input.category,
    story: input.story,
    scene: input.scene,
    lighting: input.lighting,
    camera: input.camera,
    materials: input.materials,
    mood: input.story.targetEmotion,
    palette: (input.palette ?? []).slice(0, 4),
    composition: input.composition,
    negative: { terms: [...BASE_NEGATIVE] },
    constraints: {
      noProduct: true,
      noText: true,
      noLogos: true,
      noPeople: true,
      backdropOnly: true,
    },
  };
}

/** Backward-compatible SceneBlueprint v1 for constitution / scene planner */
export function visualBlueprintToSceneBlueprint(v: VisualSceneBlueprint): SceneBlueprint {
  const lightingResolved = resolveLighting(v.lighting.preset);
  const floorProfile = MATERIAL_PROFILES[v.materials.floor];
  const envPhrase = ARCHITECTURE_VISUAL[v.scene.architecture];

  return {
    version: "1.0",
    scene: {
      type: v.scene.sceneType,
      environment: envPhrase,
      floor: floorProfile.floor,
      background: ARCHITECTURE_VISUAL[v.scene.architecture],
      depth: v.scene.depth,
      atmosphere: `${WEATHER_VISUAL[v.scene.weather]}, ${TIME_VISUAL[v.scene.time]}`,
      material: v.materials.surface,
      visualDensity: v.scene.visualDensity,
    },
    lighting: lightingResolved,
    hero: {
      position: v.composition.heroPosition,
      rotationDeg: -4,
      scale: Math.min(0.65, Math.max(0.4, v.composition.visualWeight.hero / 100)),
      anchor: "ground",
    },
    headline: {
      position: v.composition.negativeSpace === "right" ? "top-right" : "top-left",
      widthRatio: 0.34,
    },
    accent: {
      glow: false,
      particles: false,
      shapes: "minimal",
      maxGradients: 1,
    },
    camera: {
      lensMm: v.camera.lensMm,
      height: v.camera.angle === "low_hero" ? "low" : "eye level",
      distance: v.camera.distance,
      angle: cameraAngleToLegacy(v.camera.angle),
    },
    productInteraction: {
      groundPlane: true,
      softShadow: true,
      ambientOcclusion: true,
      backgroundInteraction: "subtle",
      lightWrapping: true,
      reflections: v.materials.reflection !== "none",
      edgeHighlights: true,
      depthSeparation: DEPTH_VISUAL[v.scene.depth].includes("deep") ? "high" : "medium",
    },
    decorative: {
      maxDensity: v.scene.visualDensity,
      maxParticles: 0,
      maxShapes: 1,
      maxGradients: 1,
      backgroundComplexity: "minimal",
      whitespaceDominates: true,
    },
    premiumFeeling: v.story.storyType === "premium" ? 92 : 80,
    shadowStrategy:
      v.lighting.shadowStyle === "soft"
        ? "ambient"
        : v.lighting.shadowStyle === "contact"
          ? "contact-soft"
          : "directional",
  };
}
