import { prisma } from "@/lib/prisma";
import { ANALYSIS_INTERVAL, type CategoryInsights, type KnowledgeCategory } from "./types";
import { emaAverage } from "./weight-manager";

let lastAnalyzedCount = 0;

export async function runPatternAnalysisIfDue(): Promise<boolean> {
  const total = await prisma.generationHistory.count();
  if (total < ANALYSIS_INTERVAL) return false;
  if (total - lastAnalyzedCount < ANALYSIS_INTERVAL) return false;

  lastAnalyzedCount = total;
  await runPatternAnalysis();
  return true;
}

export async function runPatternAnalysis(): Promise<CategoryInsights[]> {
  const categories = await prisma.generationHistory.findMany({
    select: { category: true },
    distinct: ["category"],
  });

  const insights: CategoryInsights[] = [];

  for (const { category } of categories) {
    const insight = await analyzeCategory(category as KnowledgeCategory);
    if (insight) insights.push(insight);
  }

  return insights;
}

async function analyzeCategory(category: KnowledgeCategory): Promise<CategoryInsights | null> {
  const recent = await prisma.generationHistory.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
    take: ANALYSIS_INTERVAL,
  });

  if (recent.length < 5) return null;

  const patterns = await prisma.designPattern.findMany({
    where: { category },
    orderBy: { successWeight: "desc" },
    take: 50,
  });

  const topPatterns = patterns.filter((p) => p.usages >= 2).slice(0, 20);
  if (topPatterns.length === 0) return null;

  const totalUsages = topPatterns.reduce((sum, p) => sum + p.usages, 0) || 1;

  const layoutMap = aggregateBy(topPatterns, (p) => p.layoutTemplate);
  const fontMap = aggregateBy(topPatterns, (p) => p.fontFamily);
  const bgMap = aggregateBy(topPatterns, (p) => p.backgroundType);
  const lightMap = aggregateBy(topPatterns, (p) => p.lightingType);
  const colorMap = aggregateBy(topPatterns, (p) => p.primaryColor);

  const scales = topPatterns.map((p) => p.productScale);
  const minScale = Math.min(...scales);
  const maxScale = Math.max(...scales);

  const avgTopDesignScore =
    recent
      .filter((r) => typeof r.designScore === "number")
      .slice(0, 20)
      .reduce((sum, r) => sum + (r.designScore ?? 0), 0) /
    Math.max(1, recent.filter((r) => typeof r.designScore === "number").length);

  for (const pattern of topPatterns) {
    const recentAvg = recent
      .filter((r) => r.designScore != null)
      .slice(0, 30)
      .reduce((s, r) => s + (r.designScore ?? 0), 0);
    const normalized = recentAvg / Math.max(1, Math.min(30, recent.length)) / 100;
    const nextWeight = emaAverage(pattern.successWeight, 0.5 + normalized);
    if (Math.abs(nextWeight - pattern.successWeight) > 0.02) {
      await prisma.designPattern.update({
        where: { id: pattern.id },
        data: { successWeight: nextWeight },
      });
    }
  }

  return {
    category,
    topLayouts: toRanked(layoutMap, totalUsages),
    topFonts: toRanked(fontMap, totalUsages).map(({ key, weight, avgScore }) => ({
      key,
      weight,
      avgScore,
    })),
    topBackgrounds: toRanked(bgMap, totalUsages).map(({ key, weight, avgScore }) => ({
      key,
      weight,
      avgScore,
    })),
    topLighting: toRanked(lightMap, totalUsages).map(({ key, weight, avgScore }) => ({
      key,
      weight,
      avgScore,
    })),
    topColors: toRanked(colorMap, totalUsages).map(({ key, weight }) => ({ key, weight })),
    optimalProductScale: [
      Number((minScale * 100).toFixed(0)),
      Number((maxScale * 100).toFixed(0)),
    ],
    avgTopDesignScore: Number(avgTopDesignScore.toFixed(1)),
    sampleCount: recent.length,
  };
}

type Agg = { weight: number; score: number; usages: number };

function aggregateBy<T>(items: T[], keyFn: (item: T) => string): Map<string, Agg> {
  const map = new Map<string, Agg>();
  for (const item of items) {
    const key = keyFn(item);
    const p = item as { successWeight: number; designScore: number; usages: number };
    const prev = map.get(key) ?? { weight: 0, score: 0, usages: 0 };
    map.set(key, {
      weight: prev.weight + p.successWeight * p.usages,
      score: prev.score + p.designScore * p.usages,
      usages: prev.usages + p.usages,
    });
  }
  return map;
}

function toRanked(map: Map<string, Agg>, totalUsages: number) {
  return [...map.entries()]
    .map(([key, agg]) => ({
      key,
      weight: Number((agg.weight / Math.max(1, agg.usages)).toFixed(2)),
      avgScore: Number((agg.score / Math.max(1, agg.usages)).toFixed(1)),
      sharePct: Number(((agg.usages / totalUsages) * 100).toFixed(0)),
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 5);
}
