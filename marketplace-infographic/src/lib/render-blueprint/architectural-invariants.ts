/**
 * Chapter 3.19 — Architectural Invariants catalog
 * Fundamental immutable rules of Design AI v18.
 */
import {
  ArchitecturalInvariantId,
  type ArchitecturalInvariantDefinition,
  type ArchitecturalInvariantIdValue,
} from "./architectural-invariants-types";

export {
  ArchitecturalInvariantId,
  type ArchitecturalInvariantDefinition,
  type ArchitecturalInvariantIdValue,
  type ArchitecturalInvariantSeverity,
  type ArchitecturalInvariantViolation,
  type ArchitectureValidationContext,
  type ArchitectureValidationReport,
  type ArchitectureValidatorOptions,
} from "./architectural-invariants-types";

export const ARCHITECTURAL_INVARIANTS_VERSION = "3.19.0";

/** All 23 invariants — cannot be disabled, changed by config, or bypassed by Recovery */
export const ARCHITECTURAL_INVARIANTS: readonly ArchitecturalInvariantDefinition[] = [
  {
    id: ArchitecturalInvariantId.SINGLE_SOURCE_OF_TRUTH,
    name: "Single Source of Truth",
    summary: "RenderBlueprint is the only source of generation state.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.IMMUTABLE_HISTORY,
    name: "Immutable History",
    summary: "Decision Graph, Event Log, Mutation Log, and Snapshots are append-only.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.AGENT_ISOLATION,
    name: "Agent Isolation",
    summary: "Agents interact only through RenderBlueprint and Lifecycle Manager.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.BLUEPRINT_OWNERSHIP,
    name: "Blueprint Ownership",
    summary: "Each blueprint section has exactly one owning agent.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.LIFECYCLE_AUTHORITY,
    name: "Lifecycle Authority",
    summary: "Only Lifecycle Manager may run stages, retry, rollback, or change lifecycle.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.MUTATION_SAFETY,
    name: "Mutation Safety",
    summary: "All blueprint changes must pass through Mutation Engine.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.VALIDATION_BEFORE_COMMIT,
    name: "Validation Before Commit",
    summary: "Every mutation is validated before a new revision is committed.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.SNAPSHOT_CONSISTENCY,
    name: "Snapshot Consistency",
    summary: "Snapshots are created only after successful validation.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.PROVIDER_INDEPENDENCE,
    name: "Provider Independence",
    summary: "Agents must not depend on which render provider is used.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.PROMPT_ISOLATION,
    name: "Prompt Isolation",
    summary: "Prompt never stored in RenderBlueprint — only in Render Adapter.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.STATELESS_AGENTS,
    name: "Stateless Agents",
    summary: "Agents retain no internal state after execution.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.DETERMINISTIC_PIPELINE,
    name: "Deterministic Pipeline",
    summary: "Identical inputs, blueprint, seed, and versions yield identical decisions.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.EVENT_DRIVEN_COMMUNICATION,
    name: "Event Driven Communication",
    summary: "Components communicate through Event Bus — no direct cross-module calls.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.VERSION_COMPATIBILITY,
    name: "Version Compatibility",
    summary: "Every blueprint carries a version; incompatibility resolved by Migration Engine.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.EXPLAINABILITY,
    name: "Explainability",
    summary: "Every decision records who, when, why, and on what data.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.RECOVERY_SAFETY,
    name: "Recovery Safety",
    summary: "Recovery must never violate architectural invariants.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.VISION_INDEPENDENCE,
    name: "Vision Independence",
    summary: "Vision QA evaluates only the final image — no prompt, agents, or blueprint.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.COMPOSITE_ISOLATION,
    name: "Composite Isolation",
    summary: "Composite layer never mutates background — only product placement and integration.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.ADAPTER_RESPONSIBILITY,
    name: "Adapter Responsibility",
    summary: "Render Adapter translates blueprint to provider language — no design decisions.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.SINGLE_RESPONSIBILITY,
    name: "Single Responsibility",
    summary: "Each component owns one domain (e.g. Lighting Director → lighting).",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.NO_HIDDEN_STATE,
    name: "No Hidden State",
    summary: "State exists only in Blueprint, Snapshot, Event Log, or Decision Graph.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.OPEN_ARCHITECTURE,
    name: "Open Architecture",
    summary: "New agents, providers, validators, and adapters plug in without core changes.",
    goldenRule: true,
  },
  {
    id: ArchitecturalInvariantId.ARCHITECTURE_OVER_IMPLEMENTATION,
    name: "Architecture Over Implementation",
    summary: "Implementation may change; lifecycle, blueprint, ownership, and invariants may not.",
    goldenRule: true,
  },
] as const;

export const ARCHITECTURAL_INVARIANT_IDS: ArchitecturalInvariantIdValue[] =
  ARCHITECTURAL_INVARIANTS.map((i) => i.id);

export function getInvariantDefinition(
  id: ArchitecturalInvariantIdValue,
): ArchitecturalInvariantDefinition | undefined {
  return ARCHITECTURAL_INVARIANTS.find((i) => i.id === id);
}

export function invariantByName(name: string): ArchitecturalInvariantDefinition | undefined {
  const normalized = name.trim().toLowerCase();
  return ARCHITECTURAL_INVARIANTS.find((i) => i.name.toLowerCase() === normalized);
}
