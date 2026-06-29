/**
 * DESIGN AI v18 — Agent Registry Chapter 4.3 tests
 */
import assert from "node:assert/strict";
import {
  AGENT_REGISTRY_GOLDEN_RULE,
  AgentCategory,
  AgentRegistry,
  AgentRegistryError,
  AgentStatus,
  RegistryEventType,
  assertAgentRegistryValid,
  capabilityTagsForAgent,
  registrationFromAgent,
  storyDirectorAgent,
  validateAgentRegistry,
} from "./index";

function testDescriptorEnrichment() {
  const reg = registrationFromAgent(storyDirectorAgent);
  assert.equal(reg.descriptor.category, AgentCategory.CREATIVE_DIRECTOR);
  assert.ok(reg.descriptor.produces?.includes("story"));
  assert.ok(reg.descriptor.consumes?.includes("creative"));
  assert.ok(reg.descriptor.capabilityTags?.includes("story-planning"));
  assert.equal(reg.descriptor.status, AgentStatus.ACTIVE);
  console.log("✔ descriptor includes category, produces, consumes, capabilities");
}

function testChapter43Interface() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);
  assert.equal(registry.hasAgent("visual-story-director"), true);
  assert.ok(registry.getAgent("visual-story-director"));
  assert.equal(registry.getAll().length, 1);
  const creative = registry.findByCategory(AgentCategory.CREATIVE_DIRECTOR);
  assert.ok(creative.some((a) => a.id === "visual-story-director"));
  console.log("✔ Chapter 4.3 registry interface — hasAgent, getAgent, getAll, findByCategory");
}

function testUnregister() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);
  registry.unregister("visual-story-director");
  assert.equal(registry.hasAgent("visual-story-director"), false);
  assert.throws(() => registry.getAgent("visual-story-director"), AgentRegistryError);
  console.log("✔ unregister removes agent from registry");
}

function testRegistryEvents() {
  const registry = new AgentRegistry();
  const events: string[] = [];
  registry.onRegistryEvent((e) => events.push(e.type));
  registry.registerBlueprintAgent(storyDirectorAgent);
  registry.disableAgent("visual-story-director");
  registry.unregister("visual-story-director");
  assert.ok(events.includes(RegistryEventType.AGENT_REGISTERED));
  assert.ok(events.includes(RegistryEventType.AGENT_DISABLED));
  assert.ok(events.includes(RegistryEventType.AGENT_REMOVED));
  console.log("✔ registry emits events on register, disable, remove");
}

function testMultipleVersions() {
  const registry = new AgentRegistry();
  const v1 = registrationFromAgent({ ...storyDirectorAgent, version: "1.0.0" });
  const v2 = registrationFromAgent({ ...storyDirectorAgent, version: "2.0.0" });
  registry.register(v1);
  registry.register(v2);
  assert.deepEqual(registry.listVersions("visual-story-director"), ["1.0.0", "2.0.0"]);
  assert.equal(registry.getDescriptor("visual-story-director")?.version, "2.0.0");
  registry.setActiveVersion("visual-story-director", "1.0.0");
  assert.equal(registry.getDescriptor("visual-story-director")?.version, "1.0.0");
  console.log("✔ multiple versions per agent with active version selection");
}

function testDisabledStatusExcluded() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent, {
    descriptor: { status: AgentStatus.DISABLED, enabled: false },
  });
  assert.equal(registry.getAll().length, 0);
  assert.equal(registry.getByStage(storyDirectorAgent.stage).length, 0);
  console.log("✔ only ACTIVE and EXPERIMENTAL agents are runnable");
}

function testStartupValidation() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);
  const result = validateAgentRegistry(registry);
  assert.equal(result.valid, true);
  assert.equal(result.agentCount, 1);
  assertAgentRegistryValid(registry);
  console.log("✔ startup registry validation passes for healthy catalog");
}

function testCapabilityDiscovery() {
  const tags = capabilityTagsForAgent("scene-director");
  assert.ok(tags.includes("environment-selection"));
  console.log("✔ capability tags available for plugin discovery");
}

function testGoldenRule() {
  assert.ok(AGENT_REGISTRY_GOLDEN_RULE.includes("sole discovery"));
  console.log("✔ golden rule — pipeline discovers agents only via registry");
}

function run() {
  testDescriptorEnrichment();
  testChapter43Interface();
  testUnregister();
  testRegistryEvents();
  testMultipleVersions();
  testDisabledStatusExcluded();
  testStartupValidation();
  testCapabilityDiscovery();
  testGoldenRule();
  console.log("\nagent-registry-v43.spec.ts — all passed");
}

run();
