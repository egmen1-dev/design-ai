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

  const concepts = [
    ["garden_scene", /lawn|grass|garden|suburban/i],
    ["outdoor_lifestyle", /lifestyle|outdoor|daylight/i],
    ["home_interior", /home|interior|wooden|domestic/i],
    ["commercial_studio", /studio|gradient|photography/i],
    ["tech_showcase", /tech|showcase|electronics|gradient/i],
    ["premium_minimal", /luxury|minimal|beige|catalog/i],
  ] as const;

  for (const [conceptId, pattern] of concepts) {
    const pipeline = runVisualPipeline({
      prompt: "товар для маркетплейса",
      analysis,
      coverConceptId: conceptId,
    });
    const gardenPrompt = compilePollinationsPrompt(pipeline.visualBlueprint, "outdoor", {
      coverConceptId: conceptId,
    });
    assert.ok(
      pattern.test(gardenPrompt.prompt),
      `${conceptId} prompt missing environment: ${gardenPrompt.prompt.slice(0, 120)}`,
    );
  }

  const garden = runVisualPipeline({
    prompt: "генератор 3 кВт",
    analysis,
    coverConceptId: "garden_scene",
  });
  assert.equal(garden.visualBlueprint.scene.architecture, "nature");

  const overridePrompt = compilePollinationsPrompt(garden.visualBlueprint, "outdoor", {
    coverConceptId: "garden_scene",
    environmentPhraseOverride: "custom meadow backdrop with wildflowers",
  });
  assert.ok(
    overridePrompt.prompt.includes("custom meadow"),
    "environmentPhraseOverride should win",
  );

  console.log("pollinations-compiler OK", compiled.tokenEstimate, "tokens");
}

main();
