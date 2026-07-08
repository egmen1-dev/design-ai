export type DAOSGenerationMode = "draft" | "balanced" | "premium" | "enterprise";

export type DAOSGenerationPolicy = {
  mode: DAOSGenerationMode;
  maxRetries: number;
  enableVisionRequired: boolean;
  enableDebugBundle: boolean;
  allowFastShortcuts: boolean;
  requireRenderDebug: boolean;
  requireMeaningLossAnalysis: boolean;
  minimumFinalScore: number;
  description: string;
};

const VALID_MODES: DAOSGenerationMode[] = ["draft", "balanced", "premium", "enterprise"];

function asRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function isValidMode(value: string): value is DAOSGenerationMode {
  return VALID_MODES.includes(value as DAOSGenerationMode);
}

const POLICIES: Record<DAOSGenerationMode, DAOSGenerationPolicy> = {
  draft: {
    mode: "draft",
    maxRetries: 1,
    enableVisionRequired: false,
    enableDebugBundle: false,
    allowFastShortcuts: true,
    requireRenderDebug: false,
    requireMeaningLossAnalysis: false,
    minimumFinalScore: 70,
    description: "Fast exploratory generation with optional diagnostics.",
  },
  balanced: {
    mode: "balanced",
    maxRetries: 2,
    enableVisionRequired: false,
    enableDebugBundle: true,
    allowFastShortcuts: true,
    requireRenderDebug: false,
    requireMeaningLossAnalysis: true,
    minimumFinalScore: 80,
    description: "Default production mode with debug bundle and meaning-loss analysis.",
  },
  premium: {
    mode: "premium",
    maxRetries: 5,
    enableVisionRequired: true,
    enableDebugBundle: true,
    allowFastShortcuts: false,
    requireRenderDebug: true,
    requireMeaningLossAnalysis: true,
    minimumFinalScore: 90,
    description: "Premium guardrails: no fast shortcuts, render debug and vision required.",
  },
  enterprise: {
    mode: "enterprise",
    maxRetries: 8,
    enableVisionRequired: true,
    enableDebugBundle: true,
    allowFastShortcuts: false,
    requireRenderDebug: true,
    requireMeaningLossAnalysis: true,
    minimumFinalScore: 95,
    description: "Enterprise guardrails with highest quality floor and full diagnostics.",
  },
};

/** Resolve DAOS generation mode from input/env with FAST_GENERATION compatibility. */
export function resolveDaosGenerationMode(input?: unknown): DAOSGenerationMode {
  const root = asRecord(input);
  const fromInput = asString(root.generationMode ?? root.daosGenerationMode ?? root.mode);
  if (fromInput && isValidMode(fromInput)) {
    return fromInput;
  }

  const fromEnv = process.env.DAOS_GENERATION_MODE?.trim().toLowerCase();
  if (fromEnv && isValidMode(fromEnv)) {
    return fromEnv;
  }

  const fastGeneration = process.env.FAST_GENERATION;
  if (fastGeneration === "0") {
    return "premium";
  }
  if (fastGeneration === undefined) {
    return "balanced";
  }

  return "draft";
}

export function getDaosGenerationPolicy(mode: DAOSGenerationMode): DAOSGenerationPolicy {
  return { ...POLICIES[mode] };
}

export function summarizeDaosGenerationPolicy(
  policy: DAOSGenerationPolicy,
): Omit<DAOSGenerationPolicy, "mode"> & { mode: DAOSGenerationMode } {
  return {
    mode: policy.mode,
    maxRetries: policy.maxRetries,
    enableVisionRequired: policy.enableVisionRequired,
    enableDebugBundle: policy.enableDebugBundle,
    allowFastShortcuts: policy.allowFastShortcuts,
    requireRenderDebug: policy.requireRenderDebug,
    requireMeaningLossAnalysis: policy.requireMeaningLossAnalysis,
    minimumFinalScore: policy.minimumFinalScore,
    description: policy.description,
  };
}

export function isPremiumGuardrailMode(mode?: DAOSGenerationMode): boolean {
  return mode === "premium" || mode === "enterprise";
}
