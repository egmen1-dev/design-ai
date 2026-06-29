import assert from "node:assert/strict";
import {
  advanceLifecycleStage,
  AgentContractError,
  BlueprintLifecycle,
  createEmptyRenderBlueprint,
  LifecycleManager,
  SectionState,
  MutationEngineError,
  storyDirectorAgent,
} from "./index";

function bootstrapToStoryStage() {
  const mgr = new LifecycleManager();
  let bp = createEmptyRenderBlueprint({ seed: 10, category: "home_appliances" });
  bp = advanceLifecycleStage(bp);
  bp = mgr.apply("product-analyzer", bp, {
    confidence: 90,
    decisionTrace: ["product analyzed"],
    warnings: [],
    updates: { product: { ...bp.product, shape: "generator", cutout: true } },
  }).blueprint;
  bp = advanceLifecycleStage(bp);
  bp = mgr.apply("creative-engine", bp, {
    confidence: 88,
    decisionTrace: ["creative defined"],
    warnings: [],
    updates: {
      creative: {
        goal: "Technical",
        audience: "homeowners",
        emotion: "security",
        marketplace: "WB",
        priceSegment: "middle",
      },
    },
  }).blueprint;
  bp = advanceLifecycleStage(bp);
  return bp;
}

async function testLifecycleManagerApplyStory() {
  const mgr = new LifecycleManager();
  const bp = bootstrapToStoryStage();
  assert.equal(bp.lifecycle.stage, BlueprintLifecycle.STORY_DEFINED);

  const { blueprint, mutation, result } = await mgr.runAgent(storyDirectorAgent, bp, {
    productCategory: "home_appliances",
    creativeGoal: "Technical",
  });
  assert.equal(result.story.hook, "Надёжность home_appliances");
  assert.ok(mutation.updatedSections.includes("story"));
  assert.ok(mutation.invalidatedSections.includes("scene"));
  assert.ok(mutation.invalidatedSections.includes("composition"));
  assert.equal(blueprint.lifecycle.sections.story, SectionState.READY);
  assert.equal(blueprint.lifecycle.sections.product, SectionState.LOCKED);
  console.log("✔ LifecycleManager apply + dirty propagation");
}

async function testAgentReceivesReadonlyBlueprint() {
  const bp = bootstrapToStoryStage();
  let mutated = false;
  const frozen = Object.freeze(structuredClone(bp));
  const proxy = new Proxy(frozen, {
    set() {
      mutated = true;
      return true;
    },
  });
  await storyDirectorAgent.execute(proxy as typeof bp, {
    productCategory: "x",
    creativeGoal: "Technical",
  });
  assert.equal(mutated, false);
  console.log("✔ agent receives readonly blueprint");
}

function testCriticsCannotWrite() {
  const mgr = new LifecycleManager();
  const bp = bootstrapToStoryStage();
  assert.throws(
    () =>
      mgr.apply("critics", bp, {
        confidence: 50,
        decisionTrace: [],
        warnings: [],
        updates: { story: { hook: "hack", customerProblem: "", customerDesire: "", visualPromise: "", emotionalTone: "calm", narrative: "" } },
      }),
    (err: unknown) => err instanceof MutationEngineError && err.code === "OWNERSHIP",
  );
  console.log("✔ critics write matrix empty");
}

function testChiefCannotWrite() {
  const mgr = new LifecycleManager();
  let bp = createEmptyRenderBlueprint({ seed: 2, category: "x" });
  bp.lifecycle.stage = BlueprintLifecycle.VALIDATED;
  bp.lifecycle.sections.constraints = SectionState.LOCKED;
  assert.throws(
    () =>
      mgr.apply("chief-design-director", bp, {
        confidence: 70,
        decisionTrace: [],
        warnings: [],
        updates: { validation: { chiefApproved: true } },
      }),
    (err: unknown) => err instanceof MutationEngineError && err.code === "OWNERSHIP",
  );
  console.log("✔ chief cannot mutate blueprint (rollback only)");
}

function testInvalidConfidence() {
  const mgr = new LifecycleManager();
  const bp = bootstrapToStoryStage();
  assert.throws(
    () =>
      mgr.apply("visual-story-director", bp, {
        confidence: 150,
        decisionTrace: [],
        warnings: [],
        updates: {
          story: {
            hook: "x",
            visualPromise: "p",
            narrative: "n",
            emotionalTone: "warm",
            customerProblem: "a",
            customerDesire: "b",
          },
        },
      }),
    AgentContractError,
  );
  console.log("✔ confidence 0..100 enforced");
}

function testFatalErrorStopsApply() {
  const mgr = new LifecycleManager();
  const bp = bootstrapToStoryStage();
  assert.throws(
    () =>
      mgr.apply("visual-story-director", bp, {
        confidence: 80,
        decisionTrace: [],
        warnings: [],
        errors: [{ kind: "fatal", code: "CORRUPT", message: "LOCKED section modified" }],
        updates: {
          story: {
            hook: "x",
            visualPromise: "p",
            narrative: "n",
            emotionalTone: "warm",
            customerProblem: "a",
            customerDesire: "b",
          },
        },
      }),
    AgentContractError,
  );
  console.log("✔ fatal errors block mutation");
}

async function run() {
  await testLifecycleManagerApplyStory();
  await testAgentReceivesReadonlyBlueprint();
  testCriticsCannotWrite();
  testChiefCannotWrite();
  testInvalidConfidence();
  testFatalErrorStopsApply();
  console.log("\nAll agent contract Chapter 3.2 specs passed.");
}

run();
