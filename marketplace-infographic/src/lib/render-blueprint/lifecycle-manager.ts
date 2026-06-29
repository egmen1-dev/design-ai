/**
 * Chapter 3.2 — Lifecycle Manager
 * Only component allowed to mutate RenderBlueprint after agent execute().
 */
import type { BlueprintSection, RenderBlueprint } from "./types";
import type { LifecycleManagedSection } from "./lifecycle-types";
import { SectionState } from "./lifecycle-types";
import {
  type AgentContractId,
  type AgentError,
  type AgentResultBase,
  type AgentSectionUpdates,
  type BlueprintAgent,
  type BlueprintMutationResult,
  assertAgentConfidence,
  AgentContractError,
} from "./agent-contracts";
import {
  assertAgentWriteAccess,
  AGENT_STAGE_MATRIX,
  AGENT_WRITE_MATRIX,
} from "./agent-matrix";
import { applyAgentPatch, type SectionPayloadMap } from "./patch";
import { DEPENDENCY_CHILDREN, advanceLifecycleStage } from "./lifecycle";

const MANAGED: LifecycleManagedSection[] = [
  "product",
  "creative",
  "story",
  "scene",
  "photography",
  "camera",
  "lighting",
  "materials",
  "composition",
  "constraints",
  "validation",
];

function isManagedSection(section: BlueprintSection): section is LifecycleManagedSection {
  return (MANAGED as string[]).includes(section);
}

/** Downstream dependents marked for re-computation after a section update. */
function collectInvalidated(
  blueprint: RenderBlueprint,
  updatedSections: LifecycleManagedSection[],
): BlueprintSection[] {
  const invalidated = new Set<BlueprintSection>();

  for (const source of updatedSections) {
    const queue = [...DEPENDENCY_CHILDREN[source]];
    const visited = new Set<LifecycleManagedSection>();

    while (queue.length) {
      const section = queue.shift()!;
      if (visited.has(section)) continue;
      visited.add(section);

      if (blueprint.lifecycle.sections[section] === SectionState.LOCKED) continue;

      invalidated.add(section);
      for (const child of DEPENDENCY_CHILDREN[section]) {
        queue.push(child);
      }
    }
  }

  return [...invalidated];
}

function sectionKeyToPatchSection(
  key: keyof AgentSectionUpdates,
): keyof SectionPayloadMap | null {
  if (key === "meta" || key === "render") return null;
  return key as keyof SectionPayloadMap;
}

export class LifecycleManager {
  /**
   * Apply agent result to blueprint. Agents never call this — Orchestrator only.
   */
  apply(
    agentId: AgentContractId,
    blueprint: RenderBlueprint,
    result: AgentResultBase & { updates: AgentSectionUpdates },
  ): BlueprintMutationResult {
    assertAgentConfidence(result.confidence, agentId);

    if (result.errors?.some((e) => e.kind === "fatal")) {
      throw new AgentContractError(
        "fatal",
        `Fatal agent errors from ${agentId}`,
        "AGENT_FATAL",
      );
    }

    const writableKeys = Object.keys(result.updates) as (keyof AgentSectionUpdates)[];
    for (const key of writableKeys) {
      const section = sectionKeyToPatchSection(key);
      if (!section) continue;
      assertAgentWriteAccess(agentId, section);
    }

    let next = blueprint;
    const updatedSections: LifecycleManagedSection[] = [];

    for (const key of writableKeys) {
      const section = sectionKeyToPatchSection(key);
      if (!section || !isManagedSection(section)) continue;
      const data = result.updates[key];
      if (!data) continue;

      next = applyAgentPatch(next, {
        agentId,
        section,
        data: data as SectionPayloadMap[typeof section],
      });
      updatedSections.push(section);
    }

    const invalidatedSections = collectInvalidated(next, updatedSections);
    const warnings = [...result.warnings];
    const errors: AgentError[] = result.errors ?? [];

    if (result.retryAdvice?.required) {
      warnings.push(`Retry advised: ${result.retryAdvice.reason}`);
    }

    return {
      blueprint: next,
      updatedSections,
      invalidatedSections,
      warnings,
      errors,
      decisionTrace: result.decisionTrace,
      nextStage: result.retryAdvice?.recommendedStage,
    };
  }

  canExecuteAgent(agentId: AgentContractId, blueprint: RenderBlueprint): boolean {
    const expected = AGENT_STAGE_MATRIX[agentId];
    if (blueprint.lifecycle.stage !== expected) return false;
    const writes = AGENT_WRITE_MATRIX[agentId];
    if (writes.length === 0) return true;
    return writes.some((section) => {
      if (!isManagedSection(section)) return true;
      return blueprint.lifecycle.sections[section] !== SectionState.LOCKED;
    });
  }

  /** Run agent execute → apply. Agent receives Readonly blueprint. */
  async runAgent<TInput, TResult extends AgentResultBase>(
    agent: BlueprintAgent<TInput, TResult>,
    blueprint: RenderBlueprint,
    input: TInput,
  ): Promise<{ blueprint: RenderBlueprint; mutation: BlueprintMutationResult; result: TResult }> {
    if (!agent.canExecute(blueprint)) {
      throw new AgentContractError(
        "recoverable",
        `Agent ${agent.id} cannot execute at stage ${blueprint.lifecycle.stage}`,
        "AGENT_NOT_READY",
      );
    }

    const frozen = Object.freeze(structuredClone(blueprint)) as RenderBlueprint;
    const result = await agent.execute(frozen, input);
    const updates = agent.toUpdates(result);
    const mutation = this.apply(agent.id, blueprint, { ...result, updates });

    return { blueprint: mutation.blueprint, mutation, result };
  }

  /** Complete stage after agent(s) finished and validation passes */
  completeStage(blueprint: RenderBlueprint): RenderBlueprint {
    return advanceLifecycleStage(blueprint);
  }
}
