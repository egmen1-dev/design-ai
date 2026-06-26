import { prisma } from "@/lib/prisma";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { InfographicSdInput } from "@/lib/validations";
import type { SeniorArtDirectorReview } from "@/lib/agents/senior-art-director/types";
import type { MarketplaceCtrReview } from "@/lib/agents/marketplace-ctr-expert/types";
import type { CommercialPhotographerReview } from "@/lib/agents/commercial-photographer/types";
import type { CompositionResult } from "@/lib/design/types";
import type { ProductCategory } from "@/lib/product-analysis";
import {
  buildPatternSnapshot,
  resolveKnowledgeCategory,
} from "./category";
import { evolveFromSnapshot } from "./evolution-engine";
import { trackRecentUsage } from "./diversity-manager";
import { runPatternAnalysisIfDue } from "./pattern-analyzer";
import type { KnowledgeCategory } from "./types";

export type PatternCollectorInput = {
  prompt: string;
  productCategory: ProductCategory;
  sdData: InfographicSdInput;
  scenePlan?: ScenePlan;
  compositionResult?: CompositionResult | null;
  fontName?: string | null;
  badgeName?: string | null;
  imagePath?: string;
  generatedImageId?: string;
  seniorAdReview?: SeniorArtDirectorReview;
  ctrReview?: MarketplaceCtrReview;
  photoReview?: CommercialPhotographerReview;
  userLiked?: boolean | null;
};

export type PatternCollectorResult = {
  category: KnowledgeCategory;
  historyId: string;
  analysisTriggered: boolean;
};

export async function collectGenerationPattern(
  input: PatternCollectorInput,
): Promise<PatternCollectorResult> {
  const category = resolveKnowledgeCategory(input.prompt, input.productCategory);
  const layout = input.compositionResult?.layout;

  const snapshot = buildPatternSnapshot({
    category,
    layoutTemplate: layout?.scenarioId ?? "hero_left",
    compositionType: input.scenePlan?.compositionScenario ?? "hero_product",
    scenePlan: input.scenePlan,
    fontFamily: input.fontName ?? input.sdData.fontId ?? "default",
    badgeStyle: input.badgeName ?? input.sdData.badgeId ?? "none",
    productScale: (layout?.metrics?.productAreaPct ?? 66) / 100,
    textDensity: layout?.metrics?.textAreaPct
      ? layout.metrics.textAreaPct / 100
      : 0.28,
    negativeSpace: layout?.metrics?.whitespacePct
      ? layout.metrics.whitespacePct / 100
      : 0.25,
    primaryColor: input.sdData.colors?.[0] ?? "#1a1a2e",
    secondaryColor: input.sdData.colors?.[1] ?? "#f97316",
  });

  const scores = {
    designScore: input.compositionResult?.score?.total,
    artDirectorScore: input.seniorAdReview?.score,
    marketplaceScore: input.ctrReview?.score,
    photographerScore: input.photoReview?.score,
    ctrPrediction: input.ctrReview?.ctrPrediction,
    userLiked: input.userLiked,
  };

  const history = await prisma.generationHistory.create({
    data: {
      category,
      prompt: input.prompt,
      ollamaJson: input.sdData as object,
      scenePlanner: input.scenePlan ? (input.scenePlan as object) : undefined,
      layoutEngine: input.compositionResult
        ? ({
            layout: input.compositionResult.layout,
            score: input.compositionResult.score,
            scenarioId: input.compositionResult.scenarioId,
          } as object)
        : undefined,
      font: input.fontName ?? input.sdData.fontId ?? null,
      badge: input.badgeName ?? input.sdData.badgeId ?? null,
      backgroundPrompt: input.sdData.backgroundPrompt ?? null,
      designScore: scores.designScore ?? null,
      artDirectorScore: scores.artDirectorScore ?? null,
      marketplaceScore: scores.marketplaceScore ?? null,
      photographerScore: scores.photographerScore ?? null,
      userLiked: input.userLiked ?? null,
      generatedImage: input.imagePath ?? null,
      generatedImageId: input.generatedImageId ?? null,
    },
  });

  await evolveFromSnapshot(snapshot, scores);
  trackRecentUsage(category, snapshot);

  const analysisTriggered = await runPatternAnalysisIfDue();

  return { category, historyId: history.id, analysisTriggered };
}
