import assert from "node:assert/strict";
import {
  AgentRegistry,
  AgentRegistryError,
  AgentType,
  BlueprintLifecycle,
  LifecycleManager,
  advanceLifecycleStage,
  createEmptyRenderBlueprint,
  registrationFromAgent,
  storyDirectorAgent,
} from "./index";

function testUniqueAgentId() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);
  assert.throws(() => registry.registerBlueprintAgent(storyDirectorAgent), AgentRegistryError);
  console.log("✔ duplicate agent ID rejected");
}

function testRegisterLockedDuringPipeline() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);
  registry.lock();
  assert.throws(() => registry.registerBlueprintAgent(storyDirectorAgent), AgentRegistryError);
  registry.unlock();
  console.log("✔ registration forbidden while locked");
}

function testLazyFactoryCreation() {
  let created = 0;
  const registry = new AgentRegistry();
  registry.register({
    descriptor: {
      id: "visual-story-director",
      name: "Story Director",
      version: "2.4.1",
      stage: BlueprintLifecycle.STORY_DEFINED,
      type: AgentType.DIRECTOR,
      producer: "visual-story-director",
      enabled: true,
    },
    factory: {
      create: () => {
        created += 1;
        return storyDirectorAgent;
      },
    },
    capabilities: {
      supportsRetry: true,
      supportsParallel: false,
      requiresLLM: true,
      requiresVision: false,
    },
    metadata: {
      author: "design-ai",
      description: "Story director test factory",
      supportedStages: [BlueprintLifecycle.STORY_DEFINED],
      dependencies: [],
    },
  });
  assert.equal(created, 0);
  const agent = registry.getById("visual-story-director");
  assert.ok(agent);
  assert.equal(created, 1);
  registry.disposeInstances();
  registry.getById("visual-story-director");
  assert.equal(created, 2);
  console.log("✔ lazy factory creates on demand and disposes between runs");
}

function testDisabledAgentExcluded() {
  const registry = new AgentRegistry();
  registry.register({
    descriptor: {
      id: "visual-story-director",
      name: "Story Director",
      version: "1.0.0",
      stage: BlueprintLifecycle.STORY_DEFINED,
      type: AgentType.DIRECTOR,
      producer: "visual-story-director",
      enabled: false,
    },
    factory: { create: () => storyDirectorAgent },
    capabilities: {
      supportsRetry: true,
      supportsParallel: false,
      requiresLLM: false,
      requiresVision: false,
    },
    metadata: {
      author: "x",
      description: "disabled",
      supportedStages: [BlueprintLifecycle.STORY_DEFINED],
      dependencies: [],
    },
  });
  assert.equal(registry.getByStage(BlueprintLifecycle.STORY_DEFINED).length, 0);
  console.log("✔ disabled agents excluded from pipeline");
}

function testHealthCheckVisionRequirement() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent, {
    capabilities: { requiresVision: true },
  });
  const fail = registry.healthCheck({ visionEngineAvailable: false });
  assert.equal(fail.ok, false);
  assert.ok(fail.issues.some((i) => i.code === "VISION_UNAVAILABLE"));
  const pass = registry.healthCheck({ visionEngineAvailable: true });
  assert.equal(pass.ok, true);
  console.log("✔ health check enforces vision compatibility");
}

function testCyclicDependencyDetection() {
  const registry = new AgentRegistry();
  const base = registrationFromAgent(storyDirectorAgent);
  registry.register({
    ...base,
    metadata: { ...base.metadata, dependencies: ["scene-director"] },
  });
  registry.register({
    descriptor: {
      id: "scene-director",
      name: "Scene",
      version: "1.0.0",
      stage: BlueprintLifecycle.SCENE_DEFINED,
      type: AgentType.DIRECTOR,
      producer: "scene-director",
      enabled: true,
    },
    factory: {
      create: () =>
        ({
          ...storyDirectorAgent,
          id: "scene-director",
          stage: BlueprintLifecycle.SCENE_DEFINED,
        }) as typeof storyDirectorAgent,
    },
    capabilities: base.capabilities,
    metadata: { ...base.metadata, dependencies: ["visual-story-director"] },
  });
  const health = registry.healthCheck();
  assert.equal(health.ok, false);
  assert.ok(health.issues.some((i) => i.code === "CYCLIC_DEPENDENCY"));
  console.log("✔ cyclic agent dependencies detected");
}

function testRegistryReport() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);
  registry.recordRunResult("visual-story-director", {
    durationMs: 120,
    result: "success",
    confidence: 88,
  });
  const report = registry.getReport();
  assert.equal(report.agents.length, 1);
  assert.equal(report.agents[0]!.confidence, 88);
  console.log("✔ registry report captures run metadata");
}

async function testLifecycleManagerUsesRegistryOnly() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);
  registry.assertHealthy();
  const mgr = new LifecycleManager(undefined, { registry });

  let bp = createEmptyRenderBlueprint({ seed: 1, category: "appliances" });
  bp = advanceLifecycleStage(bp);
  bp = mgr.apply("product-analyzer", bp, {
    confidence: 90,
    decisionTrace: [],
    warnings: [],
    updates: { product: { shape: "box" } },
  }).blueprint;
  bp = advanceLifecycleStage(bp);
  bp = mgr.apply("creative-engine", bp, {
    confidence: 85,
    decisionTrace: [],
    warnings: [],
    updates: { creative: { audience: "home", emotion: "calm" } },
  }).blueprint;
  bp = advanceLifecycleStage(bp);

  await mgr.executeStage(bp, BlueprintLifecycle.STORY_DEFINED, {
    productCategory: "appliances",
    creativeGoal: "Technical",
  });

  const report = mgr.getRegistryReport();
  assert.ok(report.agents.some((a) => a.id === "visual-story-director"));
  console.log("✔ LifecycleManager resolves agents only via registry");
}

async function run() {
  testUniqueAgentId();
  testRegisterLockedDuringPipeline();
  testLazyFactoryCreation();
  testDisabledAgentExcluded();
  testHealthCheckVisionRequirement();
  testCyclicDependencyDetection();
  testRegistryReport();
  await testLifecycleManagerUsesRegistryOnly();
}

run().then(() => {
  console.log("\nAll agent registry Chapter 3.10 specs passed.");
});
