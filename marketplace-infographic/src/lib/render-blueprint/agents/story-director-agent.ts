/**
 * Chapter 3.2 — Example: Story Director contract agent (pure decision)
 */
import type { StoryBlueprint } from "../types";
import type { RenderBlueprint } from "../types";
import {
  type AgentResultBase,
  type AgentSectionUpdates,
  type BlueprintAgent,
} from "../agent-contracts";
import { BlueprintLifecycle } from "../lifecycle-types";
import { AGENT_STAGE_MATRIX } from "../agent-matrix";

export type StoryDirectorInput = {
  productCategory: string;
  creativeGoal: string;
};

export type StoryDirectorResult = AgentResultBase & {
  story: StoryBlueprint;
};

export const storyDirectorAgent: BlueprintAgent<StoryDirectorInput, StoryDirectorResult> = {
  id: "visual-story-director",
  version: "1.0.0",
  stage: BlueprintLifecycle.STORY_DEFINED,

  canExecute(blueprint) {
    return blueprint.lifecycle.stage === AGENT_STAGE_MATRIX["visual-story-director"];
  },

  async execute(blueprint, input) {
    const hook =
      input.creativeGoal === "Technical"
        ? `Надёжность ${input.productCategory}`
        : `Удобство ${input.productCategory}`;

    return {
      story: {
        hook,
        customerProblem: blueprint.story.customerProblem || "нужда в качественном решении",
        customerDesire: blueprint.story.customerDesire || "уверенность в покупке",
        visualPromise: blueprint.story.visualPromise || hook,
        emotionalTone: "confident",
        narrative: `${hook} — визуальная история для WB`,
      },
      confidence: 82,
      decisionTrace: [
        `Hook derived from creative.goal=${input.creativeGoal}`,
        `Category context: ${input.productCategory}`,
        "Story scoped to narrative only — no camera or lighting decisions",
      ],
      warnings: [],
    };
  },

  toUpdates(result): AgentSectionUpdates {
    return { story: result.story };
  },
};
