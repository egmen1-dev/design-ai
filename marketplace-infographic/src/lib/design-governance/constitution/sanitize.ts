import type { SceneBlueprint } from "@/lib/design/scene-blueprint";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import { applySceneBlueprintPatch } from "@/lib/design/design-constitution/patches/engine";
import { applyConstitutionLayoutPatch } from "@/lib/design/design-constitution/patches/engine";

/** Pre-sync blueprint to conservative marketplace-safe defaults before constitution */
export function sanitizeBlueprintForConstitution(input: {
  sceneBlueprint: SceneBlueprint;
  layoutSpec: LayoutSpec;
}): { sceneBlueprint: SceneBlueprint; layoutSpec: LayoutSpec } {
  const sceneBlueprint = applySceneBlueprintPatch(input.sceneBlueprint, {
    enforceGroundPlane: true,
    disableParticles: true,
    reduceDecorativeDensity: 0.04,
    reduceBackgroundComplexity: true,
    capLightSources: 2,
  });

  const layoutSpec = applyConstitutionLayoutPatch(input.layoutSpec, {
    whitespaceTarget: Math.max(input.layoutSpec.whitespaceTarget, 26),
    removeDecorations: true,
    reduceObjectCount: 1,
    heroScaleDelta: input.layoutSpec.heroScale < 0.55 ? 0.05 : undefined,
  });

  return { sceneBlueprint, layoutSpec };
}
