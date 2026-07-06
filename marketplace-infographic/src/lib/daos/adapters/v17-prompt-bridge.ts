import type { DAOSPipelineContext } from "../pipeline/daos-pipeline-context";
import type { DAOSRenderEngineContextSummary } from "./render-engine-context-adapter";
import type { CompiledRenderPayload } from "@/lib/render-engine/types";

export const DAOS_V17_BRIDGE_MAX_LENGTH = 900;

export const DAOS_V17_BRIDGE_MODULES = [
  "layout_coordinates",
  "hierarchy",
  "typography_zones",
  "ctr_wording",
] as const;

export type DaosV17BridgeModule = (typeof DAOS_V17_BRIDGE_MODULES)[number];

export type DaosV17BridgeDiagnostics = {
  applied: boolean;
  length: number;
  preview: string;
  modulesAddressed: string[];
};

const BRIDGE_HEADER = "DAOS V17 CONTEXT:";

function cleanLine(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined;
  return value.trim().replace(/\s+/g, " ");
}

function truncateBlock(block: string, maxLength: number): string {
  if (block.length <= maxLength) return block;
  return `${block.slice(0, Math.max(0, maxLength - 3))}...`;
}

function isPipelineContext(
  context: DAOSPipelineContext | DAOSRenderEngineContextSummary,
): context is DAOSPipelineContext {
  return "commercialSpec" in context || "visualBlueprint" in context;
}

function bridgeFields(context: DAOSPipelineContext | DAOSRenderEngineContextSummary) {
  if (isPipelineContext(context)) {
    const commercial = context.commercialSpec;
    const creative = context.creativeSpec;
    const visual = context.visualBlueprint;
    const render = context.renderBlueprint;
    return {
      commercialGoal:
        cleanLine(commercial?.usp?.[0]) ?? cleanLine(commercial?.mainMessage),
      mainMessage: cleanLine(commercial?.mainMessage),
      usp: commercial?.usp?.map((item) => cleanLine(item)).filter(Boolean) as string[] | undefined,
      creativeConcept:
        cleanLine(creative?.concept) ?? cleanLine(creative?.visualHook),
      visualScene: cleanLine(visual?.scene),
      composition: cleanLine(visual?.composition),
      renderStrategy: cleanLine(render?.renderStrategy),
      missingSpecs: [...context.missingSpecs],
    };
  }

  return {
    commercialGoal: cleanLine(context.commercialGoal),
    mainMessage: cleanLine(context.mainMessage),
    usp: context.commercialGoal ? [context.commercialGoal] : undefined,
    creativeConcept: cleanLine(context.creativeConcept),
    visualScene: cleanLine(context.visualScene),
    composition: undefined,
    renderStrategy: cleanLine(context.renderStrategy),
    missingSpecs: [...context.missingSpecs],
  };
}

export function isDaosV17PromptBridgeEnabled(): boolean {
  return process.env.DAOS_V17_PROMPT_BRIDGE === "1";
}

/** Short advisory block for v17 Pollinations prompt append (max 900 chars). */
export function createDaosV17PromptBridgeBlock(
  context: DAOSPipelineContext | DAOSRenderEngineContextSummary,
): string {
  const fields = bridgeFields(context);
  const lines = [BRIDGE_HEADER];

  if (fields.commercialGoal) lines.push(`Commercial goal: ${fields.commercialGoal}`);
  if (fields.mainMessage && fields.mainMessage !== fields.commercialGoal) {
    lines.push(`Main message: ${fields.mainMessage}`);
  }
  if (fields.usp?.length) {
    lines.push(`USP: ${fields.usp.slice(0, 3).join("; ")}`);
  }
  if (fields.creativeConcept) lines.push(`Creative concept: ${fields.creativeConcept}`);
  if (fields.visualScene) lines.push(`Visual scene: ${fields.visualScene}`);
  if (fields.composition) lines.push(`Composition: ${fields.composition}`);
  if (fields.renderStrategy) lines.push(`Render strategy: ${fields.renderStrategy}`);
  if (fields.missingSpecs.length) {
    lines.push(`Missing specs: ${fields.missingSpecs.join(", ")}`);
  }

  const hasSubstantiveContent =
    Boolean(fields.commercialGoal) ||
    Boolean(fields.mainMessage) ||
    Boolean(fields.usp?.length) ||
    Boolean(fields.creativeConcept) ||
    Boolean(fields.visualScene) ||
    Boolean(fields.composition) ||
    Boolean(fields.renderStrategy);

  if (!hasSubstantiveContent) {
    return "";
  }

  lines.push(`Modules must not ignore: ${DAOS_V17_BRIDGE_MODULES.join(", ")}`);

  if (lines.length === 1) return "";

  const block = truncateBlock(lines.join("\n"), DAOS_V17_BRIDGE_MAX_LENGTH);
  return block.length > BRIDGE_HEADER.length ? block : "";
}

function modulesAddressedByBlock(
  block: string,
  fields: ReturnType<typeof bridgeFields>,
): DaosV17BridgeModule[] {
  const addressed = new Set<DaosV17BridgeModule>();
  const haystack = block.toLowerCase();

  if (fields.composition || fields.visualScene || /composition|layout|scene/.test(haystack)) {
    addressed.add("layout_coordinates");
  }
  if (fields.commercialGoal || fields.mainMessage || fields.usp?.length || /hierarchy|message|usp/.test(haystack)) {
    addressed.add("hierarchy");
  }
  if (fields.composition || /typography|headline|zones/.test(haystack)) {
    addressed.add("typography_zones");
  }
  if (fields.commercialGoal || fields.usp?.length || /ctr|commercial|wording/.test(haystack)) {
    addressed.add("ctr_wording");
  }

  for (const bridgeModule of DAOS_V17_BRIDGE_MODULES) {
    if (haystack.includes(bridgeModule.replace(/_/g, " ")) || haystack.includes(bridgeModule)) {
      addressed.add(bridgeModule);
    }
  }

  return DAOS_V17_BRIDGE_MODULES.filter((bridgeModule) => addressed.has(bridgeModule));
}

/** Clone compiled payload and append DAOS v17 bridge block when flag is on. */
export function attachDaosV17PromptBridgeToPayload(
  payload: CompiledRenderPayload,
  context: DAOSPipelineContext | DAOSRenderEngineContextSummary | undefined,
): CompiledRenderPayload {
  try {
    if (!isDaosV17PromptBridgeEnabled() || !context) {
      return payload;
    }

    const block = createDaosV17PromptBridgeBlock(context);
    if (!block) {
      return payload;
    }

    const fields = bridgeFields(context);
    const modulesAddressed = modulesAddressedByBlock(block, fields);
    const bridgedPrompt = `${payload.prompt}\n\n${block}`;

    return {
      ...payload,
      prompt: bridgedPrompt,
      daosV17Bridge: {
        applied: true,
        length: block.length,
        preview: block.slice(0, 240),
        modulesAddressed: [...modulesAddressed],
      },
    };
  } catch {
    return payload;
  }
}

export function extractDaosV17BridgeDiagnostics(
  payload: CompiledRenderPayload | undefined,
): DaosV17BridgeDiagnostics | undefined {
  return payload?.daosV17Bridge;
}
