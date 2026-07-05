import type { SceneBlueprint } from "./types";
import { MATERIAL_PROFILES } from "./materials";

/** Compile SD background prompt FROM Scene Blueprint — no invented prose */
export function compileScenePromptFromBlueprint(blueprint: SceneBlueprint): string {
  const m = MATERIAL_PROFILES[blueprint.scene.material];
  const pi = blueprint.productInteraction;
  const d = blueprint.decorative;

  const interaction = [
    pi.groundPlane ? "visible ground plane under product zone" : "",
    pi.softShadow ? "soft contact shadow on surface" : "",
    pi.ambientOcclusion ? "subtle ambient occlusion at base" : "",
    pi.lightWrapping ? "light wrap on product edges" : "",
    pi.edgeHighlights ? "subtle edge highlights" : "",
    pi.depthSeparation === "high" ? "strong depth separation foreground background" : "",
    pi.reflections && m.reflection !== "none" ? `${m.reflection} surface reflections` : "matte surface no mirror reflections",
  ]
    .filter(Boolean)
    .join(", ");

  const decor = [
    `decorative density max ${Math.round(d.maxDensity * 100)}%`,
    d.maxParticles === 0 ? "no particles" : `max ${d.maxParticles} particles`,
    `shapes ${blueprint.accent.shapes}`,
    blueprint.accent.glow ? "subtle glow accent only" : "no glow",
    d.whitespaceDominates ? "whitespace dominates decoration" : "",
    `background complexity ${d.backgroundComplexity}`,
  ]
    .filter(Boolean)
    .join(", ");

  return [
    "ultra realistic commercial product photography background",
    `scene type ${blueprint.scene.type.replace(/_/g, " ")}`,
    `environment ${blueprint.scene.environment}`,
    `floor ${blueprint.scene.floor}`,
    `background ${blueprint.scene.background}`,
    `depth ${blueprint.scene.depth}`,
    `atmosphere ${blueprint.scene.atmosphere}`,
    `material ${m.label} ${m.floor}`,
    `lighting preset ${blueprint.lighting.preset}`,
    `key ${blueprint.lighting.key}`,
    `fill ${blueprint.lighting.fill}`,
    `rim ${blueprint.lighting.rim}`,
    `back ${blueprint.lighting.back}`,
    `${blueprint.lighting.temperatureK}K`,
    `camera ${blueprint.camera.lensMm}mm lens`,
    `${blueprint.camera.height} ${blueprint.camera.distance}`,
    blueprint.camera.angle,
    interaction,
    decor,
    "empty product placement zone for compositing",
    "no text no letters no watermark no logo",
    "no product in scene",
    "8k photorealistic advertising quality",
  ].join(", ");
}

export function compileSceneBlueprintJson(blueprint: SceneBlueprint): string {
  return JSON.stringify(blueprint, null, 2);
}
