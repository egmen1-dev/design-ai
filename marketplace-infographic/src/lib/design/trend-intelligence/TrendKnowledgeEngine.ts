import { prisma } from "@/lib/prisma";
import { resolveKnowledgeCategory } from "@/lib/design/knowledge-engine";
import type { ProductCategory } from "@/lib/product-analysis";
import { runAssetTrendSync } from "@/lib/design/design-assets-intelligence";
import { refreshCategoryMarketKnowledge } from "@/lib/design/market-intelligence";
import type { TrendIntelligenceContext } from "./types";
import { TREND_INTELLIGENCE_VERSION, TREND_SYNC_INTERVAL_MS } from "./types";
import {
  collectAssetTrendSignals,
  collectColorTrends,
  collectCompositionTrends,
  collectFontTrends,
  collectMarketTrendSignals,
} from "./TrendCollector";
import { computeTrendScore } from "./TrendAnalyzer";
import { refreshTrendLayoutCache } from "./layout-boost";

async function lastSyncAge(): Promise<number> {
  const row = await prisma.trendSyncLog.findFirst({ orderBy: { completedAt: "desc" } });
  if (!row) return Infinity;
  return Date.now() - row.completedAt.getTime();
}

export async function runMonthlyTrendSync(category: string): Promise<void> {
  await Promise.all([
    refreshCategoryMarketKnowledge(category as import("@/lib/design/knowledge-engine/types").KnowledgeCategory).catch(() => {}),
    runAssetTrendSync(category as import("@/lib/design/knowledge-engine/types").KnowledgeCategory).catch(() => {}),
  ]);
  await prisma.trendSyncLog.create({
    data: { syncType: "monthly", category, sourcesUpdated: 3 },
  });
}

export async function ensureTrendIntelligence(category: string): Promise<void> {
  const age = await lastSyncAge();
  if (age < TREND_SYNC_INTERVAL_MS) return;
  await runMonthlyTrendSync(category).catch((e) => console.warn("[trend-intelligence] sync:", e));
}

function buildPromptBlock(ctx: TrendIntelligenceContext): string {
  const lines = [
    `Trend Intelligence v${ctx.version} — актуальные тренды для «${ctx.category}»:`,
    "",
    "Стили (rising):",
    ...ctx.styleSignals.slice(0, 5).map((s) => `— ${s.label} (${s.direction}, ${Math.round(s.strength * 100)}%)`),
    "",
    "Цвета:",
    ...ctx.colorTrends.slice(0, 3).map((c) => `— ${c.name}: ${c.primary} + ${c.accent} (${c.emotion})`),
    "",
    "Композиции:",
    ...ctx.compositionTrends.slice(0, 3).map(
      (c) => `— ${c.layoutTemplate}: product ${c.productScalePct}%, air ${c.negativeSpacePct}%`,
    ),
    "",
    "Шрифты:",
    ...ctx.fontTrends.slice(0, 3).map((f) => `— ${f.family} (${f.tags.join(", ")})`),
    "",
    `Trend Score: ${ctx.trendScore}/100`,
    "Избегай устаревших flat-infographic и чисто белых фонов без контекста.",
  ];
  return lines.join("\n");
}

export async function retrieveTrendIntelligence(
  prompt: string,
  productCategory: ProductCategory,
): Promise<TrendIntelligenceContext> {
  const category = resolveKnowledgeCategory(prompt, productCategory);
  await ensureTrendIntelligence(category);

  const [marketTrends, assetSignals] = await Promise.all([
    collectMarketTrendSignals(category),
    Promise.resolve(collectAssetTrendSignals()),
  ]);

  const styleSignals = [...marketTrends.signals, ...assetSignals].slice(0, 8);
  const colorTrends = collectColorTrends(category);
  const fontTrends = collectFontTrends();
  const compositionTrends = collectCompositionTrends(category);

  refreshTrendLayoutCache(category, marketTrends.risingLayouts, marketTrends.decliningLayouts);

  const ctx: TrendIntelligenceContext = {
    category,
    version: 1,
    styleSignals,
    colorTrends,
    fontTrends,
    compositionTrends,
    risingLayouts: marketTrends.risingLayouts,
    decliningLayouts: marketTrends.decliningLayouts,
    trendScore: 0,
    promptBlock: "",
    agentSnippet: "",
  };
  ctx.trendScore = computeTrendScore(ctx);
  ctx.promptBlock = buildPromptBlock(ctx);
  ctx.agentSnippet = `тренды: ${styleSignals.slice(0, 2).map((s) => s.label).join(", ") || "marketplace modern"}`;

  await prisma.trendIntelligence.upsert({
    where: { category },
    create: {
      category,
      trends: ctx as object,
      styleSignals: styleSignals as object[],
      colorTrends: colorTrends as object[],
      fontTrends: fontTrends as object[],
      layoutTrends: compositionTrends as object[],
      trendScore: ctx.trendScore,
      version: 1,
    },
    update: {
      trends: ctx as object,
      styleSignals: styleSignals as object[],
      colorTrends: colorTrends as object[],
      fontTrends: fontTrends as object[],
      layoutTrends: compositionTrends as object[],
      trendScore: ctx.trendScore,
      version: { increment: 1 },
    },
  });

  return ctx;
}

export { refreshTrendLayoutCache, getTrendIntelligenceLayoutBoost } from "./layout-boost";
export { analyzeTrendAlignment } from "./TrendAnalyzer";
