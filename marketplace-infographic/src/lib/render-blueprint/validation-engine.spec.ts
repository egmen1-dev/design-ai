import assert from "node:assert/strict";
import {
  ValidationEngine,
  ValidationLevel,
  createEmptyRenderBlueprint,
  SectionState,
  BlueprintLifecycle,
  AgentContractError,
  LifecycleManager,
  advanceLifecycleStage,
  storyDirectorAgent,
} from "./index";

function testValidBlueprintPasses() {
  const engine = new ValidationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 1, category: "electronics" });
  const report = engine.validate(bp);
  assert.equal(report.passed, true);
  assert.equal(report.hasFatal, false);
  assert.ok(report.score > 0);
  console.log("✔ valid blueprint passes validation");
}

function testBusinessKitchenSnowFails() {
  const engine = new ValidationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 2, category: "appliances" });
  bp.scene.environment = "kitchen";
  bp.scene.surface = "snow covered counter";
  const report = engine.validate(bp);
  assert.equal(report.passed, false);
  assert.ok(report.errors.some((e) => e.code === "VAL_BUSINESS"));
  console.log("✔ kitchen + snow fails business validation");
}

function testStudioGrassFails() {
  const engine = new ValidationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 3, category: "tools" });
  bp.scene.environment = "studio";
  bp.materials.floor = "outdoor grass lawn";
  const report = engine.validate(bp);
  assert.ok(report.errors.some((e) => e.message.includes("grass")));
  console.log("✔ studio + outdoor grass fails business validation");
}

function testArchitectureCompositionWithoutCamera() {
  const engine = new ValidationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 4, category: "x" });
  bp.lifecycle.sections.composition = SectionState.READY;
  bp.lifecycle.sections.camera = SectionState.EMPTY;
  bp.lifecycle.sections.story = SectionState.LOCKED;
  bp.lifecycle.sections.scene = SectionState.LOCKED;
  const report = engine.validate(bp);
  assert.ok(report.errors.some((e) => e.code === "VAL_003"));
  console.log("✔ composition without camera fails architecture validation");
}

function testValidationCacheByRevision() {
  const engine = new ValidationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 5, category: "x" });
  const r1 = engine.validate(bp);
  const r2 = engine.validate(bp);
  assert.equal(r2.cached, true);
  assert.equal(r1.revision, r2.revision);
  bp.meta.revision = 1;
  const r3 = engine.validate(bp);
  assert.equal(r3.cached, false);
  console.log("✔ validation cached by revision");
}

function testValidationNeverMutatesBlueprint() {
  const engine = new ValidationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 6, category: "cosmetics" });
  const frozen = Object.freeze(structuredClone(bp));
  engine.validate(frozen);
  assert.equal(frozen.meta.revision, bp.meta.revision);
  console.log("✔ validation engine is read-only");
}

function testProfessionalWarningsAllowPass() {
  const engine = new ValidationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 7, category: "x" });
  bp.composition.negativeSpace = 0.05;
  bp.composition.heroWeight = 0.9;
  const report = engine.validate(bp);
  assert.equal(report.hasFatal, false);
  assert.equal(report.hasError, false);
  assert.ok(report.warnings.length > 0);
  assert.equal(report.passed, true);
  console.log("✔ professional warnings do not block pipeline");
}

async function testLifecycleManagerValidatesAfterMutation() {
  const mgr = new LifecycleManager();
  mgr.registerAgent(storyDirectorAgent);
  let bp = createEmptyRenderBlueprint({ seed: 8, category: "appliances" });
  bp = advanceLifecycleStage(bp);
  bp = mgr.apply("product-analyzer", bp, {
    confidence: 90,
    decisionTrace: [],
    warnings: [],
    updates: { product: { shape: "box" } },
  }).blueprint;
  bp = advanceLifecycleStage(bp);
  bp = mgr.apply("creative-engine", bp, {
    confidence: 88,
    decisionTrace: [],
    warnings: [],
    updates: { creative: { audience: "home", emotion: "calm" } },
  }).blueprint;
  bp = advanceLifecycleStage(bp);

  await mgr.runAgent(storyDirectorAgent, bp, {
    productCategory: "appliances",
    creativeGoal: "Technical",
  });
  const report = mgr.getLastValidationReport();
  assert.ok(report);
  assert.equal(report!.passed, true);
  console.log("✔ LifecycleManager validates after mutation");
}

function testFatalMissingProduct() {
  const engine = new ValidationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 9, category: "" });
  bp.product.category = "";
  const report = engine.validate(bp);
  assert.equal(report.hasFatal, true);
  console.log("✔ missing product is FATAL");
}

async function run() {
  testValidBlueprintPasses();
  testBusinessKitchenSnowFails();
  testStudioGrassFails();
  testArchitectureCompositionWithoutCamera();
  testValidationCacheByRevision();
  testValidationNeverMutatesBlueprint();
  testProfessionalWarningsAllowPass();
  testFatalMissingProduct();
  await testLifecycleManagerValidatesAfterMutation();
}

run().then(() => {
  console.log("\nAll validation engine Chapter 3.6 specs passed.");
});
