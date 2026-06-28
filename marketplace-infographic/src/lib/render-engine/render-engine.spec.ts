/**
 * Render Engine v17 unit specs
 * Run: npx tsx src/lib/render-engine/render-engine.spec.ts
 */
import assert from "node:assert/strict";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import { planScene } from "@/lib/design/scene-planner";
import { buildInitialLayoutSpec } from "@/lib/design/layout-spec";
import { runSceneDirector } from "@/lib/design/scene-blueprint";
import { runCompositionDirector } from "@/lib/design/composition-director";
import { planRenderRequest } from "./planner/render-planner";
import { getRenderAdapter } from "./adapters/registry";
import { selectRenderModel } from "./planner/model-selection";
import { evaluateRenderQuality } from "./quality/render-quality";
import { RENDER_ENGINE_VERSION } from "./types";
import { resolveRenderProfileId } from "./profiles";
import { buildPollinationsImageUrl } from "./providers/pollinations/provider";

async function main() {
  const analysis = analyzeProductPrompt("Генератор 3 кВт для дачи");
  const scenePlan = planScene({
    prompt: "Генератор 3 кВт",
    coverConceptId: "commercial_studio",
    seed: "v17-test",
  }).scene;

  const sceneDir = await runSceneDirector({
    prompt: "Генератор 3 кВт",
    analysis,
    seed: "v17-test",
  });

  const compDir = await runCompositionDirector({
    prompt: "Генератор 3 кВт",
    analysis,
    seed: "v17-test",
    sceneBlueprint: sceneDir.blueprint,
  });

  const layoutSpec =
    compDir.layoutSpec ??
    buildInitialLayoutSpec({ analysis, palette: ["#111", "#eee", "#f97316"] });

  const profileId = resolveRenderProfileId({
    category: analysis.category,
    priceSegment: analysis.priceSegment,
    sceneType: sceneDir.blueprint.scene.type,
  });

  const request = planRenderRequest({
    analysis,
    scenePlan,
    layoutSpec,
    sceneBlueprint: sceneDir.blueprint,
    luxuryScore: 82,
    compositionScore: compDir.quality.total,
    sceneScore: sceneDir.quality.total,
  });

  assert.equal(request.version, RENDER_ENGINE_VERSION);
  assert.ok(request.scene.environment);
  assert.ok(request.layout.whitespaceTarget >= 20);
  assert.ok(request.negative.terms.length > 5);
  assert.equal(request.providerId, "pollinations");

  const model = selectRenderModel({ profileId });
  assert.ok(["flux", "kontext", "gptimage", "seedream"].includes(model));

  const adapter = getRenderAdapter(request.modelId);
  const compiled = adapter.compile(request);
  assert.ok(compiled.prompt.length > 80 && compiled.prompt.length < 1200);
  assert.ok(compiled.modulesUsed.length >= 3);
  assert.ok(compiled.modulesIgnored.includes("layout_coordinates"));
  assert.ok(!compiled.prompt.includes("x=0.50"), "coordinates must not leak to flux prompt");
  assert.ok(
    !("nologo" in (compiled.extraParams ?? {})),
    "nologo is not a valid Pollinations query param",
  );

  const url = buildPollinationsImageUrl(compiled);
  assert.ok(url.includes("negative_prompt=") || !compiled.negativePrompt);
  assert.ok(!url.includes("nologo="), "URL must not include nologo param");
  assert.ok(!url.includes("negative="), "URL must use negative_prompt not negative");

  const quality = evaluateRenderQuality({ request, layoutSpec });
  assert.ok(quality.overallDesignScore >= 0);

  console.log("render-engine specs OK", profileId, request.modelId, compiled.prompt.length);
}

main();
