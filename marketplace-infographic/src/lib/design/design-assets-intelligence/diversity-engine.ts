import { prisma } from "@/lib/prisma";
import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";
import type {
  FontIntelligenceProfile,
  PaletteModel,
  ParametricBadgeModel,
  ShapeStyleModel,
} from "./types";
import {
  ASSET_DIVERSITY_WINDOW,
  ASSET_OVERUSE_THRESHOLD,
  type AssetUsageRecord,
} from "./types";

const recentUsage: AssetUsageRecord[] = [];

export function trackAssetUsage(
  assetKey: string,
  assetType: AssetUsageRecord["assetType"],
  category: KnowledgeCategory,
): void {
  recentUsage.push({
    assetKey,
    assetType,
    category,
    at: new Date().toISOString(),
  });
  if (recentUsage.length > ASSET_DIVERSITY_WINDOW * 4) {
    recentUsage.splice(0, recentUsage.length - ASSET_DIVERSITY_WINDOW * 4);
  }
}

function overusePenalty(assetKey: string, category: KnowledgeCategory): number {
  const count = recentUsage.filter(
    (u) => u.assetKey === assetKey && u.category === category,
  ).length;
  if (count < ASSET_OVERUSE_THRESHOLD) return 0;
  return (count - ASSET_OVERUSE_THRESHOLD + 1) * 0.12;
}

export function applyDiversityPenalty(
  assetKey: string,
  category: KnowledgeCategory,
  baseScore: number,
): number {
  return Math.max(0.1, baseScore - overusePenalty(assetKey, category));
}

export async function persistCrawledAssets(input: {
  category: KnowledgeCategory;
  badgeModels: Array<{ key: string; model: ParametricBadgeModel }>;
  fonts: FontIntelligenceProfile[];
  palettes: PaletteModel[];
  shapes: ShapeStyleModel[];
}): Promise<void> {
  for (const { key, model } of input.badgeModels) {
    await prisma.parametricBadge.upsert({
      where: { assetKey: key },
      create: {
        assetKey: key,
        name: `${model.style} badge`,
        style: model.style,
        model: model as object,
        styleTags: [model.style, model.cornerStyle],
        categories: [input.category, "generic"],
        successScore: 0.55,
      },
      update: {
        model: model as object,
        styleTags: [model.style, model.cornerStyle],
        updatedAt: new Date(),
      },
    });
  }

  for (const font of input.fonts.slice(0, 40)) {
    const key = `font_${font.family.toLowerCase().replace(/\s+/g, "_")}`;
    await prisma.assetFontProfile.upsert({
      where: { assetKey: key },
      create: {
        assetKey: key,
        family: font.family,
        tags: font.tags,
        marketplaceReadability: font.marketplaceReadability,
        visualImpact: font.visualImpact,
        successScore: font.successScore,
        categories: font.categories,
      },
      update: {
        tags: font.tags,
        marketplaceReadability: font.marketplaceReadability,
        visualImpact: font.visualImpact,
      },
    });
  }

  for (const palette of input.palettes) {
    const key = `palette_${palette.name.toLowerCase().replace(/\s+/g, "_")}`;
    await prisma.assetPalette.upsert({
      where: { assetKey: key },
      create: {
        assetKey: key,
        name: palette.name,
        primary: palette.primary,
        secondary: palette.secondary,
        accent: palette.accent,
        background: palette.background,
        contrast: palette.contrast,
        premiumScore: palette.premiumScore,
        marketplaceScore: palette.marketplaceScore,
        emotion: palette.emotion,
        categories: palette.categories,
      },
      update: {
        marketplaceScore: palette.marketplaceScore,
        premiumScore: palette.premiumScore,
      },
    });
  }

  for (const shape of input.shapes) {
    const key = `shape_${shape.name}`;
    await prisma.assetShapeStyle.upsert({
      where: { assetKey: key },
      create: {
        assetKey: key,
        name: shape.name,
        model: shape as object,
        styleFamily: shape.styleFamily,
        categories: [input.category],
      },
      update: { model: shape as object },
    });
  }
}

export async function recordAssetSuccess(
  assetKey: string,
  assetType: "badge" | "font" | "palette",
  outcome: number,
): Promise<void> {
  const alpha = 0.12;
  if (assetType === "badge") {
    const row = await prisma.parametricBadge.findUnique({ where: { assetKey } });
    if (!row) return;
    await prisma.parametricBadge.update({
      where: { assetKey },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
        successScore: alpha * outcome + (1 - alpha) * row.successScore,
      },
    });
  } else if (assetType === "font") {
    const row = await prisma.assetFontProfile.findUnique({ where: { assetKey } });
    if (!row) return;
    await prisma.assetFontProfile.update({
      where: { assetKey },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
        successScore: alpha * outcome + (1 - alpha) * row.successScore,
      },
    });
  } else {
    const row = await prisma.assetPalette.findUnique({ where: { assetKey } });
    if (!row) return;
    await prisma.assetPalette.update({
      where: { assetKey },
      data: {
        usageCount: { increment: 1 },
        lastUsedAt: new Date(),
        successScore: alpha * outcome + (1 - alpha) * row.successScore,
      },
    });
  }
}
