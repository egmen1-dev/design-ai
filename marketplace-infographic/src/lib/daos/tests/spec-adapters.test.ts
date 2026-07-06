/**
 * DAOS Wave 2 — spec adapter tests
 * Run: npx tsx src/lib/daos/tests/spec-adapters.test.ts
 */
import assert from "node:assert/strict";
import {
  adaptCommercialSpec,
  adaptCreativeSpec,
  adaptKnowledgeSpec,
  adaptRenderBlueprint,
  adaptVisualBlueprint,
} from "../adapters/spec-adapters";

const PROJECT_ID = "test-project";

function assertBaseSpec(spec: { id: string; projectId: string; decisionTrace: unknown[] }) {
  assert.ok(spec.id);
  assert.equal(spec.projectId, PROJECT_ID);
  assert.ok(Array.isArray(spec.decisionTrace));
  assert.ok(spec.decisionTrace.length > 0);
}

// Empty input must not throw
const emptyKnowledge = adaptKnowledgeSpec(null, PROJECT_ID);
assertBaseSpec(emptyKnowledge);
assert.ok(Array.isArray(emptyKnowledge.patterns));
assert.ok((emptyKnowledge.confidence?.score ?? 1) < 0.5);
console.log("✓ adaptKnowledgeSpec empty input");

const emptyCommercial = adaptCommercialSpec({}, PROJECT_ID);
assertBaseSpec(emptyCommercial);
assert.ok(emptyCommercial.mainMessage);
console.log("✓ adaptCommercialSpec empty input");

const emptyCreative = adaptCreativeSpec(undefined, PROJECT_ID);
assertBaseSpec(emptyCreative);
console.log("✓ adaptCreativeSpec empty input");

const emptyVisual = adaptVisualBlueprint({}, PROJECT_ID);
assertBaseSpec(emptyVisual);
console.log("✓ adaptVisualBlueprint empty input");

const emptyRender = adaptRenderBlueprint({}, PROJECT_ID);
assertBaseSpec(emptyRender);
assert.equal(emptyRender.promptAllowedOnlyInAdapter, true);
console.log("✓ adaptRenderBlueprint empty input + promptAllowedOnlyInAdapter");

const knowledge = adaptKnowledgeSpec(
  {
    knowledge: {
      category: "tools",
      patterns: [{ patternKey: "high_ctr_white_bg" }],
      promptBlock: "Use clean studio background",
    },
    market: { agentSnippet: "WB tools category" },
  },
  PROJECT_ID,
);
assert.ok(knowledge.patterns.length >= 1);
assert.ok((knowledge.confidence?.score ?? 0) > 0.5);
console.log("✓ adaptKnowledgeSpec with legacy shape");

const creative = adaptCreativeSpec(
  {
    creativeConcept: {
      title: "Power in hand",
      visualHook: "Macro grip shot",
      emotion: "confidence",
    },
  },
  PROJECT_ID,
);
assert.equal(creative.concept, "Power in hand");
console.log("✓ adaptCreativeSpec with legacy shape");

const render = adaptRenderBlueprint(
  { request: { providerId: "pollinations", profileId: "industrial" } },
  PROJECT_ID,
);
assert.equal(render.promptAllowedOnlyInAdapter, true);
assert.equal(render.provider, "pollinations");
console.log("✓ adaptRenderBlueprint with legacy request");

console.log("\nDAOS Wave 2 spec-adapters: all tests passed");
