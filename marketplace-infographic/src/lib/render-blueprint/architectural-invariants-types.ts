/**
 * Chapter 3.19 — Architectural Invariants types
 */
import type { RenderBlueprint } from "./types";
import type { RecoveryInvariantViolation } from "./recovery-types";

export const ArchitecturalInvariantId = {
  SINGLE_SOURCE_OF_TRUTH: "INV_01",
  IMMUTABLE_HISTORY: "INV_02",
  AGENT_ISOLATION: "INV_03",
  BLUEPRINT_OWNERSHIP: "INV_04",
  LIFECYCLE_AUTHORITY: "INV_05",
  MUTATION_SAFETY: "INV_06",
  VALIDATION_BEFORE_COMMIT: "INV_07",
  SNAPSHOT_CONSISTENCY: "INV_08",
  PROVIDER_INDEPENDENCE: "INV_09",
  PROMPT_ISOLATION: "INV_10",
  STATELESS_AGENTS: "INV_11",
  DETERMINISTIC_PIPELINE: "INV_12",
  EVENT_DRIVEN_COMMUNICATION: "INV_13",
  VERSION_COMPATIBILITY: "INV_14",
  EXPLAINABILITY: "INV_15",
  RECOVERY_SAFETY: "INV_16",
  VISION_INDEPENDENCE: "INV_17",
  COMPOSITE_ISOLATION: "INV_18",
  ADAPTER_RESPONSIBILITY: "INV_19",
  SINGLE_RESPONSIBILITY: "INV_20",
  NO_HIDDEN_STATE: "INV_21",
  OPEN_ARCHITECTURE: "INV_22",
  ARCHITECTURE_OVER_IMPLEMENTATION: "INV_23",
} as const;

export type ArchitecturalInvariantIdValue =
  (typeof ArchitecturalInvariantId)[keyof typeof ArchitecturalInvariantId];

export type ArchitecturalInvariantDefinition = {
  id: ArchitecturalInvariantIdValue;
  name: string;
  summary: string;
  goldenRule: boolean;
};

export type ArchitecturalInvariantSeverity = "fatal" | "error" | "warning";

export type ArchitecturalInvariantViolation = {
  invariantId: ArchitecturalInvariantIdValue;
  severity: ArchitecturalInvariantSeverity;
  message: string;
  component?: string;
  evidence?: string;
};

export type ArchitectureValidationReport = {
  valid: boolean;
  checkedAt: number;
  invariantCount: number;
  violations: ArchitecturalInvariantViolation[];
  passed: ArchitecturalInvariantIdValue[];
  failed: ArchitecturalInvariantIdValue[];
};

/** Runtime signals for invariant checks — no blueprint-only heuristics */
export type ArchitectureValidationContext = {
  blueprint: RenderBlueprint;
  pipelineId?: string;
  /** Parallel blueprint copies outside RenderBlueprint (INV_01) */
  shadowStateStores?: string[];
  /** Decision/event/mutation history was mutated in place (INV_02) */
  historyMutated?: boolean;
  /** Agent invoked another agent directly (INV_03) */
  agentCrossCalls?: { from: string; to: string }[];
  /** Mutation applied outside Mutation Engine (INV_06) */
  directBlueprintMutation?: boolean;
  /** Mutation committed without validation (INV_07) */
  mutationWithoutValidation?: boolean;
  /** Snapshot created before validation passed (INV_08) */
  snapshotWithoutValidation?: boolean;
  /** Agent code references provider id (INV_09) */
  agentKnowsProvider?: { agentId: string; provider: string }[];
  /** Agent retained internal state after run (INV_11) */
  agentRetainedState?: { agentId: string }[];
  /** Same inputs produced different decisions (INV_12) */
  nonDeterministicRun?: boolean;
  /** Direct call between modules that must use Event Bus (INV_13) */
  directModuleCalls?: { from: string; to: string }[];
  /** Decisions without who/when/why (INV_15) */
  unexplainedDecisions?: { decisionId: string }[];
  /** Recovery plan would break invariants (INV_16) */
  recoveryViolations?: RecoveryInvariantViolation[];
  /** Vision QA accessed blueprint/prompt (INV_17) */
  visionUsesBlueprint?: boolean;
  /** Composite layer altered background pixels (INV_18) */
  compositeMutatesBackground?: boolean;
  /** Adapter chose design parameters not in blueprint (INV_19) */
  adapterMakesDesignDecisions?: boolean;
  /** Unauthorized lifecycle transition (INV_05) */
  unauthorizedLifecycleAction?: { actor: string; action: string };
  /** State stored outside allowed stores (INV_21) */
  hiddenStateStores?: string[];
  /** Extension blocked — registry closed (INV_22) */
  closedExtension?: { component: string };
};

export type ArchitectureValidatorOptions = {
  /** Stop on first fatal violation */
  failFast?: boolean;
  /** Include warnings in valid result */
  allowWarnings?: boolean;
};
