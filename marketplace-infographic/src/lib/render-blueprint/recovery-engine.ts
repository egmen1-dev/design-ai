/**
 * Chapter 3.16 — Error Handling & Recovery Engine
 * Only Lifecycle Manager executes recovery — agents may recommend only.
 */
import type { BlueprintLifecycle } from "./lifecycle-types";
import type { RenderBlueprint } from "./types";
import type { ProviderId } from "./render-pipeline-types";
import { RollbackStrategy } from "./snapshot-types";
import { RetryEngine } from "./retry-engine";
import { RetryKind } from "./lifecycle-manager-types";
import { DEFAULT_FALLBACK_CHAIN } from "./render-pipeline-types";
import {
  DEFAULT_RETRY_POLICY,
  ErrorSeverity,
  RecoveryErrorCategory,
  RecoveryStrategy,
  type ClassifiedError,
  type ProviderRecoveryAction,
  type RecoveryInvariantViolation,
  type RecoveryLog,
  type RecoveryMetrics,
  type RecoveryPlan,
  type RecoveryRecommendation,
  type RecoveryStrategyId,
  type RetryPolicy,
  type VisionProblemId,
  type ErrorSeverityId,
  type RecoveryErrorCategoryId,
} from "./recovery-types";

export {
  RecoveryErrorCategory,
  ErrorSeverity,
  RecoveryStrategy,
  DEFAULT_RETRY_POLICY,
  type RecoveryErrorCategoryId,
  type ErrorSeverityId,
  type RecoveryStrategyId,
  type RetryPolicy,
  type RecoveryRecommendation,
  type ClassifiedError,
  type RecoveryPlan,
  type RecoveryLog,
  type RecoveryMetrics,
  type ProviderRecoveryAction,
  type VisionProblemId,
  type RecoveryInvariantViolation,
} from "./recovery-types";

export class RecoveryEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RecoveryEngineError";
  }
}

export class NonRecoverableError extends RecoveryEngineError {
  readonly classified: ClassifiedError;

  constructor(classified: ClassifiedError) {
    super(`Non-recoverable: ${classified.message}`);
    this.name = "NonRecoverableError";
    this.classified = classified;
  }
}

/** Escalation order — backward transitions forbidden */
export const RECOVERY_ESCALATION_CHAIN: RecoveryStrategyId[] = [
  RecoveryStrategy.LOCAL_RETRY,
  RecoveryStrategy.STAGE_ROLLBACK,
  RecoveryStrategy.BLUEPRINT_ROLLBACK,
  RecoveryStrategy.PROVIDER_SWITCH,
  RecoveryStrategy.ABORT,
];

const SEVERITY_TO_STRATEGY: Record<ErrorSeverityId, RecoveryStrategyId> = {
  [ErrorSeverity.LOW]: RecoveryStrategy.CONTINUE,
  [ErrorSeverity.MEDIUM]: RecoveryStrategy.LOCAL_RETRY,
  [ErrorSeverity.HIGH]: RecoveryStrategy.STAGE_ROLLBACK,
  [ErrorSeverity.CRITICAL]: RecoveryStrategy.BLUEPRINT_ROLLBACK,
  [ErrorSeverity.FATAL]: RecoveryStrategy.ABORT,
};

const VISION_RECOVERY: Record<VisionProblemId, RecoveryStrategyId> = {
  wrong_background: RecoveryStrategy.LOCAL_RETRY,
  wrong_lighting: RecoveryStrategy.STAGE_ROLLBACK,
  bad_integration: RecoveryStrategy.COMPOSITE_RETRY,
  png_overlay_feel: RecoveryStrategy.COMPOSITE_RETRY,
  product_too_small: RecoveryStrategy.STAGE_ROLLBACK,
};

const FATAL_CODES = new Set([
  "BLUEPRINT_CORRUPT",
  "INVARIANT_VIOLATION",
  "SNAPSHOT_INTEGRITY",
  "MISSING_SECTION",
  "DECISION_GRAPH_CORRUPT",
  "VERSION_INCOMPATIBLE",
  "CHECKSUM_MISMATCH",
]);

export function classifyError(input: {
  message: string;
  code?: string;
  category?: RecoveryErrorCategoryId;
  httpStatus?: number;
  provider?: ProviderId;
  agentFatal?: boolean;
}): ClassifiedError {
  const category = input.category ?? inferCategory(input.message, input.code, input.httpStatus);
  let severity = inferSeverity(category, input.code, input.httpStatus, input.agentFatal);
  const recoverable = !isNonRecoverable({ category, severity, code: input.code });

  if (!recoverable) {
    severity = ErrorSeverity.FATAL;
  }

  return {
    category,
    severity,
    message: input.message,
    code: input.code,
    recoverable,
    httpStatus: input.httpStatus,
    provider: input.provider,
  };
}

function inferCategory(
  message: string,
  code?: string,
  httpStatus?: number,
): RecoveryErrorCategoryId {
  const m = message.toLowerCase();
  const c = (code ?? "").toLowerCase();
  if (c.includes("validation") || m.includes("validation")) return RecoveryErrorCategory.VALIDATION;
  if (c.includes("mutation")) return RecoveryErrorCategory.MUTATION;
  if (c.includes("agent") || m.includes("agent")) return RecoveryErrorCategory.AGENT;
  if (c.includes("composite") || m.includes("composite")) return RecoveryErrorCategory.COMPOSITE;
  if (c.includes("vision") || m.includes("vision qa")) return RecoveryErrorCategory.VISION;
  if (httpStatus !== undefined || c.includes("provider") || m.includes("provider")) {
    return RecoveryErrorCategory.PROVIDER;
  }
  if (c.includes("network") || m.includes("timeout") || m.includes("econnreset")) {
    return RecoveryErrorCategory.NETWORK;
  }
  if (c.includes("render") || m.includes("render")) return RecoveryErrorCategory.RENDER;
  if (c.includes("pipeline")) return RecoveryErrorCategory.PIPELINE;
  if (c.includes("system")) return RecoveryErrorCategory.SYSTEM;
  return RecoveryErrorCategory.UNKNOWN;
}

function inferSeverity(
  category: RecoveryErrorCategoryId,
  code?: string,
  httpStatus?: number,
  agentFatal?: boolean,
): ErrorSeverityId {
  if (agentFatal || (code && FATAL_CODES.has(code))) return ErrorSeverity.FATAL;
  if (httpStatus === 429) return ErrorSeverity.MEDIUM;
  if (httpStatus !== undefined && httpStatus >= 500) return ErrorSeverity.HIGH;
  if (category === RecoveryErrorCategory.VALIDATION) return ErrorSeverity.MEDIUM;
  if (category === RecoveryErrorCategory.VISION) return ErrorSeverity.MEDIUM;
  if (category === RecoveryErrorCategory.NETWORK) return ErrorSeverity.MEDIUM;
  if (category === RecoveryErrorCategory.COMPOSITE) return ErrorSeverity.MEDIUM;
  if (category === RecoveryErrorCategory.PROVIDER) return ErrorSeverity.MEDIUM;
  if (category === RecoveryErrorCategory.AGENT) return ErrorSeverity.HIGH;
  if (category === RecoveryErrorCategory.MUTATION) return ErrorSeverity.HIGH;
  if (category === RecoveryErrorCategory.SYSTEM) return ErrorSeverity.FATAL;
  return ErrorSeverity.LOW;
}

export function isNonRecoverable(error: {
  category: RecoveryErrorCategoryId;
  severity: ErrorSeverityId;
  code?: string;
}): boolean {
  if (error.severity === ErrorSeverity.FATAL) return true;
  if (error.code && FATAL_CODES.has(error.code)) return true;
  return false;
}

export function strategyForSeverity(severity: ErrorSeverityId): RecoveryStrategyId {
  return SEVERITY_TO_STRATEGY[severity];
}

export function planVisionRecovery(problem: VisionProblemId): RecoveryPlan {
  const strategy = VISION_RECOVERY[problem];
  return {
    strategy,
    reason: `Vision QA: ${problem}`,
    category: RecoveryErrorCategory.VISION,
    severity: ErrorSeverity.MEDIUM,
    affectedSections: visionAffectedSections(problem),
    escalationLevel: 0,
  };
}

function visionAffectedSections(problem: VisionProblemId): import("./types").BlueprintSection[] {
  switch (problem) {
    case "wrong_background":
      return ["background", "scene"];
    case "wrong_lighting":
      return ["lighting", "composition"];
    case "bad_integration":
    case "png_overlay_feel":
      return ["composition", "validation"];
    case "product_too_small":
      return ["composition", "camera"];
  }
}

export function planProviderRecovery(input: {
  httpStatus?: number;
  message?: string;
  currentProvider: ProviderId;
  fallbackChain?: ProviderId[];
}): ProviderRecoveryAction {
  const chain = input.fallbackChain ?? DEFAULT_FALLBACK_CHAIN;
  if (input.httpStatus === 429) {
    return { action: "wait", waitMs: 2_000 };
  }
  if (input.httpStatus !== undefined && input.httpStatus >= 500) {
    const idx = chain.indexOf(input.currentProvider);
    const next = chain[idx + 1];
    if (next) return { action: "switch", nextProvider: next };
    return { action: "retry" };
  }
  if (input.message?.toLowerCase().includes("timeout")) {
    return { action: "retry" };
  }
  return { action: "retry" };
}

export function providerRecoveryToPlan(
  action: ProviderRecoveryAction,
  classified: ClassifiedError,
): RecoveryPlan {
  if (action.action === "switch" && action.nextProvider) {
    return {
      strategy: RecoveryStrategy.PROVIDER_SWITCH,
      reason: "Provider unavailable — switch adapter",
      category: classified.category,
      severity: classified.severity,
      affectedSections: [],
      provider: action.nextProvider,
      escalationLevel: RECOVERY_ESCALATION_CHAIN.indexOf(RecoveryStrategy.PROVIDER_SWITCH),
    };
  }
  if (action.action === "wait") {
    return {
      strategy: RecoveryStrategy.PROVIDER_RETRY,
      reason: "Rate limited — wait and retry",
      category: classified.category,
      severity: classified.severity,
      affectedSections: [],
      waitMs: action.waitMs,
      escalationLevel: 0,
    };
  }
  return {
    strategy: RecoveryStrategy.PROVIDER_RETRY,
    reason: "Provider error — retry request",
    category: classified.category,
    severity: classified.severity,
    affectedSections: [],
    escalationLevel: 0,
  };
}

export function rollbackStrategyForRecovery(
  strategy: RecoveryStrategyId,
): (typeof RollbackStrategy)[keyof typeof RollbackStrategy] | null {
  switch (strategy) {
    case RecoveryStrategy.STAGE_ROLLBACK:
      return RollbackStrategy.STAGE;
    case RecoveryStrategy.BLUEPRINT_ROLLBACK:
      return RollbackStrategy.BLUEPRINT;
    case RecoveryStrategy.LOCAL_RETRY:
      return RollbackStrategy.SECTION;
    default:
      return null;
  }
}

export function escalateStrategy(current: RecoveryStrategyId): RecoveryStrategyId {
  const idx = RECOVERY_ESCALATION_CHAIN.indexOf(current);
  if (idx < 0) return RecoveryStrategy.ABORT;
  const next = RECOVERY_ESCALATION_CHAIN[idx + 1];
  return next ?? RecoveryStrategy.ABORT;
}

export class RecoveryEngine {
  private readonly retryPolicy: RetryPolicy;
  private readonly retryEngine: RetryEngine;
  private readonly logs: RecoveryLog[] = [];
  private readonly policyCounters: Record<keyof RetryPolicy, number> = {
    providerRetry: 0,
    layoutRetry: 0,
    photoRetry: 0,
    visionRetry: 0,
    chiefRetry: 0,
  };
  private escalationLevel = 0;
  private currentStrategy: RecoveryStrategyId = RecoveryStrategy.LOCAL_RETRY;

  constructor(retryPolicy: RetryPolicy = DEFAULT_RETRY_POLICY) {
    this.retryPolicy = retryPolicy;
    this.retryEngine = new RetryEngine();
  }

  decideRecovery(
    error: ClassifiedError,
    recommendation?: RecoveryRecommendation,
    stage?: BlueprintLifecycle,
  ): RecoveryPlan {
    if (!error.recoverable || error.severity === ErrorSeverity.FATAL) {
      throw new NonRecoverableError(error);
    }

    let strategy = recommendation?.strategy ?? strategyForSeverity(error.severity);
    let reason = recommendation?.reason ?? error.message;
    const affectedSections = recommendation?.affectedSections ?? [];

    if (error.category === RecoveryErrorCategory.PROVIDER && error.provider) {
      const action = planProviderRecovery({
        httpStatus: error.httpStatus,
        message: error.message,
        currentProvider: error.provider,
      });
      return providerRecoveryToPlan(action, error);
    }

    if (error.category === RecoveryErrorCategory.COMPOSITE) {
      strategy = RecoveryStrategy.COMPOSITE_RETRY;
      reason = "Composite failed — retry without new background render";
    }

    if (error.category === RecoveryErrorCategory.VALIDATION) {
      strategy = RecoveryStrategy.STAGE_ROLLBACK;
      reason = reason || "Validation failure — rollback stage before render";
    }

    if (!this.canApplyPolicy(strategy)) {
      strategy = this.escalate(strategy);
      reason = `${reason} (retry limit exceeded — escalated)`;
    }

    this.currentStrategy = strategy;
    this.escalationLevel = Math.max(
      this.escalationLevel,
      RECOVERY_ESCALATION_CHAIN.indexOf(strategy),
    );

    if (strategy === RecoveryStrategy.ABORT) {
      throw new NonRecoverableError({ ...error, severity: ErrorSeverity.FATAL, recoverable: false });
    }

    return {
      strategy,
      reason,
      category: error.category,
      severity: error.severity,
      affectedSections,
      resumeStage: stage,
      escalationLevel: this.escalationLevel,
    };
  }

  private canApplyPolicy(strategy: RecoveryStrategyId): boolean {
    switch (strategy) {
      case RecoveryStrategy.PROVIDER_RETRY:
        return this.policyCounters.providerRetry < this.retryPolicy.providerRetry;
      case RecoveryStrategy.LOCAL_RETRY:
        return this.policyCounters.photoRetry < this.retryPolicy.photoRetry;
      case RecoveryStrategy.COMPOSITE_RETRY:
        return this.policyCounters.photoRetry < this.retryPolicy.photoRetry;
      case RecoveryStrategy.STAGE_ROLLBACK:
        return this.policyCounters.layoutRetry < this.retryPolicy.layoutRetry;
      case RecoveryStrategy.BLUEPRINT_ROLLBACK:
        return this.policyCounters.chiefRetry < this.retryPolicy.chiefRetry;
      default:
        return true;
    }
  }

  recordPolicyUse(strategy: RecoveryStrategyId): void {
    switch (strategy) {
      case RecoveryStrategy.PROVIDER_RETRY:
        this.policyCounters.providerRetry += 1;
        break;
      case RecoveryStrategy.LOCAL_RETRY:
      case RecoveryStrategy.COMPOSITE_RETRY:
        this.policyCounters.photoRetry += 1;
        break;
      case RecoveryStrategy.STAGE_ROLLBACK:
        this.policyCounters.layoutRetry += 1;
        break;
      case RecoveryStrategy.BLUEPRINT_ROLLBACK:
        this.policyCounters.chiefRetry += 1;
        break;
    }
  }

  recordExecution(
    plan: RecoveryPlan,
    success: boolean,
    durationMs: number,
    stage?: BlueprintLifecycle,
  ): RecoveryLog {
    if (plan.strategy === RecoveryStrategy.LOCAL_RETRY) {
      this.retryEngine.recordRetry(RetryKind.Stage, stage ?? "NEW");
    }
    this.recordPolicyUse(plan.strategy);

    const log: RecoveryLog = {
      strategy: plan.strategy,
      reason: plan.reason,
      durationMs,
      success,
      category: plan.category,
      timestamp: Date.now(),
    };
    this.logs.push(log);
    return log;
  }

  escalate(strategy: RecoveryStrategyId): RecoveryStrategyId {
    const next = escalateStrategy(strategy);
    this.escalationLevel = RECOVERY_ESCALATION_CHAIN.indexOf(next);
    this.currentStrategy = next;
    return next;
  }

  getLogs(): readonly RecoveryLog[] {
    return this.logs;
  }

  buildMetrics(): RecoveryMetrics {
    const successful = this.logs.filter((l) => l.success).length;
    const failed = this.logs.filter((l) => !l.success).length;
    const totalTime = this.logs.reduce((s, l) => s + l.durationMs, 0);
    const rollbacks = this.logs.filter(
      (l) =>
        l.strategy === RecoveryStrategy.STAGE_ROLLBACK ||
        l.strategy === RecoveryStrategy.BLUEPRINT_ROLLBACK,
    ).length;
    const retries = this.logs.filter(
      (l) =>
        l.strategy === RecoveryStrategy.LOCAL_RETRY ||
        l.strategy === RecoveryStrategy.PROVIDER_RETRY ||
        l.strategy === RecoveryStrategy.COMPOSITE_RETRY,
    ).length;

    return {
      retryCount: retries,
      rollbackCount: rollbacks,
      successfulRecoveries: successful,
      failedRecoveries: failed,
      averageRecoveryTimeMs: this.logs.length ? totalTime / this.logs.length : 0,
      finalStrategy: this.currentStrategy,
    };
  }
}

export function assertRecoveryInvariants(input: {
  before: RenderBlueprint;
  after: RenderBlueprint;
  seedLocked?: number;
  snapshotsRemoved?: boolean;
  decisionHistoryMutated?: boolean;
}): RecoveryInvariantViolation[] {
  const violations: RecoveryInvariantViolation[] = [];

  if (input.snapshotsRemoved) {
    violations.push({
      code: "SNAPSHOT_DELETED",
      message: "Snapshots must not be deleted during recovery",
    });
  }
  if (input.decisionHistoryMutated) {
    violations.push({
      code: "DECISION_HISTORY_MUTATED",
      message: "Decision history must not be altered during recovery",
    });
  }
  if (input.seedLocked !== undefined && input.after.meta.seed !== input.seedLocked) {
    violations.push({
      code: "SEED_CHANGED",
      message: "Seed changed without Lifecycle Manager authorization",
    });
  }
  if (input.before.meta.version !== input.after.meta.version) {
    violations.push({
      code: "VERSION_CHANGED",
      message: "Blueprint version must not change during recovery",
    });
  }
  if (
    input.after.meta.revision < input.before.meta.revision &&
    input.before.lifecycle.frozenAt
  ) {
    violations.push({
      code: "LIFECYCLE_VIOLATION",
      message: "Lifecycle regression detected during recovery",
    });
  }
  return violations;
}

export function assertRecoveryInvariantsOrThrow(
  ...args: Parameters<typeof assertRecoveryInvariants>
): void {
  const violations = assertRecoveryInvariants(...args);
  if (violations.length) {
    throw new RecoveryEngineError(violations.map((v) => v.message).join("; "));
  }
}

export function validateAgentRecommendation(recommendation: RecoveryRecommendation): void {
  if (recommendation.confidence < 0 || recommendation.confidence > 100) {
    throw new RecoveryEngineError("Recovery recommendation confidence must be 0..100");
  }
  if (!recommendation.reason.trim()) {
    throw new RecoveryEngineError("Recovery recommendation must include reason");
  }
}
