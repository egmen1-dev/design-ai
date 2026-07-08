/**
 * DAOS Wave 9 — pipeline context tests
 * Run: npx tsx src/lib/daos/tests/pipeline-context.test.ts
 */
import assert from "node:assert/strict";
import { createProjectState, updateProjectState } from "../core/project-state";
import {
  createDaosPipelineContext,
  summarizeDaosPipelineContext,
} from "../pipeline/daos-pipeline-context";
import { analyzeDaosMeaningLoss } from "../debug/daos-meaning-loss";
import type {
  CommercialSpec,
  CreativeSpec,
  KnowledgeSpec,
  RenderBlueprint,
  VisualBlueprint,
} from "../contracts/specs";

const PROJECT_ID = "proj-wave9";

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

const knowledge = makeSpec<KnowledgeSpec>({ id: "k1", patterns: ["p1"] });
const commercial = makeSpec<CommercialSpec>({
  id: "c1",
  mainMessage: "msg",
  usp: [],
  buyerPainPoints: [],
  trustDrivers: [],
  hierarchy: [],
});
const creative = makeSpec<CreativeSpec>({
  id: "cr1",
  concept: "c",
  visualHook: "hook",
  mood: "m",
});
const visual = makeSpec<VisualBlueprint>({
  id: "v1",
  scene: "studio",
  composition: "hero",
  lighting: "soft",
});
const render = makeSpec<RenderBlueprint>({
  id: "r1",
  renderStrategy: "hybrid_shadow_scene",
  promptAllowedOnlyInAdapter: true,
});

const fullState = updateProjectState(createProjectState({ projectId: PROJECT_ID, runId: "run-full" }), {
  knowledgeSpec: knowledge,
  commercialSpec: commercial,
  creativeSpec: creative,
  visualBlueprint: visual,
  renderBlueprint: render,
});

const fullContext = createDaosPipelineContext(fullState);
assert.equal(fullContext.completenessScore, 100);
assert.deepEqual(fullContext.missingSpecs, []);
console.log("✓ full state → score 100");

const emptyContext = createDaosPipelineContext(
  createProjectState({ projectId: PROJECT_ID, runId: "run-empty" }),
);
assert.equal(emptyContext.completenessScore, 0);
assert.equal(emptyContext.missingSpecs.length, 5);
console.log("✓ empty state → missing specs");

const partialContext = createDaosPipelineContext(
  updateProjectState(createProjectState({ projectId: PROJECT_ID, runId: "run-partial" }), {
    knowledgeSpec: knowledge,
    commercialSpec: commercial,
    creativeSpec: creative,
  }),
);
assert.equal(partialContext.completenessScore, 60);
assert.ok(partialContext.warnings.length > 0);
const partialLoss = analyzeDaosMeaningLoss(
  updateProjectState(createProjectState({ projectId: PROJECT_ID, runId: "run-partial" }), {
    knowledgeSpec: knowledge,
    commercialSpec: commercial,
    creativeSpec: creative,
  }),
  { generationMode: "balanced" },
);
assert.ok(partialLoss.pipelineContextLoss.some((w) => w.code === "PIPELINE_CONTEXT_INCOMPLETE"));
console.log("✓ incomplete state → warnings");

const premiumIncomplete = analyzeDaosMeaningLoss(
  updateProjectState(createProjectState({ projectId: PROJECT_ID, runId: "run-premium" }), {
    knowledgeSpec: knowledge,
  }),
  { generationMode: "premium" },
);
assert.ok(
  premiumIncomplete.pipelineContextLoss.some(
    (w) => w.code === "PIPELINE_CONTEXT_INCOMPLETE" && w.severity === "critical",
  ),
);
console.log("✓ premium incomplete escalates to critical");

const summary = summarizeDaosPipelineContext(partialContext);
assert.equal(summary.specsPresent.length, 3);
assert.ok(summary.missingSpecs.includes("visualBlueprint"));
console.log("✓ summarizeDaosPipelineContext");

console.log("\nDAOS Wave 9 pipeline-context: all tests passed");
