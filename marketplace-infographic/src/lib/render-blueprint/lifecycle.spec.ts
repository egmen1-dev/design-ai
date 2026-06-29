import assert from "node:assert/strict";
import {
  BlueprintLifecycle,
  SectionState,
  advanceLifecycleStage,
  advanceToRendering,
  applyAgentPatch,
  BlueprintLockedError,
  canTransitionSectionState,
  createEmptyRenderBlueprint,
  LifecycleTransitionError,
  propagateDirty,
  rollbackToSnapshot,
} from "./index";

function testSectionStateTransitions() {
  assert.equal(canTransitionSectionState(SectionState.EMPTY, SectionState.DIRTY), true);
  assert.equal(canTransitionSectionState(SectionState.LOCKED, SectionState.DIRTY), false);
  console.log("✔ section state transitions forward only");
}

function testNewToProductStage() {
  let bp = createEmptyRenderBlueprint({ seed: 1, category: "garden_tools" });
  assert.equal(bp.lifecycle.stage, BlueprintLifecycle.NEW);
  bp = advanceLifecycleStage(bp);
  assert.equal(bp.lifecycle.stage, BlueprintLifecycle.PRODUCT_ANALYZED);
  console.log("✔ NEW → PRODUCT_ANALYZED");
}

function testProductLockAfterStage() {
  let bp = createEmptyRenderBlueprint({
    seed: 2,
    category: "garden_tools",
    subCategory: "trimmer",
    dominantColor: ["#111"],
  });
  bp = advanceLifecycleStage(bp);
  bp = applyAgentPatch(bp, {
    agentId: "product-analyzer",
    section: "product",
    data: { shape: "compact", cutout: true },
  });
  bp = advanceLifecycleStage(bp);
  assert.equal(bp.lifecycle.sections.product, SectionState.LOCKED);
  assert.equal(bp.lifecycle.stage, BlueprintLifecycle.CREATIVE_DEFINED);
  assert.throws(
    () =>
      applyAgentPatch(bp, {
        agentId: "product-analyzer",
        section: "product",
        data: { shape: "changed" },
      }),
    BlueprintLockedError,
  );
  console.log("✔ product LOCKED after PRODUCT_ANALYZED");
}

function testDirtyPropagationFromStory() {
  let bp = createEmptyRenderBlueprint({ seed: 3, category: "electronics" });
  bp = advanceLifecycleStage(bp);
  bp = applyAgentPatch(bp, {
    agentId: "product-analyzer",
    section: "product",
    data: { shape: "box" },
  });
  bp = advanceLifecycleStage(bp);
  bp = applyAgentPatch(bp, {
    agentId: "creative-engine",
    section: "creative",
    data: { goal: "Technical", audience: "tech buyers", emotion: "innovation" },
  });
  bp = advanceLifecycleStage(bp);

  bp = applyAgentPatch(bp, {
    agentId: "visual-story-director",
    section: "story",
    data: {
      hook: "power anywhere",
      visualPromise: "reliable backup",
      narrative: "home stays powered",
    },
  });
  assert.equal(bp.lifecycle.sections.story, SectionState.DIRTY);
  assert.equal(bp.lifecycle.sections.scene, SectionState.DIRTY);
  assert.equal(bp.lifecycle.sections.composition, SectionState.DIRTY);
  assert.equal(bp.lifecycle.sections.product, SectionState.LOCKED);
  assert.equal(bp.lifecycle.sections.creative, SectionState.LOCKED);
  console.log("✔ story change → dirty propagation to scene…validation");
}

function testSnapshotAndRollback() {
  let bp = createEmptyRenderBlueprint({ seed: 4, category: "home_appliances" });
  bp = advanceLifecycleStage(bp);
  bp = applyAgentPatch(bp, {
    agentId: "product-analyzer",
    section: "product",
    data: { shape: "generator" },
  });
  bp = advanceLifecycleStage(bp);
  const snapshotId = bp.lifecycle.snapshots.at(-1)!.id;

  bp = applyAgentPatch(bp, {
    agentId: "creative-engine",
    section: "creative",
    data: { goal: "Lifestyle", audience: "homeowners", emotion: "security" },
  });
  bp = advanceLifecycleStage(bp);

  const rolled = rollbackToSnapshot(bp, snapshotId);
  assert.equal(rolled.resumeFrom, BlueprintLifecycle.CREATIVE_DEFINED);
  assert.equal(rolled.blueprint.lifecycle.stage, BlueprintLifecycle.CREATIVE_DEFINED);
  assert.equal(rolled.blueprint.lifecycle.sections.product, SectionState.LOCKED);
  console.log("✔ Chief rollback via snapshot");
}

function testFrozenBlocksPatches() {
  let bp = createEmptyRenderBlueprint({ seed: 5, category: "cosmetics" });
  for (let i = 0; i < 9; i++) {
    if (bp.lifecycle.stage === BlueprintLifecycle.PRODUCT_ANALYZED) {
      bp = applyAgentPatch(bp, {
        agentId: "product-analyzer",
        section: "product",
        data: { shape: "tube" },
      });
    }
    if (bp.lifecycle.stage === BlueprintLifecycle.CREATIVE_DEFINED) {
      bp = applyAgentPatch(bp, {
        agentId: "creative-engine",
        section: "creative",
        data: { audience: "women 25-45", emotion: "warm" },
      });
    }
    if (bp.lifecycle.stage === BlueprintLifecycle.STORY_DEFINED) {
      bp = applyAgentPatch(bp, {
        agentId: "visual-story-director",
        section: "story",
        data: { hook: "h", visualPromise: "p", narrative: "n" },
      });
    }
    if (bp.lifecycle.stage === BlueprintLifecycle.SCENE_DEFINED) {
      bp = applyAgentPatch(bp, {
        agentId: "scene-director",
        section: "scene",
        data: { environment: "studio", surface: "marble" },
      });
    }
    if (bp.lifecycle.stage === BlueprintLifecycle.PHOTO_DEFINED) {
      bp = applyAgentPatch(bp, {
        agentId: "commercial-photo-director",
        section: "photography",
        data: { visualMood: "soft daylight", realism: 0.9 },
      });
    }
    if (bp.lifecycle.stage === BlueprintLifecycle.COMPOSITION_DEFINED) {
      bp = applyAgentPatch(bp, {
        agentId: "composition-director",
        section: "composition",
        data: { eyeFlow: ["hero", "headline"] },
      });
    }
    if (bp.lifecycle.stage === BlueprintLifecycle.VALIDATED) {
      // Critics / Chief are read-only — Orchestrator records approvals before stage advance
      bp = {
        ...bp,
        validation: {
          storyApproved: true,
          sceneApproved: true,
          photoApproved: true,
          layoutApproved: true,
          chiefApproved: true,
        },
      };
    }
    bp = advanceLifecycleStage(bp);
  }

  assert.equal(bp.lifecycle.stage, BlueprintLifecycle.FROZEN);
  assert.throws(
    () =>
      applyAgentPatch(bp, {
        agentId: "scene-director",
        section: "scene",
        data: { environment: "garden" },
      }),
    BlueprintLockedError,
  );
  const rendering = advanceToRendering(bp);
  assert.equal(rendering.lifecycle.stage, BlueprintLifecycle.RENDERING);
  console.log("✔ FROZEN blocks agents; render after freeze");
}

function testValidationBarrier() {
  let bp = createEmptyRenderBlueprint({ seed: 6, category: "garden_tools" });
  bp = advanceLifecycleStage(bp);
  bp = applyAgentPatch(bp, {
    agentId: "product-analyzer",
    section: "product",
    data: { shape: "tool" },
  });
  bp = advanceLifecycleStage(bp);
  bp = applyAgentPatch(bp, {
    agentId: "creative-engine",
    section: "creative",
    data: { audience: "gardeners", emotion: "calm" },
  });
  bp = advanceLifecycleStage(bp);
  assert.throws(() => advanceLifecycleStage(bp), LifecycleTransitionError);
  console.log("✔ validation barrier blocks incomplete story");
}

testSectionStateTransitions();
testNewToProductStage();
testProductLockAfterStage();
testDirtyPropagationFromStory();
testSnapshotAndRollback();
testFrozenBlocksPatches();
testValidationBarrier();
console.log("\nAll lifecycle Chapter 3.1 specs passed.");
