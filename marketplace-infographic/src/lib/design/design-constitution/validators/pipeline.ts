import type { SceneBlueprint } from "@/lib/design/scene-blueprint";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { PromptCompilerResult } from "@/lib/design/prompt-compiler";
import type { CompositionLayout } from "@/lib/composition/types";
import type { CardMeaning } from "@/lib/layout-engine/types";
import type { ProductAnalysis } from "@/lib/product-analysis";
import {
  validateConstitution,
  revalidateAfterPatch,
} from "../validators/engine";
import type { ConstitutionValidationResult } from "../types";
import {
  applyConstitutionLayoutPatch,
  applySceneBlueprintPatch,
} from "../patches/engine";
import type { ConstitutionContext, ConstitutionReport, ConstitutionSetId } from "../types";
import { CONSTITUTION_PASS_THRESHOLD, MAX_CONSTITUTION_ATTEMPTS } from "../types";
import { resolveConstitutionSet } from "../versions";

export function buildConstitutionContext(
  stage: ConstitutionContext["stage"],
  input: {
    constitutionId?: ConstitutionSetId;
    analysis?: ProductAnalysis;
    sceneBlueprint?: SceneBlueprint;
    layoutSpec?: LayoutSpec;
    prompt?: string;
    promptResult?: PromptCompilerResult;
    layout?: CompositionLayout;
    meaning?: CardMeaning;
    luxuryScore?: number;
    compositionScore?: number;
    sceneScore?: number;
  },
): ConstitutionContext {
  return {
    stage,
    constitutionId:
      input.constitutionId ??
      resolveConstitutionSet({
        category: input.analysis?.category,
        priceSegment: input.analysis?.priceSegment,
      }),
    analysis: input.analysis,
    sceneBlueprint: input.sceneBlueprint,
    layoutSpec: input.layoutSpec,
    prompt: input.prompt,
    promptMetadata: input.promptResult?.metadata,
    layout: input.layout,
    meaning: input.meaning,
    luxuryScore: input.luxuryScore,
    compositionScore: input.compositionScore,
    sceneScore: input.sceneScore,
  };
}

/** Validate + auto-correct loop for a pipeline stage */
export function validateWithCorrection(input: {
  ctx: ConstitutionContext;
  layoutSpec?: LayoutSpec;
  sceneBlueprint?: SceneBlueprint;
}): {
  validation: ConstitutionValidationResult;
  layoutSpec?: LayoutSpec;
  sceneBlueprint?: SceneBlueprint;
  report: ConstitutionReport;
} {
  let layoutSpec = input.layoutSpec ?? input.ctx.layoutSpec;
  let sceneBlueprint = input.sceneBlueprint ?? input.ctx.sceneBlueprint;
  let validation = validateConstitution({
    ...input.ctx,
    layoutSpec,
    sceneBlueprint,
  });
  let report = validation.report;

  for (let attempt = 1; attempt < MAX_CONSTITUTION_ATTEMPTS; attempt++) {
    if (validation.passed && report.overallDesignScore >= CONSTITUTION_PASS_THRESHOLD) break;

    const patch = validation.combinedPatch;
    if (patch.layoutSpecPatch && layoutSpec) {
      layoutSpec = applyConstitutionLayoutPatch(layoutSpec, patch.layoutSpecPatch);
    }
    if (patch.sceneBlueprintPatch && sceneBlueprint) {
      sceneBlueprint = applySceneBlueprintPatch(sceneBlueprint, patch.sceneBlueprintPatch);
    }
    if (!patch.layoutSpecPatch && !patch.sceneBlueprintPatch) break;

    validation = revalidateAfterPatch(
      { ...input.ctx, layoutSpec, sceneBlueprint },
      report,
    );
    report = validation.report;
  }

  return { validation, layoutSpec, sceneBlueprint, report };
}
