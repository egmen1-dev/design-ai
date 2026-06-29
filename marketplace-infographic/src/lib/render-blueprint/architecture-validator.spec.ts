/**
 * DESIGN AI v18 — Architectural Invariants tests (Chapter 3.19)
 */
import assert from "node:assert/strict";
import {
  ARCHITECTURAL_INVARIANTS,
  ARCHITECTURAL_INVARIANT_IDS,
  ArchitecturalInvariantId,
  ArchitectureValidator,
  ArchitectureValidatorError,
  assertArchitectureInvariants,
  assertPipelineArchitecture,
  validateArchitecture,
  validateArchitectureAtPipelineStart,
  validateRecoveryArchitecture,
  createEmptyRenderBlueprint,
} from "./index";

function testInvariantCatalog() {
  assert.equal(ARCHITECTURAL_INVARIANTS.length, 23);
  assert.equal(ARCHITECTURAL_INVARIANT_IDS.length, 23);
  assert.ok(ARCHITECTURAL_INVARIANTS.every((i) => i.goldenRule));
  console.log("✔ architectural invariants catalog defines all 23 rules");
}

function testValidBlueprintPasses() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const report = validateArchitectureAtPipelineStart(bp);
  assert.equal(report.valid, true);
  assert.equal(report.invariantCount, 23);
  assert.ok(report.passed.length > 0);
  console.log("✔ valid blueprint passes architecture validation at pipeline start");
}

function testPromptIsolationBlocksPipeline() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const poisoned = {
    ...bp,
    render: { ...bp.render, compiledPrompt: "secret prompt" } as typeof bp.render,
  };
  const report = validateArchitectureAtPipelineStart(poisoned);
  assert.equal(report.valid, false);
  assert.ok(
    report.violations.some((v) => v.invariantId === ArchitecturalInvariantId.PROMPT_ISOLATION),
  );
  assert.throws(() => assertPipelineArchitecture(poisoned), ArchitectureValidatorError);
  console.log("✔ prompt in blueprint violates INV_10 and blocks pipeline");
}

function testShadowStateViolatesSingleSource() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const report = validateArchitecture({
    blueprint: bp,
    shadowStateStores: ["session-cache"],
  });
  assert.equal(report.valid, false);
  assert.ok(
    report.violations.some((v) => v.invariantId === ArchitecturalInvariantId.SINGLE_SOURCE_OF_TRUTH),
  );
  console.log("✔ parallel state store violates INV_01");
}

function testAgentIsolation() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const report = validateArchitecture({
    blueprint: bp,
    agentCrossCalls: [{ from: "scene-director", to: "lighting-director" }],
  });
  assert.ok(report.violations.some((v) => v.invariantId === ArchitecturalInvariantId.AGENT_ISOLATION));
  console.log("✔ direct agent calls violate INV_03");
}

function testLifecycleAuthority() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const report = validateArchitecture({
    blueprint: bp,
    unauthorizedLifecycleAction: { actor: "flux-adapter", action: "rollback" },
  });
  assert.ok(
    report.violations.some((v) => v.invariantId === ArchitecturalInvariantId.LIFECYCLE_AUTHORITY),
  );
  console.log("✔ unauthorized lifecycle action violates INV_05");
}

function testMutationSafety() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const report = validateArchitecture({ blueprint: bp, directBlueprintMutation: true });
  assert.ok(report.violations.some((v) => v.invariantId === ArchitecturalInvariantId.MUTATION_SAFETY));
  console.log("✔ direct blueprint mutation violates INV_06");
}

function testRecoverySafety() {
  const before = createEmptyRenderBlueprint({ category: "electronics", seed: 99 });
  const after = createEmptyRenderBlueprint({ category: "electronics", seed: 42 });
  const violations = validateRecoveryArchitecture({
    before,
    after,
    seedLocked: 99,
  });
  assert.ok(violations.some((v) => v.invariantId === ArchitecturalInvariantId.RECOVERY_SAFETY));
  console.log("✔ recovery seed change violates INV_16");
}

function testVisionIndependence() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const report = validateArchitecture({ blueprint: bp, visionUsesBlueprint: true });
  assert.ok(
    report.violations.some((v) => v.invariantId === ArchitecturalInvariantId.VISION_INDEPENDENCE),
  );
  console.log("✔ vision QA blueprint access violates INV_17");
}

function testCompositeIsolation() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const report = validateArchitecture({ blueprint: bp, compositeMutatesBackground: true });
  assert.ok(
    report.violations.some((v) => v.invariantId === ArchitecturalInvariantId.COMPOSITE_ISOLATION),
  );
  console.log("✔ composite background mutation violates INV_18");
}

function testInvariantsCannotBeBypassedByRecovery() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  assert.throws(
    () =>
      assertArchitectureInvariants({
        blueprint: bp,
        historyMutated: true,
      }),
    ArchitectureValidatorError,
  );
  console.log("✔ invariants cannot be bypassed — recovery must abort on violation");
}

function testArchitectureValidatorClass() {
  const validator = new ArchitectureValidator();
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const report = validator.assertAtPipelineStart(bp);
  assert.equal(report.valid, true);
  console.log("✔ ArchitectureValidator gates pipeline start");
}

function testVersionCompatibility() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const noVersion = {
    ...bp,
    meta: { ...bp.meta, schemaVersion: undefined as unknown as typeof bp.meta.schemaVersion },
  };
  const report = validateArchitectureAtPipelineStart(noVersion);
  assert.ok(
    report.violations.some((v) => v.invariantId === ArchitecturalInvariantId.VERSION_COMPATIBILITY),
  );
  console.log("✔ missing schemaVersion violates INV_14");
}

function run() {
  testInvariantCatalog();
  testValidBlueprintPasses();
  testPromptIsolationBlocksPipeline();
  testShadowStateViolatesSingleSource();
  testAgentIsolation();
  testLifecycleAuthority();
  testMutationSafety();
  testRecoverySafety();
  testVisionIndependence();
  testCompositeIsolation();
  testInvariantsCannotBeBypassedByRecovery();
  testArchitectureValidatorClass();
  testVersionCompatibility();
  console.log("\narchitecture-validator.spec.ts — all passed");
}

run();
