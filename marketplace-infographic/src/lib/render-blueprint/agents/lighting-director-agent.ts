/**
 * Chapter 3.2 / 4.1 / 4.14 — Lighting Director agent
 */
import type { RenderBlueprint } from "../types";
import {
  type AgentResultBase,
  type AgentSectionUpdates,
  type BlueprintAgent,
} from "../agent-contracts";
import { BlueprintLifecycle } from "../lifecycle-types";
import { AGENT_STAGE_MATRIX } from "../agent-matrix";
import { buildAgentContextPackage } from "../agent-context-engine";
import { denormalizeConfidence } from "../universal-agent-contract";
import { AgentCategory } from "../universal-agent-contract";
import { wrapLegacyBlueprintAgent } from "../universal-agent-bridge";
import {
  directorContextFromBlueprint,
  runLightingDirector,
  LIGHTING_DIRECTOR_VERSION,
} from "../lighting-director-engine";
import type { LightingSection } from "../lighting-director-types";

export type LightingDirectorInput = {
  productCategory: string;
  marketplace: string;
};

export type LightingDirectorResult = AgentResultBase & {
  lighting: LightingSection["lightingBlueprint"];
  lightingSection?: LightingSection;
};

export const lightingDirectorAgent: BlueprintAgent<LightingDirectorInput, LightingDirectorResult> = {
  id: "lighting-director",
  version: LIGHTING_DIRECTOR_VERSION,
  stage: BlueprintLifecycle.PHOTO_DEFINED,

  canExecute(blueprint) {
    return blueprint.lifecycle.stage === AGENT_STAGE_MATRIX["lighting-director"];
  },

  async execute(blueprint, input) {
    const context = buildAgentContextPackage({
      blueprint: blueprint as RenderBlueprint,
      agentId: "lighting-director",
    });
    const directorContext = {
      ...directorContextFromBlueprint(blueprint as RenderBlueprint),
      productCategory: input.productCategory,
      marketplace: input.marketplace,
    };

    const result = runLightingDirector({ context, directorContext });

    return {
      lighting: result.section.lightingBlueprint,
      lightingSection: result.section,
      confidence: denormalizeConfidence(result.confidence.value),
      decisionTrace: result.decisionSession.toDecisionTraceStrings(),
      warnings: [],
    };
  },

  toUpdates(result): AgentSectionUpdates {
    return { lighting: result.lighting };
  },
};

/** Chapter 4.1 — Universal Agent Contract wrapper */
export const universalLightingDirectorAgent = wrapLegacyBlueprintAgent(lightingDirectorAgent, {
  category: AgentCategory.TECHNICAL_DIRECTOR,
  consumes: ["story", "scene", "product", "photography"],
  produces: ["lighting"],
  buildInput: (context) => ({
    productCategory: context.blueprint.product.category,
    marketplace: context.blueprint.creative.marketplace,
  }),
});
