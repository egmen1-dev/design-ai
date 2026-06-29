export { MARKET_INTELLIGENCE_VERSION, MARKET_CACHE_TTL_MS, MARKET_MONTHLY_UPDATE_MS } from "./types";
export type {
  MarketIntelligenceContext,
  MarketStatistics,
  MarketOpportunity,
  MarketWeakness,
  VisionCardAnalysis,
  WBProductCard,
  TrendDelta,
} from "./types";

export { fetchTopWildberriesCards } from "./WBParser";
export { analyzeCardVision, analyzeCardsBatch } from "./VisionAnalyzer";
export { analyzeCategoryMarket } from "./CategoryAnalyzer";
export { buildMarketStatistics } from "./MarketStatistics";
export {
  findMarketOpportunities,
  findMarketWeaknesses,
  buildDesignRecommendations,
  mapOpportunityToLayouts,
} from "./OpportunityEngine";
export {
  buildKnowledgeContext,
  buildOpportunityContext,
  buildAgentSnippet,
  assembleMarketContext,
  buildCombinedMarketPromptBlock,
} from "./KnowledgeBuilder";
export {
  getCachedMarketContext,
  loadMarketKnowledgeFromDb,
  saveMarketKnowledgeToDb,
  isMarketKnowledgeStale,
} from "./CategoryCache";
export {
  refreshCategoryMarketKnowledge,
  retrieveMarketIntelligence,
  ensureMonthlyMarketUpdate,
} from "./MonthlyUpdater";
export { recordMarketTrend, getCategoryTrends, analyzeTrendDirection } from "./TrendAnalyzer";
export {
  getMarketIntelligenceLayoutBoost,
  computeNoveltyScore,
  refreshMarketLayoutCache,
} from "./layout-boost";
