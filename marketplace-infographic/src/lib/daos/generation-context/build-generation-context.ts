import type { DAOSGenerationPolicy } from "../config/generation-mode";
import { computeGenerationContextCompleteness } from "./completeness";
import { resolveGenerationContextOperatingMode } from "./operating-mode";
import { freezeGenerationContext } from "./snapshot";
import type { GenerationContext, GenerationContextBuildInput } from "./types";
import {
  GENERATION_CONTEXT_CONSTITUTION_VERSION as CONSTITUTION_VERSION,
  GENERATION_CONTEXT_PROTOCOL_VERSION as PROTOCOL_VERSION,
  GENERATION_CONTEXT_SCHEMA_VERSION as SCHEMA_VERSION,
} from "./types";

function pickPolicySummary(policy: DAOSGenerationPolicy): GenerationContext["generationMode"]["policy"] {
  return {
    minimumFinalScore: policy.minimumFinalScore,
    allowFastShortcuts: policy.allowFastShortcuts,
    enableDebugBundle: policy.enableDebugBundle,
  };
}

function resolveMarketplaceLayout(layout?: string): GenerationContext["marketplace"]["layout"] {
  return layout === "marketplace" ? "marketplace" : "other";
}

/** Deterministic, side-effect-free builder for read-only GenerationContext snapshots. */
export function buildGenerationContext(input: GenerationContextBuildInput): GenerationContext {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const operatingMode = resolveGenerationContextOperatingMode();
  const productVerified = input.productAnalysis != null;

  const context: GenerationContext = {
    metadata: {
      generationId: `${input.projectId}:${input.runId}`,
      projectId: input.projectId,
      runId: input.runId,
      requestId: input.requestId,
      protocolVersion: PROTOCOL_VERSION,
      constitutionVersion: CONSTITUTION_VERSION,
      schemaVersion: SCHEMA_VERSION,
      createdAt,
    },
    product: {
      title: input.productAnalysis?.title,
      imagePath: input.finalImagePath,
      cutoutPath: input.productCutoutPath ?? undefined,
      aspectRatio: input.productAnalysis?.aspectRatio,
      attributes: input.productAnalysis?.attributes
        ? { ...input.productAnalysis.attributes }
        : undefined,
      analysisCategory: input.productAnalysis?.category,
      verified: productVerified,
    },
    marketplace: {
      layout: resolveMarketplaceLayout(input.layout),
      marketplaceId: input.marketplaceId,
      intelligenceActive: input.marketIntelligenceActive === true,
    },
    category: {
      primary: input.productAnalysis?.category,
      genomeKey: input.genomeKey,
      knowledgeCategory: input.knowledgeCategory,
      hints: input.productAnalysis?.category ? [input.productAnalysis.category] : undefined,
    },
    operatingMode,
    generationMode: {
      mode: input.generationMode,
      policy: pickPolicySummary(input.generationPolicy),
    },
    assets: {
      backgroundUrl: input.backgroundUrl ?? null,
      finalImagePath: input.finalImagePath,
      productImageInput: summarizeProductImageInput(input.productImage),
      existingImageId: input.existingImageId,
    },
    constraints: {
      style: input.style,
      renderModel: input.renderModel,
      regenerateBackgroundOnly: input.regenerateBackgroundOnly,
      fastGeneration: input.fastGeneration,
      constitutionVersion: input.constitutionVersion,
    },
    provider: {
      renderProvider: input.renderProvider,
      renderModel: input.renderModel,
      renderEngineVersion: input.renderEngineVersion,
      backgroundSource: input.backgroundSource,
      aiSource: input.aiSource,
    },
    diagnostics: {
      completenessScore: 0,
      missingFields: [],
      pipelineContextCompleteness: input.pipelineContextCompleteness,
    },
  };

  const completeness = computeGenerationContextCompleteness(context);
  context.diagnostics = {
    ...context.diagnostics,
    completenessScore: completeness.completenessScore,
    missingFields: completeness.missingFields,
  };

  return freezeGenerationContext(context);
}

function summarizeProductImageInput(productImage?: string): string | undefined {
  if (!productImage) return undefined;
  if (productImage.startsWith("data:image/")) {
    return "[data-url:omitted]";
  }
  return productImage;
}

export function isDaosGenerationContextEnabled(): boolean {
  const value = process.env.DAOS_GENERATION_CONTEXT?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}
