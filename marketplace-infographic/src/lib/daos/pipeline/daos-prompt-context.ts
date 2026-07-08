import type { DAOSPipelineContext } from "./daos-pipeline-context";

export const DAOS_PROMPT_CONTEXT_MAX_LENGTH = 1200;

export type DAOSPromptContextSummary = {
  enabled: boolean;
  length: number;
  injected: boolean;
  preview: string;
  commercialGoal?: string;
  mainMessage?: string;
  creativeConcept?: string;
  visualScene?: string;
  renderStrategy?: string;
  missingSpecs: string[];
};

export function isDaosPromptContextEnabled(): boolean {
  return process.env.DAOS_PROMPT_CONTEXT === "1";
}

function cleanLine(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  return value.trim().replace(/\s+/g, " ");
}

function truncateBlock(block: string, maxLength: number): string {
  if (block.length <= maxLength) return block;
  return `${block.slice(0, Math.max(0, maxLength - 3))}...`;
}

/** Short advisory block from pipeline context — no JSON, no tables, no invented fields. */
export function createDaosPromptContextBlock(context: DAOSPipelineContext): string {
  const commercial = context.commercialSpec;
  const creative = context.creativeSpec;
  const visual = context.visualBlueprint;
  const render = context.renderBlueprint;

  const commercialGoal =
    cleanLine(commercial?.usp?.[0]) ?? cleanLine(commercial?.mainMessage);
  const mainMessage = cleanLine(commercial?.mainMessage);
  const creativeConcept = cleanLine(creative?.concept) ?? cleanLine(creative?.visualHook);
  const visualScene =
    cleanLine(visual?.scene) ?? cleanLine(visual?.composition);
  const renderStrategy = cleanLine(render?.renderStrategy);
  const missingSpecs = context.missingSpecs.length
    ? context.missingSpecs.join(", ")
    : undefined;

  const lines = ["DAOS CONTEXT:"];
  let hasPositiveField = false;
  if (commercialGoal) {
    lines.push(`Commercial goal: ${commercialGoal}`);
    hasPositiveField = true;
  }
  if (mainMessage && mainMessage !== commercialGoal) {
    lines.push(`Main message: ${mainMessage}`);
    hasPositiveField = true;
  }
  if (creativeConcept) {
    lines.push(`Creative concept: ${creativeConcept}`);
    hasPositiveField = true;
  }
  if (visualScene) {
    lines.push(`Visual scene: ${visualScene}`);
    hasPositiveField = true;
  }
  if (renderStrategy) {
    lines.push(`Render strategy: ${renderStrategy}`);
    hasPositiveField = true;
  }
  if (missingSpecs && hasPositiveField) {
    lines.push(`Missing specs: ${missingSpecs}`);
  }

  if (!hasPositiveField) {
    return "";
  }

  return truncateBlock(lines.join("\n"), DAOS_PROMPT_CONTEXT_MAX_LENGTH);
}

export function createDaosPromptContextSummary(
  context: DAOSPipelineContext,
  input?: {
    enabled?: boolean;
    injected?: boolean;
    block?: string;
  },
): DAOSPromptContextSummary {
  const block = input?.block ?? createDaosPromptContextBlock(context);
  const enabled = input?.enabled ?? isDaosPromptContextEnabled();
  const injected = input?.injected ?? (enabled && block.length > 0);

  return {
    enabled,
    length: block.length,
    injected,
    preview: block,
    commercialGoal: cleanLine(context.commercialSpec?.usp?.[0] ?? context.commercialSpec?.mainMessage),
    mainMessage: cleanLine(context.commercialSpec?.mainMessage),
    creativeConcept: cleanLine(context.creativeSpec?.concept ?? context.creativeSpec?.visualHook),
    visualScene: cleanLine(context.visualBlueprint?.scene ?? context.visualBlueprint?.composition),
    renderStrategy: cleanLine(context.renderBlueprint?.renderStrategy),
    missingSpecs: [...context.missingSpecs],
  };
}
