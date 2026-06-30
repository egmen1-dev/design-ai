/**
 * DESIGN AI v18 — Vision Quality Director tests (Chapter 4.18)
 */
import assert from "node:assert/strict";
import {
  VISION_QUALITY_DIRECTOR_GOLDEN_RULE,
  VISION_QUALITY_DIRECTOR_ID,
  VISION_QUALITY_DIRECTOR_PIPELINE_POSITION,
  RetryRecommendation,
  VisionProblemSeverity,
  MaterialWorld,
  SceneType,
  LightingScheme,
  buildVisionQualityReport,
  validateVisionQualityReport,
  runVisionQualityDirector,
  visionQualityDirectorAgent,
  frozenTestBlueprint,
  buildAdapterRenderIntent,
  BlueprintLifecycle,
} from "./index";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

function frozenBlueprintWithDirectors() {
  const bp = frozenTestBlueprint();
  bp.scene.sceneType = SceneType.MINIMAL;
  bp.scene.environment = "studio";
  bp.lighting.lightingScheme = LightingScheme.SINGLE_SOFT_LIGHT;
  bp.materials.materialWorld = MaterialWorld.MINIMAL_STUDIO;
  bp.materials.floor = "matte natural oak floor";
  bp.lifecycle.stage = BlueprintLifecycle.RENDERING;
  return bp;
}

function cleanSignals() {
  return {
    backgroundClutter: 0.1,
    lightingMismatch: 0.1,
    perspectiveMismatch: 0.1,
    headlineWhitespaceRatio: 0.55,
    duplicateProduct: false,
    noiseLevel: 0.08,
    jpegArtifactScore: 0.08,
    blurScore: 0.1,
    width: 1080,
    height: 1080,
  };
}

function testGoldenRule() {
  assert.ok(VISION_QUALITY_DIRECTOR_GOLDEN_RULE.includes("beauty"));
  console.log("✔ golden rule — blueprint fidelity, not aesthetic preference");
}

function testPipelinePosition() {
  assert.equal(VISION_QUALITY_DIRECTOR_PIPELINE_POSITION[2], VISION_QUALITY_DIRECTOR_ID);
  console.log("✔ vision quality director follows generated background");
}

function testBlueprintComparisonCleanBackground() {
  const bp = frozenBlueprintWithDirectors();
  bp.lifecycle.stage = BlueprintLifecycle.FROZEN;
  const renderIntent = buildAdapterRenderIntent(bp, { providerId: "flux" }).intent;
  bp.lifecycle.stage = BlueprintLifecycle.RENDERING;
  const { report } = buildVisionQualityReport({
    blueprint: bp,
    visionInput: { image: TINY_PNG, provider: "flux", diagnostics: cleanSignals() },
    renderIntent,
  });
  assert.ok(report.overallScore >= 70);
  assert.equal(report.retryRecommendation, RetryRecommendation.ACCEPT);
  assert.ok(report.sceneAccuracy >= 80);
  console.log("✔ clean minimal background passes blueprint comparison");
}

function testSceneMismatchDetected() {
  const bp = frozenBlueprintWithDirectors();
  const { report } = buildVisionQualityReport({
    blueprint: bp,
    visionInput: {
      image: TINY_PNG,
      provider: "flux",
      diagnostics: {
        ...cleanSignals(),
        backgroundClutter: 0.55,
      },
    },
  });
  assert.ok(report.problems.some((p) => p.code === "SCENE_MISMATCH"));
  assert.ok(report.sceneAccuracy < 80);
  assert.ok(
    report.retryRecommendation === RetryRecommendation.RETRY_SCENE ||
      report.retryRecommendation === RetryRecommendation.RETRY_FULL_RENDER,
  );
  console.log("✔ cluttered living room fails minimal studio blueprint");
}

function testLightingDriftDetected() {
  const bp = frozenBlueprintWithDirectors();
  bp.lighting.lightingScheme = LightingScheme.LUXURY_SIDE_LIGHT;
  const { report } = buildVisionQualityReport({
    blueprint: bp,
    visionInput: {
      image: TINY_PNG,
      provider: "flux",
      diagnostics: {
        ...cleanSignals(),
        lightingMismatch: 0.5,
      },
    },
  });
  assert.ok(report.problems.some((p) => p.code === "LIGHTING_DRIFT"));
  assert.ok(report.lightingAccuracy < 80);
  assert.equal(report.retryRecommendation, RetryRecommendation.RETRY_LIGHTING);
  console.log("✔ lighting drift triggers retry lighting recommendation");
}

function testMaterialMismatchDetected() {
  const bp = frozenBlueprintWithDirectors();
  const { report } = buildVisionQualityReport({
    blueprint: bp,
    visionInput: {
      image: TINY_PNG,
      provider: "flux",
      diagnostics: {
        ...cleanSignals(),
        backgroundClutter: 0.55,
      },
    },
  });
  assert.ok(report.problems.some((p) => p.code === "MATERIAL_MISMATCH"));
  console.log("✔ oak blueprint with wrong material feel fails validation");
}

function testOverlaySafety() {
  const bp = frozenBlueprintWithDirectors();
  const { report } = buildVisionQualityReport({
    blueprint: bp,
    visionInput: {
      image: TINY_PNG,
      provider: "flux",
      diagnostics: {
        ...cleanSignals(),
        headlineWhitespaceRatio: 0.2,
      },
    },
  });
  assert.ok(report.problems.some((p) => p.code === "OVERLAY_UNSAFE"));
  assert.ok(report.overlaySafety < 70);
  console.log("✔ overlay unsafe when headline whitespace insufficient");
}

function testProviderArtifactsReject() {
  const bp = frozenBlueprintWithDirectors();
  const { report } = buildVisionQualityReport({
    blueprint: bp,
    visionInput: {
      image: TINY_PNG,
      provider: "flux",
      diagnostics: {
        ...cleanSignals(),
        duplicateProduct: true,
        noiseLevel: 0.5,
      },
    },
  });
  assert.ok(report.problems.some((p) => p.code === "DUPLICATE_OBJECTS"));
  assert.equal(report.retryRecommendation, RetryRecommendation.REJECT);
  console.log("✔ duplicate objects recommend reject");
}

function testVisionReportShape() {
  const bp = frozenBlueprintWithDirectors();
  const { report } = buildVisionQualityReport({
    blueprint: bp,
    visionInput: { image: TINY_PNG, provider: "flux", diagnostics: cleanSignals() },
  });
  assert.ok(report.compositionScore >= 0 && report.compositionScore <= 100);
  assert.ok(report.backgroundCleanliness >= 0);
  assert.ok(report.providerArtifacts >= 0);
  assert.ok(report.problems.every((p) => p.message.length > 0));
  assert.ok(report.confidence >= 0.5 && report.confidence <= 1);
  const validation = validateVisionQualityReport(report, bp);
  assert.equal(validation.valid, true);
  console.log("✔ vision quality report matches Chapter 4.18 contract");
}

function testExplainability() {
  const bp = frozenBlueprintWithDirectors();
  const { explainability } = buildVisionQualityReport({
    blueprint: bp,
    visionInput: { image: TINY_PNG, provider: "flux", diagnostics: cleanSignals() },
  });
  assert.ok(explainability.blueprintSectionsChecked.includes("lighting"));
  assert.ok(explainability.reasoning.length >= 5);
  assert.ok(explainability.retryReasoning.includes("Recommendation"));
  console.log("✔ explainability traces blueprint sections and retry reasoning");
}

function testNoAestheticJudgment() {
  const bp = frozenBlueprintWithDirectors();
  const { report } = buildVisionQualityReport({
    blueprint: bp,
    visionInput: { image: TINY_PNG, provider: "flux", diagnostics: cleanSignals() },
  });
  assert.ok(!report.problems.some((p) => /\b(beautiful|ugly|pretty)\b/i.test(p.message)));
  console.log("✔ problems describe blueprint violations, not taste");
}

async function testLegacyAgentUsesChapter418() {
  const bp = frozenBlueprintWithDirectors();
  const result = await visionQualityDirectorAgent.execute(bp, {
    image: TINY_PNG,
    provider: "flux",
    diagnostics: cleanSignals(),
  });
  assert.ok(result.visionReport);
  assert.ok(result.decisionTrace.length >= 5);
  assert.equal(result.visionReport.retryRecommendation, RetryRecommendation.ACCEPT);
  console.log("✔ legacy vision quality director agent uses Chapter 4.18 engine");
}

async function run() {
  testGoldenRule();
  testPipelinePosition();
  testBlueprintComparisonCleanBackground();
  testSceneMismatchDetected();
  testLightingDriftDetected();
  testMaterialMismatchDetected();
  testOverlaySafety();
  testProviderArtifactsReject();
  testVisionReportShape();
  testExplainability();
  testNoAestheticJudgment();
  await testLegacyAgentUsesChapter418();
  console.log("\nvision-quality-director.spec.ts — all passed");
}

run();
