export { TREND_INTELLIGENCE_VERSION, TREND_SYNC_INTERVAL_MS } from "./types";
export type { TrendIntelligenceContext, TrendSignal, ColorTrend, FontTrend, CompositionTrend } from "./types";
export {
  retrieveTrendIntelligence,
  runMonthlyTrendSync,
  ensureTrendIntelligence,
  getTrendIntelligenceLayoutBoost,
  analyzeTrendAlignment,
} from "./TrendKnowledgeEngine";
