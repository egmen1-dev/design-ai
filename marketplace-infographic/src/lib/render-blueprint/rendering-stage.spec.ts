/**
 * DESIGN AI v18 — Rendering Stage tests (Chapter 6.13)
 */
import assert from "node:assert/strict";
import {
  RENDERING_STAGE_VERSION,
  RENDERING_STAGE_GOLDEN_RULE,
  RENDERING_STAGE_PIPELINE,
  RENDERING_STAGE_POSITION,
  RenderingStage,
  RenderingRetryLevel,
  DEFAULT_PROVIDER_RETRY_ATTEMPTS,
  plannedRequestToStageRenderRequest,
  createDefaultStageRenderProvider,
  validateStageRenderRequest,
  validateTechnicalImageQuality,
  classifyRenderingError,
  persistRenderingResult,
  buildGenerationMetadata,
  runRenderingStage,
  runRenderingStageSync,
  runRenderingStageFromPipeline,
  runRenderingStageSyncFromPipeline,
  enrichPipelineContextWithRendering,
  resetRenderingStorageRegistry,
  getRenderingStorageRecord,
  validateRenderingStage,
  assertRenderingStage,
  runRenderingStageSystem,
  isRenderingStageFailure,
  runRenderAdapterStageFromPipeline,
  runBlueprintAssemblyStageFromPipeline,
  createGenerationPipelineContext,
  resetPipelineContextStores,
  DesignPipelineStage,
  HIGH_LEVEL_PIPELINE,
  executeDesignPipelineStage,
  buildDefaultPipelineInput,
} from "./index";

function renderingStageInput() {
  const adapter = runRenderAdapterStageFromPipeline({ providerId: "flux" });
  const assembly = runBlueprintAssemblyStageFromPipeline();
  return {
    renderRequest: adapter.section!.plannedRequest,
    compiledRequest: adapter.section!.compiledRequest,
    blueprintMetadata: assembly.section!.metadata,
    blueprintId: adapter.section!.blueprint.meta.id,
    providerProfile: adapter.section!.providerProfile,
  };
}

function testGoldenRule() {
  assert.ok(RENDERING_STAGE_GOLDEN_RULE.includes("does not create design"));
  assert.ok(RENDERING_STAGE_GOLDEN_RULE.includes("creates the image"));
  console.log("✔ golden rule — rendering executes, never designs");
}

function testVersionAndPipeline() {
  assert.equal(RENDERING_STAGE_VERSION, "6.13.0");
  assert.equal(RENDERING_STAGE_PIPELINE.length, 15);
  assert.equal(RENDERING_STAGE_PIPELINE[0], RenderingStage.INPUT_ASSEMBLY);
  assert.equal(RENDERING_STAGE_PIPELINE[14], RenderingStage.STAGE_COMPLETE);
  assert.deepEqual(RENDERING_STAGE_POSITION, ["render-adapter", "render-provider", "vision-analysis"]);
  console.log("✔ rendering stage pipeline has 15 internal stages");
}

function testHighLevelPipelinePosition() {
  const rendering = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.RENDER_PROVIDER)!;
  assert.equal(rendering.order, 12);
  assert.equal(rendering.makesDesignDecision, false);
  console.log("✔ render provider is stage 12 in design pipeline");
}

function testStageRenderRequestFromAdapter() {
  const input = renderingStageInput();
  const request = plannedRequestToStageRenderRequest(input.renderRequest);
  assert.ok(request.prompt.length > 20);
  assert.equal(request.provider, "flux");
  assert.equal(validateStageRenderRequest(request).length, 0);
  console.log("✔ stage render request derived from adapter output only");
}

async function testSuccessfulGeneration() {
  resetRenderingStorageRegistry();
  const report = await runRenderingStageFromPipeline({ providerId: "flux" });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.ok(report.section!.plannedResult.image.startsWith("data:image/png"));
  assert.ok(report.section!.imageRef.startsWith("render/"));
  assert.ok(getRenderingStorageRecord(report.section!.imageRef));
  console.log("✔ rendering stage produces image and storage record");
}

async function testTechnicalQualityGate() {
  const input = renderingStageInput();
  const request = plannedRequestToStageRenderRequest(input.renderRequest);
  const bad = validateTechnicalImageQuality(
    { image: "", metadata: {}, generationTime: 0, provider: "flux", warnings: [] },
    request,
  );
  assert.ok(bad.some((v) => v.code === "MISSING_IMAGE"));
  console.log("✔ technical quality gate rejects missing image");
}

async function testProviderRetry() {
  resetRenderingStorageRegistry();
  let calls = 0;
  const provider = {
    generate(request: { width: number; height: number; provider: string }) {
      calls += 1;
      if (calls === 1) throw new Error("provider API error");
      return {
        image: `data:image/png;base64,mock-flux-${request.width}x${request.height}`,
        metadata: { width: request.width, height: request.height },
        generationTime: 25,
        provider: request.provider,
        warnings: [],
      };
    },
  };
  const input = renderingStageInput();
  const report = await runRenderingStage(input, { provider, maxProviderRetries: DEFAULT_PROVIDER_RETRY_ATTEMPTS });
  assert.equal(report.valid, true);
  assert.equal(report.section!.retryRecommendation.attemptsUsed, 2);
  assert.equal(report.section!.retryRecommendation.level, RenderingRetryLevel.PROVIDER);
  console.log("✔ provider retry recovers from transient API failure");
}

function testRetryClassification() {
  assert.equal(classifyRenderingError(new Error("network down"), { simulateNetworkError: true }), RenderingRetryLevel.PROVIDER);
  assert.equal(classifyRenderingError(new Error("blueprint invalid"), {}), RenderingRetryLevel.PIPELINE);
  assert.equal(classifyRenderingError(new Error("adapter compile failed"), {}), RenderingRetryLevel.ADAPTER);
  console.log("✔ rendering errors classified into retry levels");
}

async function testCorruptedImageBlocked() {
  const report = await runRenderingStageFromPipeline({ simulateCorruptedImage: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "CORRUPTED_IMAGE"));
  console.log("✔ corrupted image fails technical gate");
}

async function testMetadataRecording() {
  resetRenderingStorageRegistry();
  const report = await runRenderingStageFromPipeline();
  assert.ok(report.section!.generationMetadata.pipelineVersion);
  assert.ok(report.section!.generationMetadata.knowledgeVersion);
  assert.equal(report.section!.generationMetadata.provider, "flux");
  console.log("✔ generation metadata records pipeline and knowledge versions");
}

function testDefaultProviderContract() {
  const provider = createDefaultStageRenderProvider();
  const result = provider.generate({
    provider: "flux",
    prompt: "commercial kitchen backdrop",
    negativePrompt: "text",
    width: 900,
    height: 1200,
    seed: 42,
    aspectRatio: "3:4",
    quality: "production",
  });
  assert.ok(!(result instanceof Promise));
  assert.ok(String(result.image).includes("900x1200"));
  console.log("✔ default stage render provider implements generate contract");
}

async function testPipelineChain() {
  const report = await runRenderingStageFromPipeline();
  assert.equal(report.valid, true);
  assert.ok(report.section!.stagesCompleted.includes(RenderingStage.VISION_HANDOFF));
  assert.equal(report.section!.visionReady, true);
  console.log("✔ adapter → rendering chain hands off to vision validation");
}

function testSyncPipelinePath() {
  resetRenderingStorageRegistry();
  const report = runRenderingStageSyncFromPipeline({ providerId: "flux" });
  assert.equal(report.valid, true);
  console.log("✔ synchronous rendering path works for design pipeline executor");
}

async function testContextEnrichment() {
  resetPipelineContextStores();
  resetRenderingStorageRegistry();
  const report = await runRenderingStageFromPipeline();
  const ctx = createGenerationPipelineContext();
  const enriched = enrichPipelineContextWithRendering(ctx, report.section!);
  assert.equal(enriched.context.render.status, "completed");
  assert.ok(enriched.context.render.compiledPrompt);
  console.log("✔ pipeline context enriched with rendered image reference");
}

function testDesignPipelineStageExecution() {
  resetRenderingStorageRegistry();
  const result = executeDesignPipelineStage(DesignPipelineStage.RENDER_PROVIDER, buildDefaultPipelineInput());
  assert.equal(result.passed, true, result.violations.map((v) => v.message).join("; "));
  console.log("✔ executeDesignPipelineStage(RENDER_PROVIDER) passes default kitchen pipeline");
}

async function testSystemValidation() {
  const report = await validateRenderingStage();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.providerIndependent, true);
  assert.equal(report.retrySupported, true);
  assert.equal(report.storagePersisted, true);
  assert.equal(report.technicalGatePassed, true);
  assert.equal(report.downstreamReady, true);
  await assertRenderingStage();
  assert.equal((await runRenderingStageSystem()).valid, true);
  assert.equal(isRenderingStageFailure("CORRUPTED_IMAGE"), true);
  console.log("✔ system validation confirms rendering stage contract");
}

async function run() {
  testGoldenRule();
  testVersionAndPipeline();
  testHighLevelPipelinePosition();
  testStageRenderRequestFromAdapter();
  await testSuccessfulGeneration();
  await testTechnicalQualityGate();
  await testProviderRetry();
  testRetryClassification();
  await testCorruptedImageBlocked();
  await testMetadataRecording();
  testDefaultProviderContract();
  await testPipelineChain();
  testSyncPipelinePath();
  await testContextEnrichment();
  testDesignPipelineStageExecution();
  await testSystemValidation();
  console.log("\nrendering-stage.spec.ts — all passed");
}

run();
