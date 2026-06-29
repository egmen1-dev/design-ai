/**
 * DESIGN AI v18 — Agent Memory Model tests (Chapter 4.7)
 */
import assert from "node:assert/strict";
import {
  AGENT_MEMORY_GOLDEN_RULE,
  AgentEcosystemCategory,
  MemoryLayer,
  MemoryOwner,
  buildAgentContextPackage,
  buildAgentMemoryPackage,
  createEmptyRenderBlueprint,
  createRuntimeMemoryScope,
  creativeAgentsUseLearningMemory,
  deserializeMemoryReplay,
  detectSharedMemoryPackage,
  explainMemoryUsage,
  getAgentMemoryAccess,
  layerIsMutable,
  memoryOwnerForLayer,
  projectAgentMemory,
  releaseAgentMemory,
  serializeMemoryReplay,
  validateAgentMemoryPackage,
  assertRuntimeMemoryOnlyMutation,
  getAgentCategory,
} from "./index";

function testGoldenRule() {
  assert.ok(AGENT_MEMORY_GOLDEN_RULE.includes("no long-term memory"));
  console.log("✔ golden rule — agents retain no memory after Execute()");
}

function testMemoryLayerOwnership() {
  assert.equal(memoryOwnerForLayer(MemoryLayer.RUNTIME), MemoryOwner.AGENT);
  assert.equal(memoryOwnerForLayer(MemoryLayer.WORKING), MemoryOwner.LIFECYCLE_MANAGER);
  assert.equal(memoryOwnerForLayer(MemoryLayer.KNOWLEDGE), MemoryOwner.KNOWLEDGE_ENGINE);
  assert.equal(memoryOwnerForLayer(MemoryLayer.REFERENCE), MemoryOwner.REFERENCE_PROVIDERS);
  assert.equal(memoryOwnerForLayer(MemoryLayer.LEARNING), MemoryOwner.DESIGN_MEMORY);
  assert.equal(layerIsMutable(MemoryLayer.RUNTIME), true);
  assert.equal(layerIsMutable(MemoryLayer.WORKING), false);
  console.log("✔ each memory layer has a defined owner and mutability policy");
}

function testSceneDirectorMemoryAccess() {
  const access = getAgentMemoryAccess("scene-director");
  assert.ok(access.layers.includes(MemoryLayer.WORKING));
  assert.ok(access.layers.includes(MemoryLayer.KNOWLEDGE));
  assert.ok(access.layers.includes(MemoryLayer.REFERENCE));
  assert.ok(!access.layers.includes(MemoryLayer.LEARNING));
  console.log("✔ scene director declares working, knowledge, and reference memory");
}

function testCommercialPhotoMemoryAccess() {
  const access = getAgentMemoryAccess("commercial-photo-director");
  assert.ok(access.layers.includes(MemoryLayer.WORKING));
  assert.ok(access.layers.includes(MemoryLayer.KNOWLEDGE));
  assert.ok(!access.layers.includes(MemoryLayer.REFERENCE));
  console.log("✔ commercial photo director uses working and knowledge only");
}

function testBuildIsolatedMemoryPackage() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const working = buildAgentContextPackage({ blueprint: bp, agentId: "lighting-director" });
  const memory = buildAgentMemoryPackage({ agentId: "lighting-director", working });
  assert.equal(memory.agentId, "lighting-director");
  assert.equal(Object.isFrozen(memory.working), true);
  assert.equal(Object.isFrozen(memory.knowledge), true);
  assert.ok(memory.reference.lightingCatalog);
  assert.deepEqual(memory.runtime, { locals: {}, scratch: [] });
  console.log("✔ lifecycle builds isolated per-agent memory package");
}

function testMemoryProjectionReducesPayload() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const working = buildAgentContextPackage({ blueprint: bp, agentId: "composition-director" });
  const memory = buildAgentMemoryPackage({ agentId: "composition-director", working });
  const projection = projectAgentMemory(memory);
  assert.ok(projection.knowledgeTopics.includes("compositionLaws"));
  assert.ok(projection.layers.includes(MemoryLayer.LEARNING));
  assert.ok(projection.projectedBytes > 0);
  console.log("✔ memory projection exposes only declared topics");
}

function testRuntimeMemoryScopeAndRelease() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const working = buildAgentContextPackage({ blueprint: bp, agentId: "scene-director" });
  const memory = buildAgentMemoryPackage({ agentId: "scene-director", working });
  const runtime = createRuntimeMemoryScope(memory);
  runtime.locals.step = "analyze";
  runtime.scratch.push({ temp: true });
  assert.equal(runtime.locals.step, "analyze");

  releaseAgentMemory(memory);
  assert.deepEqual(memory.runtime, { locals: {}, scratch: [] });
  console.log("✔ runtime memory destroyed and package released after Execute()");
}

function testReadOnlyPolicyBlocksNonRuntimeMutation() {
  assert.throws(
    () => assertRuntimeMemoryOnlyMutation(MemoryLayer.KNOWLEDGE, "scene-director"),
    /cannot mutate knowledge/,
  );
  assert.doesNotThrow(() => assertRuntimeMemoryOnlyMutation(MemoryLayer.RUNTIME, "scene-director"));
  console.log("✔ only runtime memory may be mutated by agent");
}

function testValidateMemoryPackage() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const working = buildAgentContextPackage({ blueprint: bp, agentId: "visual-story-director" });
  const memory = buildAgentMemoryPackage({ agentId: "visual-story-director", working });
  const report = validateAgentMemoryPackage(memory);
  assert.equal(report.valid, true);
  console.log("✔ memory validation passes for complete package");
}

function testMemoryReplaySerialization() {
  const bp = createEmptyRenderBlueprint({ category: "electronics", seed: 11 });
  const working = buildAgentContextPackage({ blueprint: bp, agentId: "composition-director" });
  const memory = buildAgentMemoryPackage({ agentId: "composition-director", working });
  const json = serializeMemoryReplay(memory);
  const replay = deserializeMemoryReplay(json);
  assert.equal(replay.agentId, "composition-director");
  assert.equal(replay.working.blueprint.meta.seed, 11);
  assert.ok(replay.accessedLayers.includes(MemoryLayer.LEARNING));
  console.log("✔ memory state serializes for replay and regression");
}

function testExplainabilityReport() {
  const report = explainMemoryUsage("lighting-director");
  const working = report.entries.find((e) => e.layer === MemoryLayer.WORKING);
  const knowledge = report.entries.find((e) => e.layer === MemoryLayer.KNOWLEDGE);
  assert.equal(working?.used, true);
  assert.equal(knowledge?.used, true);
  assert.equal(working?.owner, MemoryOwner.LIFECYCLE_MANAGER);
  console.log("✔ explainability lists declared memory layers per agent");
}

function testCreativeAgentsMayUseLearningMemory() {
  const agents = creativeAgentsUseLearningMemory();
  assert.ok(agents.includes("visual-story-director"));
  assert.equal(getAgentCategory("visual-story-director"), AgentEcosystemCategory.CREATIVE_DIRECTOR);

  const compositionAccess = getAgentMemoryAccess("composition-director");
  assert.ok(compositionAccess.layers.includes(MemoryLayer.LEARNING));
  console.log("✔ learning memory available to creative and technical agents that declare it");
}

function testDetectSharedWorkingMemory() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const working = buildAgentContextPackage({ blueprint: bp });
  const a = buildAgentMemoryPackage({ agentId: "scene-director", working });
  const b = buildAgentMemoryPackage({ agentId: "composition-director", working });
  const violations = detectSharedMemoryPackage(a, b);
  assert.ok(violations.some((v) => v.code === "SHARED_MEMORY"));
  console.log("✔ shared working memory between agents is forbidden");
}

function run() {
  testGoldenRule();
  testMemoryLayerOwnership();
  testSceneDirectorMemoryAccess();
  testCommercialPhotoMemoryAccess();
  testBuildIsolatedMemoryPackage();
  testMemoryProjectionReducesPayload();
  testRuntimeMemoryScopeAndRelease();
  testReadOnlyPolicyBlocksNonRuntimeMutation();
  testValidateMemoryPackage();
  testMemoryReplaySerialization();
  testExplainabilityReport();
  testCreativeAgentsMayUseLearningMemory();
  testDetectSharedWorkingMemory();
  console.log("\nagent-memory.spec.ts — all passed");
}

run();
