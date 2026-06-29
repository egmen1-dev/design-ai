import assert from "node:assert/strict";
import {
  DecisionGraph,
  DecisionGraphError,
  DecisionType,
  DependencyKind,
  DEFAULT_DECISION_EDGES,
  DECISION_NODE_ID,
  SectionState,
  createEmptyRenderBlueprint,
  advanceLifecycleStage,
  LifecycleManager,
} from "./index";

function testDefaultGraphValid() {
  const graph = new DecisionGraph();
  const result = graph.validate();
  assert.equal(result.ok, true, result.issues.map((i) => i.message).join("; "));
  console.log("✔ default decision graph validates");
}

function testParentsOnlyChildrenComputed() {
  const graph = new DecisionGraph();
  const camera = graph.getNode("camera")!;
  assert.ok(camera.parents.includes("photography"));
  assert.ok(camera.parents.includes("scene"));
  assert.ok(camera.children.includes("composition"));
  assert.equal(camera.parents.length, camera.parents.filter((p, i, a) => a.indexOf(p) === i).length);
  console.log("✔ parents stored, children computed at runtime");
}

function testStoryInvalidationTransitive() {
  const graph = DecisionGraph.fromBlueprint(createEmptyRenderBlueprint({ seed: 1, category: "x" }));
  graph.proposeUpdate("story", "visual-story-director", { hook: "test" }, 80);
  const results = graph.commitPending();
  const dirtied = results.flatMap((r) => r.dirtied);

  assert.ok(dirtied.includes("scene"));
  assert.ok(dirtied.includes("photography"));
  assert.ok(dirtied.includes("lighting"));
  assert.ok(dirtied.includes("composition"));
  assert.ok(dirtied.includes("validation"));
  assert.equal(graph.getNode("story")!.state, SectionState.DIRTY);
  console.log("✔ story change invalidates downstream chain");
}

function testLightingPartialRebuild() {
  const graph = DecisionGraph.fromBlueprint(createEmptyRenderBlueprint({ seed: 2, category: "x" }));
  for (const id of ["creative", "story", "scene", "photography", "camera", "materials"]) {
    graph.setNodeState(id, SectionState.LOCKED);
  }
  graph.setNodeState("lighting", SectionState.DIRTY);
  graph.setNodeState("composition", SectionState.DIRTY);
  graph.setNodeState("validation", SectionState.DIRTY);

  assert.equal(graph.firstDirtyNode(), DecisionType.LIGHTING);
  const dirty = graph.dirtyNodesInOrder();
  assert.deepEqual(dirty, [
    DecisionType.LIGHTING,
    DecisionType.COMPOSITION,
    DecisionType.VALIDATION,
  ]);
  assert.ok(!dirty.includes(DecisionType.STORY));
  assert.ok(!dirty.includes(DecisionType.SCENE));
  console.log("✔ partial rebuild starts at first DIRTY node");
}

function testSoftDependencyEdge() {
  const edge = DEFAULT_DECISION_EDGES.find((e) => e.from === "lighting" && e.to === "composition");
  assert.ok(edge);
  assert.equal(edge!.kind, DependencyKind.SOFT);
  assert.equal(edge!.weight, 0.35);
  console.log("✔ lighting → composition is SOFT weight 0.35");
}

function testInfoDependencyNoInvalidationPath() {
  const childrenMap = new Map<string, string[]>();
  for (const edge of DEFAULT_DECISION_EDGES) {
    if (edge.kind === DependencyKind.INFO) continue;
    const list = childrenMap.get(edge.from) ?? [];
    list.push(edge.to);
    childrenMap.set(edge.from, list);
  }
  assert.ok(!childrenMap.get("creative")?.includes("validation"));
  console.log("✔ creative → validation is INFO only (no invalidation edge)");
}

function testFreezeAllNodes() {
  const graph = DecisionGraph.fromBlueprint(createEmptyRenderBlueprint({ seed: 3, category: "x" }));
  graph.freezeAll();
  for (const node of graph.getAllNodes()) {
    assert.equal(node.state, SectionState.LOCKED);
  }
  assert.throws(
    () => graph.proposeUpdate("story", "visual-story-director", {}, 50),
    DecisionGraphError,
  );
  console.log("✔ FROZEN locks all decision nodes");
}

function testConflictTwoProducers() {
  const graph = new DecisionGraph();
  graph.proposeUpdate("lighting", "commercial-photo-director", { preset: "soft" }, 70);
  const conflict = graph.proposeUpdate("lighting", "lighting-director", { preset: "hard" }, 65);
  assert.ok(conflict);
  assert.equal(conflict!.nodeId, "lighting");
  assert.ok(conflict!.producers.includes("commercial-photo-director"));
  assert.ok(conflict!.producers.includes("lighting-director"));
  console.log("✔ merge conflict when two producers propose same node");
}

function testCycleDetection() {
  const badEdges = [
    ...DEFAULT_DECISION_EDGES,
    { from: "validation", to: "story", reason: "cycle", weight: 1, kind: DependencyKind.HARD },
  ];
  const graph = new DecisionGraph(badEdges);
  const result = graph.validate();
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.code === "CYCLE"));
  console.log("✔ cyclic dependencies rejected");
}

function testMermaidExport() {
  const graph = new DecisionGraph();
  const mermaid = graph.toMermaid();
  assert.ok(mermaid.startsWith("graph TD"));
  assert.ok(mermaid.includes("creative -->|1| story"));
  assert.ok(mermaid.includes("lighting -->|soft 0.35| composition"));
  console.log("✔ mermaid debug export");
}

async function testLifecycleManagerUsesGraph() {
  const mgr = new LifecycleManager();
  let bp = createEmptyRenderBlueprint({ seed: 10, category: "home_appliances" });
  bp = advanceLifecycleStage(bp);
  bp = mgr.apply("product-analyzer", bp, {
    confidence: 90,
    decisionTrace: [],
    warnings: [],
    updates: { product: { shape: "generator" } },
  }).blueprint;
  bp = advanceLifecycleStage(bp);
  bp = mgr.apply("creative-engine", bp, {
    confidence: 88,
    decisionTrace: [],
    warnings: [],
    updates: { creative: { audience: "homeowners", emotion: "security" } },
  }).blueprint;
  bp = advanceLifecycleStage(bp);

  const { mutation } = await mgr.runAgent(
    (await import("./agents/story-director-agent")).storyDirectorAgent,
    bp,
    { productCategory: "home_appliances", creativeGoal: "Technical" },
  );
  assert.ok(mutation.invalidatedSections.includes("scene"));
  assert.ok(mutation.invalidatedSections.includes("lighting"));
  console.log("✔ LifecycleManager applies graph before blueprint");
}

function run() {
  testDefaultGraphValid();
  testParentsOnlyChildrenComputed();
  testStoryInvalidationTransitive();
  testLightingPartialRebuild();
  testSoftDependencyEdge();
  testInfoDependencyNoInvalidationPath();
  testFreezeAllNodes();
  testConflictTwoProducers();
  testCycleDetection();
  testMermaidExport();
  return testLifecycleManagerUsesGraph();
}

run().then(() => {
  console.log("\nAll decision graph Chapter 3.3 specs passed.");
});
