/**
 * DESIGN AI v18 — Agent Dependencies tests (Chapter 4.5)
 */
import assert from "node:assert/strict";
import {
  AGENT_DEPENDENCY_GOLDEN_RULE,
  agentsUnaffectedBySectionChange,
  buildExecutionPlanFromDependencies,
  detectSectionCycle,
  exportDependencyGraph,
  getAgentDependency,
  getSectionOwner,
  propagateSectionChange,
  validateAgentDependencies,
  validateDependencyGraph,
  validateOwnership,
  createEmptyRenderBlueprint,
  downstreamSections,
  SectionState,
} from "./index";

function testGoldenRule() {
  assert.ok(AGENT_DEPENDENCY_GOLDEN_RULE.includes("between agents"));
  console.log("✔ golden rule — data dependencies only");
}

function testAgentDependencyFromMatrices() {
  const scene = getAgentDependency("scene-director");
  assert.ok(scene.consumes.includes("story"));
  assert.ok(scene.produces.includes("scene"));
  assert.ok(scene.optional.includes("constraints"));
  assert.ok(!scene.consumes.includes("composition-director" as never));
  console.log("✔ agent dependency built from section matrices, not agent links");
}

function testCompositionSoftDependencies() {
  const comp = getAgentDependency("composition-director");
  assert.ok(comp.optional.includes("background"));
  assert.ok(comp.consumes.includes("photography"));
  console.log("✔ composition director has optional background soft dependency");
}

function testCommercialPhotoConditional() {
  const photo = getAgentDependency("commercial-photo-director");
  assert.ok(photo.conditional.some((c) => c.section === "background"));
  console.log("✔ commercial photo director has conditional background dependency");
}

function testSectionOwnership() {
  assert.equal(getSectionOwner("lighting"), "lighting-director");
  assert.equal(getSectionOwner("story"), "visual-story-director");
  assert.equal(validateOwnership().length, 0);
  console.log("✔ each section has a single owner");
}

function testRequiredSectionsBlockRun() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const result = validateAgentDependencies("scene-director", bp);
  assert.equal(result.valid, false);
  assert.ok(result.missing.includes("story"));
  console.log("✔ missing required sections block agent run");
}

function testOptionalSectionsMayBeAbsent() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp.story = {
    hook: "h",
    customerProblem: "p",
    customerDesire: "d",
    visualPromise: "v",
    emotionalTone: "calm",
    narrative: "Test",
  };
  bp.creative = {
    goal: "Technical",
    audience: "buyers",
    emotion: "confidence",
    marketplace: "WB",
    priceSegment: "middle",
  };
  bp.product = {
    category: "electronics",
    subCategory: "x",
    dominantColor: [],
    materials: [],
    finish: "matte",
    shape: "rect",
    cutout: true,
  };
  bp.lifecycle.sections.story = SectionState.READY;
  bp.lifecycle.sections.creative = SectionState.READY;
  bp.lifecycle.sections.product = SectionState.READY;
  const result = validateAgentDependencies("scene-director", bp);
  assert.equal(result.valid, true);
  console.log("✔ optional sections may be absent without blocking run");
}

function testConditionalCompositeBackground() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp.lifecycle.sections.story = SectionState.READY;
  bp.lifecycle.sections.scene = SectionState.READY;
  bp.lifecycle.sections.product = SectionState.READY;
  const without = validateAgentDependencies("commercial-photo-director", bp, {
    blueprintRevision: 0,
    compositeEnabled: false,
  });
  assert.equal(without.valid, true);

  const withCompositeReady = validateAgentDependencies("commercial-photo-director", bp, {
    blueprintRevision: 0,
    compositeEnabled: true,
  });
  assert.equal(withCompositeReady.valid, true);

  bp.background = {} as typeof bp.background;
  const withCompositeMissing = validateAgentDependencies("commercial-photo-director", bp, {
    blueprintRevision: 0,
    compositeEnabled: true,
  });
  assert.equal(withCompositeMissing.valid, false);
  assert.ok(withCompositeMissing.missing.includes("background"));
  console.log("✔ conditional background required when composite enabled");
}

function testNoCyclesInGraph() {
  const result = validateDependencyGraph();
  assert.equal(result.valid, true);
  assert.equal(result.cycle, null);
  assert.ok(result.topologicalOrder.length > 0);
  assert.equal(result.topologicalOrder[0], "creative");
  console.log("✔ section dependency graph is acyclic");
}

function testTopologicalExecutionPlan() {
  const plan = buildExecutionPlanFromDependencies();
  const storyIdx = plan.indexOf("story");
  const sceneIdx = plan.indexOf("scene");
  const compositionIdx = plan.indexOf("composition");
  assert.ok(storyIdx < sceneIdx);
  assert.ok(sceneIdx < compositionIdx);
  console.log("✔ execution plan follows topological order");
}

function testPropagationFromLighting() {
  const result = propagateSectionChange("lighting");
  assert.ok(result.affectedSections.includes("composition"));
  assert.ok(result.affectedSections.includes("constraints"));
  assert.ok(result.agentsToRerun.includes("composition-director"));
  assert.ok(result.agentsToRerun.includes("governance"));

  const unchanged = agentsUnaffectedBySectionChange("lighting");
  assert.ok(unchanged.includes("visual-story-director"));
  assert.ok(unchanged.includes("scene-director"));
  console.log("✔ lighting change propagates only to downstream sections");
}

function testDownstreamExcludesUpstream() {
  const downstream = downstreamSections("lighting");
  assert.ok(!downstream.includes("story"));
  assert.ok(!downstream.includes("scene"));
  console.log("✔ downstream from lighting excludes story and scene");
}

function testExportGraphForVisualization() {
  const exported = exportDependencyGraph();
  assert.ok(exported.nodes.length > 5);
  assert.ok(exported.edges.length > 5);
  assert.ok(exported.topologicalOrder.length > 0);
  assert.equal(exported.hasCycle, false);
  assert.equal(detectSectionCycle(), null);
  console.log("✔ dependency graph exported for visualization");
}

function run() {
  testGoldenRule();
  testAgentDependencyFromMatrices();
  testCompositionSoftDependencies();
  testCommercialPhotoConditional();
  testSectionOwnership();
  testRequiredSectionsBlockRun();
  testOptionalSectionsMayBeAbsent();
  testConditionalCompositeBackground();
  testNoCyclesInGraph();
  testTopologicalExecutionPlan();
  testPropagationFromLighting();
  testDownstreamExcludesUpstream();
  testExportGraphForVisualization();
  console.log("\nagent-dependency.spec.ts — all passed");
}

run();
