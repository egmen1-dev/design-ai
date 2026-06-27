import { prisma } from "@/lib/prisma";
import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";
import type { MarketStatistics, TrendDelta } from "./types";

function delta(before: number, after: number): TrendDelta {
  const diff = after - before;
  return {
    metric: "",
    before,
    after,
    direction: Math.abs(diff) < 0.5 ? "stable" : diff > 0 ? "up" : "down",
  };
}

export async function recordMarketTrend(
  category: KnowledgeCategory,
  marketVersion: number,
  oldStatistics: unknown,
  newStatistics: MarketStatistics,
): Promise<void> {
  const old = (oldStatistics ?? {}) as Partial<MarketStatistics>;

  const changes: TrendDelta[] = [
    { ...delta(old.avgProductScale ?? 0, newStatistics.avgProductScale), metric: "avgProductScale" },
    { ...delta(old.whiteBackgroundPct ?? 0, newStatistics.whiteBackgroundPct), metric: "whiteBackgroundPct" },
    { ...delta(old.avgTextDensity ?? 0, newStatistics.avgTextDensity * 100), metric: "avgTextDensity" },
    { ...delta(old.avgEstimatedCTR ?? 0, newStatistics.avgEstimatedCTR), metric: "avgEstimatedCTR" },
    { ...delta(old.textHeavyPct ?? 0, newStatistics.textHeavyPct), metric: "textHeavyPct" },
  ];

  await prisma.marketKnowledgeHistory.create({
    data: {
      category,
      marketVersion,
      oldStatistics: old as object,
      newStatistics: newStatistics as object,
      changes: changes as object[],
    },
  });
}

export async function getCategoryTrends(
  category: KnowledgeCategory,
  limit = 6,
): Promise<Array<{ marketVersion: number; changes: TrendDelta[]; createdAt: Date }>> {
  const rows = await prisma.marketKnowledgeHistory.findMany({
    where: { category },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((r) => ({
    marketVersion: r.marketVersion,
    changes: r.changes as TrendDelta[],
    createdAt: r.createdAt,
  }));
}

export function analyzeTrendDirection(
  trends: Array<{ changes: TrendDelta[] }>,
  metric: string,
): "improving" | "worsening" | "stable" {
  const deltas = trends
    .flatMap((t) => t.changes)
    .filter((c) => c.metric === metric)
    .slice(0, 3);

  if (deltas.length === 0) return "stable";
  const avg = deltas.reduce((s, d) => s + (d.after - d.before), 0) / deltas.length;
  if (Math.abs(avg) < 1) return "stable";
  return avg > 0 ? "improving" : "worsening";
}
