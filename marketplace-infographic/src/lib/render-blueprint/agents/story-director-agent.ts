/**
 * Chapter 3.2 / 4.1 / 4.10 — Visual Story Director agent
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
  runVisualStoryDirector,
  VISUAL_STORY_DIRECTOR_VERSION,
} from "../visual-story-director-engine";
import type { StorySection } from "../visual-story-director-types";

export type StoryDirectorInput = {
  productCategory: string;
  creativeGoal: string;
};

export type StoryDirectorResult = AgentResultBase & {
  story: StorySection["storyBlueprint"];
  storySection?: StorySection;
};

export const storyDirectorAgent: BlueprintAgent<StoryDirectorInput, StoryDirectorResult> = {
  id: "visual-story-director",
  version: VISUAL_STORY_DIRECTOR_VERSION,
  stage: BlueprintLifecycle.STORY_DEFINED,

  canExecute(blueprint) {
    return blueprint.lifecycle.stage === AGENT_STAGE_MATRIX["visual-story-director"];
  },

  async execute(blueprint, input) {
    const context = buildAgentContextPackage({
      blueprint: blueprint as RenderBlueprint,
      agentId: "visual-story-director",
    });
    const directorContext = {
      ...directorContextFromBlueprint(blueprint as RenderBlueprint),
      productCategory: input.productCategory,
      creativeGoal: input.creativeGoal,
    };

    const result = runVisualStoryDirector({ context, directorContext });

    return {
      story: result.section.storyBlueprint,
      storySection: result.section,
      confidence: denormalizeConfidence(result.confidence.value),
      decisionTrace: result.decisionSession.toDecisionTraceStrings(),
      warnings: [],
    };
  },

  toUpdates(result): AgentSectionUpdates {
    return { story: result.story };
  },
};

/** Chapter 4.1 — Universal Agent Contract wrapper */
export const universalStoryDirectorAgent = wrapLegacyBlueprintAgent(storyDirectorAgent, {
  category: AgentCategory.CREATIVE_DIRECTOR,
  consumes: ["creative", "product"],
  produces: ["story"],
  buildInput: (context) => ({
    productCategory: context.blueprint.product.category,
    creativeGoal: context.blueprint.creative.goal,
  }),
});
