import type {
  RenderAttempt,
  RenderEngineResult,
  RenderRequest,
} from "../types";
import { RENDER_ENGINE_CONFIG } from "../config";
import { planRenderRequest, type RenderPlannerInput } from "../planner/render-planner";
import { getRenderAdapter } from "../adapters/registry";
import { getRenderingProvider } from "../providers/registry";
import { evaluateRenderQuality, type RenderQualityInput } from "../quality/render-quality";
import { selectModelForRetry } from "../planner/model-selection";
import { compilePollinationsPrompt } from "../adapters/pollinations-compiler";
import { saveRenderDebugArtifacts } from "../debug/render-debug";
import { isPollinationsModelBlockedError } from "../providers/pollinations/moderation";

export type RenderWithRetryInput = RenderPlannerInput & {
  seedSuffix?: string;
  qualityInput?: Omit<RenderQualityInput, "request">;
  /** When user picks a model in the form — no fallback chain */
  lockModel?: boolean;
  debugRequestId?: string;
};

/**
 * Retry Engine — attempts models in chain, selects highest design score.
 */
export async function renderWithRetry(input: RenderWithRetryInput): Promise<RenderEngineResult> {
  const maxAttempts = input.lockModel && input.modelOverride ? 1 : RENDER_ENGINE_CONFIG.retry.maxAttempts;
  const attempts: RenderAttempt[] = [];
  let lastRequest: RenderRequest | undefined;
  let best: { attempt: RenderAttempt; score: number } | undefined;

  for (let i = 0; i < maxAttempts; i++) {
    const modelId =
      input.lockModel && input.modelOverride
        ? input.modelOverride
        : i === 0
          ? input.modelOverride
          : selectModelForRetry(attempts[i - 1]?.modelId ?? "flux", i);

    const request = planRenderRequest({
      ...input,
      attemptIndex: i,
      modelOverride: modelId,
    });
    lastRequest = request;

    const adapter = getRenderAdapter(request.modelId, request.providerId);
    const compiled = adapter.compile(request);
    const provider = getRenderingProvider(request.providerId);

    const attempt: RenderAttempt = {
      attemptIndex: i,
      modelId: request.modelId,
      providerId: request.providerId,
      profileId: request.profileId,
      passed: false,
    };

    try {
      const result = await provider.render(compiled, {
        seedSuffix: input.seedSuffix ? `${input.seedSuffix}:a${i}` : `a${i}`,
        moderationHints: {
          atmosphere: request.scene.atmosphere,
          environment: request.scene.environment,
        },
      });
      attempt.result = result;

      const quality = evaluateRenderQuality({
        request,
        ...input.qualityInput,
      });
      attempt.qualityScore = quality.overallDesignScore;
      attempt.qualityBreakdown = quality;
      attempt.passed = quality.passed;

      if (!best || quality.overallDesignScore > best.score) {
        best = { attempt, score: quality.overallDesignScore };
      }

      if (quality.passed) {
        attempts.push(attempt);
        return buildResult(request, attempts, best.attempt, best.score);
      }
    } catch (e) {
      attempt.error = e instanceof Error ? e.message : String(e);
      if (isPollinationsModelBlockedError(e) && input.lockModel) {
        throw e;
      }
    }

    attempts.push(attempt);
  }

  if (best?.attempt.result) {
    if (input.visualBlueprint && input.debugRequestId) {
      const compiled = compilePollinationsPrompt(input.visualBlueprint);
      void saveRenderDebugArtifacts({
        requestId: input.debugRequestId,
        sceneBlueprint: input.visualBlueprint,
        pollinationsPrompt: compiled,
        providerResponse: {
          ok: true,
          modelId: best.attempt.modelId,
          latencyMs: best.attempt.result?.latencyMs,
        },
        backgroundPath: best.attempt.result?.imageUrl,
      }).catch(() => undefined);
    }
    return buildResult(lastRequest!, attempts, best.attempt, best.score);
  }

  throw new Error(
    `Render engine failed after ${maxAttempts} attempts: ${attempts.map((a) => a.error ?? a.modelId).join("; ")}`,
  );
}

function buildResult(
  request: RenderRequest,
  attempts: RenderAttempt[],
  selected: RenderAttempt,
  overallScore: number,
): RenderEngineResult {
  const result = selected.result!;
  return {
    backgroundBuffer: result.imageBuffer,
    backgroundUrl: result.imageUrl ?? "",
    backgroundSource: "provider",
    request,
    attempts,
    selectedAttempt: selected,
    overallScore,
  };
}
