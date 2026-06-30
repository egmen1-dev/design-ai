/**
 * Chapter 3.2 / 4.1 / 4.17 — Render Adapter agent (flux-adapter)
 */
import type { RenderBlueprint } from "../types";
import {
  type AgentResultBase,
  type AgentSectionUpdates,
  type BlueprintAgent,
} from "../agent-contracts";
import { BlueprintLifecycle } from "../lifecycle-types";
import { AGENT_STAGE_MATRIX } from "../agent-matrix";
import {
  buildAdapterRenderIntent,
  runRenderAdapter,
  RENDER_ADAPTER_VERSION,
} from "../render-adapter-engine";
import type { AdapterRenderIntent } from "../render-adapter-types";

export type RenderAdapterInput = {
  providerId?: string;
};

export type RenderAdapterResult = AgentResultBase & {
  renderIntent: AdapterRenderIntent;
  prompt: string;
  negativePrompt: string;
};

export const renderAdapterAgent: BlueprintAgent<RenderAdapterInput, RenderAdapterResult> = {
  id: "flux-adapter",
  version: RENDER_ADAPTER_VERSION,
  stage: BlueprintLifecycle.FROZEN,

  canExecute(blueprint) {
    return blueprint.lifecycle.stage === AGENT_STAGE_MATRIX["flux-adapter"];
  },

  async execute(blueprint, input) {
    const providerId = input.providerId ?? blueprint.meta.generator ?? "flux";
    const { intent, explainability, compiled } = runRenderAdapter({
      blueprint: blueprint as RenderBlueprint,
      context: {
        providerId,
        quality: blueprint.render.quality,
        aspectRatio: blueprint.render.aspectRatio,
        seed: blueprint.meta.seed,
      },
    });

    return {
      renderIntent: intent,
      prompt: compiled.prompt,
      negativePrompt: compiled.negativePrompt,
      confidence: intent.confidence,
      decisionTrace: explainability.reasoning,
      warnings: [],
    };
  },

  toUpdates(): AgentSectionUpdates {
    return {};
  },
};

/** Compile-only helper — prompt is never written back to blueprint */
export function compileRenderIntent(
  blueprint: Readonly<RenderBlueprint>,
  providerId = "flux",
): AdapterRenderIntent {
  return buildAdapterRenderIntent(blueprint, { providerId }).intent;
}
