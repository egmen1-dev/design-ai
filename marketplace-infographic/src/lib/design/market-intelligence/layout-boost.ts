import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";
import type { MarketIntelligenceContext } from "./types";

const layoutBoostCache = new Map<string, number>();

export function refreshMarketLayoutCache(ctx: MarketIntelligenceContext): void {
  for (const layout of ctx.preferredLayouts) {
    layoutBoostCache.set(`${ctx.category}:${layout}`, 12);
  }
  for (const layout of ctx.avoidLayouts) {
    layoutBoostCache.set(`${ctx.category}:${layout}`, -10);
  }
}

export function getMarketIntelligenceLayoutBoost(
  category: KnowledgeCategory,
  layoutTemplate: string,
): number {
  return layoutBoostCache.get(`${category}:${layoutTemplate}`) ?? 0;
}

export function computeNoveltyScore(input: {
  productScale?: number;
  backgroundType?: string;
  layoutTemplate?: string;
  market: MarketIntelligenceContext;
}): number {
  let score = 70;

  const targetScale =
    typeof input.market.opportunities.find((o) => o.type === "scale")?.targetValue === "number"
      ? Number(input.market.opportunities.find((o) => o.type === "scale")?.targetValue)
      : 68;

  if (input.productScale && Math.abs(input.productScale - targetScale) < 4) {
    score += 10;
  }

  if (
    input.backgroundType &&
    input.market.statistics.whiteBackgroundPct > 70 &&
    !input.backgroundType.includes("white")
  ) {
    score += 12;
  }

  if (
    input.layoutTemplate &&
    input.market.avoidLayouts.includes(input.layoutTemplate)
  ) {
    score -= 15;
  }

  if (
    input.layoutTemplate &&
    input.market.preferredLayouts.includes(input.layoutTemplate)
  ) {
    score += 8;
  }

  return Math.max(0, Math.min(100, score));
}
