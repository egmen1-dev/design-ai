/**
 * Chapter 3.8 — Snapshot & Recovery types
 */
import type { BlueprintSection } from "./types";
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { DecisionNodeSnapshot } from "./lifecycle-manager-types";
import type { ValidationResult } from "./validation-types";

export const RollbackStrategy = {
  SECTION: "SECTION",
  STAGE: "STAGE",
  BLUEPRINT: "BLUEPRINT",
} as const;

export type RollbackStrategyId = (typeof RollbackStrategy)[keyof typeof RollbackStrategy];

export const RecoveryEventType = {
  RecoveryStarted: "RecoveryStarted",
  SnapshotLoaded: "SnapshotLoaded",
  DependenciesInvalidated: "DependenciesInvalidated",
  PipelineResumed: "PipelineResumed",
  RecoveryFinished: "RecoveryFinished",
} as const;

export type RecoveryEventTypeId = (typeof RecoveryEventType)[keyof typeof RecoveryEventType];

export type RecoveryEvent = {
  type: RecoveryEventTypeId;
  snapshotId: string;
  stage: BlueprintLifecycle;
  revision: number;
  timestamp: number;
  detail?: string;
};

export type SnapshotMetadata = {
  createdBy: string;
  duration: number;
  agent: string;
  retry: number;
  seed: number;
  provider: string;
  /** Legacy integer or string — prefer blueprintVersion */
  version: string;
  /** Ch 3.13 — full version record for replay */
  blueprintVersion?: string;
  pipelineVersion?: string;
  agentVersions?: Record<string, string>;
  adapterVersion?: string;
};

export type SnapshotDelta = {
  section: BlueprintSection;
  previousHash: string;
  currentHash: string;
  producer: string;
  timestamp: number;
};

/** Ch 3.8 — full pipeline snapshot (runtime only, immutable after creation) */
export type BlueprintSnapshot = {
  id: string;
  revision: number;
  stage: BlueprintLifecycle;
  timestamp: number;
  blueprint: import("./types").RenderBlueprint;
  decisionGraph: DecisionNodeSnapshot[];
  validation: ValidationResult;
  metadata: SnapshotMetadata;
  checksum: string;
  /** Only VALIDATED snapshots are valid recovery points */
  validated: boolean;
  deltas: SnapshotDelta[];
  /** Copy-on-write section hashes — unchanged sections reuse pool entries */
  sectionRefs: Partial<Record<BlueprintSection, string>>;
};

export type SnapshotComparison = {
  snapshotA: string;
  snapshotB: string;
  changedSections: BlueprintSection[];
  changedConstraints: string[];
  changedDecisionNodes: string[];
  validationDiff: {
    scoreDelta: number;
    errorsAdded: number;
    errorsRemoved: number;
    warningsAdded: number;
  };
};

export type SnapshotRetentionPolicy = {
  keepFinal: boolean;
  keepDebug: boolean;
  keepFailure: boolean;
};

export const DEFAULT_SNAPSHOT_RETENTION: SnapshotRetentionPolicy = {
  keepFinal: true,
  keepDebug: false,
  keepFailure: true,
};

export type SnapshotRecoveryOptions = {
  maxRecoveryAttempts?: number;
  debugMode?: boolean;
  retention?: SnapshotRetentionPolicy;
};

export const DEFAULT_MAX_RECOVERY_ATTEMPTS = 3;

export type RecoveryResult = {
  blueprint: import("./types").RenderBlueprint;
  graph: DecisionNodeSnapshot[];
  snapshot: BlueprintSnapshot;
  strategy: RollbackStrategyId;
  invalidatedSections: BlueprintSection[];
  events: RecoveryEvent[];
  resumeFrom: BlueprintLifecycle;
};

/** @deprecated Ch 3.1 lightweight snapshot stored on blueprint.lifecycle.snapshots */
export type LifecycleStageSnapshot = {
  id: string;
  stage: BlueprintLifecycle;
  createdAt: number;
  blueprint: import("./types").RenderBlueprint;
};
