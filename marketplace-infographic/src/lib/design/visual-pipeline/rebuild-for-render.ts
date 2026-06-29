import type { SceneBlueprint } from "@/lib/design/scene-blueprint/types";
import type { LayoutSpec } from "@/lib/design/layout-spec/types";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { SceneTypeId } from "@/lib/design/scene-blueprint/types";
import { runVisualPipeline } from "./index";
import { applyScenePlanPatchesToVisualBlueprint } from "./sync-scene-plan";
import type { VisualSceneBlueprint } from "./types";

export type RebuildVisualPipelineInput = {
  prompt: string;
  analysis: ProductAnalysis;
  layoutSpec?: LayoutSpec;
  palette?: string[];
  sceneTypeHint?: SceneTypeId;
  scenePlan: ScenePlan;
  decisionLog?: string[];
};

export type RebuildVisualPipelineResult = {
  visualBlueprint: VisualSceneBlueprint;
  sceneBlueprint: SceneBlueprint;
};

/** Единая точка пересборки visual pipeline перед Pollinations */
export function rebuildVisualPipelineForRender(
  input: RebuildVisualPipelineInput,
): RebuildVisualPipelineResult {
  const pipeline = runVisualPipeline({
    prompt: input.prompt,
    analysis: input.analysis,
    layoutSpec: input.layoutSpec,
    palette: input.palette,
    sceneTypeHint: input.sceneTypeHint,
    coverConceptId: input.scenePlan.coverConceptId,
  });

  const visualBlueprint = applyScenePlanPatchesToVisualBlueprint(
    pipeline.visualBlueprint,
    input.scenePlan,
  );

  input.decisionLog?.push(
    ...pipeline.snippets.map((s) => `VisualPipeline ${s}`),
    `VisualPipeline coverConcept=${input.scenePlan.coverConceptId}`,
  );

  return {
    visualBlueprint,
    sceneBlueprint: pipeline.sceneBlueprint,
  };
}
