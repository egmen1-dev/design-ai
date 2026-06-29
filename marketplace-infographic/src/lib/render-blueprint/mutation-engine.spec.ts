import assert from "node:assert/strict";
import {
  BlueprintLifecycle,
  createEmptyRenderBlueprint,
  DecisionGraph,
  MutationEngine,
  MutationEngineError,
  SectionState,
  hashSection,
} from "./index";

function testAtomicOneSectionPerMutation() {
  const engine = new MutationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 1, category: "x" });
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  bp.lifecycle.sections.product = SectionState.LOCKED;
  bp.lifecycle.sections.creative = SectionState.LOCKED;
  bp.lifecycle.sections.story = SectionState.LOCKED;
  bp.lifecycle.sections.scene = SectionState.LOCKED;
  bp.lifecycle.sections.photography = SectionState.LOCKED;
  bp.lifecycle.sections.materials = SectionState.READY;
  const graph = DecisionGraph.fromBlueprint(bp);

  const batch = engine.applyBatch(bp, graph, {
    mutations: [
      {
        section: "camera",
        producer: "commercial-photo-director",
        expectedRevision: 0,
        payload: { lens: 85 },
        reason: "camera",
        timestamp: Date.now(),
      },
      {
        section: "lighting",
        producer: "commercial-photo-director",
        expectedRevision: 1,
        payload: { preset: "window", temperature: 4800 },
        reason: "lighting",
        timestamp: Date.now(),
      },
    ],
  });

  assert.equal(batch.appliedCount, 2);
  assert.equal(batch.blueprint.meta.revision, 2);
  assert.equal(batch.blueprint.lifecycle.sections.camera, SectionState.READY);
  console.log("✔ batch applies one section per mutation, revision++ each");
}

function testIdempotentMutationSkips() {
  const engine = new MutationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 2, category: "x" });
  bp.lifecycle.stage = BlueprintLifecycle.CREATIVE_DEFINED;
  const graph = DecisionGraph.fromBlueprint(bp);
  const payload = { audience: bp.creative.audience, emotion: bp.creative.emotion };

  const result = engine.applyMutation(bp, graph, {
    section: "creative",
    producer: "creative-engine",
    expectedRevision: 0,
    payload,
    reason: "noop",
    timestamp: Date.now(),
  });

  assert.equal(result.skipped, true);
  assert.equal(result.applied, false);
  assert.equal(result.blueprint.meta.revision, 0);
  console.log("✔ idempotent mutation does not change revision");
}

function testConflictInBatch() {
  const engine = new MutationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 3, category: "x" });
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  const graph = DecisionGraph.fromBlueprint(bp);

  assert.throws(
    () =>
      engine.applyBatch(bp, graph, {
        mutations: [
          {
            section: "lighting",
            producer: "commercial-photo-director",
            expectedRevision: 0,
            payload: { preset: "studio" },
            reason: "a",
            timestamp: Date.now(),
          },
          {
            section: "lighting",
            producer: "lighting-director",
            expectedRevision: 0,
            payload: { preset: "window" },
            reason: "b",
            timestamp: Date.now(),
          },
        ],
      }),
    MutationEngineError,
  );
  console.log("✔ batch conflict detected (two producers, one section)");
}

function testSchemaRejectsUnknownField() {
  const engine = new MutationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 4, category: "x" });
  bp.lifecycle.stage = BlueprintLifecycle.STORY_DEFINED;
  bp.lifecycle.sections.product = SectionState.LOCKED;
  bp.lifecycle.sections.creative = SectionState.LOCKED;
  const graph = DecisionGraph.fromBlueprint(bp);

  assert.throws(
    () =>
      engine.applyMutation(bp, graph, {
        section: "story",
        producer: "visual-story-director",
        expectedRevision: 0,
        payload: { hook: "x", unknownField: true },
        reason: "bad",
        timestamp: Date.now(),
      }),
    MutationEngineError,
  );
  console.log("✔ schema validation rejects unknown fields");
}

function testLockValidation() {
  const engine = new MutationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 5, category: "x" });
  bp.lifecycle.stage = BlueprintLifecycle.SCENE_DEFINED;
  bp.lifecycle.sections.story = SectionState.LOCKED;
  const graph = DecisionGraph.fromBlueprint(bp);

  assert.throws(
    () =>
      engine.applyMutation(bp, graph, {
        section: "story",
        producer: "visual-story-director",
        expectedRevision: 0,
        payload: { hook: "hack" },
        reason: "locked",
        timestamp: Date.now(),
      }),
    MutationEngineError,
  );
  console.log("✔ LOCKED section rejects mutation");
}

function testMutationEventAndAudit() {
  const engine = new MutationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 6, category: "x" });
  bp.lifecycle.stage = BlueprintLifecycle.CREATIVE_DEFINED;
  const graph = DecisionGraph.fromBlueprint(bp);
  const events: string[] = [];
  engine.onMutationApplied((e) => events.push(`${e.section}:${e.revision}`));

  engine.applyMutation(bp, graph, {
    section: "creative",
    producer: "creative-engine",
    expectedRevision: 0,
    payload: { audience: "new audience" },
    reason: "test",
    timestamp: Date.now(),
  });

  assert.equal(events.length, 1);
  assert.equal(engine.getAuditTrail().length, 1);
  assert.notEqual(engine.getAuditTrail()[0]!.previousValueHash, engine.getAuditTrail()[0]!.newValueHash);
  console.log("✔ mutation event + audit trail with hashes");
}

function testSectionStateReadyAfterApply() {
  const engine = new MutationEngine();
  const bp = createEmptyRenderBlueprint({ seed: 7, category: "x" });
  bp.lifecycle.stage = BlueprintLifecycle.STORY_DEFINED;
  bp.lifecycle.sections.creative = SectionState.LOCKED;
  bp.lifecycle.sections.product = SectionState.LOCKED;
  const graph = DecisionGraph.fromBlueprint(bp);

  const result = engine.applyMutation(bp, graph, {
    section: "story",
    producer: "visual-story-director",
    expectedRevision: 0,
    payload: { hook: "power story", narrative: "n", visualPromise: "p" },
    reason: "story",
    timestamp: Date.now(),
  });

  assert.equal(result.blueprint.lifecycle.sections.story, SectionState.READY);
  assert.ok(result.invalidatedSections.includes("scene"));
  console.log("✔ mutated section READY, downstream DIRTY via graph");
}

function testHashStable() {
  const bp = createEmptyRenderBlueprint({ seed: 8, category: "x" });
  const h1 = hashSection(bp, "lighting");
  const h2 = hashSection(bp, "lighting");
  assert.equal(h1, h2);
  console.log("✔ section hash is stable");
}

function run() {
  testAtomicOneSectionPerMutation();
  testIdempotentMutationSkips();
  testConflictInBatch();
  testSchemaRejectsUnknownField();
  testLockValidation();
  testMutationEventAndAudit();
  testSectionStateReadyAfterApply();
  testHashStable();
}

run();
console.log("\nAll mutation engine Chapter 3.5 specs passed.");
