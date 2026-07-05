/**
 * DAOS Wave 1 foundation specs
 * Run: npm run daos:spec
 */
import assert from "node:assert/strict";
import { createLegacyDAOSState } from "./adapters/legacy-generation-adapter";
import { serializeSpecification } from "./contracts/BaseSpecification";
import { emptyResearchSpec } from "./contracts/specifications";
import { DAOSRuntime } from "./runtime/runtime";
import { DAOSRegistry } from "./registry/registry";
import { DAOSEventBus } from "./events/event-bus";
import { createProjectState } from "./core/project-state";

const daosState = createLegacyDAOSState({ prompt: "test product cover" });
assert.equal(daosState.status, "brief_ready");
assert.equal(daosState.brief?.rawPrompt, "test product cover");
assert.ok(daosState.brief?.decisionTrace.length > 0);
console.log("✓ Legacy DAOS state from prompt");

const state = createProjectState({ projectId: "p1", runId: "r1" });
assert.equal(state.architectureVersion, "daos-v1");
console.log("✓ createProjectState");

const runtime = new DAOSRuntime();
runtime.register({
  id: "noop",
  name: "No-op",
  run: async (_input, s) => ({ ok: true, state: s }),
});
assert.equal(runtime.listNodes().length, 1);
console.log("✓ DAOSRuntime skeleton");

const registry = new DAOSRegistry<string>();
registry.register({ id: "x", version: "1", item: "ok" });
assert.ok(registry.has("x"));
console.log("✓ DAOSRegistry");

const bus = new DAOSEventBus();
bus.emit({ type: "test", source: "daos.spec" });
assert.equal(bus.list().length, 1);
console.log("✓ DAOSEventBus");

// Legacy contract helpers (Wave 1 layer) still compile
const spec = emptyResearchSpec({ query: "trends" });
assert.ok(serializeSpecification(spec).includes("ResearchSpec"));
console.log("✓ legacy contract helpers");

console.log("\nDAOS Wave 1: all specs passed");
