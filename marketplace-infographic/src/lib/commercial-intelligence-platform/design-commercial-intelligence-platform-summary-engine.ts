/**
 * Chapter 11.19 — Commercial Intelligence Platform Summary (capstone)
 */
import { ECOSYSTEM_ENGINES, runEcosystemEngineChain } from "./ecosystem-engines";
import {
  buildDefaultConstitutionInput,
  executeCommercialConstitutionPlatform,
} from "./design-commercial-constitution-platform-engine";
import type { CommercialPlatformInput } from "./types";
import {
  PLATFORM_SUMMARY_COMPONENTS,
  PLATFORM_SUMMARY_LAYERS,
  PLATFORM_SUMMARY_PRINCIPLES,
  PlatformSummaryModule,
  type PlatformSummaryInput,
  type PlatformSummaryLayerId,
  type PlatformSummaryModuleId,
  type PlatformSummaryReport,
} from "./design-commercial-intelligence-platform-summary-types";

export const PLATFORM_SUMMARY_VERSION = "11.19.0";
export const PLATFORM_SUMMARY_CONTRACT_ID = "design-commercial-intelligence-platform-summary" as const;

export const PLATFORM_SUMMARY_GOLDEN_RULE =
  "Commercial intelligence is a unified ecosystem, not isolated agents. " +
  "Every output must amplify business results — aesthetics serve commerce, never the reverse.";

export const PLATFORM_SUMMARY_MODULES: readonly { id: PlatformSummaryModuleId; order: number }[] = [
  { id: PlatformSummaryModule.SUMMARY_CATALOG, order: 1 },
  { id: PlatformSummaryModule.ECOSYSTEM_CATALOG, order: 2 },
  { id: PlatformSummaryModule.WORKFLOW_COORDINATOR, order: 3 },
  { id: PlatformSummaryModule.OUTPUT_SYNTHESIZER, order: 4 },
  { id: PlatformSummaryModule.CROSS_PLATFORM_BRIDGE, order: 5 },
  { id: PlatformSummaryModule.EVOLUTION_TRACKER, order: 6 },
  { id: PlatformSummaryModule.REPORT_BUILDER, order: 7 },
];

const INTELLIGENCE_OUTPUTS = [
  "designIntent",
  "designSpecification",
  "priorities",
  "constraints",
  "ctrForecast",
  "conversionForecast",
  "revenueForecast",
  "readiness",
  "qualityScore",
  "constitutionReport",
] as const;

export function executeCommercialIntelligencePlatformSummary(
  input: PlatformSummaryInput,
): PlatformSummaryReport {
  const constitution = executeCommercialConstitutionPlatform(
    buildDefaultConstitutionInput(input.platform),
  );
  const { forecasts } = runEcosystemEngineChain(input.platform);

  const complianceFlags: PlatformSummaryReport["complianceFlags"] = [];
  if (!constitution.valid) complianceFlags.push("aestheticsOverBusiness");

  const qualityScore = Math.round(
    (constitution.principlesUpheld.length / 10) * 40 +
      forecasts.confidence * 40 +
      (input.constitutionReportValid ? 20 : 0),
  );

  const layersCompleted: PlatformSummaryLayerId[] = [...PLATFORM_SUMMARY_LAYERS];
  const creativeHandoffReady =
    constitution.valid && input.constitutionReportValid && qualityScore >= 75;

  return {
    valid: creativeHandoffReady,
    version: PLATFORM_SUMMARY_VERSION,
    contractId: PLATFORM_SUMMARY_CONTRACT_ID,
    mediatorId: "design-commercial-constitution",
    modulesCompleted: PLATFORM_SUMMARY_MODULES.map((m) => m.id),
    layersCompleted,
    ecosystemEngineCount: ECOSYSTEM_ENGINES.length,
    intelligenceOutputs: [...INTELLIGENCE_OUTPUTS],
    complianceFlags,
    qualityScore,
    creativeHandoffReady,
    pipelineEvents: [
      "design_commercial_constitution_complete",
      "design_commercial_intelligence_platform_summary",
      "design_commercial_intelligence_platform_summary_complete",
    ],
  };
}

export function buildDefaultPlatformInput(): CommercialPlatformInput {
  return {
    productCategory: "garden",
    productName: "Battery Sprayer 5L",
    businessGoal: "Win garden season on Wildberries",
    marketplaceId: "wildberries",
    priceRub: 3200,
    targetAudience: "home gardeners",
    userSegment: "practical_buyer",
  };
}

export function runCommercialIntelligencePlatformSummary(
  platform?: CommercialPlatformInput,
): PlatformSummaryReport {
  const p = platform ?? buildDefaultPlatformInput();
  const constitution = executeCommercialConstitutionPlatform(buildDefaultConstitutionInput(p));
  return executeCommercialIntelligencePlatformSummary({
    constitutionReportValid: constitution.valid,
    platform: p,
  });
}

export {
  PLATFORM_SUMMARY_COMPONENTS,
  PLATFORM_SUMMARY_LAYERS,
  PLATFORM_SUMMARY_PRINCIPLES,
};
