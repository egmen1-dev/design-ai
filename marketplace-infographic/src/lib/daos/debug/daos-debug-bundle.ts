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
import type { ContrastOverlapPatch } from "../overlay/contrast-overlap-patch";
import type { ProductScaleAudit } from "../audit/product-scale-audit";
import { summarizeProductScaleAudit } from "../audit/product-scale-audit";
import type { ProductScalePatch } from "../compositor/product-scale-patch";
import type { AspectRatioPlacementPatch } from "../compositor/aspect-ratio-placement-patch";
import type { AsymmetricLimits } from "../compositor/asymmetric-limits";
import type { WideHeroStrategy } from "../compositor/wide-hero-strategy";
import type { WideProductLayoutPatch } from "../overlay/wide-product-layout";
import { describeWideProductLayoutZones } from "../overlay/wide-product-layout";
import type { NormalizedCompositePlacement } from "../compositor/composite-result-bridge";
import type { Law003RecalibrationReport } from "../governance/law003-recalibration";
import type { Law003GovernanceSource } from "../governance/law003-soft-governance";
import type { DAOSOverlayGateResult } from "../gates/overlay-gate";
import type { SceneGraphDriftReport } from "@/lib/scene-graph";
import type { SceneGraphConstitutionMirrorResult } from "@/lib/scene-graph/SceneGraphConstitutionMirror";
import { serializeSceneGraphSnapshots, type SceneGraphSnapshotSet } from "@/lib/scene-graph";

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
    productFillV2Enabled?: boolean;
    productFillTargetReason?: string;
    productFillV2Target?: number;
    productFillV2Applied?: boolean;
    aspectRatioPlacementPatchEnabled?: boolean;
    aspectRatioPlacementPatchApplied?: boolean;
    productAspectRatio?: number;
    fitStrategy?: string;
    targetUnreachable?: boolean;
    heightOverflowPrevented?: boolean;
    widthOverflowPrevented?: boolean;
    asymmetricLimitsApplied?: boolean;
    compositorFitStrategy?: string;
    compositorMaxWidthPct?: number;
    compositorMaxHeightPct?: number;
    wideHeroStrategyEnabled?: boolean;
    wideHeroStrategyApplied?: boolean;
    wideHeroStrategy?: string;
    wideHeroReason?: string;
    wideHeroWidthTarget?: number;
    wideHeroCropSafe?: number;
    compositePlacementFound?: boolean;
    compositePlacementSource?: string;
    compositeProductAreaRatio?: number;
    compositeProductWidthRatio?: number;
    compositeProductHeightRatio?: number;
    extractAreaCorrected?: boolean;
    extractAreaWarnings?: string[];
    law003OriginalWhitespace?: number;
    law003RecalibratedWhitespace?: number;
    law003Before?: boolean;
    law003After?: boolean;
    law003StaleMetricDetected?: boolean;
    law003GovernanceSource?: Law003GovernanceSource;
    law003SoftResolved?: boolean;
    law003StillFailingReason?: string;
    overlayGateStatus?: "passed" | "warning" | "failed";
    overlayGateScore?: number;
    overlayGateBlocking?: false;
    contrastOverlapPatchApplied?: boolean;
    contrastOverlapPatchActions?: string[];
    contrastOverlapBefore?: number;
    contrastOverlapAfterEstimate?: number;
    wideProductLayoutApplied?: boolean;
    wideProductLayoutStrategy?: string;
    wideProductTextZone?: string;
    wideProductHeroZone?: string;
    sceneGraphV2Enabled?: boolean;
    sceneGraphMirrorMode?: boolean;
    sceneGraphFiles?: string[];
    sceneGraphProductAreaDrift?: number;
    sceneGraphProductPositionDrift?: number;
    sceneGraphProductSizeDrift?: number;
    sceneGraphWhitespaceDrift?: number;
    sceneGraphSignificantDrift?: boolean;
    overlayUsedSceneGraphActual?: boolean;
    overlayProductActualSource?: string;
    overlayProductActualAreaRatio?: number;
    overlayAvoidedActualProductOverlap?: boolean;
    overlayActualGateDecision?: "actual" | "planned";
    overlayActualGateReasons?: string[];
    overlayActualGateConfidence?: number;
    sceneGraphLaw003Passed?: boolean;
    sceneGraphLaw014Passed?: boolean;
    sceneGraphConstitutionSource?: "actual" | "planned" | "mixed";
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
  contrastOverlapPatch?: ContrastOverlapPatch;
  productScaleAudit?: ProductScaleAudit;
  productScalePatch?: ProductScalePatch;
  aspectRatioPlacementPatch?: AspectRatioPlacementPatch;
  asymmetricLimits?: AsymmetricLimits;
  wideHeroStrategy?: WideHeroStrategy;
  wideProductLayoutPatch?: WideProductLayoutPatch;
  compositePlacement?: NormalizedCompositePlacement;
  law003Recalibration?: Law003RecalibrationReport;
  overlayGate?: DAOSOverlayGateResult;
  sceneGraphSnapshots?: ReturnType<typeof serializeSceneGraphSnapshots>;
  sceneGraphDrifts?: SceneGraphDriftReport[];
  sceneGraphConstitutionMirror?: SceneGraphConstitutionMirrorResult;
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
    contrastOverlapPatch?: ContrastOverlapPatch;
    productScaleAudit?: ProductScaleAudit;
    productScalePatch?: ProductScalePatch;
    aspectRatioPlacementPatch?: AspectRatioPlacementPatch;
    asymmetricLimits?: AsymmetricLimits;
    wideHeroStrategy?: WideHeroStrategy;
    wideProductLayoutPatch?: WideProductLayoutPatch;
    compositePlacement?: NormalizedCompositePlacement;
    extractAreaCorrected?: boolean;
    extractAreaWarnings?: string[];
    law003Recalibration?: Law003RecalibrationReport;
    overlayGate?: DAOSOverlayGateResult;
    sceneGraphSnapshots?: SceneGraphSnapshotSet;
    sceneGraphFiles?: string[];
    sceneGraphDriftSummary?: {
      productAreaDrift: number;
      productPositionDrift: number;
      productSizeDrift: number;
      whitespaceDrift: number;
      hasSignificantDrift: boolean;
    };
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
  const contrastOverlapPatch = options?.contrastOverlapPatch;
  const productScaleAudit = options?.productScaleAudit;
  const productScalePatch = options?.productScalePatch;
  const aspectRatioPlacementPatch = options?.aspectRatioPlacementPatch;
  const asymmetricLimits = options?.asymmetricLimits;
  const wideHeroStrategy = options?.wideHeroStrategy;
  const wideProductLayoutPatch = options?.wideProductLayoutPatch;
  const compositePlacement = options?.compositePlacement;
  const extractAreaCorrected = options?.extractAreaCorrected;
  const extractAreaWarnings = options?.extractAreaWarnings;
  const law003Recalibration = options?.law003Recalibration;
  const overlayGate = options?.overlayGate;
  const sceneGraphSnapshots = options?.sceneGraphSnapshots;
  const sceneGraphConstitutionMirror =
    options?.sceneGraphConstitutionMirror ?? sceneGraphSnapshots?.constitutionMirror;
  const sceneGraphFiles = options?.sceneGraphFiles;
  const sceneGraphDriftSummary = options?.sceneGraphDriftSummary;
  const sceneGraphSerialized = sceneGraphSnapshots
    ? serializeSceneGraphSnapshots(sceneGraphSnapshots)
    : undefined;
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
            law003Before: overlayQualitySummary.law003Before,
            law003After: overlayQualitySummary.law003After,
            law003GovernanceSource: overlayQualitySummary.law003GovernanceSource,
            law003SoftResolved: overlayQualitySummary.law003SoftResolved,
            law003StillFailingReason: overlayQualitySummary.law003StillFailingReason,
          }
        : {}),
      ...(options?.overlayLayoutPatch?.overlayActualGateDecision ||
      options?.overlayQualityAudit?.overlayActualGateDecision
        ? {
            overlayUsedSceneGraphActual:
              options.overlayLayoutPatch?.overlayUsedSceneGraphActual ??
              options.overlayQualityAudit?.overlayUsedSceneGraphActual,
            overlayProductActualSource:
              options.overlayLayoutPatch?.overlayProductActualSource ??
              options.overlayQualityAudit?.overlayProductActualSource,
            overlayProductActualAreaRatio:
              options.overlayLayoutPatch?.overlayProductActualAreaRatio ??
              options.overlayQualityAudit?.overlayProductActualAreaRatio,
            overlayAvoidedActualProductOverlap:
              options.overlayLayoutPatch?.overlayAvoidedActualProductOverlap ??
              options.overlayQualityAudit?.overlayAvoidedActualProductOverlap,
            overlayActualGateDecision:
              options.overlayLayoutPatch?.overlayActualGateDecision ??
              options.overlayQualityAudit?.overlayActualGateDecision,
            overlayActualGateReasons:
              options.overlayLayoutPatch?.overlayActualGateReasons ??
              options.overlayQualityAudit?.overlayActualGateReasons,
            overlayActualGateConfidence:
              options.overlayLayoutPatch?.overlayActualGateConfidence ??
              options.overlayQualityAudit?.overlayActualGateConfidence,
          }
        : options?.overlayQualityAudit?.overlayUsedSceneGraphActual
          ? {
              overlayUsedSceneGraphActual: options.overlayQualityAudit.overlayUsedSceneGraphActual,
              overlayProductActualSource: options.overlayQualityAudit.overlayProductActualSource,
              overlayProductActualAreaRatio: options.overlayQualityAudit.overlayProductActualAreaRatio,
              overlayAvoidedActualProductOverlap:
                options.overlayQualityAudit.overlayAvoidedActualProductOverlap,
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
      ...(contrastOverlapPatch
        ? {
            contrastOverlapPatchApplied: contrastOverlapPatch.applied,
            contrastOverlapPatchActions: contrastOverlapPatch.actions.map((action) => action.code),
            contrastOverlapBefore: contrastOverlapPatch.contrastOverlapBefore,
            contrastOverlapAfterEstimate: contrastOverlapPatch.contrastOverlapAfterEstimate,
          }
        : {}),
      ...(wideProductLayoutPatch
        ? (() => {
            const zones = describeWideProductLayoutZones(wideProductLayoutPatch);
            return {
              wideProductLayoutApplied: wideProductLayoutPatch.applied,
              wideProductLayoutStrategy: wideProductLayoutPatch.strategy,
              wideProductTextZone: zones.textZone,
              wideProductHeroZone: zones.heroZone,
            };
          })()
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
            productFillV2Enabled: productScalePatch.productFillV2Enabled,
            productFillTargetReason: productScalePatch.productFillTargetReason,
            productFillV2Target: productScalePatch.productFillV2Target,
            productFillV2Applied: productScalePatch.productFillV2Applied,
          }
        : {}),
      ...(aspectRatioPlacementPatch
        ? {
            aspectRatioPlacementPatchEnabled: aspectRatioPlacementPatch.enabled,
            aspectRatioPlacementPatchApplied: aspectRatioPlacementPatch.patchApplied,
            productAspectRatio: aspectRatioPlacementPatch.productAspectRatio,
            fitStrategy: aspectRatioPlacementPatch.fitStrategy,
            targetUnreachable: aspectRatioPlacementPatch.targetUnreachable,
            heightOverflowPrevented: aspectRatioPlacementPatch.heightOverflowPrevented,
            widthOverflowPrevented: aspectRatioPlacementPatch.widthOverflowPrevented,
          }
        : {}),
      ...(asymmetricLimits
        ? {
            asymmetricLimitsApplied: asymmetricLimits.applied,
            compositorFitStrategy: asymmetricLimits.fitStrategy,
            compositorMaxWidthPct: asymmetricLimits.maxWidthPct,
            compositorMaxHeightPct: asymmetricLimits.maxHeightPct,
          }
        : {}),
      ...(wideHeroStrategy
        ? {
            wideHeroStrategyEnabled: wideHeroStrategy.enabled,
            wideHeroStrategyApplied: wideHeroStrategy.applied,
            wideHeroStrategy: wideHeroStrategy.strategy,
            wideHeroReason: wideHeroStrategy.reason,
            wideHeroWidthTarget: wideHeroStrategy.widthTargetPct,
            wideHeroCropSafe: wideHeroStrategy.cropSafeHorizontalPct,
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
      ...(extractAreaCorrected != null ? { extractAreaCorrected } : {}),
      ...(extractAreaWarnings?.length ? { extractAreaWarnings } : {}),
      ...(law003Recalibration
        ? {
            law003OriginalWhitespace: law003Recalibration.originalWhitespace,
            law003RecalibratedWhitespace: law003Recalibration.recalibratedWhitespace,
            law003StaleMetricDetected: law003Recalibration.staleMetricDetected,
          }
        : {}),
      ...(overlayGate
        ? {
            overlayGateStatus: overlayGate.status,
            overlayGateScore: overlayGate.score,
            overlayGateBlocking: overlayGate.blocking,
          }
        : {}),
      ...(sceneGraphSnapshots
        ? {
            sceneGraphV2Enabled: true,
            sceneGraphMirrorMode: true,
            sceneGraphFiles,
            sceneGraphProductAreaDrift: sceneGraphDriftSummary?.productAreaDrift,
            sceneGraphProductPositionDrift: sceneGraphDriftSummary?.productPositionDrift,
            sceneGraphProductSizeDrift: sceneGraphDriftSummary?.productSizeDrift,
            sceneGraphWhitespaceDrift: sceneGraphDriftSummary?.whitespaceDrift,
            sceneGraphSignificantDrift: sceneGraphDriftSummary?.hasSignificantDrift,
          }
        : {}),
      ...(sceneGraphConstitutionMirror
        ? {
            sceneGraphLaw003Passed: sceneGraphConstitutionMirror.law003.passed,
            sceneGraphLaw014Passed: sceneGraphConstitutionMirror.law014.passed,
            sceneGraphConstitutionSource: sceneGraphConstitutionMirror.sceneGraphConstitutionSource,
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
    contrastOverlapPatch,
    productScaleAudit,
    productScalePatch,
    aspectRatioPlacementPatch,
    asymmetricLimits,
    wideHeroStrategy,
    wideProductLayoutPatch,
    compositePlacement,
    law003Recalibration,
    overlayGate,
    sceneGraphSnapshots: sceneGraphSerialized,
    sceneGraphDrifts: sceneGraphSnapshots?.drifts,
    sceneGraphConstitutionMirror,
    meaningLossReport,
  };
}
