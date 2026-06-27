import type { SceneBlueprint } from "@/lib/design/scene-blueprint";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { PromptCompilerResult } from "@/lib/design/prompt-compiler";
import type { CompositionLayout } from "@/lib/composition/types";
import type { CardMeaning } from "@/lib/layout-engine/types";
import type { ProductAnalysis } from "@/lib/product-analysis";
import { buildConstitutionContext, validateWithCorrection } from "./pipeline";
import type { ConstitutionReport, ConstitutionSetId } from "../types";

type BaseInput = {
  analysis: ProductAnalysis;
  constitutionId?: ConstitutionSetId;
  luxuryScore?: number;
  compositionScore?: number;
  sceneScore?: number;
};

export function validateSceneBlueprint(
  blueprint: SceneBlueprint,
  input: BaseInput,
): ReturnType<typeof validateWithCorrection> {
  return validateWithCorrection({
    ctx: buildConstitutionContext("scene_blueprint", {
      ...input,
      sceneBlueprint: blueprint,
    }),
    sceneBlueprint: blueprint,
  });
}

export function validateLayoutSpec(
  layoutSpec: LayoutSpec,
  input: BaseInput & { sceneBlueprint?: SceneBlueprint },
): ReturnType<typeof validateWithCorrection> {
  return validateWithCorrection({
    ctx: buildConstitutionContext("layout_spec", {
      ...input,
      layoutSpec,
      sceneBlueprint: input.sceneBlueprint,
    }),
    layoutSpec,
    sceneBlueprint: input.sceneBlueprint,
  });
}

export function validateCompiledPromptStage(
  promptResult: PromptCompilerResult,
  input: BaseInput & { layoutSpec?: LayoutSpec },
): ReturnType<typeof validateWithCorrection> {
  return validateWithCorrection({
    ctx: buildConstitutionContext("prompt", {
      ...input,
      prompt: promptResult.prompt,
      promptResult,
      layoutSpec: input.layoutSpec,
    }),
    layoutSpec: input.layoutSpec,
  });
}

export function validateRenderedCritique(input: BaseInput & {
  layoutSpec: LayoutSpec;
  layout: CompositionLayout;
  meaning: CardMeaning;
  sceneBlueprint?: SceneBlueprint;
}): ReturnType<typeof validateWithCorrection> {
  return validateWithCorrection({
    ctx: buildConstitutionContext("rendered_critique", {
      ...input,
      layoutSpec: input.layoutSpec,
      layout: input.layout,
      meaning: input.meaning,
      sceneBlueprint: input.sceneBlueprint,
    }),
    layoutSpec: input.layoutSpec,
    sceneBlueprint: input.sceneBlueprint,
  });
}

export type { ConstitutionReport };
