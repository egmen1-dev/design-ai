/**
 * DESIGN AI v18 — Render Adapter tests (Chapter 4.17)
 */
import assert from "node:assert/strict";
import {
  RENDER_ADAPTER_GOLDEN_RULE,
  RENDER_ADAPTER_ID,
  RENDER_ADAPTER_PIPELINE_POSITION,
  buildAdapterRenderIntent,
  validateAdapterRenderIntent,
  runRenderAdapter,
  renderAdapterAgent,
  compileRenderIntent,
  compileFluxAdapterOutput,
  ConstitutionV18Error,
  StoryType,
  MaterialWorld,
  LightingScheme,
  CameraStyle,
  PhotographyStyle,
  frozenTestBlueprint,
  createEmptyRenderBlueprint,
  BlueprintLifecycle,
} from "./index";

function testGoldenRule() {
  assert.ok(RENDER_ADAPTER_GOLDEN_RULE.includes("translator"));
  console.log("✔ golden rule — adapter translates, never designs");
}

function testPipelinePosition() {
  assert.equal(RENDER_ADAPTER_PIPELINE_POSITION[2], RENDER_ADAPTER_ID);
  assert.ok(RENDER_ADAPTER_PIPELINE_POSITION.indexOf("material-director") === 0);
  console.log("✔ render adapter follows material director");
}

function testSemanticTranslation() {
  const bp = frozenTestBlueprint();
  const { explainability } = buildAdapterRenderIntent(bp, { providerId: "flux" });
  assert.ok(explainability.semanticBlocks.some((b) => b.section === "scene"));
  assert.ok(explainability.semanticBlocks.some((b) => b.section === "lighting"));
  assert.ok(explainability.semanticBlocks.some((b) => b.section === "camera"));
  assert.ok(explainability.semanticBlocks.some((b) => b.section === "materials"));
  assert.ok(explainability.promptBlocks.length >= 4);
  console.log("✔ semantic translation extracts blueprint sections");
}

function testBlueprintIsSourceOfTruth() {
  const bp = frozenTestBlueprint();
  bp.materials.floor = "matte natural oak floor";
  bp.materials.walls = "warm oak panel walls";
  bp.materials.materialWorld = MaterialWorld.MODERN_DOMESTIC;
  const { intent } = buildAdapterRenderIntent(bp, { providerId: "flux" });
  assert.ok(intent.positivePrompt.toLowerCase().includes("oak"));
  const report = validateAdapterRenderIntent(intent, bp);
  assert.equal(report.valid, true);
  console.log("✔ blueprint materials preserved in compiled prompt");
}

function testNoCreativeAdditions() {
  const bp = frozenTestBlueprint();
  bp.background.containsPeople = false;
  const { intent } = buildAdapterRenderIntent(bp, { providerId: "flux" });
  assert.ok(!/\b(person|people|human)\b/i.test(intent.positivePrompt));
  const report = validateAdapterRenderIntent(intent, bp);
  assert.equal(report.valid, true);
  console.log("✔ adapter does not add people when blueprint forbids them");
}

function testNegativePromptDerivedFromStory() {
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.MINIMAL_LUXURY;
  const { intent } = buildAdapterRenderIntent(bp, { providerId: "flux" });
  assert.ok(intent.negativePrompt.includes("clutter"));
  assert.ok(intent.negativePrompt.includes("busy background"));
  console.log("✔ negative prompt derived from story and constraints");
}

function testAdapterRenderIntentShape() {
  const bp = frozenTestBlueprint();
  const { intent } = buildAdapterRenderIntent(bp, { providerId: "flux" });
  assert.equal(intent.provider, "flux");
  assert.ok(intent.positivePrompt.length > 40);
  assert.ok(Array.isArray(intent.styleHints));
  assert.ok(Array.isArray(intent.lightingHints));
  assert.ok(Array.isArray(intent.cameraHints));
  assert.ok(Array.isArray(intent.materialHints));
  assert.equal(intent.seed, bp.meta.seed);
  assert.equal(intent.aspectRatio, bp.render.aspectRatio);
  assert.ok(intent.confidence >= 0.7 && intent.confidence <= 1);
  console.log("✔ adapter render intent matches Chapter 4.17 contract");
}

function testRunRenderAdapterPipeline() {
  const bp = frozenTestBlueprint();
  const result = runRenderAdapter({
    blueprint: bp,
    context: { providerId: "flux", seed: bp.meta.seed },
  });
  assert.ok(result.compiled.prompt === result.intent.positivePrompt);
  assert.ok(result.explainability.reasoning.length >= 4);
  assert.equal(result.compiled.provider, "flux");
  console.log("✔ full render adapter pipeline produces compiled provider request");
}

function testCompileBlockedWhenNotFrozen() {
  const bp = createEmptyRenderBlueprint({ seed: 2, category: "x" });
  assert.throws(() => buildAdapterRenderIntent(bp, { providerId: "flux" }), ConstitutionV18Error);
  console.log("✔ adapter blocked when lifecycle not FROZEN");
}

function testAdapterNeverMutatesBlueprint() {
  const bp = frozenTestBlueprint();
  const frozen = structuredClone(bp);
  compileFluxAdapterOutput(bp);
  assert.deepEqual(frozen.meta.revision, bp.meta.revision);
  assert.deepEqual(frozen.scene, bp.scene);
  console.log("✔ render adapter never mutates blueprint");
}

function testDeterministicCompile() {
  const bp = frozenTestBlueprint();
  const a = buildAdapterRenderIntent(bp, { providerId: "flux" }).intent;
  const b = buildAdapterRenderIntent(bp, { providerId: "flux" }).intent;
  assert.equal(a.positivePrompt, b.positivePrompt);
  assert.equal(a.negativePrompt, b.negativePrompt);
  console.log("✔ compile is deterministic for same blueprint");
}

async function testLegacyAgentUsesChapter417() {
  const bp = frozenTestBlueprint();
  bp.photography.photographyStyle = PhotographyStyle.MODERN_MARKETPLACE;
  bp.lighting.lightingScheme = LightingScheme.TOP_SOFTBOX;
  bp.camera.cameraStyle = CameraStyle.MARKETPLACE_THUMB;
  bp.materials.materialWorld = MaterialWorld.MARKETPLACE_NEUTRAL;
  const result = await renderAdapterAgent.execute(bp, { providerId: "flux" });
  assert.ok(result.renderIntent.positivePrompt.length > 40);
  assert.ok(result.decisionTrace.length >= 4);
  assert.equal(compileRenderIntent(bp, "flux").provider, "flux");
  console.log("✔ legacy flux-adapter agent uses Chapter 4.17 engine");
}

async function run() {
  testGoldenRule();
  testPipelinePosition();
  testSemanticTranslation();
  testBlueprintIsSourceOfTruth();
  testNoCreativeAdditions();
  testNegativePromptDerivedFromStory();
  testAdapterRenderIntentShape();
  testRunRenderAdapterPipeline();
  testCompileBlockedWhenNotFrozen();
  testAdapterNeverMutatesBlueprint();
  testDeterministicCompile();
  await testLegacyAgentUsesChapter417();
  console.log("\nrender-adapter.spec.ts — all passed");
}

run();
