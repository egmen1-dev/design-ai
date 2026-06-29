/**
 * DESIGN AI v18 — Vision QA tests (Chapter 3.18)
 */

import assert from "node:assert/strict";
import {
  VisionQA,
  analyzeVision,
  VisionCategory,
  IssueSeverity,
  VISION_THRESHOLDS,
  passesVisionThresholds,
  recommendationsFromIssues,
  VisionHistoryStore,
  RecoveryStrategy,
  deriveVisionSignals,
} from "./index";

const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const METADATA = {
  provider: "flux",
  model: "flux-pro",
  seed: 42,
  seedSupported: true,
  generationTimeMs: 1200,
  promptTokens: 0,
  adapterVersion: "3.11.0",
};

function testAnalyzesImageOnly() {
  const qa = new VisionQA();
  const report = qa.analyze({
    image: TINY_PNG,
    provider: "flux",
    metadata: METADATA,
  });
  assert.equal(typeof report.score, "number");
  assert.equal(typeof report.approved, "boolean");
  assert.ok(report.metrics.overall >= 0);
  console.log("✔ vision QA analyzes image without blueprint or prompt");
}

function testProviderIndependence() {
  const input = { image: TINY_PNG, provider: "flux", metadata: METADATA };
  const flux = analyzeVision(input);
  const gpt = analyzeVision({ ...input, provider: "gpt-image", metadata: { ...METADATA, provider: "gpt-image" } });
  assert.equal(flux.score, gpt.score);
  assert.deepEqual(flux.metrics, gpt.metrics);
  console.log("✔ vision QA is provider-independent");
}

function testThresholds() {
  const metrics = {
    composition: 85,
    realism: 85,
    lighting: 80,
    integration: 85,
    marketplace: 90,
    technical: 95,
    overall: 87,
  };
  assert.equal(passesVisionThresholds(metrics), true);
  assert.equal(passesVisionThresholds({ ...metrics, technical: 80 }), false);
  assert.equal(VISION_THRESHOLDS.marketplace, 85);
  console.log("✔ vision thresholds enforced per metric");
}

function testProductTooSmallRecovery() {
  const qa = new VisionQA();
  const report = qa.analyze(
    { image: TINY_PNG, provider: "pollinations", metadata: { ...METADATA, provider: "pollinations" } },
    {
      signals: {
        productAreaRatio: 0.15,
        headlineWhitespaceRatio: 0.3,
        hasContactShadow: false,
        lightingMismatch: 0.5,
        perspectiveMismatch: 0.4,
        backgroundClutter: 0.2,
        duplicateProduct: false,
        noiseLevel: 0.1,
        jpegArtifactScore: 0.1,
        overexposure: 0.1,
        blurScore: 0.1,
        width: 1080,
        height: 1080,
      },
    },
  );
  assert.equal(report.approved, false);
  assert.ok(report.issues.some((i) => i.code === "PRODUCT_TOO_SMALL"));
  assert.ok(report.recommendations.some((r) => r.problemId === "product_too_small"));
  assert.ok(report.issues.every((i) => i.reason.length > 0));
  console.log("✔ product too small triggers composition retry recommendation");
}

function testCompositeShadowRecovery() {
  const issues = [
    {
      category: VisionCategory.COMPOSITION,
      severity: IssueSeverity.MEDIUM,
      reason: "Контактная тень отсутствует.",
      code: "MISSING_CONTACT_SHADOW",
    },
  ];
  const recs = recommendationsFromIssues(issues);
  assert.ok(recs.some((r) => r.strategy === RecoveryStrategy.COMPOSITE_RETRY));
  console.log("✔ weak shadows recommend composite retry");
}

function testExplainability() {
  const qa = new VisionQA();
  const report = qa.analyze(
    { image: TINY_PNG, provider: "flux", metadata: METADATA },
    { signals: { productAreaRatio: 0.2, width: 1080, height: 1080 } },
  );
  const issue = report.issues.find((i) => i.code === "PRODUCT_TOO_SMALL");
  assert.ok(issue?.reason.includes("30%"));
  console.log("✔ every issue includes human-readable explanation");
}

function testVisionHistory() {
  const history = new VisionHistoryStore();
  const qa = new VisionQA(history);
  qa.analyze({ image: TINY_PNG, provider: "flux", metadata: METADATA });
  qa.analyze({ image: TINY_PNG + "x", provider: "flux", metadata: METADATA });
  assert.equal(history.list().length, 2);
  assert.ok(history.averageScore() > 0);
  console.log("✔ vision reports stored in history for regression");
}

function testFailurePolicy() {
  const qa = new VisionQA();
  const report = qa.analyze(
    { image: TINY_PNG, provider: "sdxl", metadata: { ...METADATA, provider: "sdxl" } },
    {
      signals: {
        productAreaRatio: 0.1,
        duplicateProduct: true,
        hasContactShadow: false,
        lightingMismatch: 0.8,
        perspectiveMismatch: 0.8,
        backgroundClutter: 0.6,
        headlineWhitespaceRatio: 0.1,
        noiseLevel: 0.5,
        jpegArtifactScore: 0.5,
        blurScore: 0.6,
        overexposure: 0.5,
        width: 1080,
        height: 1080,
      },
    },
  );
  assert.equal(report.approved, false);
  assert.ok(report.recommendations.length > 0);
  console.log("✔ rejected vision report includes recovery recommendations for LM");
}

function testDeriveSignalsNoBlueprint() {
  const signals = deriveVisionSignals(TINY_PNG);
  assert.ok(signals.width > 0);
  assert.ok(signals.height > 0);
  console.log("✔ signals derived from image bytes only");
}

function main() {
  testAnalyzesImageOnly();
  testProviderIndependence();
  testThresholds();
  testProductTooSmallRecovery();
  testCompositeShadowRecovery();
  testExplainability();
  testVisionHistory();
  testFailurePolicy();
  testDeriveSignalsNoBlueprint();
  console.log("\nvision-qa.spec.ts — all passed");
}

main();
