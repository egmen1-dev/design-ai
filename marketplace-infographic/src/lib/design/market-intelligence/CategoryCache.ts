import { prisma } from "@/lib/prisma";
import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";
import type { MarketIntelligenceContext } from "./types";
import { MARKET_CACHE_TTL_MS } from "./types";

const memoryCache = new Map<
  KnowledgeCategory,
  { context: MarketIntelligenceContext; expiresAt: number }
>();

export function getCachedMarketContext(
  category: KnowledgeCategory,
): MarketIntelligenceContext | null {
  const cached = memoryCache.get(category);
  if (!cached) return null;
  if (Date.now() > cached.expiresAt) {
    memoryCache.delete(category);
    return null;
  }
  return cached.context;
}

export function setCachedMarketContext(
  category: KnowledgeCategory,
  context: MarketIntelligenceContext,
  ttlMs = MARKET_CACHE_TTL_MS,
): void {
  memoryCache.set(category, {
    context,
    expiresAt: Date.now() + ttlMs,
  });
}

export async function loadMarketKnowledgeFromDb(
  category: KnowledgeCategory,
): Promise<MarketIntelligenceContext | null> {
  const row = await prisma.marketCategoryKnowledge.findUnique({
    where: { category },
  });
  if (!row) return null;

  const stats = row.marketStatistics as MarketIntelligenceContext["statistics"];
  const opportunities = row.marketOpportunities as MarketIntelligenceContext["opportunities"];
  const weaknesses = row.marketWeaknesses as MarketIntelligenceContext["weaknesses"];
  const designRecommendations = row.designRecommendations as string[];
  const trendMeta = row.trendHistory as {
    preferredLayouts?: string[];
    avoidLayouts?: string[];
    noveltyHints?: string[];
    opportunityContext?: string;
    agentSnippet?: string;
  };

  return {
    category: category,
    marketVersion: row.marketVersion,
    productsAnalyzed: row.productsAnalyzed,
    knowledgeContext: row.knowledgeContext.split("\n\nВОЗМОЖНОСТИ")[0] ?? row.knowledgeContext,
    opportunityContext: trendMeta?.opportunityContext ?? "",
    agentSnippet: trendMeta?.agentSnippet ?? "",
    statistics: stats,
    opportunities,
    weaknesses,
    designRecommendations,
    preferredLayouts: trendMeta?.preferredLayouts ?? [],
    avoidLayouts: trendMeta?.avoidLayouts ?? [],
    noveltyHints: trendMeta?.noveltyHints ?? [],
  };
}

export async function saveMarketKnowledgeToDb(
  context: MarketIntelligenceContext,
): Promise<void> {
  await prisma.marketCategoryKnowledge.upsert({
    where: { category: context.category },
    create: {
      category: context.category,
      marketVersion: context.marketVersion,
      productsAnalyzed: context.productsAnalyzed,
      knowledgeContext: buildCombinedForDb(context),
      marketStatistics: context.statistics as object,
      marketWeaknesses: context.weaknesses as object[],
      marketOpportunities: context.opportunities as object[],
      designRecommendations: context.designRecommendations as object,
      trendHistory: {
        preferredLayouts: context.preferredLayouts,
        avoidLayouts: context.avoidLayouts,
        noveltyHints: context.noveltyHints,
        opportunityContext: context.opportunityContext,
        agentSnippet: context.agentSnippet,
      } as object,
    },
    update: {
      marketVersion: context.marketVersion,
      productsAnalyzed: context.productsAnalyzed,
      knowledgeContext: buildCombinedForDb(context),
      marketStatistics: context.statistics as object,
      marketWeaknesses: context.weaknesses as object[],
      marketOpportunities: context.opportunities as object[],
      designRecommendations: context.designRecommendations as object,
      trendHistory: {
        preferredLayouts: context.preferredLayouts,
        avoidLayouts: context.avoidLayouts,
        noveltyHints: context.noveltyHints,
        opportunityContext: context.opportunityContext,
        agentSnippet: context.agentSnippet,
      } as object,
    },
  });
}

function buildCombinedForDb(ctx: MarketIntelligenceContext): string {
  return [ctx.knowledgeContext, ctx.opportunityContext].filter(Boolean).join("\n\n");
}

export function isMarketKnowledgeStale(updatedAt: Date, maxAgeMs: number): boolean {
  return Date.now() - updatedAt.getTime() > maxAgeMs;
}
