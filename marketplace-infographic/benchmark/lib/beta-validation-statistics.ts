/**
 * Beta Validation 2 — statistical analysis (benchmark-only).
 */

export type ConfidenceLevel = "LOW" | "MEDIUM" | "HIGH" | "VERY HIGH";

export type StatSummary = {
  n: number;
  mean: number;
  stdDev: number;
  ci95Low: number;
  ci95High: number;
  min: number;
  max: number;
  outliers: number[];
  confidence: ConfidenceLevel;
};

export function confidenceLevel(n: number): ConfidenceLevel {
  if (n < 30) return "LOW";
  if (n < 100) return "MEDIUM";
  if (n < 300) return "HIGH";
  return "VERY HIGH";
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

export function stdDev(values: number[], avg?: number): number {
  if (values.length < 2) return 0;
  const m = avg ?? mean(values);
  const variance = values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

/** 95% CI for mean (t-distribution approximation; n≥30 uses z=1.96) */
export function ci95(values: number[]): { low: number; high: number } {
  const n = values.length;
  if (n === 0) return { low: 0, high: 0 };
  const m = mean(values);
  const sd = stdDev(values, m);
  const z = n >= 30 ? 1.96 : 2.262; // conservative for small n
  const margin = z * (sd / Math.sqrt(n));
  return {
    low: Number((m - margin).toFixed(2)),
    high: Number((m + margin).toFixed(2)),
  };
}

export function iqrOutliers(values: number[]): number[] {
  if (values.length < 4) return [];
  const sorted = [...values].sort((a, b) => a - b);
  const q1 = sorted[Math.floor(sorted.length * 0.25)]!;
  const q3 = sorted[Math.floor(sorted.length * 0.75)]!;
  const iqr = q3 - q1;
  const low = q1 - 1.5 * iqr;
  const high = q3 + 1.5 * iqr;
  return values.filter((v) => v < low || v > high);
}

export function summarize(values: number[]): StatSummary {
  const n = values.length;
  const m = mean(values);
  const sd = stdDev(values, m);
  const ci = ci95(values);
  return {
    n,
    mean: Number(m.toFixed(2)),
    stdDev: Number(sd.toFixed(2)),
    ci95Low: ci.low,
    ci95High: ci.high,
    min: n ? Math.min(...values) : 0,
    max: n ? Math.max(...values) : 0,
    outliers: iqrOutliers(values),
    confidence: confidenceLevel(n),
  };
}

/** Wilson score interval for proportion (win rate) */
export function proportionCi95(successes: number, n: number): { low: number; high: number; rate: number } {
  if (n === 0) return { low: 0, high: 0, rate: 0 };
  const p = successes / n;
  const z = 1.96;
  const denom = 1 + (z * z) / n;
  const center = p + (z * z) / (2 * n);
  const margin = z * Math.sqrt((p * (1 - p) + (z * z) / (4 * n)) / n);
  return {
    rate: Number((p * 100).toFixed(1)),
    low: Number(((center - margin) / denom * 100).toFixed(1)),
    high: Number(((center + margin) / denom * 100).toFixed(1)),
  };
}

export type CategoryVariance = {
  category: string;
  n: number;
  winRate: number;
  dominanceMean: number;
  fidelityMean: number;
  attentionMean: number;
  varianceWinRate: number;
};

export function categoryVariance(
  rows: Array<{
    categoryLabel: string;
    overall: "daos" | "wb" | "draw";
    daos: { productDominance: number; commercialFidelity: number; attentionHierarchyScore: number };
  }>,
): CategoryVariance[] {
  const byCat = new Map<string, typeof rows>();
  for (const r of rows) {
    const list = byCat.get(r.categoryLabel) ?? [];
    list.push(r);
    byCat.set(r.categoryLabel, list);
  }

  const globalWinRate = mean(rows.map((r) => (r.overall === "daos" ? 1 : 0)));

  return [...byCat.entries()].map(([category, items]) => {
    const wins = items.filter((i) => i.overall === "daos").length;
    const winRate = wins / items.length;
    return {
      category,
      n: items.length,
      winRate: Number((winRate * 100).toFixed(1)),
      dominanceMean: Number(mean(items.map((i) => i.daos.productDominance)).toFixed(1)),
      fidelityMean: Number(mean(items.map((i) => i.daos.commercialFidelity)).toFixed(1)),
      attentionMean: Number(mean(items.map((i) => i.daos.attentionHierarchyScore)).toFixed(1)),
      varianceWinRate: Number(((winRate - globalWinRate) ** 2 * 100).toFixed(2)),
    };
  });
}
