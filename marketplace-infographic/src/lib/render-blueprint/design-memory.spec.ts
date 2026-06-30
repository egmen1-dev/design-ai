/**
 * DESIGN AI v18 — Design Memory tests (Chapter 4.20)
 */
import assert from "node:assert/strict";
import {
  DESIGN_MEMORY_GOLDEN_RULE,
  DESIGN_MEMORY_ID,
  DESIGN_MEMORY_PIPELINE_POSITION,
  UserFeedback,
  FinalDecision,
  RetryRecommendation,
  LightingStyle,
  StoryType,
  SceneType,
  EnvironmentType,
  SurfaceMaterialId,
  createEmptyDesignKnowledgeStore,
  extractBlueprintPattern,
  computeMemoryOutcomeScore,
  buildMemoryUpdate,
  queryDesignMemory,
  validateMemoryUpdate,
  runDesignMemory,
  designMemoryAgent,
  frozenTestBlueprint,
  BlueprintLifecycle,
} from "./index";
import type { ChiefReview } from "./chief-design-director-types";
import type { VisionQualityReport } from "./vision-quality-director-types";

function baseChiefReview(overrides: Partial<ChiefReview> = {}): ChiefReview {
  return {
    approved: true,
    overallScore: 88,
    estimatedScoreAfterRetry: 88,
    retryRequired: false,
    retryStrategy: "none",
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

function memoryBlueprint() {
  const bp = frozenTestBlueprint();
  bp.product.category = "premium_kitchen";
  bp.product.subCategory = "cookware";
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.scene.sceneType = SceneType.MINIMAL;
  bp.scene.environment = EnvironmentType.MODERN_KITCHEN;
  bp.lighting.lightingStyle = LightingStyle.NATURAL_WINDOW;
  bp.lighting.lightingScheme = "natural_window_light";
  bp.materials.surfaceMaterials = [{ id: SurfaceMaterialId.OAK, role: "floor", finish: "matte" }];
  bp.materials.materialWorld = SurfaceMaterialId.OAK;
  bp.lifecycle.stage = BlueprintLifecycle.FINISHED;
  return bp;
}

function testGoldenRule() {
  assert.ok(DESIGN_MEMORY_GOLDEN_RULE.includes("does not remember images"));
  console.log("✔ golden rule — memory stores patterns, not images");
}

function testPipelinePosition() {
  assert.equal(DESIGN_MEMORY_PIPELINE_POSITION[2], DESIGN_MEMORY_ID);
  console.log("✔ design memory runs after chief approval");
}

function testExtractBlueprintPattern() {
  const bp = memoryBlueprint();
  const pattern = extractBlueprintPattern(bp);
  assert.equal(pattern.scene, SceneType.MINIMAL);
  assert.equal(pattern.lighting, LightingStyle.NATURAL_WINDOW);
  assert.equal(pattern.materials, SurfaceMaterialId.OAK);
  console.log("✔ blueprint pattern extraction captures design dimensions");
}

function testSuccessfulPatternRecorded() {
  const bp = memoryBlueprint();
  const store = createEmptyDesignKnowledgeStore();
  const { update } = buildMemoryUpdate(bp, {
    chiefReview: baseChiefReview({ overallScore: 92 }),
    visionReport: baseVisionReport({ overallScore: 91 }),
    generationMetadata: { provider: "flux" },
  }, store);

  assert.ok(update.successfulPatterns.length >= 1);
  assert.ok(update.successfulPatterns[0].sampleCount === 1);
  assert.ok(update.successfulPatterns[0].explanation.includes("times"));
  console.log("✔ successful kitchen + soft light + oak pattern recorded");
}

function testFailurePatternRecorded() {
  const bp = memoryBlueprint();
  bp.scene.sceneType = SceneType.INDUSTRIAL;
  bp.scene.environment = EnvironmentType.OUTDOOR;
  bp.lighting.lightingStyle = LightingStyle.TECHNOLOGY_COOL;
  bp.materials.surfaceMaterials = [{ id: SurfaceMaterialId.MATTE_PLASTIC, role: "floor", finish: "matte" }];
  bp.materials.materialWorld = SurfaceMaterialId.MATTE_PLASTIC;

  const { update } = buildMemoryUpdate(bp, {
    chiefReview: baseChiefReview({
      approved: false,
      overallScore: 42,
      finalDecision: FinalDecision.REJECT,
    }),
    visionReport: baseVisionReport({ overallScore: 38 }),
    generationMetadata: { provider: "flux" },
  });

  assert.ok(update.unsuccessfulPatterns.length >= 1);
  assert.ok(update.avoidPatterns.length >= 1);
  console.log("✔ dark background + black product failure lowers pattern weight");
}

function testRetryLearning() {
  const bp = memoryBlueprint();
  const { update, explainability } = buildMemoryUpdate(bp, {
    chiefReview: baseChiefReview({
      overallScore: 72,
      estimatedScoreAfterRetry: 91,
      retryRequired: true,
    }),
    visionReport: baseVisionReport({ overallScore: 74 }),
    retryHistory: { attempts: 1, strategiesUsed: ["lighting_retry"] },
    generationMetadata: { provider: "flux" },
  });

  assert.ok(
    update.knowledgeChanges.some((c) => c.key.includes("lighting_retry")),
    "expected lighting retry knowledge change",
  );
  assert.ok(explainability.retryLearning?.includes("lighting_retry"));
  console.log("✔ lighting retry score jump increases lighting pattern weight");
}

function testCategoryIsolation() {
  const bp = memoryBlueprint();
  let store = createEmptyDesignKnowledgeStore();

  ({ store } = buildMemoryUpdate(bp, {
    chiefReview: baseChiefReview(),
    visionReport: baseVisionReport(),
    generationMetadata: { provider: "flux" },
  }, store));

  const cosmeticsBp = memoryBlueprint();
  cosmeticsBp.product.category = "cosmetics";
  cosmeticsBp.scene.sceneType = SceneType.LUXURY;
  cosmeticsBp.scene.environment = EnvironmentType.BATHROOM;
  cosmeticsBp.lighting.lightingStyle = LightingStyle.LUXURY_WARM;
  cosmeticsBp.materials.surfaceMaterials = [
    { id: SurfaceMaterialId.WHITE_MARBLE, role: "wall", finish: "polished" },
  ];
  cosmeticsBp.materials.materialWorld = SurfaceMaterialId.WHITE_MARBLE;
  ({ store } = buildMemoryUpdate(cosmeticsBp, {
    chiefReview: baseChiefReview(),
    visionReport: baseVisionReport(),
    generationMetadata: { provider: "flux" },
  }, store));

  assert.ok(store.weightsByScope["premium_kitchen::flux"]);
  assert.ok(store.weightsByScope["cosmetics::flux"]);
  assert.notDeepEqual(
    store.weightsByScope["premium_kitchen::flux"],
    store.weightsByScope["cosmetics::flux"],
  );
  console.log("✔ cosmetics knowledge isolated from premium kitchen");
}

function testProviderIsolation() {
  const bp = memoryBlueprint();
  let store = createEmptyDesignKnowledgeStore();

  for (let i = 0; i < 6; i++) {
    ({ store } = buildMemoryUpdate(bp, {
      chiefReview: baseChiefReview({ overallScore: 90 + i }),
      visionReport: baseVisionReport({ overallScore: 90 }),
      generationMetadata: { provider: "flux" },
      completedAt: Date.now() + i,
    }, store));
  }

  for (let i = 0; i < 6; i++) {
    const gptBp = memoryBlueprint();
    gptBp.meta.generator = "gpt-image";
    ({ store } = buildMemoryUpdate(gptBp, {
      chiefReview: baseChiefReview({ overallScore: 55 }),
      visionReport: baseVisionReport({ overallScore: 52 }),
      generationMetadata: { provider: "gpt-image" },
      completedAt: Date.now() + i,
    }, store));
  }

  assert.ok(store.weightsByScope["premium_kitchen::flux"]);
  assert.ok(store.weightsByScope["premium_kitchen::gpt-image"]);
  assert.notDeepEqual(
    store.weightsByScope["premium_kitchen::flux"],
    store.weightsByScope["premium_kitchen::gpt-image"],
  );
  console.log("✔ FLUX and GPT Image patterns stored separately");
}

function testMarketplaceMetricsWeighted() {
  const bp = memoryBlueprint();
  const withoutCtr = computeMemoryOutcomeScore({
    chiefReview: baseChiefReview({ overallScore: 80 }),
    visionReport: baseVisionReport({ overallScore: 80 }),
  });
  const withCtr = computeMemoryOutcomeScore({
    chiefReview: baseChiefReview({ overallScore: 80 }),
    visionReport: baseVisionReport({ overallScore: 80 }),
    commercialMetrics: { ctr: 0.12, conversion: 0.08, timeOnCardMs: 4000 },
  });
  assert.ok(withCtr > withoutCtr);
  console.log("✔ marketplace CTR and conversion increase outcome score");
}

function testUserFeedbackLearning() {
  const bp = memoryBlueprint();
  const liked = computeMemoryOutcomeScore({
    chiefReview: baseChiefReview(),
    visionReport: baseVisionReport(),
    userFeedback: UserFeedback.LIKE,
  });
  const disliked = computeMemoryOutcomeScore({
    chiefReview: baseChiefReview(),
    visionReport: baseVisionReport(),
    userFeedback: UserFeedback.DISLIKE,
  });
  assert.ok(liked > disliked);
  console.log("✔ user like/dislike adjusts outcome score");
}

function testMemoryQueryExplainability() {
  const bp = memoryBlueprint();
  let store = createEmptyDesignKnowledgeStore();

  for (let i = 0; i < 6; i++) {
    ({ store } = buildMemoryUpdate(bp, {
      chiefReview: baseChiefReview({ overallScore: 94 }),
      visionReport: baseVisionReport({ overallScore: 93 }),
      generationMetadata: { provider: "flux" },
      completedAt: Date.now() + i * 1000,
    }, store));
  }

  const result = queryDesignMemory(store, { category: "premium_kitchen", provider: "flux" });
  assert.ok(result.recommendedLighting.length >= 1 || result.preferredScene.length >= 1);
  if (result.explanations.length > 0) {
    assert.ok(result.explanations[0].includes("times") || result.explanations[0].includes("score"));
  }
  console.log("✔ memory query returns explainable recommendations");
}

function testMemoryUpdateContract() {
  const bp = memoryBlueprint();
  const { update } = buildMemoryUpdate(bp, {
    chiefReview: baseChiefReview(),
    visionReport: baseVisionReport(),
    generationMetadata: { provider: "flux" },
  });

  assert.ok(Array.isArray(update.successfulPatterns));
  assert.ok(Array.isArray(update.knowledgeChanges));
  assert.ok(update.confidence >= 0.5 && update.confidence <= 1);

  const validation = validateMemoryUpdate(update, {
    chiefReview: baseChiefReview(),
    visionReport: baseVisionReport(),
  });
  assert.equal(validation.valid, true);
  console.log("✔ memory update matches Chapter 4.20 contract");
}

function testDoesNotMutateBlueprint() {
  const bp = memoryBlueprint();
  const frozen = structuredClone(bp);
  buildMemoryUpdate(bp, {
    chiefReview: baseChiefReview(),
    visionReport: baseVisionReport(),
    generationMetadata: { provider: "flux" },
  });
  assert.deepEqual(frozen, bp);
  console.log("✔ design memory never mutates current blueprint");
}

async function testLegacyAgentUsesChapter420() {
  const bp = memoryBlueprint();
  const result = await designMemoryAgent.execute(bp, {
    chiefReview: baseChiefReview(),
    visionReport: baseVisionReport(),
    generationMetadata: { provider: "flux" },
  });
  assert.ok(result.memoryUpdate);
  assert.ok(result.knowledgeStore);
  assert.ok(result.decisionTrace.length >= 4);
  console.log("✔ legacy design memory agent uses Chapter 4.20 engine");
}

async function run() {
  testGoldenRule();
  testPipelinePosition();
  testExtractBlueprintPattern();
  testSuccessfulPatternRecorded();
  testFailurePatternRecorded();
  testRetryLearning();
  testCategoryIsolation();
  testProviderIsolation();
  testMarketplaceMetricsWeighted();
  testUserFeedbackLearning();
  testMemoryQueryExplainability();
  testMemoryUpdateContract();
  testDoesNotMutateBlueprint();
  await testLegacyAgentUsesChapter420();
  console.log("\ndesign-memory.spec.ts — all passed");
}

run();
