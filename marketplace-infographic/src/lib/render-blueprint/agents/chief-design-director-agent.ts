/**
 * Chapter 4.19 — Chief Design Director agent
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
  runChiefDesignDirector,
  CHIEF_DESIGN_DIRECTOR_VERSION,
} from "../chief-design-director-engine";
import type {
  ChiefDesignDirectorContext,
  ChiefReview,
} from "../chief-design-director-types";

export type ChiefDesignDirectorAgentInput = ChiefDesignDirectorContext;

export type ChiefDesignDirectorResult = AgentResultBase & {
  chiefReview: ChiefReview;
};

export const chiefDesignDirectorAgent: BlueprintAgent<
  ChiefDesignDirectorAgentInput,
  ChiefDesignDirectorResult
> = {
  id: "chief-design-director",
  version: CHIEF_DESIGN_DIRECTOR_VERSION,
  stage: BlueprintLifecycle.VALIDATED,

  canExecute(blueprint) {
    return blueprint.lifecycle.stage === AGENT_STAGE_MATRIX["chief-design-director"];
  },

  async execute(blueprint, input) {
    const { review, explainability } = runChiefDesignDirector({
      blueprint: blueprint as RenderBlueprint,
      context: input,
    });

    return {
      chiefReview: review,
      confidence: review.confidence,
      decisionTrace: explainability.reasoning,
      warnings: review.priorityProblems
        .filter((p) => p.severity === "critical")
        .map((p) => p.message),
    };
  },

  toUpdates(): AgentSectionUpdates {
    return {};
  },
};
