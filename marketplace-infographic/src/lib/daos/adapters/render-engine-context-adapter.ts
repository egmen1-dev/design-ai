import type { DAOSPipelineContext } from "../pipeline/daos-pipeline-context";

export type DAOSRenderEngineContextSummary = {
  generationMode?: string;
  completenessScore: number;
  commercialGoal?: string;
  mainMessage?: string;
  creativeConcept?: string;
  visualScene?: string;
  renderStrategy?: string;
  missingSpecs: string[];
  warnings: string[];
};

export function isDaosRenderContextEnabled(): boolean {
  return process.env.DAOS_RENDER_CONTEXT === "1";
}

function asRecord(input: unknown): Record<string, unknown> | null {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return null;
}

function cleanLine(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  return value.trim();
}

/** Build render-engine advisory context summary from pipeline context. */
export function createDaosRenderEngineContext(
  context: DAOSPipelineContext,
): DAOSRenderEngineContextSummary {
  const commercial = context.commercialSpec;
  const creative = context.creativeSpec;
  const visual = context.visualBlueprint;
  const render = context.renderBlueprint;

  return {
    generationMode: context.generationMode,
    completenessScore: context.completenessScore,
    commercialGoal:
      cleanLine(commercial?.usp?.[0]) ?? cleanLine(commercial?.mainMessage),
    mainMessage: cleanLine(commercial?.mainMessage),
    creativeConcept:
      cleanLine(creative?.concept) ?? cleanLine(creative?.visualHook),
    visualScene: cleanLine(visual?.scene) ?? cleanLine(visual?.composition),
    renderStrategy: cleanLine(render?.renderStrategy),
    missingSpecs: [...context.missingSpecs],
    warnings: [...context.warnings],
  };
}

function hasAttachedDaosContext(value: unknown): boolean {
  const root = asRecord(value);
  if (!root) return false;
  if (root.daosContext) return true;

  for (const key of ["metadata", "providerHints", "debug"]) {
    const nested = asRecord(root[key]);
    if (nested?.daosContext) return true;
  }
  return false;
}

/** Clone render input and attach DAOS context summary without mutating the original. */
export function attachDaosContextToRenderInput<T = unknown>(
  input: unknown,
  context: DAOSPipelineContext | DAOSRenderEngineContextSummary,
): T {
  try {
    if (!isDaosRenderContextEnabled()) {
      return input as T;
    }

    const root = asRecord(input);
    if (!root) {
      return input as T;
    }

    const summary =
      "commercialSpec" in context || "visualBlueprint" in context
        ? createDaosRenderEngineContext(context as DAOSPipelineContext)
        : (context as DAOSRenderEngineContextSummary);

    const cloned: Record<string, unknown> = { ...root };
    const metadata = asRecord(cloned.metadata);
    const providerHints = asRecord(cloned.providerHints);
    const debug = asRecord(cloned.debug);

    if (metadata) {
      cloned.metadata = { ...metadata, daosContext: summary };
    } else if (providerHints) {
      cloned.providerHints = { ...providerHints, daosContext: summary };
    } else if (debug) {
      cloned.debug = { ...debug, daosContext: summary };
    } else {
      cloned.daosContext = summary;
    }

    return cloned as T;
  } catch {
    return input as T;
  }
}

export function isDaosRenderContextAttached(input: unknown): boolean {
  return hasAttachedDaosContext(input);
}
