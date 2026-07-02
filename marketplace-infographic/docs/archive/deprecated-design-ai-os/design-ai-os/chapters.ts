/**
 * Design AI OS — Chapters 1–10 platform engines (one module per whole chapter)
 */
import type { OsChapterId, OsPlatformContext, OsPlatformReport } from "./registry";
import { getOsPlatform } from "./registry";

function baseReport(
  chapter: OsChapterId,
  outputs: Record<string, unknown>,
  event: string,
): OsPlatformReport {
  const def = getOsPlatform(chapter);
  return {
    chapter,
    contractId: def.contractId,
    version: def.version,
    valid: true,
    outputs,
    handoffEvent: event,
  };
}

export function runChapterPlatform(
  chapter: OsChapterId,
  ctx: OsPlatformContext,
  prior: OsPlatformReport[] = [],
): OsPlatformReport {
  switch (chapter) {
    case 1:
      return baseReport(1, {
        emotionalTriggers: ["trust", "practical_value", "seasonal_urgency"],
        purchasePsychology: "problem_solution",
        confidence: 0.88,
      }, "design_consumer_psychology_complete");
    case 2:
      return baseReport(2, {
        buyerActions: ["scroll_stop", "compare_specs", "read_reviews"],
        decisionStyle: "rational_practical",
        confidence: 0.86,
      }, "design_consumer_behavior_complete");
    case 3:
      return baseReport(3, {
        cognitiveBiases: ["anchoring", "social_proof", "scarcity"],
        researchEvidence: ["category_norms", "review_patterns"],
        confidence: 0.84,
      }, "design_cognitive_research_complete");
    case 4:
      return baseReport(4, {
        category: ctx.productCategory,
        segmentTrend: "growing",
        marketSnippet: `${ctx.productCategory} on ${ctx.marketplaceId}`,
        confidence: 0.85,
      }, "design_market_intelligence_complete");
    case 5:
      return baseReport(5, {
        differentiation: "portable_power + ergonomic_design",
        competitorGap: "weak_garden_storytelling",
        confidence: 0.83,
      }, "design_competitive_intelligence_complete");
    case 6:
      return baseReport(6, {
        marketplaceId: ctx.marketplaceId,
        safeZones: true,
        textLimits: "minimal_headline",
        confidence: 0.9,
      }, "design_marketplace_rules_complete");
    case 7:
      return baseReport(7, {
        persona: ctx.targetAudience ?? "marketplace_buyer",
        journeyStage: "consideration",
        confidence: 0.87,
      }, "design_buyer_intelligence_complete");
    case 8:
      return baseReport(8, {
        valueProposition: ctx.productName,
        priceAnchor: ctx.priceRub ?? 2500,
        perceivedValue: "high_for_category",
        confidence: 0.86,
      }, "design_value_pricing_complete");
    case 9:
      return baseReport(9, {
        strategyId: "garden_hero_story",
        measurableObjective: `Increase CTR for ${ctx.productName}`,
        explanation: `Strategy for ${ctx.businessGoal}`,
        confidence: 0.88,
      }, "design_commercial_strategy_complete");
    case 10: {
      const boost = ctx.productCategory === "garden" ? 1.08 : 1.0;
      return baseReport(10, {
        ctrForecast: Math.round(6.5 * boost * 10) / 10,
        conversionForecast: Math.round(3.8 * boost * 10) / 10,
        revenueForecast: Math.round((ctx.priceRub ?? 2500) * 0.065 * 0.038 * 1000),
        priorChaptersUsed: prior.length,
        confidence: 0.82,
      }, "design_commercial_prediction_complete");
    }
    default:
      throw new Error(`Chapter ${chapter} uses commercial-intelligence-platform module`);
  }
}

export const CHAPTER_GOLDEN_RULES: Record<OsChapterId, string> = {
  1: "Purchase psychology drives every commercial decision — never assume without evidence.",
  2: "Buyer behavior on marketplace is measurable — model actions, not opinions.",
  3: "Cognitive patterns must be research-backed — no manipulation without evidence.",
  4: "Market intelligence grounds strategy in category reality.",
  5: "Differentiation must be provable against real competitors.",
  6: "Marketplace rules are hard constraints — never violate platform safe zones.",
  7: "Buyer persona and journey define who sees the product and when.",
  8: "Value and price perception determine conversion more than aesthetics.",
  9: "Commercial strategy must have measurable objectives and explanation.",
  10: "Predictions must be quantified — CTR, conversion, revenue forecasts required.",
  11: "Commercial Intelligence exists for commercial advantage — not design generation.",
};
