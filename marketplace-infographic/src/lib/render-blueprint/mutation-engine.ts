/**
 * Chapter 3.4 — Mutation Engine
 * Only component that applies AgentResult → RenderBlueprint (via patches).
 */
import type { BlueprintSection, RenderBlueprint } from "./types";
import type { LifecycleManagedSection } from "./lifecycle-types";
import {
  type AgentContractId,
  type AgentError,
  type AgentResultBase,
  type AgentSectionUpdates,
  type BlueprintMutationResult,
  assertAgentConfidence,
  AgentContractError,
} from "./agent-contracts";
import { assertAgentWriteAccess, AGENT_WRITE_MATRIX } from "./agent-matrix";
import { applyAgentPatch, type SectionPayloadMap } from "./patch";
import { DecisionGraph, type DecisionConflict, DECISION_NODE_ID } from "./decision-graph";
import type { BlueprintAgent } from "./agent-contracts";

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

function sectionKeyToPatchSection(
  key: keyof AgentSectionUpdates,
): keyof SectionPayloadMap | null {
  if (key === "meta" || key === "render") return null;
  return key as keyof SectionPayloadMap;
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

export class MutationEngineError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
    this.name = "MutationEngineError";
  }
}

export type MutationContext = {
  blueprint: RenderBlueprint;
  graph: DecisionGraph;
  agent: BlueprintAgent<unknown, AgentResultBase>;
  result: AgentResultBase & { updates: AgentSectionUpdates };
  expectedRevision: number;
};

export class MutationEngine {
  apply(ctx: MutationContext): BlueprintMutationResult {
    const { agent, blueprint, graph, result, expectedRevision } = ctx;
    const agentId = agent.id;
    const actualRevision = blueprint.meta.revision ?? 0;

    if (actualRevision !== expectedRevision) {
      throw new MutationEngineError(
        `Optimistic lock failed: agent started at revision ${expectedRevision}, blueprint is ${actualRevision}`,
        "OPTIMISTIC_LOCK",
      );
    }

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
      if (!isManagedSection(section) && section !== "background") {
        throw new MutationEngineError(`Unknown section ${section}`, "SECTION_NOT_FOUND");
      }
      assertAgentWriteAccess(agentId, section);
      if (isManagedSection(section) && blueprint.lifecycle.sections[section] === "LOCKED") {
        throw new MutationEngineError(`Section ${section} is LOCKED`, "SECTION_LOCKED");
      }
      const allowed = AGENT_WRITE_MATRIX[agentId];
      if (!allowed.includes(section)) {
        throw new MutationEngineError(
          `Producer ${agentId} cannot write ${section}`,
          "PRODUCER_MISMATCH",
        );
      }
    }

    const { conflict, invalidatedSections: graphInvalidated } = applyGraphDecisions(
      graph,
      agentId,
      result,
    );
    if (conflict) {
      throw new AgentContractError(
        "recoverable",
        `Decision conflict on ${conflict.nodeId}: ${conflict.reason}`,
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
    next = {
      ...next,
      meta: {
        ...next.meta,
        revision: actualRevision + 1,
      },
    };

    const warnings = [...result.warnings];
    const errors: AgentError[] = result.errors ?? [];
    if (result.retryAdvice?.required) {
      warnings.push(`Retry advised: ${result.retryAdvice.reason}`);
    }

    return {
      blueprint: next,
      updatedSections,
      invalidatedSections: graphInvalidated,
      warnings,
      errors,
      decisionTrace: result.decisionTrace,
      nextStage: result.retryAdvice?.recommendedStage,
    };
  }
}
