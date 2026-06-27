import { prisma } from "@/lib/prisma";
import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";
import { resolveKnowledgeCategory } from "@/lib/design/knowledge-engine/category";
import type { ProductCategory } from "@/lib/product-analysis";
import { fetchTopWildberriesCards } from "./WBParser";
import { analyzeCardsBatch } from "./VisionAnalyzer";
import { analyzeCategoryMarket } from "./CategoryAnalyzer";
import {
  buildDesignRecommendations,
  findMarketOpportunities,
  findMarketWeaknesses,
  mapOpportunityToLayouts,
} from "./OpportunityEngine";
import { assembleMarketContext } from "./KnowledgeBuilder";
import {
  getCachedMarketContext,
  isMarketKnowledgeStale,
  loadMarketKnowledgeFromDb,
  saveMarketKnowledgeToDb,
  setCachedMarketContext,
} from "./CategoryCache";
import { refreshMarketLayoutCache } from "./layout-boost";
import { recordMarketTrend } from "./TrendAnalyzer";
import type { MarketIntelligenceContext } from "./types";
import { MARKET_MONTHLY_UPDATE_MS } from "./types";

export async function refreshCategoryMarketKnowledge(
  category: KnowledgeCategory,
  searchQuery?: string,
): Promise<MarketIntelligenceContext> {
  const cards = await fetchTopWildberriesCards(category, searchQuery);
  const vision = analyzeCardsBatch(cards, category);
  const stats = analyzeCategoryMarket(category, vision);
  const opportunities = findMarketOpportunities(stats);
  const weaknesses = findMarketWeaknesses(stats);
  const designRecommendations = buildDesignRecommendations(stats, opportunities);
  const { preferred, avoid } = mapOpportunityToLayouts(opportunities);

  const existing = await prisma.marketCategoryKnowledge.findUnique({
    where: { category },
  });

  const context = assembleMarketContext({
    category,
    marketVersion: (existing?.marketVersion ?? 0) + 1,
    stats,
    opportunities,
    weaknesses,
    designRecommendations,
    preferredLayouts: preferred,
    avoidLayouts: avoid,
  });

  if (existing) {
    await recordMarketTrend(
      category,
      context.marketVersion,
      existing.marketStatistics,
      stats,
    );
  }

  await saveMarketKnowledgeToDb(context);
  setCachedMarketContext(category, context);
  refreshMarketLayoutCache(context);
  return context;
}

export async function retrieveMarketIntelligence(
  prompt: string,
  productCategory: ProductCategory,
): Promise<MarketIntelligenceContext> {
  const category = resolveKnowledgeCategory(prompt, productCategory);

  const memCached = getCachedMarketContext(category);
  if (memCached) return memCached;

  const dbRow = await prisma.marketCategoryKnowledge.findUnique({
    where: { category },
  });

  if (dbRow && !isMarketKnowledgeStale(dbRow.updatedAt, MARKET_MONTHLY_UPDATE_MS)) {
    const loaded = await loadMarketKnowledgeFromDb(category);
    if (loaded) {
      setCachedMarketContext(category, loaded);
      refreshMarketLayoutCache(loaded);
      return loaded;
    }
  }

  try {
    return await refreshCategoryMarketKnowledge(category, prompt.slice(0, 80));
  } catch (error) {
    console.warn("[market-intelligence] refresh failed, using fallback:", error);
    if (dbRow) {
      const loaded = await loadMarketKnowledgeFromDb(category);
      if (loaded) return loaded;
    }
    return await refreshCategoryMarketKnowledge(category);
  }
}

export async function ensureMonthlyMarketUpdate(
  category: KnowledgeCategory,
): Promise<boolean> {
  const row = await prisma.marketCategoryKnowledge.findUnique({ where: { category } });
  if (!row) return false;
  if (!isMarketKnowledgeStale(row.updatedAt, MARKET_MONTHLY_UPDATE_MS)) return false;
  await refreshCategoryMarketKnowledge(category);
  return true;
}
