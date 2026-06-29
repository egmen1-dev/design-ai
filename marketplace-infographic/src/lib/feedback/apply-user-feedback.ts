import { prisma } from "@/lib/prisma";
import { runDesignMemory, computeOutcomeScore } from "@/lib/agents";
import {
  buildPatternKey,
  buildPatternSnapshot,
  evolveUserFeedback,
  resolveKnowledgeCategory,
} from "@/lib/design/knowledge-engine";
import { recordAssetSuccess } from "@/lib/design/design-assets-intelligence";
import { evolveGenomeWeight, outcomeFromFeedback } from "@/lib/design/design-genome";
import { unpackSdPayload } from "@/lib/sd-stored-payload";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { ProductCategory } from "@/lib/product-analysis";
import type { LayoutTemplateId } from "@/lib/layout-engine/types";
import type { InfographicSdInput } from "@/lib/validations";
import type {
  ApplyUserFeedbackResult,
  FeedbackLearningSnapshot,
  UserFeedbackValue,
} from "./types";

function feedbackToUserLiked(feedback: UserFeedbackValue): boolean {
  return feedback === "like";
}

async function patternKeyFromHistory(
  historyId: string,
  productCategory: ProductCategory,
  prompt: string,
): Promise<string | null> {
  const history = await prisma.generationHistory.findUnique({ where: { id: historyId } });
  if (!history) return null;

  const category = resolveKnowledgeCategory(prompt, productCategory);
  const layoutEngine = history.layoutEngine as {
    layout?: {
      scenarioId?: string;
      metrics?: { productAreaPct?: number; textAreaPct?: number; whitespacePct?: number };
    };
  } | null;
  const scenePlan = history.scenePlanner as ScenePlan | undefined;
  const ollama = history.ollamaJson as InfographicSdInput | null;

  const snapshot = buildPatternSnapshot({
    category,
    layoutTemplate: layoutEngine?.layout?.scenarioId ?? "hero_left",
    compositionType: scenePlan?.compositionScenario ?? "hero_product",
    scenePlan,
    fontFamily: history.font ?? ollama?.fontId ?? "default",
    badgeStyle: history.badge ?? ollama?.badgeId ?? "none",
    productScale: (layoutEngine?.layout?.metrics?.productAreaPct ?? 66) / 100,
    textDensity: layoutEngine?.layout?.metrics?.textAreaPct
      ? layoutEngine.layout.metrics.textAreaPct / 100
      : 0.28,
    negativeSpace: layoutEngine?.layout?.metrics?.whitespacePct
      ? layoutEngine.layout.metrics.whitespacePct / 100
      : 0.25,
    primaryColor: ollama?.colors?.[0] ?? "#1a1a2e",
    secondaryColor: ollama?.colors?.[1] ?? "#f97316",
  });

  return buildPatternKey(snapshot);
}

function loadFeedbackSnapshot(image: {
  prompt: string;
  generatedJson: string | null;
}): FeedbackLearningSnapshot | null {
  if (!image.generatedJson) return null;
  try {
    const stored = unpackSdPayload(image.generatedJson);
    if (stored.feedbackLearning?.productCategory) return stored.feedbackLearning;
  } catch {
    return null;
  }
  return null;
}

async function resolveProductCategory(
  prompt: string,
  snapshot?: FeedbackLearningSnapshot | null,
): Promise<ProductCategory> {
  if (snapshot?.productCategory) return snapshot.productCategory;
  const analysis = await analyzeProductPrompt(prompt);
  return analysis.category;
}

export async function applyUserFeedback(
  imageId: string,
  userId: string,
  feedback: UserFeedbackValue,
): Promise<ApplyUserFeedbackResult> {
  const image = await prisma.generatedImage.findUnique({ where: { id: imageId } });
  if (!image) throw new Error("NOT_FOUND");
  if (image.userId !== userId) throw new Error("FORBIDDEN");
  if (image.userFeedback === feedback) {
    return {
      imageId,
      feedback,
      designMemoryUpdated: false,
      knowledgePatternUpdated: false,
      assetsUpdated: 0,
    };
  }

  const snapshot = loadFeedbackSnapshot(image);
  const productCategory = await resolveProductCategory(image.prompt, snapshot);
  const userLiked = feedbackToUserLiked(feedback);

  await prisma.generatedImage.update({
    where: { id: imageId },
    data: { userFeedback: feedback, feedbackAt: new Date() },
  });

  await prisma.generationHistory.updateMany({
    where: { generatedImageId: imageId },
    data: { userLiked },
  });

  let designMemoryUpdated = false;
  let knowledgePatternUpdated = false;
  let assetsUpdated = 0;

  if (snapshot) {
    try {
      await runDesignMemory({
        productPrompt: image.prompt,
        category: snapshot.productCategory,
        templateId: snapshot.templateId as LayoutTemplateId | undefined,
        fontId: snapshot.fontId,
        badgeId: snapshot.badgeId,
        scenePlan: snapshot.scenePlan,
        designScore: snapshot.designScore,
        cardMeaning: snapshot.cardMeaning,
        seniorAdReview: snapshot.seniorAdReview,
        ctrReview: snapshot.ctrReview,
        photoReview: snapshot.photoReview,
        chiefPlan: snapshot.chiefPlan,
        parametricBadgeKey: snapshot.parametricBadgeKey,
        parametricBadgeModel: snapshot.parametricBadgeModel,
        userFeedback: feedback,
      });
      designMemoryUpdated = true;
    } catch (error) {
      console.warn("[user-feedback] design memory failed:", error);
    }

    const assetOutcome = computeOutcomeScore({
      productPrompt: image.prompt,
      category: snapshot.productCategory,
      templateId: snapshot.templateId as LayoutTemplateId | undefined,
      fontId: snapshot.fontId,
      badgeId: snapshot.badgeId,
      scenePlan: snapshot.scenePlan,
      designScore: snapshot.designScore,
      cardMeaning: snapshot.cardMeaning,
      seniorAdReview: snapshot.seniorAdReview,
      ctrReview: snapshot.ctrReview,
      photoReview: snapshot.photoReview,
      chiefPlan: snapshot.chiefPlan,
      userFeedback: feedback,
    });

    const assetTasks: Promise<void>[] = [];
    if (snapshot.parametricBadgeKey) {
      assetTasks.push(recordAssetSuccess(snapshot.parametricBadgeKey, "badge", assetOutcome));
      assetsUpdated += 1;
    }
    if (snapshot.recommendedFontFamily) {
      const fontKey = `font_${snapshot.recommendedFontFamily.toLowerCase().replace(/\s+/g, "_")}`;
      assetTasks.push(recordAssetSuccess(fontKey, "font", assetOutcome));
      assetsUpdated += 1;
    }
    if (snapshot.recommendedPaletteKey) {
      const paletteKey = `palette_${snapshot.recommendedPaletteKey.toLowerCase().replace(/\s+/g, "_")}`;
      assetTasks.push(recordAssetSuccess(paletteKey, "palette", assetOutcome));
      assetsUpdated += 1;
    }
    await Promise.all(assetTasks).catch((e) =>
      console.warn("[user-feedback] assets update failed:", e),
    );
  }

  const history =
    snapshot?.generationHistoryId != null
      ? { id: snapshot.generationHistoryId }
      : await prisma.generationHistory.findFirst({
          where: { generatedImageId: imageId },
          orderBy: { createdAt: "desc" },
          select: { id: true },
        });

  if (history?.id) {
    const patternKey = await patternKeyFromHistory(history.id, productCategory, image.prompt);
    if (patternKey) {
      knowledgePatternUpdated = await evolveUserFeedback(patternKey, userLiked);
    }
  }

  if (snapshot?.designGenomeKey) {
    await evolveGenomeWeight(
      snapshot.designGenomeKey,
      outcomeFromFeedback(userLiked),
      userLiked,
    ).catch((e) => console.warn("[user-feedback] genome evolve failed:", e));
  }

  return {
    imageId,
    feedback,
    designMemoryUpdated,
    knowledgePatternUpdated,
    assetsUpdated,
  };
}
