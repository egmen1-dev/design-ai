/**
 * Design Governance v17.1 specs
 * Run: npx tsx src/lib/design-governance/design-governance.spec.ts
 */
import assert from "node:assert/strict";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import { planScene } from "@/lib/design/scene-planner";
import { resolveDesignDecisions } from "./resolver/resolver";
import { detectConflicts } from "./conflicts/detect";
import { extractStoryDecisions } from "./decision/extractors";
import type { VisualStoryDirectorResult } from "@/lib/agents/visual-story-director/types";

const generatorPrompt =
  "Бензиновый генератор Kronwerk 3 кВт, бак 15 литров, расход 1,25 л/час";

async function main() {
  const analysis = analyzeProductPrompt(generatorPrompt);
  assert.equal(analysis.category, "home_appliances");

  const story: VisualStoryDirectorResult = {
    storyBlueprint: {
      customerIntent: "backup power",
      problem: "outages",
      solution: "reliable generator",
      emotion: "confidence",
      marketingHook: "power anywhere",
      heroConcept: "Outdoor commercial scene",
      sceneNarrative: "Загородный участок на закате, генератор на террасе",
      buyerMotivation: "дача",
      visualHookType: "oversized_product",
      compositionScenarioId: "hero_right",
      agentSnippet: "outdoor",
    },
    sceneNarrative: "Outdoor sunset garden",
    heroConcept: "Outdoor commercial scene",
    customerIntent: "дача",
    approved: true,
    score: 91,
    agentSnippet: "outdoor",
    source: "creative",
    compositionScenarioId: "hero_right",
  };

  const storyDecisions = extractStoryDecisions(story);
  assert.ok(storyDecisions[0].value === "outdoor");

  const { scene: scenePlan } = planScene({
    prompt: generatorPrompt,
    coverConceptId: "home_interior",
    seed: "gov-test",
  });

  const blueprint = resolveDesignDecisions({
    analysis,
    storyDirection: story,
    sceneDirection: {
      blueprint: {
        version: "1.0",
        scene: {
          type: "kitchen",
          environment: "modern kitchen counter",
          floor: "stone",
          background: "kitchen interior bokeh",
          depth: "medium",
          atmosphere: "domestic premium",
          material: "stone",
          visualDensity: 0.1,
        },
        lighting: {
          preset: "warm_spotlight",
          key: "warm",
          fill: "soft",
          rim: "subtle",
          back: "none",
          temperatureK: 4200,
        },
        hero: { position: "bottom-right", rotationDeg: -4, scale: 0.46, anchor: "ground" },
        headline: { position: "top-left", widthRatio: 0.34 },
        accent: { glow: false, particles: false, shapes: "minimal", maxGradients: 1 },
        camera: { lensMm: 70, height: "eye level", distance: "medium", angle: "hero" },
        productInteraction: {
          groundPlane: true,
          softShadow: true,
          ambientOcclusion: true,
          backgroundInteraction: "subtle",
          lightWrapping: true,
          reflections: false,
          edgeHighlights: true,
          depthSeparation: "high",
        },
        decorative: {
          maxDensity: 0.1,
          maxParticles: 0,
          maxShapes: 1,
          maxGradients: 1,
          backgroundComplexity: "minimal",
          whitespaceDominates: true,
        },
        premiumFeeling: 80,
        shadowStrategy: "contact-soft",
      },
      quality: {
        sceneQuality: 80,
        lightingQuality: 78,
        depthQuality: 75,
        environmentQuality: 72,
        luxuryFeeling: 70,
        visualNoise: 85,
        sceneCoherence: 74,
        total: 67,
        passed: false,
        issues: ["kitchen vs outdoor"],
      },
      approved: false,
      attempts: 1,
      sceneType: "kitchen",
      agentSnippet: "kitchen",
      source: "heuristic",
    },
    scenePlan,
    sceneBlueprint: undefined,
    layoutSpec: undefined,
    compositionDirection: undefined,
  });

  assert.equal(blueprint.locked, true);
  assert.equal(blueprint.scene, "outdoor");
  assert.notEqual(blueprint.sceneBlueprint.scene.type, "kitchen");
  assert.ok(blueprint.discarded.some((d) => d.value === "kitchen"));
  assert.ok(blueprint.conflicts.length > 0);

  const conflicts = detectConflicts(blueprint.resolvedDecisions);
  assert.ok(conflicts.some((c) => c.type === "scene"));

  console.log("design-governance specs OK", blueprint.scene, blueprint.sceneBlueprint.scene.type);
}

main();
