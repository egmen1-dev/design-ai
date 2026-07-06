/**
 * DAOS Wave 16/17 — v17 modules + CTR bridge tests
 * Run: npx tsx src/lib/daos/tests/v17-modules-bridge.test.ts
 */
import assert from "node:assert/strict";
import {
  attachDaosV17ModulesBridgeToPayload,
  compileCtrWordingSectionEnhanced,
  createDaosV17ModulesBridgeBlock,
  DAOS_V17_CTR_SECTION_MAX_LENGTH,
  DAOS_V17_MODULES_BRIDGE_MAX_LENGTH,
  isDaosV17CtrBridgeEnabled,
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

const baseLayout = {
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
};

const baseVisualBlueprint = {
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
};

function makeRequest(overrides: Partial<RenderRequest> = {}): RenderRequest {
  return {
    layout: baseLayout,
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
      visualBlueprint: baseVisualBlueprint,
      commercialSpec: {
        id: "c1",
        projectId: "p1",
        version: 1,
        status: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        source: "test",
        decisionTrace: [],
        mainMessage: "Premium torque drill",
        usp: ["65 Nm torque", "Ergonomic grip"],
        buyerPainPoints: [],
        trustDrivers: ["Professional grade build"],
        hierarchy: ["Premium torque drill", "65 Nm"],
      },
      ctrExpert: {
        score: 72,
        ctrPrediction: 68,
        wouldClick: true,
        confidence: 0.8,
        mainProblems: [],
        issues: ["Headline could be shorter"],
        recommendations: ["Lead with torque benefit"],
        corrections: [],
        layoutSpecPatch: {},
        scores: {
          clarity: 70,
          sellingPower: 72,
          attention: 68,
          emotion: 65,
          marketplaceFit: 74,
        },
        source: "heuristic",
      },
      seniorArtDirector: {
        score: 85,
        approved: true,
        confidence: 0.85,
        criticalProblems: [],
        issues: [],
        recommendations: ["Keep headline high contrast"],
        corrections: [],
        layoutSpecPatch: {},
        scores: {
          composition: 85,
          typography: 82,
          hierarchy: 80,
          balance: 84,
          minimalism: 78,
          modernLook: 83,
        },
        source: "heuristic",
      },
    },
    providerHints: {
      marketSnippet: "Wildberries electronics CTR optimized",
    },
    ...overrides,
  } as unknown as RenderRequest;
}

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
  const passthrough = attachDaosV17ModulesBridgeToPayload(basePayload, makeRequest());
  assert.equal(passthrough, basePayload);
  assert.equal(passthrough.prompt, basePayload.prompt);
});
console.log("✓ flag off does not change payload");

withEnv({ DAOS_V17_MODULES_BRIDGE: "1", DAOS_V17_CTR_BRIDGE: undefined }, () => {
  const { block, modulesCompiled } = createDaosV17ModulesBridgeBlock(makeRequest());
  assert.ok(block.includes("DAOS V17 MODULES:"));
  assert.ok(block.includes("[layout_coordinates]"));
  assert.ok(block.length <= DAOS_V17_MODULES_BRIDGE_MAX_LENGTH);
  assert.ok(modulesCompiled.includes("layout_coordinates"));
});
console.log("✓ modules bridge adds sections within 700 chars");

withEnv({ DAOS_V17_CTR_BRIDGE: "1" }, () => {
  assert.equal(isDaosV17CtrBridgeEnabled(), true);
  const ctrFromMain = compileCtrWordingSectionEnhanced(
    makeRequest({
      metadata: {
        daosContext: {
          completenessScore: 80,
          mainMessage: "Premium torque drill",
          missingSpecs: [],
          warnings: [],
        },
      },
      providerHints: {},
    } as unknown as Partial<RenderRequest>),
  );
  assert.ok(ctrFromMain);
  assert.ok(ctrFromMain!.section.includes("main message: Premium torque drill"));
  assert.ok(ctrFromMain!.source.includes("daosContext.mainMessage"));
  assert.ok(ctrFromMain!.length <= DAOS_V17_CTR_SECTION_MAX_LENGTH);
  console.log("✓ ctr source from daosContext.mainMessage");

  const ctrFromHook = compileCtrWordingSectionEnhanced(
    makeRequest({
      metadata: { daosContext: undefined },
      providerHints: { ctrHook: "Shop now for pro torque" },
    } as unknown as Partial<RenderRequest>),
  );
  assert.ok(ctrFromHook);
  assert.ok(ctrFromHook!.section.includes("click trigger: Shop now for pro torque"));
  assert.ok(ctrFromHook!.source.includes("providerHints.ctrHook"));
  console.log("✓ ctr source from providerHints.ctrHook");

  const ctrMissing = compileCtrWordingSectionEnhanced(
    makeRequest({
      metadata: {},
      providerHints: {},
    } as unknown as Partial<RenderRequest>),
  );
  assert.equal(ctrMissing, undefined);
  console.log("✓ no source leaves ctr_wording uncompiled");
});

withEnv({ DAOS_V17_MODULES_BRIDGE: "1", DAOS_V17_CTR_BRIDGE: "1" }, () => {
  const attached = attachDaosV17ModulesBridgeToPayload(basePayload, makeRequest());
  assert.notEqual(attached, basePayload);
  assert.ok(attached.prompt.includes("CTR wording intent:"));
  assert.equal(attached.daosV17Ctr?.applied, true);
  assert.ok((attached.daosV17Ctr?.length ?? 0) <= DAOS_V17_CTR_SECTION_MAX_LENGTH);
  assert.ok(attached.daosV17Modules?.modulesCompiled?.includes("ctr_wording"));
  assert.deepEqual(attached.daosV17Modules?.modulesStillIgnored, []);
  console.log("✓ full context compiles ctr_wording with modulesStillIgnored []");

  const meaningCtrIgnored = analyzeDaosMeaningLoss(createProjectState({ projectId: "p", runId: "r" }), {
    daosV17CtrBridgeEnabled: true,
    renderContextAttached: true,
    renderDebug: {
      createdAt: new Date().toISOString(),
      daosV17ModulesStillIgnored: ["ctr_wording"],
    },
  });
  assert.ok(meaningCtrIgnored.warnings.some((w) => w.code === "CTR_WORDING_STILL_IGNORED"));

  const meaningCtrMissing = analyzeDaosMeaningLoss(createProjectState({ projectId: "p", runId: "r" }), {
    daosV17CtrBridgeEnabled: true,
    renderContextAttached: true,
    renderDebug: { createdAt: new Date().toISOString(), daosV17CtrBridgeApplied: false },
  });
  assert.ok(meaningCtrMissing.warnings.some((w) => w.code === "DAOS_V17_CTR_BRIDGE_NOT_APPLIED"));
  console.log("✓ meaning-loss warnings for CTR applied / still ignored");
});

console.log("\nAll v17-modules-bridge tests passed.");
