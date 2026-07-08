/**
 * DAOS RFC-001 — SceneGraph migration / mirror tests
 * Run: npx tsx src/lib/scene-graph/tests/scene-graph-migration.test.ts
 */
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import type { CompositionLayout } from "@/lib/composition/types";
import { createSceneGraphMirror } from "@/lib/daos/scene-graph";
import { createDaosDebugBundle } from "@/lib/daos/debug/daos-debug-bundle";
import { createProjectState } from "@/lib/daos/core/project-state";

function withEnv(vars: Record<string, string | undefined>, fn: () => void | Promise<void>): Promise<void> {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key];
    const value = vars[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  return Promise.resolve(fn()).finally(() => {
    for (const key of Object.keys(vars)) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });
}

const compositionLayout: CompositionLayout = {
  canvas: { width: 900, height: 1200 },
  safeInsetPct: 6,
  product: {
    left: 46,
    top: 22,
    width: 48,
    height: 58,
    centerX: 0.68,
    centerY: 0.52,
    maxWidthPct: 78,
    maxHeightPct: 24,
    areaPct: 30,
    rotationDeg: 0,
  },
  headline: { left: 40, top: 60, width: 320, height: 90, fontSizePct: 8 },
  subtitle: { left: 40, top: 150, width: 300, height: 50, fontSizePct: 4 },
  leftPanel: { left: 30, top: 220, width: 340, height: 420 },
  rightSidebar: { left: 700, top: 220, width: 160, height: 420 },
  bullets: { left: 40, top: 240, width: 300, height: 180, itemHeightPct: 6, gapPct: 2, maxCount: 4 },
  plaques: {
    smallWidthPct: 18,
    mediumWidthPct: 24,
    largeWidthPct: 30,
    heightPct: 8,
    maxTotalAreaPct: 12,
  },
  icon: { sizePct: 4, textGapPct: 2 },
  textSide: "left",
  metrics: {
    productAreaPct: 22,
    textAreaPct: 14,
    plaqueAreaPct: 8,
    whitespacePct: 56,
    overlapPct: 5,
    visualCenterX: 0.55,
    visualCenterY: 0.5,
    minEdgeInsetPct: 4,
  },
  valid: true,
  issues: [],
  adjustments: [],
};

async function runTests(): Promise<void> {
  await withEnv({ DAOS_SCENE_GRAPH_V2: undefined }, () => {
    const mirror = createSceneGraphMirror({ projectId: "p1", runId: "r1" });
    assert.equal(mirror.isEnabled(), false);
    mirror.capturePlanner({ compositionLayout });
    assert.equal(mirror.getSnapshots().before, undefined);
  });
  console.log("✓ mirror disabled when flag OFF");

  await withEnv({ DAOS_SCENE_GRAPH_V2: "1" }, async () => {
    const mirror = createSceneGraphMirror({ projectId: "proj-rfc001", runId: "run-mirror" });
    assert.equal(mirror.isEnabled(), true);

    mirror.capturePlanner({ compositionLayout, productCategory: "mattress" });
    mirror.captureAfterCompositor({
      compositionLayout,
      compositePlacement: {
        x: 110,
        y: 160,
        width: 480,
        height: 600,
        areaRatio: 0.17,
        widthRatio: 0.53,
        heightRatio: 0.5,
        source: "productPlacement",
        confidence: 0.95,
      },
    });
    mirror.captureAfterOverlay({ compositionLayout });
    mirror.captureFinal({
      compositionLayout,
      law003Recalibration: {
        originalWhitespace: 56,
        recalibratedWhitespace: 48,
        productAdjustedWhitespace: 50,
        overlayAdjustedWhitespace: 48,
        law003Before: false,
        law003After: true,
        confidence: 0.9,
        reason: "factual_product_area",
        warnings: [],
        staleMetricDetected: true,
      },
    });

    const snapshots = mirror.getSnapshots();
    assert.ok(snapshots.before);
    assert.ok(snapshots.afterCompositor);
    assert.ok(snapshots.afterOverlay);
    assert.ok(snapshots.final);
    assert.ok(snapshots.drifts && snapshots.drifts.length >= 3);

    const validation = mirror.getPipelineValidation();
    assert.ok(validation);
    assert.equal(validation!.stages.length, 4);

    const tempDir = await mkdtemp(path.join(tmpdir(), "scene-graph-"));
    try {
      const writeResult = await mirror.writeSnapshots();
      assert.ok(writeResult.written.length >= 4);

      const cwdBefore = path.join(
        process.cwd(),
        "generated",
        "daos-debug",
        "proj-rfc001",
        "run-mirror",
        "sceneGraphBefore.json",
      );
      const raw = await readFile(cwdBefore, "utf8");
      const parsed = JSON.parse(raw) as { stage: string };
      assert.equal(parsed.stage, "planner");
      await rm(path.join(process.cwd(), "generated", "daos-debug", "proj-rfc001"), {
        recursive: true,
        force: true,
      });
    } finally {
      await rm(tempDir, { recursive: true, force: true });
    }

    const state = createProjectState({ projectId: "proj-rfc001", runId: "run-mirror" });
    const bundle = createDaosDebugBundle(state, {
      sceneGraphSnapshots: snapshots,
      sceneGraphFiles: ["generated/daos-debug/proj-rfc001/run-mirror/sceneGraphBefore.json"],
      sceneGraphDriftSummary: mirror.getDriftSummary(),
    });
    assert.equal(bundle.diagnostics.sceneGraphV2Enabled, true);
    assert.equal(bundle.diagnostics.sceneGraphMirrorMode, true);
    assert.ok(bundle.sceneGraphSnapshots?.sceneGraphBefore);
  });
  console.log("✓ mirror captures full pipeline and debug bundle integration");
}

runTests()
  .then(() => {
    console.log("\n✅ scene-graph-migration.test.ts passed");
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
