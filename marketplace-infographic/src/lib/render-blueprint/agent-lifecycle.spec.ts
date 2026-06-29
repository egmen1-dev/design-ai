/**
 * DESIGN AI v18 — Agent Lifecycle tests (Chapter 4.2)
 */
import assert from "node:assert/strict";
import {
  AGENT_LIFECYCLE_GUARANTEES,
  AGENT_LIFECYCLE_STAGE_ORDER,
  AGENT_LIFECYCLE_GOLDEN_RULE,
  AgentLifecycleStage,
  AgentLifecycleOrchestrator,
  AgentLifecycleSession,
  runAgentLifecycle,
  assertStageOrder,
  AgentLifecycleError,
  createEmptyRenderBlueprint,
  BlueprintLifecycle,
  universalStoryDirectorAgent,
  storyDirectorAgent,
  AgentRegistry,
  LifecycleManager,
  advanceLifecycleStage,
} from "./index";

function bootstrapToStoryStage() {
  const mgr = new LifecycleManager();
  let bp = createEmptyRenderBlueprint({ seed: 10, category: "electronics" });
  bp = advanceLifecycleStage(bp);
  bp = mgr.apply("product-analyzer", bp, {
    confidence: 90,
    decisionTrace: ["product analyzed"],
    warnings: [],
    updates: { product: { ...bp.product, shape: "rectangular", cutout: true } },
  }).blueprint;
  bp = advanceLifecycleStage(bp);
  bp = mgr.apply("creative-engine", bp, {
    confidence: 88,
    decisionTrace: ["creative defined"],
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

function testStageOrder() {
  assert.equal(AGENT_LIFECYCLE_STAGE_ORDER.length, 10);
  assert.equal(AGENT_LIFECYCLE_STAGE_ORDER[0], AgentLifecycleStage.REGISTERED);
  assert.equal(AGENT_LIFECYCLE_STAGE_ORDER[9], AgentLifecycleStage.DISPOSED);
  assert.throws(() => assertStageOrder([AgentLifecycleStage.REGISTERED], AgentLifecycleStage.EXECUTE));
  console.log("✔ agent lifecycle defines 10 mandatory ordered stages");
}

function testGuarantees() {
  assert.equal(AGENT_LIFECYCLE_GUARANTEES.length, 4);
  assert.ok(AGENT_LIFECYCLE_GOLDEN_RULE.includes("Lifecycle Manager"));
  console.log("✔ lifecycle guarantees and golden rule documented");
}

async function testFullLifecycle() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);

  const bp = bootstrapToStoryStage();
  assert.equal(bp.lifecycle.stage, BlueprintLifecycle.STORY_DEFINED);

  const orchestrator = new AgentLifecycleOrchestrator({ registry });
  const outcome = await orchestrator.run({
    agent: universalStoryDirectorAgent,
    blueprint: bp,
    pipelineStage: BlueprintLifecycle.STORY_DEFINED,
    pipelineId: "test-pipeline",
  });

  assert.equal(outcome.success, true);
  assert.equal(outcome.disposed, true);
  assert.equal(outcome.stages.length, 10);
  assert.equal(outcome.stages[0].stage, AgentLifecycleStage.REGISTERED);
  assert.equal(outcome.stages[9].stage, AgentLifecycleStage.DISPOSED);
  assert.ok((outcome.revisionAfter ?? 0) > (outcome.revisionBefore ?? 0));
  assert.ok(outcome.result?.mutations.length);
  console.log("✔ agent passes all 10 lifecycle stages through disposal");
}

async function testDiscoverySkipsWhenNotRequired() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const outcome = await runAgentLifecycle({
    agent: universalStoryDirectorAgent,
    blueprint: bp,
    pipelineStage: BlueprintLifecycle.NEW,
  });
  assert.equal(outcome.skipped, true);
  assert.equal(outcome.stages.length, 2);
  assert.equal(outcome.disposed, false);
  console.log("✔ discovery skips agent when pipeline stage does not require it");
}

function testOncePerStageGuarantee() {
  const session = new AgentLifecycleSession();
  session.assertOncePerStage("visual-story-director", BlueprintLifecycle.STORY_DEFINED);
  assert.throws(
    () => session.assertOncePerStage("visual-story-director", BlueprintLifecycle.STORY_DEFINED),
    AgentLifecycleError,
  );
  console.log("✔ agent executes at most once per pipeline stage");
}

async function testValidationFailureRollsBack() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);

  const bp = bootstrapToStoryStage();

  const failingEngine = {
    validate: () => ({
      revision: bp.meta.revision ?? 0,
      results: [],
      errors: [{ code: "TEST", section: "story" as const, severity: "fatal" as const, message: "forced validation fail" }],
      warnings: [],
      passed: false,
      score: 0,
      hasFatal: true,
      hasError: true,
    }),
    invalidateCache: () => {},
  } as unknown as import("./validation-engine").ValidationEngine;

  const revisionBefore = bp.meta.revision ?? 0;
  const outcome = await new AgentLifecycleOrchestrator({
    registry,
    validationEngine: failingEngine,
  }).run({
    agent: universalStoryDirectorAgent,
    blueprint: bp,
    pipelineStage: BlueprintLifecycle.STORY_DEFINED,
  });

  assert.equal(outcome.success, false);
  assert.equal(outcome.failure?.stage, AgentLifecycleStage.VALIDATION);
  assert.equal(outcome.blueprint.meta.revision, revisionBefore);
  console.log("✔ validation failure stops lifecycle with recovery stage recorded");
}

async function testNoStageSkipOnSuccess() {
  const registry = new AgentRegistry();
  registry.registerBlueprintAgent(storyDirectorAgent);
  const bp = bootstrapToStoryStage();
  const outcome = await runAgentLifecycle(
    {
      agent: universalStoryDirectorAgent,
      blueprint: bp,
      pipelineStage: BlueprintLifecycle.STORY_DEFINED,
    },
    { registry },
  );
  const names = outcome.stages.map((s) => s.stage);
  for (let i = 0; i < AGENT_LIFECYCLE_STAGE_ORDER.length; i++) {
    assert.equal(names[i], AGENT_LIFECYCLE_STAGE_ORDER[i]);
  }
  console.log("✔ successful run visits every stage in order without skips");
}

async function run() {
  testStageOrder();
  testGuarantees();
  await testFullLifecycle();
  await testDiscoverySkipsWhenNotRequired();
  testOncePerStageGuarantee();
  await testValidationFailureRollsBack();
  await testNoStageSkipOnSuccess();
  console.log("\nagent-lifecycle.spec.ts — all passed");
}

run();
