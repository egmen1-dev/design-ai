import assert from "node:assert/strict";
import {
  applyAgentPatch,
  assertAgentMayWriteSection,
  assertAgentOutputsClean,
  assertNoPromptStored,
  assertPhotographyMoodClean,
  assertReadyForAdapter,
  ConstitutionV18Error,
  createEmptyRenderBlueprint,
  environmentFromCoverConcept,
  renderBlueprintFromVisualPipeline,
} from "./index";
import type { VisualSceneBlueprint } from "@/lib/design/visual-pipeline/types";

function testEnvironmentCh3() {
  assert.equal(environmentFromCoverConcept("garden_scene"), "garden");
  assert.equal(environmentFromCoverConcept("commercial_studio"), "studio");
  console.log("✔ Chapter 3 scene.environment");
}

function testRule001CameraDistanceOnlyInCamera() {
  const bp = createEmptyRenderBlueprint({ seed: 1, category: "garden_tools" });
  assert.equal(bp.camera.distance, "medium");
  assert.equal((bp.scene as { cameraDistance?: string }).cameraDistance, undefined);
  console.log("✔ Rule 001 — camera.distance only in camera");
}

function testRule002AgentSectionOwnership() {
  assert.throws(
    () => assertAgentMayWriteSection("scene-director", "camera"),
    ConstitutionV18Error,
  );
  assert.throws(
    () => assertAgentMayWriteSection("flux-adapter", "scene"),
    ConstitutionV18Error,
  );
  console.log("✔ Rule 002 — agent section ownership");
}

function testRule004NoPromptInBlueprint() {
  const bp = createEmptyRenderBlueprint({ seed: 2, category: "electronics" });
  assertNoPromptStored(bp);
  assert.equal((bp.render as { compiledPrompt?: string }).compiledPrompt, undefined);
  console.log("✔ Rule 004 — no prompt stored");
}

function testPhotographyBannedMood() {
  assert.throws(
    () => assertPhotographyMoodClean("premium luxury mood", "commercial-photo-director"),
    ConstitutionV18Error,
  );
  console.log("✔ photography.visualMood bans marketing words");
}

function testStoryDirectorPatchesCreativeAndStory() {
  const bp = createEmptyRenderBlueprint({ seed: 3, category: "home_appliances", environment: "garden" });
  const next = applyAgentPatch(bp, {
    agentId: "visual-story-director",
    section: "creative",
    data: { goal: "Technical", emotion: "reliability" },
  });
  assert.equal(next.creative.goal, "Technical");
  const story = applyAgentPatch(next, {
    agentId: "visual-story-director",
    section: "story",
    data: { hook: "backup power", emotionalTone: "warm" },
  });
  assert.equal(story.story.hook, "backup power");
  console.log("✔ Story Director → creative + story");
}

function testSceneDirectorPatchesSceneOnly() {
  const bp = createEmptyRenderBlueprint({ seed: 4, category: "garden_tools", environment: "studio" });
  const next = applyAgentPatch(bp, {
    agentId: "scene-director",
    section: "scene",
    data: { environment: "garden", timeOfDay: "golden_hour" },
  });
  assert.equal(next.scene.environment, "garden");
  assert.equal(next.scene.timeOfDay, "golden_hour");
  console.log("✔ Scene Director → scene.*");
}

function testCompositionHasNoPixelGeometry() {
  const bp = createEmptyRenderBlueprint({ seed: 5, category: "cosmetics" });
  assert.ok(bp.composition.template);
  assert.equal((bp.composition as { hero?: { x: number } }).hero, undefined);
  console.log("✔ composition without x/y/width");
}

function testGoldenRuleValidationBeforeAdapter() {
  const bp = createEmptyRenderBlueprint({ seed: 6, category: "electronics" });
  assert.throws(() => assertReadyForAdapter(bp), ConstitutionV18Error);
  let approved = bp;
  for (const patch of [
    { section: "validation" as const, data: { storyApproved: true } },
    { section: "validation" as const, data: { sceneApproved: true } },
    { section: "validation" as const, data: { photoApproved: true } },
    { section: "validation" as const, data: { layoutApproved: true } },
    { section: "validation" as const, data: { chiefApproved: true } },
  ]) {
    approved = applyAgentPatch(approved, { agentId: "chief-design-director", ...patch });
  }
  assert.doesNotThrow(() => assertReadyForAdapter(approved));
  console.log("✔ golden rule — validation before adapter");
}

function testBridgeFromVisualBlueprint() {
  const visual: VisualSceneBlueprint = {
    version: "2.0",
    category: "garden_tools",
    story: { storyType: "lifestyle", targetEmotion: "confidence", usageContext: "outdoor" },
    scene: {
      sceneType: "nature",
      architecture: "outdoor",
      depth: "medium",
      weather: "clear",
      time: "golden_hour",
      visualDensity: 0.3,
    },
    lighting: {
      preset: "sunset_rim",
      keyLight: "directional",
      fill: "minimal",
      rim: "subtle",
      temperatureK: 5200,
      contrast: "medium",
      shadowStyle: "soft",
    },
    camera: {
      lensMm: 50,
      angle: "eye_level",
      distance: "medium",
      framing: "environment_context",
      perspective: "natural",
    },
    materials: {
      floor: "soft_concrete",
      background: "graphite",
      surface: "matte_aluminum",
      reflection: "none",
      texture: "matte",
    },
    mood: "confidence",
    palette: ["#2d5016", "#ffffff"],
    composition: {
      heroPosition: "bottom-right",
      negativeSpace: "left",
      balance: "asymmetric_hero_right",
      visualWeight: { hero: 50, background: 30, headline: 20 },
      safeZones: [],
    },
    negative: { terms: [] },
    constraints: {
      noProduct: true,
      noText: true,
      noLogos: true,
      noPeople: true,
      backdropOnly: true,
    },
  };

  const bp = renderBlueprintFromVisualPipeline(visual, undefined, 99, "garden_scene");
  assert.equal(bp.scene.environment, "garden");
  assert.equal(bp.camera.lens, 50);
  assert.equal(bp.photography.shotType, "wide");
  assert.equal((bp.photography as { lensMm?: number }).lensMm, undefined);
  console.log("✔ bridge v17 → Chapter 3 blueprint");
}

testEnvironmentCh3();
testRule001CameraDistanceOnlyInCamera();
testRule002AgentSectionOwnership();
testRule004NoPromptInBlueprint();
testPhotographyBannedMood();
testStoryDirectorPatchesCreativeAndStory();
testSceneDirectorPatchesSceneOnly();
testCompositionHasNoPixelGeometry();
testGoldenRuleValidationBeforeAdapter();
testBridgeFromVisualBlueprint();
console.log("\nAll RenderBlueprint Chapter 3 specs passed.");
