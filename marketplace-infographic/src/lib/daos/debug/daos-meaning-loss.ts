import type { DAOSProjectState } from "../core/project-state";
import type {
  CommercialSpec,
  CreativeSpec,
  RenderBlueprint,
  VisualBlueprint,
} from "../contracts/specs";
import type { DAOSRenderDebugArtifact } from "./render-debug-bridge";
import {
  getDaosGenerationPolicy,
  isPremiumGuardrailMode,
  type DAOSGenerationMode,
} from "../config/generation-mode";
import {
  computePipelineCompleteness,
  DAOS_PIPELINE_COMPLETENESS_CRITICAL_THRESHOLD,
  DAOS_PIPELINE_COMPLETENESS_WARNING_THRESHOLD,
} from "../pipeline/daos-pipeline-context";

export type AnalyzeDaosMeaningLossOptions = {
  renderDebug?: DAOSRenderDebugArtifact;
  generationMode?: DAOSGenerationMode;
  promptContextInjected?: boolean;
  promptContextEnabled?: boolean;
  renderContextEnabled?: boolean;
  renderContextAttached?: boolean;
  useRenderEngineV17?: boolean;
  daosV17BridgeEnabled?: boolean;
  daosV17ModulesBridgeEnabled?: boolean;
  daosV17CtrBridgeEnabled?: boolean;
};

export type DaosMeaningLossSeverity = "warning" | "critical";

export type DaosMeaningLossWarning = {
  code: string;
  severity: DaosMeaningLossSeverity;
  message: string;
  spec?: string;
};

export type DaosMeaningLossReport = {
  missingSpecs: string[];
  lowConfidenceSpecs: string[];
  emptyDecisionTraceSpecs: string[];
  commercialToCreativeLoss: DaosMeaningLossWarning[];
  creativeToVisualLoss: DaosMeaningLossWarning[];
  visualToRenderLoss: DaosMeaningLossWarning[];
  renderPromptRisk: DaosMeaningLossWarning[];
  renderDebugLoss: DaosMeaningLossWarning[];
  pipelineContextLoss: DaosMeaningLossWarning[];
  promptContextLoss: DaosMeaningLossWarning[];
  renderContextLoss: DaosMeaningLossWarning[];
  v17BridgeLoss: DaosMeaningLossWarning[];
  warnings: DaosMeaningLossWarning[];
};

const SPEC_KEYS = [
  "brief",
  "knowledgeSpec",
  "commercialSpec",
  "creativeSpec",
  "visualBlueprint",
  "renderBlueprint",
] as const;

type SpecKey = (typeof SPEC_KEYS)[number];

const PLACEHOLDER_VALUES = new Set([
  "pending",
  "unknown",
  "n/a",
  "commercial message pending",
  "scene pending",
  "composition pending",
  "lighting pending",
]);

const LOW_CONFIDENCE_THRESHOLD = 0.6;
const PROMPT_MIN_LENGTH = 120;
const PROMPT_MAX_LENGTH = 2500;

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-zа-яё0-9]+/i)
    .filter((word) => word.length >= 3);
}

function hasWordOverlap(sourcePhrases: string[], targetText: string): boolean {
  const targetTokens = new Set(tokenize(targetText));
  if (targetTokens.size === 0) return false;

  for (const phrase of sourcePhrases) {
    for (const token of tokenize(phrase)) {
      if (targetTokens.has(token)) return true;
    }
  }
  return false;
}

function isEmptyField(value: string | undefined): boolean {
  if (!value?.trim()) return true;
  return PLACEHOLDER_VALUES.has(value.trim().toLowerCase());
}

function specConfidence(spec: { confidence?: { score?: number } } | undefined): number | undefined {
  return spec?.confidence?.score;
}

function collectMissingSpecs(state: DAOSProjectState): string[] {
  return SPEC_KEYS.filter((key) => !state[key]);
}

function collectLowConfidenceSpecs(state: DAOSProjectState): DaosMeaningLossWarning[] {
  const warnings: DaosMeaningLossWarning[] = [];
  const lowConfidenceSpecs: string[] = [];

  for (const key of SPEC_KEYS) {
    const spec = state[key];
    if (!spec) continue;
    const score = specConfidence(spec);
    if (score !== undefined && score < LOW_CONFIDENCE_THRESHOLD) {
      lowConfidenceSpecs.push(key);
      warnings.push({
        code: "LOW_CONFIDENCE",
        severity: "warning",
        message: `${key} confidence ${score.toFixed(2)} is below ${LOW_CONFIDENCE_THRESHOLD}`,
        spec: key,
      });
    }
  }

  return warnings;
}

function collectEmptyDecisionTraceSpecs(state: DAOSProjectState): string[] {
  const empty: string[] = [];
  for (const key of SPEC_KEYS) {
    const spec = state[key];
    if (spec && spec.decisionTrace.length === 0) {
      empty.push(key);
    }
  }
  return empty;
}

function analyzeCommercialToCreativeLoss(
  commercial: CommercialSpec | undefined,
  creative: CreativeSpec | undefined,
): DaosMeaningLossWarning[] {
  if (!commercial?.usp?.length) return [];

  const creativeText = [
    creative?.concept,
    creative?.visualHook,
    creative?.mood,
  ]
    .filter(Boolean)
    .join(" ");

  if (!creative) {
    return [
      {
        code: "COMMERCIAL_TO_CREATIVE_MISSING",
        severity: "warning",
        message: "commercialSpec has USP points but creativeSpec is missing",
        spec: "creativeSpec",
      },
    ];
  }

  if (!hasWordOverlap(commercial.usp, creativeText)) {
    return [
      {
        code: "COMMERCIAL_TO_CREATIVE_LOSS",
        severity: "warning",
        message: "commercialSpec.usp terms do not appear in creativeSpec concept/visualHook/mood",
        spec: "creativeSpec",
      },
    ];
  }

  return [];
}

function analyzeCreativeToVisualLoss(
  creative: CreativeSpec | undefined,
  visual: VisualBlueprint | undefined,
): DaosMeaningLossWarning[] {
  if (!creative?.visualHook?.trim()) return [];

  if (!visual) {
    return [
      {
        code: "CREATIVE_TO_VISUAL_MISSING",
        severity: "warning",
        message: "creativeSpec.visualHook is set but visualBlueprint is missing",
        spec: "visualBlueprint",
      },
    ];
  }

  if (isEmptyField(visual.scene) && isEmptyField(visual.composition)) {
    return [
      {
        code: "CREATIVE_TO_VISUAL_LOSS",
        severity: "warning",
        message: "creativeSpec.visualHook is set but visualBlueprint.scene/composition are empty or placeholder",
        spec: "visualBlueprint",
      },
    ];
  }

  return [];
}

function inferExpectedRenderStrategy(visual: VisualBlueprint): RenderBlueprint["renderStrategy"] | undefined {
  const text = `${visual.scene} ${visual.composition} ${visual.lighting}`.toLowerCase();
  if (/(lifestyle|interior|environment|room|kitchen|outdoor|scene)/.test(text)) {
    return "integrated_scene";
  }
  if (/(studio|white background|isolated|cutout|plain)/.test(text)) {
    return "background_only";
  }
  return undefined;
}

function analyzeVisualToRenderLoss(
  visual: VisualBlueprint | undefined,
  render: RenderBlueprint | undefined,
): DaosMeaningLossWarning[] {
  if (!visual) return [];
  if (isEmptyField(visual.scene) && isEmptyField(visual.composition)) return [];

  if (!render) {
    return [
      {
        code: "VISUAL_TO_RENDER_MISSING",
        severity: "warning",
        message: "visualBlueprint is present but renderBlueprint is missing",
        spec: "renderBlueprint",
      },
    ];
  }

  const expected = inferExpectedRenderStrategy(visual);
  if (expected && render.renderStrategy !== expected) {
    return [
      {
        code: "VISUAL_TO_RENDER_STRATEGY_MISMATCH",
        severity: "warning",
        message: `visualBlueprint implies ${expected} but renderBlueprint uses ${render.renderStrategy}`,
        spec: "renderBlueprint",
      },
    ];
  }

  if (!render.provider) {
    return [
      {
        code: "VISUAL_TO_RENDER_PROVIDER_MISSING",
        severity: "warning",
        message: "visualBlueprint is present but renderBlueprint.provider is empty",
        spec: "renderBlueprint",
      },
    ];
  }

  return [];
}

function analyzeRenderPromptRisk(render: RenderBlueprint | undefined): DaosMeaningLossWarning[] {
  if (!render) return [];

  if (render.promptAllowedOnlyInAdapter !== true) {
    return [
      {
        code: "RENDER_PROMPT_CONTRACT_VIOLATION",
        severity: "critical",
        message: "renderBlueprint.promptAllowedOnlyInAdapter must be true",
        spec: "renderBlueprint",
      },
    ];
  }

  return [];
}

function warningSeverity(
  code: string,
  defaultSeverity: DaosMeaningLossSeverity,
  generationMode?: DAOSGenerationMode,
): DaosMeaningLossSeverity {
  if (!isPremiumGuardrailMode(generationMode)) {
    return defaultSeverity;
  }
  if (code === "PROMPT_MISSING" || code === "FALLBACK_USED" || code === "RENDER_DEBUG_MISSING") {
    return "critical";
  }
  return defaultSeverity;
}

function analyzeRenderDebugLoss(
  render: RenderBlueprint | undefined,
  renderDebug: DAOSRenderDebugArtifact | undefined,
  generationMode?: DAOSGenerationMode,
): DaosMeaningLossWarning[] {
  const warnings: DaosMeaningLossWarning[] = [];
  const policy = generationMode ? getDaosGenerationPolicy(generationMode) : undefined;

  if (policy?.requireRenderDebug && !renderDebug) {
    warnings.push({
      code: "RENDER_DEBUG_MISSING",
      severity: warningSeverity("RENDER_DEBUG_MISSING", "warning", generationMode),
      message: "premium guardrails require renderDebug artifact but none was captured",
      spec: "renderBlueprint",
    });
  }

  if (!render && !renderDebug) return warnings;

  const hasRenderContext = Boolean(render || renderDebug?.renderRequestSummary || renderDebug?.finalPrompt);

  if (!renderDebug?.provider?.trim() && hasRenderContext) {
    warnings.push({
      code: "PROVIDER_MISSING",
      severity: "warning",
      message: "render debug artifact has no provider",
      spec: "renderBlueprint",
    });
  }

  if (render && !renderDebug?.finalPrompt) {
    warnings.push({
      code: "PROMPT_MISSING",
      severity: warningSeverity("PROMPT_MISSING", "warning", generationMode),
      message: "renderBlueprint exists but finalPrompt is missing in renderDebug",
      spec: "renderBlueprint",
    });
  }

  const promptLength = renderDebug?.promptLength ?? renderDebug?.finalPrompt?.length;
  if (promptLength !== undefined) {
    if (promptLength < PROMPT_MIN_LENGTH) {
      warnings.push({
        code: "PROMPT_TOO_SHORT",
        severity: "warning",
        message: `promptLength ${promptLength} is below ${PROMPT_MIN_LENGTH}`,
        spec: "renderBlueprint",
      });
    }
    if (promptLength > PROMPT_MAX_LENGTH) {
      warnings.push({
        code: "PROMPT_TOO_LONG",
        severity: "warning",
        message: `promptLength ${promptLength} exceeds ${PROMPT_MAX_LENGTH}`,
        spec: "renderBlueprint",
      });
    }
  }

  if ((renderDebug?.modulesIgnored?.length ?? 0) > 0) {
    warnings.push({
      code: "MODULES_IGNORED",
      severity: "warning",
      message: `render compiler ignored modules: ${renderDebug!.modulesIgnored!.join(", ")}`,
      spec: "renderBlueprint",
    });
  }

  if (renderDebug?.fallbackUsed === true) {
    warnings.push({
      code: "FALLBACK_USED",
      severity: warningSeverity("FALLBACK_USED", "warning", generationMode),
      message: renderDebug.fallbackReason
        ? `render fallback used: ${renderDebug.fallbackReason}`
        : "render fallback used",
      spec: "renderBlueprint",
    });
  }

  return warnings;
}

function analyzePipelineContextLoss(
  state: DAOSProjectState,
  generationMode?: DAOSGenerationMode,
): DaosMeaningLossWarning[] {
  const { completenessScore, missingSpecs } = computePipelineCompleteness(state);

  if (completenessScore >= DAOS_PIPELINE_COMPLETENESS_WARNING_THRESHOLD) {
    return [];
  }

  const premiumCritical =
    isPremiumGuardrailMode(generationMode) &&
    completenessScore < DAOS_PIPELINE_COMPLETENESS_CRITICAL_THRESHOLD;

  return [
    {
      code: "PIPELINE_CONTEXT_INCOMPLETE",
      severity: premiumCritical ? "critical" : "warning",
      message: `pipeline context completeness ${completenessScore} is below ${DAOS_PIPELINE_COMPLETENESS_WARNING_THRESHOLD}; missing: ${missingSpecs.join(", ") || "none"}`,
    },
  ];
}

function analyzePromptContextLoss(
  completenessScore: number,
  options?: AnalyzeDaosMeaningLossOptions,
): DaosMeaningLossWarning[] {
  if (!options?.promptContextEnabled) {
    return [];
  }
  if (completenessScore >= DAOS_PIPELINE_COMPLETENESS_CRITICAL_THRESHOLD && !options.promptContextInjected) {
    return [
      {
        code: "DAOS_CONTEXT_NOT_INJECTED",
        severity: "warning",
        message: `pipeline context completeness ${completenessScore} is sufficient but DAOS prompt context was not injected`,
      },
    ];
  }
  return [];
}

function analyzeRenderContextLoss(
  completenessScore: number,
  options?: AnalyzeDaosMeaningLossOptions,
): DaosMeaningLossWarning[] {
  if (!options?.renderContextEnabled || !options.useRenderEngineV17) {
    return [];
  }
  if (
    completenessScore >= DAOS_PIPELINE_COMPLETENESS_CRITICAL_THRESHOLD &&
    !options.renderContextAttached
  ) {
    return [
      {
        code: "DAOS_RENDER_CONTEXT_NOT_ATTACHED",
        severity: "warning",
        message: `pipeline context completeness ${completenessScore} is sufficient but DAOS render context was not attached to v17 input`,
      },
    ];
  }
  return [];
}

const V17_BRIDGE_IGNORED_MODULES = [
  "layout_coordinates",
  "hierarchy",
  "typography_zones",
  "ctr_wording",
] as const;

function analyzeV17BridgeLoss(options?: AnalyzeDaosMeaningLossOptions): DaosMeaningLossWarning[] {
  if (!options?.daosV17BridgeEnabled) {
    return [];
  }

  const warnings: DaosMeaningLossWarning[] = [];
  const renderDebug = options.renderDebug;
  const bridgeApplied = renderDebug?.daosV17BridgeApplied === true;

  if (options.renderContextAttached && !bridgeApplied) {
    warnings.push({
      code: "DAOS_V17_BRIDGE_NOT_APPLIED",
      severity: "warning",
      message:
        "DAOS_V17_PROMPT_BRIDGE is enabled and render context is attached but v17 bridge was not applied to provider prompt",
      spec: "renderBlueprint",
    });
  }

  if (bridgeApplied) {
    const ignored = new Set(renderDebug?.modulesIgnored ?? []);
    const stillIgnored = V17_BRIDGE_IGNORED_MODULES.filter((module) => ignored.has(module));
    if (stillIgnored.length > 0) {
      warnings.push({
        code: "DAOS_V17_BRIDGE_APPLIED_WITH_IGNORED_MODULES",
        severity: "warning",
        message: `v17 bridge applied but adapter still ignores modules: ${stillIgnored.join(", ")}`,
        spec: "renderBlueprint",
      });
    }
  }

  return warnings;
}

function analyzeV17ModulesBridgeLoss(options?: AnalyzeDaosMeaningLossOptions): DaosMeaningLossWarning[] {
  if (!options?.daosV17ModulesBridgeEnabled) {
    return [];
  }

  const warnings: DaosMeaningLossWarning[] = [];
  const renderDebug = options.renderDebug;
  const modulesBridgeApplied = renderDebug?.daosV17ModulesBridgeApplied === true;

  if (options.renderContextAttached && !modulesBridgeApplied) {
    warnings.push({
      code: "DAOS_V17_MODULES_BRIDGE_NOT_APPLIED",
      severity: "warning",
      message:
        "DAOS_V17_MODULES_BRIDGE is enabled and render context is attached but v17 modules bridge was not applied to provider prompt",
      spec: "renderBlueprint",
    });
  }

  if (modulesBridgeApplied) {
    const stillIgnored = renderDebug?.daosV17ModulesStillIgnored ?? [];
    if (stillIgnored.length > 0) {
      warnings.push({
        code: "DAOS_V17_MODULES_STILL_IGNORED",
        severity: "warning",
        message: `v17 modules bridge applied but adapter still ignores modules: ${stillIgnored.join(", ")}`,
        spec: "renderBlueprint",
      });
    }
  }

  return warnings;
}

function analyzeV17CtrBridgeLoss(options?: AnalyzeDaosMeaningLossOptions): DaosMeaningLossWarning[] {
  if (!options?.daosV17CtrBridgeEnabled) {
    return [];
  }

  const warnings: DaosMeaningLossWarning[] = [];
  const renderDebug = options.renderDebug;
  const ctrBridgeApplied = renderDebug?.daosV17CtrBridgeApplied === true;

  if (options.renderContextAttached && !ctrBridgeApplied) {
    warnings.push({
      code: "DAOS_V17_CTR_BRIDGE_NOT_APPLIED",
      severity: "warning",
      message:
        "DAOS_V17_CTR_BRIDGE is enabled and render context is attached but CTR wording bridge was not applied to provider prompt",
      spec: "renderBlueprint",
    });
  }

  const stillIgnored = renderDebug?.daosV17ModulesStillIgnored ?? [];
  if (stillIgnored.includes("ctr_wording")) {
    warnings.push({
      code: "CTR_WORDING_STILL_IGNORED",
      severity: "warning",
      message: "ctr_wording remains in modulesStillIgnored after v17 modules/CTR bridge",
      spec: "renderBlueprint",
    });
  }

  return warnings;
}

/** Deterministic loss-of-meaning checks between DAOS specs (no LLM). */
export function analyzeDaosMeaningLoss(
  state: DAOSProjectState,
  options?: AnalyzeDaosMeaningLossOptions,
): DaosMeaningLossReport {
  const renderDebug = options?.renderDebug;
  const generationMode = options?.generationMode ?? state.brief?.generationMode;
  const missingSpecs = collectMissingSpecs(state);
  const lowConfidenceWarnings = collectLowConfidenceSpecs(state);
  const lowConfidenceSpecs = lowConfidenceWarnings.map((w) => w.spec!).filter(Boolean);
  const emptyDecisionTraceSpecs = collectEmptyDecisionTraceSpecs(state);

  const commercialToCreativeLoss = analyzeCommercialToCreativeLoss(
    state.commercialSpec,
    state.creativeSpec,
  );
  const creativeToVisualLoss = analyzeCreativeToVisualLoss(
    state.creativeSpec,
    state.visualBlueprint,
  );
  const visualToRenderLoss = analyzeVisualToRenderLoss(
    state.visualBlueprint,
    state.renderBlueprint,
  );
  const renderPromptRisk = analyzeRenderPromptRisk(state.renderBlueprint);
  const renderDebugLoss = analyzeRenderDebugLoss(state.renderBlueprint, renderDebug, generationMode);
  const pipelineContextLoss = analyzePipelineContextLoss(state, generationMode);
  const { completenessScore } = computePipelineCompleteness(state);
  const promptContextLoss = analyzePromptContextLoss(completenessScore, {
    ...options,
    promptContextEnabled: options?.promptContextEnabled,
    promptContextInjected: options?.promptContextInjected,
  });
  const renderContextLoss = analyzeRenderContextLoss(completenessScore, options);
  const v17BridgeLoss = analyzeV17BridgeLoss({
    ...options,
    renderDebug,
  });
  const v17ModulesBridgeLoss = analyzeV17ModulesBridgeLoss({
    ...options,
    renderDebug,
  });
  const v17CtrBridgeLoss = analyzeV17CtrBridgeLoss({
    ...options,
    renderDebug,
  });

  const warnings = [
    ...lowConfidenceWarnings,
    ...commercialToCreativeLoss,
    ...creativeToVisualLoss,
    ...visualToRenderLoss,
    ...renderPromptRisk,
    ...renderDebugLoss,
    ...pipelineContextLoss,
    ...promptContextLoss,
    ...renderContextLoss,
    ...v17BridgeLoss,
    ...v17ModulesBridgeLoss,
    ...v17CtrBridgeLoss,
  ];

  return {
    missingSpecs,
    lowConfidenceSpecs,
    emptyDecisionTraceSpecs,
    commercialToCreativeLoss,
    creativeToVisualLoss,
    visualToRenderLoss,
    renderPromptRisk,
    renderDebugLoss,
    pipelineContextLoss,
    promptContextLoss,
    renderContextLoss,
    v17BridgeLoss,
    warnings,
  };
}

export function confidenceBySpec(state: DAOSProjectState): Record<SpecKey, number | undefined> {
  return {
    brief: specConfidence(state.brief),
    knowledgeSpec: specConfidence(state.knowledgeSpec),
    commercialSpec: specConfidence(state.commercialSpec),
    creativeSpec: specConfidence(state.creativeSpec),
    visualBlueprint: specConfidence(state.visualBlueprint),
    renderBlueprint: specConfidence(state.renderBlueprint),
  };
}
