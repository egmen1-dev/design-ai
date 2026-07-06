export type DAOSRenderDebugArtifact = {
  provider?: string;
  model?: string;
  renderStrategy?: string;
  finalPrompt?: string;
  negativePrompt?: string;
  promptLength?: number;
  fallbackUsed?: boolean;
  fallbackReason?: string;
  modulesIgnored?: string[];
  renderRequestSummary?: unknown;
  providerPayloadSummary?: unknown;
  daosV17BridgeApplied?: boolean;
  daosV17BridgeLength?: number;
  daosV17BridgePreview?: string;
  daosV17BridgeModulesAddressed?: string[];
  daosV17ModulesBridgeApplied?: boolean;
  daosV17ModulesBridgeLength?: number;
  daosV17ModulesBridgePreview?: string;
  daosV17ModulesCompiled?: string[];
  daosV17ModulesStillIgnored?: string[];
  daosV17CtrBridgeApplied?: boolean;
  daosV17CtrBridgeSource?: string;
  daosV17CtrBridgeLength?: number;
  createdAt: string;
};

function asRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === "string" ? item.trim() : String(item)))
    .filter(Boolean);
}

function summarizeRequest(request: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!Object.keys(request).length) return undefined;
  return {
    requestId: request.requestId,
    profileId: request.profileId,
    modelId: request.modelId,
    providerId: request.providerId,
    category: request.category,
    canvas: request.canvas,
  };
}

function summarizeProviderPayload(
  result: Record<string, unknown>,
  compiled: Record<string, unknown>,
  request: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!Object.keys(result).length && !Object.keys(compiled).length) return undefined;
  return {
    providerId: result.providerId ?? request.providerId,
    modelId: result.modelId ?? request.modelId,
    latencyMs: result.latencyMs,
    seed: compiled.seed ?? result.seed,
    modulesUsed: compiled.modulesUsed,
  };
}

/** Safe heuristic extraction from legacy render engine / provider artifacts. */
export function extractDaosRenderDebug(input: unknown): DAOSRenderDebugArtifact {
  const createdAt = new Date().toISOString();

  try {
    const root = asRecord(input);
    const engine = asRecord(root.renderEngineResult ?? root.engine ?? root);
    const request = asRecord(engine.request ?? root.request);
    const selected = asRecord(engine.selectedAttempt ?? root.selectedAttempt);
    const result = asRecord(selected.result ?? engine.result);
    const compiled = asRecord(
      result.compiled ?? root.compiledPayload ?? root.compiled ?? asRecord(root.compiledBackground),
    );
    const legacyCompiled = asRecord(root.compiledBackground);

    const provider =
      asString(request.providerId) ??
      asString(selected.providerId) ??
      asString(result.providerId) ??
      asString(root.provider) ??
      asString(root.renderProvider);

    const model =
      asString(request.modelId) ??
      asString(compiled.model) ??
      asString(selected.modelId) ??
      asString(root.model);

    const renderStrategy =
      asString(root.renderStrategy) ??
      asString(asRecord(root.renderBlueprint).renderStrategy) ??
      asString(request.profileId);

    const finalPrompt =
      asString(compiled.prompt) ??
      asString(legacyCompiled.prompt) ??
      asString(root.finalPrompt) ??
      asString(root.prompt);

    const negativePrompt =
      asString(compiled.negativePrompt) ?? asString(legacyCompiled.negativePrompt) ?? asString(root.negativePrompt);

    const modulesIgnored = asStringArray(compiled.modulesIgnored ?? root.modulesIgnored);

    const pipelineBackgroundSource = asString(root.backgroundSource);
    const engineBackgroundSource = asString(engine.backgroundSource);
    const fallbackUsed =
      root.fallbackUsed === true ||
      pipelineBackgroundSource === "fallback" ||
      engineBackgroundSource === "fallback";

    let fallbackReason: string | undefined;
    if (fallbackUsed) {
      fallbackReason =
        asString(root.fallbackReason) ??
        (pipelineBackgroundSource === "fallback" ? "pipeline backgroundSource=fallback" : undefined) ??
        (engineBackgroundSource === "fallback" ? "render engine backgroundSource=fallback" : undefined);

      if (!fallbackReason) {
        const attempts = Array.isArray(engine.attempts) ? engine.attempts : [];
        const errors = attempts
          .map((attempt) => asRecord(attempt))
          .map((attempt) => asString(attempt.error))
          .filter((error): error is string => Boolean(error));
        if (errors.length > 0) {
          fallbackReason = `retry after: ${errors.slice(0, 2).join("; ")}`;
        }
      }
    }

    const artifact: DAOSRenderDebugArtifact = { createdAt };

    if (provider) artifact.provider = provider;
    if (model) artifact.model = model;
    if (renderStrategy) artifact.renderStrategy = renderStrategy;
    if (finalPrompt) {
      artifact.finalPrompt = finalPrompt;
      artifact.promptLength = finalPrompt.length;
    }
    if (negativePrompt) artifact.negativePrompt = negativePrompt;
    if (fallbackUsed) {
      artifact.fallbackUsed = true;
      if (fallbackReason) artifact.fallbackReason = fallbackReason;
    }
    if (modulesIgnored.length > 0) artifact.modulesIgnored = modulesIgnored;

    const daosV17Bridge = asRecord(compiled.daosV17Bridge);
    if (daosV17Bridge.applied === true) {
      artifact.daosV17BridgeApplied = true;
      if (typeof daosV17Bridge.length === "number") {
        artifact.daosV17BridgeLength = daosV17Bridge.length;
      }
      const preview = asString(daosV17Bridge.preview);
      if (preview) artifact.daosV17BridgePreview = preview;
      const modulesAddressed = asStringArray(daosV17Bridge.modulesAddressed);
      if (modulesAddressed.length > 0) {
        artifact.daosV17BridgeModulesAddressed = modulesAddressed;
      }
    }

    const daosV17Modules = asRecord(compiled.daosV17Modules);
    if (daosV17Modules.applied === true) {
      artifact.daosV17ModulesBridgeApplied = true;
      if (typeof daosV17Modules.length === "number") {
        artifact.daosV17ModulesBridgeLength = daosV17Modules.length;
      }
      const modulesPreview = asString(daosV17Modules.preview);
      if (modulesPreview) artifact.daosV17ModulesBridgePreview = modulesPreview;
      const modulesCompiled = asStringArray(daosV17Modules.modulesCompiled);
      if (modulesCompiled.length > 0) artifact.daosV17ModulesCompiled = modulesCompiled;
      const modulesStillIgnored = asStringArray(daosV17Modules.modulesStillIgnored);
      if (modulesStillIgnored.length > 0) {
        artifact.daosV17ModulesStillIgnored = modulesStillIgnored;
      } else if (modulesCompiled.length > 0) {
        artifact.daosV17ModulesStillIgnored = [];
      }
    }

    const daosV17Ctr = asRecord(compiled.daosV17Ctr);
    if (daosV17Ctr.applied === true) {
      artifact.daosV17CtrBridgeApplied = true;
      if (typeof daosV17Ctr.length === "number") {
        artifact.daosV17CtrBridgeLength = daosV17Ctr.length;
      }
      const ctrSource = asString(daosV17Ctr.source);
      if (ctrSource) artifact.daosV17CtrBridgeSource = ctrSource;
    }

    const renderRequestSummary = summarizeRequest(request);
    if (renderRequestSummary) artifact.renderRequestSummary = renderRequestSummary;

    const providerPayloadSummary = summarizeProviderPayload(result, compiled, request);
    if (providerPayloadSummary) artifact.providerPayloadSummary = providerPayloadSummary;

    return artifact;
  } catch {
    return { createdAt };
  }
}
