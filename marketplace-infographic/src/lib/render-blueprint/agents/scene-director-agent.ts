/**
 * Chapter 3.2 / 4.1 / 4.11 — Scene Director agent
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
  runSceneDirector,
  SCENE_DIRECTOR_VERSION,
} from "../scene-director-engine";
import type { SceneSection } from "../scene-director-types";

export type SceneDirectorInput = {
  productCategory: string;
  creativeGoal: string;
};

export type SceneDirectorResult = AgentResultBase & {
  scene: SceneSection["sceneBlueprint"];
  sceneSection?: SceneSection;
};

export const sceneDirectorAgent: BlueprintAgent<SceneDirectorInput, SceneDirectorResult> = {
  id: "scene-director",
  version: SCENE_DIRECTOR_VERSION,
  stage: BlueprintLifecycle.SCENE_DEFINED,

  canExecute(blueprint) {
    return blueprint.lifecycle.stage === AGENT_STAGE_MATRIX["scene-director"];
  },

  async execute(blueprint, input) {
    const context = buildAgentContextPackage({
      blueprint: blueprint as RenderBlueprint,
      agentId: "scene-director",
    });
    const directorContext = {
      ...directorContextFromBlueprint(blueprint as RenderBlueprint),
      productCategory: input.productCategory,
      creativeGoal: input.creativeGoal,
    };

    const result = runSceneDirector({ context, directorContext });

    return {
      scene: result.section.sceneBlueprint,
      sceneSection: result.section,
      confidence: denormalizeConfidence(result.confidence.value),
      decisionTrace: result.decisionSession.toDecisionTraceStrings(),
      warnings: [],
    };
  },

  toUpdates(result): AgentSectionUpdates {
    return { scene: result.scene };
  },
};

/** Chapter 4.1 — Universal Agent Contract wrapper */
export const universalSceneDirectorAgent = wrapLegacyBlueprintAgent(sceneDirectorAgent, {
  category: AgentCategory.CREATIVE_DIRECTOR,
  consumes: ["story", "creative", "product"],
  produces: ["scene"],
  buildInput: (context) => ({
    productCategory: context.blueprint.product.category,
    creativeGoal: context.blueprint.creative.goal,
  }),
});
