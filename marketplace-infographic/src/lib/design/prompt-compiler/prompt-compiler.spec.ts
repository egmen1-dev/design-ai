/**
 * Prompt Compiler unit specs
 * Run: npx tsx src/lib/design/prompt-compiler/prompt-compiler.spec.ts
 */
import assert from "node:assert/strict";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import { planScene } from "@/lib/design/scene-planner";
import { buildInitialLayoutSpec } from "@/lib/design/layout-spec";
import { runSceneDirector } from "@/lib/design/scene-blueprint";
import { runCompositionDirector } from "@/lib/design/composition-director";
import {
  compileRenderingPrompt,
  compileNegativePrompt,
  validateCompiledPrompt,
  DESIGN_CONSTITUTION,
  PROMPT_COMPILER_VERSION,
  resolveRenderingProfile,
} from "./index";
import { compileAllSections, joinSections } from "./sections";

async function main() {
  const analysis = analyzeProductPrompt("Генератор 3 кВт для дачи");
  const scenePlan = planScene({
    prompt: "Генератор 3 кВт",
    coverConceptId: "commercial_studio",
    seed: "test-prompt-compiler",
  }).scene;

  const sceneDirection = await runSceneDirector({
    prompt: "Генератор 3 кВт",
    analysis,
    seed: "test-scene",
  });

  const compositionDirection = await runCompositionDirector({
    prompt: "Генератор 3 кВт",
    analysis,
    seed: "test-comp",
    sceneBlueprint: sceneDirection.blueprint,
  });

  const layoutSpec =
    compositionDirection.layoutSpec ??
    buildInitialLayoutSpec({ analysis, palette: ["#1a1a1a", "#f5f5f5"] });

  const input = {
    prompt: "Генератор 3 кВт",
    analysis,
    scenePlan,
    layoutSpec,
    sceneBlueprint: sceneDirection.blueprint,
    productColors: ["#333333", "#cccccc"],
    productShape: "rectangular",
    luxuryScore: 82,
    compositionScore: compositionDirection.quality.total,
    sceneScore: sceneDirection.quality.total,
  };

  const compiled = compileRenderingPrompt(input);

  assert.equal(compiled.metadata.version, PROMPT_COMPILER_VERSION);
  assert.ok(compiled.prompt.length >= 120, "prompt length");
  assert.ok(compiled.negativePrompt.includes("floating object"));
  assert.ok(compiled.negativePrompt.includes("low quality"));
  assert.equal(compiled.metadata.sections.length, 12);
  assert.ok(compiled.metadata.readabilityScore >= 40);
  assert.ok(compiled.metadata.promptComplexityScore >= 50);
  assert.ok(DESIGN_CONSTITUTION.length >= 8);

  const profile = resolveRenderingProfile({
    category: analysis.category,
    priceSegment: analysis.priceSegment,
    sceneType: sceneDirection.blueprint.scene.type,
    compositionTemplate: layoutSpec.compositionTemplateId,
  });
  assert.ok(profile.profile, "rendering profile resolved");

  const sections = compileAllSections(input, profile.profile);
  const joined = joinSections(sections);
  const validation = validateCompiledPrompt(sections, input, joined);
  assert.ok(validation.passed, validation.issues.join("; "));

  const negative = compileNegativePrompt(input);
  assert.ok(negative.includes("typography"));
  assert.ok(negative.includes("particles"));

  console.log(
    "prompt-compiler specs OK",
    compiled.metadata.profile,
    compiled.approved,
    compiled.metadata.attempts,
  );
}

main();
