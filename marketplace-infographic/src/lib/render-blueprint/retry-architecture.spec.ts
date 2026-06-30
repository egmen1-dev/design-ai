/**
 * DESIGN AI v18 — Retry Architecture tests (Chapter 4.24)
 */
import assert from "node:assert/strict";
import {
  RETRY_ARCHITECTURE_GOLDEN_RULE,
  RETRY_ARCHITECTURE_ID,
  RETRY_ARCHITECTURE_PIPELINE_POSITION,
  RetryLevel,
  RetryStrategy,
  FinalDecision,
  RetryRecommendation,
  selectRetryLevel,
  computeRetryScope,
  buildRetryPlan,
  applyRetryBudget,
  validateRetryPlan,
  runRetryArchitecture,
  isRetryFailure,
  frozenTestBlueprint,
  BlueprintLifecycle,
} from "./index";
import type { ChiefReview } from "./chief-design-director-types";
import type { ConsensusReport } from "./consensus-engine-types";
import type { VisionQualityReport } from "./vision-quality-director-types";

function baseChiefReview(overrides: Partial<ChiefReview> = {}): ChiefReview {
  return {
    approved: true,
    overallScore: 88,
    estimatedScoreAfterRetry: 88,
    retryRequired: false,
    retryStrategy: RetryStrategy.NONE,
    priorityProblems: [],
    recommendedMutations: [],
    finalDecision: FinalDecision.APPROVE,
    confidence: 0.9,
    ...overrides,
  };
}

function baseVisionReport(overrides: Partial<VisionQualityReport> = {}): VisionQualityReport {
  return {
    compositionScore: 88,
    sceneAccuracy: 90,
    lightingAccuracy: 87,
    materialAccuracy: 86,
    backgroundCleanliness: 92,
    overlaySafety: 85,
    providerArtifacts: 90,
    overallScore: 89,
    problems: [],
    retryRecommendation: RetryRecommendation.ACCEPT,
    confidence: 0.9,
    ...overrides,
  };
}

function testGoldenRule() {
  assert.ok(RETRY_ARCHITECTURE_GOLDEN_RULE.includes("must not recreate the system"));
  console.log("✔ golden rule — retry repairs problems, not full regenerate");
}

function testPipelinePosition() {
  assert.equal(RETRY_ARCHITECTURE_PIPELINE_POSITION[4], RETRY_ARCHITECTURE_ID);
  console.log("✔ retry architecture follows chief review, before partial pipeline");
}

function testNoRetryWhenApproved() {
  const level = selectRetryLevel({ chiefReview: baseChiefReview() });
  assert.equal(level, RetryLevel.NONE);
  const { plan } = buildRetryPlan(frozenTestBlueprint(), { chiefReview: baseChiefReview() });
  assert.equal(plan.retryLevel, RetryLevel.NONE);
  assert.equal(plan.estimatedCost, 0);
  console.log("✔ level 0 — no retry when result accepted");
}

function testTechnicalLightingRetry() {
  const level = selectRetryLevel({
    chiefReview: baseChiefReview({
      approved: false,
      retryRequired: true,
      retryStrategy: RetryStrategy.LIGHTING_RETRY,
      finalDecision: FinalDecision.RETRY,
      priorityProblems: [
        {
          code: "LIGHTING_DRIFT",
          severity: "major",
          section: "lighting",
          message: "Shadow direction does not match blueprint",
          sourceAgent: "vision-quality-director",
        },
      ],
    }),
  });
  assert.equal(level, RetryLevel.TECHNICAL);

  const scope = computeRetryScope(level, "lighting");
  assert.ok(scope.preserveSections.includes("story"));
  assert.ok(scope.preserveSections.includes("scene"));
  assert.ok(scope.rebuildSections.includes("lighting"));
  assert.ok(!scope.rebuildSections.includes("story"));
  console.log("✔ level 3 technical retry preserves story and scene, rebuilds lighting");
}

function testProviderRetry() {
  const level = selectRetryLevel({
    chiefReview: baseChiefReview({
      approved: false,
      retryRequired: true,
      retryStrategy: RetryStrategy.RENDER_RETRY,
      finalDecision: FinalDecision.RETRY,
    }),
    providerDiagnostics: { provider: "flux", artifactDetected: true },
  });
  assert.equal(level, RetryLevel.PROVIDER);

  const scope = computeRetryScope(level, "render");
  assert.deepEqual(scope.rebuildSections, ["render"]);
  assert.ok(scope.preserveSections.includes("story"));
  console.log("✔ level 1 provider retry — blueprint unchanged, render only");
}

function testCreativeSceneRetry() {
  const level = selectRetryLevel({
    chiefReview: baseChiefReview({
      approved: false,
      retryRequired: true,
      retryStrategy: RetryStrategy.SCENE_RETRY,
      finalDecision: FinalDecision.RETRY,
    }),
  });
  assert.equal(level, RetryLevel.CREATIVE);
  const scope = computeRetryScope(level, "scene");
  assert.ok(scope.preserveSections.includes("story"));
  assert.ok(scope.rebuildSections.includes("scene"));
  console.log("✔ level 4 creative retry rebuilds scene and downstream");
}

function testFullPipelineRetry() {
  const level = selectRetryLevel({
    chiefReview: baseChiefReview({
      approved: false,
      retryRequired: true,
      retryStrategy: RetryStrategy.FULL_PIPELINE_RETRY,
      finalDecision: FinalDecision.REJECT,
    }),
  });
  assert.equal(level, RetryLevel.FULL_PIPELINE);
  console.log("✔ level 5 full pipeline retry on chief reject");
}

function testRetryTreeDownstreamOnly() {
  const scope = computeRetryScope(RetryLevel.TECHNICAL, "lighting");
  assert.ok(!scope.rebuildSections.includes("story"));
  assert.ok(!scope.rebuildSections.includes("scene"));
  assert.equal(scope.restartFrom, BlueprintLifecycle.PHOTO_DEFINED);
  console.log("✔ retry tree excludes story and scene for lighting retry");
}

function testRetryBudgetExhausted() {
  const { plan } = buildRetryPlan(frozenTestBlueprint(), {
    chiefReview: baseChiefReview({
      approved: false,
      retryRequired: true,
      retryStrategy: RetryStrategy.LIGHTING_RETRY,
      finalDecision: FinalDecision.RETRY,
      overallScore: 72,
      estimatedScoreAfterRetry: 85,
    }),
    retryHistory: [
      { attempt: 1, level: RetryLevel.TECHNICAL, primarySection: "lighting", reason: "lighting drift" },
      { attempt: 2, level: RetryLevel.TECHNICAL, primarySection: "lighting", reason: "lighting drift" },
      { attempt: 3, level: RetryLevel.PROVIDER, primarySection: "render", reason: "artifacts" },
    ],
    budget: { maxAttempts: 3, maxCostCents: 15 },
  });
  assert.equal(plan.retryLevel, RetryLevel.NONE);
  assert.ok(plan.reason.includes("budget"));
  console.log("✔ retry budget exhausted — cost-aware accept without retry");
}

function testAdaptiveEscalation() {
  const { plan, explainability } = buildRetryPlan(frozenTestBlueprint(), {
    chiefReview: baseChiefReview({
      approved: false,
      retryRequired: true,
      retryStrategy: RetryStrategy.LIGHTING_RETRY,
      finalDecision: FinalDecision.RETRY,
      priorityProblems: [
        {
          code: "LIGHTING_DRIFT",
          severity: "major",
          section: "lighting",
          message: "Lighting drift persists",
          sourceAgent: "vision-quality-director",
        },
      ],
    }),
    retryHistory: [
      { attempt: 1, level: RetryLevel.TECHNICAL, primarySection: "lighting", reason: "lighting" },
      { attempt: 2, level: RetryLevel.TECHNICAL, primarySection: "lighting", reason: "lighting" },
    ],
  });
  assert.equal(plan.retryLevel, RetryLevel.CREATIVE);
  assert.ok(explainability.adaptiveEscalation?.includes("escalating"));
  console.log("✔ adaptive retry escalates after repeated lighting failures");
}

function testRetryExplainability() {
  const { plan } = buildRetryPlan(frozenTestBlueprint(), {
    chiefReview: baseChiefReview({
      approved: false,
      retryRequired: true,
      retryStrategy: RetryStrategy.LIGHTING_RETRY,
      finalDecision: FinalDecision.RETRY,
      priorityProblems: [
        {
          code: "LIGHTING_DRIFT",
          severity: "major",
          section: "lighting",
          message: "Shadow direction does not match blueprint",
          sourceAgent: "vision-quality-director",
        },
      ],
    }),
  });
  assert.ok(plan.reason.includes("Shadow direction"));
  const validation = validateRetryPlan(plan, {
    chiefReview: baseChiefReview({ retryRequired: true, retryStrategy: RetryStrategy.LIGHTING_RETRY }),
  });
  assert.equal(validation.valid, true);
  console.log("✔ every retry plan includes explainable reason");
}

function testMutationPlanFromChief() {
  const bp = frozenTestBlueprint();
  const { plan } = buildRetryPlan(bp, {
    chiefReview: baseChiefReview({
      approved: false,
      retryRequired: true,
      retryStrategy: RetryStrategy.LIGHTING_RETRY,
      finalDecision: FinalDecision.RETRY,
      recommendedMutations: [
        {
          section: "lighting",
          producer: "chief-design-director",
          expectedRevision: 0,
          payload: { lightingStyle: "luxury_warm" },
          reason: "Realign lighting",
          timestamp: Date.now(),
        },
      ],
    }),
  });
  assert.ok(plan.mutationPlan.length >= 1);
  assert.equal(plan.mutationPlan[0].section, "lighting");
  console.log("✔ retry plan carries blueprint mutation instructions");
}

function testCostIncreasesWithLevel() {
  const l1 = computeRetryScope(RetryLevel.PROVIDER, "render");
  const l3 = computeRetryScope(RetryLevel.TECHNICAL, "lighting");
  const l5 = computeRetryScope(RetryLevel.FULL_PIPELINE, "story");
  assert.ok(l5.rebuildSections.length > l3.rebuildSections.length);
  assert.ok(l3.rebuildSections.length > l1.rebuildSections.length);
  console.log("✔ higher retry levels rebuild more sections and cost more");
}

function testDoesNotMutateBlueprint() {
  const bp = frozenTestBlueprint();
  const frozen = structuredClone(bp);
  runRetryArchitecture({
    blueprint: bp,
    context: {
      chiefReview: baseChiefReview({
        retryRequired: true,
        retryStrategy: RetryStrategy.LIGHTING_RETRY,
      }),
    },
  });
  assert.deepEqual(frozen, bp);
  console.log("✔ retry architecture never mutates blueprint directly");
}

function testRetryPlanContract() {
  const { plan } = buildRetryPlan(frozenTestBlueprint(), {
    chiefReview: baseChiefReview({
      approved: false,
      retryRequired: true,
      retryStrategy: RetryStrategy.CAMERA_RETRY,
      finalDecision: FinalDecision.RETRY,
      estimatedScoreAfterRetry: 91,
      overallScore: 76,
    }),
    visionReport: baseVisionReport({ retryRecommendation: RetryRecommendation.RETRY_LIGHTING }),
  });
  assert.ok(plan.estimatedImprovement >= 0);
  assert.ok(plan.confidence >= 0.5 && plan.confidence <= 1);
  assert.ok(Array.isArray(plan.preserveSections));
  assert.ok(Array.isArray(plan.rebuildSections));
  console.log("✔ retry plan matches Chapter 4.24 contract");
}

function testFailureCodes() {
  assert.equal(isRetryFailure("FULL_RESTART_UNNECESSARY"), true);
  assert.equal(isRetryFailure("UNKNOWN"), false);
  console.log("✔ retry failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testPipelinePosition();
  testNoRetryWhenApproved();
  testTechnicalLightingRetry();
  testProviderRetry();
  testCreativeSceneRetry();
  testFullPipelineRetry();
  testRetryTreeDownstreamOnly();
  testRetryBudgetExhausted();
  testAdaptiveEscalation();
  testRetryExplainability();
  testMutationPlanFromChief();
  testCostIncreasesWithLevel();
  testDoesNotMutateBlueprint();
  testRetryPlanContract();
  testFailureCodes();
  console.log("\nretry-architecture.spec.ts — all passed");
}

run();
