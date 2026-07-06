/**
 * DAOS Wave 15 — v17 prompt bridge tests
 * Run: npx tsx src/lib/daos/tests/v17-prompt-bridge.test.ts
 */
import assert from "node:assert/strict";
import { createProjectState, updateProjectState } from "../core/project-state";
import { createDaosPipelineContext } from "../pipeline/daos-pipeline-context";
import {
  attachDaosV17PromptBridgeToPayload,
  createDaosV17PromptBridgeBlock,
  DAOS_V17_BRIDGE_MAX_LENGTH,
  isDaosV17PromptBridgeEnabled,
} from "../adapters/v17-prompt-bridge";
import { analyzeDaosMeaningLoss } from "../debug/daos-meaning-loss";
import type {
  CommercialSpec,
  CreativeSpec,
  KnowledgeSpec,
  RenderBlueprint,
  VisualBlueprint,
} from "../contracts/specs";
import type { CompiledRenderPayload } from "@/lib/render-engine/types";

const PROJECT_ID = "proj-wave15";

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

function makeSpec<T extends { id: string; projectId: string; decisionTrace: unknown[] }>(
  partial: Partial<T> & Pick<T, "id">,
): T {
  return {
    projectId: PROJECT_ID,
    version: 1,
    status: "draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    source: "test",
    decisionTrace: [
      {
        id: "t1",
        source: "test",
        decision: "d",
        reason: "r",
        confidence: 0.9,
        createdAt: new Date().toISOString(),
      },
    ],
    ...partial,
  } as T;
}

const emptyContext = createDaosPipelineContext(
  createProjectState({ projectId: PROJECT_ID, runId: "run-empty" }),
);
assert.equal(createDaosV17PromptBridgeBlock(emptyContext), "");
console.log("✓ bridge block empty for empty context");

const fullState = updateProjectState(
  createProjectState({ projectId: PROJECT_ID, runId: "run-full" }),
  {
    commercialSpec: makeSpec<CommercialSpec>({
      id: "c1",
      mainMessage: "Premium torque drill",
      usp: ["Professional torque", "65 Nm"],
      buyerPainPoints: [],
      trustDrivers: [],
      hierarchy: [],
    }),
    creativeSpec: makeSpec<CreativeSpec>({
      id: "cr1",
      concept: "Power in your hand",
      visualHook: "Macro grip",
      mood: "confidence",
    }),
    visualBlueprint: makeSpec<VisualBlueprint>({
      id: "v1",
      scene: "Industrial studio",
      composition: "hero_right",
      lighting: "rim light",
    }),
    renderBlueprint: makeSpec<RenderBlueprint>({
      id: "r1",
      renderStrategy: "hybrid_shadow_scene",
      promptAllowedOnlyInAdapter: true,
    }),
    knowledgeSpec: makeSpec<KnowledgeSpec>({ id: "k1", patterns: ["tools"] }),
  },
);
const fullContext = createDaosPipelineContext(fullState);
const fullBlock = createDaosV17PromptBridgeBlock(fullContext);
assert.ok(fullBlock.includes("Commercial goal"));
assert.ok(fullBlock.includes("Creative concept"));
assert.ok(fullBlock.includes("Visual scene"));
assert.ok(fullBlock.includes("Composition"));
assert.ok(fullBlock.includes("Render strategy"));
assert.ok(fullBlock.includes("layout_coordinates"));
assert.ok(fullBlock.length <= DAOS_V17_BRIDGE_MAX_LENGTH);
console.log("✓ bridge block contains commercial/creative/visual data");

const basePayload: CompiledRenderPayload = {
  model: "flux",
  prompt: "studio backdrop, empty foreground",
  width: 900,
  height: 1200,
  modulesUsed: ["scene"],
  modulesIgnored: ["layout_coordinates", "hierarchy", "typography_zones", "ctr_wording"],
};

withEnv({ DAOS_V17_PROMPT_BRIDGE: undefined }, () => {
  assert.equal(isDaosV17PromptBridgeEnabled(), false);
  const passthrough = attachDaosV17PromptBridgeToPayload(basePayload, fullContext);
  assert.equal(passthrough, basePayload);
  assert.equal(passthrough.prompt, basePayload.prompt);
});
console.log("✓ flag off does not change payload");

withEnv({ DAOS_V17_PROMPT_BRIDGE: "1" }, () => {
  assert.equal(isDaosV17PromptBridgeEnabled(), true);
  const attached = attachDaosV17PromptBridgeToPayload(basePayload, fullContext);
  assert.notEqual(attached, basePayload);
  assert.equal(basePayload.prompt, "studio backdrop, empty foreground");
  assert.ok(attached.prompt.includes("DAOS V17 CONTEXT:"));
  assert.ok(attached.prompt.length > basePayload.prompt.length);
  assert.equal(attached.daosV17Bridge?.applied, true);
  assert.ok((attached.daosV17Bridge?.length ?? 0) > 0);
  assert.ok((attached.daosV17Bridge?.modulesAddressed?.length ?? 0) > 0);
  console.log("✓ flag on appends bridge without mutating original");

  const meaningApplied = analyzeDaosMeaningLoss(fullState, {
    daosV17BridgeEnabled: true,
    renderContextAttached: true,
    renderDebug: {
      createdAt: new Date().toISOString(),
      daosV17BridgeApplied: true,
      modulesIgnored: ["layout_coordinates", "hierarchy"],
    },
  });
  assert.ok(
    meaningApplied.warnings.some((w) => w.code === "DAOS_V17_BRIDGE_APPLIED_WITH_IGNORED_MODULES"),
  );

  const meaningMissing = analyzeDaosMeaningLoss(fullState, {
    daosV17BridgeEnabled: true,
    renderContextAttached: true,
    renderDebug: { createdAt: new Date().toISOString(), daosV17BridgeApplied: false },
  });
  assert.ok(meaningMissing.warnings.some((w) => w.code === "DAOS_V17_BRIDGE_NOT_APPLIED"));
  console.log("✓ diagnostics reflect bridge applied / missing");
});

console.log("\nAll v17-prompt-bridge tests passed.");
