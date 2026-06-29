/**
 * Chapter 3.11 — Render Intent extraction (no prompt in blueprint)
 */
import type { RenderBlueprint } from "./types";
import type { RenderIntent } from "./render-pipeline-types";

export function extractRenderIntent(blueprint: Readonly<RenderBlueprint>): RenderIntent {
  return {
    scene: { ...blueprint.scene },
    camera: { ...blueprint.camera },
    lighting: { ...blueprint.lighting },
    composition: { ...blueprint.composition },
    materials: { ...blueprint.materials },
    mood: blueprint.photography.visualMood,
    background: { ...blueprint.background },
    constraints: { ...blueprint.constraints },
    photography: { ...blueprint.photography },
  };
}
