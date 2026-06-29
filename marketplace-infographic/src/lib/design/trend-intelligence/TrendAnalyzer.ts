import type { TrendIntelligenceContext } from "./types";

export function computeTrendScore(ctx: Pick<TrendIntelligenceContext, "styleSignals" | "compositionTrends">): number {
  const styleAvg =
    ctx.styleSignals.reduce((s, t) => s + t.strength * (t.direction === "rising" ? 1 : 0.4), 0) /
    Math.max(1, ctx.styleSignals.length);
  const compAvg =
    ctx.compositionTrends.reduce((s, c) => s + c.score, 0) /
    Math.max(1, ctx.compositionTrends.length) /
    100;
  return Math.round((styleAvg * 0.55 + compAvg * 0.45) * 100);
}

export function analyzeTrendAlignment(input: {
  layoutTemplate?: string;
  badgeStyle?: string;
  backgroundType?: string;
  trend: TrendIntelligenceContext;
}): number {
  let score = 65;
  if (input.layoutTemplate && input.trend.risingLayouts.includes(input.layoutTemplate)) score += 15;
  if (input.layoutTemplate && input.trend.decliningLayouts.includes(input.layoutTemplate)) score -= 12;
  if (input.badgeStyle?.includes("glass")) score += 8;
  if (input.backgroundType?.includes("white")) score -= 6;
  return Math.max(0, Math.min(100, score));
}
