/**
 * DAOS Wave 16 — v17 modules bridge tests
 * Run: npx tsx src/lib/daos/tests/v17-modules-bridge.test.ts
 */
import assert from "node:assert/strict";
import {
  attachDaosV17ModulesBridgeToPayload,
  createDaosV17ModulesBridgeBlock,
  DAOS_V17_MODULES_BRIDGE_MAX_LENGTH,
  isDaosV17ModulesBridgeEnabled,
} from "../adapters/v17-modules-bridge";
import { analyzeDaosMeaningLoss } from "../debug/daos-meaning-loss";
import { createProjectState } from "../core/project-state";
import type { CompiledRenderPayload, RenderRequest } from "@/lib/render-engine/types";

function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key];
    const value = vars[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(vars)) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

const baseRequest = {
  layout: {
    heroPosition: "right",
    whitespaceTarget: 28,
    heroZone: { x: 0.55, y: 0.2, width: 0.35, height: 0.6 },
    headlineZone: { x: 0.08, y: 0.1, width: 0.4, height: 0.15 },
    productPlacementPct: { cx: 62, cy: 54 },
    textSafeZones: [
      { purpose: "headline", left: 8, top: 10, width: 40, height: 14 },
      { purpose: "product", left: 50, top: 30, width: 42, height: 50 },
    ],
    palette: ["#111111"],
    maxColors: 4,
  },
  metadata: {
    daosContext: {
      completenessScore: 90,
      commercialGoal: "Professional torque drill",
      mainMessage: "Premium torque drill",
      creativeConcept: "Power in your hand",
      visualScene: "Industrial studio",
      renderStrategy: "hybrid_shadow_scene",
      missingSpecs: [],
      warnings: [],
    },
    visualBlueprint: {
      version: "2.0",
      composition: {
        heroPosition: "right",
        negativeSpace: "left",
        balance: "asymmetric_hero_right",
        visualWeight: { hero: 0.6, background: 0.25, headline: 0.15 },
        safeZones: [
          { purpose: "headline", left: 8, top: 10, width: 40, height: 14 },
          { purpose: "product", left: 50, top: 30, width: 42, height: 50 },
        ],
      },
    },
  },
  providerHints: {
    marketSnippet: "Wildberries electronics CTR optimized",
  },
} as unknown as RenderRequest;

const basePayload: CompiledRenderPayload = {
  model: "flux",
  prompt: "studio backdrop, empty foreground",
  width: 900,
  height: 1200,
  modulesUsed: ["scene"],
  modulesIgnored: ["layout_coordinates", "hierarchy", "typography_zones", "ctr_wording"],
};

withEnv({ DAOS_V17_MODULES_BRIDGE: undefined }, () => {
  assert.equal(isDaosV17ModulesBridgeEnabled(), false);
  const passthrough = attachDaosV17ModulesBridgeToPayload(basePayload, baseRequest);
  assert.equal(passthrough, basePayload);
  assert.equal(passthrough.prompt, basePayload.prompt);
});
console.log("✓ flag off does not change payload");

const { block, modulesCompiled } = createDaosV17ModulesBridgeBlock(baseRequest);
assert.ok(block.includes("DAOS V17 MODULES:"));
assert.ok(block.includes("[layout_coordinates]"));
assert.ok(block.includes("[hierarchy]"));
assert.ok(block.includes("[typography_zones]"));
assert.ok(block.includes("[ctr_wording]"));
assert.ok(block.length <= DAOS_V17_MODULES_BRIDGE_MAX_LENGTH);
assert.ok(modulesCompiled.includes("layout_coordinates"));
assert.ok(modulesCompiled.includes("hierarchy"));
console.log("✓ flag ON block adds sections within 700 chars");

withEnv({ DAOS_V17_MODULES_BRIDGE: "1" }, () => {
  assert.equal(isDaosV17ModulesBridgeEnabled(), true);
  const attached = attachDaosV17ModulesBridgeToPayload(basePayload, baseRequest);
  assert.notEqual(attached, basePayload);
  assert.equal(basePayload.prompt, "studio backdrop, empty foreground");
  assert.ok(attached.prompt.includes("DAOS V17 MODULES:"));
  assert.ok(attached.prompt.length > basePayload.prompt.length);
  assert.equal(attached.daosV17Modules?.applied, true);
  assert.ok((attached.daosV17Modules?.modulesCompiled?.length ?? 0) > 0);
  assert.ok((attached.daosV17Modules?.length ?? 0) > 0);

  const ignored = new Set(basePayload.modulesIgnored);
  const compiled = new Set(attached.daosV17Modules?.modulesCompiled ?? []);
  const expectedStillIgnored = [...ignored].filter((module) => !compiled.has(module));
  assert.deepEqual(attached.daosV17Modules?.modulesStillIgnored, expectedStillIgnored);
  assert.ok((attached.daosV17Modules?.modulesStillIgnored?.length ?? 4) < ignored.size);
  console.log("✓ modulesCompiled and modulesStillIgnored computed honestly");

  const meaningApplied = analyzeDaosMeaningLoss(createProjectState({ projectId: "p", runId: "r" }), {
    daosV17ModulesBridgeEnabled: true,
    renderContextAttached: true,
    renderDebug: {
      createdAt: new Date().toISOString(),
      daosV17ModulesBridgeApplied: true,
      modulesIgnored: ["layout_coordinates", "hierarchy", "typography_zones", "ctr_wording"],
      daosV17ModulesCompiled: ["layout_coordinates", "hierarchy"],
      daosV17ModulesStillIgnored: ["typography_zones", "ctr_wording"],
    },
  });
  assert.ok(meaningApplied.warnings.some((w) => w.code === "DAOS_V17_MODULES_STILL_IGNORED"));

  const meaningMissing = analyzeDaosMeaningLoss(createProjectState({ projectId: "p", runId: "r" }), {
    daosV17ModulesBridgeEnabled: true,
    renderContextAttached: true,
    renderDebug: { createdAt: new Date().toISOString(), daosV17ModulesBridgeApplied: false },
  });
  assert.ok(meaningMissing.warnings.some((w) => w.code === "DAOS_V17_MODULES_BRIDGE_NOT_APPLIED"));
  console.log("✓ meaning-loss warnings for applied / not applied");
});

console.log("\nAll v17-modules-bridge tests passed.");
