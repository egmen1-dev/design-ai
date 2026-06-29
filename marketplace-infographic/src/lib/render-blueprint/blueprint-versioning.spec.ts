/**
 * DESIGN AI v18 — Blueprint Versioning tests (Chapter 3.13)
 */

import assert from "node:assert/strict";
import {
  createEmptyRenderBlueprint,
  parseBlueprintVersion,
  formatBlueprintVersion,
  compareBlueprintVersions,
  evaluateCompatibility,
  CompatibilityStatus,
  readBlueprintSchemaVersion,
  CURRENT_BLUEPRINT_SCHEMA,
  CURRENT_PIPELINE_VERSION,
  runMigrationChain,
  BLUEPRINT_MIGRATION_CHAIN,
  migrateBlueprint,
  buildVersionManifest,
  validateCompatibility,
  prepareBlueprintForPipeline,
  assertPipelineCompatible,
  createVersionReport,
  VersionEngineError,
  AgentRegistry,
  registrationFromAgent,
  storyDirectorAgent,
} from "./index";

function testSemVerParseAndCompare() {
  const v = parseBlueprintVersion("1.2.0");
  assert.deepEqual(v, { major: 1, minor: 2, patch: 0 });
  assert.equal(formatBlueprintVersion(v), "1.2.0");
  assert.equal(compareBlueprintVersions("1.0.0", "1.2.0"), -2);
  assert.equal(compareBlueprintVersions("1.1.0", "1.2.0"), -1);
  assert.equal(compareBlueprintVersions("2.0.0", "1.2.0"), 1);
  console.log("✔ SemVer parse, format, compare");
}

function testCompatibilityMatrix() {
  assert.equal(evaluateCompatibility("1.2.0", "1.2.0"), CompatibilityStatus.NATIVE);
  assert.equal(evaluateCompatibility("1.1.0", "1.2.0"), CompatibilityStatus.MIGRATION);
  assert.equal(evaluateCompatibility("1.0.0", "1.2.0"), CompatibilityStatus.MIGRATION);
  assert.equal(evaluateCompatibility("2.0.0", "1.2.0"), CompatibilityStatus.UNSUPPORTED);
  console.log("✔ compatibility matrix");
}

function testMigrationChainNoSkipping() {
  assert.deepEqual(BLUEPRINT_MIGRATION_CHAIN, [
    { from: "1.0.0", to: "1.1.0" },
    { from: "1.1.0", to: "1.2.0" },
    { from: "1.2.0", to: "2.0.0" },
  ]);

  const legacy = {
    meta: { version: 17, id: "x", revision: 0 },
    environment: "kitchen",
    product: { category: "x" },
    constraints: { noText: true },
  };

  const result = runMigrationChain(legacy);
  assert.equal(result.toVersion, CURRENT_BLUEPRINT_SCHEMA);
  assert.equal(result.chain.length, 3);
  assert.equal(result.chain[0].from, "1.0.0");
  assert.equal(result.chain[2].to, "2.0.0");
  assert.ok(result.blueprint.scene);
  assert.equal((result.blueprint.scene as { environment: string }).environment, "kitchen");
  console.log("✔ migration chain upgrades step-by-step without skipping");
}

function testDowngradeForbidden() {
  const bp = createEmptyRenderBlueprint({ seed: 1, category: "x" });
  assert.throws(
    () => runMigrationChain(bp as unknown as Record<string, unknown>, {}, "1.0.0"),
    /Downgrade forbidden/,
  );
  console.log("✔ downgrade forbidden");
}

function testNewBlueprintHasSchemaVersion() {
  const bp = createEmptyRenderBlueprint({ seed: 2, category: "electronics" });
  assert.equal(bp.meta.schemaVersion, CURRENT_BLUEPRINT_SCHEMA);
  assert.equal(readBlueprintSchemaVersion(bp as unknown as Record<string, unknown>), "2.0.0");
  console.log("✔ new blueprint carries schemaVersion");
}

function testVersionManifest() {
  const registry = new AgentRegistry();
  registry.register(registrationFromAgent(storyDirectorAgent));
  const bp = createEmptyRenderBlueprint({ seed: 3, category: "x" });
  const manifest = buildVersionManifest({
    blueprint: bp,
    pipelineVersion: CURRENT_PIPELINE_VERSION,
    agents: { "story-director": storyDirectorAgent.version },
    adapterVersion: "3.11.0",
  });
  assert.equal(manifest.blueprint, "2.0.0");
  assert.equal(manifest.pipeline, CURRENT_PIPELINE_VERSION);
  assert.equal(manifest.agents["story-director"], storyDirectorAgent.version);
  console.log("✔ version manifest captures blueprint, pipeline, agents, adapter");
}

function testValidateCompatibilityBlocksUnsupported() {
  const future = {
    meta: { schemaVersion: "3.0.0", version: 99 },
  };
  const result = validateCompatibility({ blueprint: future, pipelineVersion: "2.0.0" });
  assert.equal(result.ok, false);
  assert.equal(result.blueprint.status, CompatibilityStatus.UNSUPPORTED);
  console.log("✔ compatibility validation blocks unsupported blueprint");
}

function testPrepareBlueprintForPipeline() {
  const legacy = {
    meta: { version: 17, id: "legacy" },
    environment: "studio",
    constraints: { noText: true },
  };
  const prepared = prepareBlueprintForPipeline(legacy, {}, { pipelineVersion: "2.0.0" });
  assert.equal(prepared.report.migrationChain.length, 3);
  assert.equal(prepared.report.compatibility, CompatibilityStatus.NATIVE);
  assert.equal(readBlueprintSchemaVersion(prepared.blueprint), "2.0.0");
  console.log("✔ prepareBlueprintForPipeline migrates then validates");
}

function testAssertPipelineCompatible() {
  const bp = createEmptyRenderBlueprint({ seed: 4, category: "x" });
  assert.doesNotThrow(() => assertPipelineCompatible(bp as unknown as Record<string, unknown>));
  assert.throws(
    () => assertPipelineCompatible({ meta: { schemaVersion: "3.0.0" } }),
    VersionEngineError,
  );
  console.log("✔ assertPipelineCompatible guards pipeline start");
}

function testVersionReportIncludesMigrationChain() {
  const legacy = { meta: { version: 17 }, environment: "garden" };
  const migrated = runMigrationChain(legacy);
  const report = createVersionReport({
    manifest: buildVersionManifest({ blueprint: migrated.blueprint }),
    migrationChain: migrated.chain,
    compatibility: CompatibilityStatus.NATIVE,
  });
  assert.equal(report.blueprint, "2.0.0");
  assert.equal(report.migrationChain.length, 3);
  console.log("✔ version report includes migration chain");
}

function main() {
  testSemVerParseAndCompare();
  testCompatibilityMatrix();
  testMigrationChainNoSkipping();
  testDowngradeForbidden();
  testNewBlueprintHasSchemaVersion();
  testVersionManifest();
  testValidateCompatibilityBlocksUnsupported();
  testPrepareBlueprintForPipeline();
  testAssertPipelineCompatible();
  testVersionReportIncludesMigrationChain();
  console.log("\nblueprint-versioning.spec.ts — all passed");
}

main();
