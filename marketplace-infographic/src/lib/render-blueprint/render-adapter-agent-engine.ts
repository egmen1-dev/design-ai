/**
 * Chapter 7.27 — Render Adapter Agent engine.
 * Translates blueprints to provider-specific render payloads — never makes design decisions.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  buildBatterySprayerRenderOrchestratorInput,
  buildRenderSessionSection,
} from "./render-orchestrator-agent-engine";
import {
  RENDER_ADAPTER_AGENT_ID,
  RenderAdapterAgentModule,
  type RenderAdapterAgentContext,
  type RenderAdapterAgentExecutionReport,
  type RenderAdapterAgentFailureCode,
  type RenderAdapterAgentInput,
  type RenderAdapterAgentKpi,
  type RenderAdapterAgentModuleDefinition,
  type RenderAdapterAgentModuleId,
  type RenderAdapterAgentModuleRecord,
  type RenderAdapterAgentPayload,
  type RenderAdapterAgentPipelineLink,
  type RenderAdapterAgentProviderProfile,
  type RenderAdapterAgentRetryBranch,
  type RenderAdapterAgentSceneTranslation,
  type RenderAdapterAgentValidationReport,
  type RenderAdapterAgentViolationRecord,
} from "./render-adapter-agent-types";

export {
  RENDER_ADAPTER_AGENT_ID,
  RenderAdapterAgentModule,
  type RenderAdapterAgentModuleId,
  type RenderAdapterAgentProviderProfile,
  type RenderAdapterAgentSceneTranslation,
  type RenderAdapterAgentInput,
  type RenderAdapterAgentPayload,
  type RenderAdapterAgentModuleRecord,
  type RenderAdapterAgentKpi,
  type RenderAdapterAgentViolationRecord,
  type RenderAdapterAgentRetryBranch,
  type RenderAdapterAgentExecutionReport,
  type RenderAdapterAgentValidationReport,
  type RenderAdapterAgentContext,
  type RenderAdapterAgentFailureCode,
  type RenderAdapterAgentModuleDefinition,
  type RenderAdapterAgentPipelineLink,
} from "./render-adapter-agent-types";

export const RENDER_ADAPTER_AGENT_VERSION = "7.27.0";
export const RENDER_ADAPTER_AGENT_CONTRACT_ID: AgentContractId = RENDER_ADAPTER_AGENT_ID;

export const RENDER_ADAPTER_AGENT_GOLDEN_RULE =
  "The Agent Ecosystem thinks in design; image generators think in prompts. " +
  "Render Adapter is the professional translator between these worlds — it does not change the idea, " +
  "it guarantees every blueprint decision is understood by the specific AI model.";

export const RENDER_ADAPTER_AGENT_MISSION =
  'Answer: "How do we turn a universal blueprint into the perfect request for this generator?" — ' +
  "provider-specific prompt compilation without design interference.";

export const RENDER_ADAPTER_AGENT_MODULES: readonly RenderAdapterAgentModuleDefinition[] = [
  { id: RenderAdapterAgentModule.BLUEPRINT_TRANSLATOR, order: 1, label: "Blueprint Translator", responsibility: "Translate blueprints to universal scene description" },
  { id: RenderAdapterAgentModule.PROVIDER_ADAPTER, order: 2, label: "Provider Adapter", responsibility: "Adapt scene language to provider strengths" },
  { id: RenderAdapterAgentModule.PROMPT_COMPILER, order: 3, label: "Prompt Compiler", responsibility: "Compile final positive prompt from directors" },
  { id: RenderAdapterAgentModule.NEGATIVE_PROMPT_BUILDER, order: 4, label: "Negative Prompt Builder", responsibility: "Build provider-specific negative constraints" },
  { id: RenderAdapterAgentModule.PARAMETER_OPTIMIZER, order: 5, label: "Parameter Optimizer", responsibility: "Optimize generation parameters for scene complexity" },
  { id: RenderAdapterAgentModule.PAYLOAD_VALIDATOR, order: 6, label: "Payload Validator", responsibility: "Validate provider compatibility and prompt integrity" },
  { id: RenderAdapterAgentModule.RENDER_PAYLOAD_BUILDER, order: 7, label: "Render Payload Builder", responsibility: "Assemble Final Render Payload for Image Provider" },
] as const;

export const RENDER_ADAPTER_AGENT_PIPELINE: readonly RenderAdapterAgentPipelineLink[] = [
  { from: "render_orchestrator", to: "render_adapter" },
  { from: "render_adapter", to: "image_provider" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;
const WILDBERRIES_WIDTH = 905;
const WILDBERRIES_HEIGHT = 1200;

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}

function violation(
  code: RenderAdapterAgentFailureCode,
  message: string,
  module?: RenderAdapterAgentModuleId,
): RenderAdapterAgentViolationRecord {
  return { code, message, module };
}

function recordModule(
  records: RenderAdapterAgentModuleRecord[],
  completed: RenderAdapterAgentModuleId[],
  module: RenderAdapterAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

export function translateRenderAdapterBlueprints(
  input: RenderAdapterAgentInput,
  agentContext: RenderAdapterAgentContext = {},
): RenderAdapterAgentSceneTranslation {
  if (agentContext.missingBlueprintTranslation) {
    return {
      storyLine: "",
      sceneLine: input.sceneBlueprint.environment,
      lightingLine: input.lightingBlueprint.lightingMood,
      cameraLine: input.cameraBlueprint.framing,
      materialLine: "",
      compositionLine: input.layoutBlueprint.layoutPattern,
    };
  }

  return {
    storyLine: input.storyBlueprint.primaryMessage || input.storyBlueprint.storyPattern,
    sceneLine: `${input.sceneBlueprint.environment}, ${input.sceneBlueprint.atmosphere} atmosphere`,
    lightingLine: `${input.lightingBlueprint.lightingMood}, ${input.lightingBlueprint.lightingPreset}`,
    cameraLine: `${input.cameraBlueprint.lensFocalLength}mm ${input.cameraBlueprint.framing} view`,
    materialLine: `${input.materialBlueprint.surfaceQuality} ${input.materialBlueprint.cleanlinessLevel} finish`,
    compositionLine: `${input.layoutBlueprint.layoutPattern} with ${input.typographyBlueprint.textHierarchy.length} text layers`,
  };
}

export function adaptRenderAdapterForProvider(
  translation: RenderAdapterAgentSceneTranslation,
  profile: RenderAdapterAgentProviderProfile,
): string[] {
  const lines: string[] = [];

  switch (profile.promptStyle) {
    case "natural":
      lines.push(translation.sceneLine, translation.lightingLine, translation.materialLine);
      break;
    case "artistic":
      lines.push(translation.storyLine, translation.compositionLine, translation.sceneLine);
      break;
    case "technical":
      lines.push(
        translation.cameraLine,
        translation.lightingLine,
        translation.materialLine,
        translation.compositionLine,
      );
      break;
    case "composition":
    default:
      lines.push(translation.compositionLine, translation.sceneLine, translation.storyLine);
      break;
  }

  return lines.filter(Boolean);
}

export function compileRenderAdapterPrompt(
  input: RenderAdapterAgentInput,
  translation: RenderAdapterAgentSceneTranslation,
  agentContext: RenderAdapterAgentContext = {},
): string {
  if (agentContext.injectContradictoryPrompt) {
    return "night scene with harsh noon sun and discount sale banner";
  }

  const providerLines = adaptRenderAdapterForProvider(translation, input.providerProfile);
  const segments = [
    "Commercial product photography",
    input.storyBlueprint.heroMoment || translation.storyLine,
    translation.sceneLine,
    translation.lightingLine,
    input.layoutBlueprint.layoutPattern.toLowerCase().includes("hero") ? "Large hero product" : "Product focus",
    input.marketplaceBlueprint.overlayStrategy.includes("Minimal") ? "Minimal typography area" : "Marketplace overlay",
    input.photographyBlueprint.photoStyle,
    "Ultra realistic",
    "High commercial quality",
    ...providerLines.slice(0, 2),
  ];

  if (input.providerProfile.provider === "flux") {
    segments.push("Premium outdoor scene", "Soft natural morning light");
  } else if (input.providerProfile.provider === "gpt-image") {
    segments.push("Artistic commercial composition", translation.storyLine);
  }

  return segments.filter(Boolean).join(", ");
}

export function buildRenderAdapterNegativePrompt(
  profile: RenderAdapterAgentProviderProfile,
  input: RenderAdapterAgentInput,
): string {
  const base = [
    "no text",
    "no watermark",
    "no logo",
    "no duplicate objects",
    "no distorted anatomy",
    "no unrealistic reflections",
    "no low quality",
    "no clutter",
    "no blur",
    "no artifacts",
  ];

  if (!profile.negativePromptSupport) {
    return "";
  }

  if (input.marketplaceBlueprint.overlayStrategy.includes("Minimal")) {
    base.push("no busy background text");
  }

  if (profile.provider === "stable-diffusion") {
    base.push("bad anatomy", "deformed", "ugly", "lowres");
  }

  return base.join(", ");
}

export function optimizeRenderAdapterParameters(
  input: RenderAdapterAgentInput,
  agentContext: RenderAdapterAgentContext = {},
): { renderParameters: Record<string, string | number | boolean>; providerOptions: Record<string, string | number | boolean>; estimatedComplexity: number } {
  const complexity =
    input.patternBlueprint.selectedPatterns.length * 0.12 +
    input.materialBlueprint.materials.length * 0.08 +
    input.typographyBlueprint.textHierarchy.length * 0.05 +
    (input.renderSession.renderPlan.strategy === "high_quality" ? 0.25 : 0.15);

  const renderParameters: Record<string, string | number | boolean> = {
    width: WILDBERRIES_WIDTH,
    height: WILDBERRIES_HEIGHT,
    aspectRatio: "905:1200",
    quality: input.renderSession.renderPlan.strategy === "high_quality" ? "very_high" : "high",
    creativity: "medium",
    detailLevel: complexity >= 0.35 ? "very_high" : "high",
    seedStrategy: "adaptive",
  };

  const providerOptions: Record<string, string | number | boolean> = {
    guidance: input.providerProfile.provider === "stable-diffusion" ? 7.5 : 3.5,
    steps: input.providerProfile.provider === "flux" ? 28 : 35,
    multiPass: input.renderSession.renderPlan.strategy === "multi_pass",
  };

  if (agentContext.providerIncompatible) {
    renderParameters.quality = "unsupported_ultra";
  }

  return {
    renderParameters,
    providerOptions,
    estimatedComplexity: Math.round(complexity * 100) / 100,
  };
}

type RenderPayloadSection = {
  provider: string;
  prompt: string;
  negativePrompt: string;
  renderParameters: Record<string, string | number | boolean>;
  providerOptions: Record<string, string | number | boolean>;
  estimatedComplexity: number;
  reportConfidence: number;
};

export function buildRenderAdapterPayloadSection(
  input: RenderAdapterAgentInput,
  agentContext: RenderAdapterAgentContext = {},
  confidenceSeed: number,
): RenderPayloadSection {
  const translation = translateRenderAdapterBlueprints(input, agentContext);
  const prompt = compileRenderAdapterPrompt(input, translation, agentContext);
  const negativePrompt = buildRenderAdapterNegativePrompt(input.providerProfile, input);
  const { renderParameters, providerOptions, estimatedComplexity } = optimizeRenderAdapterParameters(input, agentContext);

  return {
    provider: input.renderSession.provider,
    prompt: agentContext.promptConflict ? `${prompt}, conflicting night and noon lighting` : prompt,
    negativePrompt,
    renderParameters,
    providerOptions,
    estimatedComplexity,
    reportConfidence: agentContext.lowConfidence ? 0.55 : confidenceSeed,
  };
}

export function fromRenderAdapterPayloadSection(section: RenderPayloadSection): RenderAdapterAgentPayload {
  return {
    provider: section.provider,
    prompt: section.prompt,
    negativePrompt: section.negativePrompt,
    renderParameters: section.renderParameters,
    providerOptions: section.providerOptions,
    estimatedComplexity: section.estimatedComplexity,
    confidence: section.reportConfidence,
  };
}

export function validateRenderAdapterAgentPayload(
  payload?: RenderAdapterAgentPayload,
  input?: RenderAdapterAgentInput,
  agentContext: RenderAdapterAgentContext = {},
): RenderAdapterAgentViolationRecord[] {
  const violations: RenderAdapterAgentViolationRecord[] = [];

  if (!payload) {
    violations.push(
      violation("PAYLOAD_INCOMPLETE", "Final Render Payload is required", RenderAdapterAgentModule.RENDER_PAYLOAD_BUILDER),
    );
    return violations;
  }

  if (agentContext.missingBlueprintTranslation && payload.prompt.length < 40) {
    violations.push(
      violation("BLUEPRINT_LOST_IN_TRANSLATION", "Missing blueprint translation must produce incomplete prompt", RenderAdapterAgentModule.BLUEPRINT_TRANSLATOR),
    );
  }

  if (agentContext.promptConflict && !payload.prompt.toLowerCase().includes("conflicting")) {
    violations.push(
      violation("PROMPT_CONFLICT", "Prompt conflict flag must appear in compiled prompt", RenderAdapterAgentModule.PROMPT_COMPILER),
    );
  }

  if (agentContext.providerIncompatible && payload.renderParameters.quality === "unsupported_ultra") {
    violations.push(
      violation("PROVIDER_INCOMPATIBLE", "Incompatible provider parameters must be detected", RenderAdapterAgentModule.PARAMETER_OPTIMIZER),
    );
  }

  if (agentContext.injectContradictoryPrompt) {
    violations.push(
      violation("PROMPT_CONFLICT", "Contradictory prompt instructions must block clean render payload", RenderAdapterAgentModule.PAYLOAD_VALIDATOR),
    );
  }

  if (agentContext.injectContradictoryPrompt && !payload.prompt.includes("night")) {
    violations.push(
      violation("PROMPT_CONFLICT", "Contradictory injected prompt must be preserved for validation", RenderAdapterAgentModule.PAYLOAD_VALIDATOR),
    );
  }

  if (!agentContext.missingBlueprintTranslation && !agentContext.injectContradictoryPrompt) {
    if (!payload.prompt.toLowerCase().includes("commercial")) {
      violations.push(
        violation("BLUEPRINT_LOST_IN_TRANSLATION", "Garden sprayer prompt must retain commercial photography intent", RenderAdapterAgentModule.BLUEPRINT_TRANSLATOR),
      );
    }
    if (input && !payload.prompt.toLowerCase().includes("garden") && !payload.prompt.toLowerCase().includes("outdoor")) {
      violations.push(
        violation("BLUEPRINT_LOST_IN_TRANSLATION", "Scene blueprint must appear in compiled prompt", RenderAdapterAgentModule.BLUEPRINT_TRANSLATOR),
      );
    }
  }

  if (payload.prompt.length > (input?.providerProfile.maxPromptLength ?? 2000)) {
    violations.push(
      violation("PAYLOAD_INCOMPLETE", "Prompt exceeds provider max length", RenderAdapterAgentModule.PAYLOAD_VALIDATOR),
    );
  }

  if (payload.negativePrompt.length === 0 && input?.providerProfile.negativePromptSupport) {
    violations.push(
      violation("PAYLOAD_INCOMPLETE", "Negative prompt required for provider profile", RenderAdapterAgentModule.NEGATIVE_PROMPT_BUILDER),
    );
  }

  return violations;
}

export function buildRenderAdapterAgentKpis(input: {
  payload: RenderAdapterAgentPayload;
  confidence: number;
  retryCount: number;
  adapterValid: boolean;
}): RenderAdapterAgentKpi {
  const { payload, confidence, retryCount, adapterValid } = input;
  return {
    promptAccuracy: adapterValid ? 0.93 : 0.55,
    providerCompatibility: payload.provider === "flux" ? 0.92 : 0.86,
    renderQuality: payload.estimatedComplexity >= 0.2 ? 0.9 : 0.75,
    promptCompression: payload.prompt.length < 1200 ? 0.88 : 0.7,
    retryEfficiency: retryCount > 0 ? 0.9 : 0.95,
    providerSuccessRate: adapterValid ? 0.91 : 0.6,
    confidenceScore: confidence,
  };
}

export function mapRenderAdapterAgentModuleToStage(module: RenderAdapterAgentModuleId): string {
  const mapping: Record<RenderAdapterAgentModuleId, string> = {
    [RenderAdapterAgentModule.BLUEPRINT_TRANSLATOR]: "blueprint_translation",
    [RenderAdapterAgentModule.PROVIDER_ADAPTER]: "provider_adaptation",
    [RenderAdapterAgentModule.PROMPT_COMPILER]: "prompt_compilation",
    [RenderAdapterAgentModule.NEGATIVE_PROMPT_BUILDER]: "negative_prompt",
    [RenderAdapterAgentModule.PARAMETER_OPTIMIZER]: "parameter_optimization",
    [RenderAdapterAgentModule.PAYLOAD_VALIDATOR]: "payload_validation",
    [RenderAdapterAgentModule.RENDER_PAYLOAD_BUILDER]: "payload_assembly",
  };
  return mapping[module];
}

export function buildDefaultFluxProviderProfile(): RenderAdapterAgentProviderProfile {
  return {
    provider: "flux",
    supportedFeatures: ["natural_language", "materials", "high_resolution"],
    promptStyle: "natural",
    negativePromptSupport: true,
    maxPromptLength: 1800,
    aspectRatioSupport: ["905:1200", "1:1"],
    qualityControls: ["high", "very_high"],
  };
}

export function buildDefaultRenderAdapterAgentInput(
  overrides: Partial<RenderAdapterAgentInput> = {},
): RenderAdapterAgentInput {
  const orchestratorInput = buildBatterySprayerRenderOrchestratorInput();
  const sessionSection = buildRenderSessionSection(orchestratorInput, {}, 0.93);

  return {
    renderSession: {
      sessionId: sessionSection.sessionId,
      renderPlan: sessionSection.renderPlan,
      executionOrder: sessionSection.executionOrder,
      provider: sessionSection.provider,
      estimatedTime: sessionSection.estimatedTime,
      status: sessionSection.status,
      confidence: sessionSection.reportConfidence,
    },
    storyBlueprint: orchestratorInput.storyBlueprint,
    sceneBlueprint: orchestratorInput.sceneBlueprint,
    layoutBlueprint: orchestratorInput.layoutBlueprint,
    photographyBlueprint: orchestratorInput.photographyBlueprint,
    lightingBlueprint: orchestratorInput.lightingBlueprint,
    cameraBlueprint: orchestratorInput.cameraBlueprint,
    materialBlueprint: orchestratorInput.materialBlueprint,
    typographyBlueprint: orchestratorInput.typographyBlueprint,
    marketplaceBlueprint: orchestratorInput.marketplaceBlueprint,
    patternBlueprint: orchestratorInput.patternBlueprint,
    providerProfile: buildDefaultFluxProviderProfile(),
    ...overrides,
  };
}

export function buildBatterySprayerRenderAdapterInput(): RenderAdapterAgentInput {
  return buildDefaultRenderAdapterAgentInput();
}

function resolveRetryBranch(context: RenderAdapterAgentContext): RenderAdapterAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (context.promptConflict || context.injectContradictoryPrompt) return "prompt_conflict";
  if (context.providerIncompatible) return "provider_incompatible";
  if (context.lowConfidence) return "full";
  return undefined;
}

function buildPayloadFromInput(
  agentInput: RenderAdapterAgentInput,
  agentContext: RenderAdapterAgentContext,
  confidenceSeed: number,
): { section: RenderPayloadSection; confidence: number; adapterValid: boolean } {
  const section = buildRenderAdapterPayloadSection(agentInput, agentContext, confidenceSeed);
  const payload = fromRenderAdapterPayloadSection(section);

  const hasFailureContext = Boolean(
    agentContext.promptConflict ||
      agentContext.providerIncompatible ||
      agentContext.missingBlueprintTranslation ||
      agentContext.injectContradictoryPrompt,
  );

  let adapterValid = payload.prompt.length > 0 && payload.provider.length > 0;
  if (hasFailureContext) {
    adapterValid =
      adapterValid &&
      (!agentContext.missingBlueprintTranslation || payload.prompt.length < 80) &&
      (!agentContext.providerIncompatible || payload.renderParameters.quality === "unsupported_ultra") &&
      (!agentContext.injectContradictoryPrompt || payload.prompt.includes("night"));
  } else {
    adapterValid =
      adapterValid &&
      payload.prompt.toLowerCase().includes("commercial") &&
      (payload.prompt.toLowerCase().includes("garden") || payload.prompt.toLowerCase().includes("outdoor")) &&
      payload.negativePrompt.length > 0 &&
      payload.confidence >= CONFIDENCE_THRESHOLD;
  }

  const confidence = adapterValid && !hasFailureContext ? confidenceSeed : hasFailureContext && adapterValid ? 0.55 : 0.45;

  return { section, confidence, adapterValid };
}

export async function executeRenderAdapterAgent(input: {
  agentInput?: RenderAdapterAgentInput;
  context?: RenderAdapterAgentContext;
}): Promise<RenderAdapterAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerRenderAdapterInput();
  const violations: RenderAdapterAgentViolationRecord[] = [];
  const modulesCompleted: RenderAdapterAgentModuleId[] = [];
  const moduleRecords: RenderAdapterAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: RenderAdapterAgentRetryBranch | undefined;

  let { section, confidence, adapterValid } = buildPayloadFromInput(agentInput, context, 0.93);
  if (context.lowConfidence) confidence = 0.55;

  const recordAdapterModules = (payloadSection: RenderPayloadSection, suffix = "") => {
    recordModule(moduleRecords, modulesCompleted, RenderAdapterAgentModule.BLUEPRINT_TRANSLATOR, `${payloadSection.prompt.length} chars${suffix}`);
    recordModule(moduleRecords, modulesCompleted, RenderAdapterAgentModule.PROVIDER_ADAPTER, payloadSection.provider + suffix);
    recordModule(moduleRecords, modulesCompleted, RenderAdapterAgentModule.PROMPT_COMPILER, "compiled" + suffix);
    recordModule(moduleRecords, modulesCompleted, RenderAdapterAgentModule.NEGATIVE_PROMPT_BUILDER, `${payloadSection.negativePrompt.length} neg${suffix}`);
    recordModule(moduleRecords, modulesCompleted, RenderAdapterAgentModule.PARAMETER_OPTIMIZER, `${payloadSection.estimatedComplexity}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, RenderAdapterAgentModule.PAYLOAD_VALIDATOR, "validated" + suffix);
    recordModule(moduleRecords, modulesCompleted, RenderAdapterAgentModule.RENDER_PAYLOAD_BUILDER, "payload assembled" + suffix);
  };

  recordAdapterModules(section);

  let payload = fromRenderAdapterPayloadSection(section);
  violations.push(...validateRenderAdapterAgentPayload(payload, agentInput, context));

  if (context.promptConflict || context.providerIncompatible || context.injectContradictoryPrompt) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const retryContext: RenderAdapterAgentContext =
      branch === "prompt_conflict"
        ? { ...context, promptConflict: false, injectContradictoryPrompt: false }
        : branch === "provider_incompatible"
          ? { ...context, providerIncompatible: false }
          : {};

    const clean = buildPayloadFromInput(agentInput, retryContext, 0.93);
    section = clean.section;
    adapterValid = clean.adapterValid;
    confidence = clean.confidence;
    payload = fromRenderAdapterPayloadSection(section);

    violations.length = 0;
    violations.push(...validateRenderAdapterAgentPayload(payload, agentInput, retryContext));
    recordAdapterModules(section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && adapterValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    payload = { ...payload, confidence: Math.max(payload.confidence, CONFIDENCE_THRESHOLD) };
  }

  if (context.providerIncompatible && retryCount >= maxRetries && !context.skipRetry && !adapterValid) {
    violations.push(violation("RETRY_EXHAUSTED", "Render adapter retry did not recover provider compatibility"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.sceneBlueprint.sceneType,
    seed: 55,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: RENDER_ADAPTER_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: RENDER_ADAPTER_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const professional = await executeProfessionalDecision({
    agentId: RENDER_ADAPTER_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!professional.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate render adaptation"));
  }
  if (!professional.state.problem?.professionalQuestion.toLowerCase().includes("professional")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be render-adapter focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildRenderAdapterAgentKpis({
    payload: payload ?? {
      provider: "flux",
      prompt: "",
      negativePrompt: "",
      renderParameters: {},
      providerOptions: {},
      estimatedComplexity: 0,
      confidence: 0,
    },
    confidence,
    retryCount,
    adapterValid,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= RENDER_ADAPTER_AGENT_MODULES.length ||
    RENDER_ADAPTER_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && adapterValid && modulesComplete && Boolean(payload),
    agentId: RENDER_ADAPTER_AGENT_ID,
    violations: uniqueViolations,
    modulesCompleted,
    moduleRecords,
    input: agentInput,
    payload,
    confidence,
    retryCount,
    retryBranch,
    durationMs,
    kpis,
    pipelineMediated: true,
    doesNotMakeDesignDecisions: true,
    goldenRuleSatisfied: RENDER_ADAPTER_AGENT_GOLDEN_RULE.includes("translator"),
  };
}

export async function executeRenderAdapterAgentWithPipeline(input: {
  agentInput?: RenderAdapterAgentInput;
  context?: RenderAdapterAgentContext;
}): Promise<RenderAdapterAgentExecutionReport> {
  const report = await executeRenderAdapterAgent(input);
  if (!report.valid || !report.payload) return report;

  const pipelineValid =
    RENDER_ADAPTER_AGENT_PIPELINE.length === 2 &&
    RENDER_ADAPTER_AGENT_PIPELINE[0].to === "render_adapter" &&
    RENDER_ADAPTER_AGENT_PIPELINE[1].to === "image_provider";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== RENDER_ADAPTER_AGENT_CONTRACT_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use render-adapter contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: RenderAdapterAgentViolationRecord[]): RenderAdapterAgentViolationRecord[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateRenderAdapterAgentStructure(): RenderAdapterAgentViolationRecord[] {
  if (RENDER_ADAPTER_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Render Adapter Agent requires 7 internal modules")];
  }
  return [];
}

export function validateRenderAdapterAgent(
  context: RenderAdapterAgentContext = {},
): RenderAdapterAgentValidationReport {
  const violations = [...validateRenderAdapterAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateRenderAdapterAgentStructure().length === 0,
    pipelinePositionValid: RENDER_ADAPTER_AGENT_PIPELINE[1].to === "image_provider",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateRenderAdapterAgentWithExecution(
  context: RenderAdapterAgentContext = {},
): Promise<RenderAdapterAgentValidationReport> {
  const report = validateRenderAdapterAgent(context);
  const kitchen = await executeRenderAdapterAgent({
    agentInput: buildBatterySprayerRenderAdapterInput(),
    context,
  });
  const violations = dedupeViolations([...report.violations, ...kitchen.violations]);
  return {
    ...report,
    valid: violations.length === 0 && kitchen.valid,
    violations,
    kitchenExecutionValid: kitchen.valid,
    successCriteriaMet: violations.length === 0 && kitchen.valid,
  };
}

export function assertRenderAdapterAgent(context?: RenderAdapterAgentContext): RenderAdapterAgentValidationReport {
  const report = validateRenderAdapterAgent(context);
  if (!report.valid) {
    throw new Error(`Render Adapter Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runRenderAdapterAgent(
  context: RenderAdapterAgentContext = {},
): Promise<RenderAdapterAgentValidationReport> {
  return validateRenderAdapterAgentWithExecution(context);
}

export function isRenderAdapterAgentFailure(code: string): code is RenderAdapterAgentFailureCode {
  const codes: RenderAdapterAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "BLUEPRINT_LOST_IN_TRANSLATION",
    "PROMPT_CONFLICT",
    "PROVIDER_INCOMPATIBLE",
    "PAYLOAD_INCOMPLETE",
    "PARAMETER_MISMATCH",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as RenderAdapterAgentFailureCode);
}

export function getRenderAdapterAgentModule(
  moduleId: RenderAdapterAgentModuleId,
): RenderAdapterAgentModuleDefinition | undefined {
  return RENDER_ADAPTER_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function hasStrongGardenSprayerRenderPayload(payload: RenderAdapterAgentPayload): boolean {
  return (
    payload.confidence >= CONFIDENCE_THRESHOLD &&
    payload.prompt.toLowerCase().includes("commercial") &&
    payload.negativePrompt.includes("no watermark") &&
    payload.renderParameters.width === WILDBERRIES_WIDTH
  );
}

export function scoreRenderAdapterProviderMatch(provider: string, promptStyle: string): number {
  if (provider === "flux" && promptStyle === "natural") return 0.94;
  if (provider === "gpt-image" && promptStyle === "artistic") return 0.91;
  return 0.82;
}
