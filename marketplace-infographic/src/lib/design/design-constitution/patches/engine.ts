import type { SceneBlueprint } from "@/lib/design/scene-blueprint";
import type { LayoutSpec, LayoutSpecPatch } from "@/lib/design/layout-spec";
import { applyLayoutSpecPatch } from "@/lib/design/layout-spec";
import type { ConstitutionPatch, SceneBlueprintPatch } from "../types";

export function mergeConstitutionPatches(patches: ConstitutionPatch[]): ConstitutionPatch {
  const sorted = [...patches].sort((a, b) => b.priority - a.priority);
  const layoutSpecPatch: LayoutSpecPatch = {};
  const sceneBlueprintPatch: SceneBlueprintPatch = {};
  let promptRecompile = false;
  let priority = 0;

  for (const p of sorted) {
    priority = Math.max(priority, p.priority);
    if (p.layoutSpecPatch) Object.assign(layoutSpecPatch, p.layoutSpecPatch);
    if (p.sceneBlueprintPatch) Object.assign(sceneBlueprintPatch, p.sceneBlueprintPatch);
    if (p.promptRecompile) promptRecompile = true;
  }

  return {
    layoutSpecPatch: Object.keys(layoutSpecPatch).length ? layoutSpecPatch : undefined,
    sceneBlueprintPatch: Object.keys(sceneBlueprintPatch).length ? sceneBlueprintPatch : undefined,
    promptRecompile,
    priority,
  };
}

export function applySceneBlueprintPatch(
  blueprint: SceneBlueprint,
  patch: SceneBlueprintPatch,
): SceneBlueprint {
  let next = { ...blueprint };

  if (patch.enforceGroundPlane) {
    next = {
      ...next,
      productInteraction: {
        ...next.productInteraction,
        groundPlane: true,
        softShadow: true,
        ambientOcclusion: true,
      },
    };
  }

  if (patch.disableParticles || patch.reduceDecorativeDensity != null) {
    next = {
      ...next,
      accent: {
        ...next.accent,
        particles: patch.disableParticles ? false : next.accent.particles,
        shapes: "minimal",
        maxGradients: Math.min(next.accent.maxGradients, 1),
      },
      decorative: {
        ...next.decorative,
        maxParticles: patch.disableParticles ? 0 : next.decorative.maxParticles,
        maxDensity:
          patch.reduceDecorativeDensity != null
            ? Math.max(0.05, next.decorative.maxDensity - patch.reduceDecorativeDensity)
            : next.decorative.maxDensity,
        maxShapes: Math.min(next.decorative.maxShapes, 1),
        backgroundComplexity: patch.reduceBackgroundComplexity
          ? "minimal"
          : next.decorative.backgroundComplexity,
      },
      scene: {
        ...next.scene,
        visualDensity: Math.min(next.scene.visualDensity, 0.12),
      },
    };
  }

  if (patch.capLightSources === 2) {
    next = {
      ...next,
      lighting: {
        ...next.lighting,
        rim: "subtle",
        back: "none",
        fill: next.lighting.fill.includes("ambient") ? next.lighting.fill : "soft ambient",
      },
    };
  }

  return next;
}

export function applyConstitutionLayoutPatch(
  spec: LayoutSpec,
  patch?: LayoutSpecPatch,
): LayoutSpec {
  if (!patch) return spec;
  return applyLayoutSpecPatch(spec, patch);
}
