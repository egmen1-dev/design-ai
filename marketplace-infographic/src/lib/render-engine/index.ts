import type { RenderEngineResult, CanvasComposeInput } from "./types";
import { renderWithRetry, type RenderWithRetryInput } from "./retry/retry-engine";
import { composeCanvas } from "./composer/canvas-composer";
import { planRenderRequest, type RenderPlannerInput } from "./planner/render-planner";
import { getRenderAdapter } from "./adapters/registry";
import { getRenderingProvider } from "./providers/registry";
import { USE_RENDER_ENGINE_V17, RENDER_ENGINE_CONFIG } from "./config";

export type RenderEngineOrchestratorInput = RenderWithRetryInput & {
  productCutoutPath?: string;
  compositionLayout?: CanvasComposeInput["compositionLayout"];
  objectScale?: number;
  skipCompose?: boolean;
};

export type RenderEngineOrchestratorResult = RenderEngineResult & {
  mergedPath?: string;
  mergedDataUrl?: string;
  composeSkipped?: boolean;
};

/** Main v17 entry — planner → adapter → provider → optional composer */
export async function runRenderEngine(
  input: RenderEngineOrchestratorInput,
): Promise<RenderEngineOrchestratorResult> {
  const engineResult = await renderWithRetry(input);

  if (input.skipCompose || !input.productCutoutPath) {
    return { ...engineResult, composeSkipped: true };
  }

  const composed = await composeCanvas({
    backgroundBuffer: engineResult.backgroundBuffer,
    productCutoutPath: input.productCutoutPath,
    scenePlan: input.scenePlan,
    compositionLayout: input.compositionLayout,
    objectScale: input.objectScale,
    preserveProductPixels: true,
  });

  return {
    ...engineResult,
    mergedPath: composed.mergedPath,
    mergedDataUrl: `data:image/png;base64,${composed.mergedBuffer.toString("base64")}`,
    composeSkipped: false,
  };
}

export {
  USE_RENDER_ENGINE_V17,
  RENDER_ENGINE_CONFIG,
  planRenderRequest,
  getRenderAdapter,
  getRenderingProvider,
  composeCanvas,
  renderWithRetry,
};

export type { RenderPlannerInput, RenderWithRetryInput };
export type {
  RenderRequest,
  RenderEngineResult,
  RenderAttempt,
  RenderingProvider,
  RenderAdapter,
  CompiledRenderPayload,
} from "./types";

export { RENDER_ENGINE_VERSION, RENDER_QUALITY_PASS_THRESHOLD } from "./types";
export { RENDER_PROFILES, resolveRenderProfileId } from "./profiles";
export { evaluateRenderQuality } from "./quality/render-quality";
export { checkRenderProvidersHealth } from "./providers/registry";
