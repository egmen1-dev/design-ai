/**
 * DAOS Wave 10 — prompt context tests
 * Run: npx tsx src/lib/daos/tests/prompt-context.test.ts
 */
import assert from "node:assert/strict";
import { createProjectState, updateProjectState } from "../core/project-state";
import { createDaosPipelineContext } from "../pipeline/daos-pipeline-context";
import {
  createDaosPromptContextBlock,
  createDaosPromptContextSummary,
  DAOS_PROMPT_CONTEXT_MAX_LENGTH,
  isDaosPromptContextEnabled,
} from "../pipeline/daos-prompt-context";
import { analyzeDaosMeaningLoss } from "../debug/daos-meaning-loss";
import type {
  CommercialSpec,
  CreativeSpec,
  KnowledgeSpec,
  RenderBlueprint,
  VisualBlueprint,
} from "../contracts/specs";

const PROJECT_ID = "proj-wave10";

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

const emptyBlock = createDaosPromptContextBlock(
  createDaosPipelineContext(createProjectState({ projectId: PROJECT_ID, runId: "run-empty" })),
);
assert.equal(emptyBlock, "");
console.log("✓ empty context → empty block");

const fullState = updateProjectState(createProjectState({ projectId: PROJECT_ID, runId: "run-full" }), {
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
});

const fullContext = createDaosPipelineContext(fullState);

const fullBlock = createDaosPromptContextBlock(fullContext);
assert.ok(fullBlock.includes("Commercial goal"));
assert.ok(fullBlock.includes("Creative concept"));
assert.ok(fullBlock.includes("Visual scene"));
assert.ok(fullBlock.includes("Render strategy"));
assert.ok(fullBlock.length <= DAOS_PROMPT_CONTEXT_MAX_LENGTH);
console.log("✓ full context contains spec lines and respects max length");

const longCommercial = makeSpec<CommercialSpec>({
  id: "c-long",
  mainMessage: "x".repeat(2000),
  usp: ["y".repeat(500)],
  buyerPainPoints: [],
  trustDrivers: [],
  hierarchy: [],
});
const longBlock = createDaosPromptContextBlock(
  createDaosPipelineContext(
    updateProjectState(createProjectState({ projectId: PROJECT_ID, runId: "run-long" }), {
      commercialSpec: longCommercial,
      creativeSpec: makeSpec<CreativeSpec>({
        id: "cr-long",
        concept: "z".repeat(500),
        visualHook: "hook",
        mood: "m",
      }),
    }),
  ),
);
assert.ok(longBlock.length <= DAOS_PROMPT_CONTEXT_MAX_LENGTH);
console.log("✓ block length <= 1200");

withEnv({ DAOS_PROMPT_CONTEXT: undefined }, () => {
  assert.equal(isDaosPromptContextEnabled(), false);
});
withEnv({ DAOS_PROMPT_CONTEXT: "1" }, () => {
  assert.equal(isDaosPromptContextEnabled(), true);
});
console.log("✓ env flag off by default");

const summary = createDaosPromptContextSummary(fullContext, {
  enabled: true,
  injected: true,
  block: fullBlock,
});
assert.equal(summary.enabled, true);
assert.equal(summary.injected, true);
assert.equal(summary.length, fullBlock.length);
assert.equal(summary.preview, fullBlock);
console.log("✓ diagnostics summary fields");

const notInjectedLoss = analyzeDaosMeaningLoss(fullState, {
  promptContextEnabled: true,
  promptContextInjected: false,
});
assert.ok(notInjectedLoss.promptContextLoss.some((w) => w.code === "DAOS_CONTEXT_NOT_INJECTED"));
console.log("✓ meaning-loss DAOS_CONTEXT_NOT_INJECTED");

console.log("\nDAOS Wave 10 prompt-context: all tests passed");
