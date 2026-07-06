/**
 * DAOS Wave 8 — debug index tests
 * Run: npx tsx src/lib/daos/tests/debug-index.test.ts
 */
import assert from "node:assert/strict";
import { mkdtemp, rm } from "fs/promises";
import path from "path";
import os from "os";
import {
  DAOS_DEBUG_INDEX_MAX_ENTRIES,
  readDaosDebugIndex,
  updateDaosDebugIndex,
} from "../debug/daos-debug-index";
import { renderDaosDebugIndexMarkdown } from "../debug/daos-debug-index-markdown";

async function runTests() {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), "daos-index-test-"));

  try {
    const empty = await readDaosDebugIndex({ rootDir: tempRoot });
    assert.equal(empty.version, 1);
    assert.deepEqual(empty.entries, []);
    console.log("✓ read empty index");

    const entryA = {
      projectId: "proj-a",
      runId: "run-a",
      createdAt: "2026-07-05T10:00:00.000Z",
      generationMode: "balanced",
      summaryStatus: "ok" as const,
      summaryScore: 90,
      finalGateStatus: "passed" as const,
      bundlePath: "generated/daos-debug/proj-a/run-a/daos-debug-bundle.json",
    };

    const writeA = await updateDaosDebugIndex({ rootDir: tempRoot, entry: entryA });
    assert.equal(writeA.ok, true);
    const afterA = await readDaosDebugIndex({ rootDir: tempRoot });
    assert.equal(afterA.entries.length, 1);
    assert.equal(afterA.entries[0]?.projectId, "proj-a");
    console.log("✓ update adds entry");

    const entryAUpdated = {
      ...entryA,
      summaryScore: 55,
      summaryStatus: "warning" as const,
      finalGateStatus: "warning" as const,
    };
    await updateDaosDebugIndex({ rootDir: tempRoot, entry: entryAUpdated });
    const afterReplace = await readDaosDebugIndex({ rootDir: tempRoot });
    assert.equal(afterReplace.entries.length, 1);
    assert.equal(afterReplace.entries[0]?.summaryScore, 55);
    console.log("✓ duplicate replaces entry");

    await updateDaosDebugIndex({
      rootDir: tempRoot,
      entry: {
        projectId: "proj-b",
        runId: "run-b",
        createdAt: "2026-07-05T12:00:00.000Z",
        summaryScore: 80,
      },
    });
    const sorted = await readDaosDebugIndex({ rootDir: tempRoot });
    assert.equal(sorted.entries[0]?.projectId, "proj-b");
    assert.equal(sorted.entries[1]?.projectId, "proj-a");
    console.log("✓ sorting desc by createdAt");

    const overflowRoot = await mkdtemp(path.join(os.tmpdir(), "daos-index-overflow-"));
    try {
      for (let i = 0; i < DAOS_DEBUG_INDEX_MAX_ENTRIES + 5; i++) {
        await updateDaosDebugIndex({
          rootDir: overflowRoot,
          entry: {
            projectId: `proj-${i}`,
            runId: `run-${i}`,
            createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(),
          },
        });
      }
      const overflow = await readDaosDebugIndex({ rootDir: overflowRoot });
      assert.equal(overflow.entries.length, DAOS_DEBUG_INDEX_MAX_ENTRIES);
      assert.equal(overflow.entries[0]?.projectId, `proj-${DAOS_DEBUG_INDEX_MAX_ENTRIES + 4}`);
      console.log("✓ max 500 entries retained");
    } finally {
      await rm(overflowRoot, { recursive: true, force: true });
    }

    const markdown = renderDaosDebugIndexMarkdown(sorted);
    assert.ok(markdown.includes("proj-b"));
    assert.ok(markdown.includes("createdAt"));
    assert.ok(markdown.includes("final gate"));
    console.log("✓ markdown renders");

    const failWrite = await updateDaosDebugIndex({
      rootDir: "/\0invalid",
      entry: entryA,
    });
    assert.equal(failWrite.ok, false);
    assert.ok(failWrite.error?.includes("DAOS debug index update failed"));
    console.log("✓ index write failure does not throw");

    console.log("\nDAOS Wave 8 debug-index: all tests passed");
  } finally {
    await rm(tempRoot, { recursive: true, force: true });
  }
}

runTests().catch((error) => {
  console.error(error);
  process.exit(1);
});
