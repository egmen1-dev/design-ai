import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";
import type { MarketStatistics, VisionCardAnalysis } from "./types";

function sharePct(count: number, total: number): number {
  return total === 0 ? 0 : Number(((count / total) * 100).toFixed(0));
}

function topShares(
  items: string[],
  limit = 5,
): Array<{ key: string; sharePct: number }> {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item, (counts.get(item) ?? 0) + 1);
  }
  const total = items.length || 1;
  return [...counts.entries()]
    .map(([key, count]) => ({ key, sharePct: sharePct(count, total) }))
    .sort((a, b) => b.sharePct - a.sharePct)
    .slice(0, limit);
}

export function buildMarketStatistics(
  category: KnowledgeCategory,
  analyses: VisionCardAnalysis[],
): MarketStatistics {
  const n = analyses.length || 1;
  const avg = (fn: (a: VisionCardAnalysis) => number) =>
    Number((analyses.reduce((s, a) => s + fn(a), 0) / n).toFixed(1));

  const whiteBg = analyses.filter((a) => a.backgroundType.includes("white")).length;
  const studioBg = analyses.filter((a) => a.backgroundType.includes("studio")).length;
  const lifestyleBg = analyses.filter(
    (a) => a.backgroundType.includes("interior") || a.backgroundType.includes("scene"),
  ).length;
  const textHeavy = analyses.filter((a) => a.textDensity > 0.35).length;
  const minimalText = analyses.filter((a) => a.textDensity < 0.25).length;

  const layouts = topShares(analyses.map((a) => a.composition));
  const backgrounds = topShares(analyses.map((a) => a.backgroundType));
  const colors = topShares(analyses.map((a) => a.primaryColor));
  const lighting = topShares(analyses.map((a) => a.lighting));
  const fonts = topShares(analyses.map((a) => a.fontStyle));

  return {
    category,
    productsAnalyzed: analyses.length,
    avgProductScale: avg((a) => a.productScale),
    avgNegativeSpace: avg((a) => a.negativeSpace),
    avgTextDensity: Number(avg((a) => a.textDensity * 100).toFixed(0)) / 100,
    avgBadgeCount: avg((a) => a.badgeCount),
    avgEstimatedCTR: avg((a) => a.estimatedCTR),
    whiteBackgroundPct: sharePct(whiteBg, n),
    studioBackgroundPct: sharePct(studioBg, n),
    lifestyleBackgroundPct: sharePct(lifestyleBg, n),
    popularLayouts: layouts.map((l) => ({ layout: l.key, sharePct: l.sharePct })),
    popularBackgrounds: backgrounds.map((b) => ({ type: b.key, sharePct: b.sharePct })),
    popularColors: colors.map((c) => ({ color: c.key, sharePct: c.sharePct })),
    popularLighting: lighting.map((l) => ({ type: l.key, sharePct: l.sharePct })),
    popularFonts: fonts.map((f) => ({ style: f.key, sharePct: f.sharePct })),
    textHeavyPct: sharePct(textHeavy, n),
    minimalTextPct: sharePct(minimalText, n),
  };
}

export function analyzeCategoryMarket(
  category: KnowledgeCategory,
  analyses: VisionCardAnalysis[],
): MarketStatistics {
  return buildMarketStatistics(category, analyses);
}
