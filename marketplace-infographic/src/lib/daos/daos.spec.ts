/**
 * DAOS Wave 1 foundation specs
 * Run: npx tsx src/lib/daos/daos.spec.ts
 */
import assert from "node:assert/strict";
import { join } from "node:path";
import { DaosCore } from "./core/DaosCore";
import { serializeSpecification, emptyResearchSpec } from "./contracts";
import { createTask } from "./runtime/Task";
import type { IPlatform } from "@/lib/platform-core/interfaces/IPlatform";

async function main() {
  const daos = new DaosCore({ configDir: join(process.cwd(), "config") });
  await daos.initialize();

  const state = daos.createProject({
    projectId: "wave1-p1",
    runId: "wave1-r1",
    marketplace: "wildberries",
    product: "test",
    generationMode: "standard",
    architectureVersion: "2.0",
    runtimeVersion: "DaosWave1",
    provider: "Flux",
    userPreferences: Object.freeze({}),
  });

  assert.equal(state.version, 1);
  const next = state.withData({ project: Object.freeze({ step: "knowledge" }) });
  assert.equal(next.version, 2);
  assert.throws(() => {
    (state as { version: number }).version = 99;
  });
  console.log("✓ ProjectState immutable");

  const spec = emptyResearchSpec({ query: "marketplace trends" });
  const json = serializeSpecification(spec);
  assert.ok(json.includes("ResearchSpec"));
  assert.deepEqual(JSON.parse(json).query, "marketplace trends");
  console.log("✓ Contracts serializable");

  const platform: IPlatform = {
    id: "research",
    version: "1.0.0",
    execute: ({ state: s }) => ({
      state: s.withData({ project: Object.freeze({ researched: true }) }),
    }),
  };
  daos.registerPlatform(platform);
  assert.ok(daos.registry.hasPlatform("research"));
  console.log("✓ Registry registers platform");

  assert.equal(daos.runtime.isEnabled(), false);
  daos.enableRuntime();
  assert.equal(daos.runtime.isEnabled(), true);

  const task = createTask({
    id: "t1",
    platformId: "research",
    state,
  });
  const result = await daos.runtime.executeTask(task);
  assert.equal(result.status, "completed");
  assert.ok(result.durationMs >= 0);
  console.log("✓ Runtime executes task when enabled");

  daos.disableRuntime();
  assert.equal(daos.runtime.isEnabled(), false);
  await assert.rejects(() => daos.runtime.executeTask(task), /disabled/);
  console.log("✓ Runtime rollback — disable uses legacy path");

  const passthrough = await daos.adapters.designPipeline.run(state);
  assert.equal(passthrough.version, state.version);
  console.log("✓ Legacy adapter pass-through without executor");

  await daos.shutdown();
  console.log("\nDAOS Wave 1: all tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
