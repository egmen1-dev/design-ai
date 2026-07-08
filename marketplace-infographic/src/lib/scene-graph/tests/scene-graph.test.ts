/**
 * DAOS RFC-001 — SceneGraph core tests
 * Run: npx tsx src/lib/scene-graph/tests/scene-graph.test.ts
 */
import assert from "node:assert/strict";
import { SCENE_GRAPH_VERSION, type SceneGraph } from "../SceneGraph";
import { createSceneNode } from "../SceneNode";
import { isDaosSceneGraphV2Enabled } from "../index";

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

withEnv({ DAOS_SCENE_GRAPH_V2: undefined }, () => {
  assert.equal(isDaosSceneGraphV2Enabled(), false);
});
withEnv({ DAOS_SCENE_GRAPH_V2: "1" }, () => {
  assert.equal(isDaosSceneGraphV2Enabled(), true);
});
console.log("✓ feature flag defaults OFF");

const productNode = {
  ...createSceneNode({
    id: "product",
    type: "product",
    planned: { x: 100, y: 200, width: 400, height: 500, layer: 10 },
    confidence: 0.75,
    source: "planner",
  }),
  type: "product" as const,
};

const graph: SceneGraph = {
  version: SCENE_GRAPH_VERSION,
  id: "test-graph",
  stage: "planner",
  createdAt: new Date().toISOString(),
  canvas: {
    ...createSceneNode({
      id: "canvas",
      type: "canvas",
      planned: { x: 0, y: 0, width: 900, height: 1200, layer: 0 },
      actual: { x: 0, y: 0, width: 900, height: 1200, layer: 0 },
      confidence: 1,
      source: "planner",
    }),
    type: "canvas",
  },
  background: createSceneNode({ id: "background", type: "background", source: "planner" }),
  product: productNode,
  overlay: { ...createSceneNode({ id: "overlay", type: "overlay", source: "planner" }), type: "overlay" },
  typography: {
    ...createSceneNode({ id: "typography", type: "typography", source: "planner" }),
    type: "typography",
  },
  badges: { ...createSceneNode({ id: "badges", type: "badges", source: "overlay" }), type: "badges" },
  safeZones: {
    ...createSceneNode({ id: "safe_zones", type: "safe_zones", source: "planner" }),
    type: "safe_zones",
  },
  whitespace: {
    ...createSceneNode({ id: "whitespace", type: "whitespace", source: "planner" }),
    type: "whitespace",
  },
  composition: {
    ...createSceneNode({ id: "composition", type: "composition", source: "planner" }),
    type: "composition",
  },
  lighting: createSceneNode({ id: "lighting", type: "lighting", source: "planner" }),
  depth: createSceneNode({ id: "depth", type: "depth", source: "planner" }),
  camera: createSceneNode({ id: "camera", type: "camera", source: "planner" }),
  governance: {
    ...createSceneNode({ id: "governance", type: "governance", source: "constitution" }),
    type: "governance",
  },
  metadata: {
    enabled: true,
    mirrorMode: true,
    sources: ["planner"],
    productCategory: "mattress",
  },
};

assert.equal(graph.version, 2);
assert.equal(graph.product.planned?.width, 400);
assert.equal(graph.metadata.mirrorMode, true);
console.log("✓ SceneGraph structure");

console.log("\n✅ scene-graph.test.ts passed");
