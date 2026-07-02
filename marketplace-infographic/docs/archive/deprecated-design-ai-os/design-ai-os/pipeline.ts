/**
 * Design AI OS — runs platforms 1→11 in order, accumulates context.
 */
import type { CommercialPlatformInput } from "../commercial-intelligence-platform/types";
import { runCommercialIntelligenceManifestPlatform } from "../commercial-intelligence-platform";
import type { OsChapterId, OsPlatformContext, OsPlatformReport } from "./registry";
import { OS_PLATFORM_REGISTRY } from "./registry";
import { runChapterPlatform } from "./chapters";

export type OsPipelineReport = {
  valid: boolean;
  chaptersCompleted: OsChapterId[];
  reports: OsPlatformReport[];
  manifestValid: boolean;
  finalHandoffEvent: string;
};

export function toCommercialInput(ctx: OsPlatformContext): CommercialPlatformInput {
  return {
    productCategory: ctx.productCategory,
    productName: ctx.productName,
    businessGoal: ctx.businessGoal,
    marketplaceId: ctx.marketplaceId,
    priceRub: ctx.priceRub,
    targetAudience: ctx.targetAudience,
  };
}

export function runDesignAiOsPipeline(
  ctx: OsPlatformContext = {
    productCategory: "garden",
    productName: "Battery Sprayer 5L",
    businessGoal: "Win garden season on Wildberries",
    marketplaceId: "wildberries",
    priceRub: 3200,
    targetAudience: "home gardeners",
  },
): OsPipelineReport {
  const reports: OsPlatformReport[] = [];

  for (const def of OS_PLATFORM_REGISTRY) {
    if (def.chapter <= 10) {
      reports.push(runChapterPlatform(def.chapter, ctx, reports));
    }
  }

  const manifest = runCommercialIntelligenceManifestPlatform(toCommercialInput(ctx));
  const allValid = reports.every((r) => r.valid) && manifest.valid;

  return {
    valid: allValid,
    chaptersCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    reports,
    manifestValid: manifest.valid,
    finalHandoffEvent: "design_commercial_intelligence_manifest_complete",
  };
}
