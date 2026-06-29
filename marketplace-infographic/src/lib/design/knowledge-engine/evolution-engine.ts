import { prisma } from "@/lib/prisma";
import type { PatternSnapshot } from "./types";
import { buildPatternKey } from "./category";
import { computeSuccessSignal, emaAverage, emaWeight, outcomeToWeight } from "./weight-manager";
import type { EvolutionInput } from "./types";

export async function evolvePattern(input: EvolutionInput): Promise<void> {
  const { outcome, successful } = computeSuccessSignal(input);
  const targetWeight = outcomeToWeight(outcome, 1);

  const existing = await prisma.designPattern.findUnique({
    where: { patternKey: input.patternKey },
  });

  if (!existing) {
    await prisma.designPattern.create({
      data: {
        patternKey: input.patternKey,
        category: input.category,
        layoutTemplate: input.snapshot.layoutTemplate,
        compositionType: input.snapshot.compositionType,
        backgroundType: input.snapshot.backgroundType,
        lightingType: input.snapshot.lightingType,
        fontFamily: input.snapshot.fontFamily,
        badgeStyle: input.snapshot.badgeStyle,
        productScale: input.snapshot.productScale,
        textDensity: input.snapshot.textDensity,
        negativeSpace: input.snapshot.negativeSpace,
        primaryColor: input.snapshot.primaryColor,
        secondaryColor: input.snapshot.secondaryColor,
        designScore: input.designScore ?? 0,
        ctrPrediction: input.ctrPrediction ?? 0,
        likes: input.userLiked === true ? 1 : 0,
        dislikes: input.userLiked === false ? 1 : 0,
        usages: 1,
        successWeight: targetWeight,
      },
    });
    return;
  }

  const nextWeight = emaWeight(
    existing.successWeight,
    successful ? Math.max(targetWeight, existing.successWeight) : Math.min(targetWeight, existing.successWeight),
  );

  await prisma.designPattern.update({
    where: { patternKey: input.patternKey },
    data: {
      usages: { increment: 1 },
      likes: input.userLiked === true ? { increment: 1 } : undefined,
      dislikes: input.userLiked === false ? { increment: 1 } : undefined,
      designScore: emaAverage(existing.designScore, input.designScore ?? existing.designScore),
      ctrPrediction: emaAverage(existing.ctrPrediction, input.ctrPrediction ?? existing.ctrPrediction),
      productScale: emaAverage(existing.productScale, input.snapshot.productScale),
      textDensity: emaAverage(existing.textDensity, input.snapshot.textDensity),
      negativeSpace: emaAverage(existing.negativeSpace, input.snapshot.negativeSpace),
      successWeight: nextWeight,
    },
  });
}

export async function evolveUserFeedback(
  patternKey: string,
  userLiked: boolean,
): Promise<boolean> {
  const existing = await prisma.designPattern.findUnique({
    where: { patternKey },
  });
  if (!existing) return false;

  const target = userLiked
    ? Math.min(2, existing.successWeight + 0.18)
    : Math.max(0.2, existing.successWeight - 0.28);
  const nextWeight = emaWeight(existing.successWeight, target, 0.25);

  await prisma.designPattern.update({
    where: { patternKey },
    data: {
      likes: userLiked ? { increment: 1 } : undefined,
      dislikes: userLiked ? undefined : { increment: 1 },
      successWeight: nextWeight,
    },
  });
  return true;
}

export async function evolveFromSnapshot(
  snapshot: PatternSnapshot,
  scores: {
    designScore?: number;
    artDirectorScore?: number;
    marketplaceScore?: number;
    photographerScore?: number;
    ctrPrediction?: number;
    userLiked?: boolean | null;
  },
): Promise<void> {
  const patternKey = buildPatternKey(snapshot);
  const { successful } = computeSuccessSignal(scores);

  await evolvePattern({
    patternKey,
    category: snapshot.category,
    snapshot,
    successful,
    ...scores,
  });
}
