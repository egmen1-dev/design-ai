/**
 * DESIGN AI v18 — Agent Ecosystem Summary tests (Chapter 4.28)
 */
import assert from "node:assert/strict";
import {
  AGENT_ECOSYSTEM_SUMMARY_VERSION,
  AGENT_ECOSYSTEM_SUMMARY_GOLDEN_RULE,
  ECOSYSTEM_CORE_PHILOSOPHY,
  ECOSYSTEM_PIPELINE,
  ECOSYSTEM_LAYERS,
  ENGINEERING_PRINCIPLES,
  EcosystemLayer,
  EngineeringPrinciple,
  getPipelineStage,
  getLayerDefinition,
  agentsInLayer,
  buildScalabilityCapabilities,
  buildExpectedOutcomes,
  buildCohesionChecks,
  validatePipelineCompleteness,
  validateAgentIndependence,
  validateAgentEcosystemSummary,
  assertEcosystemComplete,
  runAgentEcosystemSummary,
  isEcosystemSummaryFailure,
  DESIGN_MEMORY_ID,
  CHIEF_DESIGN_DIRECTOR_ID,
  frozenTestBlueprint,
  LightingStyle,
  StoryType,
  BlueprintLifecycle,
} from "./index";

function ecosystemBlueprint() {
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.story.emotionalTone = "luxury";
  bp.story.hook = "Premium kitchen hero";
  bp.lighting.lightingStyle = LightingStyle.LUXURY_WARM;
  bp.lighting.lightingScheme = "luxury_side_light";
  bp.creative.goal = "Premium";
  bp.lifecycle.stage = BlueprintLifecycle.FROZEN;
  bp.meta.audit = [
    { agentId: "visual-story-director", section: "story", action: "set", at: Date.now() },
    { agentId: "lighting-director", section: "lighting", action: "set", at: Date.now() },
  ];
  return bp;
}

function testGoldenRule() {
  assert.ok(AGENT_ECOSYSTEM_SUMMARY_GOLDEN_RULE.includes("not the product"));
  assert.ok(AGENT_ECOSYSTEM_SUMMARY_GOLDEN_RULE.includes("Agent Ecosystem"));
  assert.equal(AGENT_ECOSYSTEM_SUMMARY_VERSION, "4.28.0");
  console.log("✔ final golden rule — ecosystem is the asset, provider is the executor");
}

function testCorePhilosophy() {
  assert.ok(ECOSYSTEM_CORE_PHILOSOPHY.includes("not one big prompt"));
  assert.ok(ECOSYSTEM_CORE_PHILOSOPHY.includes("specialized"));
  console.log("✔ core philosophy — specialized agents, each knows their domain");
}

function testEcosystemPipeline() {
  assert.ok(ECOSYSTEM_PIPELINE.length >= 18);
  const story = getPipelineStage("visual-story-director")!;
  assert.equal(story.layer, EcosystemLayer.CREATIVE);
  assert.equal(story.agentId, "visual-story-director");
  const memory = getPipelineStage("design-memory")!;
  assert.equal(memory.agentId, DESIGN_MEMORY_ID);
  assert.equal(memory.layer, EcosystemLayer.LEARNING);
  const chief = getPipelineStage("chief-design-director")!;
  assert.equal(chief.agentId, CHIEF_DESIGN_DIRECTOR_ID);
  console.log("✔ ecosystem pipeline — business goal through directors to design memory");
}

function testLayeredArchitecture() {
  assert.equal(ECOSYSTEM_LAYERS.length, 6);
  const creative = getLayerDefinition(EcosystemLayer.CREATIVE)!;
  assert.ok(creative.agents.includes("visual-story-director"));
  assert.ok(creative.agents.includes("scene-director"));
  const learning = getLayerDefinition(EcosystemLayer.LEARNING)!;
  assert.deepEqual(learning.agents, [DESIGN_MEMORY_ID]);
  console.log("✔ layered architecture — business, creative, technical, rendering, validation, learning");
}

function testBlueprintIsHeart() {
  const blueprintStage = getPipelineStage("render-blueprint")!;
  assert.ok(blueprintStage.blueprintSections!.length >= 6);
  const adapterStage = getPipelineStage("render-adapter")!;
  assert.ok(adapterStage.blueprintSections!.includes("render"));
  const cohesion = buildCohesionChecks();
  assert.ok(cohesion.find((c) => c.id === "blueprint-is-heart")!.passed);
  console.log("✔ blueprint is the heart — prompt is temporary compilation only");
}

function testEngineeringPrinciples() {
  assert.equal(ENGINEERING_PRINCIPLES.length, 6);
  const ids = ENGINEERING_PRINCIPLES.map((p) => p.id);
  assert.ok(ids.includes(EngineeringPrinciple.SINGLE_RESPONSIBILITY));
  assert.ok(ids.includes(EngineeringPrinciple.EXPLAINABILITY));
  assert.ok(ids.includes(EngineeringPrinciple.PROVIDER_INDEPENDENCE));
  assert.ok(ids.includes(EngineeringPrinciple.CONTINUOUS_LEARNING));
  console.log("✔ engineering principles — six pillars of agent ecosystem");
}

function testAgentIndependence() {
  const violations = validateAgentIndependence();
  assert.equal(violations.length, 0);
  const creativeAgents = agentsInLayer(EcosystemLayer.CREATIVE);
  assert.ok(creativeAgents.length >= 4);
  console.log("✔ agent independence — each director owns one section, no cross-mutation");
}

function testPipelineCompleteness() {
  const violations = validatePipelineCompleteness();
  assert.equal(violations.length, 0);
  console.log("✔ pipeline completeness — all required stages present");
}

function testDesignMemoryPostPipeline() {
  const memoryIdx = ECOSYSTEM_PIPELINE.findIndex((s) => s.id === "design-memory");
  const approvedIdx = ECOSYSTEM_PIPELINE.findIndex((s) => s.id === "approved-result");
  assert.ok(memoryIdx > approvedIdx);
  console.log("✔ design memory runs after approved result — learning is post-pipeline");
}

function testScalability() {
  const caps = buildScalabilityCapabilities();
  assert.ok(caps.length >= 6);
  assert.ok(caps.every((c) => c.supported));
  assert.ok(caps.some((c) => c.extension === "new-provider"));
  console.log("✔ scalability — new directors, critics, providers, marketplaces without rewrite");
}

function testExpectedOutcomes() {
  const outcomes = buildExpectedOutcomes(ecosystemBlueprint());
  assert.ok(outcomes.length >= 8);
  assert.ok(outcomes.find((o) => o.id === "sell-products")!.validated);
  assert.ok(outcomes.find((o) => o.id === "multi-provider")!.validated);
  console.log("✔ expected outcomes — commercial focus, extensibility, continuous learning");
}

function testCohesionChecks() {
  const checks = buildCohesionChecks({ implementedChapters: ["4.19", "4.20", "4.21", "4.25", "4.26", "4.27", "4.28"] });
  assert.ok(checks.every((c) => c.passed));
  assert.ok(checks.some((c) => c.id === "explainable-ai"));
  assert.ok(checks.some((c) => c.id === "provider-independence"));
  console.log("✔ cohesion checks — explainability, provider independence, design memory integrated");
}

function testValidateSummary() {
  const report = validateAgentEcosystemSummary(ecosystemBlueprint(), {
    implementedChapters: ["4.19", "4.20", "4.21", "4.22", "4.23", "4.24", "4.25", "4.26", "4.27", "4.28"],
  });
  assert.equal(report.complete, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.violations.length, 0);
  assert.equal(report.pipeline.length, ECOSYSTEM_PIPELINE.length);
  assert.equal(report.layers.length, 6);
  console.log("✔ ecosystem summary validation passes for complete architecture");
}

function testValidateWithoutBlueprint() {
  const report = validateAgentEcosystemSummary(undefined, {
    implementedChapters: ["4.19", "4.20", "4.21", "4.22", "4.23", "4.24", "4.25", "4.26", "4.27", "4.28"],
  });
  assert.equal(report.complete, true);
  console.log("✔ ecosystem summary validates architecture without requiring live blueprint");
}

function testRunAgentEcosystemSummary() {
  const report = runAgentEcosystemSummary({
    blueprint: ecosystemBlueprint(),
    ctx: { implementedChapters: ["4.19", "4.20", "4.21", "4.22", "4.23", "4.24", "4.25", "4.26", "4.27", "4.28"] },
  });
  assert.equal(report.complete, true);
  assertEcosystemComplete(ecosystemBlueprint(), {
    implementedChapters: ["4.19", "4.20", "4.21", "4.22", "4.23", "4.24", "4.25", "4.26", "4.27", "4.28"],
  });
  console.log("✔ runAgentEcosystemSummary entry point works");
}

function testFailureCodes() {
  assert.equal(isEcosystemSummaryFailure("INCOMPLETE_PIPELINE"), true);
  assert.equal(isEcosystemSummaryFailure("UNKNOWN"), false);
  console.log("✔ ecosystem summary failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testCorePhilosophy();
  testEcosystemPipeline();
  testLayeredArchitecture();
  testBlueprintIsHeart();
  testEngineeringPrinciples();
  testAgentIndependence();
  testPipelineCompleteness();
  testDesignMemoryPostPipeline();
  testScalability();
  testExpectedOutcomes();
  testCohesionChecks();
  testValidateSummary();
  testValidateWithoutBlueprint();
  testRunAgentEcosystemSummary();
  testFailureCodes();
  console.log("\nagent-ecosystem-summary.spec.ts — all passed");
}

run();
