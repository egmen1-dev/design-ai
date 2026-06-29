import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";
import { getCategoryTrends, analyzeTrendDirection } from "@/lib/design/market-intelligence";
import type { TrendSignal, ColorTrend, CompositionTrend, FontTrend } from "./types";
import {
  CATEGORY_COLOR_TRENDS,
  CATEGORY_COMPOSITION_TRENDS,
  GLOBAL_STYLE_SIGNALS,
} from "./types";

export async function collectMarketTrendSignals(
  category: KnowledgeCategory,
): Promise<{ risingLayouts: string[]; decliningLayouts: string[]; signals: TrendSignal[] }> {
  const history = await getCategoryTrends(category, 4);
  const signals: TrendSignal[] = [];

  const scaleDir = analyzeTrendDirection(history, "avgProductScale");
  if (scaleDir === "improving") {
    signals.push({
      id: "larger_product",
      label: "Larger product scale on WB",
      category,
      strength: 0.72,
      direction: "rising",
    });
  }

  const whiteBgDir = analyzeTrendDirection(history, "whiteBackgroundPct");
  if (whiteBgDir === "worsening") {
    signals.push({
      id: "colored_bg_rise",
      label: "Colored/lifestyle backgrounds rising",
      category,
      strength: 0.7,
      direction: "rising",
    });
  }

  const risingLayouts: string[] = [];
  const decliningLayouts: string[] = [];
  if (scaleDir === "improving") risingLayouts.push("hero_right", "commercial", "focus");
  if (whiteBgDir === "worsening") decliningLayouts.push("minimal");

  return { risingLayouts, decliningLayouts, signals };
}

export function collectAssetTrendSignals(): TrendSignal[] {
  return GLOBAL_STYLE_SIGNALS.filter((s) => s.direction === "rising").slice(0, 4);
}

export function collectColorTrends(category: KnowledgeCategory): ColorTrend[] {
  return CATEGORY_COLOR_TRENDS[category] ?? CATEGORY_COLOR_TRENDS.generic ?? [];
}

export function collectCompositionTrends(category: KnowledgeCategory): CompositionTrend[] {
  return CATEGORY_COMPOSITION_TRENDS[category] ?? CATEGORY_COMPOSITION_TRENDS.generic ?? [];
}

export function collectFontTrends(): FontTrend[] {
  return [
    { family: "Montserrat", tags: ["Modern", "Bold", "Marketplace"], visualImpact: 88 },
    { family: "Inter", tags: ["Minimal", "Corporate"], visualImpact: 82 },
    { family: "Manrope", tags: ["Premium", "Soft"], visualImpact: 79 },
  ];
}
