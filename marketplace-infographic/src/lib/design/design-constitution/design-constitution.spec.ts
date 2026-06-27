/**
 * Design Constitution unit specs
 * Run: npx tsx src/lib/design/design-constitution/design-constitution.spec.ts
 */
import assert from "node:assert/strict";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import { buildInitialLayoutSpec } from "@/lib/design/layout-spec";
import { runSceneDirector } from "@/lib/design/scene-blueprint";
import { runCompositionDirector } from "@/lib/design/composition-director";
import {
  validateSceneBlueprint,
  validateLayoutSpec,
  validateConstitution,
  formatConstitutionReport,
  resolveConstitutionSet,
  CONSTITUTION_PASS_THRESHOLD,
  ALL_LAWS,
  LAW_BY_ID,
} from "./index";

async function main() {
  const analysis = analyzeProductPrompt("Генератор 3 кВт для дачи");
  const setId = resolveConstitutionSet({
    category: analysis.category,
    priceSegment: analysis.priceSegment,
  });
  assert.ok(setId, "constitution set resolved");

  assert.equal(LAW_BY_ID.LAW_001.id, "LAW_001");
  assert.ok(ALL_LAWS.length >= 15);

  const sceneDirection = await runSceneDirector({
    prompt: "Генератор 3 кВт",
    analysis,
    seed: "constitution-test",
  });

  const sceneResult = validateSceneBlueprint(sceneDirection.blueprint, {
    analysis,
    sceneScore: sceneDirection.quality.total,
  });
  assert.ok(sceneResult.report.entries.length > 0);
  assert.ok(typeof sceneResult.report.overallDesignScore === "number");
  console.log(formatConstitutionReport(sceneResult.report).split("\n")[0]);

  const compositionDirection = await runCompositionDirector({
    prompt: "Генератор 3 kW",
    analysis,
    seed: "constitution-comp",
    sceneBlueprint: sceneResult.sceneBlueprint ?? sceneDirection.blueprint,
  });

  const layoutSpec =
    compositionDirection.layoutSpec ??
    buildInitialLayoutSpec({ analysis, palette: ["#111", "#eee", "#f97316"] });

  const layoutResult = validateLayoutSpec(layoutSpec, {
    analysis,
    sceneBlueprint: sceneResult.sceneBlueprint ?? sceneDirection.blueprint,
    compositionScore: compositionDirection.quality.total,
  });
  assert.ok(layoutResult.report.scores.whitespaceScore >= 0);

  const promptValidation = validateConstitution({
    stage: "prompt",
    constitutionId: setId,
    analysis,
    layoutSpec: layoutResult.layoutSpec ?? layoutSpec,
    prompt: "commercial product photography, no text, hero zone empty, lighting soft key",
  });
  assert.ok(promptValidation.report.entries.some((e) => e.lawId === "LAW_004"));

  assert.ok(CONSTITUTION_PASS_THRESHOLD === 85);
  console.log("design-constitution specs OK", setId, layoutResult.report.overallDesignScore);
}

main();
