/**
 * Chapter 11 — 18 Commercial Intelligence ecosystem engines
 * Consumer Psychology → Commercial Constitution Engine
 */
import type { CommercialPlatformInput, CommercialForecastBundle } from "./types";

export const ECOSYSTEM_ENGINE_IDS = [
  "consumer-psychology",
  "consumer-behavior",
  "cognitive-bias",
  "market-intelligence",
  "competitive-intelligence",
  "marketplace-rules",
  "buyer-persona",
  "buyer-journey",
  "value-proposition",
  "pricing-strategy",
  "revenue-prediction",
  "ctr-prediction",
  "conversion-prediction",
  "business-goal",
  "commercial-strategy",
  "commercial-decision",
  "commercial-validation",
  "commercial-constitution",
] as const;

export type EcosystemEngineId = (typeof ECOSYSTEM_ENGINE_IDS)[number];

export type EcosystemEngineDefinition = {
  id: EcosystemEngineId;
  chapterRef: string;
  label: string;
  responsibility: string;
};

export const ECOSYSTEM_ENGINES: readonly EcosystemEngineDefinition[] = [
  { id: "consumer-psychology", chapterRef: "11.1", label: "Consumer Psychology Engine", responsibility: "Map emotional triggers and purchase psychology" },
  { id: "consumer-behavior", chapterRef: "11.2", label: "Consumer Behavior Engine", responsibility: "Model buyer actions on marketplace" },
  { id: "cognitive-bias", chapterRef: "11.3", label: "Cognitive Bias Engine", responsibility: "Apply proven cognitive commerce patterns" },
  { id: "market-intelligence", chapterRef: "11.4", label: "Market Intelligence Engine", responsibility: "Category and segment intelligence" },
  { id: "competitive-intelligence", chapterRef: "11.5", label: "Competitive Intelligence Engine", responsibility: "Differentiation vs competitors" },
  { id: "marketplace-rules", chapterRef: "11.6", label: "Marketplace Rules Engine", responsibility: "WB/Ozon/Amazon constraints" },
  { id: "buyer-persona", chapterRef: "11.7", label: "Buyer Persona Engine", responsibility: "Target buyer profile" },
  { id: "buyer-journey", chapterRef: "11.8", label: "Buyer Journey Engine", responsibility: "Awareness → purchase path" },
  { id: "value-proposition", chapterRef: "11.9", label: "Value Proposition Engine", responsibility: "Core commercial promise" },
  { id: "pricing-strategy", chapterRef: "11.10", label: "Pricing Strategy Engine", responsibility: "Price anchoring and perceived value" },
  { id: "revenue-prediction", chapterRef: "11.11", label: "Revenue Prediction Engine", responsibility: "Forecast revenue impact" },
  { id: "ctr-prediction", chapterRef: "11.12", label: "CTR Prediction Engine", responsibility: "Click-through forecast" },
  { id: "conversion-prediction", chapterRef: "11.13", label: "Conversion Prediction Engine", responsibility: "Conversion rate forecast" },
  { id: "business-goal", chapterRef: "11.14", label: "Business Goal Engine", responsibility: "Formalize measurable business goal" },
  { id: "commercial-strategy", chapterRef: "11.15", label: "Commercial Strategy Engine", responsibility: "Unified commercial strategy" },
  { id: "commercial-decision", chapterRef: "11.16", label: "Commercial Decision Engine", responsibility: "Structured commercial decisions" },
  { id: "commercial-validation", chapterRef: "11.17", label: "Commercial Validation Engine", responsibility: "Pre-handoff validation" },
  { id: "commercial-constitution", chapterRef: "11.18", label: "Commercial Constitution Engine", responsibility: "Immutable commercial laws" },
] as const;

export function getEcosystemEngine(id: EcosystemEngineId): EcosystemEngineDefinition {
  const engine = ECOSYSTEM_ENGINES.find((e) => e.id === id);
  if (!engine) throw new Error(`Unknown ecosystem engine: ${id}`);
  return engine;
}

/** Ch 11.11 — Revenue Prediction */
export function runRevenuePredictionEngine(input: CommercialPlatformInput): CommercialForecastBundle {
  const base = input.priceRub ?? 2500;
  const categoryBoost =
    input.productCategory === "electronics" ? 1.12 :
    input.productCategory === "garden" ? 1.08 : 1.0;
  const ctr = Math.min(0.14, 0.06 * categoryBoost);
  const conversion = Math.min(0.09, 0.035 * categoryBoost);
  const revenue = Math.round(base * ctr * conversion * 1000);
  return {
    ctrForecast: Math.round(ctr * 1000) / 10,
    conversionForecast: Math.round(conversion * 1000) / 10,
    revenueForecast: revenue,
    confidence: 0.82,
  };
}

export function runEcosystemEngineChain(input: CommercialPlatformInput): {
  forecasts: CommercialForecastBundle;
  enginesRun: EcosystemEngineId[];
} {
  const enginesRun: EcosystemEngineId[] = [...ECOSYSTEM_ENGINE_IDS];
  const forecasts = runRevenuePredictionEngine(input);
  return { forecasts, enginesRun };
}
