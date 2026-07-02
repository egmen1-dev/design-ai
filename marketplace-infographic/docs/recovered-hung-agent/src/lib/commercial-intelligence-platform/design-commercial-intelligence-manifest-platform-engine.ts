/**
 * Chapter 11.20 — Commercial Intelligence Manifest Platform
 * Final architectural document for the Commercial Intelligence Platform.
 */
import { runCommercialIntelligencePlatformSummary } from "./design-commercial-intelligence-platform-summary-engine";
import {
  FUTURE_VISION_CAPABILITIES,
  MANIFEST_COMPONENTS,
  MANIFEST_CONSTRAINTS,
  MANIFEST_LAYERS,
  MANIFEST_PRINCIPLES,
  ManifestModule,
  type ManifestLayerId,
  type ManifestModuleId,
  type ManifestPlatformReport,
} from "./design-commercial-intelligence-manifest-platform-types";
import type { CommercialPlatformInput } from "./types";

export const MANIFEST_PLATFORM_VERSION = "11.20.0";
export const MANIFEST_PLATFORM_CONTRACT_ID = "design-commercial-intelligence-manifest-platform" as const;

export const MANIFEST_GOLDEN_RULE =
  "Any commercial decision must be understandable, justified, measurable, verifiable, explainable, " +
  "adaptive, and directed toward the user's real business goal. " +
  "Commercial Intelligence exists for commercial advantage — not for design generation.";

export const MANIFEST_MISSION =
  "Create a system that understands commerce as deeply as an experienced commercial director. " +
  "The image is only a tool — the true goal is the user's business result.";

export const MANIFEST_MODULES: readonly { id: ManifestModuleId; order: number }[] = [
  { id: ManifestModule.MANIFEST_CATALOG, order: 1 },
  { id: ManifestModule.MISSION_REGISTRY, order: 2 },
  { id: ManifestModule.PRINCIPLES_CODEX, order: 3 },
  { id: ManifestModule.RESPONSIBILITY_BOUNDARY, order: 4 },
  { id: ManifestModule.IO_CATALOG, order: 5 },
  { id: ManifestModule.FUTURE_VISION, order: 6 },
  { id: ManifestModule.REPORT_BUILDER, order: 7 },
];

export const DOWNSTREAM_PLATFORMS = [
  "creative-intelligence-platform",
  "visual-intelligence-platform",
  "rendering-platform",
  "continuous-learning-platform",
] as const;

export function executeCommercialIntelligenceManifestPlatform(
  platform?: CommercialPlatformInput,
): ManifestPlatformReport {
  const summary = runCommercialIntelligencePlatformSummary(platform);
  const complianceFlags: ManifestPlatformReport["complianceFlags"] = [];

  if (!summary.creativeHandoffReady) {
    complianceFlags.push("designGenerationOverCommercialAdvantage");
  }

  const goldenRuleUpheld =
    summary.valid &&
    summary.qualityScore >= 75 &&
    !complianceFlags.includes("designGenerationOverCommercialAdvantage");

  const layersCompleted: ManifestLayerId[] = [...MANIFEST_LAYERS];

  return {
    valid: goldenRuleUpheld,
    version: MANIFEST_PLATFORM_VERSION,
    contractId: MANIFEST_PLATFORM_CONTRACT_ID,
    mediatorId: "design-commercial-intelligence-platform-summary",
    modulesCompleted: MANIFEST_MODULES.map((m) => m.id),
    layersCompleted,
    principlesCount: MANIFEST_PRINCIPLES.length,
    constraintsCount: MANIFEST_CONSTRAINTS.length,
    futureCapabilitiesCount: FUTURE_VISION_CAPABILITIES.length,
    complianceFlags,
    pipelineEvents: [
      "design_commercial_intelligence_platform_summary_complete",
      "design_commercial_intelligence_manifest_platform",
      "design_commercial_intelligence_manifest_complete",
    ],
    goldenRuleUpheld,
  };
}

export function runCommercialIntelligenceManifestPlatform(): ManifestPlatformReport {
  return executeCommercialIntelligenceManifestPlatform();
}

export {
  MANIFEST_COMPONENTS,
  MANIFEST_CONSTRAINTS,
  MANIFEST_LAYERS,
  MANIFEST_PRINCIPLES,
  FUTURE_VISION_CAPABILITIES,
};
