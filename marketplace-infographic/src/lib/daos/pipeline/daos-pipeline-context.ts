import type { DAOSProjectState } from "../core/project-state";
import type {
  CommercialSpec,
  CreativeSpec,
  KnowledgeSpec,
  RenderBlueprint,
  VisualBlueprint,
} from "../contracts/specs";
import type { DAOSGenerationMode } from "../config/generation-mode";

export type DAOSPipelineContext = {
  projectId: string;
  runId: string;
  generationMode?: DAOSGenerationMode;
  knowledgeSpec?: KnowledgeSpec;
  commercialSpec?: CommercialSpec;
  creativeSpec?: CreativeSpec;
  visualBlueprint?: VisualBlueprint;
  renderBlueprint?: RenderBlueprint;
  completenessScore: number;
  missingSpecs: string[];
  warnings: string[];
};

export type DAOSPipelineContextSummary = {
  projectId: string;
  runId: string;
  generationMode?: DAOSGenerationMode;
  completenessScore: number;
  missingSpecs: string[];
  specsPresent: string[];
  warnings: string[];
};

const PIPELINE_SPEC_KEYS = [
  "knowledgeSpec",
  "commercialSpec",
  "creativeSpec",
  "visualBlueprint",
  "renderBlueprint",
] as const;

type PipelineSpecKey = (typeof PIPELINE_SPEC_KEYS)[number];

const SPEC_PENALTY = 20;
const COMPLETENESS_WARNING_THRESHOLD = 80;
const COMPLETENESS_CRITICAL_THRESHOLD = 60;

export function computePipelineCompleteness(state: DAOSProjectState): {
  completenessScore: number;
  missingSpecs: PipelineSpecKey[];
  specsPresent: PipelineSpecKey[];
} {
  const missingSpecs: PipelineSpecKey[] = [];
  const specsPresent: PipelineSpecKey[] = [];

  for (const key of PIPELINE_SPEC_KEYS) {
    if (state[key]) {
      specsPresent.push(key);
    } else {
      missingSpecs.push(key);
    }
  }

  const completenessScore = Math.max(0, 100 - missingSpecs.length * SPEC_PENALTY);

  return { completenessScore, missingSpecs, specsPresent };
}

function buildContextWarnings(
  missingSpecs: PipelineSpecKey[],
  completenessScore: number,
): string[] {
  const warnings: string[] = [];
  for (const spec of missingSpecs) {
    warnings.push(`${spec} missing from pipeline context`);
  }
  if (completenessScore < COMPLETENESS_WARNING_THRESHOLD) {
    warnings.push(
      `pipeline context completeness ${completenessScore} is below ${COMPLETENESS_WARNING_THRESHOLD}`,
    );
  }
  return warnings;
}

/** Unified DAOS pipeline context from enriched ProjectState (diagnostics only). */
export function createDaosPipelineContext(state: DAOSProjectState): DAOSPipelineContext {
  const { completenessScore, missingSpecs } = computePipelineCompleteness(state);
  const generationMode = state.brief?.generationMode;

  return {
    projectId: state.projectId,
    runId: state.runId,
    generationMode,
    knowledgeSpec: state.knowledgeSpec,
    commercialSpec: state.commercialSpec,
    creativeSpec: state.creativeSpec,
    visualBlueprint: state.visualBlueprint,
    renderBlueprint: state.renderBlueprint,
    completenessScore,
    missingSpecs: [...missingSpecs],
    warnings: buildContextWarnings(missingSpecs, completenessScore),
  };
}

export function summarizeDaosPipelineContext(
  context: DAOSPipelineContext,
): DAOSPipelineContextSummary {
  const specsPresent = PIPELINE_SPEC_KEYS.filter(
    (key) => !context.missingSpecs.includes(key),
  );

  return {
    projectId: context.projectId,
    runId: context.runId,
    generationMode: context.generationMode,
    completenessScore: context.completenessScore,
    missingSpecs: [...context.missingSpecs],
    specsPresent: [...specsPresent],
    warnings: [...context.warnings],
  };
}

export {
  COMPLETENESS_WARNING_THRESHOLD as DAOS_PIPELINE_COMPLETENESS_WARNING_THRESHOLD,
  COMPLETENESS_CRITICAL_THRESHOLD as DAOS_PIPELINE_COMPLETENESS_CRITICAL_THRESHOLD,
};
