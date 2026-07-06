import type { DAOSProjectState } from "../core/project-state";
import {
  analyzeDaosMeaningLoss,
  confidenceBySpec,
  type DaosMeaningLossReport,
  type DaosMeaningLossWarning,
} from "./daos-meaning-loss";
import type { DAOSRenderDebugArtifact } from "./render-debug-bridge";
import type { DAOSGenerationMode, DAOSGenerationPolicy } from "../config/generation-mode";
import {
  getDaosGenerationPolicy,
  isPremiumGuardrailMode,
  summarizeDaosGenerationPolicy,
} from "../config/generation-mode";
import type { DAOSPipelineContextSummary } from "../pipeline/daos-pipeline-context";
import { summarizeDaosPipelineContext, createDaosPipelineContext } from "../pipeline/daos-pipeline-context";
import type { DAOSRenderEngineContextSummary } from "../adapters/render-engine-context-adapter";
import type { DAOSContextEffectAudit } from "../audit/context-effect-audit";
import type { ComposerQualityAudit } from "../audit/composer-quality-audit";
import { summarizeComposerQualityAudit } from "../audit/composer-quality-audit";
import type { OverlayQualityAudit } from "../audit/overlay-quality-audit";
import { summarizeOverlayQualityAudit } from "../audit/overlay-quality-audit";
import type { OverlayLayoutPatch } from "../overlay/overlay-layout-patch";
import type { GeometryWhitespacePatch } from "../overlay/geometry-whitespace-patch";
import type { ProductScaleAudit } from "../audit/product-scale-audit";
import { summarizeProductScaleAudit } from "../audit/product-scale-audit";
import type { ProductScalePatch } from "../compositor/product-scale-patch";
import type { NormalizedCompositePlacement } from "../compositor/composite-result-bridge";

export type DaosDebugBundle = {
  projectId: string;
  runId: string;
  createdAt: string;
  projectStateSummary: {
    status: DAOSProjectState["status"];
    architectureVersion: DAOSProjectState["architectureVersion"];
    decisionTraceCount: number;
    eventCount: number;
    debugArtifactCount: number;
  };
  specs: {
    brief?: DAOSProjectState["brief"];
    knowledgeSpec?: DAOSProjectState["knowledgeSpec"];
    commercialSpec?: DAOSProjectState["commercialSpec"];
    creativeSpec?: DAOSProjectState["creativeSpec"];
    visualBlueprint?: DAOSProjectState["visualBlueprint"];
    renderBlueprint?: DAOSProjectState["renderBlueprint"];
  };
  diagnostics: {
    specsAdapted: {
      brief: boolean;
      knowledge: boolean;
      commercial: boolean;
      creative: boolean;
      visual: boolean;
      render: boolean;
    };
    decisionTraceCount: number;
    missingSpecs: string[];
    confidenceBySpec: Record<string, number | undefined>;
    warnings: DaosMeaningLossWarning[];
    promptCaptured: boolean;
    modulesIgnoredCount: number;
    fallbackUsed: boolean;
    generationMode: DAOSGenerationMode;
    fastShortcutsAllowed: boolean;
    premiumGuardrailsActive: boolean;
    composerQualityScore?: number;
    composerQualityWarnings?: string[];
    productAreaRatio?: number;
    finalCompositionRisk?: number;
    overlayQualityScore?: number;
    overlayDensity?: number;
    overlayWarnings?: string[];
    pngOverlayFeelRisk?: number;
    law003WhitespaceViolation?: boolean;
    law014ContrastViolation?: boolean;
    overlayPatchEnabled?: boolean;
    overlayPatchApplied?: boolean;
    overlayPatchActions?: string[];
    overlayPatchBeforeDensity?: number;
    overlayPatchAfterDensity?: number;
    overlayPatchElementsBefore?: number;
    overlayPatchElementsAfter?: number;
    geometryWhitespacePatchEnabled?: boolean;
    geometryWhitespacePatchApplied?: boolean;
    geometryWhitespaceBefore?: number;
    geometryWhitespaceAfterEstimate?: number;
    geometryPatchActions?: string[];
    productScaleScore?: number;
    productDominanceScore?: number;
    productWidthRatio?: number;
    productHeightRatio?: number;
    emptySpaceEstimate?: number;
    sceneFillRisk?: number;
    productScalePatchEnabled?: boolean;
    productScalePatchApplied?: boolean;
    productScaleMultiplier?: number;
    productAreaBefore?: number;
    productAreaTarget?: number;
    productAreaAfterEstimate?: number;
    productScalePatchActions?: string[];
    compositePlacementFound?: boolean;
    compositePlacementSource?: string;
    compositeProductAreaRatio?: number;
    compositeProductWidthRatio?: number;
    compositeProductHeightRatio?: number;
  };
  generationMode: DAOSGenerationMode;
  generationPolicySummary: ReturnType<typeof summarizeDaosGenerationPolicy>;
  renderDebug?: DAOSRenderDebugArtifact;
  pipelineContextSummary?: DAOSPipelineContextSummary;
  promptContextBlockPreview?: string;
  promptContextInjected?: boolean;
  renderContextAttached?: boolean;
  renderContextSummary?: DAOSRenderEngineContextSummary;
  contextEffectAudit?: DAOSContextEffectAudit;
  composerQualityAudit?: ComposerQualityAudit;
  overlayQualityAudit?: OverlayQualityAudit;
  overlayLayoutPatch?: OverlayLayoutPatch;
  geometryWhitespacePatch?: GeometryWhitespacePatch;
  productScaleAudit?: ProductScaleAudit;
  productScalePatch?: ProductScalePatch;
  compositePlacement?: NormalizedCompositePlacement;
  meaningLossReport: DaosMeaningLossReport;
};

export function createDaosDebugBundle(
  state: DAOSProjectState,
  options?: {
    renderDebug?: DAOSRenderDebugArtifact;
    generationMode?: DAOSGenerationMode;
    generationPolicy?: DAOSGenerationPolicy;
    promptContextBlockPreview?: string;
    promptContextInjected?: boolean;
    promptContextEnabled?: boolean;
    renderContextAttached?: boolean;
    renderContextSummary?: DAOSRenderEngineContextSummary;
    renderContextEnabled?: boolean;
    useRenderEngineV17?: boolean;
    contextEffectAudit?: DAOSContextEffectAudit;
    daosV17BridgeEnabled?: boolean;
    daosV17ModulesBridgeEnabled?: boolean;
    daosV17CtrBridgeEnabled?: boolean;
    daosV17PromptCompressionEnabled?: boolean;
    composerQualityAudit?: ComposerQualityAudit;
    overlayQualityAudit?: OverlayQualityAudit;
    overlayLayoutPatch?: OverlayLayoutPatch;
    geometryWhitespacePatch?: GeometryWhitespacePatch;
    productScaleAudit?: ProductScaleAudit;
    productScalePatch?: ProductScalePatch;
    compositePlacement?: NormalizedCompositePlacement;
  },
): DaosDebugBundle {
  const renderDebug = options?.renderDebug;
  const generationMode =
    options?.generationMode ?? state.brief?.generationMode ?? "balanced";
  const generationPolicy =
    options?.generationPolicy ?? getDaosGenerationPolicy(generationMode);
  const generationPolicySummary = summarizeDaosGenerationPolicy(generationPolicy);
  const pipelineContextSummary = summarizeDaosPipelineContext(createDaosPipelineContext(state));
  const meaningLossReport = analyzeDaosMeaningLoss(state, {
    renderDebug,
    generationMode,
    promptContextEnabled: options?.promptContextEnabled,
    promptContextInjected: options?.promptContextInjected,
    renderContextEnabled: options?.renderContextEnabled,
    renderContextAttached: options?.renderContextAttached,
    useRenderEngineV17: options?.useRenderEngineV17,
    daosV17BridgeEnabled: options?.daosV17BridgeEnabled,
    daosV17ModulesBridgeEnabled: options?.daosV17ModulesBridgeEnabled,
    daosV17CtrBridgeEnabled: options?.daosV17CtrBridgeEnabled,
    daosV17PromptCompressionEnabled: options?.daosV17PromptCompressionEnabled,
  });
  const composerQualitySummary = options?.composerQualityAudit
    ? summarizeComposerQualityAudit(options.composerQualityAudit)
    : undefined;
  const overlayQualitySummary = options?.overlayQualityAudit
    ? summarizeOverlayQualityAudit(options.overlayQualityAudit)
    : undefined;
  const overlayLayoutPatch = options?.overlayLayoutPatch;
  const geometryWhitespacePatch = options?.geometryWhitespacePatch;
  const productScaleAudit = options?.productScaleAudit;
  const productScalePatch = options?.productScalePatch;
  const compositePlacement = options?.compositePlacement;
  const productScaleSummary = productScaleAudit
    ? summarizeProductScaleAudit(productScaleAudit)
    : undefined;
  const createdAt = new Date().toISOString();

  return {
    projectId: state.projectId,
    runId: state.runId,
    createdAt,
    projectStateSummary: {
      status: state.status,
      architectureVersion: state.architectureVersion,
      decisionTraceCount: state.decisionTrace.length,
      eventCount: state.events.length,
      debugArtifactCount: state.debug.length,
    },
    specs: {
      brief: state.brief,
      knowledgeSpec: state.knowledgeSpec,
      commercialSpec: state.commercialSpec,
      creativeSpec: state.creativeSpec,
      visualBlueprint: state.visualBlueprint,
      renderBlueprint: state.renderBlueprint,
    },
    diagnostics: {
      specsAdapted: {
        brief: Boolean(state.brief),
        knowledge: Boolean(state.knowledgeSpec),
        commercial: Boolean(state.commercialSpec),
        creative: Boolean(state.creativeSpec),
        visual: Boolean(state.visualBlueprint),
        render: Boolean(state.renderBlueprint),
      },
      decisionTraceCount: state.decisionTrace.length,
      missingSpecs: meaningLossReport.missingSpecs,
      confidenceBySpec: confidenceBySpec(state),
      warnings: meaningLossReport.warnings,
      promptCaptured: Boolean(renderDebug?.finalPrompt),
      modulesIgnoredCount: renderDebug?.modulesIgnored?.length ?? 0,
      fallbackUsed: Boolean(renderDebug?.fallbackUsed),
      generationMode,
      fastShortcutsAllowed: generationPolicy.allowFastShortcuts,
      premiumGuardrailsActive: isPremiumGuardrailMode(generationMode),
      ...(composerQualitySummary
        ? {
            composerQualityScore: composerQualitySummary.score,
            composerQualityWarnings: composerQualitySummary.warningCodes,
            productAreaRatio: composerQualitySummary.productAreaRatio,
            finalCompositionRisk: composerQualitySummary.finalCompositionRisk,
          }
        : {}),
      ...(overlayQualitySummary
        ? {
            overlayQualityScore: overlayQualitySummary.score,
            overlayDensity: overlayQualitySummary.overlayDensity,
            overlayWarnings: overlayQualitySummary.warningCodes,
            pngOverlayFeelRisk: overlayQualitySummary.pngOverlayFeelRisk,
            law003WhitespaceViolation: overlayQualitySummary.law003WhitespaceViolation,
            law014ContrastViolation: overlayQualitySummary.law014ContrastViolation,
          }
        : {}),
      ...(overlayLayoutPatch
        ? {
            overlayPatchEnabled: overlayLayoutPatch.enabled,
            overlayPatchApplied: overlayLayoutPatch.applied,
            overlayPatchActions: overlayLayoutPatch.actions.map((action) => action.code),
            overlayPatchBeforeDensity: overlayLayoutPatch.beforeDensity,
            overlayPatchAfterDensity: overlayLayoutPatch.afterDensity,
            overlayPatchElementsBefore: overlayLayoutPatch.elementsBefore,
            overlayPatchElementsAfter: overlayLayoutPatch.elementsAfter,
          }
        : {}),
      ...(geometryWhitespacePatch
        ? {
            geometryWhitespacePatchEnabled: geometryWhitespacePatch.enabled,
            geometryWhitespacePatchApplied: geometryWhitespacePatch.applied,
            geometryWhitespaceBefore: geometryWhitespacePatch.whitespaceBefore,
            geometryWhitespaceAfterEstimate: geometryWhitespacePatch.whitespaceAfterEstimate,
            geometryPatchActions: geometryWhitespacePatch.actions.map((action) => action.code),
          }
        : {}),
      ...(productScaleSummary
        ? {
            productScaleScore: productScaleSummary.score,
            productDominanceScore: productScaleSummary.productDominanceScore,
            productWidthRatio: productScaleSummary.productWidthRatio,
            productHeightRatio: productScaleSummary.productHeightRatio,
            emptySpaceEstimate: productScaleSummary.emptySpaceEstimate,
            sceneFillRisk: productScaleSummary.sceneFillRisk,
          }
        : {}),
      ...(productScalePatch
        ? {
            productScalePatchEnabled: productScalePatch.enabled,
            productScalePatchApplied: productScalePatch.patchApplied,
            productScaleMultiplier: productScalePatch.scaleMultiplier,
            productAreaBefore: productScalePatch.beforeProductAreaRatio,
            productAreaTarget: productScalePatch.targetProductAreaRatio,
            productAreaAfterEstimate: productScalePatch.estimatedAfterProductAreaRatio,
            productScalePatchActions: productScalePatch.actions.map((action) => action.code),
          }
        : {}),
      compositePlacementFound: Boolean(compositePlacement),
      ...(compositePlacement
        ? {
            compositePlacementSource: compositePlacement.source,
            compositeProductAreaRatio: compositePlacement.areaRatio,
            compositeProductWidthRatio: compositePlacement.widthRatio,
            compositeProductHeightRatio: compositePlacement.heightRatio,
          }
        : {}),
    },
    generationMode,
    generationPolicySummary,
    renderDebug,
    pipelineContextSummary,
    promptContextBlockPreview: options?.promptContextBlockPreview,
    promptContextInjected: options?.promptContextInjected,
    renderContextAttached: options?.renderContextAttached,
    renderContextSummary: options?.renderContextSummary,
    contextEffectAudit: options?.contextEffectAudit,
    composerQualityAudit: options?.composerQualityAudit,
    overlayQualityAudit: options?.overlayQualityAudit,
    overlayLayoutPatch,
    geometryWhitespacePatch,
    productScaleAudit,
    productScalePatch,
    compositePlacement,
    meaningLossReport,
  };
}
