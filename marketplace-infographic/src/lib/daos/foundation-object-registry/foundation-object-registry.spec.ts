import assert from "node:assert/strict";

import {
  createFoundationObjectRegistry,
  createFoundationObjectRegistryForTest,
  getBootstrapFoundationObjectDefinitions,
  resetFoundationObjectRegistryCacheForTest,
} from "./foundation-object-registry";
import type { FoundationObjectDefinition } from "./types";

function cloneBootstrap(): FoundationObjectDefinition[] {
  return structuredClone(getBootstrapFoundationObjectDefinitions());
}

function testRegistersExactlyThreeFoundationObjects() {
  resetFoundationObjectRegistryCacheForTest();
  const registry = createFoundationObjectRegistry();
  const list = registry.List();
  assert.equal(list.length, 3);
  const types = new Set(list.map((d) => d.ObjectType));
  assert.equal(types.size, 3);
  assert.ok(types.has("GenerationContext"));
  assert.ok(types.has("MetricValue"));
  assert.ok(types.has("FeatureFlag"));
  console.log("✔ registers exactly 3 foundation objects");
}

function testRejectsUnknownObjectType() {
  const defs = cloneBootstrap();
  defs[0] = { ...defs[0]!, ObjectType: "UnknownType" as FoundationObjectDefinition["ObjectType"] };
  const registry = createFoundationObjectRegistryForTest(defs);
  const d = registry.Validate();
  assert.ok(d.validationIssues.some((i) => i.code === "UNKNOWN_OBJECT_TYPE"));
  assert.equal(d.foundationRegistryHealthy, false);
  console.log("✔ rejects unknown object type");
}

function testDetectsDuplicateObjectId() {
  const defs = cloneBootstrap();
  const dup = structuredClone(defs[0]!);
  dup.ObjectType = "GenerationContext";
  dup.ObjectId = defs[0]!.ObjectId;
  dup.SchemaVersion = "1.1.0";
  defs.push(dup);
  const registry = createFoundationObjectRegistryForTest(defs);
  const d = registry.Validate();
  assert.ok(
    d.validationIssues.some((i) => i.code === "DUPLICATE_OBJECT_ID") ||
      d.duplicates.duplicateObjectIds.length > 0,
  );
  console.log("✔ detects duplicate object id conflict");
}

function testDetectsDuplicateSchemaVersion() {
  const defs = cloneBootstrap();
  defs.push(structuredClone(defs[0]!));
  const registry = createFoundationObjectRegistryForTest(defs);
  const d = registry.Validate();
  assert.ok(d.validationIssues.some((i) => i.code === "DUPLICATE_SCHEMA_VERSION"));
  assert.ok(d.duplicates.duplicateSchemaVersions.length > 0);
  console.log("✔ detects duplicate schema version");
}

function testValidatesMissingOwner() {
  const defs = cloneBootstrap();
  defs[0] = { ...defs[0]!, Owner: "" };
  const registry = createFoundationObjectRegistryForTest(defs);
  const d = registry.Validate();
  assert.ok(d.validationIssues.some((i) => i.code === "MISSING_OWNER"));
  assert.ok(d.missingOwners.objectIds.includes(defs[0]!.ObjectId));
  console.log("✔ validates missing owner");
}

function testValidatesMissingProducer() {
  const defs = cloneBootstrap();
  defs[1] = { ...defs[1]!, Producer: "" };
  const registry = createFoundationObjectRegistryForTest(defs);
  const d = registry.Validate();
  assert.ok(d.validationIssues.some((i) => i.code === "MISSING_PRODUCER"));
  assert.ok(d.missingProducers.objectIds.includes(defs[1]!.ObjectId));
  console.log("✔ validates missing producer");
}

function testValidatesInvalidSemver() {
  const defs = cloneBootstrap();
  defs[2] = { ...defs[2]!, SchemaVersion: "not-semver" };
  const registry = createFoundationObjectRegistryForTest(defs);
  const d = registry.Validate();
  assert.ok(d.validationIssues.some((i) => i.code === "INVALID_VERSION"));
  console.log("✔ validates invalid semver");
}

function testExposesDependencyGraph() {
  resetFoundationObjectRegistryCacheForTest();
  const registry = createFoundationObjectRegistry();
  const d = registry.Diagnostics();
  assert.equal(d.dependencyGraph.length, 3);
  const gc = d.dependencyGraph.find((e) => e.objectId === "FOUNDATION.GENERATION_CONTEXT");
  assert.ok(gc);
  assert.ok(gc!.producer.includes("build-generation-context.ts"));
  assert.ok(gc!.consumers.length >= 1);
  console.log("✔ exposes dependency graph");
}

function testListVersionsReturnsSemverDescOrder() {
  const defs = cloneBootstrap();
  defs.push({
    ...structuredClone(defs[2]!),
    SchemaVersion: "1.1.0",
  });
  defs.push({
    ...structuredClone(defs[2]!),
    SchemaVersion: "2.0.0",
  });
  const registry = createFoundationObjectRegistryForTest(defs);
  const versions = registry
    .ListVersions("FOUNDATION.GENERATION_CONTEXT")
    .map((d) => d.SchemaVersion);
  assert.deepEqual(versions, ["2.0.0", "1.1.0", "1.0.0"]);
  console.log("✔ ListVersions returns semver-desc order");
}

function testRegistryDoesNotExposeRuntimeMutation() {
  resetFoundationObjectRegistryCacheForTest();
  const registry = createFoundationObjectRegistry();
  assert.equal(typeof (registry as { Register?: unknown }).Register, "undefined");
  const before = registry.LookupById("FOUNDATION.METRIC_VALUE");
  assert.ok(before);
  const listBefore = registry.List().length;
  try {
    (registry as unknown as { registeredObjects?: unknown[] }).registeredObjects = [];
    assert.fail("registry should not expose mutable registration surface");
  } catch {
    // frozen / no such property — expected
  }
  assert.equal(registry.List().length, listBefore);
  assert.equal(registry.LookupById("FOUNDATION.METRIC_VALUE")!.Owner, before!.Owner);
  console.log("✔ registry does not expose runtime mutation");
}

function testDiagnosticsHealthyForBootstrapRegistry() {
  resetFoundationObjectRegistryCacheForTest();
  const registry = createFoundationObjectRegistry();
  const d = registry.Diagnostics();
  assert.equal(d.bootstrapComplete, true);
  assert.equal(d.registeredObjects.length, 3);
  assert.equal(d.objectStatistics.totalObjectTypes, 3);
  assert.ok(d.schemaVersions.length >= 3);
  assert.equal(d.foundationRegistryHealthy, true, JSON.stringify(d.validationIssues, null, 2));
  console.log("✔ diagnostics healthy for bootstrap registry");
}

function testLookupApis() {
  resetFoundationObjectRegistryCacheForTest();
  const registry = createFoundationObjectRegistry();
  const byType = registry.Lookup("FeatureFlag");
  assert.equal(byType?.ObjectId, "FOUNDATION.FEATURE_FLAG");
  assert.equal(byType?.Owner, "Feature Flag Registry");

  const byId = registry.LookupById("FOUNDATION.METRIC_VALUE");
  assert.equal(byId?.Owner, "Metric Registry");

  const byVersion = registry.LookupVersion("FOUNDATION.GENERATION_CONTEXT", "1.0.0");
  assert.equal(byVersion?.Owner, "GenerationContext");
  console.log("✔ Lookup / LookupById / LookupVersion");
}

function main() {
  testRegistersExactlyThreeFoundationObjects();
  testRejectsUnknownObjectType();
  testDetectsDuplicateObjectId();
  testDetectsDuplicateSchemaVersion();
  testValidatesMissingOwner();
  testValidatesMissingProducer();
  testValidatesInvalidSemver();
  testExposesDependencyGraph();
  testListVersionsReturnsSemverDescOrder();
  testRegistryDoesNotExposeRuntimeMutation();
  testDiagnosticsHealthyForBootstrapRegistry();
  testLookupApis();
  console.log("\nAll foundation-object-registry specs passed.");
}

main();
