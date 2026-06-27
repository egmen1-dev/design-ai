import type { CompositionLayout } from "@/lib/composition/types";
import type { CardMeaning, LayoutTemplateId } from "@/lib/layout-engine/types";
import type { CompositionResult } from "@/lib/design/types";
import type { ArtDirectorReview } from "@/lib/agents/art-director/types";
import type { SeniorArtDirectorReview } from "@/lib/agents/senior-art-director/types";
import type { MarketplaceCtrReview } from "@/lib/agents/marketplace-ctr-expert/types";
import {
  applyLayoutSpecPatch,
  layoutSpecFromComposition,
  mergeLayoutSpecPatches,
  type LayoutSpec,
  type LayoutSpecPatch,
} from "@/lib/design/layout-spec";
import { patchesFromCorrections } from "./critic-corrections";
import { computeLuxuryScore, LUXURY_PASS_THRESHOLD } from "./luxury-score";
import { validateEyeFlow } from "./eye-flow";
import { analyzeVisualNoise } from "./visual-noise";

export type QualityGateResult = {
  luxuryScore: ReturnType<typeof computeLuxuryScore>;
  eyeFlow: ReturnType<typeof validateEyeFlow>;
  visualNoise: ReturnType<typeof analyzeVisualNoise>;
  passed: boolean;
  combinedPatch: LayoutSpecPatch;
};

export type RefinementPassResult = {
  compositionResult: CompositionResult;
  cardMeaning: CardMeaning;
  templateId: LayoutTemplateId;
  headlineFontPx: number;
  layoutSpec: LayoutSpec;
  qualityGate: QualityGateResult;
  seniorAdReview: SeniorArtDirectorReview;
  ctrReview: MarketplaceCtrReview;
  artDirectorReview: ArtDirectorReview;
  passIndex: number;
};

export function runQualityGate(input: {
  layout: CompositionLayout;
  meaning: CardMeaning;
  layoutSpec: LayoutSpec;
  seniorAd: SeniorArtDirectorReview;
  ctr: MarketplaceCtrReview;
  artDirector: ArtDirectorReview;
  decorationCount?: number;
}): QualityGateResult {
  const luxuryScore = computeLuxuryScore({
    layout: input.layout,
    meaning: input.meaning,
    layoutSpec: input.layoutSpec,
  });

  const eyeFlow = validateEyeFlow({
    layout: input.layout,
    layoutSpec: input.layoutSpec,
    hasBenefits: !!input.meaning.feature,
    hasCta: !!input.meaning.badge,
  });

  const visualNoise = analyzeVisualNoise({
    layout: input.layout,
    meaning: input.meaning,
    layoutSpec: input.layoutSpec,
    decorationCount: input.decorationCount,
  });

  const criticPatches = mergeLayoutSpecPatches(
    input.seniorAd.layoutSpecPatch ?? {},
    input.ctr.layoutSpecPatch ?? {},
    input.artDirector.layoutSpecPatch ?? {},
    patchesFromCorrections([
      ...(input.seniorAd.corrections ?? []),
      ...(input.ctr.corrections ?? []),
      ...(input.artDirector.corrections ?? []),
    ]),
  );

  if (!luxuryScore.passed) {
    criticPatches.heroScaleDelta = (criticPatches.heroScaleDelta ?? 0) + 0.08;
    criticPatches.whitespaceTarget = Math.max(criticPatches.whitespaceTarget ?? 0, 28);
  }
  if (!eyeFlow.passed) {
    criticPatches.headlineContrastBoost = Math.max(criticPatches.headlineContrastBoost ?? 0, 0.12);
  }
  if (!visualNoise.passed) {
    criticPatches.removeDecorations = true;
    criticPatches.reduceObjectCount = (criticPatches.reduceObjectCount ?? 0) + 1;
  }

  const agentsOk =
    input.seniorAd.approved && input.ctr.wouldClick && input.artDirector.approved;

  const passed =
    agentsOk &&
    luxuryScore.passed &&
    eyeFlow.passed &&
    visualNoise.passed;

  return {
    luxuryScore,
    eyeFlow,
    visualNoise,
    passed,
    combinedPatch: criticPatches,
  };
}

export function syncLayoutSpecFromLayout(
  spec: LayoutSpec,
  layout: CompositionLayout,
  meaning: CardMeaning,
): LayoutSpec {
  return layoutSpecFromComposition(layout, meaning, spec.palette);
}

export function applyRefinementPatch(spec: LayoutSpec, patch: LayoutSpecPatch): LayoutSpec {
  return applyLayoutSpecPatch(spec, patch);
}

export { LUXURY_PASS_THRESHOLD };
