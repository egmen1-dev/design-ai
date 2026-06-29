import assert from "node:assert/strict";
import {
  ConstraintEngine,
  ConstraintSource,
  createEmptyRenderBlueprint,
  userConstraintsFromFlags,
  constraintsForProviderCapability,
  BlueprintLifecycle,
  LifecycleManager,
  assertReadyForAdapter,
  ConstitutionV18Error,
} from "./index";

function testValidBlueprintPasses() {
  const engine = new ConstraintEngine();
  const bp = createEmptyRenderBlueprint({ seed: 1, category: "electronics" });
  const report = engine.evaluate(bp);
  assert.equal(report.passed, true);
  assert.ok(report.activeConstraints > 0);
  assert.ok(report.totalConstraints >= report.activeConstraints);
  console.log("✔ valid blueprint passes constraint evaluation");
}

function testNoTextAndNoTypographyDeduped() {
  const engine = new ConstraintEngine();
  const bp = createEmptyRenderBlueprint({ seed: 2, category: "cosmetics" });
  bp.constraints.mustAvoidText = true;
  const report = engine.evaluate(bp);
  const noText = report.mergedSet.constraints.filter((c) => c.canonicalId === "hard.no-text");
  assert.equal(noText.length, 1);
  console.log("✔ no-text and no-typography merge into one rule");
}

function testOutdoorIndoorConflictResolved() {
  const engine = new ConstraintEngine();
  const bp = createEmptyRenderBlueprint({ seed: 3, category: "tools" });
  bp.scene.environment = "garden";
  const user = userConstraintsFromFlags({ lightInteriorOnly: true });
  const report = engine.evaluate(bp, { userConstraints: user });
  assert.ok(report.conflicts.some((c) => c.a.includes("outdoor")));
  assert.equal(
    report.mergedSet.constraints.some((c) => c.canonicalId === "scene.environment-indoor"),
    false,
  );
  assert.ok(report.passed);
  console.log("✔ outdoor vs indoor conflict resolved by priority");
}

function testProviderInternalExcludedFromCapability() {
  const engine = new ConstraintEngine();
  const bp = createEmptyRenderBlueprint({ seed: 4, category: "home" });
  const report = engine.evaluate(bp);
  assert.ok(report.ignoredConstraints > 0);
  const capability = constraintsForProviderCapability(report);
  assert.ok(capability.every((c) => !c.providerInternal));
  console.log("✔ marketplace constraints excluded from provider capability");
}

function testConstraintCacheByRevision() {
  const engine = new ConstraintEngine();
  const bp = createEmptyRenderBlueprint({ seed: 5, category: "x" });
  const r1 = engine.evaluate(bp);
  const r2 = engine.evaluate(bp);
  assert.equal(r2.cached, true);
  bp.meta.revision = 2;
  const r3 = engine.evaluate(bp);
  assert.equal(r3.cached, false);
  assert.equal(r1.revision, 0);
  console.log("✔ constraint report cached by revision");
}

function testConstraintEngineNeverMutatesBlueprint() {
  const engine = new ConstraintEngine();
  const bp = createEmptyRenderBlueprint({ seed: 6, category: "appliances" });
  const frozen = Object.freeze(structuredClone(bp));
  engine.evaluate(frozen);
  assert.equal(frozen.meta.revision, bp.meta.revision);
  console.log("✔ constraint engine is read-only");
}

function testUserConstraintsMerged() {
  const engine = new ConstraintEngine();
  const bp = createEmptyRenderBlueprint({ seed: 7, category: "pets" });
  const user = userConstraintsFromFlags({ noPeople: true, noAnimals: true, minimalism: true });
  const report = engine.evaluate(bp, { userConstraints: user });
  assert.ok(report.mergedSet.constraints.some((c) => c.source === ConstraintSource.USER));
  assert.ok(report.mergedSet.constraints.some((c) => c.canonicalId === "safety.no-people"));
  console.log("✔ user constraints merged into set");
}

function testHardInvariantsPresent() {
  const engine = new ConstraintEngine();
  const bp = createEmptyRenderBlueprint({ seed: 8, category: "x" });
  const report = engine.evaluate(bp);
  const ids = new Set(report.mergedSet.constraints.map((c) => c.canonicalId));
  assert.ok(ids.has("hard.no-text"));
  assert.ok(ids.has("hard.single-hero"));
  assert.ok(ids.has("hard.no-duplicate-product"));
  console.log("✔ architecture invariants always enforced");
}

function testLifecycleManagerConstraintsBeforeFrozen() {
  const mgr = new LifecycleManager();
  const bp = createEmptyRenderBlueprint({ seed: 9, category: "electronics" });
  bp.lifecycle.stage = BlueprintLifecycle.FROZEN;
  bp.meta.locked = true;
  const report = mgr.assertPreAdapterConstraints(bp);
  assert.equal(report.passed, true);
  assert.ok(mgr.getLastConstraintReport());
  console.log("✔ LifecycleManager constraint check before adapter");
}

function testAssertReadyForAdapterIncludesConstraints() {
  const bp = createEmptyRenderBlueprint({ seed: 10, category: "x" });
  bp.lifecycle.stage = BlueprintLifecycle.FROZEN;
  bp.meta.locked = true;
  assert.doesNotThrow(() => assertReadyForAdapter(bp));
  console.log("✔ assertReadyForAdapter runs constraint engine");
}

function testAssertReadyFailsWhenNotFrozen() {
  const bp = createEmptyRenderBlueprint({ seed: 11, category: "x" });
  assert.throws(() => assertReadyForAdapter(bp), ConstitutionV18Error);
  console.log("✔ adapter blocked when lifecycle not FROZEN");
}

function testFluxProviderExclusions() {
  const engine = new ConstraintEngine();
  const bp = createEmptyRenderBlueprint({ seed: 12, category: "x" });
  const report = engine.evaluate(bp);
  const flux = report.mergedSet.constraints.find((c) => c.id === "provider.flux-exclusions");
  assert.ok(flux);
  const fields = (flux!.payload as { fields: string[] }).fields;
  assert.ok(fields.includes("ctr"));
  assert.ok(fields.includes("coordinates"));
  console.log("✔ flux provider excludes non-visual fields");
}

async function run() {
  testValidBlueprintPasses();
  testNoTextAndNoTypographyDeduped();
  testOutdoorIndoorConflictResolved();
  testProviderInternalExcludedFromCapability();
  testConstraintCacheByRevision();
  testConstraintEngineNeverMutatesBlueprint();
  testUserConstraintsMerged();
  testHardInvariantsPresent();
  testLifecycleManagerConstraintsBeforeFrozen();
  testAssertReadyForAdapterIncludesConstraints();
  testAssertReadyFailsWhenNotFrozen();
  testFluxProviderExclusions();
}

run().then(() => {
  console.log("\nAll constraint engine Chapter 3.7 specs passed.");
});
