/**
 * Chapter 3.2 / 4.1 / 4.16 — Material Director agent
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
  runMaterialDirector,
  MATERIAL_DIRECTOR_VERSION,
} from "../material-director-engine";
import type { MaterialSection } from "../material-director-types";

export type MaterialDirectorInput = {
  productCategory: string;
  marketplace: string;
};

export type MaterialDirectorResult = AgentResultBase & {
  materials: MaterialSection["materialBlueprint"];
  materialSection?: MaterialSection;
};

export const materialDirectorAgent: BlueprintAgent<MaterialDirectorInput, MaterialDirectorResult> = {
  id: "material-director",
  version: MATERIAL_DIRECTOR_VERSION,
  stage: BlueprintLifecycle.PHOTO_DEFINED,

  canExecute(blueprint) {
    return blueprint.lifecycle.stage === AGENT_STAGE_MATRIX["material-director"];
  },

  async execute(blueprint, input) {
    const context = buildAgentContextPackage({
      blueprint: blueprint as RenderBlueprint,
      agentId: "material-director",
    });
    const directorContext = {
      ...directorContextFromBlueprint(blueprint as RenderBlueprint),
      productCategory: input.productCategory,
      marketplace: input.marketplace,
    };

    const result = runMaterialDirector({ context, directorContext });

    return {
      materials: result.section.materialBlueprint,
      materialSection: result.section,
      confidence: denormalizeConfidence(result.confidence.value),
      decisionTrace: result.decisionSession.toDecisionTraceStrings(),
      warnings: [],
    };
  },

  toUpdates(result): AgentSectionUpdates {
    return { materials: result.materials };
  },
};

/** Chapter 4.1 — Universal Agent Contract wrapper */
export const universalMaterialDirectorAgent = wrapLegacyBlueprintAgent(materialDirectorAgent, {
  category: AgentCategory.TECHNICAL_DIRECTOR,
  consumes: ["story", "scene", "product", "photography"],
  produces: ["materials"],
  buildInput: (context) => ({
    productCategory: context.blueprint.product.category,
    marketplace: context.blueprint.creative.marketplace,
  }),
});
