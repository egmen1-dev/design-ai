/**
 * DESIGN AI v18 — Render Adapter Stage tests (Chapter 6.12)
 */
import assert from "node:assert/strict";
import {
  RENDER_ADAPTER_STAGE_VERSION,
  RENDER_ADAPTER_STAGE_GOLDEN_RULE,
  RENDER_ADAPTER_STAGE_PIPELINE,
  RENDER_ADAPTER_STAGE_POSITION,
  RenderAdapterStage,
  MARKETPLACE_RENDER_DIMENSIONS,
  STAGE_PROVIDER_PROFILES,
  SUPPORTED_STAGE_PROVIDERS,
  resolveMarketplaceRenderDimensions,
  getStageProviderProfile,
  prepareBlueprintForAdapter,
  optimizePromptForProvider,
  buildPlannedRenderRequest,
  enforceRenderConstraints,
  compareProviderPromptStyles,
  runRenderAdapterStage,
  runRenderAdapterStageFromPipeline,
  enrichPipelineContextWithRenderAdapter,
  validateRenderAdapterStage,
  assertRenderAdapterStage,
  runRenderAdapterStageSystem,
  isRenderAdapterStageFailure,
  runConsensusValidationStageFromPipeline,
  runBlueprintAssemblyStageFromPipeline,
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  buildDefaultPipelineInput,
  runKnowledgeRetrievalStage,
  runBusinessUnderstandingStage,
  createGenerationPipelineContext,
  resetPipelineContextStores,
  frozenTestBlueprint,
  BlueprintLifecycle,
  DesignPipelineStage,
  HIGH_LEVEL_PIPELINE,
  executeDesignPipelineStage,
} from "./index";

function adapterStageInput() {
  const consensus = runConsensusValidationStageFromPipeline();
  const assembly = runBlueprintAssemblyStageFromPipeline();
  const pipelineInput = buildDefaultPipelineInput();
  const analysis = analyzeProduct(buildDefaultProductAnalysisInput());
  const knowledge = runKnowledgeRetrievalStage({
    profile: analysis.section!.profile,
    marketplace: pipelineInput.marketplace,
  });
  const business = runBusinessUnderstandingStage({
    profile: analysis.section!.profile,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });
  return {
    profile: analysis.section!.profile,
    business: business.section!,
    blueprint: consensus.section!.blueprint,
    constraintSet: assembly.section!.constraintSet,
    metadata: assembly.section!.metadata,
    knowledge: knowledge.package!,
    assemblyConflicts: assembly.section!.conflicts,
    consensusReport: consensus.section!.plannedReport,
    marketplace: pipelineInput.marketplace,
    providerId: "flux",
  };
}

function testGoldenRule() {
  assert.ok(RENDER_ADAPTER_STAGE_GOLDEN_RULE.includes("translator"));
  assert.ok(RENDER_ADAPTER_STAGE_GOLDEN_RULE.includes("never makes design decisions"));
  console.log("✔ golden rule — adapter translates blueprint, never designs");
}

function testVersionAndPipeline() {
  assert.equal(RENDER_ADAPTER_STAGE_VERSION, "6.12.0");
  assert.equal(RENDER_ADAPTER_STAGE_PIPELINE.length, 15);
  assert.equal(RENDER_ADAPTER_STAGE_PIPELINE[0], RenderAdapterStage.INPUT_ASSEMBLY);
  assert.equal(RENDER_ADAPTER_STAGE_PIPELINE[14], RenderAdapterStage.STAGE_COMPLETE);
  assert.deepEqual(RENDER_ADAPTER_STAGE_POSITION, ["consensus-validation", "render-adapter", "render-provider"]);
  console.log("✔ render adapter stage pipeline has 15 internal stages");
}

function testHighLevelPipelinePosition() {
  const adapter = HIGH_LEVEL_PIPELINE.find((s) => s.id === DesignPipelineStage.RENDER_ADAPTER)!;
  assert.equal(adapter.order, 11);
  assert.equal(adapter.makesDesignDecision, false);
  assert.ok(adapter.agentIds?.includes("flux-adapter"));
  console.log("✔ render adapter is stage 11 in design pipeline");
}

function testProviderProfiles() {
  assert.ok(SUPPORTED_STAGE_PROVIDERS.includes("flux"));
  assert.ok(SUPPORTED_STAGE_PROVIDERS.includes("gpt-image"));
  const flux = getStageProviderProfile("flux")!;
  const gpt = getStageProviderProfile("gpt-image")!;
  assert.equal(flux.negativePromptSupport, true);
  assert.equal(gpt.negativePromptSupport, false);
  assert.equal(flux.promptStyle, "short_photographic_english");
  assert.equal(gpt.promptStyle, "natural_language_paragraph");
  console.log("✔ provider profiles define per-model capabilities");
}

function testMarketplaceDimensions() {
  const wb = resolveMarketplaceRenderDimensions("wildberries");
  const amazon = resolveMarketplaceRenderDimensions("amazon");
  assert.equal(wb.width, MARKETPLACE_RENDER_DIMENSIONS.wildberries.width);
  assert.equal(wb.height, 1200);
  assert.equal(amazon.width, 2000);
  assert.equal(amazon.height, 2000);
  console.log("✔ marketplace dimensions — WB 900×1200, Amazon 2000×2000");
}

function testBlueprintPreparationFreezesLifecycle() {
  const input = adapterStageInput();
  const prepared = prepareBlueprintForAdapter(input.blueprint, "wildberries", "flux");
  assert.equal(prepared.lifecycle.stage, BlueprintLifecycle.FROZEN);
  assert.equal(prepared.meta.locked, true);
  assert.equal(prepared.render.resolution.width, 900);
  console.log("✔ blueprint preparation freezes lifecycle and applies marketplace size");
}

function testFluxPromptTranslation() {
  const report = runRenderAdapterStageFromPipeline({ providerId: "flux" });
  assert.equal(report.valid, true);
  assert.ok(report.section!.plannedRequest.positivePrompt.length > 40);
  assert.ok(report.section!.plannedRequest.negativePrompt.includes("blurry"));
  console.log("✔ flux adapter produces positive and negative prompts");
}

function testGptImagePromptStyle() {
  const flux = runRenderAdapterStageFromPipeline({ providerId: "flux" });
  const gpt = runRenderAdapterStageFromPipeline({ providerId: "gpt-image" });
  assert.equal(gpt.valid, true);
  assert.equal(gpt.section!.plannedRequest.negativePrompt, "");
  assert.notEqual(
    flux.section!.plannedRequest.positivePrompt,
    gpt.section!.plannedRequest.positivePrompt,
  );
  console.log("✔ gpt-image uses different prompt style without negative prompt");
}

function testProviderPromptComparison() {
  const bp = frozenTestBlueprint();
  const styles = compareProviderPromptStyles(bp, "amazon");
  assert.ok(styles.flux.length > 20);
  assert.ok(styles["gpt-image"].length > 20);
  assert.notEqual(styles.flux, styles["gpt-image"]);
  console.log("✔ same blueprint yields provider-specific prompt vocabulary");
}

function testNoDesignDecisions() {
  const input = adapterStageInput();
  const before = structuredClone(input.blueprint.story);
  const report = runRenderAdapterStage(input);
  assert.equal(report.valid, true);
  assert.deepEqual(input.blueprint.story, before);
  console.log("✔ adapter stage never mutates upstream blueprint input");
}

function testConstraintEnforcement() {
  const input = adapterStageInput();
  const report = runRenderAdapterStage(input);
  assert.equal(report.valid, true);
  assert.ok(!/\b(person|people)\b/i.test(report.section!.plannedRequest.positivePrompt));
  console.log("✔ constraint enforcement blocks creative additions");
}

function testPipelineFromConsensus() {
  const report = runRenderAdapterStageFromPipeline();
  assert.equal(report.valid, true);
  assert.ok(report.section!.stagesCompleted.includes(RenderAdapterStage.REQUEST_ASSEMBLY));
  assert.ok(report.section!.compiledRequest.prompt.length > 0);
  console.log("✔ pipeline chain consensus → adapter produces compiled request");
}

function testUnapprovedConsensusBlocked() {
  const input = adapterStageInput();
  const blocked = runRenderAdapterStage({
    ...input,
    consensusReport: { ...input.consensusReport, approved: false, status: "retry_required", retryRequired: true, retryTargets: ["scene-director"], conflicts: [], recommendations: [], overallScore: 40 },
  });
  assert.equal(blocked.valid, false);
  assert.ok(blocked.violations.some((v) => v.code === "CONSENSUS_NOT_APPROVED"));
  console.log("✔ unapproved consensus blocks render adapter");
}

function testContextEnrichment() {
  resetPipelineContextStores();
  const report = runRenderAdapterStageFromPipeline();
  const ctx = createGenerationPipelineContext();
  const enriched = enrichPipelineContextWithRenderAdapter(ctx, report.section!);
  assert.equal(enriched.context.render?.provider, "flux");
  assert.equal(enriched.context.render?.compiled, true);
  console.log("✔ pipeline context enriched with render adapter output");
}

function testDesignPipelineStageExecution() {
  const result = executeDesignPipelineStage(DesignPipelineStage.RENDER_ADAPTER, buildDefaultPipelineInput());
  assert.equal(result.passed, true, result.violations.map((v) => v.message).join("; "));
  console.log("✔ executeDesignPipelineStage(RENDER_ADAPTER) passes default kitchen pipeline");
}

function testSystemValidation() {
  const report = validateRenderAdapterStage();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.providerIndependent, true);
  assert.equal(report.marketplaceAdapted, true);
  assert.equal(report.downstreamReady, true);
  assert.doesNotThrow(() => assertRenderAdapterStage());
  assert.equal(runRenderAdapterStageSystem().valid, true);
  assert.equal(isRenderAdapterStageFailure("CREATIVE_ADDITION"), true);
  console.log("✔ system validation confirms adapter stage contract");
}

async function run() {
  testGoldenRule();
  testVersionAndPipeline();
  testHighLevelPipelinePosition();
  testProviderProfiles();
  testMarketplaceDimensions();
  testBlueprintPreparationFreezesLifecycle();
  testFluxPromptTranslation();
  testGptImagePromptStyle();
  testProviderPromptComparison();
  testNoDesignDecisions();
  testConstraintEnforcement();
  testPipelineFromConsensus();
  testUnapprovedConsensusBlocked();
  testContextEnrichment();
  testDesignPipelineStageExecution();
  testSystemValidation();
  console.log("\nrender-adapter-stage.spec.ts — all passed");
}

run();
