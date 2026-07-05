/**
 * DAOS Wave 1 — registry smoke tests
 * Run: npx tsx src/lib/daos/__tests__/registry.test.ts
 */
import assert from "node:assert/strict";
import { DAOSRegistry } from "../registry/registry";

const registry = new DAOSRegistry<{ name: string }>();
registry.register({ id: "platform-a", version: "1.0.0", item: { name: "A" } });

assert.ok(registry.has("platform-a"));
assert.equal(registry.get("platform-a")?.item.name, "A");
assert.equal(registry.list().length, 1);

console.log("✓ registry.test.ts passed");
