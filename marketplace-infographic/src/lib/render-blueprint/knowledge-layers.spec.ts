/**
 * DESIGN AI v18 — Knowledge Layers tests (Chapter 5.4)
 */
import assert from "node:assert/strict";
import {
  KNOWLEDGE_LAYERS_VERSION,
  KNOWLEDGE_LAYERS_GOLDEN_RULE,
  KNOWLEDGE_LAYER_STACK,
  KNOWLEDGE_LAYER_PRIORITY,
  KnowledgeLayer,
  KNOWLEDGE_LAYER_DEFINITIONS,
  AGENT_KNOWLEDGE_LAYER_ACCESS,
  getKnowledgeLayerDefinition,
  getAgentKnowledgeLayers,
  buildSeedLayerKnowledge,
  buildCrossLayerReasoning,
  resolveLayerConflict,
  publishLayerVersion,
  validateLayerBeforePublish,
  validateLayerIndependence,
  validateKnowledgeIsolation,
  getExtensibleLayerSlots,
  validateKnowledgeLayers,
  assertKnowledgeLayers,
  runKnowledgeLayers,
  isKnowledgeLayersFailure,
} from "./index";

function testGoldenRule() {
  assert.ok(KNOWLEDGE_LAYERS_GOLDEN_RULE.includes("not one large rule base"));
  assert.equal(KNOWLEDGE_LAYERS_VERSION, "5.4.0");
  console.log("✔ golden rule — multi-level system, not monolithic rule base");
}

function testLayerStack() {
  assert.deepEqual(KNOWLEDGE_LAYER_STACK, [
    "business",
    "marketplace",
    "design",
    "photography",
    "psychology",
    "rendering",
  ]);
  assert.ok(!KNOWLEDGE_LAYER_STACK.includes(KnowledgeLayer.LEARNING));
  console.log("✔ layer stack — business → marketplace → design → photography → psychology → rendering");
}

function testLayerPriority() {
  assert.equal(KNOWLEDGE_LAYER_PRIORITY[0], KnowledgeLayer.BUSINESS);
  assert.ok(KNOWLEDGE_LAYER_PRIORITY.indexOf(KnowledgeLayer.RENDERING) > KNOWLEDGE_LAYER_PRIORITY.indexOf(KnowledgeLayer.BUSINESS));
  console.log("✔ layer priority — business highest, rendering cannot override business");
}

function testLayerDefinitions() {
  assert.equal(KNOWLEDGE_LAYER_DEFINITIONS.length, 7);
  const learning = getKnowledgeLayerDefinition(KnowledgeLayer.LEARNING)!;
  assert.equal(learning.dynamic, true);
  const business = getKnowledgeLayerDefinition(KnowledgeLayer.BUSINESS)!;
  assert.equal(business.dynamic, false);
  console.log("✔ seven layers — learning is only dynamic layer");
}

function testLightingDirectorLayers() {
  const layers = getAgentKnowledgeLayers("lighting-director");
  assert.ok(layers.includes(KnowledgeLayer.DESIGN));
  assert.ok(layers.includes(KnowledgeLayer.PHOTOGRAPHY));
  assert.ok(layers.includes(KnowledgeLayer.PSYCHOLOGY));
  assert.ok(layers.includes(KnowledgeLayer.MARKETPLACE));
  assert.ok(!layers.includes(KnowledgeLayer.LEARNING));
  console.log("✔ lighting director — design + photography + psychology + marketplace");
}

function testSeedLayerKnowledge() {
  const entries = buildSeedLayerKnowledge();
  assert.ok(entries.some((e) => e.layer === KnowledgeLayer.BUSINESS));
  assert.ok(entries.some((e) => e.layer === KnowledgeLayer.PHOTOGRAPHY));
  assert.ok(entries.some((e) => e.layer === KnowledgeLayer.LEARNING));
  console.log("✔ seed knowledge distributed across layers");
}

function testCrossLayerReasoning() {
  const decision = buildCrossLayerReasoning({
    business: "Premium Cosmetics",
    psychology: "White increases trust",
    photography: "Soft Diffused Light",
    marketplace: "Main Image Rules",
  });
  assert.ok(decision.layersUsed.length >= 4);
  assert.equal(decision.priorityResolved, true);
  assert.ok(decision.decision.includes("Premium"));
  console.log("✔ cross-layer reasoning — business + psychology + photography + marketplace");
}

function testLayerConflictResolution() {
  const conflict = resolveLayerConflict(
    KnowledgeLayer.RENDERING,
    KnowledgeLayer.BUSINESS,
    "use provider-specific prompt",
    "premium luxury positioning",
  );
  assert.equal(conflict.higherLayer, KnowledgeLayer.BUSINESS);
  console.log("✔ rendering layer never overrides business layer");
}

function testLayerVersioning() {
  const next = publishLayerVersion(KnowledgeLayer.DESIGN, "4.0.0");
  assert.equal(next.version, "4.0.1");
  assert.equal(next.previousVersion, "4.0.0");
  assert.equal(next.immutable, true);
  console.log("✔ independent layer versioning — design v4.0.0 → v4.0.1");
}

function testLayerValidation() {
  const entries = buildSeedLayerKnowledge();
  const result = validateLayerBeforePublish(KnowledgeLayer.MARKETPLACE, entries);
  assert.equal(result.valid, true);
  assert.ok(result.compatibleWith.includes(KnowledgeLayer.BUSINESS));
  console.log("✔ layer validation before publish — integrity and compatibility");
}

function testLayerIndependence() {
  const violations = validateLayerIndependence({
    from: KnowledgeLayer.LEARNING,
    to: KnowledgeLayer.BUSINESS,
  });
  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, "LAYER_MUTATION_LEAK");
  console.log("✔ layer independence — learning update must not mutate business layer");
}

function testKnowledgeIsolation() {
  const isolation = validateKnowledgeIsolation([KnowledgeLayer.LEARNING]);
  assert.equal(isolation.operational, true);
  assert.ok(isolation.remainingLayers.includes(KnowledgeLayer.BUSINESS));
  assert.ok(isolation.remainingLayers.includes(KnowledgeLayer.DESIGN));
  console.log("✔ knowledge isolation — pipeline works without learning layer");
}

function testExtensibility() {
  const slots = getExtensibleLayerSlots();
  assert.ok(slots.includes("accessibility"));
  assert.ok(slots.includes("localization"));
  assert.ok(slots.includes("brand_identity"));
  console.log("✔ layer extensibility — accessibility, localization, brand identity slots");
}

function testMonolithicStoreFails() {
  const report = validateKnowledgeLayers({ monolithicStore: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "MONOLITHIC_KNOWLEDGE_STORE"));
  console.log("✔ monolithic knowledge store is architecturally invalid");
}

function testValidateKnowledgeLayers() {
  const report = validateKnowledgeLayers();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.crossLayerCapable, true);
  assert.equal(report.independent, true);
  console.log("✔ knowledge layers validation passes");
}

function testRunKnowledgeLayers() {
  const report = runKnowledgeLayers({});
  assert.equal(report.valid, true);
  assertKnowledgeLayers();
  console.log("✔ runKnowledgeLayers entry point works");
}

function testFailureCodes() {
  assert.equal(isKnowledgeLayersFailure("LAYER_MUTATION_LEAK"), true);
  assert.equal(isKnowledgeLayersFailure("UNKNOWN"), false);
  console.log("✔ knowledge layers failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testLayerStack();
  testLayerPriority();
  testLayerDefinitions();
  testLightingDirectorLayers();
  testSeedLayerKnowledge();
  testCrossLayerReasoning();
  testLayerConflictResolution();
  testLayerVersioning();
  testLayerValidation();
  testLayerIndependence();
  testKnowledgeIsolation();
  testExtensibility();
  testMonolithicStoreFails();
  testValidateKnowledgeLayers();
  testRunKnowledgeLayers();
  testFailureCodes();
  console.log("\nknowledge-layers.spec.ts — all passed");
}

run();
