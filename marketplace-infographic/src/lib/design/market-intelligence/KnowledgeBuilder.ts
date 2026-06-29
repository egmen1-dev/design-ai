import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";
import type {
  MarketIntelligenceContext,
  MarketOpportunity,
  MarketStatistics,
  MarketWeakness,
} from "./types";

const CATEGORY_LABELS: Record<KnowledgeCategory, string> = {
  tools: "Инструменты",
  electronics: "Электроника",
  cosmetics: "Косметика",
  furniture: "Мебель",
  kids: "Детские товары",
  clothes: "Одежда",
  auto: "Авто",
  pets: "Зоотовары",
  kitchen: "Кухня",
  sports: "Спорт",
  home: "Дом",
  generator: "Генераторы",
  generic: "Универсальные",
};

export function buildKnowledgeContext(
  category: KnowledgeCategory,
  stats: MarketStatistics,
  opportunities: MarketOpportunity[],
  weaknesses: MarketWeakness[],
): string {
  const label = CATEGORY_LABELS[category] ?? category;
  const topLayout = stats.popularLayouts[0];
  const topBg = stats.popularBackgrounds[0];
  const topFont = stats.popularFonts[0];

  const lines = [
    `Рыночная разведка Wildberries — категория «${label}» (${stats.productsAnalyzed} карточек):`,
    "",
    `— Средний масштаб товара на рынке: ${stats.avgProductScale.toFixed(0)}%.`,
    `— Белый/студийный фон: ${stats.whiteBackgroundPct}% карточек.`,
    topLayout
      ? `— Популярный layout: ${topLayout.layout} (${topLayout.sharePct}% рынка).`
      : null,
    topBg ? `— Популярный фон: ${topBg.type} (${topBg.sharePct}%).` : null,
    topFont ? `— Популярный стиль шрифта: ${topFont.style} (${topFont.sharePct}%).` : null,
    `— Перегруз текста: ${stats.textHeavyPct}% карточек.`,
    `— Средний оценочный CTR рынка: ${stats.avgEstimatedCTR.toFixed(1)}%.`,
    "",
    "Слабые места рынка:",
    ...weaknesses.slice(0, 3).map((w) => `• ${w.issue} (${w.sharePct}%)`),
    "",
    "Не копируй конкурентов. Используй статистику как ориентир для превосходства.",
  ].filter(Boolean);

  return lines.join("\n");
}

export function buildOpportunityContext(opportunities: MarketOpportunity[]): string {
  if (opportunities.length === 0) return "";

  const lines = [
    "ВОЗМОЖНОСТИ ОБОГНАТЬ РЫНОК:",
    ...opportunities.slice(0, 5).map(
      (o, i) => `${i + 1}. ${o.recommendation} (impact ${(o.impactScore * 100).toFixed(0)}%)`,
    ),
    "",
    "Цель — не повторить рынок, а выделиться при сохранении высокого Design Score.",
  ];

  return lines.join("\n");
}

export function buildAgentSnippet(
  stats: MarketStatistics,
  opportunities: MarketOpportunity[],
): string {
  const topOpp = opportunities[0];
  if (!topOpp) {
    return `Рынок: avg product ${stats.avgProductScale.toFixed(0)}%, white bg ${stats.whiteBackgroundPct}%.`;
  }
  return `Рынок WB: товар ${stats.avgProductScale.toFixed(0)}%, белый фон ${stats.whiteBackgroundPct}%. Главная возможность: ${topOpp.recommendation}`;
}

export function buildNoveltyHints(opportunities: MarketOpportunity[]): string[] {
  return [
    "Оценивай новизну: карточка не должна выглядеть как 80% конкурентов",
    ...opportunities.slice(0, 3).map((o) => `Избегай: ${o.marketPattern} (${o.marketSharePct}% рынка)`),
  ];
}

export function assembleMarketContext(input: {
  category: KnowledgeCategory;
  marketVersion: number;
  stats: MarketStatistics;
  opportunities: MarketOpportunity[];
  weaknesses: MarketWeakness[];
  designRecommendations: string[];
  preferredLayouts: string[];
  avoidLayouts: string[];
}): MarketIntelligenceContext {
  const knowledgeContext = buildKnowledgeContext(
    input.category,
    input.stats,
    input.opportunities,
    input.weaknesses,
  );
  const opportunityContext = buildOpportunityContext(input.opportunities);

  return {
    category: input.category,
    marketVersion: input.marketVersion,
    productsAnalyzed: input.stats.productsAnalyzed,
    knowledgeContext,
    opportunityContext: buildOpportunityContext(input.opportunities),
    agentSnippet: buildAgentSnippet(input.stats, input.opportunities),
    statistics: input.stats,
    opportunities: input.opportunities,
    weaknesses: input.weaknesses,
    designRecommendations: input.designRecommendations,
    preferredLayouts: input.preferredLayouts,
    avoidLayouts: input.avoidLayouts,
    noveltyHints: buildNoveltyHints(input.opportunities),
  };
}

export function buildCombinedMarketPromptBlock(ctx: MarketIntelligenceContext): string {
  return [ctx.knowledgeContext, ctx.opportunityContext].filter(Boolean).join("\n\n");
}
