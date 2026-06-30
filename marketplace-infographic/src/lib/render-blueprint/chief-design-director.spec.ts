/**
 * DESIGN AI v18 — Chief Design Director tests (Chapter 4.19)
 */
import assert from "node:assert/strict";
import {
  CHIEF_DESIGN_DIRECTOR_GOLDEN_RULE,
  CHIEF_DESIGN_DIRECTOR_ID,
  CHIEF_DESIGN_DIRECTOR_PIPELINE_POSITION,
  RetryStrategy,
  FinalDecision,
  ChiefProblemSeverity,
  LightingStyle,
  StoryType,
  SceneType,
  RetryRecommendation,
  buildChiefReview,
  validateChiefReview,
  runChiefDesignDirector,
  chiefDesignDirectorAgent,
  frozenTestBlueprint,
  BlueprintLifecycle,
} from "./index";
import type { VisionQualityReport } from "./vision-quality-director-types";

function baseVisionReport(overrides: Partial<VisionQualityReport> = {}): VisionQualityReport {
  return {
    compositionScore: 85,
    sceneAccuracy: 88,
    lightingAccuracy: 86,
    materialAccuracy: 84,
    backgroundCleanliness: 90,
    overlaySafety: 82,
    providerArtifacts: 88,
    overallScore: 86,
    problems: [],
    retryRecommendation: RetryRecommendation.ACCEPT,
    confidence: 0.9,
    ...overrides,
  };
}

function chiefBlueprint() {
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.story.primaryEmotion = "luxury";
  bp.scene.sceneType = SceneType.LUXURY;
  bp.lighting.lightingStyle = LightingStyle.LUXURY_WARM;
  bp.lighting.lightingScheme = "luxury_side_light";
  bp.lifecycle.stage = BlueprintLifecycle.VALIDATED;
  return bp;
}

function testGoldenRule() {
  assert.ok(CHIEF_DESIGN_DIRECTOR_GOLDEN_RULE.includes("does not create design"));
  console.log("✔ golden rule — chief orchestrates, never designs");
}

function testPipelinePosition() {
  assert.equal(CHIEF_DESIGN_DIRECTOR_PIPELINE_POSITION[2], CHIEF_DESIGN_DIRECTOR_ID);
  console.log("✔ chief design director follows commercial photographer");
}

function testApproveHighQualityPipeline() {
  const bp = chiefBlueprint();
  const { review } = buildChiefReview(bp, {
    visionReport: baseVisionReport(),
    photoReview: {
      score: 88,
      realism: 0.9,
      looksLikePhoto: true,
      problems: [],
      scores: {
        lighting: 88,
        shadows: 85,
        perspective: 86,
        integration: 87,
        colorMatching: 84,
        realism: 90,
      },
    },
    agentConfidences: {
      "visual-story-director": 0.96,
      "scene-director": 0.93,
      "lighting-director": 0.91,
      "vision-quality-director": 0.9,
    },
  });
  assert.equal(review.approved, true);
  assert.equal(review.finalDecision, FinalDecision.APPROVE);
  assert.equal(review.retryRequired, false);
  assert.equal(review.retryStrategy, RetryStrategy.NONE);
  console.log("✔ high-quality pipeline approved without retry");
}

function testCrossAgentConflictDetected() {
  const bp = chiefBlueprint();
  bp.lighting.lightingStyle = LightingStyle.TECHNOLOGY_COOL;
  const { review, explainability } = buildChiefReview(bp, {
    visionReport: baseVisionReport({
      lightingAccuracy: 55,
      problems: [
        {
          code: "LIGHTING_DRIFT",
          severity: "high",
          section: "lighting",
          message: "Lighting deviates from blueprint",
          critical: true,
        },
      ],
      retryRecommendation: RetryRecommendation.RETRY_LIGHTING,
    }),
  });
  assert.ok(review.priorityProblems.some((p) => p.code === "STORY_LIGHTING_CONFLICT"));
  assert.ok(explainability.crossAgentConflicts.includes("STORY_LIGHTING_CONFLICT"));
  assert.equal(review.retryStrategy, RetryStrategy.LIGHTING_RETRY);
  console.log("✔ luxury story + cold lighting conflict triggers lighting retry");
}

function testLocalizedRetryNotFullPipeline() {
  const bp = chiefBlueprint();
  const { review } = buildChiefReview(bp, {
    visionReport: baseVisionReport({
      retryRecommendation: RetryRecommendation.RETRY_LIGHTING,
      problems: [
        {
          code: "LIGHTING_DRIFT",
          severity: "medium",
          section: "lighting",
          message: "Lighting drift",
          critical: false,
        },
      ],
    }),
  });
  assert.equal(review.retryStrategy, RetryStrategy.LIGHTING_RETRY);
  assert.notEqual(review.retryStrategy, RetryStrategy.FULL_PIPELINE_RETRY);
  assert.ok(review.recommendedMutations.some((m) => m.section === "lighting"));
  console.log("✔ lighting error maps to localized lighting retry");
}

function testCostAwareApproval() {
  const bp = chiefBlueprint();
  const { review } = buildChiefReview(bp, {
    visionReport: baseVisionReport({
      overallScore: 76,
      problems: [
        {
          code: "BACKGROUND_CLUTTER",
          severity: "low",
          section: "background",
          message: "Minor clutter",
          critical: false,
        },
      ],
    }),
    retryHistory: { attempts: 2, strategiesUsed: ["lighting_retry", "render_retry"] },
    maxRetryAttempts: 2,
    minAcceptableScore: 78,
  });
  assert.equal(review.approved, true);
  assert.equal(review.retryRequired, false);
  console.log("✔ cost-aware chief approves when retry budget exhausted");
}

function testConfidenceFusionIdentifiesLighting() {
  const bp = chiefBlueprint();
  const { explainability } = buildChiefReview(bp, {
    visionReport: baseVisionReport({ lightingAccuracy: 50 }),
    agentConfidences: {
      "visual-story-director": 0.96,
      "scene-director": 0.93,
      "lighting-director": 0.52,
      "vision-quality-director": 0.88,
    },
  });
  const weakest = explainability.agentContributions.find((a) =>
    a.assessment.includes("Weakest link"),
  );
  assert.equal(weakest?.agentId, "lighting-director");
  console.log("✔ confidence fusion localizes problem to lighting director");
}

function testChiefReviewShape() {
  const bp = chiefBlueprint();
  const { review } = buildChiefReview(bp, { visionReport: baseVisionReport() });
  assert.ok(review.overallScore >= 0 && review.overallScore <= 100);
  assert.ok(review.estimatedScoreAfterRetry >= review.overallScore);
  assert.ok(Array.isArray(review.recommendedMutations));
  assert.ok(review.confidence >= 0.5 && review.confidence <= 1);
  const validation = validateChiefReview(review, { visionReport: baseVisionReport() });
  assert.equal(validation.valid, true);
  console.log("✔ chief review matches Chapter 4.19 contract");
}

function testRejectOnVisionReject() {
  const bp = chiefBlueprint();
  const { review } = buildChiefReview(bp, {
    visionReport: baseVisionReport({
      retryRecommendation: RetryRecommendation.REJECT,
      problems: [
        {
          code: "DUPLICATE_OBJECTS",
          severity: "critical",
          section: "background",
          message: "Duplicate objects",
          critical: true,
        },
      ],
      overallScore: 40,
    }),
  });
  assert.equal(review.finalDecision, FinalDecision.REJECT);
  assert.equal(review.approved, false);
  console.log("✔ vision reject escalates to chief reject");
}

function testExplainability() {
  const bp = chiefBlueprint();
  const { explainability } = buildChiefReview(bp, {
    visionReport: baseVisionReport(),
    photoReview: {
      score: 85,
      realism: 0.88,
      looksLikePhoto: true,
      problems: ["slight shadow mismatch"],
      scores: {
        lighting: 80,
        shadows: 75,
        perspective: 85,
        integration: 82,
        colorMatching: 83,
        realism: 86,
      },
    },
  });
  assert.ok(explainability.reasoning.length >= 4);
  assert.ok(explainability.agentContributions.length >= 5);
  console.log("✔ explainability documents agent contributions and decision");
}

function testRecommendedMutationsNotDirectApply() {
  const bp = chiefBlueprint();
  const frozen = structuredClone(bp);
  const { review } = buildChiefReview(bp, {
    visionReport: baseVisionReport({
      retryRecommendation: RetryRecommendation.RETRY_SCENE,
      problems: [
        {
          code: "SCENE_MISMATCH",
          severity: "high",
          section: "scene",
          message: "Scene mismatch",
          critical: true,
        },
      ],
    }),
  });
  assert.deepEqual(frozen, bp);
  assert.ok(review.recommendedMutations.every((m) => m.producer === CHIEF_DESIGN_DIRECTOR_ID));
  console.log("✔ chief publishes mutation recommendations without mutating blueprint");
}

async function testLegacyAgentUsesChapter419() {
  const bp = chiefBlueprint();
  const result = await chiefDesignDirectorAgent.execute(bp, {
    visionReport: baseVisionReport(),
  });
  assert.ok(result.chiefReview);
  assert.ok(result.decisionTrace.length >= 4);
  assert.equal(result.chiefReview.finalDecision, FinalDecision.APPROVE);
  console.log("✔ legacy chief design director agent uses Chapter 4.19 engine");
}

async function run() {
  testGoldenRule();
  testPipelinePosition();
  testApproveHighQualityPipeline();
  testCrossAgentConflictDetected();
  testLocalizedRetryNotFullPipeline();
  testCostAwareApproval();
  testConfidenceFusionIdentifiesLighting();
  testChiefReviewShape();
  testRejectOnVisionReject();
  testExplainability();
  testRecommendedMutationsNotDirectApply();
  await testLegacyAgentUsesChapter419();
  console.log("\nchief-design-director.spec.ts — all passed");
}

run();
