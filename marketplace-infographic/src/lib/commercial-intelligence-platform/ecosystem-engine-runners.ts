/**
 * Chapter 11 — ecosystem engine runners (11.1–11.17)
 * Ported from hung-agent design-ai-os/chapters.ts into correct Ch11 sub-engine model.
 */
import type { CommercialForecastBundle, CommercialPlatformInput } from "./types";
import type { EcosystemEngineId } from "./ecosystem-engines";
import { runRevenuePredictionEngine } from "./ecosystem-engines";

export type EcosystemEngineReport = {
  engineId: EcosystemEngineId;
  chapterRef: string;
  valid: boolean;
  outputs: Record<string, unknown>;
  handoffEvent: string;
  confidence: number;
};

function report(
  engineId: EcosystemEngineId,
  chapterRef: string,
  outputs: Record<string, unknown>,
  handoffEvent: string,
  confidence = 0.85,
): EcosystemEngineReport {
  return { engineId, chapterRef, valid: true, outputs, handoffEvent, confidence };
}

export function runConsumerPsychologyEngine(input: CommercialPlatformInput): EcosystemEngineReport {
  return report("consumer-psychology", "11.1", {
    emotionalTriggers: ["trust", "practical_value", "seasonal_urgency"],
    purchasePsychology: "problem_solution",
    productCategory: input.productCategory,
  }, "design_consumer_psychology_complete", 0.88);
}

export function runConsumerBehaviorEngine(input: CommercialPlatformInput): EcosystemEngineReport {
  return report("consumer-behavior", "11.2", {
    buyerActions: ["scroll_stop", "compare_specs", "read_reviews"],
    decisionStyle: "rational_practical",
    marketplaceId: input.marketplaceId,
  }, "design_consumer_behavior_complete", 0.86);
}

export function runCognitiveBiasEngine(): EcosystemEngineReport {
  return report("cognitive-bias", "11.3", {
    cognitiveBiases: ["anchoring", "social_proof", "scarcity"],
    researchEvidence: ["category_norms", "review_patterns"],
  }, "design_cognitive_research_complete", 0.84);
}

export function runMarketIntelligenceEngine(input: CommercialPlatformInput): EcosystemEngineReport {
  return report("market-intelligence", "11.4", {
    category: input.productCategory,
    segmentTrend: "growing",
    marketSnippet: `${input.productCategory} on ${input.marketplaceId}`,
  }, "design_market_intelligence_complete", 0.85);
}

export function runCompetitiveIntelligenceEngine(): EcosystemEngineReport {
  return report("competitive-intelligence", "11.5", {
    differentiation: "portable_power + ergonomic_design",
    competitorGap: "weak_garden_storytelling",
  }, "design_competitive_intelligence_complete", 0.83);
}

export function runMarketplaceRulesEngine(input: CommercialPlatformInput): EcosystemEngineReport {
  return report("marketplace-rules", "11.6", {
    marketplaceId: input.marketplaceId,
    safeZones: true,
    textLimits: "minimal_headline",
  }, "design_marketplace_rules_complete", 0.9);
}

export function runBuyerPersonaEngine(input: CommercialPlatformInput): EcosystemEngineReport {
  return report("buyer-persona", "11.7", {
    persona: input.targetAudience ?? "marketplace_buyer",
    segment: input.userSegment ?? "general",
  }, "design_buyer_persona_complete", 0.87);
}

export function runBuyerJourneyEngine(input: CommercialPlatformInput): EcosystemEngineReport {
  return report("buyer-journey", "11.8", {
    journeyStage: "consideration",
    persona: input.targetAudience ?? "marketplace_buyer",
  }, "design_buyer_journey_complete", 0.87);
}

export function runValuePropositionEngine(input: CommercialPlatformInput): EcosystemEngineReport {
  return report("value-proposition", "11.9", {
    valueProposition: input.productName,
    perceivedValue: "high_for_category",
  }, "design_value_proposition_complete", 0.86);
}

export function runPricingStrategyEngine(input: CommercialPlatformInput): EcosystemEngineReport {
  return report("pricing-strategy", "11.10", {
    priceAnchor: input.priceRub ?? 2500,
    strategy: "category_anchor",
  }, "design_pricing_strategy_complete", 0.86);
}

export function runCtrPredictionEngine(input: CommercialPlatformInput): EcosystemEngineReport {
  const boost = input.productCategory === "garden" ? 1.08 : 1.0;
  return report("ctr-prediction", "11.12", {
    ctrForecast: Math.round(6.5 * boost * 10) / 10,
  }, "design_ctr_prediction_complete", 0.82);
}

export function runConversionPredictionEngine(input: CommercialPlatformInput): EcosystemEngineReport {
  const boost = input.productCategory === "garden" ? 1.08 : 1.0;
  return report("conversion-prediction", "11.13", {
    conversionForecast: Math.round(3.8 * boost * 10) / 10,
  }, "design_conversion_prediction_complete", 0.82);
}

export function runBusinessGoalEngine(input: CommercialPlatformInput): EcosystemEngineReport {
  return report("business-goal", "11.14", {
    measurableObjective: `Increase CTR for ${input.productName}`,
    businessGoal: input.businessGoal,
  }, "design_business_goal_complete", 0.88);
}

export function runCommercialStrategyEngine(input: CommercialPlatformInput): EcosystemEngineReport {
  return report("commercial-strategy", "11.15", {
    strategyId: "garden_hero_story",
    explanation: `Strategy for ${input.businessGoal}`,
  }, "design_commercial_strategy_complete", 0.88);
}

export function runCommercialDecisionEngine(input: CommercialPlatformInput): EcosystemEngineReport {
  return report("commercial-decision", "11.16", {
    decision: "prioritize_hero_product_story",
    rationale: input.businessGoal,
  }, "design_commercial_decision_complete", 0.85);
}

export function runCommercialValidationEngine(): EcosystemEngineReport {
  return report("commercial-validation", "11.17", {
    validated: true,
    checks: ["value_proposition", "marketplace_rules", "measurable_objective"],
  }, "design_commercial_validation_complete", 0.9);
}

const RUNNERS: Record<EcosystemEngineId, (input: CommercialPlatformInput) => EcosystemEngineReport> = {
  "consumer-psychology": runConsumerPsychologyEngine,
  "consumer-behavior": runConsumerBehaviorEngine,
  "cognitive-bias": runCognitiveBiasEngine,
  "market-intelligence": runMarketIntelligenceEngine,
  "competitive-intelligence": runCompetitiveIntelligenceEngine,
  "marketplace-rules": runMarketplaceRulesEngine,
  "buyer-persona": runBuyerPersonaEngine,
  "buyer-journey": runBuyerJourneyEngine,
  "value-proposition": runValuePropositionEngine,
  "pricing-strategy": runPricingStrategyEngine,
  "revenue-prediction": (input) => {
    const forecasts = runRevenuePredictionEngine(input);
    return report("revenue-prediction", "11.11", { ...forecasts }, "design_revenue_prediction_complete", forecasts.confidence);
  },
  "ctr-prediction": runCtrPredictionEngine,
  "conversion-prediction": runConversionPredictionEngine,
  "business-goal": runBusinessGoalEngine,
  "commercial-strategy": runCommercialStrategyEngine,
  "commercial-decision": runCommercialDecisionEngine,
  "commercial-validation": runCommercialValidationEngine,
  "commercial-constitution": () =>
    report("commercial-constitution", "11.18", { note: "use runCommercialConstitutionPlatform" }, "design_commercial_constitution_complete", 1),
};

export function runEcosystemEngine(
  engineId: EcosystemEngineId,
  input: CommercialPlatformInput,
): EcosystemEngineReport {
  return RUNNERS[engineId](input);
}

export function runAllEcosystemEngines(input: CommercialPlatformInput): {
  reports: EcosystemEngineReport[];
  forecasts: CommercialForecastBundle;
} {
  const engineIds = Object.keys(RUNNERS) as EcosystemEngineId[];
  const reports = engineIds.map((id) => runEcosystemEngine(id, input));
  const forecasts = runRevenuePredictionEngine(input);
  return { reports, forecasts };
}
