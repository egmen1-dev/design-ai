/**
 * Chapter 3.4 — Snapshot Manager
 * Immutable snapshots after successful mutations. Rollback to last VALIDATED only.
 */
import { randomUUID } from "crypto";
import type { RenderBlueprint } from "./types";
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { AgentContractId, AgentResultBase } from "./agent-contracts";
import type { DecisionGraph } from "./decision-graph";
import type { StageSnapshot } from "./lifecycle-manager-types";
import { LifecycleTransitionError } from "./lifecycle";

export class SnapshotManager {
  private readonly snapshots: StageSnapshot[] = [];

  getAll(): readonly StageSnapshot[] {
    return this.snapshots;
  }

  store(params: {
    blueprint: RenderBlueprint;
    graph: DecisionGraph;
    stage: BlueprintLifecycle;
    agentId?: AgentContractId;
    agentResult?: AgentResultBase;
    validated?: boolean;
  }): StageSnapshot {
    const snapshot: StageSnapshot = {
      id: randomUUID(),
      stage: params.stage,
      createdAt: Date.now(),
      revision: params.blueprint.meta.revision ?? 0,
      validated: params.validated ?? false,
      blueprint: structuredClone({
        ...params.blueprint,
        lifecycle: { ...params.blueprint.lifecycle, snapshots: [] },
      }),
      graph: params.graph.exportSnapshot(),
      agentId: params.agentId,
      agentResult: params.agentResult
        ? structuredClone(params.agentResult)
        : undefined,
    };
    this.snapshots.push(snapshot);
    return snapshot;
  }

  /** Rollback to last VALIDATED snapshot — never to DIRTY state */
  rollbackToLastValidated(current: RenderBlueprint, graph: DecisionGraph): {
    blueprint: RenderBlueprint;
    snapshot: StageSnapshot;
    graph: DecisionGraph;
  } {
    const validated = [...this.snapshots].reverse().find((s) => s.validated);
    if (!validated) {
      throw new LifecycleTransitionError("No VALIDATED snapshot available for rollback");
    }
    return this.restoreSnapshot(validated, current, graph);
  }

  rollbackToSnapshot(
    snapshotId: string,
    current: RenderBlueprint,
    graph: DecisionGraph,
  ): { blueprint: RenderBlueprint; snapshot: StageSnapshot; graph: DecisionGraph } {
    const snapshot = this.snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) {
      throw new LifecycleTransitionError(`Snapshot not found: ${snapshotId}`);
    }
    if (!snapshot.validated) {
      throw new LifecycleTransitionError(
        `Rollback refused: snapshot ${snapshotId} is not VALIDATED`,
      );
    }
    return this.restoreSnapshot(snapshot, current, graph);
  }

  private restoreSnapshot(
    snapshot: StageSnapshot,
    current: RenderBlueprint,
    graph: DecisionGraph,
  ): { blueprint: RenderBlueprint; snapshot: StageSnapshot; graph: DecisionGraph } {
    const blueprint = structuredClone(snapshot.blueprint);
    blueprint.lifecycle.snapshots = [...current.lifecycle.snapshots];
    graph.restoreFromSnapshot(snapshot.graph);
    return { blueprint, snapshot, graph };
  }
}
