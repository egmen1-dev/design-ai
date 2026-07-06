/**
 * DAOS Kernel specs — Part 37
 * Run: npx tsx src/lib/kernel/kernel.spec.ts
 */
import assert from "node:assert/strict";
import { join } from "node:path";
import { Kernel } from "./Kernel";
import type { IPlatform } from "@/lib/platform-core/interfaces/IPlatform";

async function main() {
  const kernel = new Kernel({ configDir: join(process.cwd(), "config") });
  await kernel.initialize();

  assert.ok(kernel.getHealth().ready, "kernel ready after initialize");

  const platform: IPlatform = {
    id: "test-platform",
    version: "1.0.0",
    execute: ({ state }) => ({
      state: state.withData({ project: Object.freeze({ executed: true }) }),
    }),
  };
  kernel.registerPlatform(platform);

  const state = kernel.createProject({
    projectId: "p-k1",
    runId: "r-k1",
    marketplace: "wildberries",
    product: "test",
    generationMode: "standard",
    architectureVersion: "2.0",
    runtimeVersion: "KernelV1",
    provider: "Flux",
    userPreferences: Object.freeze({}),
  });

  const result = await kernel.execute({ state, platformId: "test-platform" });
  assert.equal(result.platformId, "test-platform");
  assert.ok(result.state.data.project.executed);

  assert.ok(kernel.events.count() >= 3, "events recorded");
  assert.equal(kernel.metrics.getCounter("executions"), 1);

  await kernel.shutdown();
  assert.equal(kernel.getHealth().phase, "stopped");

  console.log("✓ Kernel initialize / createProject / execute / shutdown");
  console.log("\nDAOS Kernel: all tests passed");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
