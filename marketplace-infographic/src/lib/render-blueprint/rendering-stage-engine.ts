/**
 * Chapter 6.13 — Rendering Stage engine.
 * Executes Render Request via Provider API — obtains image, never evaluates artistic quality.
 */
import { CURRENT_PIPELINE_VERSION } from "./blueprint-version";
import { KNOWLEDGE_RETRIEVAL_STAGE_VERSION } from "./knowledge-retrieval-stage-engine";
import { runRenderAdapterStageFromPipeline } from "./render-adapter-stage-engine";
import { RENDER_ADAPTER_ID } from "./render-adapter-engine";
import { runBlueprintAssemblyStageFromPipeline } from "./blueprint-assembly-stage-engine";
import {
  applyContextPatch,
  PipelineContextSection,
  type GenerationPipelineContext,
} from "./pipeline-context-engine";
import { RenderPipeline, toProviderRequest } from "./render-pipeline";
import type { ProviderRequest, ProviderResponse } from "./render-pipeline-types";
import {
  RenderingStage,
  type PlannedRenderResult,
  type RenderingGenerationMetadata,
  type RenderingRetryLevelId,
  type RenderingRetryRecommendation,
  type RenderingStageContext,
  type RenderingStageFailureCode,
  type RenderingStageId,
  type RenderingStageInput,
  type RenderingStageReport,
  type RenderingStageSection,
  type RenderingStageSystemReport,
  type RenderingStageViolation,
  type RenderingStorageRecord,
  type StageRenderProvider,
  type StageRenderRequest,
} from "./rendering-stage-types";

export {
  RenderingStage,
  RenderingRetryLevel,
  type RenderingStageId,
  type RenderingRetryLevelId,
  type StageRenderRequest,
  type PlannedRenderResult,
  type StageRenderProvider,
  type RenderingGenerationMetadata,
  type RenderingStorageRecord,
  type RenderingRetryRecommendation,
  type RenderingStageInput,
  type RenderingStageSection,
  type RenderingStageViolation,
  type RenderingStageReport,
  type RenderingStageContext,
  type RenderingStageSystemReport,
  type RenderingStageFailureCode,
} from "./rendering-stage-types";

export const RENDERING_STAGE_VERSION = "6.13.0";

export const RENDERING_STAGE_GOLDEN_RULE =
  "Rendering Stage does not create design — it creates the image. " +
  "All design decisions were already made by specialized agents before generation begins.";

export const RENDERING_STAGE_PIPELINE: readonly RenderingStageId[] = [
  RenderingStage.INPUT_ASSEMBLY,
  RenderingStage.REQUEST_VALIDATION,
  RenderingStage.PROVIDER_DISPATCH,
  RenderingStage.API_COMMUNICATION,
  RenderingStage.GENERATION_EXECUTION,
  RenderingStage.RESPONSE_RECEIPT,
  RenderingStage.TECHNICAL_QUALITY_GATE,
  RenderingStage.ERROR_HANDLING,
  RenderingStage.RETRY_PLANNING,
  RenderingStage.STORAGE_PERSISTENCE,
  RenderingStage.METADATA_RECORDING,
  RenderingStage.REPRODUCIBILITY_ARCHIVE,
  RenderingStage.VISION_HANDOFF,
  RenderingStage.VALIDATION,
  RenderingStage.STAGE_COMPLETE,
] as const;

export const RENDERING_STAGE_POSITION = [
  "render-adapter",
  "render-provider",
  "vision-analysis",
] as const;

export const RENDERING_STAGE_ACTOR = RENDER_ADAPTER_ID;

export const DEFAULT_PROVIDER_RETRY_ATTEMPTS = 3;

const renderingStorageRegistry = new Map<string, RenderingStorageRecord>();

function violation(
  code: RenderingStageFailureCode,
  message: string,
  stage?: RenderingStageId,
): RenderingStageViolation {
  return { code, message, stage };
}

export function resetRenderingStorageRegistry(): void {
  renderingStorageRegistry.clear();
}

export function getRenderingStorageRecord(imageRef: string): RenderingStorageRecord | undefined {
  return renderingStorageRegistry.get(imageRef);
}

export function plannedRequestToStageRenderRequest(
  request: RenderingStageInput["renderRequest"],
): StageRenderRequest {
  return {
    provider: request.provider,
    prompt: request.positivePrompt,
    negativePrompt: request.negativePrompt,
    width: request.width,
    height: request.height,
    seed: request.seed,
    aspectRatio: request.aspectRatio,
    quality: request.quality,
    guidance: request.guidance,
    steps: request.steps,
  };
}

export function providerResponseToPlannedResult(
  response: ProviderResponse,
  generationTimeMs: number,
): PlannedRenderResult {
  return {
    image: response.image,
    metadata: {
      ...response.metadata,
      success: response.success,
    },
    generationTime: generationTimeMs,
    provider: response.provider,
    warnings: response.success ? [] : ["provider returned failure"],
  };
}

export function createDefaultStageRenderProvider(): StageRenderProvider {
  return {
    generate(request: StageRenderRequest): PlannedRenderResult {
      return {
        image: `data:image/png;base64,mock-${request.provider}-${request.width}x${request.height}`,
        metadata: {
          model: request.provider,
          seed: request.seed,
          width: request.width,
          height: request.height,
        },
        generationTime: 48,
        provider: request.provider,
        warnings: [],
      };
    },
  };
}

export function createPipelineStageRenderProvider(
  renderFn?: (request: ProviderRequest) => Promise<ProviderResponse>,
): StageRenderProvider {
  const pipeline = new RenderPipeline({ renderFn });
  return {
    async generate(request: StageRenderRequest): Promise<PlannedRenderResult> {
      const providerRequest: ProviderRequest = {
        prompt: request.prompt,
        negativePrompt: request.negativePrompt,
        width: request.width,
        height: request.height,
        seed: request.seed,
        steps: request.steps ?? 20,
        cfg: request.guidance ?? 7,
        provider: request.provider as ProviderRequest["provider"],
        providerOptions: {
          quality: request.quality,
          aspectRatio: request.aspectRatio,
        },
      };
      const started = Date.now();
      const adapter = pipeline.getAdapter(providerRequest.provider);
      if (!adapter) {
        throw new Error(`No adapter for provider ${request.provider}`);
      }
      const response = await adapter.render(providerRequest);
      return providerResponseToPlannedResult(response, Date.now() - started);
    },
  };
}

export function validateStageRenderRequest(
  request: StageRenderRequest,
): RenderingStageViolation[] {
  const violations: RenderingStageViolation[] = [];
  if (!request.prompt || request.prompt.length < 10) {
    violations.push(
      violation("MISSING_RENDER_REQUEST", "Render request must include compiled prompt", RenderingStage.REQUEST_VALIDATION),
    );
  }
  if (request.width < 100 || request.height < 100) {
    violations.push(
      violation("INVALID_PARAMETERS", "Image dimensions below minimum threshold", RenderingStage.REQUEST_VALIDATION),
    );
  }
  if (!request.provider) {
    violations.push(
      violation("MISSING_RENDER_REQUEST", "Provider must be specified", RenderingStage.REQUEST_VALIDATION),
    );
  }
  return violations;
}

export function classifyRenderingError(
  error: Error,
  context: RenderingStageContext = {},
): RenderingRetryLevelId {
  if (context.forcePipelineRetry) return "pipeline_retry";
  if (context.simulateNetworkError || /network|econnrefused/i.test(error.message)) {
    return "provider_retry";
  }
  if (context.simulateTimeout || /timeout/i.test(error.message)) {
    return "provider_retry";
  }
  if (/blueprint|constraint|validation/i.test(error.message)) {
    return "pipeline_retry";
  }
  if (/prompt|adapter|compile/i.test(error.message)) {
    return "adapter_retry";
  }
  return "provider_retry";
}

export function planRenderingRetry(
  level: RenderingRetryLevelId,
  attemptsUsed: number,
  maxAttempts: number,
  reason: string,
): RenderingRetryRecommendation {
  return { level, reason, maxAttempts, attemptsUsed };
}

export function validateTechnicalImageQuality(
  result: PlannedRenderResult,
  request: StageRenderRequest,
  context: RenderingStageContext = {},
): RenderingStageViolation[] {
  const violations: RenderingStageViolation[] = [];

  if (!result.image || result.image.length < 8) {
    violations.push(
      violation("MISSING_IMAGE", "Provider did not return image data", RenderingStage.TECHNICAL_QUALITY_GATE),
    );
  }

  if (context.simulateCorruptedImage || result.image === "CORRUPTED") {
    violations.push(
      violation("CORRUPTED_IMAGE", "Image payload is corrupted", RenderingStage.TECHNICAL_QUALITY_GATE),
    );
  }

  const formatOk =
    result.image.startsWith("data:image/") ||
    result.image.endsWith(".png") ||
    result.image.endsWith(".jpg") ||
    result.image.endsWith(".jpeg") ||
    result.image.startsWith("render/");
  if (result.image && !formatOk) {
    violations.push(
      violation("INVALID_FORMAT", "Image format is not supported", RenderingStage.TECHNICAL_QUALITY_GATE),
    );
  }

  const metaWidth = Number(result.metadata.width ?? request.width);
  const metaHeight = Number(result.metadata.height ?? request.height);
  if (metaWidth !== request.width || metaHeight !== request.height) {
    const embedded = new RegExp(`${request.width}x${request.height}`).test(result.image);
    if (!embedded) {
      violations.push(
        violation(
          "RESOLUTION_MISMATCH",
          `Expected ${request.width}×${request.height}, received ${metaWidth}×${metaHeight}`,
          RenderingStage.TECHNICAL_QUALITY_GATE,
        ),
      );
    }
  }

  return violations;
}

export function buildGenerationMetadata(
  input: RenderingStageInput,
  request: StageRenderRequest,
  result: PlannedRenderResult,
): RenderingGenerationMetadata {
  return {
    provider: result.provider,
    generationTimeMs: result.generationTime,
    pipelineVersion: input.blueprintMetadata.pipelineVersion ?? CURRENT_PIPELINE_VERSION,
    knowledgeVersion: input.blueprintMetadata.knowledgeEngineVersion ?? KNOWLEDGE_RETRIEVAL_STAGE_VERSION,
    blueprintId: input.blueprintId,
    seed: request.seed,
    width: request.width,
    height: request.height,
    warnings: result.warnings,
  };
}

export function persistRenderingResult(
  input: RenderingStageInput,
  request: StageRenderRequest,
  result: PlannedRenderResult,
  metadata: RenderingGenerationMetadata,
): RenderingStorageRecord {
  const imageRef = `render/${input.blueprintId}-${result.provider}-${Date.now()}.png`;
  const record: RenderingStorageRecord = {
    imageRef,
    blueprintId: input.blueprintId,
    prompt: request.prompt,
    negativePrompt: request.negativePrompt,
    provider: result.provider,
    generationTimeMs: result.generationTime,
    pipelineVersion: metadata.pipelineVersion,
    knowledgeVersion: metadata.knowledgeVersion,
    storedAt: Date.now(),
  };
  renderingStorageRegistry.set(imageRef, record);
  return record;
}

async function executeProviderGeneration(
  provider: StageRenderProvider,
  request: StageRenderRequest,
  context: RenderingStageContext,
): Promise<{ result?: PlannedRenderResult; error?: Error; attemptsUsed: number }> {
  const maxAttempts = context.maxProviderRetries ?? DEFAULT_PROVIDER_RETRY_ATTEMPTS;
  let attemptsUsed = 0;
  let lastError: Error | undefined;

  while (attemptsUsed < maxAttempts) {
    attemptsUsed += 1;
    try {
      if (context.simulateNetworkError && attemptsUsed === 1) {
        throw new Error("network connection refused");
      }
      if (context.simulateTimeout && attemptsUsed === 1) {
        throw new Error("provider request timeout");
      }
      if (context.simulateProviderFailure && attemptsUsed < maxAttempts) {
        throw new Error("provider API error");
      }

      const generated = await provider.generate(request);
      if (context.simulateCorruptedImage) {
        return { result: { ...generated, image: "CORRUPTED" }, attemptsUsed };
      }
      return { result: generated, attemptsUsed };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  return { error: lastError, attemptsUsed };
}

function buildRenderingStageReport(
  input: RenderingStageInput,
  stageRequest: StageRenderRequest,
  execution: { result?: PlannedRenderResult; error?: Error; attemptsUsed: number },
  context: RenderingStageContext,
  started: number,
  stagesCompleted: RenderingStageId[],
): RenderingStageReport {
  const violations: RenderingStageViolation[] = [];

  if (!execution.result) {
    violations.push(
      violation(
        context.simulateNetworkError ? "NETWORK_ERROR" : context.simulateTimeout ? "TIMEOUT_ERROR" : "PROVIDER_ERROR",
        execution.error?.message ?? "Provider generation failed",
        RenderingStage.ERROR_HANDLING,
      ),
    );
    stagesCompleted.push(RenderingStage.ERROR_HANDLING, RenderingStage.RETRY_PLANNING);
    return {
      valid: false,
      violations,
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  stagesCompleted.push(RenderingStage.RESPONSE_RECEIPT);

  const technicalViolations = validateTechnicalImageQuality(execution.result, stageRequest, context);
  violations.push(...technicalViolations);
  stagesCompleted.push(RenderingStage.TECHNICAL_QUALITY_GATE);

  const retryLevel = classifyRenderingError(new Error("none"), context);
  const retryRecommendation = planRenderingRetry(
    retryLevel,
    execution.attemptsUsed,
    context.maxProviderRetries ?? DEFAULT_PROVIDER_RETRY_ATTEMPTS,
    execution.attemptsUsed > 1 ? "Provider retry succeeded" : "Generation succeeded on first attempt",
  );
  stagesCompleted.push(RenderingStage.ERROR_HANDLING, RenderingStage.RETRY_PLANNING);

  const generationMetadata = buildGenerationMetadata(input, stageRequest, execution.result);
  if (!generationMetadata.pipelineVersion || !generationMetadata.knowledgeVersion) {
    violations.push(
      violation("MISSING_METADATA", "Generation metadata must include pipeline and knowledge versions", RenderingStage.METADATA_RECORDING),
    );
  }

  const storageRecord = persistRenderingResult(input, stageRequest, execution.result, generationMetadata);
  if (!getRenderingStorageRecord(storageRecord.imageRef)) {
    violations.push(
      violation("STORAGE_FAILED", "Failed to persist rendering result", RenderingStage.STORAGE_PERSISTENCE),
    );
  }
  stagesCompleted.push(
    RenderingStage.STORAGE_PERSISTENCE,
    RenderingStage.METADATA_RECORDING,
    RenderingStage.REPRODUCIBILITY_ARCHIVE,
  );

  const visionReady = violations.length === 0 && !!execution.result.image;
  if (!visionReady) {
    violations.push(
      violation("VISION_NOT_READY", "Image not ready for vision validation", RenderingStage.VISION_HANDOFF),
    );
  } else {
    stagesCompleted.push(RenderingStage.VISION_HANDOFF);
  }

  stagesCompleted.push(RenderingStage.VALIDATION);

  const section: RenderingStageSection = {
    plannedResult: execution.result,
    renderRequest: stageRequest,
    storageRecord,
    generationMetadata,
    retryRecommendation,
    imageRef: storageRecord.imageRef,
    stagesCompleted: [...stagesCompleted],
    confidence: visionReady ? 0.94 : 0.2,
    visionReady,
  };

  stagesCompleted.push(RenderingStage.STAGE_COMPLETE);
  section.stagesCompleted = stagesCompleted;

  return {
    valid: violations.length === 0,
    violations,
    section,
    stagesCompleted,
    durationMs: Date.now() - started,
  };
}

function prepareRenderingExecution(
  input: RenderingStageInput,
  context: RenderingStageContext,
): { ok: false; report: RenderingStageReport } | { ok: true; stageRequest: StageRenderRequest; stagesCompleted: RenderingStageId[]; started: number } {
  const started = Date.now();
  const stagesCompleted: RenderingStageId[] = [];

  if (context.missingRequest || !input.renderRequest) {
    return {
      ok: false,
      report: {
        valid: false,
        violations: [violation("MISSING_RENDER_REQUEST", "Render request required from adapter stage")],
        stagesCompleted,
        durationMs: Date.now() - started,
      },
    };
  }

  stagesCompleted.push(RenderingStage.INPUT_ASSEMBLY);

  const stageRequest = plannedRequestToStageRenderRequest(input.renderRequest);
  const requestViolations = validateStageRenderRequest(stageRequest);
  if (requestViolations.length > 0) {
    return {
      ok: false,
      report: {
        valid: false,
        violations: requestViolations,
        stagesCompleted,
        durationMs: Date.now() - started,
      },
    };
  }

  stagesCompleted.push(RenderingStage.REQUEST_VALIDATION);
  stagesCompleted.push(RenderingStage.PROVIDER_DISPATCH, RenderingStage.API_COMMUNICATION);

  return { ok: true, stageRequest, stagesCompleted, started };
}

/** Synchronous rendering path for design-pipeline stage executor (default mock provider only). */
export function runRenderingStageSync(
  input: RenderingStageInput,
  context: RenderingStageContext = {},
): RenderingStageReport {
  const prepared = prepareRenderingExecution(input, context);
  if (!prepared.ok) return prepared.report;

  const { stageRequest, stagesCompleted, started } = prepared;
  const provider = context.provider ?? createDefaultStageRenderProvider();

  let execution: { result?: PlannedRenderResult; error?: Error; attemptsUsed: number };
  try {
    const generated = provider.generate(stageRequest);
    if (generated instanceof Promise) {
      throw new Error("Sync rendering requires synchronous provider");
    }
    execution = {
      result: context.simulateCorruptedImage ? { ...generated, image: "CORRUPTED" } : generated,
      attemptsUsed: 1,
    };
  } catch (error) {
    execution = {
      error: error instanceof Error ? error : new Error(String(error)),
      attemptsUsed: 1,
    };
  }

  stagesCompleted.push(RenderingStage.GENERATION_EXECUTION);
  return buildRenderingStageReport(input, stageRequest, execution, context, started, stagesCompleted);
}

export async function runRenderingStage(
  input: RenderingStageInput,
  context: RenderingStageContext = {},
): Promise<RenderingStageReport> {
  const prepared = prepareRenderingExecution(input, context);
  if (!prepared.ok) return prepared.report;

  const { stageRequest, stagesCompleted, started } = prepared;
  const provider = context.provider ?? createDefaultStageRenderProvider();
  const execution = await executeProviderGeneration(provider, stageRequest, context);
  stagesCompleted.push(RenderingStage.GENERATION_EXECUTION);
  return buildRenderingStageReport(input, stageRequest, execution, context, started, stagesCompleted);
}

export function enrichPipelineContextWithRendering(
  ctx: GenerationPipelineContext,
  section: RenderingStageSection,
): { context: GenerationPipelineContext; violations: RenderingStageViolation[] } {
  const patch = applyContextPatch(ctx, {
    agentId: RENDERING_STAGE_ACTOR,
    section: PipelineContextSection.RENDER,
    changes: {
      provider: section.plannedResult.provider,
      imageRef: section.imageRef,
      generationTimeMs: section.generationMetadata.generationTimeMs,
      status: section.visionReady ? "completed" : "failed",
    },
    reason: "Rendering Stage persisted generated image for vision validation",
  });

  return {
    context: {
      ...patch.context,
      render: {
        ...patch.context.render,
        provider: section.plannedResult.provider,
        compiledPrompt: section.renderRequest.prompt,
        settings: {
          width: section.renderRequest.width,
          height: section.renderRequest.height,
          seed: section.renderRequest.seed,
        },
        status: section.visionReady ? "completed" : "failed",
      },
      lifecycle: section.visionReady ? "render_ready" : patch.context.lifecycle,
    },
    violations: patch.violations as RenderingStageViolation[],
  };
}

export function runRenderingStageSyncFromPipeline(
  context: RenderingStageContext = {},
): RenderingStageReport {
  const adapter = runRenderAdapterStageFromPipeline({
    marketplace: context.marketplace,
    providerId: context.providerId ?? "flux",
  });

  if (!adapter.valid || !adapter.section) {
    return {
      valid: false,
      violations: [violation("MISSING_RENDER_REQUEST", "Render Adapter must complete before Rendering Stage")],
      stagesCompleted: [],
      durationMs: 0,
    };
  }

  const assembly = runBlueprintAssemblyStageFromPipeline();

  return runRenderingStageSync(
    {
      renderRequest: adapter.section.plannedRequest,
      compiledRequest: adapter.section.compiledRequest,
      blueprintMetadata: assembly.section?.metadata ?? {
        pipelineVersion: CURRENT_PIPELINE_VERSION,
        knowledgeEngineVersion: KNOWLEDGE_RETRIEVAL_STAGE_VERSION,
        patternLibraryVersion: "1.0.0",
        designRulesVersion: "1.0.0",
        marketplaceProfileVersion: "12.0.0",
        agentsUsed: [],
        assemblyHistory: [],
      },
      blueprintId: adapter.section.blueprint.meta.id,
      providerProfile: adapter.section.providerProfile,
    },
    context,
  );
}

export async function runRenderingStageFromPipeline(
  context: RenderingStageContext = {},
): Promise<RenderingStageReport> {
  const adapter = runRenderAdapterStageFromPipeline({
    marketplace: context.marketplace,
    providerId: context.providerId ?? "flux",
  });

  if (!adapter.valid || !adapter.section) {
    return {
      valid: false,
      violations: [violation("MISSING_RENDER_REQUEST", "Render Adapter must complete before Rendering Stage")],
      stagesCompleted: [],
      durationMs: 0,
    };
  }

  const assembly = runBlueprintAssemblyStageFromPipeline();

  return runRenderingStage(
    {
      renderRequest: adapter.section.plannedRequest,
      compiledRequest: adapter.section.compiledRequest,
      blueprintMetadata: assembly.section?.metadata ?? {
        pipelineVersion: CURRENT_PIPELINE_VERSION,
        knowledgeEngineVersion: KNOWLEDGE_RETRIEVAL_STAGE_VERSION,
        patternLibraryVersion: "1.0.0",
        designRulesVersion: "1.0.0",
        marketplaceProfileVersion: "12.0.0",
        agentsUsed: [],
        assemblyHistory: [],
      },
      blueprintId: adapter.section.blueprint.meta.id,
      providerProfile: adapter.section.providerProfile,
    },
    context,
  );
}

export async function validateRenderingStage(
  context: RenderingStageContext = {},
): Promise<RenderingStageSystemReport> {
  resetRenderingStorageRegistry();
  const violations: RenderingStageViolation[] = [];

  const kitchen = await runRenderingStageFromPipeline(context);
  if (!kitchen.valid || !kitchen.section) {
    violations.push(...kitchen.violations);
  }

  const kitchenStoragePersisted = !!kitchen.section && !!getRenderingStorageRecord(kitchen.section.imageRef);

  if (kitchen.section) {
    if (!kitchen.section.generationMetadata.pipelineVersion) {
      violations.push(violation("MISSING_METADATA", "Pipeline version must be recorded"));
    }
  }

  resetRenderingStorageRegistry();
  let retrySucceeded = false;
  const retryProvider: StageRenderProvider = {
    generate(request) {
      const state = (retryProvider as StageRenderProvider & { calls: number }).calls ?? 0;
      (retryProvider as StageRenderProvider & { calls: number }).calls = state + 1;
      if (state === 0) throw new Error("provider API error");
      return {
        image: `data:image/png;base64,mock-${request.provider}-${request.width}x${request.height}`,
        metadata: { width: request.width, height: request.height },
        generationTime: 30,
        provider: request.provider,
        warnings: [],
      };
    },
  };
  (retryProvider as StageRenderProvider & { calls: number }).calls = 0;

  const adapter = runRenderAdapterStageFromPipeline({ providerId: "flux" });
  const assembly = runBlueprintAssemblyStageFromPipeline();
  if (adapter.section) {
    const retried = await runRenderingStage(
      {
        renderRequest: adapter.section.plannedRequest,
        compiledRequest: adapter.section.compiledRequest,
        blueprintMetadata: assembly.section?.metadata ?? {
          pipelineVersion: CURRENT_PIPELINE_VERSION,
          knowledgeEngineVersion: KNOWLEDGE_RETRIEVAL_STAGE_VERSION,
          patternLibraryVersion: "1.0.0",
          designRulesVersion: "1.0.0",
          marketplaceProfileVersion: "12.0.0",
          agentsUsed: [],
          assemblyHistory: [],
        },
        blueprintId: adapter.section.blueprint.meta.id,
        providerProfile: adapter.section.providerProfile,
      },
      { provider: retryProvider, maxProviderRetries: 3 },
    );
    retrySucceeded = retried.valid === true && retried.section?.retryRecommendation.attemptsUsed === 2;
    if (!retrySucceeded) {
      violations.push(violation("PROVIDER_ERROR", "Provider retry must recover from transient failure"));
    }
  }

  const corrupted = await runRenderingStageFromPipeline({ simulateCorruptedImage: true });
  if (corrupted.valid) {
    violations.push(violation("CORRUPTED_IMAGE", "Corrupted image must fail technical gate"));
  }

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    providerIndependent: !!kitchen.section && kitchen.section.renderRequest.prompt.length > 0,
    retrySupported: retrySucceeded,
    metadataComplete: !!kitchen.section?.generationMetadata.knowledgeVersion,
    storagePersisted: kitchenStoragePersisted,
    technicalGatePassed: !!kitchen.section?.visionReady,
    downstreamReady: !!kitchen.section?.imageRef,
  };
}

export async function assertRenderingStage(
  context: RenderingStageContext = {},
): Promise<RenderingStageSystemReport> {
  const report = await validateRenderingStage(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Rendering Stage failed: ${messages}`);
  }
  return report;
}

export async function runRenderingStageSystem(
  context: RenderingStageContext = {},
): Promise<RenderingStageSystemReport> {
  return validateRenderingStage(context);
}

export function isRenderingStageFailure(code: string): code is RenderingStageFailureCode {
  const codes: RenderingStageFailureCode[] = [
    "MISSING_RENDER_REQUEST",
    "INVALID_PARAMETERS",
    "PROVIDER_ERROR",
    "NETWORK_ERROR",
    "TIMEOUT_ERROR",
    "MISSING_IMAGE",
    "CORRUPTED_IMAGE",
    "RESOLUTION_MISMATCH",
    "INVALID_FORMAT",
    "MISSING_METADATA",
    "STORAGE_FAILED",
    "DESIGN_DECISION_DETECTED",
    "VISION_NOT_READY",
  ];
  return codes.includes(code as RenderingStageFailureCode);
}

/** Bridge — convert compiled provider request for legacy render pipeline */
export function compiledToStageRenderRequest(
  compiled: RenderingStageInput["compiledRequest"],
): StageRenderRequest {
  const request = toProviderRequest(compiled);
  return {
    provider: request.provider,
    prompt: request.prompt,
    negativePrompt: request.negativePrompt,
    width: request.width,
    height: request.height,
    seed: request.seed,
    aspectRatio: String(compiled.providerOptions.aspectRatio ?? "3:4"),
    quality: String(compiled.providerOptions.quality ?? "production"),
    guidance: request.cfg || undefined,
    steps: request.steps || undefined,
  };
}
