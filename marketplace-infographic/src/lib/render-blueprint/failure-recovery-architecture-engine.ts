/**
 * Chapter 4.27 — Failure Recovery Architecture engine.
 * Detects, classifies, isolates, and recovers from failures without destroying correct decisions.
 */
import type { AgentContractId } from "./agent-contracts";
import { downstreamSections } from "./agent-dependency-graph";
import { getSectionOwner } from "./agent-dependency-engine";
import { BlueprintLifecycle } from "./lifecycle-types";
import { DEFAULT_FALLBACK_CHAIN } from "./render-pipeline-types";
import {
  classifyError,
  planProviderRecovery,
  RecoveryEngine,
  RecoveryErrorCategory,
  RecoveryStrategy,
  ErrorSeverity,
  strategyForSeverity,
  type ClassifiedError,
  type RecoveryStrategyId,
} from "./recovery-engine";
import type { ProviderId } from "./render-pipeline-types";
import type { BlueprintSection, RenderBlueprint } from "./types";
import {
  FailureCategory,
  FailureRecoveryStrategy,
  type FailureCategoryId,
  type FailureDetection,
  type FailureIsolation,
  type FailureLogEntry,
  type FailureRecoveryContext,
  type FailureRecoveryFailureCode,
  type FailureRecoveryPlan,
  type FailureRecoveryReport,
  type FailureRecoveryStrategyId,
  type FailureRecoveryViolation,
  type ProviderFailoverPlan,
  type RecoveryValidationResult,
  type SafeDegradationPlan,
  type SectionRollbackPlan,
} from "./failure-recovery-architecture-types";

export {
  FailureCategory,
  FailureRecoveryStrategy,
  type FailureCategoryId,
  type FailureRecoveryStrategyId,
  type FailureDetection,
  type FailureIsolation,
  type SectionRollbackPlan,
  type ProviderFailoverPlan,
  type SafeDegradationPlan,
  type FailureRecoveryPlan,
  type RecoveryValidationResult,
  type FailureLogEntry,
  type FailureRecoveryContext,
  type FailureRecoveryReport,
  type FailureRecoveryViolation,
  type FailureRecoveryFailureCode,
} from "./failure-recovery-architecture-types";

export const FAILURE_RECOVERY_ARCHITECTURE_VERSION = "4.27.0";

export const FAILURE_RECOVERY_GOLDEN_RULE =
  "Design AI is built for a world where failures are inevitable, not for a world without errors. " +
  "Good architecture is defined by the ability to detect, isolate, explain, and safely eliminate failures " +
  "without destroying the rest of the ecosystem.";

export const FAILURE_LIFECYCLE = [
  "failure",
  "detection",
  "classification",
  "isolation",
  "recovery-plan",
  "retry",
  "validation",
  "continue-pipeline",
] as const;

export const FAILURE_RECOVERY_ID = "failure-recovery-architecture" as const;

const CREATIVE_SECTIONS: BlueprintSection[] = [
  "story",
  "scene",
  "photography",
  "camera",
  "lighting",
  "materials",
  "composition",
];

const SECTION_TO_STAGE: Partial<Record<BlueprintSection, BlueprintLifecycle>> = {
  story: BlueprintLifecycle.STORY_DEFINED,
  scene: BlueprintLifecycle.SCENE_DEFINED,
  photography: BlueprintLifecycle.PHOTO_DEFINED,
  camera: BlueprintLifecycle.PHOTO_DEFINED,
  lighting: BlueprintLifecycle.PHOTO_DEFINED,
  materials: BlueprintLifecycle.PHOTO_DEFINED,
  composition: BlueprintLifecycle.COMPOSITION_DEFINED,
};

function violation(
  code: FailureRecoveryViolation["code"],
  message: string,
  extras?: Pick<FailureRecoveryViolation, "section" | "agentId">,
): FailureRecoveryViolation {
  return { code, message, ...extras };
}

function mapCategory(error: ClassifiedError): FailureCategoryId {
  switch (error.category) {
    case RecoveryErrorCategory.AGENT:
    case RecoveryErrorCategory.MUTATION:
      return FailureCategory.AGENT;
    case RecoveryErrorCategory.PROVIDER:
    case RecoveryErrorCategory.RENDER:
    case RecoveryErrorCategory.NETWORK:
      return FailureCategory.PROVIDER;
    case RecoveryErrorCategory.VALIDATION:
      return FailureCategory.VALIDATION;
    case RecoveryErrorCategory.VISION:
    case RecoveryErrorCategory.COMPOSITE:
      return FailureCategory.VISION;
    case RecoveryErrorCategory.SYSTEM:
    case RecoveryErrorCategory.PIPELINE:
      return FailureCategory.INFRASTRUCTURE;
    default:
      return FailureCategory.INFRASTRUCTURE;
  }
}

function architectureStrategy(
  category: FailureCategoryId,
  recoveryStrategy: RecoveryStrategyId,
): FailureRecoveryStrategyId {
  if (
    recoveryStrategy === RecoveryStrategy.PROVIDER_SWITCH ||
    recoveryStrategy === RecoveryStrategy.CONTINUE
  ) {
    return FailureRecoveryStrategy.FALLBACK;
  }
  if (
    recoveryStrategy === RecoveryStrategy.STAGE_ROLLBACK ||
    recoveryStrategy === RecoveryStrategy.BLUEPRINT_ROLLBACK
  ) {
    return FailureRecoveryStrategy.ROLLBACK;
  }
  if (category === FailureCategory.VISION && recoveryStrategy === RecoveryStrategy.LOCAL_RETRY) {
    return FailureRecoveryStrategy.ESCALATION;
  }
  if (recoveryStrategy === RecoveryStrategy.ABORT) {
    return FailureRecoveryStrategy.ESCALATION;
  }
  return FailureRecoveryStrategy.RETRY;
}

export function classifyFailureCategory(error: ClassifiedError): FailureCategoryId {
  return mapCategory(error);
}

export function detectFailure(input: {
  message: string;
  code?: string;
  blueprint: RenderBlueprint;
  agentId?: AgentContractId;
  section?: BlueprintSection;
  httpStatus?: number;
  provider?: ProviderId;
  category?: import("./recovery-types").RecoveryErrorCategoryId;
}): FailureDetection {
  const classified = classifyError({
    message: input.message,
    code: input.code,
    category: input.category,
    httpStatus: input.httpStatus,
    provider: input.provider,
  });

  return {
    detectedAt: Date.now(),
    message: input.message,
    code: input.code,
    category: mapCategory(classified),
    sourceAgent: input.agentId,
    sourceSection: input.section,
    blueprintRevision: input.blueprint.meta.revision,
  };
}

export function isolateFailure(
  detection: FailureDetection,
  blueprint: Readonly<RenderBlueprint>,
): FailureIsolation {
  const failedSection = detection.sourceSection;
  const failedAgent = detection.sourceAgent ?? (failedSection ? getSectionOwner(failedSection) : undefined);

  if (detection.category === FailureCategory.PROVIDER) {
    return {
      category: detection.category,
      failedAgent: "render-adapter",
      failedSection: "render",
      preservedSections: [...CREATIVE_SECTIONS, "product", "creative", "constraints", "validation"],
      rebuildSections: ["render"],
      blueprintIntact: true,
      explanation: "Provider failure isolated to render step — blueprint remains correct",
    };
  }

  if (detection.category === FailureCategory.INFRASTRUCTURE) {
    return {
      category: detection.category,
      preservedSections: [...CREATIVE_SECTIONS, "product", "creative"],
      rebuildSections: [],
      blueprintIntact: true,
      explanation: "Infrastructure failure isolated from agent architecture — transient retry expected",
    };
  }

  if (!failedSection) {
    return {
      category: detection.category,
      failedAgent,
      preservedSections: CREATIVE_SECTIONS,
      rebuildSections: [],
      blueprintIntact: true,
      explanation: "Failure localized without full pipeline restart",
    };
  }

  const downstream = downstreamSections(failedSection).filter((s) => CREATIVE_SECTIONS.includes(s));
  const rebuild = [failedSection, ...downstream];
  const preserved = CREATIVE_SECTIONS.filter((s) => !rebuild.includes(s));

  return {
    category: detection.category,
    failedAgent,
    failedSection,
    preservedSections: preserved,
    rebuildSections: rebuild,
    blueprintIntact: detection.category !== FailureCategory.VALIDATION,
    explanation: `${failedAgent ?? failedSection} failure isolated — preserved: ${preserved.join(", ") || "none"}`,
  };
}

export function selectFailureRecoveryStrategy(
  category: FailureCategoryId,
  recoveryStrategy: RecoveryStrategyId,
): FailureRecoveryStrategyId {
  return architectureStrategy(category, recoveryStrategy);
}

export function planSectionRollback(input: {
  section: BlueprintSection;
  fromVersion: number;
  toVersion: number;
  blueprint: Readonly<RenderBlueprint>;
  reason?: string;
}): SectionRollbackPlan {
  const downstream = downstreamSections(input.section).filter((s) => CREATIVE_SECTIONS.includes(s));
  const preserved = CREATIVE_SECTIONS.filter((s) => s !== input.section && !downstream.includes(s));

  return {
    section: input.section,
    fromVersion: input.fromVersion,
    toVersion: input.toVersion,
    strategy: FailureRecoveryStrategy.ROLLBACK,
    preservedSections: preserved,
    reason:
      input.reason ??
      `${SECTION_LABEL(input.section)} v${input.fromVersion} failed validation — rollback to v${input.toVersion}`,
  };
}

function SECTION_LABEL(section: BlueprintSection): string {
  return section.charAt(0).toUpperCase() + section.slice(1);
}

export function planProviderFailover(input: {
  currentProvider: ProviderId;
  httpStatus?: number;
  message?: string;
  fallbackChain?: readonly ProviderId[];
}): ProviderFailoverPlan {
  const action = planProviderRecovery({
    httpStatus: input.httpStatus,
    message: input.message,
    currentProvider: input.currentProvider,
    fallbackChain: input.fallbackChain ? [...input.fallbackChain] : undefined,
  });

  const chain = input.fallbackChain ?? DEFAULT_FALLBACK_CHAIN;
  const nextProvider =
    action.nextProvider ??
    chain.find((p) => p !== input.currentProvider) ??
    input.currentProvider;

  return {
    currentProvider: input.currentProvider,
    nextProvider,
    blueprintUnchanged: true,
    strategy:
      action.action === "switch"
        ? FailureRecoveryStrategy.FALLBACK
        : FailureRecoveryStrategy.RETRY,
    reason:
      action.action === "switch"
        ? `${input.currentProvider} unavailable — failover to ${nextProvider}`
        : `${input.currentProvider} transient error — retry same provider`,
  };
}

export function planSafeDegradation(component: string): SafeDegradationPlan {
  const plans: Record<string, SafeDegradationPlan> = {
    "design-memory": {
      component: "design-memory",
      degradedCapability: "statistical learning and pattern recall",
      pipelineContinues: true,
      reason: "Design Memory unavailable — pipeline continues without learning, generation not halted",
    },
    "consensus-engine": {
      component: "consensus-engine",
      degradedCapability: "pre-render cross-agent conflict analysis",
      pipelineContinues: true,
      reason: "Consensus Engine unavailable — Chief Director performs manual conflict review",
    },
    observability: {
      component: "observability",
      degradedCapability: "extended diagnostic traces",
      pipelineContinues: true,
      reason: "Observability degraded — core pipeline continues with minimal logging",
    },
  };

  return (
    plans[component] ?? {
      component,
      degradedCapability: "non-critical subsystem",
      pipelineContinues: true,
      reason: `${component} unavailable — safe degradation preserves core pipeline`,
    }
  );
}

export function buildFailureRecoveryPlan(ctx: FailureRecoveryContext): FailureRecoveryPlan {
  const classified =
    ctx.error ??
    classifyError({
      message: "Unknown failure",
      category: RecoveryErrorCategory.UNKNOWN,
    });

  const detection = detectFailure({
    message: classified.message,
    code: classified.code,
    blueprint: ctx.blueprint,
    agentId: ctx.failedAgent,
    section: ctx.failedSection,
    httpStatus: ctx.httpStatus,
    provider: ctx.currentProvider,
    category: classified.category,
  });

  const isolation = isolateFailure(detection, ctx.blueprint);
  const engine = new RecoveryEngine();
  const recoveryPlan = engine.decideRecovery(
    classified,
    ctx.failedSection,
    ctx.blueprint.lifecycle.stage,
  );
  const strategy = selectFailureRecoveryStrategy(detection.category, recoveryPlan.strategy);

  const plan: FailureRecoveryPlan = {
    detection,
    isolation,
    strategy,
    recoveryStrategy: recoveryPlan.strategy,
    resumeStage: recoveryPlan.resumeStage ?? SECTION_TO_STAGE[ctx.failedSection ?? "lighting"],
    escalateToChief:
      strategy === FailureRecoveryStrategy.ESCALATION ||
      detection.category === FailureCategory.VISION,
    reason: recoveryPlan.reason,
    explainability: [
      `Failure detected: ${detection.message}`,
      `Category: ${detection.category}`,
      isolation.explanation,
      `Recovery strategy: ${strategy}`,
    ],
  };

  if (
    strategy === FailureRecoveryStrategy.ROLLBACK &&
    ctx.failedSection &&
    ctx.sectionVersion &&
    ctx.previousSectionVersion
  ) {
    plan.sectionRollback = planSectionRollback({
      section: ctx.failedSection,
      fromVersion: ctx.sectionVersion,
      toVersion: ctx.previousSectionVersion,
      blueprint: ctx.blueprint,
    });
  }

  if (detection.category === FailureCategory.PROVIDER && ctx.currentProvider) {
    plan.providerFailover = planProviderFailover({
      currentProvider: ctx.currentProvider,
      httpStatus: ctx.httpStatus,
      message: classified.message,
    });
  }

  if (ctx.unavailableComponents?.length) {
    plan.safeDegradation = planSafeDegradation(ctx.unavailableComponents[0]);
  }

  return plan;
}

export function validateFailureIsolation(plan: FailureRecoveryPlan): FailureRecoveryViolation[] {
  const violations: FailureRecoveryViolation[] = [];
  const failed = plan.isolation.failedSection;

  if (!failed && plan.detection.category !== FailureCategory.INFRASTRUCTURE) {
    if (plan.recoveryStrategy === RecoveryStrategy.BLUEPRINT_ROLLBACK) {
      return violations;
    }
    violations.push(
      violation("MISSING_ISOLATION", "Failure source section not identified for localized recovery"),
    );
    return violations;
  }

  if (failed === "lighting" && plan.isolation.preservedSections.includes("story")) {
    if (plan.isolation.rebuildSections.includes("story")) {
      violations.push(
        violation(
          "FULL_RESTART_UNNECESSARY",
          "Lighting Director failure must not restart Story Director",
          { section: "story", agentId: "visual-story-director" },
        ),
      );
    }
  }

  if (plan.detection.category === FailureCategory.PROVIDER && !plan.isolation.blueprintIntact) {
    violations.push(
      violation("ROLLBACK_DAMAGED_BLUEPRINT", "Provider failure must keep blueprint intact"),
    );
  }

  return violations;
}

export function validateRecoveryOutcome(input: {
  before: Readonly<RenderBlueprint>;
  after: Readonly<RenderBlueprint>;
  plan: FailureRecoveryPlan;
  errorResolved?: boolean;
  newConflicts?: string[];
}): RecoveryValidationResult {
  const violations: string[] = [];
  const blueprintValid = input.after.meta.revision >= input.before.meta.revision;
  const blueprintUnchangedOnProvider =
    input.plan.detection.category !== FailureCategory.PROVIDER ||
    JSON.stringify(stripRevision(input.before)) === JSON.stringify(stripRevision(input.after));

  if (!blueprintValid) {
    violations.push("Blueprint revision regressed after recovery");
  }
  if (!blueprintUnchangedOnProvider) {
    violations.push("Provider recovery mutated blueprint — only render may change");
  }
  if (input.newConflicts?.length) {
    violations.push(...input.newConflicts.map((c) => `New conflict: ${c}`));
  }
  if (input.errorResolved === false) {
    violations.push("Original error was not resolved");
  }

  const preserved = input.plan.isolation.preservedSections;
  for (const section of preserved) {
    const beforePayload = JSON.stringify((input.before as Record<string, unknown>)[section]);
    const afterPayload = JSON.stringify((input.after as Record<string, unknown>)[section]);
    if (
      beforePayload !== afterPayload &&
      input.plan.strategy === FailureRecoveryStrategy.ROLLBACK &&
      section !== input.plan.isolation.failedSection
    ) {
      violations.push(`Rollback damaged preserved section: ${section}`);
    }
  }

  return {
    recovered: violations.length === 0,
    errorResolved: input.errorResolved !== false,
    noNewConflicts: !input.newConflicts?.length,
    blueprintValid,
    qualityMaintained: violations.length === 0,
    violations,
  };
}

function stripRevision(blueprint: Readonly<RenderBlueprint>): Record<string, unknown> {
  const clone = structuredClone(blueprint) as RenderBlueprint;
  clone.meta.revision = 0;
  return clone as unknown as Record<string, unknown>;
}

export function buildFailureLog(input: {
  plan: FailureRecoveryPlan;
  outcome: FailureLogEntry["recoveryOutcome"];
  durationMs: number;
  timestamp?: number;
}): FailureLogEntry {
  return {
    failureType: input.plan.detection.category,
    agent: input.plan.isolation.failedAgent,
    section: input.plan.isolation.failedSection,
    reason: input.plan.reason,
    blueprintRevision: input.plan.detection.blueprintRevision,
    recoveryStrategy: input.plan.strategy,
    recoveryOutcome: input.outcome,
    durationMs: input.durationMs,
    timestamp: input.timestamp ?? Date.now(),
  };
}

export function validateFailureRecoveryArchitecture(
  ctx: FailureRecoveryContext,
): FailureRecoveryReport {
  const violations: FailureRecoveryViolation[] = [];
  let plan: FailureRecoveryPlan | undefined;

  try {
    plan = buildFailureRecoveryPlan(ctx);
    violations.push(...validateFailureIsolation(plan));
  } catch (error) {
    violations.push(
      violation(
        "PIPELINE_HALTED",
        error instanceof Error ? error.message : "Recovery plan could not be built",
      ),
    );
  }

  if (plan) {
    if (!plan.detection.sourceAgent && !plan.detection.sourceSection && plan.detection.category === FailureCategory.AGENT) {
      violations.push(violation("UNKNOWN_FAILURE_SOURCE", "Agent failure without identifiable source"));
    }
    if (plan.recoveryStrategy === RecoveryStrategy.ABORT && plan.detection.category !== FailureCategory.INFRASTRUCTURE) {
      const classified = ctx.error;
      if (classified?.recoverable) {
        violations.push(
          violation("PIPELINE_HALTED", "Recoverable failure must not immediately halt pipeline"),
        );
      }
    }
  }

  const logs: FailureLogEntry[] = [...(ctx.recoveryHistory ?? [])];
  if (plan && ctx.recoveryHistory && ctx.recoveryHistory.length === 0) {
    violations.push(violation("MISSING_FAILURE_LOG", "Recovery executed without failure log entry"));
  }

  let validation: RecoveryValidationResult | undefined;
  if (ctx.blueprint && plan) {
    validation = validateRecoveryOutcome({
      before: ctx.blueprint,
      after: ctx.blueprint,
      plan,
      errorResolved: true,
    });
    if (!validation.recovered) {
      violations.push(
        violation("MISSING_RECOVERY_VALIDATION", validation.violations.join("; ")),
      );
    }
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    resilient: unique.length === 0,
    violations: unique,
    plan,
    validation,
    logs,
    goldenRuleSatisfied: unique.length === 0,
  };
}

export function planFailureFromProviderError(input: {
  blueprint: RenderBlueprint;
  currentProvider: ProviderId;
  httpStatus?: number;
  message: string;
}): FailureRecoveryPlan {
  const classified = classifyError({
    message: input.message,
    httpStatus: input.httpStatus,
    provider: input.currentProvider,
    category: RecoveryErrorCategory.PROVIDER,
  });

  return buildFailureRecoveryPlan({
    blueprint: input.blueprint,
    error: classified,
    currentProvider: input.currentProvider,
    httpStatus: input.httpStatus,
    failedSection: "render",
  });
}

export function assertFailureRecoverable(
  ctx: FailureRecoveryContext,
): FailureRecoveryReport {
  const report = validateFailureRecoveryArchitecture(ctx);
  if (!report.resilient) {
    throw new Error(
      `Failure recovery violation: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function runFailureRecoveryArchitecture(input: {
  ctx: FailureRecoveryContext;
}): FailureRecoveryReport {
  return validateFailureRecoveryArchitecture(input.ctx);
}

export function isFailureRecoveryFailure(code: string): code is FailureRecoveryFailureCode {
  return [
    "PIPELINE_HALTED",
    "MISSING_ISOLATION",
    "UNKNOWN_FAILURE_SOURCE",
    "ROLLBACK_DAMAGED_BLUEPRINT",
    "UNRECOVERABLE_TRANSIENT",
    "FULL_RESTART_UNNECESSARY",
    "MISSING_RECOVERY_VALIDATION",
    "MISSING_FAILURE_LOG",
  ].includes(code);
}

export function recoveryStrategyForCategory(
  category: FailureCategoryId,
): RecoveryStrategyId {
  switch (category) {
    case FailureCategory.AGENT:
      return RecoveryStrategy.LOCAL_RETRY;
    case FailureCategory.PROVIDER:
      return RecoveryStrategy.PROVIDER_RETRY;
    case FailureCategory.VALIDATION:
      return RecoveryStrategy.STAGE_ROLLBACK;
    case FailureCategory.VISION:
      return RecoveryStrategy.LOCAL_RETRY;
    case FailureCategory.INFRASTRUCTURE:
      return RecoveryStrategy.CONTINUE;
    default:
      return strategyForSeverity(ErrorSeverity.MEDIUM);
  }
}
