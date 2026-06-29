import assert from "node:assert/strict";
import {
  applyAgentPatch,
  assertAgentMayWriteSection,
  assertAgentOutputsClean,
  ConstitutionV18Error,
  createEmptyRenderBlueprint,
  environmentFromCoverConcept,
  renderBlueprintFromVisualPipeline,
} from "./index";
import type { VisualSceneBlueprint } from "@/lib/design/visual-pipeline/types";

function testEnvironmentUnification() {
  assert.equal(environmentFromCoverConcept("garden_scene"), "garden_lawn");
  assert.equal(environmentFromCoverConcept("commercial_studio"), "studio_commercial");
  console.log("✔ environment unification");
}

function testAgentCannotWriteRender() {
  assert.throws(
    () => assertAgentMayWriteSection("visual-story-director", "render"),
    ConstitutionV18Error,
  );
  console.log("✔ agent cannot write render section");
}

function testBannedTokens() {
  assert.throws(
    () => assertAgentOutputsClean(["premium photorealistic 8k scene"], "scene-director"),
    ConstitutionV18Error,
  );
  console.log("✔ banned flux tokens in agent output");
}

function testAgentPatchSection() {
  const bp = createEmptyRenderBlueprint({
    category: "home_appliances",
    seed: "test",
    environment: "residential_backyard",
  });
  const next = applyAgentPatch(bp, {
    agentId: "scene-director",
    section: "scene",
    data: { environment: "garden_lawn", time: "golden_hour" },
  });
  assert.equal(next.scene.environment, "garden_lawn");
  assert.equal(next.scene.time, "golden_hour");
  assert.equal(next.meta.trace.length, 2);
  console.log("✔ agent patch updates only assigned section");
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

  const bp = renderBlueprintFromVisualPipeline(visual, undefined, "bridge-test", "garden_scene");
  assert.equal(bp.scene.environment, "garden_lawn");
  assert.equal(bp.scene.time, "golden_hour");
  assert.equal(bp.photography.lensMm, 50);
  console.log("✔ bridge from VisualSceneBlueprint");
}

testEnvironmentUnification();
testAgentCannotWriteRender();
testBannedTokens();
testAgentPatchSection();
testBridgeFromVisualBlueprint();
console.log("\nAll render-blueprint v18 specs passed.");
