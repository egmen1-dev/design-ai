/**
 * DESIGN AI v18 — Failure Recovery Architecture tests (Chapter 4.27)
 */
import assert from "node:assert/strict";
import {
  FAILURE_RECOVERY_ARCHITECTURE_VERSION,
  FAILURE_RECOVERY_GOLDEN_RULE,
  FAILURE_LIFECYCLE,
  FAILURE_RECOVERY_ID,
  FailureCategory,
  FailureRecoveryStrategy,
  classifyFailureCategory,
  detectFailure,
  isolateFailure,
  selectFailureRecoveryStrategy,
  planSectionRollback,
  planProviderFailover,
  planSafeDegradation,
  buildFailureRecoveryPlan,
  validateFailureIsolation,
  validateRecoveryOutcome,
  buildFailureLog,
  planFailureFromProviderError,
  validateFailureRecoveryArchitecture,
  runFailureRecoveryArchitecture,
  recoveryStrategyForCategory,
  isFailureRecoveryFailure,
  RecoveryErrorCategory,
  RecoveryStrategy,
  ErrorSeverity,
  classifyError,
  frozenTestBlueprint,
  BlueprintLifecycle,
} from "./index";

function recoveryBlueprint() {
  const bp = frozenTestBlueprint();
  bp.lifecycle.stage = BlueprintLifecycle.FROZEN;
  bp.meta.audit = [
    { agentId: "visual-story-director", section: "story", action: "set", at: Date.now() - 3000 },
    { agentId: "lighting-director", section: "lighting", action: "set", at: Date.now() - 1000 },
  ];
  return bp;
}

function testGoldenRule() {
  assert.ok(FAILURE_RECOVERY_GOLDEN_RULE.includes("inevitable"));
  assert.equal(FAILURE_RECOVERY_ARCHITECTURE_VERSION, "4.27.0");
  console.log("✔ golden rule — failures inevitable, architecture must isolate and recover safely");
}

function testFailureLifecycle() {
  assert.deepEqual(FAILURE_LIFECYCLE, [
    "failure",
    "detection",
    "classification",
    "isolation",
    "recovery-plan",
    "retry",
    "validation",
    "continue-pipeline",
  ]);
  assert.equal(FAILURE_RECOVERY_ID, "failure-recovery-architecture");
  console.log("✔ failure lifecycle — detect → classify → isolate → recover → validate → continue");
}

function testFailureCategories() {
  const agent = classifyFailureCategory(
    classifyError({ message: "agent json invalid", category: RecoveryErrorCategory.AGENT }),
  );
  const provider = classifyFailureCategory(
    classifyError({ message: "provider timeout", category: RecoveryErrorCategory.PROVIDER }),
  );
  const validation = classifyFailureCategory(
    classifyError({ message: "validation failed", category: RecoveryErrorCategory.VALIDATION }),
  );
  const vision = classifyFailureCategory(
    classifyError({ message: "vision qa failed", category: RecoveryErrorCategory.VISION }),
  );
  const infra = classifyFailureCategory(
    classifyError({ message: "database unavailable", category: RecoveryErrorCategory.SYSTEM }),
  );
  assert.equal(agent, FailureCategory.AGENT);
  assert.equal(provider, FailureCategory.PROVIDER);
  assert.equal(validation, FailureCategory.VALIDATION);
  assert.equal(vision, FailureCategory.VISION);
  assert.equal(infra, FailureCategory.INFRASTRUCTURE);
  console.log("✔ failure categories — agent, provider, validation, vision, infrastructure");
}

function testAgentFailureIsolation() {
  const bp = recoveryBlueprint();
  const detection = detectFailure({
    message: "LLM returned invalid JSON",
    code: "AGENT_CONTRACT_VIOLATION",
    blueprint: bp,
    agentId: "lighting-director",
    section: "lighting",
    category: RecoveryErrorCategory.AGENT,
  });
  const isolation = isolateFailure(detection, bp);
  assert.equal(isolation.failedAgent, "lighting-director");
  assert.equal(isolation.failedSection, "lighting");
  assert.ok(isolation.preservedSections.includes("story"));
  assert.ok(!isolation.rebuildSections.includes("story"));
  console.log("✔ agent failure isolated — lighting failure does not restart story director");
}

function testProviderFailureIsolation() {
  const bp = recoveryBlueprint();
  const detection = detectFailure({
    message: "FLUX API timeout",
    blueprint: bp,
    provider: "flux",
    httpStatus: 504,
    category: RecoveryErrorCategory.PROVIDER,
  });
  const isolation = isolateFailure(detection, bp);
  assert.equal(isolation.blueprintIntact, true);
  assert.deepEqual(isolation.rebuildSections, ["render"]);
  assert.ok(isolation.preservedSections.includes("lighting"));
  console.log("✔ provider failure isolated — blueprint intact, only render retries");
}

function testRecoveryStrategies() {
  assert.equal(
    selectFailureRecoveryStrategy(FailureCategory.PROVIDER, RecoveryStrategy.PROVIDER_SWITCH),
    FailureRecoveryStrategy.FALLBACK,
  );
  assert.equal(
    selectFailureRecoveryStrategy(FailureCategory.VALIDATION, RecoveryStrategy.STAGE_ROLLBACK),
    FailureRecoveryStrategy.ROLLBACK,
  );
  assert.equal(
    selectFailureRecoveryStrategy(FailureCategory.AGENT, RecoveryStrategy.LOCAL_RETRY),
    FailureRecoveryStrategy.RETRY,
  );
  console.log("✔ recovery strategies — retry, fallback, rollback, escalation");
}

function testSectionRollback() {
  const bp = recoveryBlueprint();
  const rollback = planSectionRollback({
    section: "lighting",
    fromVersion: 3,
    toVersion: 2,
    blueprint: bp,
  });
  assert.equal(rollback.fromVersion, 3);
  assert.equal(rollback.toVersion, 2);
  assert.equal(rollback.strategy, FailureRecoveryStrategy.ROLLBACK);
  assert.ok(rollback.preservedSections.includes("story"));
  assert.ok(!rollback.preservedSections.includes("lighting"));
  console.log("✔ section rollback — lighting v3 → v2 without touching other sections");
}

function testProviderFailover() {
  const failover = planProviderFailover({
    currentProvider: "flux",
    httpStatus: 500,
    message: "service unavailable",
  });
  assert.equal(failover.currentProvider, "flux");
  assert.equal(failover.nextProvider, "gpt-image");
  assert.equal(failover.blueprintUnchanged, true);
  assert.equal(failover.strategy, FailureRecoveryStrategy.FALLBACK);
  console.log("✔ provider failover — FLUX unavailable → GPT Image, blueprint unchanged");
}

function testSafeDegradation() {
  const plan = planSafeDegradation("design-memory");
  assert.equal(plan.pipelineContinues, true);
  assert.ok(plan.reason.includes("without learning"));
  console.log("✔ safe degradation — design memory unavailable, pipeline continues");
}

function testBuildRecoveryPlan() {
  const bp = recoveryBlueprint();
  const plan = buildFailureRecoveryPlan({
    blueprint: bp,
    error: classifyError({
      message: "Lighting validation failed",
      category: RecoveryErrorCategory.VALIDATION,
      severity: ErrorSeverity.MEDIUM,
    }),
    failedAgent: "lighting-director",
    failedSection: "lighting",
    sectionVersion: 3,
    previousSectionVersion: 2,
  });
  assert.equal(plan.detection.category, FailureCategory.VALIDATION);
  assert.ok(plan.isolation.preservedSections.includes("story"));
  assert.ok(plan.explainability.length >= 3);
  assert.ok(plan.sectionRollback);
  console.log("✔ recovery plan — full lifecycle plan with explainability");
}

function testProviderRecoveryPlan() {
  const plan = planFailureFromProviderError({
    blueprint: recoveryBlueprint(),
    currentProvider: "flux",
    httpStatus: 500,
    message: "internal server error",
  });
  assert.equal(plan.detection.category, FailureCategory.PROVIDER);
  assert.ok(plan.providerFailover);
  assert.equal(plan.isolation.blueprintIntact, true);
  console.log("✔ provider error recovery — failover plan with intact blueprint");
}

function testValidateFailureIsolation() {
  const bp = recoveryBlueprint();
  const plan = buildFailureRecoveryPlan({
    blueprint: bp,
    error: classifyError({ message: "lighting error", category: RecoveryErrorCategory.AGENT }),
    failedAgent: "lighting-director",
    failedSection: "lighting",
  });
  const violations = validateFailureIsolation(plan);
  assert.equal(violations.length, 0);
  console.log("✔ failure isolation validation — localized recovery respects boundaries");
}

function testRecoveryValidation() {
  const bp = recoveryBlueprint();
  const plan = buildFailureRecoveryPlan({
    blueprint: bp,
    error: classifyError({ message: "provider timeout", category: RecoveryErrorCategory.PROVIDER }),
    currentProvider: "flux",
    failedSection: "render",
  });
  const result = validateRecoveryOutcome({
    before: bp,
    after: bp,
    plan,
    errorResolved: true,
  });
  assert.equal(result.recovered, true);
  assert.equal(result.blueprintValid, true);
  console.log("✔ recovery validation — error resolved, blueprint valid, no new conflicts");
}

function testFailureLogging() {
  const bp = recoveryBlueprint();
  const plan = buildFailureRecoveryPlan({
    blueprint: bp,
    error: classifyError({ message: "vision mismatch", category: RecoveryErrorCategory.VISION }),
    failedSection: "lighting",
  });
  const log = buildFailureLog({ plan, outcome: "success", durationMs: 120 });
  assert.equal(log.failureType, FailureCategory.VISION);
  assert.equal(log.recoveryOutcome, "success");
  assert.equal(log.durationMs, 120);
  console.log("✔ failure logging — type, agent, strategy, outcome, duration recorded");
}

function testValidateArchitecture() {
  const bp = recoveryBlueprint();
  const report = validateFailureRecoveryArchitecture({
    blueprint: bp,
    error: classifyError({
      message: "lighting director contract violation",
      category: RecoveryErrorCategory.AGENT,
    }),
    failedAgent: "lighting-director",
    failedSection: "lighting",
  });
  assert.equal(report.resilient, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.ok(report.plan);
  console.log("✔ failure recovery architecture validation passes for localized agent failure");
}

function testRecoveryStrategyPerCategory() {
  assert.equal(recoveryStrategyForCategory(FailureCategory.AGENT), RecoveryStrategy.LOCAL_RETRY);
  assert.equal(recoveryStrategyForCategory(FailureCategory.PROVIDER), RecoveryStrategy.PROVIDER_RETRY);
  assert.equal(recoveryStrategyForCategory(FailureCategory.VALIDATION), RecoveryStrategy.STAGE_ROLLBACK);
  console.log("✔ category maps to appropriate recovery strategy");
}

function testRunFailureRecoveryArchitecture() {
  const report = runFailureRecoveryArchitecture({
    ctx: {
      blueprint: recoveryBlueprint(),
      error: classifyError({ message: "rate limited", httpStatus: 429, category: RecoveryErrorCategory.PROVIDER }),
      currentProvider: "flux",
      failedSection: "render",
    },
  });
  assert.equal(report.resilient, true);
  console.log("✔ runFailureRecoveryArchitecture entry point works");
}

function testFailureCodes() {
  assert.equal(isFailureRecoveryFailure("MISSING_ISOLATION"), true);
  assert.equal(isFailureRecoveryFailure("UNKNOWN"), false);
  console.log("✔ failure recovery failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testFailureLifecycle();
  testFailureCategories();
  testAgentFailureIsolation();
  testProviderFailureIsolation();
  testRecoveryStrategies();
  testSectionRollback();
  testProviderFailover();
  testSafeDegradation();
  testBuildRecoveryPlan();
  testProviderRecoveryPlan();
  testValidateFailureIsolation();
  testRecoveryValidation();
  testFailureLogging();
  testValidateArchitecture();
  testRecoveryStrategyPerCategory();
  testRunFailureRecoveryArchitecture();
  testFailureCodes();
  console.log("\nfailure-recovery-architecture.spec.ts — all passed");
}

run();
