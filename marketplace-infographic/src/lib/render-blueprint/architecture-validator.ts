/**
 * Chapter 3.19 — Architecture Validator
 * Mandatory pre-pipeline check — any invariant violation blocks generation.
 */
import type { RenderBlueprint } from "./types";
import { assertNoPromptStored } from "./constitution";
import { agentMayWriteSection } from "./ownership";
import { AGENT_WRITE_MATRIX } from "./agent-matrix";
import { assertRecoveryInvariants } from "./recovery-engine";
import {
  ARCHITECTURAL_INVARIANTS,
  ARCHITECTURAL_INVARIANT_IDS,
  ArchitecturalInvariantId,
} from "./architectural-invariants";
import type {
  ArchitecturalInvariantIdValue,
  ArchitecturalInvariantViolation,
  ArchitectureValidationContext,
  ArchitectureValidationReport,
  ArchitectureValidatorOptions,
} from "./architectural-invariants-types";

export class ArchitectureValidatorError extends Error {
  readonly report: ArchitectureValidationReport;

  constructor(report: ArchitectureValidationReport) {
    const summary = report.violations.map((v) => `[${v.invariantId}] ${v.message}`).join("; ");
    super(`Architectural invariant violation: ${summary}`);
    this.name = "ArchitectureValidatorError";
    this.report = report;
  }
}

type InvariantCheck = (ctx: ArchitectureValidationContext) => ArchitecturalInvariantViolation[];

function violation(
  invariantId: ArchitecturalInvariantIdValue,
  message: string,
  severity: ArchitecturalInvariantViolation["severity"] = "fatal",
  extra?: Pick<ArchitecturalInvariantViolation, "component" | "evidence">,
): ArchitecturalInvariantViolation {
  return { invariantId, severity, message, ...extra };
}

function checkSingleSourceOfTruth(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  const issues: ArchitecturalInvariantViolation[] = [];
  if (!ctx.blueprint) {
    issues.push(violation(ArchitecturalInvariantId.SINGLE_SOURCE_OF_TRUTH, "RenderBlueprint is required"));
    return issues;
  }
  if (ctx.shadowStateStores?.length) {
    for (const store of ctx.shadowStateStores) {
      issues.push(
        violation(
          ArchitecturalInvariantId.SINGLE_SOURCE_OF_TRUTH,
          `Parallel generation state detected outside RenderBlueprint: ${store}`,
          "fatal",
          { component: store },
        ),
      );
    }
  }
  return issues;
}

function checkImmutableHistory(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.historyMutated) return [];
  return [
    violation(
      ArchitecturalInvariantId.IMMUTABLE_HISTORY,
      "Decision, event, mutation, or snapshot history was mutated in place",
      "fatal",
    ),
  ];
}

function checkAgentIsolation(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.agentCrossCalls?.length) return [];
  return ctx.agentCrossCalls.map((call) =>
    violation(
      ArchitecturalInvariantId.AGENT_ISOLATION,
      `Agent ${call.from} directly invoked agent ${call.to}`,
      "fatal",
      { component: call.from, evidence: call.to },
    ),
  );
}

function checkBlueprintOwnership(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  const issues: ArchitecturalInvariantViolation[] = [];
  const audit = ctx.blueprint.meta.audit ?? [];
  for (const entry of audit) {
    const agentId = entry.agentId;
    const section = entry.section;
    if (!agentId || !section) continue;
    if (agentId === "system" || agentId === "mutation-engine") continue;
    if (!agentMayWriteSection(agentId, section)) {
      issues.push(
        violation(
          ArchitecturalInvariantId.BLUEPRINT_OWNERSHIP,
          `Agent ${agentId} is not the owner of section ${section}`,
          "fatal",
          { component: agentId, evidence: section },
        ),
      );
    }
  }
  return issues;
}

function checkLifecycleAuthority(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.unauthorizedLifecycleAction) return [];
  const { actor, action } = ctx.unauthorizedLifecycleAction;
  return [
    violation(
      ArchitecturalInvariantId.LIFECYCLE_AUTHORITY,
      `Component ${actor} attempted unauthorized lifecycle action: ${action}`,
      "fatal",
      { component: actor, evidence: action },
    ),
  ];
}

function checkMutationSafety(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.directBlueprintMutation) return [];
  return [
    violation(
      ArchitecturalInvariantId.MUTATION_SAFETY,
      "Blueprint was mutated outside Mutation Engine",
      "fatal",
    ),
  ];
}

function checkValidationBeforeCommit(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.mutationWithoutValidation) return [];
  return [
    violation(
      ArchitecturalInvariantId.VALIDATION_BEFORE_COMMIT,
      "Mutation committed without passing Validation Engine",
      "fatal",
    ),
  ];
}

function checkSnapshotConsistency(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.snapshotWithoutValidation) return [];
  return [
    violation(
      ArchitecturalInvariantId.SNAPSHOT_CONSISTENCY,
      "Snapshot created before validation succeeded",
      "fatal",
    ),
  ];
}

function checkProviderIndependence(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.agentKnowsProvider?.length) return [];
  return ctx.agentKnowsProvider.map((ref) =>
    violation(
      ArchitecturalInvariantId.PROVIDER_INDEPENDENCE,
      `Agent ${ref.agentId} references provider ${ref.provider}`,
      "fatal",
      { component: ref.agentId, evidence: ref.provider },
    ),
  );
}

function checkPromptIsolation(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  try {
    assertNoPromptStored(ctx.blueprint);
    return [];
  } catch (e) {
    return [
      violation(
        ArchitecturalInvariantId.PROMPT_ISOLATION,
        e instanceof Error ? e.message : "Prompt stored in RenderBlueprint",
        "fatal",
        { component: "render-blueprint" },
      ),
    ];
  }
}

function checkStatelessAgents(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.agentRetainedState?.length) return [];
  return ctx.agentRetainedState.map((ref) =>
    violation(
      ArchitecturalInvariantId.STATELESS_AGENTS,
      `Agent ${ref.agentId} retained internal state after execution`,
      "fatal",
      { component: ref.agentId },
    ),
  );
}

function checkDeterministicPipeline(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.nonDeterministicRun) return [];
  return [
    violation(
      ArchitecturalInvariantId.DETERMINISTIC_PIPELINE,
      "Pipeline produced different decisions for identical inputs",
      "fatal",
    ),
  ];
}

function checkEventDrivenCommunication(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.directModuleCalls?.length) return [];
  return ctx.directModuleCalls.map((call) =>
    violation(
      ArchitecturalInvariantId.EVENT_DRIVEN_COMMUNICATION,
      `Direct call from ${call.from} to ${call.to} bypasses Event Bus`,
      "fatal",
      { component: call.from, evidence: call.to },
    ),
  );
}

function checkVersionCompatibility(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  const schemaVersion = ctx.blueprint.meta.schemaVersion;
  if (!schemaVersion || typeof schemaVersion !== "string" || !schemaVersion.trim()) {
    return [
      violation(
        ArchitecturalInvariantId.VERSION_COMPATIBILITY,
        "Blueprint is missing schemaVersion — Migration Engine cannot verify compatibility",
        "fatal",
      ),
    ];
  }
  return [];
}

function checkExplainability(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.unexplainedDecisions?.length) return [];
  return ctx.unexplainedDecisions.map((d) =>
    violation(
      ArchitecturalInvariantId.EXPLAINABILITY,
      `Decision ${d.decisionId} has no explanation`,
      "error",
      { evidence: d.decisionId },
    ),
  );
}

function checkRecoverySafety(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.recoveryViolations?.length) return [];
  return ctx.recoveryViolations.map((rv) =>
    violation(
      ArchitecturalInvariantId.RECOVERY_SAFETY,
      rv.message,
      "fatal",
      { component: "recovery-engine", evidence: rv.code },
    ),
  );
}

function checkVisionIndependence(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.visionUsesBlueprint) return [];
  return [
    violation(
      ArchitecturalInvariantId.VISION_INDEPENDENCE,
      "Vision QA accessed blueprint, prompt, or agent data",
      "fatal",
      { component: "vision-qa" },
    ),
  ];
}

function checkCompositeIsolation(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.compositeMutatesBackground) return [];
  return [
    violation(
      ArchitecturalInvariantId.COMPOSITE_ISOLATION,
      "Composite layer modified background — background must remain immutable",
      "fatal",
      { component: "composite" },
    ),
  ];
}

function checkAdapterResponsibility(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.adapterMakesDesignDecisions) return [];
  return [
    violation(
      ArchitecturalInvariantId.ADAPTER_RESPONSIBILITY,
      "Render Adapter made design decisions not present in RenderBlueprint",
      "fatal",
      { component: "render-adapter" },
    ),
  ];
}

function checkSingleResponsibility(): ArchitecturalInvariantViolation[] {
  const owners = new Map<string, string[]>();
  for (const [agentId, sections] of Object.entries(AGENT_WRITE_MATRIX)) {
    for (const section of sections) {
      const list = owners.get(section) ?? [];
      list.push(agentId);
      owners.set(section, list);
    }
  }
  const issues: ArchitecturalInvariantViolation[] = [];
  for (const [section, agents] of owners) {
    if (agents.length > 1) {
      issues.push(
        violation(
          ArchitecturalInvariantId.SINGLE_RESPONSIBILITY,
          `Section ${section} has multiple write owners: ${agents.join(", ")}`,
          "warning",
          { component: "agent-matrix", evidence: agents.join(",") },
        ),
      );
    }
  }
  return issues;
}

function checkNoHiddenState(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.hiddenStateStores?.length) return [];
  return ctx.hiddenStateStores.map((store) =>
    violation(
      ArchitecturalInvariantId.NO_HIDDEN_STATE,
      `Hidden state store detected: ${store}`,
      "fatal",
      { component: store },
    ),
  );
}

function checkOpenArchitecture(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  if (!ctx.closedExtension) return [];
  return [
    violation(
      ArchitecturalInvariantId.OPEN_ARCHITECTURE,
      `Extension blocked for ${ctx.closedExtension.component}`,
      "fatal",
      { component: ctx.closedExtension.component },
    ),
  ];
}

function checkArchitectureOverImplementation(ctx: ArchitectureValidationContext): ArchitecturalInvariantViolation[] {
  const issues: ArchitecturalInvariantViolation[] = [];
  if (!ctx.blueprint.lifecycle) {
    issues.push(
      violation(
        ArchitecturalInvariantId.ARCHITECTURE_OVER_IMPLEMENTATION,
        "Blueprint lifecycle metadata missing",
        "fatal",
      ),
    );
  }
  if (!ctx.blueprint.meta) {
    issues.push(
      violation(
        ArchitecturalInvariantId.ARCHITECTURE_OVER_IMPLEMENTATION,
        "Blueprint meta block missing",
        "fatal",
      ),
    );
  }
  return issues;
}

const INVARIANT_CHECKS: Record<ArchitecturalInvariantIdValue, InvariantCheck> = {
  [ArchitecturalInvariantId.SINGLE_SOURCE_OF_TRUTH]: checkSingleSourceOfTruth,
  [ArchitecturalInvariantId.IMMUTABLE_HISTORY]: checkImmutableHistory,
  [ArchitecturalInvariantId.AGENT_ISOLATION]: checkAgentIsolation,
  [ArchitecturalInvariantId.BLUEPRINT_OWNERSHIP]: checkBlueprintOwnership,
  [ArchitecturalInvariantId.LIFECYCLE_AUTHORITY]: checkLifecycleAuthority,
  [ArchitecturalInvariantId.MUTATION_SAFETY]: checkMutationSafety,
  [ArchitecturalInvariantId.VALIDATION_BEFORE_COMMIT]: checkValidationBeforeCommit,
  [ArchitecturalInvariantId.SNAPSHOT_CONSISTENCY]: checkSnapshotConsistency,
  [ArchitecturalInvariantId.PROVIDER_INDEPENDENCE]: checkProviderIndependence,
  [ArchitecturalInvariantId.PROMPT_ISOLATION]: checkPromptIsolation,
  [ArchitecturalInvariantId.STATELESS_AGENTS]: checkStatelessAgents,
  [ArchitecturalInvariantId.DETERMINISTIC_PIPELINE]: checkDeterministicPipeline,
  [ArchitecturalInvariantId.EVENT_DRIVEN_COMMUNICATION]: checkEventDrivenCommunication,
  [ArchitecturalInvariantId.VERSION_COMPATIBILITY]: checkVersionCompatibility,
  [ArchitecturalInvariantId.EXPLAINABILITY]: checkExplainability,
  [ArchitecturalInvariantId.RECOVERY_SAFETY]: checkRecoverySafety,
  [ArchitecturalInvariantId.VISION_INDEPENDENCE]: checkVisionIndependence,
  [ArchitecturalInvariantId.COMPOSITE_ISOLATION]: checkCompositeIsolation,
  [ArchitecturalInvariantId.ADAPTER_RESPONSIBILITY]: checkAdapterResponsibility,
  [ArchitecturalInvariantId.SINGLE_RESPONSIBILITY]: () => checkSingleResponsibility(),
  [ArchitecturalInvariantId.NO_HIDDEN_STATE]: checkNoHiddenState,
  [ArchitecturalInvariantId.OPEN_ARCHITECTURE]: checkOpenArchitecture,
  [ArchitecturalInvariantId.ARCHITECTURE_OVER_IMPLEMENTATION]: checkArchitectureOverImplementation,
};

function isBlocking(
  violations: ArchitecturalInvariantViolation[],
  allowWarnings: boolean,
): boolean {
  return violations.some((v) => {
    if (v.severity === "warning") return !allowWarnings;
    return v.severity === "fatal" || v.severity === "error";
  });
}

function buildReport(violations: ArchitecturalInvariantViolation[]): ArchitectureValidationReport {
  const failed = [...new Set(violations.map((v) => v.invariantId))];
  const passed = ARCHITECTURAL_INVARIANT_IDS.filter((id) => !failed.includes(id));
  const blocking = violations.filter((v) => v.severity === "fatal" || v.severity === "error");
  return {
    valid: blocking.length === 0,
    checkedAt: Date.now(),
    invariantCount: ARCHITECTURAL_INVARIANTS.length,
    violations,
    passed,
    failed,
  };
}

export function validateArchitecture(
  ctx: ArchitectureValidationContext,
  options: ArchitectureValidatorOptions = {},
): ArchitectureValidationReport {
  const allowWarnings = options.allowWarnings ?? true;
  const violations: ArchitecturalInvariantViolation[] = [];

  for (const id of ARCHITECTURAL_INVARIANT_IDS) {
    const found = INVARIANT_CHECKS[id](ctx);
    violations.push(...found);
    if (options.failFast && isBlocking(found, allowWarnings)) break;
  }

  const report = buildReport(violations);
  if (!allowWarnings && violations.some((v) => v.severity === "warning")) {
    report.valid = false;
  }
  return report;
}

export function assertArchitectureInvariants(
  ctx: ArchitectureValidationContext,
  options?: ArchitectureValidatorOptions,
): ArchitectureValidationReport {
  const report = validateArchitecture(ctx, options);
  if (!report.valid) {
    throw new ArchitectureValidatorError(report);
  }
  return report;
}

/** Pre-pipeline gate — blocks generation when any blocking invariant fails */
export function validateArchitectureAtPipelineStart(
  blueprint: RenderBlueprint,
  extra: Omit<ArchitectureValidationContext, "blueprint"> = {},
  options?: ArchitectureValidatorOptions,
): ArchitectureValidationReport {
  return validateArchitecture({ blueprint, ...extra }, options);
}

export function assertPipelineArchitecture(
  blueprint: RenderBlueprint,
  extra: Omit<ArchitectureValidationContext, "blueprint"> = {},
): ArchitectureValidationReport {
  return assertArchitectureInvariants({ blueprint, ...extra });
}

/** Verify recovery plan respects INV_16 */
export function validateRecoveryArchitecture(input: {
  before: RenderBlueprint;
  after: RenderBlueprint;
  seedLocked?: number;
  snapshotsRemoved?: boolean;
  decisionHistoryMutated?: boolean;
}): ArchitecturalInvariantViolation[] {
  return checkRecoverySafety({
    blueprint: input.after,
    recoveryViolations: assertRecoveryInvariants(input),
  });
}

export class ArchitectureValidator {
  private readonly options: ArchitectureValidatorOptions;

  constructor(options: ArchitectureValidatorOptions = {}) {
    this.options = options;
  }

  validate(ctx: ArchitectureValidationContext): ArchitectureValidationReport {
    return validateArchitecture(ctx, this.options);
  }

  assert(ctx: ArchitectureValidationContext): ArchitectureValidationReport {
    return assertArchitectureInvariants(ctx, this.options);
  }

  validateAtPipelineStart(
    blueprint: RenderBlueprint,
    extra: Omit<ArchitectureValidationContext, "blueprint"> = {},
  ): ArchitectureValidationReport {
    return validateArchitectureAtPipelineStart(blueprint, extra, this.options);
  }

  assertAtPipelineStart(
    blueprint: RenderBlueprint,
    extra: Omit<ArchitectureValidationContext, "blueprint"> = {},
  ): ArchitectureValidationReport {
    return assertPipelineArchitecture(blueprint, extra);
  }
}
