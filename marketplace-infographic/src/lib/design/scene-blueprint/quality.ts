import type { SceneBlueprint, SceneBlueprintQuality } from "./types";
import { SCENE_QUALITY_PASS_THRESHOLD } from "./types";
import { MATERIAL_PROFILES } from "./materials";

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function scoreSceneBlueprint(blueprint: SceneBlueprint): SceneBlueprintQuality {
  const issues: string[] = [];
  const material = MATERIAL_PROFILES[blueprint.scene.material];

  const sceneQuality = clamp(
    90 -
      (blueprint.decorative.maxDensity > 0.2 ? 25 : 0) -
      (blueprint.scene.visualDensity > 0.18 ? 15 : 0),
  );

  const lightingQuality = clamp(
    88 -
      (blueprint.lighting.fill.includes("high") ? 10 : 0) +
      (blueprint.lighting.preset === "luxury_softbox" ? 8 : 0),
  );

  const depthQuality = clamp(
    blueprint.scene.depth === "medium" ? 85 : blueprint.scene.depth === "deep" ? 80 : 75,
  );

  const environmentQuality = clamp(
    82 +
      (blueprint.productInteraction.groundPlane ? 10 : -15) +
      (blueprint.productInteraction.softShadow ? 6 : -10),
  );
  if (!blueprint.productInteraction.groundPlane) {
    issues.push("Product lacks ground plane — may look floating");
  }

  const luxuryFeeling = clamp(
    blueprint.premiumFeeling -
      (blueprint.accent.particles ? 20 : 0) -
      (blueprint.accent.shapes === "moderate" ? 12 : 0),
  );

  const visualNoise = clamp(
    100 -
      blueprint.decorative.maxDensity * 200 -
      blueprint.accent.maxGradients * 8 -
      (blueprint.accent.particles ? 25 : 0) -
      (blueprint.decorative.backgroundComplexity === "medium" ? 15 : 0),
  );
  if (visualNoise < 70) issues.push("Decorative density too high");

  const sceneCoherence = clamp(
    (sceneQuality + lightingQuality + environmentQuality) / 3 -
      (blueprint.hero.scale < 0.35 || blueprint.hero.scale > 0.65 ? 10 : 0),
  );

  const total = clamp(
    sceneQuality * 0.18 +
      lightingQuality * 0.18 +
      depthQuality * 0.12 +
      environmentQuality * 0.16 +
      luxuryFeeling * 0.16 +
      visualNoise * 0.1 +
      sceneCoherence * 0.1,
  );

  if (total < SCENE_QUALITY_PASS_THRESHOLD) {
    issues.push(`Scene quality ${total} below threshold ${SCENE_QUALITY_PASS_THRESHOLD}`);
  }

  return {
    sceneQuality,
    lightingQuality,
    depthQuality,
    environmentQuality,
    luxuryFeeling,
    visualNoise,
    sceneCoherence,
    total,
    passed: total >= SCENE_QUALITY_PASS_THRESHOLD && issues.length <= 1,
    issues,
  };
}

export function applyQualityPatch(blueprint: SceneBlueprint): SceneBlueprint {
  return {
    ...blueprint,
    decorative: {
      ...blueprint.decorative,
      maxDensity: Math.min(blueprint.decorative.maxDensity, 0.1),
      maxParticles: 0,
      maxShapes: Math.min(blueprint.decorative.maxShapes, 1),
      backgroundComplexity: "minimal",
    },
    accent: {
      glow: false,
      particles: false,
      shapes: "minimal",
      maxGradients: 1,
    },
    productInteraction: {
      ...blueprint.productInteraction,
      groundPlane: true,
      softShadow: true,
      ambientOcclusion: true,
    },
    scene: {
      ...blueprint.scene,
      visualDensity: Math.min(blueprint.scene.visualDensity, 0.1),
      depth: "medium",
    },
    premiumFeeling: Math.min(95, blueprint.premiumFeeling + 4),
  };
}
