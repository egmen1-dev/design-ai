import type { MaterialId } from "@/lib/design/scene-blueprint/types";
import { SCENE_TEMPLATES } from "@/lib/design/scene-blueprint/templates";
import type { DirectorResult, MaterialDecision, StoryDecision } from "../types";
import type { SceneEnvironmentDecision } from "../types";

export type MaterialDirectorInput = {
  story: StoryDecision;
  scene: SceneEnvironmentDecision;
};

const REFLECTION_MAP: Record<MaterialId, MaterialDecision["reflection"]> = {
  graphite: "subtle",
  soft_concrete: "subtle",
  frosted_acrylic: "moderate",
  matte_aluminum: "subtle",
  dark_steel: "moderate",
  premium_plastic: "subtle",
  glass: "glossy",
  carbon_fiber: "subtle",
  wood: "subtle",
  stone: "subtle",
};

const TEXTURE_MAP: Record<MaterialId, MaterialDecision["texture"]> = {
  graphite: "matte",
  soft_concrete: "concrete",
  frosted_acrylic: "glossy",
  matte_aluminum: "brushed",
  dark_steel: "brushed",
  premium_plastic: "matte",
  glass: "glossy",
  carbon_fiber: "matte",
  wood: "brushed",
  stone: "concrete",
};

export function runMaterialDirector(
  input: MaterialDirectorInput,
): DirectorResult<MaterialDecision> {
  const template = SCENE_TEMPLATES[input.scene.sceneType];
  const material = template.material;

  const decision: MaterialDecision = {
    floor: material,
    background: material,
    surface: material,
    reflection: REFLECTION_MAP[material],
    texture: TEXTURE_MAP[material],
  };

  return {
    decision,
    approved: true,
    score: 81,
    agentSnippet: `Mat:${material}`,
  };
}
