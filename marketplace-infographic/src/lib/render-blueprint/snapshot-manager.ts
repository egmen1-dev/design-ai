/**
 * Chapter 3.8 — Snapshot & Recovery System
 * Immutable VALIDATED snapshots only. COW section storage. Checksum integrity.
 */
import { randomUUID } from "crypto";
import type { BlueprintSection, RenderBlueprint } from "./types";
import type { BlueprintLifecycle, LifecycleManagedSection } from "./lifecycle-types";
import { SectionState } from "./lifecycle-types";
import type { AgentContractId, AgentResultBase } from "./agent-contracts";
import type { DecisionGraph } from "./decision-graph";
import type { ValidationResult } from "./validation-types";
import type { ValidationReport } from "./validation-types";
import { ValidationLevel } from "./validation-types";
import { DEPENDENCY_CHILDREN, LifecycleTransitionError } from "./lifecycle";
import { hashSection, hashValue, getSectionValue } from "./section-hash";
import {
  DEFAULT_MAX_RECOVERY_ATTEMPTS,
  DEFAULT_SNAPSHOT_RETENTION,
  RecoveryEventType,
  RollbackStrategy,
  type BlueprintSnapshot,
  type RecoveryEvent,
  type RecoveryResult,
  type SnapshotComparison,
  type SnapshotDelta,
  type SnapshotMetadata,
  type SnapshotRecoveryOptions,
  type SnapshotRetentionPolicy,
  type RollbackStrategyId,
} from "./snapshot-types";
import { readBlueprintSchemaVersion } from "./blueprint-version";
import { CURRENT_PIPELINE_VERSION, DEFAULT_ADAPTER_VERSION } from "./version-engine";

export {
  RollbackStrategy,
  RecoveryEventType,
  DEFAULT_MAX_RECOVERY_ATTEMPTS,
  DEFAULT_SNAPSHOT_RETENTION,
  type BlueprintSnapshot,
  type SnapshotMetadata,
  type SnapshotDelta,
  type SnapshotComparison,
  type RecoveryEvent,
  type RecoveryResult,
  type SnapshotRecoveryOptions,
  type SnapshotRetentionPolicy,
  type LifecycleStageSnapshot,
} from "./snapshot-types";

/** @deprecated Ch 3.4 alias — use BlueprintSnapshot */
export type StageSnapshot = BlueprintSnapshot;

const MANAGED_SECTIONS: BlueprintSection[] = [
  "meta",
  "creative",
  "story",
  "product",
  "scene",
  "photography",
  "camera",
  "lighting",
  "materials",
  "composition",
  "background",
  "constraints",
  "validation",
  "render",
];

function cloneBlueprintForSnapshot(bp: RenderBlueprint): RenderBlueprint {
  return structuredClone({
    ...bp,
    lifecycle: { ...bp.lifecycle, snapshots: [] },
  });
}

export function validationResultFromReport(report: ValidationReport): ValidationResult {
  return {
    passed: report.passed,
    score: report.score,
    level: ValidationLevel.PROFESSIONAL,
    errors: report.errors,
    warnings: report.warnings,
    recommendations: report.recommendations,
  };
}

function computeChecksum(
  blueprint: RenderBlueprint,
  graph: BlueprintSnapshot["decisionGraph"],
  validation: ValidationResult,
): string {
  return hashValue({
    blueprint: cloneBlueprintForSnapshot(blueprint),
    graph,
    validation: {
      passed: validation.passed,
      score: validation.score,
      errors: validation.errors,
      warnings: validation.warnings,
    },
  });
}

function freezeSnapshot(snapshot: BlueprintSnapshot): BlueprintSnapshot {
  return Object.freeze(
    structuredClone(snapshot),
  ) as BlueprintSnapshot;
}

/** Copy-on-write section pool */
class SectionCowStore {
  private readonly pool = new Map<string, unknown>();

  captureRefs(blueprint: RenderBlueprint): Partial<Record<BlueprintSection, string>> {
    const refs: Partial<Record<BlueprintSection, string>> = {};
    for (const section of MANAGED_SECTIONS) {
      const hash = hashSection(blueprint, section);
      if (!this.pool.has(hash)) {
        this.pool.set(hash, structuredClone(getSectionValue(blueprint, section)));
      }
      refs[section] = hash;
    }
    return refs;
  }

  buildDeltas(
    refs: Partial<Record<BlueprintSection, string>>,
    previousRefs: Partial<Record<BlueprintSection, string>> | undefined,
    producer: string,
  ): SnapshotDelta[] {
    if (!previousRefs) return [];
    const deltas: SnapshotDelta[] = [];
    const now = Date.now();
    for (const section of MANAGED_SECTIONS) {
      const prev = previousRefs[section];
      const cur = refs[section];
      if (prev && cur && prev !== cur) {
        deltas.push({
          section,
          previousHash: prev,
          currentHash: cur,
          producer,
          timestamp: now,
        });
      }
    }
    return deltas;
  }
}

export class SnapshotIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SnapshotIntegrityError";
  }
}

export class RecoveryLimitExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecoveryLimitExceededError";
  }
}

export class SnapshotManager {
  private readonly snapshots: BlueprintSnapshot[] = [];
  private readonly cow = new SectionCowStore();
  private readonly options: SnapshotRecoveryOptions;
  private recoveryAttempts = 0;
  private lastRecoveryEvents: RecoveryEvent[] = [];

  constructor(options: SnapshotRecoveryOptions = {}) {
    this.options = {
      maxRecoveryAttempts: options.maxRecoveryAttempts ?? DEFAULT_MAX_RECOVERY_ATTEMPTS,
      debugMode: options.debugMode ?? false,
      retention: options.retention ?? DEFAULT_SNAPSHOT_RETENTION,
    };
  }

  getAll(): readonly BlueprintSnapshot[] {
    return this.snapshots;
  }

  getRecoveryAttempts(): number {
    return this.recoveryAttempts;
  }

  getLastRecoveryEvents(): readonly RecoveryEvent[] {
    return this.lastRecoveryEvents;
  }

  getById(id: string): BlueprintSnapshot | undefined {
    return this.snapshots.find((s) => s.id === id);
  }

  /**
   * Create snapshot — only after successful validation when validated=true.
   * Snapshot is immutable after creation.
   */
  store(params: {
    blueprint: RenderBlueprint;
    graph: DecisionGraph;
    stage: BlueprintLifecycle;
    agentId?: AgentContractId;
    agentResult?: AgentResultBase;
    validated?: boolean;
    validation?: ValidationResult | ValidationReport;
    metadata?: Partial<SnapshotMetadata>;
    durationMs?: number;
  }): BlueprintSnapshot {
    const validated = params.validated ?? false;
    const validation =
      params.validation && "level" in params.validation
        ? params.validation
        : params.validation
          ? validationResultFromReport(params.validation)
          : {
              passed: validated,
              score: validated ? 100 : 0,
              level: ValidationLevel.SCHEMA,
              errors: [],
              warnings: [],
              recommendations: [],
            };

    if (validated && !validation.passed) {
      throw new LifecycleTransitionError(
        "Snapshot refused: validation must pass before VALIDATED snapshot",
      );
    }

    const graphSnap = params.graph.exportSnapshot();
    const blueprint = cloneBlueprintForSnapshot(params.blueprint);
    const previous = this.snapshots.at(-1);
    const sectionRefs = this.cow.captureRefs(blueprint);
    const deltas = this.cow.buildDeltas(
      sectionRefs,
      previous?.sectionRefs,
      params.agentId ?? params.metadata?.agent ?? "system",
    );

    const metadata: SnapshotMetadata = {
      createdBy: params.metadata?.createdBy ?? params.agentId ?? "system",
      duration: params.metadata?.duration ?? params.durationMs ?? 0,
      agent: params.metadata?.agent ?? params.agentId ?? "system",
      retry: params.metadata?.retry ?? params.blueprint.meta.retry ?? 0,
      seed: params.metadata?.seed ?? params.blueprint.meta.seed,
      provider: params.metadata?.provider ?? params.blueprint.render.provider,
      version:
        params.metadata?.version ??
        params.blueprint.meta.schemaVersion ??
        String(params.blueprint.meta.version),
      blueprintVersion:
        params.metadata?.blueprintVersion ??
        params.blueprint.meta.schemaVersion ??
        readBlueprintSchemaVersion(params.blueprint as unknown as Record<string, unknown>),
      pipelineVersion: params.metadata?.pipelineVersion ?? CURRENT_PIPELINE_VERSION,
      agentVersions: params.metadata?.agentVersions,
      adapterVersion: params.metadata?.adapterVersion ?? DEFAULT_ADAPTER_VERSION,
    };

    const checksum = computeChecksum(blueprint, graphSnap, validation);

    const snapshot: BlueprintSnapshot = freezeSnapshot({
      id: randomUUID(),
      revision: params.blueprint.meta.revision ?? 0,
      stage: params.stage,
      timestamp: Date.now(),
      blueprint,
      decisionGraph: graphSnap,
      validation,
      metadata,
      checksum,
      validated,
      deltas,
      sectionRefs,
    });

    this.verifyIntegrity(snapshot);
    this.snapshots.push(snapshot);
    return snapshot;
  }

  verifyIntegrity(snapshot: BlueprintSnapshot): void {
    const expected = computeChecksum(
      snapshot.blueprint,
      snapshot.decisionGraph,
      snapshot.validation,
    );
    if (expected !== snapshot.checksum) {
      throw new SnapshotIntegrityError(
        `Snapshot ${snapshot.id} checksum mismatch — snapshot is corrupted`,
      );
    }
  }

  /** Rollback to last VALIDATED snapshot — Blueprint Rollback */
  rollbackToLastValidated(current: RenderBlueprint, graph: DecisionGraph): RecoveryResult {
    const validated = [...this.snapshots].reverse().find((s) => s.validated);
    if (!validated) {
      throw new LifecycleTransitionError("No VALIDATED snapshot available for rollback");
    }
    return this.recover(validated.id, current, graph, RollbackStrategy.BLUEPRINT);
  }

  rollbackToSnapshot(
    snapshotId: string,
    current: RenderBlueprint,
    graph: DecisionGraph,
  ): RecoveryResult {
    return this.recover(snapshotId, current, graph, RollbackStrategy.BLUEPRINT);
  }

  /** Stage Rollback — restore entire stage */
  rollbackStage(
    stage: BlueprintLifecycle,
    current: RenderBlueprint,
    graph: DecisionGraph,
  ): RecoveryResult {
    const snapshot = [...this.snapshots]
      .reverse()
      .find((s) => s.validated && s.stage === stage);
    if (!snapshot) {
      throw new LifecycleTransitionError(`No VALIDATED snapshot for stage ${stage}`);
    }
    return this.recover(snapshot.id, current, graph, RollbackStrategy.STAGE);
  }

  /** Section Rollback — restore one section, invalidate dependents */
  rollbackSection(
    section: LifecycleManagedSection,
    current: RenderBlueprint,
    graph: DecisionGraph,
  ): RecoveryResult {
    const snapshot = [...this.snapshots]
      .reverse()
      .find((s) => s.validated);
    if (!snapshot) {
      throw new LifecycleTransitionError("No VALIDATED snapshot for section rollback");
    }
    return this.recover(snapshot.id, current, graph, RollbackStrategy.SECTION, section);
  }

  /**
   * Recovery algorithm:
   * locate → restore blueprint + graph → invalidate deps → resume
   */
  recover(
    snapshotId: string,
    current: RenderBlueprint,
    graph: DecisionGraph,
    strategy: RollbackStrategyId = RollbackStrategy.BLUEPRINT,
    section?: LifecycleManagedSection,
  ): RecoveryResult {
    if (this.recoveryAttempts >= (this.options.maxRecoveryAttempts ?? DEFAULT_MAX_RECOVERY_ATTEMPTS)) {
      throw new RecoveryLimitExceededError(
        `Max recovery attempts (${this.options.maxRecoveryAttempts}) exceeded`,
      );
    }

    const snapshot = this.snapshots.find((s) => s.id === snapshotId);
    if (!snapshot) {
      throw new LifecycleTransitionError(`Snapshot not found: ${snapshotId}`);
    }
    if (!snapshot.validated) {
      throw new LifecycleTransitionError(
        `Rollback refused: snapshot ${snapshotId} is not VALIDATED`,
      );
    }

    this.verifyIntegrity(snapshot);

    const events: RecoveryEvent[] = [];
    const push = (type: RecoveryEvent["type"], detail?: string) => {
      events.push({
        type,
        snapshotId,
        stage: snapshot.stage,
        revision: snapshot.revision,
        timestamp: Date.now(),
        detail,
      });
    };

    push(RecoveryEventType.RecoveryStarted, strategy);
    this.recoveryAttempts += 1;

    const blueprint = structuredClone(snapshot.blueprint);
    blueprint.lifecycle.snapshots = [...current.lifecycle.snapshots];
    blueprint.meta.locked = false;
    blueprint.lifecycle.frozenAt = undefined;

    graph.restoreFromSnapshot(snapshot.decisionGraph);
    push(RecoveryEventType.SnapshotLoaded);

    let invalidatedSections: BlueprintSection[] = [];

    if (strategy === RollbackStrategy.SECTION && section) {
      const sourceValue = getSectionValue(snapshot.blueprint, section);
      (blueprint as Record<string, unknown>)[section] = structuredClone(sourceValue);
      invalidatedSections = [...DEPENDENCY_CHILDREN[section]];
      for (const dep of invalidatedSections) {
        if (blueprint.lifecycle.sections[dep as LifecycleManagedSection] === SectionState.LOCKED) {
          blueprint.lifecycle.sections[dep as LifecycleManagedSection] = SectionState.DIRTY;
        }
      }
      push(RecoveryEventType.DependenciesInvalidated, invalidatedSections.join(","));
    } else if (strategy === RollbackStrategy.STAGE) {
      invalidatedSections = MANAGED_SECTIONS.filter(
        (s) => s !== "meta" && s !== "render",
      ) as BlueprintSection[];
      push(RecoveryEventType.DependenciesInvalidated, snapshot.stage);
    }

    const resumeFrom = snapshot.stage;
    blueprint.lifecycle.stage = resumeFrom;
    push(RecoveryEventType.PipelineResumed, resumeFrom);
    push(RecoveryEventType.RecoveryFinished);

    this.lastRecoveryEvents = events;

    return {
      blueprint,
      graph: snapshot.decisionGraph,
      snapshot,
      strategy,
      invalidatedSections,
      events,
      resumeFrom,
    };
  }

  compare(snapshotIdA: string, snapshotIdB: string): SnapshotComparison {
    const a = this.getById(snapshotIdA);
    const b = this.getById(snapshotIdB);
    if (!a || !b) {
      throw new LifecycleTransitionError("Snapshot not found for comparison");
    }

    const changedSections: BlueprintSection[] = [];
    for (const section of MANAGED_SECTIONS) {
      const ha = a.sectionRefs[section] ?? hashSection(a.blueprint, section);
      const hb = b.sectionRefs[section] ?? hashSection(b.blueprint, section);
      if (ha !== hb) changedSections.push(section);
    }

    const constraintKeysA = new Set(
      Object.keys(a.blueprint.constraints).filter((k) => k !== "set"),
    );
    const changedConstraints: string[] = [];
    for (const key of Object.keys(b.blueprint.constraints)) {
      if (key === "set") continue;
      const av = (a.blueprint.constraints as Record<string, unknown>)[key];
      const bv = (b.blueprint.constraints as Record<string, unknown>)[key];
      if (av !== bv) changedConstraints.push(key);
    }
    for (const key of constraintKeysA) {
      if (!(key in b.blueprint.constraints)) changedConstraints.push(key);
    }

    const nodesA = new Map(a.decisionGraph.map((n) => [n.id, n]));
    const changedDecisionNodes: string[] = [];
    for (const node of b.decisionGraph) {
      const prev = nodesA.get(node.id);
      if (!prev || hashValue(prev.value) !== hashValue(node.value) || prev.state !== node.state) {
        changedDecisionNodes.push(node.id);
      }
    }

    return {
      snapshotA: snapshotIdA,
      snapshotB: snapshotIdB,
      changedSections,
      changedConstraints,
      changedDecisionNodes,
      validationDiff: {
        scoreDelta: b.validation.score - a.validation.score,
        errorsAdded: Math.max(0, b.validation.errors.length - a.validation.errors.length),
        errorsRemoved: Math.max(0, a.validation.errors.length - b.validation.errors.length),
        warningsAdded: Math.max(0, b.validation.warnings.length - a.validation.warnings.length),
      },
    };
  }

  /** Replay snapshot chain in order */
  replay(): BlueprintSnapshot[] {
    return [...this.snapshots].sort((x, y) => x.timestamp - y.timestamp);
  }

  /**
   * Retention — after successful pipeline: keep final (+ debug/failure per policy)
   */
  applyRetention(pipelineSucceeded: boolean, failed = false): BlueprintSnapshot[] {
    if (!this.snapshots.length) return [];

    const policy = this.options.retention ?? DEFAULT_SNAPSHOT_RETENTION;
    const final = this.snapshots[this.snapshots.length - 1]!;
    const kept: BlueprintSnapshot[] = [];

    if (pipelineSucceeded && policy.keepFinal) kept.push(final);
    if (failed && policy.keepFailure) {
      const failure = [...this.snapshots].reverse().find((s) => !s.validated) ?? final;
      if (!kept.some((s) => s.id === failure.id)) kept.push(failure);
    }
    if (this.options.debugMode && policy.keepDebug) {
      kept.push(...this.snapshots.filter((s) => !kept.some((k) => k.id === s.id)));
    }

    this.snapshots.length = 0;
    this.snapshots.push(...kept);
    return kept;
  }
}
