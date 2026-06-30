/**
 * Chapter 6.12 — Render Adapter Stage engine.
 * Translates Render Blueprint into provider-specific render requests — never design decisions.
 */
import { WB_COVER } from "@/lib/composition/canvas";
import { runConsensusValidationStageFromPipeline } from "./consensus-validation-stage-engine";
import { runBlueprintAssemblyStageFromPipeline } from "./blueprint-assembly-stage-engine";
import { runBusinessUnderstandingStage } from "./business-understanding-engine";
import { runKnowledgeRetrievalStage } from "./knowledge-retrieval-stage-engine";
import {
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  buildProductAnalysisInputFromPipeline,
} from "./product-analysis-engine";
import { buildDefaultPipelineInput } from "./design-pipeline-engine";
import {
  applyContextPatch,
  PipelineContextSection,
  type GenerationPipelineContext,
} from "./pipeline-context-engine";
import {
  buildAdapterRenderIntent,
  RENDER_ADAPTER_ID,
  runRenderAdapter,
  validateAdapterRenderIntent,
} from "./render-adapter-engine";
import type { RenderAdapterContext } from "./render-adapter-types";
import { getProviderCapabilities } from "./provider-capabilities";
import type { ProviderId } from "./render-pipeline-types";
import { BlueprintLifecycle } from "./lifecycle-types";
import type { RenderBlueprint } from "./types";
import {
  RenderAdapterStage,
  type MarketplaceRenderDimensions,
  type PlannedRenderRequest,
  type RenderAdapterStageContext,
  type RenderAdapterStageFailureCode,
  type RenderAdapterStageId,
  type RenderAdapterStageInput,
  type RenderAdapterStageReport,
  type RenderAdapterStageSection,
  type RenderAdapterStageSystemReport,
  type RenderAdapterStageViolation,
  type StageProviderProfile,
} from "./render-adapter-stage-types";

export {
  RenderAdapterStage,
  type RenderAdapterStageId,
  type StageProviderProfile,
  type PlannedRenderRequest,
  type MarketplaceRenderDimensions,
  type RenderAdapterStageInput,
  type RenderAdapterStageSection,
  type RenderAdapterStageViolation,
  type RenderAdapterStageReport,
  type RenderAdapterStageContext,
  type RenderAdapterStageSystemReport,
  type RenderAdapterStageFailureCode,
} from "./render-adapter-stage-types";

export const RENDER_ADAPTER_STAGE_VERSION = "6.12.0";

export const RENDER_ADAPTER_STAGE_GOLDEN_RULE =
  "Blueprint describes what must be created. Render Provider creates the image. " +
  "Render Adapter is the translator between them — it never makes design decisions.";

export const RENDER_ADAPTER_STAGE_PIPELINE: readonly RenderAdapterStageId[] = [
  RenderAdapterStage.INPUT_ASSEMBLY,
  RenderAdapterStage.PROVIDER_PROFILE_LOAD,
  RenderAdapterStage.BLUEPRINT_PREPARATION,
  RenderAdapterStage.SEMANTIC_TRANSLATION,
  RenderAdapterStage.PROMPT_COMPILATION,
  RenderAdapterStage.NEGATIVE_PROMPT_GENERATION,
  RenderAdapterStage.PROMPT_OPTIMIZATION,
  RenderAdapterStage.PARAMETER_MAPPING,
  RenderAdapterStage.MARKETPLACE_ADAPTATION,
  RenderAdapterStage.CONSTRAINT_ENFORCEMENT,
  RenderAdapterStage.CAPABILITY_NEGOTIATION,
  RenderAdapterStage.REQUEST_ASSEMBLY,
  RenderAdapterStage.EXPLAINABILITY,
  RenderAdapterStage.VALIDATION,
  RenderAdapterStage.STAGE_COMPLETE,
] as const;

export const RENDER_ADAPTER_STAGE_POSITION = [
  "consensus-validation",
  "render-adapter",
  "render-provider",
] as const;

export const MARKETPLACE_RENDER_DIMENSIONS: Record<string, MarketplaceRenderDimensions> = {
  wildberries: { width: WB_COVER.width, height: WB_COVER.height, aspectRatio: "3:4" },
  ozon: { width: WB_COVER.width, height: WB_COVER.height, aspectRatio: "3:4" },
  amazon: { width: 2000, height: 2000, aspectRatio: "1:1" },
};

export const STAGE_PROVIDER_PROFILES: Record<string, StageProviderProfile> = {
  flux: {
    provider: "flux",
    supportedFeatures: ["negative_prompt", "seed", "cfg", "steps", "aspect_ratio"],
    promptStyle: "short_photographic_english",
    negativePromptSupport: true,
    maxPromptLength: 900,
    aspectRatioSupport: ["1:1", "3:4", "4:3", "16:9"],
    qualityControls: ["production", "draft"],
  },
  "gpt-image": {
    provider: "gpt-image",
    supportedFeatures: ["aspect_ratio", "reference_image"],
    promptStyle: "natural_language_paragraph",
    negativePromptSupport: false,
    maxPromptLength: 3200,
    aspectRatioSupport: ["1:1", "3:4", "16:9"],
    qualityControls: ["high", "medium", "low"],
  },
  sdxl: {
    provider: "sdxl",
    supportedFeatures: ["negative_prompt", "seed", "cfg", "steps", "aspect_ratio"],
    promptStyle: "tag_weighted_photographic",
    negativePromptSupport: true,
    maxPromptLength: 1200,
    aspectRatioSupport: ["1:1", "3:4", "4:3", "16:9"],
    qualityControls: ["production", "draft"],
  },
  pollinations: {
    provider: "pollinations",
    supportedFeatures: ["negative_prompt", "seed", "aspect_ratio"],
    promptStyle: "concise_descriptive",
    negativePromptSupport: true,
    maxPromptLength: 800,
    aspectRatioSupport: ["1:1", "3:4", "4:3"],
    qualityControls: ["production"],
  },
  imagen: {
    provider: "imagen",
    supportedFeatures: ["seed", "aspect_ratio", "json_prompt"],
    promptStyle: "structured_scene_description",
    negativePromptSupport: false,
    maxPromptLength: 2000,
    aspectRatioSupport: ["1:1", "3:4", "4:3", "16:9"],
    qualityControls: ["high", "standard"],
  },
};

export const SUPPORTED_STAGE_PROVIDERS = Object.keys(STAGE_PROVIDER_PROFILES);

function stripPeopleNegationInstructions(text: string): string {
  return text
    .replace(/\bno (people|person|humans?)\b/gi, "")
    .replace(/\b(or|without)\s+(people|person|humans?)\b/gi, "")
    .replace(/\bno text,\s*logos,\s*or people\b/gi, "");
}

function violation(
  code: RenderAdapterStageFailureCode,
  message: string,
  stage?: RenderAdapterStageId,
): RenderAdapterStageViolation {
  return { code, message, stage };
}

export function resolveMarketplaceRenderDimensions(marketplace: string): MarketplaceRenderDimensions {
  const key = marketplace.toLowerCase();
  if (key.includes("wildberries") || key.includes("wb")) return MARKETPLACE_RENDER_DIMENSIONS.wildberries;
  if (key.includes("ozon")) return MARKETPLACE_RENDER_DIMENSIONS.ozon;
  if (key.includes("amazon")) return MARKETPLACE_RENDER_DIMENSIONS.amazon;
  return MARKETPLACE_RENDER_DIMENSIONS.wildberries;
}

export function getStageProviderProfile(providerId: string): StageProviderProfile | undefined {
  return STAGE_PROVIDER_PROFILES[providerId];
}

export function prepareBlueprintForAdapter(
  blueprint: RenderBlueprint,
  marketplace: string,
  providerId: string,
): RenderBlueprint {
  const dims = resolveMarketplaceRenderDimensions(marketplace);
  return {
    ...blueprint,
    lifecycle: {
      ...blueprint.lifecycle,
      stage: BlueprintLifecycle.FROZEN,
    },
    meta: {
      ...blueprint.meta,
      locked: true,
    },
    render: {
      ...blueprint.render,
      provider: providerId,
      aspectRatio: dims.aspectRatio,
      resolution: { width: dims.width, height: dims.height },
    },
  };
}

export function optimizePromptForProvider(
  prompt: string,
  profile: StageProviderProfile,
): string {
  const trimmed = prompt.trim().replace(/\s{2,}/g, " ");
  if (profile.promptStyle === "short_photographic_english") {
    return trimmed.slice(0, profile.maxPromptLength);
  }
  if (profile.promptStyle === "natural_language_paragraph") {
    return trimmed
      .replace(/,\s*/g, ". ")
      .replace(/\.\s*\./g, ".")
      .slice(0, profile.maxPromptLength);
  }
  return trimmed.slice(0, profile.maxPromptLength);
}

export function buildPlannedRenderRequest(
  blueprint: Readonly<RenderBlueprint>,
  compiled: ReturnType<typeof runRenderAdapter>,
  profile: StageProviderProfile,
  marketplaceDims: MarketplaceRenderDimensions,
): PlannedRenderRequest {
  const optimizedPositive = optimizePromptForProvider(compiled.intent.positivePrompt, profile);
  const request: PlannedRenderRequest = {
    provider: profile.provider,
    positivePrompt: optimizedPositive,
    negativePrompt: profile.negativePromptSupport ? compiled.intent.negativePrompt : "",
    width: marketplaceDims.width,
    height: marketplaceDims.height,
    seed: compiled.intent.seed,
    aspectRatio: marketplaceDims.aspectRatio,
    quality: blueprint.render.quality,
  };

  const caps = getProviderCapabilities(profile.provider as ProviderId);
  if (caps.supportsCFG) request.guidance = compiled.compiled.cfg;
  if (caps.supportsSteps) request.steps = compiled.compiled.steps;

  return request;
}

export function enforceRenderConstraints(
  request: PlannedRenderRequest,
  blueprint: Readonly<RenderBlueprint>,
): RenderAdapterStageViolation[] {
  const violations: RenderAdapterStageViolation[] = [];

  if (blueprint.constraints.mustAvoidText) {
    const withoutNegativeInstruction = request.positivePrompt.replace(/\bno (text|watermark|logo)s?\b/gi, "");
    if (/\b(text|watermark|logo)\b/i.test(withoutNegativeInstruction)) {
      violations.push(
        violation("CONSTRAINT_VIOLATION", "Prompt must not invite text generation", RenderAdapterStage.CONSTRAINT_ENFORCEMENT),
      );
    }
  }

  if (
    blueprint.background.containsPeople === false &&
    /\b(person|people|human|man|woman)\b/i.test(stripPeopleNegationInstructions(request.positivePrompt))
  ) {
    violations.push(
      violation("CREATIVE_ADDITION", "Adapter must not add people when blueprint forbids them", RenderAdapterStage.CONSTRAINT_ENFORCEMENT),
    );
  }

  if (request.positivePrompt.length < 20) {
    violations.push(
      violation("PROMPT_NOT_FORMED", "Positive prompt must be fully derived from blueprint", RenderAdapterStage.PROMPT_COMPILATION),
    );
  }

  return violations;
}

export function validateRenderAdapterStageInput(
  input: RenderAdapterStageInput,
  context: RenderAdapterStageContext = {},
): RenderAdapterStageViolation[] {
  const violations: RenderAdapterStageViolation[] = [];

  if (context.missingBlueprint || !input.blueprint) {
    violations.push(violation("MISSING_BLUEPRINT", "Render Blueprint required for adapter stage", RenderAdapterStage.INPUT_ASSEMBLY));
  }

  if (!input.consensusReport.approved && !context.unapprovedConsensus) {
    violations.push(
      violation("CONSENSUS_NOT_APPROVED", "Consensus must approve blueprint before render adapter", RenderAdapterStage.INPUT_ASSEMBLY),
    );
  }

  if (!getStageProviderProfile(input.providerId) || context.unsupportedProvider) {
    violations.push(
      violation("UNSUPPORTED_PROVIDER", `Provider ${input.providerId} is not supported`, RenderAdapterStage.PROVIDER_PROFILE_LOAD),
    );
  }

  if (context.alterDesignDecision) {
    violations.push(
      violation("DESIGN_DECISION_DETECTED", "Adapter stage must not alter design decisions", RenderAdapterStage.BLUEPRINT_PREPARATION),
    );
  }

  return violations;
}

export function runRenderAdapterStage(
  input: RenderAdapterStageInput,
  context: RenderAdapterStageContext = {},
): RenderAdapterStageReport {
  const started = Date.now();
  const stagesCompleted: RenderAdapterStageId[] = [];

  const inputViolations = validateRenderAdapterStageInput(input, context);
  if (inputViolations.length > 0) {
    return {
      valid: false,
      violations: inputViolations,
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  stagesCompleted.push(RenderAdapterStage.INPUT_ASSEMBLY);

  const providerProfile = getStageProviderProfile(input.providerId)!;
  stagesCompleted.push(RenderAdapterStage.PROVIDER_PROFILE_LOAD);

  const preparedBlueprint = prepareBlueprintForAdapter(input.blueprint, input.marketplace, input.providerId);
  if (preparedBlueprint.lifecycle.stage !== BlueprintLifecycle.FROZEN) {
    return {
      valid: false,
      violations: [
        violation("BLUEPRINT_NOT_FROZEN", "Blueprint must be frozen before adapter compilation", RenderAdapterStage.BLUEPRINT_PREPARATION),
      ],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }
  stagesCompleted.push(RenderAdapterStage.BLUEPRINT_PREPARATION);

  const adapterContext: RenderAdapterContext = {
    providerId: input.providerId,
    quality: preparedBlueprint.render.quality,
    aspectRatio: preparedBlueprint.render.aspectRatio,
    seed: preparedBlueprint.meta.seed,
  };

  const { intent, explainability, compiled } = runRenderAdapter({
    blueprint: preparedBlueprint,
    context: adapterContext,
  });

  stagesCompleted.push(
    RenderAdapterStage.SEMANTIC_TRANSLATION,
    RenderAdapterStage.PROMPT_COMPILATION,
    RenderAdapterStage.NEGATIVE_PROMPT_GENERATION,
    RenderAdapterStage.CAPABILITY_NEGOTIATION,
  );

  const marketplaceDims = resolveMarketplaceRenderDimensions(input.marketplace);
  stagesCompleted.push(RenderAdapterStage.MARKETPLACE_ADAPTATION);

  const plannedRequest = buildPlannedRenderRequest(preparedBlueprint, { intent, explainability, compiled }, providerProfile, marketplaceDims);
  stagesCompleted.push(RenderAdapterStage.PROMPT_OPTIMIZATION, RenderAdapterStage.PARAMETER_MAPPING);

  const constraintViolations = enforceRenderConstraints(plannedRequest, preparedBlueprint);
  stagesCompleted.push(RenderAdapterStage.CONSTRAINT_ENFORCEMENT);

  const intentValidation = validateAdapterRenderIntent(intent, preparedBlueprint);
  const violations: RenderAdapterStageViolation[] = [...constraintViolations];

  if (!intentValidation.valid) {
    for (const code of intentValidation.violations) {
      if (code === "CREATIVE_ADDITION") {
        violations.push(violation("CREATIVE_ADDITION", "Adapter introduced creative content", RenderAdapterStage.VALIDATION));
      } else if (code === "BLUEPRINT_DRIFT") {
        violations.push(violation("BLUEPRINT_DRIFT", "Prompt drifted from blueprint materials", RenderAdapterStage.VALIDATION));
      } else {
        violations.push(violation("PROMPT_NOT_FORMED", `Adapter validation failed: ${code}`, RenderAdapterStage.VALIDATION));
      }
    }
  }

  if (!providerProfile.aspectRatioSupport.includes(plannedRequest.aspectRatio)) {
    violations.push(
      violation("INVALID_PARAMETERS", `Provider does not support aspect ratio ${plannedRequest.aspectRatio}`, RenderAdapterStage.PARAMETER_MAPPING),
    );
  }

  if (plannedRequest.positivePrompt.length > providerProfile.maxPromptLength) {
    violations.push(
      violation("PROMPT_NOT_FORMED", "Prompt exceeds provider maximum length after optimization", RenderAdapterStage.PROMPT_OPTIMIZATION),
    );
  }

  stagesCompleted.push(RenderAdapterStage.REQUEST_ASSEMBLY, RenderAdapterStage.EXPLAINABILITY);

  if (!explainability.reasoning.length || !explainability.semanticBlocks.length) {
    violations.push(
      violation("PROMPT_NOT_FORMED", "Adapter explainability must trace blueprint sections", RenderAdapterStage.EXPLAINABILITY),
    );
  }

  stagesCompleted.push(RenderAdapterStage.VALIDATION);

  const section: RenderAdapterStageSection = {
    plannedRequest,
    providerProfile,
    adapterIntent: intent,
    compiledRequest: compiled,
    semanticBlocks: explainability.semanticBlocks,
    promptBlocks: explainability.promptBlocks,
    marketplaceDimensions: marketplaceDims,
    blueprint: preparedBlueprint,
    stagesCompleted: [...stagesCompleted],
    confidence: intent.confidence,
  };

  stagesCompleted.push(RenderAdapterStage.STAGE_COMPLETE);
  section.stagesCompleted = stagesCompleted;

  return {
    valid: violations.length === 0,
    violations,
    section,
    stagesCompleted,
    durationMs: Date.now() - started,
  };
}

export function enrichPipelineContextWithRenderAdapter(
  ctx: GenerationPipelineContext,
  section: RenderAdapterStageSection,
): { context: GenerationPipelineContext; violations: RenderAdapterStageViolation[] } {
  const patch = applyContextPatch(ctx, {
    agentId: RENDER_ADAPTER_ID,
    section: PipelineContextSection.RENDER,
    changes: {
      provider: section.plannedRequest.provider,
      positivePromptLength: section.plannedRequest.positivePrompt.length,
      negativePromptLength: section.plannedRequest.negativePrompt.length,
      width: section.plannedRequest.width,
      height: section.plannedRequest.height,
      aspectRatio: section.plannedRequest.aspectRatio,
    },
    reason: "Render Adapter Stage compiled provider-specific render request",
  });

  return {
    context: {
      ...patch.context,
      blueprint: section.blueprint,
      render: {
        provider: section.plannedRequest.provider,
        compiled: true,
      },
    },
    violations: patch.violations as RenderAdapterStageViolation[],
  };
}

export function runRenderAdapterStageFromPipeline(
  context: RenderAdapterStageContext = {},
): RenderAdapterStageReport {
  const consensus = runConsensusValidationStageFromPipeline();
  if (!consensus.valid || !consensus.section) {
    return {
      valid: false,
      violations: [violation("MISSING_BLUEPRINT", "Consensus Validation must complete before Render Adapter")],
      stagesCompleted: [],
      durationMs: 0,
    };
  }

  if (!consensus.section.plannedReport.approved && !context.unapprovedConsensus) {
    return {
      valid: false,
      violations: [violation("CONSENSUS_NOT_APPROVED", "Blueprint must be consensus-approved before adapter")],
      stagesCompleted: [],
      durationMs: 0,
    };
  }

  const pipelineInput = buildDefaultPipelineInput();
  const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(pipelineInput));
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
  const assembly = runBlueprintAssemblyStageFromPipeline();

  return runRenderAdapterStage(
    {
      profile: analysis.section!.profile,
      business: business.section!,
      blueprint: consensus.section.blueprint,
      constraintSet: assembly.section!.constraintSet,
      metadata: assembly.section!.metadata,
      knowledge: knowledge.package!,
      assemblyConflicts: assembly.section!.conflicts,
      consensusReport: consensus.section.plannedReport,
      marketplace: context.marketplace ?? pipelineInput.marketplace,
      providerId: context.providerId ?? "flux",
    },
    context,
  );
}

export function validateRenderAdapterStage(
  context: RenderAdapterStageContext = {},
): RenderAdapterStageSystemReport {
  const violations: RenderAdapterStageViolation[] = [];

  const kitchen = runRenderAdapterStageFromPipeline({ ...context, providerId: "flux" });
  if (!kitchen.valid || !kitchen.section) {
    violations.push(...kitchen.violations);
  } else {
    if (!kitchen.section.plannedRequest.positivePrompt.length) {
      violations.push(violation("PROMPT_NOT_FORMED", "Kitchen pipeline must produce positive prompt"));
    }
    if (!kitchen.section.semanticBlocks.length) {
      violations.push(violation("PROMPT_NOT_FORMED", "Semantic translation must be recorded"));
    }
  }

  const gptImage = runRenderAdapterStageFromPipeline({ ...context, providerId: "gpt-image" });
  if (!gptImage.valid || !gptImage.section) {
    violations.push(...gptImage.violations);
  } else if (gptImage.section.plannedRequest.negativePrompt.length > 0) {
    violations.push(violation("PROVIDER_UNSUPPORTED", "GPT Image must not receive negative prompt"));
  }

  const wb = runRenderAdapterStageFromPipeline({ ...context, marketplace: "wildberries", providerId: "flux" });
  if (wb.section) {
    if (wb.section.plannedRequest.width !== 900 || wb.section.plannedRequest.height !== 1200) {
      violations.push(violation("INVALID_PARAMETERS", "Wildberries must use 900×1200 dimensions"));
    }
  }

  const amazon = runRenderAdapterStageFromPipeline({ ...context, marketplace: "amazon", providerId: "flux" });
  if (amazon.section) {
    if (amazon.section.plannedRequest.width !== 2000 || amazon.section.plannedRequest.height !== 2000) {
      violations.push(violation("INVALID_PARAMETERS", "Amazon must use 2000×2000 dimensions"));
    }
  }

  const conflictedConsensus = runConsensusValidationStageFromPipeline({ injectPremiumBudgetConflict: true });
  if (conflictedConsensus.section && !conflictedConsensus.section.plannedReport.approved) {
    const assembly = runBlueprintAssemblyStageFromPipeline();
    const pipelineInput = buildDefaultPipelineInput();
    const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(pipelineInput));
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
    const blocked = runRenderAdapterStage({
      profile: analysis.section!.profile,
      business: business.section!,
      blueprint: conflictedConsensus.section.blueprint,
      constraintSet: assembly.section!.constraintSet,
      metadata: assembly.section!.metadata,
      knowledge: knowledge.package!,
      assemblyConflicts: assembly.section!.conflicts,
      consensusReport: conflictedConsensus.section.plannedReport,
      marketplace: pipelineInput.marketplace,
      providerId: "flux",
    });
    if (blocked.valid) {
      violations.push(
        violation("CONSENSUS_NOT_APPROVED", "Unapproved consensus must block adapter when not explicitly allowed"),
      );
    }
  }

  const fluxPrompt = kitchen.section?.plannedRequest.positivePrompt ?? "";
  const gptPrompt = gptImage.section?.plannedRequest.positivePrompt ?? "";
  const providerIndependent =
    fluxPrompt.length > 0 &&
    gptPrompt.length > 0 &&
    fluxPrompt !== gptPrompt;

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    providerIndependent,
    marketplaceAdapted: !!wb.section && !!amazon.section,
    negativePromptHandled: !!kitchen.section?.plannedRequest.negativePrompt.includes("blurry"),
    explainabilityComplete: !!kitchen.section?.promptBlocks.length,
    downstreamReady: !!kitchen.section?.compiledRequest.prompt,
  };
}

export function assertRenderAdapterStage(
  context: RenderAdapterStageContext = {},
): RenderAdapterStageSystemReport {
  const report = validateRenderAdapterStage(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Render Adapter Stage failed: ${messages}`);
  }
  return report;
}

export function runRenderAdapterStageSystem(
  context: RenderAdapterStageContext = {},
): RenderAdapterStageSystemReport {
  return validateRenderAdapterStage(context);
}

export function isRenderAdapterStageFailure(code: string): code is RenderAdapterStageFailureCode {
  const codes: RenderAdapterStageFailureCode[] = [
    "MISSING_BLUEPRINT",
    "CONSENSUS_NOT_APPROVED",
    "UNSUPPORTED_PROVIDER",
    "PROMPT_NOT_FORMED",
    "INVALID_PARAMETERS",
    "CONSTRAINT_VIOLATION",
    "CREATIVE_ADDITION",
    "BLUEPRINT_DRIFT",
    "PROVIDER_UNSUPPORTED",
    "DESIGN_DECISION_DETECTED",
    "BLUEPRINT_NOT_FROZEN",
  ];
  return codes.includes(code as RenderAdapterStageFailureCode);
}

/** Bridge for provider prompt style comparison tests */
export function compareProviderPromptStyles(
  blueprint: RenderBlueprint,
  marketplace: string,
): Record<string, string> {
  const results: Record<string, string> = {};
  for (const providerId of ["flux", "gpt-image"] as const) {
    const frozen = prepareBlueprintForAdapter(blueprint, marketplace, providerId);
    const { intent } = buildAdapterRenderIntent(frozen, { providerId });
    results[providerId] = intent.positivePrompt;
  }
  return results;
}
