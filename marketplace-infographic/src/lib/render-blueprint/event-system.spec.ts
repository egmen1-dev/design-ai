import assert from "node:assert/strict";
import {
  EventBus,
  EventBusError,
  DesignEventType,
  EventCategory,
  createEmptyRenderBlueprint,
  BlueprintLifecycle,
  LifecycleManager,
  advanceLifecycleStage,
  storyDirectorAgent,
} from "./index";

function testPublishSubscribe() {
  const bus = new EventBus({ pipelineId: "pipe-1" });
  const received: string[] = [];
  bus.subscribe(DesignEventType.StageStarted, (e) => received.push(e.type));
  bus.publish({
    type: DesignEventType.StageStarted,
    revision: 0,
    metadata: { blueprintId: "bp-1", stage: BlueprintLifecycle.NEW, producer: "test" },
  });
  assert.equal(received.length, 1);
  console.log("✔ publish delivers to subscriber");
}

function testCategoryFilter() {
  const bus = new EventBus();
  const validation: string[] = [];
  const agent: string[] = [];
  bus.subscribe(EventCategory.VALIDATION, (e) => validation.push(e.type));
  bus.subscribe(EventCategory.AGENT, (e) => agent.push(e.type));
  bus.publish({
    type: DesignEventType.ValidationPassed,
    revision: 1,
    metadata: { blueprintId: "bp", stage: BlueprintLifecycle.STORY_DEFINED, producer: "v" },
    payload: { passed: true, score: 100, errorCount: 0, warningCount: 0, revision: 1 },
  });
  bus.publish({
    type: DesignEventType.AgentStarted,
    revision: 1,
    metadata: { blueprintId: "bp", stage: BlueprintLifecycle.STORY_DEFINED, producer: "a" },
    payload: { agentId: "story-director" },
  });
  assert.equal(validation.length, 1);
  assert.equal(agent.length, 1);
  console.log("✔ category filter isolates subscribers");
}

function testSubscribeLockedDuringPipeline() {
  const bus = new EventBus();
  bus.lock();
  assert.throws(() => bus.subscribe(DesignEventType.StageStarted, () => {}), EventBusError);
  bus.unlock();
  console.log("✔ subscribe blocked while pipeline locked");
}

function testPayloadRejectsBlueprint() {
  const bus = new EventBus();
  assert.throws(
    () =>
      bus.publish({
        type: DesignEventType.StageStarted,
        revision: 0,
        metadata: { blueprintId: "bp", stage: BlueprintLifecycle.NEW, producer: "x" },
        payload: { blueprint: "forbidden" as unknown as string },
      }),
    EventBusError,
  );
  console.log("✔ payload rejects RenderBlueprint references");
}

function testEventImmutability() {
  const bus = new EventBus();
  const event = bus.publish({
    type: DesignEventType.PipelineStarted,
    revision: 0,
    metadata: { blueprintId: "bp", stage: BlueprintLifecycle.NEW, producer: "system" },
  });
  assert.throws(() => {
    (event as { revision: number }).revision = 99;
  });
  console.log("✔ published events are immutable");
}

function testEventOrdering() {
  const bus = new EventBus();
  bus.publish({
    type: DesignEventType.StageStarted,
    revision: 0,
    metadata: { blueprintId: "bp", stage: BlueprintLifecycle.NEW, producer: "x" },
  });
  bus.publish({
    type: DesignEventType.StageCompleted,
    revision: 1,
    metadata: { blueprintId: "bp", stage: BlueprintLifecycle.NEW, producer: "x" },
  });
  bus.publish({
    type: DesignEventType.SnapshotCreated,
    revision: 1,
    metadata: { blueprintId: "bp", stage: BlueprintLifecycle.NEW, producer: "x" },
    payload: { snapshotId: "snap-1" },
  });
  assert.ok(bus.verifyOrdering());
  const replay = bus.replay();
  assert.equal(replay.count, 3);
  console.log("✔ events maintain publish order and replay");
}

function testPipelineCorrelationId() {
  const bus = new EventBus({ pipelineId: "corr-42" });
  const event = bus.publish({
    type: DesignEventType.PipelineStarted,
    revision: 0,
    metadata: { blueprintId: "bp", stage: BlueprintLifecycle.NEW, producer: "system" },
  });
  assert.equal(event.metadata.pipelineId, "corr-42");
  console.log("✔ pipelineId correlates all events");
}

function testHandlerFailurePublishesSystemEvent() {
  const bus = new EventBus();
  bus.subscribe(DesignEventType.StageStarted, () => {
    throw new Error("handler boom");
  });
  bus.publish({
    type: DesignEventType.StageStarted,
    revision: 0,
    metadata: { blueprintId: "bp", stage: BlueprintLifecycle.NEW, producer: "x" },
  });
  assert.ok(bus.getLog().some((e) => e.type === DesignEventType.EventHandlerFailed));
  console.log("✔ handler failure publishes EventHandlerFailed");
}

async function testLifecycleManagerPublishesAgentEvents() {
  const bus = new EventBus();
  const mgr = new LifecycleManager(undefined, { eventBus: bus });
  mgr.registerAgent(storyDirectorAgent);

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

  const types = bus.getLog().map((e) => e.type);
  assert.ok(types.includes(DesignEventType.PipelineStarted));
  assert.ok(types.includes(DesignEventType.AgentStarted));
  assert.ok(types.includes(DesignEventType.AgentCompleted));
  assert.ok(types.includes(DesignEventType.ValidationPassed));
  assert.ok(types.includes(DesignEventType.MutationApplied));
  console.log("✔ LifecycleManager routes agent/validation/mutation events");
}

function testLegacyOnEventStillWorks() {
  const mgr = new LifecycleManager();
  const received: string[] = [];
  mgr.onEvent((e) => received.push(e.type));
  const bp = createEmptyRenderBlueprint({ seed: 99, category: "x" });
  bp.lifecycle.stage = BlueprintLifecycle.FINISHED;
  mgr.finishPipeline(bp);
  assert.ok(received.includes("PipelineFinished"));
  console.log("✔ legacy onEvent receives lifecycle-mapped publishes");
}

async function run() {
  testPublishSubscribe();
  testCategoryFilter();
  testSubscribeLockedDuringPipeline();
  testPayloadRejectsBlueprint();
  testEventImmutability();
  testEventOrdering();
  testPipelineCorrelationId();
  testHandlerFailurePublishesSystemEvent();
  testLegacyOnEventStillWorks();
  await testLifecycleManagerPublishesAgentEvents();
}

run().then(() => {
  console.log("\nAll event system Chapter 3.9 specs passed.");
});
