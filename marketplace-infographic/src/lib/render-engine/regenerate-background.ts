import type { SceneBlueprint } from "@/lib/design/scene-blueprint/types";
import type { LayoutSpec } from "@/lib/design/layout-spec/types";
import type { ScenePlan } from "@/lib/design/scene-planner";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { VisualSceneBlueprint } from "@/lib/design/visual-pipeline/types";
import type { RenderModelId } from "./types";
import { USE_RENDER_ENGINE_V17 } from "./config";
import { renderWithRetry, type RenderWithRetryInput } from "./retry/retry-engine";
import type { RenderEngineResult } from "./types";
import { buildRenderModelsChain } from "./render-models";
import { generateBackground, backgroundToDataUrl } from "@/lib/stable-diffusion";
import type { RenderQualityInput } from "./quality/render-quality";
import type { InfographicStyle } from "@/lib/design-trends";

export type RegenerateBackgroundInput = {
  analysis: ProductAnalysis;
  scenePlan: ScenePlan;
  layoutSpec?: LayoutSpec;
  sceneBlueprint?: SceneBlueprint;
  visualBlueprint?: VisualSceneBlueprint;
  variationSeed: string;
  /** Appended to variationSeed for provider seed diversity */
  seedSuffix: string;
  renderModel?: RenderModelId;
  luxuryScore?: number;
  compositionScore?: number;
  sceneScore?: number;
  constitutionPassed?: boolean;
  qualityInput?: Omit<RenderQualityInput, "request">;
  /** Legacy v16 HF prompt when RENDER_ENGINE_V17=0 */
  legacyPrompt: string;
  legacyStyle?: InfographicStyle;
  decisionLog?: string[];
};

export type RegenerateBackgroundResult = {
  url: string;
  dataUrl: string;
  source: "provider" | "sd";
  engine?: RenderEngineResult;
  adapterPrompt?: string;
};

/**
 * Unified background regeneration — Pollinations (v17) or HF (legacy v16).
 * All handler retry paths should use this instead of generateBackground() directly.
 */
export async function regenerateMarketplaceBackground(
  input: RegenerateBackgroundInput,
): Promise<RegenerateBackgroundResult> {
  if (USE_RENDER_ENGINE_V17) {
    const chain = buildRenderModelsChain(input.renderModel);
    let lastError = "render engine failed";

    for (let i = 0; i < chain.length; i++) {
      const modelId = chain[i];
      try {
        const engine = await renderWithRetry({
          analysis: input.analysis,
          scenePlan: input.scenePlan,
          layoutSpec: input.layoutSpec,
          sceneBlueprint: input.sceneBlueprint,
          visualBlueprint: input.visualBlueprint,
          debugRequestId: `${input.variationSeed}:${input.seedSuffix}`,
          luxuryScore: input.luxuryScore,
          compositionScore: input.compositionScore,
          sceneScore: input.sceneScore,
          constitutionPassed: input.constitutionPassed,
          seedSuffix: `${input.variationSeed}:${input.seedSuffix}:m${i}`,
          modelOverride: modelId,
          lockModel: true,
          qualityInput: input.qualityInput,
        } satisfies RenderWithRetryInput);

        const adapterPrompt =
          engine.selectedAttempt.result?.compiled.prompt ?? "v17 background";
        input.decisionLog?.push(
          `Render retry ${input.seedSuffix} model=${modelId} OK`,
        );

        return {
          url: engine.backgroundUrl,
          dataUrl: `data:image/png;base64,${engine.backgroundBuffer.toString("base64")}`,
          source: "provider",
          engine,
          adapterPrompt,
        };
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        input.decisionLog?.push(
          `Render retry ${input.seedSuffix} ${modelId}: ${lastError.slice(0, 80)}`,
        );
        console.warn(`[render-engine-v17] retry ${input.seedSuffix} ${modelId}:`, lastError);
      }
    }
    throw new Error(lastError);
  }

  if (!process.env.HF_API_KEY) {
    throw new Error("HF_API_KEY missing (set RENDER_ENGINE_V17=1 for Pollinations)");
  }
  const url = await generateBackground(input.legacyPrompt, {
    seedSuffix: `${input.variationSeed}:${input.seedSuffix}`,
    style: input.legacyStyle,
  });
  return {
    url,
    dataUrl: await backgroundToDataUrl(url),
    source: "sd",
  };
}
