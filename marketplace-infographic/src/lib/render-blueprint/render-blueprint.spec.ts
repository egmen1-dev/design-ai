import assert from "node:assert/strict";
import {
  applyAgentPatch,
  assertAgentMayWriteSection,
  assertAgentOutputsClean,
  assertNoPromptStored,
  assertPhotographyMoodClean,
  assertReadyForAdapter,
  advanceLifecycleStage,
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

function testStoryDirectorPatchesStoryOnly() {
  let bp = createEmptyRenderBlueprint({ seed: 3, category: "home_appliances", environment: "garden" });
  bp = advanceLifecycleStage(bp);
  bp = applyAgentPatch(bp, {
    agentId: "product-analyzer",
    section: "product",
    data: { shape: "generator" },
  });
  bp = advanceLifecycleStage(bp);
  bp = applyAgentPatch(bp, {
    agentId: "creative-engine",
    section: "creative",
    data: { goal: "Technical", audience: "homeowners", emotion: "security" },
  });
  bp = advanceLifecycleStage(bp);

  const story = applyAgentPatch(bp, {
    agentId: "visual-story-director",
    section: "story",
    data: { hook: "backup power", emotionalTone: "warm" },
  });
  assert.equal(story.story.hook, "backup power");
  console.log("✔ Story Director → story only");
}

function testSceneDirectorPatchesSceneOnly() {
  let bp = createEmptyRenderBlueprint({ seed: 4, category: "garden_tools", environment: "studio" });
  bp = advanceLifecycleStage(bp);
  bp = applyAgentPatch(bp, { agentId: "product-analyzer", section: "product", data: { shape: "tool" } });
  bp = advanceLifecycleStage(bp);
  bp = applyAgentPatch(bp, {
    agentId: "creative-engine",
    section: "creative",
    data: { audience: "gardeners", emotion: "confidence" },
  });
  bp = advanceLifecycleStage(bp);
  bp = applyAgentPatch(bp, {
    agentId: "visual-story-director",
    section: "story",
    data: { hook: "h", visualPromise: "p", narrative: "n" },
  });
  bp = advanceLifecycleStage(bp);

  const next = applyAgentPatch(bp, {
    agentId: "scene-director",
    section: "scene",
    data: { environment: "garden", timeOfDay: "golden_hour", surface: "grass" },
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
  let bp = createEmptyRenderBlueprint({ seed: 6, category: "electronics" });
  assert.throws(() => assertReadyForAdapter(bp), ConstitutionV18Error);

  for (let i = 0; i < 9; i++) {
    if (bp.lifecycle.stage === "PRODUCT_ANALYZED") {
      bp = applyAgentPatch(bp, {
        agentId: "product-analyzer",
        section: "product",
        data: { shape: "device" },
      });
    }
    if (bp.lifecycle.stage === "CREATIVE_DEFINED") {
      bp = applyAgentPatch(bp, {
        agentId: "creative-engine",
        section: "creative",
        data: { audience: "tech", emotion: "innovative" },
      });
    }
    if (bp.lifecycle.stage === "STORY_DEFINED") {
      bp = applyAgentPatch(bp, {
        agentId: "visual-story-director",
        section: "story",
        data: { hook: "h", visualPromise: "p", narrative: "n" },
      });
    }
    if (bp.lifecycle.stage === "SCENE_DEFINED") {
      bp = applyAgentPatch(bp, {
        agentId: "scene-director",
        section: "scene",
        data: { environment: "studio", surface: "desk" },
      });
    }
    if (bp.lifecycle.stage === "PHOTO_DEFINED") {
      bp = applyAgentPatch(bp, {
        agentId: "commercial-photo-director",
        section: "photography",
        data: { visualMood: "clean light", realism: 0.85 },
      });
    }
    if (bp.lifecycle.stage === "COMPOSITION_DEFINED") {
      bp = applyAgentPatch(bp, {
        agentId: "composition-director",
        section: "composition",
        data: { eyeFlow: ["hero", "headline"] },
      });
    }
    if (bp.lifecycle.stage === "VALIDATED") {
      bp = applyAgentPatch(bp, {
        agentId: "chief-design-director",
        section: "validation",
        data: {
          storyApproved: true,
          sceneApproved: true,
          photoApproved: true,
          layoutApproved: true,
          chiefApproved: true,
        },
      });
    }
    bp = advanceLifecycleStage(bp);
  }

  assert.equal(bp.lifecycle.stage, "FROZEN");
  assert.doesNotThrow(() => assertReadyForAdapter(bp));
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
testStoryDirectorPatchesStoryOnly();
testSceneDirectorPatchesSceneOnly();
testCompositionHasNoPixelGeometry();
testGoldenRuleValidationBeforeAdapter();
testBridgeFromVisualBlueprint();
console.log("\nAll RenderBlueprint Chapter 3 specs passed.");
