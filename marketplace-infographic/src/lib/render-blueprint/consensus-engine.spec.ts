/**
 * DESIGN AI v18 — Consensus Engine tests (Chapter 4.23)
 */
import assert from "node:assert/strict";
import {
  CONSENSUS_ENGINE_GOLDEN_RULE,
  CONSENSUS_ENGINE_ID,
  CONSENSUS_ENGINE_PIPELINE_POSITION,
  ConflictType,
  ConflictSeverity,
  LightingStyle,
  StoryType,
  SceneType,
  EnvironmentType,
  CameraStyle,
  detectSemanticConflicts,
  detectVisualConflicts,
  detectMarketplaceConflicts,
  buildAgreementMatrix,
  buildConsensusReport,
  validateConsensusReport,
  runConsensusEngine,
  isConsensusFailure,
  frozenTestBlueprint,
} from "./index";

function consensusBlueprint() {
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.story.emotionalTone = "luxury";
  bp.story.primaryEmotion = "luxury";
  bp.scene.sceneType = SceneType.LUXURY;
  bp.scene.environment = EnvironmentType.LUXURY_INTERIOR;
  bp.lighting.lightingStyle = LightingStyle.LUXURY_WARM;
  bp.lighting.lightingScheme = "luxury_side_light";
  bp.camera.cameraStyle = CameraStyle.PREMIUM_HERO;
  bp.camera.distance = "medium";
  bp.photography.photographyStyle = "premium_hero";
  bp.materials.materialWorld = "white_marble";
  bp.composition.template = "hero_right";
  return bp;
}

function testGoldenRule() {
  assert.ok(CONSENSUS_ENGINE_GOLDEN_RULE.includes("does not determine which agent is right"));
  console.log("✔ golden rule — consensus checks system coherence, not agent voting");
}

function testPipelinePosition() {
  assert.equal(CONSENSUS_ENGINE_PIPELINE_POSITION[3], CONSENSUS_ENGINE_ID);
  assert.equal(CONSENSUS_ENGINE_PIPELINE_POSITION[5], "render-adapter");
  console.log("✔ consensus engine runs after validation, before render adapter");
}

function testLuxuryColdLightingSemanticConflict() {
  const bp = consensusBlueprint();
  bp.lighting.lightingStyle = LightingStyle.TECHNOLOGY_COOL;
  const conflicts = detectSemanticConflicts(bp);
  assert.ok(conflicts.some((c) => c.code === "STORY_LIGHTING_SEMANTIC"));
  assert.equal(conflicts[0].type, ConflictType.SEMANTIC);
  assert.equal(conflicts[0].severity, ConflictSeverity.CRITICAL);
  assert.ok(conflicts[0].explanation.includes("premium perception"));
  console.log("✔ luxury story + industrial cold lighting semantic conflict detected");
}

function testWarmFamilyColdLightingConflict() {
  const bp = consensusBlueprint();
  bp.story.storyType = StoryType.FAMILY;
  bp.story.emotionalTone = "warm";
  bp.lighting.lightingStyle = LightingStyle.TECHNOLOGY_COOL;
  const conflicts = detectSemanticConflicts(bp);
  assert.ok(conflicts.some((c) => c.code === "COMFORT_LIGHTING_SEMANTIC"));
  console.log("✔ warm family comfort + cold technology lighting conflict detected");
}

function testLuxuryWideCameraVisualConflict() {
  const bp = consensusBlueprint();
  bp.camera.cameraStyle = CameraStyle.LIFESTYLE_CONTEXT;
  bp.camera.distance = "far";
  const conflicts = detectVisualConflicts(bp);
  assert.ok(conflicts.some((c) => c.code === "STORY_CAMERA_VISUAL"));
  assert.equal(conflicts[0].type, ConflictType.VISUAL);
  console.log("✔ luxury story + wide documentary camera visual conflict detected");
}

function testAgreementMatrixWeakLightingLink() {
  const bp = consensusBlueprint();
  bp.lighting.lightingStyle = LightingStyle.TECHNOLOGY_COOL;
  const conflicts = detectSemanticConflicts(bp);
  const matrix = buildAgreementMatrix(bp, conflicts, {
    agentConfidences: {
      "visual-story-director": 0.96,
      "scene-director": 0.97,
      "lighting-director": 0.63,
      "camera-director": 0.94,
      "material-director": 0.91,
    },
  });
  assert.ok((matrix.sections.lighting ?? 100) < (matrix.sections.story ?? 0));
  assert.equal(matrix.weakestSection, "lighting");
  console.log("✔ agreement matrix identifies lighting as weakest link");
}

function testCriticalConflictRequiresRetry() {
  const bp = consensusBlueprint();
  bp.lighting.lightingStyle = LightingStyle.TECHNOLOGY_COOL;
  const { report } = buildConsensusReport(bp);
  assert.equal(report.requiresRetry, true);
  assert.ok(report.conflicts.some((c) => c.severity === ConflictSeverity.CRITICAL));
  console.log("✔ critical conflict requires retry before render");
}

function testCoherentBlueprintApproved() {
  const bp = consensusBlueprint();
  const { report } = buildConsensusReport(bp);
  assert.equal(report.requiresRetry, false);
  assert.ok(report.overallConsistency >= 80);
  assert.equal(report.conflicts.length, 0);
  console.log("✔ coherent luxury blueprint passes consensus without retry");
}

function testRecommendedMutationsPublished() {
  const bp = consensusBlueprint();
  bp.lighting.lightingStyle = LightingStyle.TECHNOLOGY_COOL;
  const { report } = buildConsensusReport(bp);
  assert.ok(report.recommendedMutations.some((m) => m.section === "lighting"));
  assert.ok(report.recommendedMutations.every((m) => m.producer === CONSENSUS_ENGINE_ID));
  console.log("✔ consensus publishes lighting retry mutation recommendation");
}

function testNoVotingCriticalOverridesAgreement() {
  const bp = consensusBlueprint();
  bp.lighting.lightingStyle = LightingStyle.TECHNOLOGY_COOL;
  const { report, explainability } = buildConsensusReport(bp, {
    agentConfidences: {
      "visual-story-director": 0.99,
      "scene-director": 0.99,
      "lighting-director": 0.99,
      "camera-director": 0.99,
      "material-director": 0.99,
    },
  });
  assert.equal(report.requiresRetry, true);
  assert.ok(explainability.reasoning.some((r) => r.includes("no voting")));
  console.log("✔ one critical conflict overrides high individual agent agreement — no voting");
}

function testMarketplaceDarkProductConflict() {
  const bp = consensusBlueprint();
  bp.product.dominantColor = ["#000000"];
  bp.scene.sceneType = SceneType.INDUSTRIAL;
  bp.scene.environment = EnvironmentType.OUTDOOR;
  bp.lighting.lightingStyle = LightingStyle.TECHNOLOGY_COOL;
  const conflicts = detectMarketplaceConflicts(bp);
  assert.ok(conflicts.some((c) => c.type === ConflictType.MARKETPLACE));
  console.log("✔ dark product on dark background marketplace conflict detected");
}

function testConsensusReportContract() {
  const bp = consensusBlueprint();
  const { report } = buildConsensusReport(bp);
  assert.ok(report.overallConsistency >= 0 && report.overallConsistency <= 100);
  assert.ok(Array.isArray(report.agreementMatrix.pairs));
  assert.ok(report.confidence >= 0.5 && report.confidence <= 1);
  const validation = validateConsensusReport(report);
  assert.equal(validation.valid, true);
  console.log("✔ consensus report matches Chapter 4.23 contract");
}

function testDoesNotMutateBlueprint() {
  const bp = consensusBlueprint();
  const frozen = structuredClone(bp);
  runConsensusEngine({ blueprint: bp });
  assert.deepEqual(frozen, bp);
  console.log("✔ consensus engine never mutates blueprint directly");
}

function testFailureCodes() {
  assert.equal(isConsensusFailure("CRITICAL_CONFLICT_SKIPPED"), true);
  assert.equal(isConsensusFailure("UNKNOWN"), false);
  console.log("✔ consensus failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testPipelinePosition();
  testLuxuryColdLightingSemanticConflict();
  testWarmFamilyColdLightingConflict();
  testLuxuryWideCameraVisualConflict();
  testAgreementMatrixWeakLightingLink();
  testCriticalConflictRequiresRetry();
  testCoherentBlueprintApproved();
  testRecommendedMutationsPublished();
  testNoVotingCriticalOverridesAgreement();
  testMarketplaceDarkProductConflict();
  testConsensusReportContract();
  testDoesNotMutateBlueprint();
  testFailureCodes();
  console.log("\nconsensus-engine.spec.ts — all passed");
}

run();
