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
import { advanceLifecycleStage } from "./lifecycle";
import { DecisionGraph, type DecisionConflict, DECISION_NODE_ID } from "./decision-graph";

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

function isDecisionGraphSection(section: string): boolean {
  return Object.values(DECISION_NODE_ID).includes(section);
}

function applyGraphDecisions(
  graph: DecisionGraph,
  agentId: AgentContractId,
  result: AgentResultBase & { updates: AgentSectionUpdates },
): { conflict: DecisionConflict | null; invalidatedSections: BlueprintSection[] } {
  for (const key of Object.keys(result.updates) as (keyof AgentSectionUpdates)[]) {
    const section = sectionKeyToPatchSection(key);
    if (!section || !isDecisionGraphSection(section)) continue;
    const data = result.updates[key];
    if (!data) continue;
    const nodeId = section === "materials" ? "materials" : section;
    const conflict = graph.proposeUpdate(nodeId, agentId, data, result.confidence);
    if (conflict) return { conflict, invalidatedSections: [] };
  }
  graph.assertValid();
  const invalidationResults = graph.commitPending();
  const invalidated = new Set<BlueprintSection>();
  for (const inv of invalidationResults) {
    for (const id of inv.dirtied) invalidated.add(id as BlueprintSection);
  }
  return { conflict: null, invalidatedSections: [...invalidated] };
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
   * Golden Rule (Ch 3.3): Decision Graph first, RenderBlueprint second.
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

    const graph = DecisionGraph.fromBlueprint(blueprint);
    const { conflict, invalidatedSections: graphInvalidated } = applyGraphDecisions(
      graph,
      agentId,
      result,
    );
    if (conflict) {
      throw new AgentContractError(
        "recoverable",
        `Decision conflict on ${conflict.nodeId}: ${conflict.reason} (${conflict.producers.join(" vs ")})`,
        "DECISION_CONFLICT",
      );
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

    next = graph.syncStatesToBlueprint(next);
    const invalidatedSections = graphInvalidated;
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
