import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";

export const MARKET_INTELLIGENCE_VERSION = "1.0";
export const MARKET_CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const MARKET_MONTHLY_UPDATE_MS = 30 * 24 * 60 * 60 * 1000;
export const WB_TOP_LIMIT = 100;

export type VisionCardAnalysis = {
  productScale: number;
  negativeSpace: number;
  textDensity: number;
  headlinePosition: string;
  badgeCount: number;
  backgroundType: string;
  lighting: string;
  composition: string;
  cameraAngle: string;
  primaryColor: string;
  fontStyle: string;
  visualHierarchy: string;
  depth: string;
  storytelling: string;
  estimatedCTR: number;
  designDNA: string;
};

export type WBProductCard = {
  id: number;
  name: string;
  brand: string;
  rating: number;
  feedbacks: number;
  imageUrl: string;
  price: number;
};

export type MarketStatistics = {
  category: KnowledgeCategory;
  productsAnalyzed: number;
  avgProductScale: number;
  avgNegativeSpace: number;
  avgTextDensity: number;
  avgBadgeCount: number;
  avgEstimatedCTR: number;
  whiteBackgroundPct: number;
  studioBackgroundPct: number;
  lifestyleBackgroundPct: number;
  popularLayouts: Array<{ layout: string; sharePct: number }>;
  popularBackgrounds: Array<{ type: string; sharePct: number }>;
  popularColors: Array<{ color: string; sharePct: number }>;
  popularLighting: Array<{ type: string; sharePct: number }>;
  popularFonts: Array<{ style: string; sharePct: number }>;
  textHeavyPct: number;
  minimalTextPct: number;
};

export type MarketOpportunity = {
  id: string;
  type: "background" | "scale" | "layout" | "lighting" | "color" | "text" | "composition";
  marketPattern: string;
  marketSharePct: number;
  recommendation: string;
  targetValue?: string | number;
  impactScore: number;
};

export type MarketWeakness = {
  pattern: string;
  sharePct: number;
  issue: string;
};

export type MarketIntelligenceContext = {
  category: KnowledgeCategory;
  marketVersion: number;
  productsAnalyzed: number;
  knowledgeContext: string;
  opportunityContext: string;
  agentSnippet: string;
  statistics: MarketStatistics;
  opportunities: MarketOpportunity[];
  weaknesses: MarketWeakness[];
  designRecommendations: string[];
  preferredLayouts: string[];
  avoidLayouts: string[];
  noveltyHints: string[];
};

export type TrendDelta = {
  metric: string;
  before: number;
  after: number;
  direction: "up" | "down" | "stable";
};

export const CATEGORY_SEARCH_QUERIES: Record<KnowledgeCategory, string[]> = {
  tools: ["триммер", "садовый инструмент"],
  electronics: ["наушники", "электроника"],
  cosmetics: ["крем для лица", "косметика"],
  furniture: ["стул", "мебель"],
  kids: ["игрушка", "детский товар"],
  clothes: ["куртка", "одежда"],
  auto: ["автоаксессуар", "автомобиль"],
  pets: ["корм для собак", "товары для животных"],
  kitchen: ["кухонная техника", "блендер"],
  sports: ["гантели", "спортивный товар"],
  home: ["товары для дома", "пылесос"],
  generator: ["генератор", "электрогенератор"],
  generic: ["товар", "новинка"],
};
