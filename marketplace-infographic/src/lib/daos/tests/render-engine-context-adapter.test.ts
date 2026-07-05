/**
 * DAOS Wave 11 — render engine context adapter tests
 * Run: npx tsx src/lib/daos/tests/render-engine-context-adapter.test.ts
 */
import assert from "node:assert/strict";
import { createProjectState, updateProjectState } from "../core/project-state";
import { createDaosPipelineContext } from "../pipeline/daos-pipeline-context";
import {
  attachDaosContextToRenderInput,
  createDaosRenderEngineContext,
  isDaosRenderContextAttached,
  isDaosRenderContextEnabled,
} from "../adapters/render-engine-context-adapter";
import { analyzeDaosMeaningLoss } from "../debug/daos-meaning-loss";
import type {
  CommercialSpec,
  CreativeSpec,
  KnowledgeSpec,
  RenderBlueprint,
  VisualBlueprint,
} from "../contracts/specs";

const PROJECT_ID = "proj-wave11";

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

const fullState = updateProjectState(
  createProjectState({ projectId: PROJECT_ID, runId: "run-full" }),
  {
    commercialSpec: makeSpec<CommercialSpec>({
      id: "c1",
      mainMessage: "Premium torque drill",
      usp: ["Professional torque"],
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

const pipelineContext = createDaosPipelineContext(fullState);
const summary = createDaosRenderEngineContext(pipelineContext);

assert.equal(summary.mainMessage, "Premium torque drill");
assert.equal(summary.creativeConcept, "Power in your hand");
assert.equal(summary.visualScene, "Industrial studio");
assert.equal(summary.renderStrategy, "hybrid_shadow_scene");
assert.ok(summary.completenessScore >= 60);
console.log("✓ createDaosRenderEngineContext builds summary");

const baseInput = {
  analysis: { category: "tools" },
  scenePlan: { sceneType: "studio" },
  variationSeed: "seed-1",
  seedSuffix: "primary",
};

withEnv({ DAOS_RENDER_CONTEXT: undefined }, () => {
  assert.equal(isDaosRenderContextEnabled(), false);
  const passthrough = attachDaosContextToRenderInput(baseInput, pipelineContext);
  assert.equal(passthrough, baseInput);
  assert.equal(isDaosRenderContextAttached(passthrough), false);
});
console.log("✓ env off → input unchanged");

withEnv({ DAOS_RENDER_CONTEXT: "1" }, () => {
  assert.equal(isDaosRenderContextEnabled(), true);

  const attached = attachDaosContextToRenderInput(baseInput, pipelineContext);
  assert.notEqual(attached, baseInput);
  assert.equal(isDaosRenderContextAttached(attached), true);
  assert.deepEqual((attached as { daosContext: typeof summary }).daosContext, summary);
  assert.equal((baseInput as { daosContext?: unknown }).daosContext, undefined);
  console.log("✓ object input returns cloned object with daosContext");

  const withMetadata = attachDaosContextToRenderInput(
    { ...baseInput, metadata: { requestId: "req-1" } },
    pipelineContext,
  ) as { metadata: { requestId: string; daosContext: typeof summary } };
  assert.equal(withMetadata.metadata.requestId, "req-1");
  assert.deepEqual(withMetadata.metadata.daosContext, summary);
  console.log("✓ metadata branch attaches daosContext");

  assert.equal(attachDaosContextToRenderInput(null, pipelineContext), null);
  assert.equal(attachDaosContextToRenderInput("plain", pipelineContext), "plain");
  console.log("✓ non-object input safe");
});

const meaningLossAttached = analyzeDaosMeaningLoss(fullState, {
  renderContextEnabled: true,
  renderContextAttached: true,
  useRenderEngineV17: true,
});
assert.ok(
  !meaningLossAttached.warnings.some((w) => w.code === "DAOS_RENDER_CONTEXT_NOT_ATTACHED"),
);
console.log("✓ diagnostics-compatible when attached");

const meaningLossMissing = analyzeDaosMeaningLoss(fullState, {
  renderContextEnabled: true,
  renderContextAttached: false,
  useRenderEngineV17: true,
});
assert.ok(
  meaningLossMissing.warnings.some((w) => w.code === "DAOS_RENDER_CONTEXT_NOT_ATTACHED"),
);
console.log("✓ meaning-loss warns when not attached");

console.log("\nAll render-engine-context-adapter tests passed.");
