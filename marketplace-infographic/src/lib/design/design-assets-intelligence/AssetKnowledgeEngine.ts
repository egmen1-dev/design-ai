import { prisma } from "@/lib/prisma";
import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";
import { resolveKnowledgeCategory } from "@/lib/design/knowledge-engine/category";
import type { ProductCategory } from "@/lib/product-analysis";
import type {
  AssetsIntelligenceContext,
  FontIntelligenceProfile,
  ParametricBadgeModel,
  PaletteModel,
} from "./types";
import { ASSET_SYNC_INTERVAL_MS } from "./types";
import { crawlDesignAssets } from "./AssetCrawler";
import {
  applyDiversityPenalty,
  persistCrawledAssets,
  recordAssetSuccess,
  trackAssetUsage,
} from "./diversity-engine";
import { rankFontsByIntelligence, fontCssImport } from "./FontAnalyzer";
import { getPalettesForCategory, rankPalettes, paletteToColors } from "./PaletteAnalyzer";
import { buildParametricBadgeHtml } from "./SVGBuilder";
import { refreshAssetsLayoutCache } from "./layout-boost";

export { persistCrawledAssets, recordAssetSuccess, trackAssetUsage };

export async function ensureAssetsLibrary(
  category: KnowledgeCategory,
): Promise<void> {
  const count = await prisma.parametricBadge.count();
  if (count > 0) {
    const lastSync = await prisma.assetSyncLog.findFirst({
      orderBy: { completedAt: "desc" },
    });
    if (
      lastSync &&
      Date.now() - lastSync.completedAt.getTime() < ASSET_SYNC_INTERVAL_MS
    ) {
      return;
    }
  }
  await runAssetTrendSync(category);
}

export async function runAssetTrendSync(
  category: KnowledgeCategory,
): Promise<void> {
  const result = await crawlDesignAssets(category);
  await prisma.assetSyncLog.create({
    data: {
      syncType: "monthly",
      category,
      itemsAdded: result.badgeModels + result.fontProfiles,
      itemsUpdated: result.palettes + result.shapes,
    },
  });
}

export async function loadTopParametricBadge(
  category: KnowledgeCategory,
): Promise<{ assetKey: string; model: ParametricBadgeModel } | null> {
  const rows = await prisma.parametricBadge.findMany({
    where: { categories: { hasSome: [category, "generic"] } },
    orderBy: { successScore: "desc" },
    take: 12,
  });
  if (rows.length === 0) return null;

  const scored = rows
    .map((r) => ({
      assetKey: r.assetKey,
      model: r.model as ParametricBadgeModel,
      score: applyDiversityPenalty(r.assetKey, category, r.successScore),
    }))
    .sort((a, b) => b.score - a.score);

  const pick = scored[0];
  trackAssetUsage(pick.assetKey, "badge", category);
  return { assetKey: pick.assetKey, model: pick.model };
}

export async function loadTopFontProfile(
  category: KnowledgeCategory,
  styleTags: string[] = [],
): Promise<FontIntelligenceProfile | null> {
  const rows = await prisma.assetFontProfile.findMany({ take: 50 });
  if (rows.length === 0) return null;

  const profiles: FontIntelligenceProfile[] = rows.map((r) => ({
    family: r.family,
    tags: r.tags as FontIntelligenceProfile["tags"],
    marketplaceReadability: r.marketplaceReadability,
    visualImpact: r.visualImpact,
    successScore: applyDiversityPenalty(r.assetKey, category, r.successScore),
    categories: r.categories,
  }));

  return rankFontsByIntelligence(profiles, category, styleTags)[0] ?? null;
}

export async function loadTopPalette(
  category: KnowledgeCategory,
): Promise<PaletteModel | null> {
  const db = await prisma.assetPalette.findMany({
    where: { categories: { hasSome: [category, "generic"] } },
    orderBy: { marketplaceScore: "desc" },
    take: 8,
  });
  const palettes =
    db.length > 0
      ? db.map((r) => ({
          name: r.name,
          primary: r.primary,
          secondary: r.secondary,
          accent: r.accent,
          background: r.background,
          contrast: r.contrast,
          premiumScore: r.premiumScore,
          marketplaceScore: r.marketplaceScore,
          emotion: r.emotion ?? "",
          categories: r.categories,
        }))
      : getPalettesForCategory(category);

  const ranked = rankPalettes(palettes, category);
  return ranked[0] ?? null;
}

export function buildAssetsPromptBlock(input: {
  category: KnowledgeCategory;
  badge?: ParametricBadgeModel;
  font?: FontIntelligenceProfile;
  palette?: PaletteModel;
}): string {
  const lines = [
    `Design Assets Intelligence — актуальные компоненты для «${input.category}»:`,
    "",
  ];
  if (input.font) {
    lines.push(
      `— Рекомендуемый шрифт: ${input.font.family} (${input.font.tags.join(", ")}).`,
      `  Marketplace Readability: ${input.font.marketplaceReadability}, Visual Impact: ${input.font.visualImpact}.`,
    );
  }
  if (input.palette) {
    lines.push(
      `— Палитра «${input.palette.name}»: primary ${input.palette.primary}, accent ${input.palette.accent}.`,
      `  Emotion: ${input.palette.emotion}, Marketplace Score: ${input.palette.marketplaceScore}.`,
    );
  }
  if (input.badge) {
    lines.push(
      `— Плашка: стиль ${input.badge.style}, radius ${input.badge.radius}, padding ${input.badge.paddingX}/${input.badge.paddingY}.`,
      `  Gradient: ${input.badge.gradient}, shadow: ${input.badge.shadow}, adaptive: ${input.badge.adaptive}.`,
    );
  }
  lines.push(
    "",
    "Используй параметры как ориентир. Плашки строятся параметрически через SVG Builder — не копируй чужие PNG.",
  );
  return lines.join("\n");
}

export async function retrieveAssetsIntelligence(
  prompt: string,
  productCategory: ProductCategory,
  styleTags: string[] = [],
): Promise<AssetsIntelligenceContext> {
  const category = resolveKnowledgeCategory(prompt, productCategory);
  await ensureAssetsLibrary(category).catch((e) =>
    console.warn("[assets-intelligence] sync skipped:", e),
  );

  const [badgePick, font, palette] = await Promise.all([
    loadTopParametricBadge(category),
    loadTopFontProfile(category, styleTags),
    loadTopPalette(category),
  ]);

  const promptBlock = buildAssetsPromptBlock({
    category,
    badge: badgePick?.model,
    font: font ?? undefined,
    palette: palette ?? undefined,
  });

  refreshAssetsLayoutCache(category, badgePick?.model?.style);

  const agentSnippet = [
    font ? `шрифт ${font.family}` : null,
    palette ? `палитра ${palette.name}` : null,
    badgePick ? `плашка ${badgePick.model.style}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    category,
    promptBlock,
    agentSnippet: agentSnippet || "стандартные marketplace-ассеты",
    recommendedBadgeKey: badgePick?.assetKey,
    recommendedFontFamily: font?.family,
    recommendedPaletteKey: palette?.name,
    parametricBadge: badgePick?.model,
    palette: palette ?? undefined,
  };
}

export function renderIntelligentBadge(
  model: ParametricBadgeModel,
  text: string,
  accentColor: string,
  fontSizePx = 18,
): string {
  return buildParametricBadgeHtml({
    model,
    text,
    fontSizePx,
    accentColor,
    icon: "star",
    maxWidthPct: 40,
  });
}

export function paletteColorsForSd(palette?: PaletteModel): string[] | undefined {
  if (!palette) return undefined;
  return paletteToColors(palette);
}

export { fontCssImport };
