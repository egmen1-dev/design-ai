/**
 * Chapter 3.2 / 4.1 / 4.12 — Composition Director agent
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
  runCompositionDirector,
  COMPOSITION_DIRECTOR_VERSION,
} from "../composition-director-engine";
import type { LayoutSection } from "../composition-director-types";

export type CompositionDirectorInput = {
  productCategory: string;
  marketplace: string;
};

export type CompositionDirectorResult = AgentResultBase & {
  composition: LayoutSection["compositionBlueprint"];
  layoutSection?: LayoutSection;
};

export const compositionDirectorAgent: BlueprintAgent<
  CompositionDirectorInput,
  CompositionDirectorResult
> = {
  id: "composition-director",
  version: COMPOSITION_DIRECTOR_VERSION,
  stage: BlueprintLifecycle.COMPOSITION_DEFINED,

  canExecute(blueprint) {
    return blueprint.lifecycle.stage === AGENT_STAGE_MATRIX["composition-director"];
  },

  async execute(blueprint, input) {
    const context = buildAgentContextPackage({
      blueprint: blueprint as RenderBlueprint,
      agentId: "composition-director",
    });
    const directorContext = {
      ...directorContextFromBlueprint(blueprint as RenderBlueprint),
      productCategory: input.productCategory,
      marketplace: input.marketplace,
    };

    const result = runCompositionDirector({ context, directorContext });

    return {
      composition: result.section.compositionBlueprint,
      layoutSection: result.section,
      confidence: denormalizeConfidence(result.confidence.value),
      decisionTrace: result.decisionSession.toDecisionTraceStrings(),
      warnings: [],
    };
  },

  toUpdates(result): AgentSectionUpdates {
    return { composition: result.composition };
  },
};

/** Chapter 4.1 — Universal Agent Contract wrapper */
export const universalCompositionDirectorAgent = wrapLegacyBlueprintAgent(compositionDirectorAgent, {
  category: AgentCategory.TECHNICAL_DIRECTOR,
  consumes: ["story", "scene", "photography"],
  produces: ["composition"],
  buildInput: (context) => ({
    productCategory: context.blueprint.product.category,
    marketplace: context.blueprint.creative.marketplace,
  }),
});
