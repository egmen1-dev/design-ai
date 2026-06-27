import type { CoverConceptId } from "@/lib/cover-concepts";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { SceneBlueprint } from "./types";
import { SCENE_TEMPLATES } from "./templates";
import { MATERIAL_PROFILES } from "./materials";

const SURFACE_MAP: Record<string, ScenePlan["surfaceType"]> = {
  graphite: "studio_floor",
  soft_concrete: "matte",
  frosted_acrylic: "glass",
  matte_aluminum: "matte",
  dark_steel: "matte",
  premium_plastic: "matte",
  glass: "glass",
  carbon_fiber: "gloss",
  wood: "fabric",
  stone: "tile",
};

export function blueprintToCoverConcept(blueprint: SceneBlueprint): CoverConceptId {
  return SCENE_TEMPLATES[blueprint.scene.type].coverConceptMap;
}

export function applyBlueprintToScenePlan(
  scene: ScenePlan,
  blueprint: SceneBlueprint,
): ScenePlan {
  const material = MATERIAL_PROFILES[blueprint.scene.material];
  const cameraHeight =
    blueprint.camera.height === "low"
      ? "table-level"
      : blueprint.camera.height === "high"
        ? "elevated"
        : "eye-level";

  const cameraDistance =
    blueprint.camera.distance === "close"
      ? "close-up"
      : blueprint.camera.distance === "wide"
        ? "wide-medium"
        : "medium-close";

  const depthOfField =
    blueprint.scene.depth === "shallow"
      ? "very shallow, creamy bokeh"
      : blueprint.scene.depth === "deep"
        ? "moderate, environmental blur"
        : "shallow studio bokeh";

  return {
    ...scene,
    coverConceptId: blueprintToCoverConcept(blueprint),
    cameraAngle: blueprint.camera.angle,
    cameraHeight,
    cameraDistance,
    lightingDirection: blueprint.lighting.key,
    lightingTemperature: `${blueprint.lighting.temperatureK}K`,
    backgroundType: blueprint.scene.environment,
    depthOfField,
    visualMood: blueprint.scene.atmosphere,
    colorHarmony: blueprint.scene.atmosphere.includes("warm")
      ? "warm analogous"
      : "cool complementary commercial",
    surfaceType: SURFACE_MAP[blueprint.scene.material] ?? "studio_floor",
    reflectionEnabled: blueprint.productInteraction.reflections,
    shadowProfile:
      blueprint.shadowStrategy === "ambient"
        ? "ambient"
        : blueprint.shadowStrategy === "directional"
          ? "directional"
          : blueprint.shadowStrategy === "mixed"
            ? "mixed"
            : "contact",
  };
}

export function heroPositionToProductZone(blueprint: SceneBlueprint): Partial<ScenePlan["productSafeZone"]> {
  const pos = blueprint.hero.position;
  let cx: [number, number] = [45, 55];
  if (pos.includes("right")) cx = [52, 62];
  else if (pos.includes("left")) cx = [38, 48];
  const cy: [number, number] = pos.startsWith("bottom") ? [52, 62] : [42, 52];
  const scale = Math.round(blueprint.hero.scale * 100);
  return {
    centerX: cx,
    centerY: cy,
    scale: [scale - 4, scale + 4] as [number, number],
  };
}
