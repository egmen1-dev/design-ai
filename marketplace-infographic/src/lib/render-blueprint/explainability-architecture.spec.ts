/**
 * DESIGN AI v18 — Explainability Architecture tests (Chapter 4.26)
 */
import assert from "node:assert/strict";
import {
  EXPLAINABILITY_ARCHITECTURE_VERSION,
  EXPLAINABILITY_GOLDEN_RULE,
  EXPLAINABILITY_PIPELINE,
  EXPLAINABILITY_DECISION_SECTIONS,
  buildDecisionOwnershipMap,
  buildStructuredReason,
  buildDecisionMetadata,
  buildExplainableDecision,
  buildExplainabilityDecisionGraph,
  getDependencyTrace,
  computeConfidenceChain,
  traceElement,
  buildHumanReadableReport,
  buildRetryExplainabilityDelta,
  validateRetryExplainability,
  buildDebugTrace,
  validateExplainabilityArchitecture,
  assertExplainable,
  runExplainabilityArchitecture,
  isExplainabilityFailure,
  LightingStyle,
  StoryType,
  SceneType,
  EnvironmentType,
  frozenTestBlueprint,
  BlueprintLifecycle,
} from "./index";

function explainableBlueprint() {
  const bp = frozenTestBlueprint();
  const now = Date.now();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.story.emotionalTone = "luxury";
  bp.story.primaryEmotion = "luxury";
  bp.story.hook = "Premium Family Kitchen";
  bp.story.visualPromise = "Elevated everyday comfort";
  bp.scene.sceneType = SceneType.LUXURY;
  bp.scene.environment = EnvironmentType.LUXURY_INTERIOR;
  bp.scene.architecture = "modern";
  bp.photography.photographyStyle = "premium_hero";
  bp.photography.visualMood = "warm morning light";
  bp.lighting.lightingStyle = LightingStyle.LUXURY_WARM;
  bp.lighting.lightingScheme = "luxury_side_light";
  bp.camera.lens = 50;
  bp.camera.cameraStyle = "premium_hero";
  bp.materials.materialPalette = ["marble", "brushed_steel"];
  bp.materials.surfaceFinish = "satin";
  bp.composition.template = "hero_right";
  bp.lifecycle.stage = BlueprintLifecycle.FROZEN;
  bp.meta.audit = [
    { agentId: "visual-story-director", section: "story", action: "set", at: now - 5000 },
    { agentId: "scene-director", section: "scene", action: "set", at: now - 4000 },
    { agentId: "commercial-photo-director", section: "photography", action: "set", at: now - 3000 },
    { agentId: "lighting-director", section: "lighting", action: "set", at: now - 2000 },
    { agentId: "camera-director", section: "camera", action: "set", at: now - 1500 },
    { agentId: "material-director", section: "materials", action: "set", at: now - 1000 },
    { agentId: "composition-director", section: "composition", action: "set", at: now - 500 },
  ];
  return bp;
}

function testGoldenRule() {
  assert.ok(EXPLAINABILITY_GOLDEN_RULE.includes("just because"));
  assert.equal(EXPLAINABILITY_ARCHITECTURE_VERSION, "4.26.0");
  console.log("✔ golden rule — every decision has author, reason, sources, dependencies, effect");
}

function testExplainabilityPipeline() {
  assert.deepEqual(EXPLAINABILITY_PIPELINE, [
    "agent",
    "decision",
    "reason",
    "blueprint",
    "render-intent",
    "image",
  ]);
  console.log("✔ explainability pipeline — agent → decision → reason → blueprint → render → image");
}

function testDecisionOwnership() {
  const ownership = buildDecisionOwnershipMap();
  assert.equal(ownership.story, "visual-story-director");
  assert.equal(ownership.lighting, "lighting-director");
  assert.equal(ownership.camera, "camera-director");
  console.log("✔ decision ownership — single owner per creative section");
}

function testExplainableDecisionHasReason() {
  const bp = explainableBlueprint();
  const decision = buildExplainableDecision(bp, "lighting");
  assert.ok(decision.reason.length > 10);
  assert.ok(decision.reason.toLowerCase().includes("light"));
  assert.equal(decision.metadata.agent, "lighting-director");
  assert.ok(decision.metadata.knowledgeSources.includes("story"));
  assert.ok(decision.confidence > 0);
  console.log("✔ reason first — lighting decision includes human explanation, not bare value");
}

function testStructuredReasonMachineReadable() {
  const bp = explainableBlueprint();
  const structured = buildStructuredReason(bp, "story");
  assert.ok(structured.summary.length > 0);
  assert.ok(structured.knowledgeSources.length >= 2);
  assert.ok(structured.tags.includes("story"));
  console.log("✔ machine explainability — structured reason with knowledge sources and tags");
}

function testDependencyTrace() {
  const lightingDeps = getDependencyTrace("lighting");
  assert.ok(lightingDeps.includes("story"));
  assert.ok(lightingDeps.includes("photography"));
  assert.ok(lightingDeps.includes("scene"));
  console.log("✔ dependency trace — lighting depends on story, photography, scene");
}

function testDecisionGraph() {
  const bp = explainableBlueprint();
  const graph = buildExplainabilityDecisionGraph(bp);
  assert.equal(graph.nodes.length, EXPLAINABILITY_DECISION_SECTIONS.length);
  assert.ok(graph.edges.length >= 4);
  const lightingNode = graph.nodes.find((n) => n.section === "lighting")!;
  assert.equal(lightingNode.owner, "lighting-director");
  assert.ok(lightingNode.dependencies.includes("story"));
  console.log("✔ decision graph — oriented graph of creative decisions with dependencies");
}

function testConfidenceChainPropagation() {
  const bp = explainableBlueprint();
  const chain = computeConfidenceChain(bp, {
    agentConfidences: {
      "visual-story-director": 0.35,
      "lighting-director": 0.9,
    },
  });
  const lighting = chain.entries.find((e) => e.section === "lighting")!;
  assert.ok(lighting.propagatedConfidence < lighting.confidence);
  assert.equal(chain.weakestLink, "story");
  assert.ok(chain.overallConfidence <= 0.35);
  console.log("✔ confidence chain — low upstream confidence reduces dependent trust");
}

function testTraceabilityChain() {
  const bp = explainableBlueprint();
  const trace = traceElement(bp, "lighting");
  assert.ok(trace.element.includes("luxury"));
  assert.equal(trace.owner, "lighting-director");
  assert.ok(trace.upstream.some((u) => u.section === "story"));
  console.log("✔ traceability — warm lighting traces to lighting director and luxury story");
}

function testHumanReadableReport() {
  const bp = explainableBlueprint();
  const report = buildHumanReadableReport(bp);
  assert.ok(report.entries.length >= 5);
  const story = report.entries.find((e) => e.label === "Story")!;
  assert.ok(story.value.includes("luxury") || story.value.includes("PREMIUM"));
  assert.ok(story.reason && story.reason.length > 0);
  console.log("✔ human readable report — blueprint converts to plain-language decision report");
}

function testRetryExplainability() {
  const before = explainableBlueprint();
  const after = structuredClone(before);
  after.lighting.lightingScheme = "natural_window_light";
  after.lighting.lightingStyle = LightingStyle.NATURAL_WINDOW;

  const change = buildRetryExplainabilityDelta(before, after, {
    section: "lighting",
    initiatedBy: "chief-design-director",
    reason: "Vision QA detected harsh shadows on product hero",
    expectedEffect: "Softer natural window light improves comfort perception",
  });

  assert.equal(change.owner, "lighting-director");
  assert.notDeepEqual(change.decisionBefore, change.decisionAfter);
  const violations = validateRetryExplainability([change]);
  assert.equal(violations.length, 0);
  console.log("✔ retry explainability — change documents who, why, and expected effect");
}

function testRetryWithoutExplanationFails() {
  const violations = validateRetryExplainability([
    {
      section: "lighting",
      owner: "lighting-director",
      decisionBefore: {},
      decisionAfter: {},
      reason: "",
      initiatedBy: "chief-design-director",
      expectedEffect: "",
    },
  ]);
  assert.ok(violations.some((v) => v.code === "RETRY_WITHOUT_EXPLANATION"));
  assert.ok(violations.some((v) => v.code === "DECISION_WITHOUT_EFFECT"));
  console.log("✔ retry without explanation is architecturally invalid");
}

function testDebugTrace() {
  const bp = explainableBlueprint();
  const trace = buildDebugTrace(bp, { mode: "debug" });
  assert.equal(trace.mode, "debug");
  assert.equal(trace.decisions.length, EXPLAINABILITY_DECISION_SECTIONS.length);
  assert.ok(trace.mutations.length >= 7);
  assert.equal(trace.blueprintRecoverable, true);
  console.log("✔ debug mode — full trace of decisions, graph, mutations, confidence");
}

function testValidateExplainabilityReport() {
  const bp = explainableBlueprint();
  const report = validateExplainabilityArchitecture(bp, { mode: "debug" });
  assert.equal(report.explainable, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.violations.length, 0);
  assert.ok(report.debugTrace);
  assert.ok(report.humanReport.entries.length > 0);
  console.log("✔ explainability validation passes for fully traced blueprint");
}

function testBlueprintNotRecoverableWithoutAudit() {
  const bp = explainableBlueprint();
  bp.meta.audit = [];
  const report = validateExplainabilityArchitecture(bp);
  assert.equal(report.explainable, false);
  assert.ok(report.violations.some((v) => v.code === "BLUEPRINT_NOT_RECOVERABLE"));
  console.log("✔ blueprint without audit history cannot be recovered");
}

function testRunExplainabilityArchitecture() {
  const report = runExplainabilityArchitecture({ blueprint: explainableBlueprint() });
  assert.equal(report.explainable, true);
  assertExplainable(explainableBlueprint());
  console.log("✔ runExplainabilityArchitecture entry point works");
}

function testFailureCodes() {
  assert.equal(isExplainabilityFailure("MISSING_REASON"), true);
  assert.equal(isExplainabilityFailure("UNKNOWN"), false);
  console.log("✔ explainability failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testExplainabilityPipeline();
  testDecisionOwnership();
  testExplainableDecisionHasReason();
  testStructuredReasonMachineReadable();
  testDependencyTrace();
  testDecisionGraph();
  testConfidenceChainPropagation();
  testTraceabilityChain();
  testHumanReadableReport();
  testRetryExplainability();
  testRetryWithoutExplanationFails();
  testDebugTrace();
  testValidateExplainabilityReport();
  testBlueprintNotRecoverableWithoutAudit();
  testRunExplainabilityArchitecture();
  testFailureCodes();
  console.log("\nexplainability-architecture.spec.ts — all passed");
}

run();
