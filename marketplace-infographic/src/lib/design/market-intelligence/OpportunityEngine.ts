import type { MarketOpportunity, MarketStatistics, MarketWeakness } from "./types";

export function findMarketOpportunities(stats: MarketStatistics): MarketOpportunity[] {
  const opportunities: MarketOpportunity[] = [];

  if (stats.whiteBackgroundPct >= 70) {
    opportunities.push({
      id: "bg_contextual",
      type: "background",
      marketPattern: "white_studio",
      marketSharePct: stats.whiteBackgroundPct,
      recommendation:
        "Использовать контекстный фон (двор, гараж, терраса, интерьер) вместо белого студийного — выделиться в выдаче",
      targetValue: "contextual_scene",
      impactScore: 0.92,
    });
  }

  if (stats.avgProductScale < 60) {
    opportunities.push({
      id: "scale_hero",
      type: "scale",
      marketPattern: "small_product",
      marketSharePct: stats.avgProductScale,
      recommendation: `Увеличить товар до 66–70% кадра (рынок: ${stats.avgProductScale.toFixed(0)}%)`,
      targetValue: 68,
      impactScore: 0.88,
    });
  }

  if (stats.textHeavyPct >= 55) {
    opportunities.push({
      id: "text_minimal",
      type: "text",
      marketPattern: "text_overload",
      marketSharePct: stats.textHeavyPct,
      recommendation: "Минимум текста: одна главная характеристика, остальное на 2-й слайд",
      targetValue: "one_hero_message",
      impactScore: 0.85,
    });
  }

  if (stats.avgBadgeCount >= 2.2) {
    opportunities.push({
      id: "badge_reduce",
      type: "composition",
      marketPattern: "badge_clutter",
      marketSharePct: stats.avgBadgeCount * 30,
      recommendation: "Одна плашка максимум — рынок перегружен бейджами",
      targetValue: 1,
      impactScore: 0.78,
    });
  }

  const topLayout = stats.popularLayouts[0];
  if (topLayout && topLayout.sharePct >= 45) {
    opportunities.push({
      id: "layout_differentiate",
      type: "layout",
      marketPattern: topLayout.layout,
      marketSharePct: topLayout.sharePct,
      recommendation: `Избегать шаблонного layout «${topLayout.layout}» — использовать асимметрию или hero-композицию`,
      targetValue: "asymmetric_hero",
      impactScore: 0.8,
    });
  }

  if (stats.studioBackgroundPct >= 60 && stats.lifestyleBackgroundPct < 25) {
    opportunities.push({
      id: "lighting_warm",
      type: "lighting",
      marketPattern: "flat_studio",
      marketSharePct: stats.studioBackgroundPct,
      recommendation: "Тёплое направленное освещение с мягкой тенью — рынок выглядит плоско",
      targetValue: "warm_directional",
      impactScore: 0.76,
    });
  }

  if (stats.avgNegativeSpace < 22) {
    opportunities.push({
      id: "space_breath",
      type: "composition",
      marketPattern: "crowded_frame",
      marketSharePct: 100 - stats.avgNegativeSpace,
      recommendation: "Больше воздуха вокруг товара — минимум 25% negative space",
      targetValue: 28,
      impactScore: 0.82,
    });
  }

  return opportunities.sort((a, b) => b.impactScore - a.impactScore);
}

export function findMarketWeaknesses(stats: MarketStatistics): MarketWeakness[] {
  const weaknesses: MarketWeakness[] = [];

  if (stats.whiteBackgroundPct >= 65) {
    weaknesses.push({
      pattern: "white_studio_background",
      sharePct: stats.whiteBackgroundPct,
      issue: "Однотипные белые фоны — карточки сливаются в выдаче",
    });
  }
  if (stats.avgProductScale < 58) {
    weaknesses.push({
      pattern: "undersized_product",
      sharePct: stats.avgProductScale,
      issue: "Товар слишком мал — слабый визуальный якорь",
    });
  }
  if (stats.textHeavyPct >= 50) {
    weaknesses.push({
      pattern: "text_overload",
      sharePct: stats.textHeavyPct,
      issue: "Перегруз текста — покупатель не считывает за 1 секунду",
    });
  }

  return weaknesses;
}

export function buildDesignRecommendations(
  stats: MarketStatistics,
  opportunities: MarketOpportunity[],
): string[] {
  const recs = opportunities.slice(0, 6).map((o) => o.recommendation);

  if (stats.minimalTextPct < 20) {
    recs.push("На рынке мало минималистичных карточек — минимализм = конкурентное преимущество");
  }
  if (stats.avgEstimatedCTR < 6) {
    recs.push("Средний CTR рынка низкий — сильная визуальная история даст преимущество");
  }

  return [...new Set(recs)];
}

export function mapOpportunityToLayouts(opportunities: MarketOpportunity[]): {
  preferred: string[];
  avoid: string[];
} {
  const preferred = new Set<string>();
  const avoid = new Set<string>();

  for (const opp of opportunities) {
    if (opp.type === "layout") {
      avoid.add(String(opp.marketPattern));
      preferred.add(String(opp.targetValue ?? "hero_left"));
    }
    if (opp.type === "scale") {
      preferred.add("hero_left");
      preferred.add("focus");
      preferred.add("commercial");
    }
    if (opp.type === "composition") {
      preferred.add("minimal");
      preferred.add("premium");
      preferred.add("floating");
    }
  }

  if (preferred.size === 0) {
    preferred.add("hero_left");
    preferred.add("commercial");
    preferred.add("modern");
  }

  return {
    preferred: [...preferred],
    avoid: [...avoid],
  };
}
