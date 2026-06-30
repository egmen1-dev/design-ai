/**
 * Chapter 4.20 — Design Memory agent
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
  runDesignMemory,
  DESIGN_MEMORY_VERSION,
} from "../design-memory-engine";
import type {
  DesignMemoryContext,
  DesignKnowledgeStore,
  MemoryUpdate,
} from "../design-memory-types";

export type DesignMemoryAgentInput = DesignMemoryContext & {
  store?: DesignKnowledgeStore;
};

export type DesignMemoryResult = AgentResultBase & {
  memoryUpdate: MemoryUpdate;
  knowledgeStore: DesignKnowledgeStore;
};

export const designMemoryAgent: BlueprintAgent<DesignMemoryAgentInput, DesignMemoryResult> = {
  id: "design-memory",
  version: DESIGN_MEMORY_VERSION,
  stage: BlueprintLifecycle.FINISHED,

  canExecute(blueprint) {
    return blueprint.lifecycle.stage === AGENT_STAGE_MATRIX["design-memory"];
  },

  async execute(blueprint, input) {
    const { update, explainability, store } = runDesignMemory({
      blueprint: blueprint as RenderBlueprint,
      context: input,
      store: input.store,
    });

    return {
      memoryUpdate: update,
      knowledgeStore: store,
      confidence: update.confidence,
      decisionTrace: explainability.reasoning,
      warnings: update.unsuccessfulPatterns.map((p) => p.explanation),
    };
  },

  toUpdates(): AgentSectionUpdates {
    return {};
  },
};
