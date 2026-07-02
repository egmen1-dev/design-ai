/**
 * Design AI Book — unified pipeline chapters 8→11
 * Correct book model (not deprecated design-ai-os).
 */
import { runDesignKnowledgePlatform } from "../design-knowledge-platform/sections";
import { runIntelligentOrchestrationPlatform } from "../intelligent-orchestration-platform/sections";
import { runHumanAiCollaboration } from "../human-ai-collaboration/sections";
import { executeCommercialIntelligenceManifestPlatform } from "../commercial-intelligence-platform";
import { runAllEcosystemEngines } from "../commercial-intelligence-platform/ecosystem-engine-runners";
import type { CommercialPlatformInput } from "../commercial-intelligence-platform/types";

export type DesignAiBookPipelineInput = CommercialPlatformInput;

export type DesignAiBookPipelineReport = {
  valid: boolean;
  chaptersCompleted: number[];
  ch8: ReturnType<typeof runDesignKnowledgePlatform>;
  ch9: ReturnType<typeof runIntelligentOrchestrationPlatform>;
  ch10: ReturnType<typeof runHumanAiCollaboration>;
  ch11EcosystemEngines: number;
  ch11ManifestValid: boolean;
  finalHandoffEvent: string;
};

export const DEFAULT_BOOK_PIPELINE_INPUT: DesignAiBookPipelineInput = {
  productCategory: "garden",
  productName: "Battery Sprayer 5L",
  businessGoal: "Win garden season on Wildberries",
  marketplaceId: "wildberries",
  priceRub: 3200,
  targetAudience: "home gardeners",
};

export function runDesignAiBookPipeline(
  input: DesignAiBookPipelineInput = DEFAULT_BOOK_PIPELINE_INPUT,
): DesignAiBookPipelineReport {
  const ch8 = runDesignKnowledgePlatform({
    productCategory: input.productCategory,
    marketplaceId: input.marketplaceId,
  });
  const ch9 = runIntelligentOrchestrationPlatform();
  const ch10 = runHumanAiCollaboration();
  const { reports } = runAllEcosystemEngines(input);
  const manifest = executeCommercialIntelligenceManifestPlatform(input);

  const valid =
    ch8.valid &&
    ch9.valid &&
    ch10.valid &&
    reports.every((r) => r.valid) &&
    manifest.valid;

  return {
    valid,
    chaptersCompleted: [8, 9, 10, 11],
    ch8,
    ch9,
    ch10,
    ch11EcosystemEngines: reports.length,
    ch11ManifestValid: manifest.valid,
    finalHandoffEvent: "design_commercial_intelligence_manifest_complete",
  };
}
