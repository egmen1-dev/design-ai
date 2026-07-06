/**
 * DAOS Wave 1 — event-bus smoke tests
 * Run: npx tsx src/lib/daos/__tests__/event-bus.test.ts
 */
import assert from "node:assert/strict";
import { DAOSEventBus } from "../events/event-bus";

const bus = new DAOSEventBus();
const event = bus.emit({
  type: "project:created",
  source: "test",
  projectId: "p1",
  runId: "r1",
});

assert.ok(event.id);
assert.equal(event.type, "project:created");
assert.equal(bus.list().length, 1);

bus.clear();
assert.equal(bus.list().length, 0);

console.log("✓ event-bus.test.ts passed");
