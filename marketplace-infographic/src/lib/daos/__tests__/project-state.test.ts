/**
 * DAOS Wave 1 — project-state smoke tests
 * Run: npx tsx src/lib/daos/__tests__/project-state.test.ts
 */
import assert from "node:assert/strict";
import { createProjectState, updateProjectState } from "../core/project-state";

const state = createProjectState({ projectId: "p1", runId: "r1" });
assert.equal(state.status, "created");
assert.equal(state.architectureVersion, "daos-v1");
assert.equal(state.decisionTrace.length, 0);

const updated = updateProjectState(state, { status: "brief_ready" });
assert.equal(updated.status, "brief_ready");
assert.equal(state.status, "created");
assert.ok(updated.updatedAt >= state.updatedAt);

assert.throws(() => {
  (state as { projectId: string }).projectId = "mutated";
});

console.log("✓ project-state.test.ts passed");
