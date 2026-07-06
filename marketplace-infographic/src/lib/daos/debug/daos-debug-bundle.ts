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
  });
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
    meaningLossReport,
  };
}
