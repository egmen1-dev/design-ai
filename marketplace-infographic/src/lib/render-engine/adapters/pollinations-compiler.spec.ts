/**
 * Pollinations compiler specs
 * Run: npx tsx src/lib/render-engine/adapters/pollinations-compiler.spec.ts
 */
import assert from "node:assert/strict";
import { runVisualPipeline } from "@/lib/design/visual-pipeline";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import {
  compilePollinationsPrompt,
  validatePollinationsPrompt,
} from "./pollinations-compiler";

function main() {
  const analysis = analyzeProductPrompt("Генератор 3 кВт для дачи");
  const { visualBlueprint } = runVisualPipeline({
    prompt: "Генератор 3 кВт",
    analysis,
  });

  const compiled = compilePollinationsPrompt(visualBlueprint);
  assert.ok(compiled.prompt.length > 40 && compiled.prompt.length < 900);
  assert.ok(compiled.tokenEstimate >= 20 && compiled.tokenEstimate <= 120);
  assert.ok(compiled.validation.ok, compiled.validation.issues.join("; "));
  assert.ok(!/\bctr\b/i.test(compiled.prompt));
  assert.ok(!/\bx\s*=\s*0\./i.test(compiled.prompt));
  assert.ok(compiled.negativePrompt.includes("text"));
  assert.ok(compiled.negativePrompt.split(",").length <= 12);

  const bad = validatePollinationsPrompt("CTR optimized layout 45%", "text");
  assert.ok(!bad.ok);

  const garden = runVisualPipeline({
    prompt: "генератор 3 кВт",
    analysis,
    coverConceptId: "garden_scene",
  });
  const gardenPrompt = compilePollinationsPrompt(garden.visualBlueprint, "outdoor", {
    coverConceptId: "garden_scene",
  });
  assert.ok(/lawn|grass|garden|suburban/i.test(gardenPrompt.prompt), gardenPrompt.prompt);
  assert.equal(garden.visualBlueprint.scene.architecture, "nature");

  console.log("pollinations-compiler OK", compiled.tokenEstimate, "tokens");
}

main();
