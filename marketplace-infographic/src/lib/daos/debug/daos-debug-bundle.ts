import type { DAOSProjectState } from "../core/project-state";
import {
  analyzeDaosMeaningLoss,
  confidenceBySpec,
  type DaosMeaningLossReport,
  type DaosMeaningLossWarning,
} from "./daos-meaning-loss";
import type { DAOSRenderDebugArtifact } from "./render-debug-bridge";

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
  };
  renderDebug?: DAOSRenderDebugArtifact;
  meaningLossReport: DaosMeaningLossReport;
};

export function createDaosDebugBundle(
  state: DAOSProjectState,
  options?: {
    renderDebug?: DAOSRenderDebugArtifact;
  },
): DaosDebugBundle {
  const renderDebug = options?.renderDebug;
  const meaningLossReport = analyzeDaosMeaningLoss(state, renderDebug);
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
    },
    renderDebug,
    meaningLossReport,
  };
}
