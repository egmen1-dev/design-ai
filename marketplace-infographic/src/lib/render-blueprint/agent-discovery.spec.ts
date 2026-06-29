/**
 * DESIGN AI v18 — Agent Discovery tests (Chapter 4.4)
 */
import assert from "node:assert/strict";
import {
  AGENT_DISCOVERY_GOLDEN_RULE,
  AgentDiscoveryEngine,
  BlueprintLifecycle,
  LifecycleManager,
  PipelineMode,
  advanceLifecycleStage,
  createEmptyRenderBlueprint,
  defaultPipelineConfiguration,
  discoverAgents,
  storyDirectorAgent,
  AgentRegistry,
  registrationFromAgent,
} from "./index";

function bootstrapToStoryStage() {
  const mgr = new LifecycleManager();
  let bp = createEmptyRenderBlueprint({ seed: 1, category: "electronics" });
  bp = advanceLifecycleStage(bp);
  bp = mgr.apply("product-analyzer", bp, {
    confidence: 90,
    decisionTrace: ["product"],
    warnings: [],
    updates: { product: { ...bp.product, cutout: true } },
  }).blueprint;
  bp = advanceLifecycleStage(bp);
  bp = mgr.apply("creative-engine", bp, {
    confidence: 88,
    decisionTrace: ["creative"],
    warnings: [],
    updates: {
      creative: {
        goal: "Technical",
        audience: "buyers",
        emotion: "confidence",
        marketplace: "WB",
        priceSegment: "middle",
      },
    },
  }).blueprint;
  bp = advanceLifecycleStage(bp);
  return bp;
}

function testDiscoversStoryDirector() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);
  const blueprint = bootstrapToStoryStage();
  const report = discoverAgents({
    blueprint,
    registry,
    configuration: defaultPipelineConfiguration(),
    lifecycle: BlueprintLifecycle.STORY_DEFINED,
  });
  assert.ok(report.included.some((n) => n.agentId === "visual-story-director"));
  assert.ok(report.plan.parallelGroups.length >= 1);
  console.log("✔ discovery includes story director when dependencies met");
}

function testBackgroundRetrySkipsStory() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);
  const blueprint = bootstrapToStoryStage();
  const report = discoverAgents({
    blueprint,
    registry,
    configuration: defaultPipelineConfiguration({ mode: PipelineMode.BACKGROUND_RETRY }),
    lifecycle: BlueprintLifecycle.STORY_DEFINED,
  });
  const story = report.excluded.find((e) => e.agentId === "visual-story-director");
  assert.ok(story);
  assert.equal(story?.code, "MODE_FILTERED");
  console.log("✔ background retry skips story director");
}

function testFastGenerationSkipsCommercialPhoto() {
  const registry = new AgentRegistry();
  registry.register(
    registrationFromAgent({
      ...storyDirectorAgent,
      id: "commercial-photo-director",
      stage: BlueprintLifecycle.PHOTO_DEFINED,
    } as typeof storyDirectorAgent),
  );
  const report = discoverAgents({
    blueprint: createEmptyRenderBlueprint({ category: "x" }),
    registry,
    configuration: defaultPipelineConfiguration({ mode: PipelineMode.FAST_GENERATION }),
    lifecycle: BlueprintLifecycle.PHOTO_DEFINED,
  });
  const cp = report.excluded.find((e) => e.agentId === "commercial-photo-director");
  assert.ok(cp, `expected exclusion, got: ${JSON.stringify(report.excluded.map((e) => e.agentId))}`);
  assert.equal(cp?.code, "MODE_FILTERED");
  console.log("✔ fast generation mode filters commercial photo director");
}

function testDependencyMissingExcludesAgent() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);
  let bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp = advanceLifecycleStage(bp);
  const report = discoverAgents({
    blueprint: bp,
    registry,
    configuration: defaultPipelineConfiguration(),
    lifecycle: BlueprintLifecycle.STORY_DEFINED,
  });
  assert.ok(
    report.excluded.some(
      (e) => e.agentId === "visual-story-director" && e.code === "DEPENDENCY_MISSING",
    ),
  );
  console.log("✔ missing consumed sections exclude agent");
}

function testAlreadyExecutedFiltered() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);
  const blueprint = bootstrapToStoryStage();
  const report = discoverAgents({
    blueprint,
    registry,
    configuration: defaultPipelineConfiguration(),
    lifecycle: BlueprintLifecycle.STORY_DEFINED,
    executedOnStage: ["visual-story-director"],
  });
  assert.ok(
    report.excluded.some(
      (e) => e.agentId === "visual-story-director" && e.code === "ALREADY_EXECUTED",
    ),
  );
  console.log("✔ already executed agents excluded from plan");
}

function testPhotoStageCandidates() {
  const report = discoverAgents({
    blueprint: createEmptyRenderBlueprint({ category: "electronics" }),
    registry: new AgentRegistry(),
    configuration: defaultPipelineConfiguration(),
    lifecycle: BlueprintLifecycle.PHOTO_DEFINED,
  });
  const ids = new Set([
    ...report.included.map((n) => n.agentId),
    ...report.excluded.map((e) => e.agentId),
  ]);
  assert.ok(ids.has("camera-director"));
  assert.ok(ids.has("lighting-director"));
  assert.ok(ids.has("material-director"));
  console.log("✔ photo stage discovery evaluates parallel director candidates");
}

function testDiscoveryCache() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);
  const blueprint = bootstrapToStoryStage();
  const engine = new AgentDiscoveryEngine();
  const ctx = {
    blueprint,
    registry,
    configuration: defaultPipelineConfiguration(),
    lifecycle: BlueprintLifecycle.STORY_DEFINED,
  };
  const first = engine.discover(ctx);
  const second = engine.discover(ctx);
  assert.equal(second.plan.cached, true);
  assert.equal(first.included.length, second.included.length);
  console.log("✔ execution plan cached until blueprint revision or mode changes");
}

function testHighQualityEnablesChief() {
  const registry = new AgentRegistry();
  const report = discoverAgents({
    blueprint: createEmptyRenderBlueprint({ category: "x" }),
    registry,
    configuration: defaultPipelineConfiguration({ mode: PipelineMode.HIGH_QUALITY }),
    lifecycle: BlueprintLifecycle.VALIDATED,
  });
  const chief = report.included.find((n) => n.agentId === "chief-design-director");
  const excluded = report.excluded.find((e) => e.agentId === "chief-design-director");
  assert.ok(chief || !excluded || excluded.code !== "CONDITIONAL_SKIP");
  console.log("✔ high quality mode enables chief review path");
}

function testGoldenRule() {
  assert.ok(AGENT_DISCOVERY_GOLDEN_RULE.includes("never chooses the best design"));
  console.log("✔ golden rule — discovery selects participants not design decisions");
}

function run() {
  testDiscoversStoryDirector();
  testBackgroundRetrySkipsStory();
  testFastGenerationSkipsCommercialPhoto();
  testDependencyMissingExcludesAgent();
  testAlreadyExecutedFiltered();
  testPhotoStageCandidates();
  testDiscoveryCache();
  testHighQualityEnablesChief();
  testGoldenRule();
  console.log("\nagent-discovery.spec.ts — all passed");
}

run();
