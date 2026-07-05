/**
 * Platform Core specs — Part 28
 * Run: npx tsx src/lib/platform-core/platform-core.spec.ts
 */
import assert from "node:assert/strict";
import { join } from "node:path";
import { PlatformCore } from "./index";
import type { IPlatform } from "./interfaces/IPlatform";
import { createExecutionContext } from "./execution/ExecutionContext";
import { assertNoLegacyInRuntime } from "./validation/boundaries";

const CONFIG_DIR = join(process.cwd(), "config");

function testProjectStateImmutable() {
  const core = new PlatformCore();
  const state = core.createProjectState({
    projectId: "p1",
    runId: "r1",
    marketplace: "wildberries",
    product: "generator",
    generationMode: "standard",
    architectureVersion: "2.0",
    runtimeVersion: "RuntimeV2",
    provider: "Flux",
    userPreferences: Object.freeze({}),
  });

  assert.equal(state.version, 1);
  const next = state.withData({ project: Object.freeze({ step: "knowledge" }) });
  assert.equal(next.version, 2);
  assert.notEqual(state.data.project, next.data.project);
  assert.throws(() => {
    (state as { version: number }).version = 99;
  });
  console.log("✓ ProjectState immutable");
}

function testRegistryRegistersAndResolves() {
  const core = new PlatformCore();
  const platform: IPlatform = {
    id: "knowledge",
    version: "1.0.0",
    execute: ({ state }) => ({ state }),
  };
  core.registry.platforms.register("knowledge", platform);
  assert.ok(core.registry.platforms.has("knowledge"));
  const resolved = core.resolvePlatform("knowledge");
  assert.equal(resolved.id, "knowledge");
  console.log("✓ Registry registers and resolves platform");
}

function testConfigurationLoaded() {
  const core = new PlatformCore({ configDir: CONFIG_DIR });
  assert.ok(core.configuration.has("runtime"));
  assert.ok(core.configuration.has("providers"));
  const runtime = core.configuration.get("runtime");
  assert.equal((runtime.runtime as { id: string }).id, "RuntimeV2");
  console.log("✓ Configuration loaded");
}

function testVersionsIncrement() {
  const core = new PlatformCore();
  assert.equal(core.versions.get("platform", "commercial"), 0);
  const record = core.versions.increment("platform", "commercial");
  assert.equal(record.version, 1);
  assert.equal(core.versions.get("platform", "commercial"), 1);
  console.log("✓ Versions increment");
}

async function testRuntimeReceivesProjectState() {
  const core = new PlatformCore();
  let received = false;
  const platform: IPlatform = {
    id: "commercial",
    version: "2.0.0",
    execute: ({ state }) => {
      received = true;
      return {
        state: state.withData({
          contracts: Object.freeze({ CommercialSpec: { strategy: "trust" } }),
        }),
      };
    },
  };
  core.registry.platforms.register("commercial", platform);
  const initial = core.createProjectState({
    projectId: "p2",
    runId: "r2",
    marketplace: "ozon",
    product: "kettle",
    generationMode: "enterprise",
    architectureVersion: "2.0",
    runtimeVersion: "RuntimeV2",
    provider: "Flux",
    userPreferences: Object.freeze({}),
  });
  const ctx = createExecutionContext(initial, "trace-1");
  const platformImpl = core.resolvePlatform("commercial");
  const result = await platformImpl.execute({ state: ctx.state });
  assert.ok(received);
  assert.ok(result.state.data.contracts.CommercialSpec);
  console.log("✓ Runtime integration: platform executes and updates ProjectState");
}

function testArchitectureBoundaries() {
  assert.throws(() => assertNoLegacyInRuntime("src/lib/runtime/legacy/adapter.ts"));
  console.log("✓ Architecture boundary: no legacy in runtime");
}

async function main() {
  testProjectStateImmutable();
  testRegistryRegistersAndResolves();
  testConfigurationLoaded();
  testVersionsIncrement();
  await testRuntimeReceivesProjectState();
  testArchitectureBoundaries();
  console.log("\nPlatform Core: all tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
