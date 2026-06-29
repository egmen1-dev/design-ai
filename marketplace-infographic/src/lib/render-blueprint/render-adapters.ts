/**
 * Chapter 3.11 — Render Adapters (stateless translators)
 */
import type { RenderBlueprint } from "./types";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { BlueprintLifecycle } from "./lifecycle-types";
import { assertReadyForAdapter } from "./constitution";
import { extractRenderIntent } from "./render-intent";
import { negotiateCapabilities } from "./capability-negotiation";
import { getProviderCapabilities } from "./provider-capabilities";
import {
  compilePromptForProvider,
  validateCompiledPrompt,
} from "./prompt-compiler";
import {
  compileNegativePrompt,
  validateNegativePrompt,
} from "./negative-prompt-contract";
import type {
  CompiledProviderRequest,
  ProviderCapabilities,
  ProviderId,
  ProviderRenderFn,
  ProviderRequest,
  ProviderResponse,
  RenderAdapter,
} from "./render-pipeline-types";

export class RenderPipelineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RenderPipelineError";
  }
}

const ADAPTER_VERSION = "3.11.0";

function buildRequest(
  blueprint: Readonly<RenderBlueprint>,
  provider: ProviderId,
  adapterId: string,
): CompiledProviderRequest {
  assertReadyForAdapter(blueprint);
  const intent = extractRenderIntent(blueprint);
  const { capabilities, negotiated } = negotiateCapabilities(intent, provider);

  const prompt = compilePromptForProvider(intent, provider);
  const promptValidation = validateCompiledPrompt(prompt);
  if (!promptValidation.ok) {
    throw new RenderPipelineError(
      `Prompt compilation failed: ${promptValidation.issues.join("; ")}`,
    );
  }

  const negativePrompt = capabilities.supportsNegativePrompt
    ? compileNegativePrompt(blueprint)
    : "";
  if (negativePrompt) {
    const negValidation = validateNegativePrompt(negativePrompt);
    if (!negValidation.ok) {
      throw new RenderPipelineError(
        `Negative prompt invalid: ${negValidation.issues.join("; ")}`,
      );
    }
  }

  const { width, height } = blueprint.render.resolution;
  const seed = blueprint.meta.seed;

  return {
    prompt,
    negativePrompt,
    width,
    height,
    seed: capabilities.supportsSeed ? seed : 0,
    steps: capabilities.supportsSteps ? (provider === "sdxl" ? 30 : 20) : 0,
    cfg: capabilities.supportsCFG ? 7 : 0,
    provider,
    providerOptions: {
      quality: blueprint.render.quality,
      aspectRatio: blueprint.render.aspectRatio,
      adapterId,
      adapterVersion: ADAPTER_VERSION,
      seedSupported: capabilities.supportsSeed,
    },
    intent,
    negotiated,
    compiledAt: Date.now(),
  };
}

abstract class BaseRenderAdapter implements RenderAdapter {
  abstract readonly id: string;
  abstract readonly provider: ProviderId;
  readonly adapterVersion = ADAPTER_VERSION;
  readonly capabilities: ProviderCapabilities;
  protected readonly renderFn?: ProviderRenderFn;

  constructor(provider: ProviderId, renderFn?: ProviderRenderFn) {
    this.capabilities = getProviderCapabilities(provider);
    this.renderFn = renderFn;
  }

  compile(blueprint: Readonly<RenderBlueprint>): CompiledProviderRequest {
    return buildRequest(blueprint, this.provider, this.id);
  }

  async render(request: ProviderRequest): Promise<ProviderResponse> {
    if (this.renderFn) return this.renderFn(request);
    throw new RenderPipelineError(`No render backend configured for ${this.id}`);
  }
}

export class FluxRenderAdapter extends BaseRenderAdapter {
  readonly id = "flux-adapter";
  readonly provider = "flux" as const;
  constructor(renderFn?: ProviderRenderFn) {
    super("flux", renderFn);
  }
}

export class GptImageRenderAdapter extends BaseRenderAdapter {
  readonly id = "gpt-image-adapter";
  readonly provider = "gpt-image" as const;
  constructor(renderFn?: ProviderRenderFn) {
    super("gpt-image", renderFn);
  }
}

export class SdxlRenderAdapter extends BaseRenderAdapter {
  readonly id = "sdxl-adapter";
  readonly provider = "sdxl" as const;
  constructor(renderFn?: ProviderRenderFn) {
    super("sdxl", renderFn);
  }
}

export class PollinationsRenderAdapter extends BaseRenderAdapter {
  readonly id = "pollinations-adapter";
  readonly provider = "pollinations" as const;
  constructor(renderFn?: ProviderRenderFn) {
    super("pollinations", renderFn);
  }
}

export function createDefaultAdapters(renderFn?: ProviderRenderFn): RenderAdapter[] {
  return [
    new FluxRenderAdapter(renderFn),
    new GptImageRenderAdapter(renderFn),
    new SdxlRenderAdapter(renderFn),
    new PollinationsRenderAdapter(renderFn),
  ];
}

export function frozenTestBlueprint(): RenderBlueprint {
  const bp = createEmptyRenderBlueprint({ seed: 42, category: "electronics" });
  bp.lifecycle.stage = BlueprintLifecycle.FROZEN;
  bp.meta.locked = true;
  bp.scene.environment = "kitchen";
  bp.scene.architecture = "modern";
  bp.photography.visualMood = "clean morning light";
  bp.camera.lens = 50;
  bp.composition.template = "hero_right";
  return bp;
}
