import type { ProductAnalysis } from "@/lib/product-analysis";
import type { CoverConceptId } from "@/lib/cover-concepts";
import type { LayoutSpec } from "@/lib/design/layout-spec/types";
import type { SceneTypeId } from "@/lib/design/scene-blueprint/types";
import {
  assembleVisualSceneBlueprint,
  visualBlueprintToSceneBlueprint,
} from "./assemble";
import { runStoryDirector } from "./directors/story";
import { runSceneEnvironmentDirector } from "./directors/scene";
import { runLightingDirector } from "./directors/lighting";
import { runCameraDirector } from "./directors/camera";
import { runMaterialDirector } from "./directors/material";
import { runCompositionDecisionDirector } from "./directors/composition";
import type { VisualSceneBlueprint } from "./types";
import type { SceneBlueprint } from "@/lib/design/scene-blueprint/types";

export type VisualPipelineResult = {
  visualBlueprint: VisualSceneBlueprint;
  sceneBlueprint: SceneBlueprint;
  snippets: string[];
};

export type RunVisualPipelineInput = {
  prompt: string;
  analysis: ProductAnalysis;
  layoutSpec?: LayoutSpec;
  palette?: string[];
  sceneTypeHint?: SceneTypeId;
  coverConceptId?: CoverConceptId;
};

/**
 * Orchestrates all visual directors → VisualSceneBlueprint v2 → SceneBlueprint v1.
 * Agents never emit prompt text.
 */
export function runVisualPipeline(input: RunVisualPipelineInput): VisualPipelineResult {
  const story = runStoryDirector({ prompt: input.prompt, analysis: input.analysis });
  const scene = runSceneEnvironmentDirector({
    analysis: input.analysis,
    story: story.decision,
    sceneTypeHint: input.sceneTypeHint,
    coverConceptId: input.coverConceptId,
  });
  const lighting = runLightingDirector({
    analysis: input.analysis,
    story: story.decision,
    scene: scene.decision,
  });
  const camera = runCameraDirector({
    analysis: input.analysis,
    story: story.decision,
    scene: scene.decision,
  });
  const materials = runMaterialDirector({
    story: story.decision,
    scene: scene.decision,
  });
  const composition = runCompositionDecisionDirector({
    layoutSpec: input.layoutSpec,
  });

  const visualBlueprint = assembleVisualSceneBlueprint({
    category: input.analysis.category,
    story: story.decision,
    scene: scene.decision,
    lighting: lighting.decision,
    camera: camera.decision,
    materials: materials.decision,
    composition: composition.decision,
    palette: input.palette,
  });

  return {
    visualBlueprint,
    sceneBlueprint: visualBlueprintToSceneBlueprint(visualBlueprint),
    snippets: [
      story.agentSnippet,
      scene.agentSnippet,
      lighting.agentSnippet,
      camera.agentSnippet,
      materials.agentSnippet,
      composition.agentSnippet,
    ],
  };
}

export {
  runStoryDirector,
  runSceneEnvironmentDirector,
  runLightingDirector,
  runCameraDirector,
  runMaterialDirector,
  runCompositionDecisionDirector,
};
export type { VisualSceneBlueprint } from "./types";
