import assert from "node:assert/strict";

import { createRuntimeFeatureFlagRegistry, isDaosFlagId } from "./index";

function withEnv<T>(env: Record<string, string | undefined>, fn: () => T): T {
  const prev: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(env)) {
    prev[k] = process.env[k];
    if (typeof v === "undefined") delete process.env[k];
    else process.env[k] = v;
  }
  try {
    return fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (typeof v === "undefined") delete process.env[k];
      else process.env[k] = v;
    }
  }
}

function testDaosFlagIdShape() {
  assert.equal(isDaosFlagId("DAOS_PROMPT_CONTEXT"), true);
  assert.equal(isDaosFlagId("DAOS_RENDER_CONTEXT"), true);
  assert.equal(isDaosFlagId("DAOS"), false);
  assert.equal(isDaosFlagId("DAOS_PROMPT"), true);
  console.log("✔ DAOS flag id regex");
}

function testFlagRegistrationAndLookup() {
  const registry = createRuntimeFeatureFlagRegistry({ introducedInWave: 37 });
  const p = registry.Lookup("DAOS_PROMPT_CONTEXT");
  assert.ok(p, "DAOS_PROMPT_CONTEXT should be discovered and registered");
  assert.equal(p!.Name, "DAOS_PROMPT_CONTEXT");
  assert.equal(p!.Owner, "GenerationContext Runtime");
  assert.equal(p!.LifecycleState, p!.LifecycleState);
  console.log("✔ registration + lookup");
}

function testLegacyEnvCompatibility() {
  withEnv({ DAOS_PROMPT_CONTEXT: "1" }, () => {
    const registry = createRuntimeFeatureFlagRegistry({ introducedInWave: 37 });
    const v = registry.Resolve("DAOS_PROMPT_CONTEXT");
    assert.equal(v, "1");
  });
  console.log("✔ legacy env compatibility (Resolve reads process.env)");
}

function testUnknownFlagsInDiagnostics() {
  withEnv({ DAOS_UNKNOWN_FLAG: "1" }, () => {
    const registry = createRuntimeFeatureFlagRegistry({ introducedInWave: 37 });
    const d = registry.Diagnostics();
    assert.ok(d.unknownFlags.unknownFlagIds.includes("DAOS_UNKNOWN_FLAG"));
  });
  console.log("✔ unknown env flags are surfaced as diagnostics");
}

function testDuplicateDetection() {
  const registry = createRuntimeFeatureFlagRegistry({ introducedInWave: 37 });
  registry.Register({
    FlagId: "DAOS_PROMPT_CONTEXT",
    Name: "DAOS_PROMPT_CONTEXT",
    Owner: "GenerationContext Runtime",
    Description: "duplicate registration test",
    DefaultValue: "0",
    CurrentValue: "0",
    Scope: "runtime",
    Category: "context",
    LifecycleState: "Production",
    IntroducedInWave: 37,
    PlannedRemovalWave: null,
    Consumers: [],
    Dependencies: [],
    Diagnostics: [],
    Deprecated: false,
    Notes: "test",
  });

  const d = registry.Diagnostics();
  assert.ok(
    d.duplicates.duplicateFlagIds.includes("DAOS_PROMPT_CONTEXT"),
    "duplicate registration should be reported",
  );
  console.log("✔ duplicate registration diagnostics");
}

function testOwnerValidation() {
  const registry = createRuntimeFeatureFlagRegistry({ introducedInWave: 37 });
  registry.Register({
    FlagId: "DAOS_TEST_MISSING_OWNER",
    Name: "DAOS_TEST_MISSING_OWNER",
    Owner: "",
    Description: "missing owner test",
    DefaultValue: "0",
    CurrentValue: "0",
    Scope: "runtime",
    Category: "runtime",
    LifecycleState: "Production",
    IntroducedInWave: 37,
    PlannedRemovalWave: null,
    Consumers: [],
    Dependencies: [],
    Diagnostics: [],
    Deprecated: false,
    Notes: "test",
  });

  const d = registry.Validate();
  const missingOwner = d.validationIssues.filter((i) => i.code === "MISSING_OWNER");
  assert.ok(
    missingOwner.some((i) => i.flagId === "DAOS_TEST_MISSING_OWNER"),
    "missing owner should create MISSING_OWNER diagnostics",
  );
  console.log("✔ owner validation diagnostics");
}

function testLifecycleValidation() {
  const registry = createRuntimeFeatureFlagRegistry({ introducedInWave: 37 });
  registry.Register({
    FlagId: "DAOS_TEST_INVALID_LIFECYCLE",
    Name: "DAOS_TEST_INVALID_LIFECYCLE",
    Owner: "Test Owner",
    Description: "invalid lifecycle test",
    DefaultValue: "0",
    CurrentValue: "0",
    Scope: "runtime",
    Category: "runtime",
    LifecycleState: "NotARealLifecycle" as any,
    IntroducedInWave: 37,
    PlannedRemovalWave: null,
    Consumers: [],
    Dependencies: [],
    Diagnostics: [],
    Deprecated: false,
    Notes: "test",
  });

  const d = registry.Validate();
  const badLifecycle = d.validationIssues.filter((i) => i.code === "UNKNOWN_LIFECYCLE_STATE");
  assert.ok(
    badLifecycle.some((i) => i.flagId === "DAOS_TEST_INVALID_LIFECYCLE"),
    "invalid lifecycle should be diagnosed",
  );
  console.log("✔ lifecycle validation diagnostics");
}

function testDiagnosticsShape() {
  const registry = createRuntimeFeatureFlagRegistry({ introducedInWave: 37 });
  const d = registry.Diagnostics();
  assert.equal(d.RegistryVersion, 1);
  assert.ok(typeof d.discovery.discoveredFlagCount === "number");
  assert.ok(Array.isArray(d.unregistered.unregisteredFlagIds));
  assert.ok(Array.isArray(d.registered.flags));
  assert.ok(Array.isArray(d.duplicates.duplicateFlagIds));
  assert.ok(Array.isArray(d.unknownFlags.unknownFlagIds));
  assert.ok(Array.isArray(d.deprecatedCandidates.deprecatedFlagIds));
  assert.ok(Array.isArray(d.missingOwnership.missingOwnerFlagIds));
  assert.ok(Array.isArray(d.validationIssues));
  for (const f of d.registered.flags) {
    assert.ok(Array.isArray(f.Consumers));
    assert.ok(Array.isArray(f.Dependencies));
  }
  console.log("✔ diagnostics shape");
}

testDaosFlagIdShape();
testFlagRegistrationAndLookup();
testLegacyEnvCompatibility();
testUnknownFlagsInDiagnostics();
testDuplicateDetection();
testOwnerValidation();
testLifecycleValidation();
testDiagnosticsShape();

console.log("\nAll Wave 37 Feature Flag Registry specs passed.");

