/**
 * Visual Pipeline v2 specs
 * Run: npx tsx src/lib/design/visual-pipeline/visual-pipeline.spec.ts
 */
import assert from "node:assert/strict";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import { runVisualPipeline } from "./index";
import { compilePollinationsPrompt } from "@/lib/render-engine/adapters/pollinations-compiler";

function main() {
  const analysis = analyzeProductPrompt("Бензиновый генератор 3 кВт");
  const result = runVisualPipeline({ prompt: "генератор", analysis });

  assert.equal(result.visualBlueprint.version, "2.0");
  assert.ok(result.visualBlueprint.story.storyType);
  assert.ok(result.visualBlueprint.scene.architecture);
  assert.ok(result.visualBlueprint.lighting.preset);
  assert.ok(result.visualBlueprint.camera.lensMm > 50);
  assert.ok(result.visualBlueprint.materials.floor);
  assert.ok(result.visualBlueprint.composition.heroPosition);
  assert.equal(result.visualBlueprint.constraints.noProduct, true);

  const prompt = compilePollinationsPrompt(result.visualBlueprint);
  assert.ok(!/\bgenerator\b/i.test(prompt.prompt));

  assert.equal(result.sceneBlueprint.version, "1.0");
  assert.ok(!result.sceneBlueprint.scene.atmosphere.includes("story:"));

  console.log("visual-pipeline OK", result.snippets.join(" | "));
}

main();
