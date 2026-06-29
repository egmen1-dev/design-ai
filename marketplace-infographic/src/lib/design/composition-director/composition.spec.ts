/**
 * Composition Director unit specs
 * Run: npx tsx src/lib/design/composition-director/composition.spec.ts
 */
import assert from "node:assert/strict";
import { runCompositionDirector } from "./CompositionDirector";
import { scoreEyeFlow } from "./eye-flow";
import { buildGeometryFromTemplate, enforceCompositionRules } from "./geometry";
import { COMPOSITION_TEMPLATES } from "./templates";
import { analyzeProductPrompt } from "@/lib/product-analysis";

async function main() {
  const analysis = analyzeProductPrompt("Генератор 3 кВт для дачи");
  const result = await runCompositionDirector({
    prompt: "Генератор 3 кВт",
    analysis,
    seed: "test-comp",
  });

  assert.ok(result.layoutSpec.geometry, "geometry required");
  assert.ok(result.layoutSpec.compositionTemplateId, "template required");
  assert.ok(result.quality.eyeFlow.score >= 0);
  assert.ok(result.layoutSpec.whitespaceTarget >= 20 && result.layoutSpec.whitespaceTarget <= 35);

  const heroArea =
    result.layoutSpec.geometry!.hero.width * result.layoutSpec.geometry!.hero.height;
  assert.ok(heroArea >= 0.35 && heroArea <= 0.52, `hero area ${heroArea}`);

  const geo = enforceCompositionRules(
    buildGeometryFromTemplate(COMPOSITION_TEMPLATES.hero_right, "t2"),
  );
  const ef = scoreEyeFlow(geo);
  assert.equal(typeof ef.score, "number");

  console.log("composition-director specs OK", result.templateId, result.quality.total);
}

main();
