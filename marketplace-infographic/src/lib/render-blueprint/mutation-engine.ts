/**
 * Chapter 3.5 — Mutation Engine
 * Sole component allowed to mutate RenderBlueprint.
 */
import type { BlueprintSection, RenderBlueprint } from "./types";
import type { LifecycleManagedSection } from "./lifecycle-types";
import { SectionState } from "./lifecycle-types";
import {
  type AgentContractId,
  type AgentError,
  type AgentResultBase,
  type AgentSectionUpdates,
  type BlueprintMutationResult,
  assertAgentConfidence,
  AgentContractError,
} from "./agent-contracts";
import type { BlueprintAgent } from "./agent-contracts";
import { DecisionGraph, type DecisionConflict, DECISION_NODE_ID } from "./decision-graph";
import type { SectionPayloadMap } from "./patch";
import { hashSection, hashValue } from "./section-hash";
import {
  mergeSectionPayload,
  validateBatchConflicts,
  validateMutation,
} from "./mutation-validators";
import type {
  BlueprintMutation,
  MutationAppliedEvent,
  MutationApplyResult,
  MutationAuditEntry,
  MutationBatch,
  MutationBatchResult,
} from "./mutation-types";

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

function nodeIdForSection(section: BlueprintSection): string {
  return section === "materials" ? "materials" : section;
}

/** Shallow blueprint update — only one section reference replaced (Performance Rule) */
function applySectionShallow(
  blueprint: RenderBlueprint,
  section: BlueprintSection,
  merged: unknown,
  producer: string,
  revision: number,
): RenderBlueprint {
  const sections = { ...blueprint.lifecycle.sections };
  if (isManagedSection(section)) {
    sections[section] = SectionState.READY;
  }

  const base = {
    ...blueprint,
    lifecycle: { ...blueprint.lifecycle, sections },
    meta: {
      ...blueprint.meta,
      revision,
      audit: [
        ...(blueprint.meta.audit ?? []),
        {
          agentId: producer,
          section,
          action: "patch" as const,
          at: Date.now(),
        },
      ],
    },
  };

  switch (section) {
    case "creative":
      return { ...base, creative: merged as RenderBlueprint["creative"] };
    case "story":
      return { ...base, story: merged as RenderBlueprint["story"] };
    case "product":
      return { ...base, product: merged as RenderBlueprint["product"] };
    case "scene":
      return { ...base, scene: merged as RenderBlueprint["scene"] };
    case "photography":
      return { ...base, photography: merged as RenderBlueprint["photography"] };
    case "camera":
      return { ...base, camera: merged as RenderBlueprint["camera"] };
    case "lighting":
      return { ...base, lighting: merged as RenderBlueprint["lighting"] };
    case "materials":
      return { ...base, materials: merged as RenderBlueprint["materials"] };
    case "composition":
      return { ...base, composition: merged as RenderBlueprint["composition"] };
    case "background":
      return { ...base, background: merged as RenderBlueprint["background"] };
    case "constraints":
      return { ...base, constraints: merged as RenderBlueprint["constraints"] };
    case "validation":
      return { ...base, validation: merged as RenderBlueprint["validation"] };
    default:
      return base;
  }
}

function applyGraphForMutation(
  graph: DecisionGraph,
  mutation: BlueprintMutation,
  confidence: number,
): { conflict: DecisionConflict | null; invalidatedSections: BlueprintSection[] } {
  const section = mutation.section;
  if (!isDecisionGraphSection(section)) {
    return { conflict: null, invalidatedSections: [] };
  }
  const nodeId = nodeIdForSection(section);
  const conflict = graph.proposeUpdate(
    nodeId,
    mutation.producer as import("./decision-graph").DecisionProducerId,
    mutation.payload,
    confidence,
  );
  if (conflict) return { conflict, invalidatedSections: [] };
  graph.assertValid();
  const results = graph.commitPending();
  graph.setNodeState(nodeId, SectionState.READY);
  const invalidated = new Set<BlueprintSection>();
  for (const inv of results) {
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
  private readonly auditTrail: MutationAuditEntry[] = [];
  private readonly eventListeners: Array<(event: MutationAppliedEvent) => void> = [];

  getAuditTrail(): readonly MutationAuditEntry[] {
    return this.auditTrail;
  }

  onMutationApplied(listener: (event: MutationAppliedEvent) => void): () => void {
    this.eventListeners.push(listener);
    return () => {
      this.eventListeners = this.eventListeners.filter((l) => l !== listener);
    };
  }

  private emit(event: MutationAppliedEvent): void {
    for (const listener of this.eventListeners) listener(event);
  }

  /** Atomic — one section per mutation */
  applyMutation(
    blueprint: RenderBlueprint,
    graph: DecisionGraph,
    mutation: BlueprintMutation,
    confidence = 80,
  ): MutationApplyResult {
    const started = Date.now();
    const validation = validateMutation(blueprint, graph, mutation);
    if (validation) {
      throw new MutationEngineError(validation.message, validation.code);
    }

    const previousHash = hashSection(blueprint, mutation.section);
    const merged = mergeSectionPayload(
      blueprint,
      mutation.section as keyof SectionPayloadMap,
      mutation.payload as SectionPayloadMap[keyof SectionPayloadMap],
    );
    const newHash = hashValue(merged);

    if (previousHash === newHash) {
      return {
        blueprint,
        applied: false,
        skipped: true,
        revision: blueprint.meta.revision ?? 0,
        invalidatedSections: [],
      };
    }

    const { conflict, invalidatedSections } = applyGraphForMutation(graph, mutation, confidence);
    if (conflict) {
      throw new AgentContractError(
        "recoverable",
        `Decision conflict on ${conflict.nodeId}: ${conflict.reason}`,
        "DECISION_CONFLICT",
      );
    }

    const nextRevision = (blueprint.meta.revision ?? 0) + 1;
    let next = applySectionShallow(
      blueprint,
      mutation.section,
      merged,
      mutation.producer,
      nextRevision,
    );
    next = graph.syncStatesToBlueprint(next);

    const duration = Date.now() - started;
    const audit: MutationAuditEntry = {
      revision: nextRevision,
      producer: mutation.producer,
      section: mutation.section,
      timestamp: mutation.timestamp,
      previousValueHash: previousHash,
      newValueHash: newHash,
      durationMs: duration,
      reason: mutation.reason,
    };
    this.auditTrail.push(audit);

    const event: MutationAppliedEvent = {
      section: mutation.section,
      revision: nextRevision,
      producer: mutation.producer,
      duration,
    };
    this.emit(event);

    return {
      blueprint: next,
      applied: true,
      skipped: false,
      revision: nextRevision,
      invalidatedSections,
      event,
      audit,
    };
  }

  /** Batch — each mutation validated separately; Recovery Rule on failure */
  applyBatch(
    blueprint: RenderBlueprint,
    graph: DecisionGraph,
    batch: MutationBatch,
    confidence = 80,
  ): MutationBatchResult {
    const conflict = validateBatchConflicts(batch);
    if (conflict) {
      throw new MutationEngineError(conflict.message, conflict.code);
    }

    const original = blueprint;
    const originalRevision = blueprint.meta.revision ?? 0;
    const graphSnapshot = graph.exportSnapshot();
    const auditStart = this.auditTrail.length;

    const lockRevision = batch.mutations[0]?.expectedRevision;
    if (lockRevision !== undefined && lockRevision !== originalRevision) {
      throw new MutationEngineError(
        `Optimistic lock failed: agent started at revision ${lockRevision}, blueprint is ${originalRevision}`,
        "OPTIMISTIC_LOCK",
      );
    }

    let current = blueprint;
    const results: MutationApplyResult[] = [];
    let appliedCount = 0;
    let skippedCount = 0;

    let simRevision = originalRevision;
    for (const mutation of batch.mutations) {
      const err = validateMutation(
        { ...current, meta: { ...current.meta, revision: simRevision } },
        graph,
        { ...mutation, expectedRevision: simRevision },
      );
      if (err) {
        throw new MutationEngineError(err.message, err.code);
      }
      const merged = mergeSectionPayload(
        current,
        mutation.section as keyof SectionPayloadMap,
        mutation.payload as SectionPayloadMap[keyof SectionPayloadMap],
      );
      if (hashSection(current, mutation.section) !== hashValue(merged)) {
        simRevision += 1;
      }
    }

    try {
      for (const mutation of batch.mutations) {
        const m = {
          ...mutation,
          expectedRevision: current.meta.revision ?? 0,
          timestamp: mutation.timestamp || Date.now(),
        };
        const result = this.applyMutation(current, graph, m, confidence);
        results.push(result);
        if (result.skipped) {
          skippedCount += 1;
        } else if (result.applied) {
          appliedCount += 1;
          current = result.blueprint;
        }
      }
    } catch (error) {
      graph.restoreFromSnapshot(graphSnapshot);
      this.auditTrail.splice(auditStart);
      throw new MutationEngineError(
        `Batch aborted — blueprint unchanged at revision ${originalRevision}: ${error instanceof Error ? error.message : "unknown"}`,
        "BATCH_ROLLBACK",
      );
    }

    if (current.meta.revision === originalRevision && appliedCount === 0) {
      return { blueprint: original, results, appliedCount, skippedCount };
    }

    return { blueprint: current, results, appliedCount, skippedCount };
  }

  /** Legacy Ch 3.2/3.4 — AgentResult → MutationBatch */
  apply(ctx: MutationContext): BlueprintMutationResult {
    const { agent, blueprint, graph, result, expectedRevision } = ctx;
    const agentId = agent.id;

    assertAgentConfidence(result.confidence, agentId);

    if (result.errors?.some((e) => e.kind === "fatal")) {
      throw new AgentContractError(
        "fatal",
        `Fatal agent errors from ${agentId}`,
        "AGENT_FATAL",
      );
    }

    const mutations: BlueprintMutation[] = [];
    for (const key of Object.keys(result.updates) as (keyof AgentSectionUpdates)[]) {
      if (key === "meta" || key === "render") continue;
      const data = result.updates[key];
      if (!data) continue;
      mutations.push({
        section: key as BlueprintSection,
        producer: agentId,
        expectedRevision,
        payload: data,
        reason: result.decisionTrace[0] ?? `agent ${agentId}`,
        timestamp: Date.now(),
      });
    }

    if (mutations.length === 0) {
      return {
        blueprint,
        updatedSections: [],
        invalidatedSections: [],
        warnings: [...result.warnings],
        errors: result.errors ?? [],
        decisionTrace: result.decisionTrace,
        nextStage: result.retryAdvice?.recommendedStage,
      };
    }

    const batchResult = this.applyBatch(blueprint, graph, { mutations }, result.confidence);

    const updatedSections = batchResult.results
      .filter((r) => r.applied)
      .map((r) => r.event!.section as LifecycleManagedSection)
      .filter(isManagedSection);

    const invalidated = new Set<BlueprintSection>();
    for (const r of batchResult.results) {
      for (const s of r.invalidatedSections) invalidated.add(s);
    }

    const warnings = [...result.warnings];
    const errors: AgentError[] = result.errors ?? [];
    if (result.retryAdvice?.required) {
      warnings.push(`Retry advised: ${result.retryAdvice.reason}`);
    }

    return {
      blueprint: batchResult.blueprint,
      updatedSections,
      invalidatedSections: [...invalidated],
      warnings,
      errors,
      decisionTrace: result.decisionTrace,
      nextStage: result.retryAdvice?.recommendedStage,
    };
  }
}

export type {
  BlueprintMutation,
  MutationBatch,
  MutationAppliedEvent,
  MutationAuditEntry,
  MutationApplyResult,
  MutationBatchResult,
} from "./mutation-types";

function sectionKeyToPatchSection(
  key: keyof AgentSectionUpdates,
): keyof SectionPayloadMap | null {
  if (key === "meta" || key === "render") return null;
  return key as keyof SectionPayloadMap;
}

// re-export for validators that need agent contract id cast
export type { AgentContractId };
