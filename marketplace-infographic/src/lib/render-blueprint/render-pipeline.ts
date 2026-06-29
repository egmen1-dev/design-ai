/**
 * Chapter 3.11 — Render Pipeline orchestrator
 */
import type { FluxAdapterOutput, RenderBlueprint, RenderGeneratorId } from "./types";
import { assertReadyForAdapter } from "./constitution";
import {
  FluxRenderAdapter,
  GptImageRenderAdapter,
  PollinationsRenderAdapter,
  RenderPipelineError,
  SdxlRenderAdapter,
} from "./render-adapters";
import { getProviderCapabilities } from "./provider-capabilities";
import type {
  CompiledProviderRequest,
  ProviderId,
  ProviderRenderFn,
  ProviderRequest,
  ProviderResponse,
  RenderAdapter,
  RenderPipelineOptions,
  RenderPipelineResult,
} from "./render-pipeline-types";
import { DEFAULT_FALLBACK_CHAIN } from "./render-pipeline-types";

export {
  RenderPipelineError,
  FluxRenderAdapter,
  GptImageRenderAdapter,
  SdxlRenderAdapter,
  PollinationsRenderAdapter,
} from "./render-adapters";

export {
  extractRenderIntent,
} from "./render-intent";

export {
  compileFluxPrompt,
  compileGptImagePrompt,
  compilePollinationsPromptFromIntent,
  compilePromptForProvider,
  validateCompiledPrompt,
  BANNED_PROMPT_TERMS,
} from "./prompt-compiler";

export {
  compileNegativePrompt,
  validateNegativePrompt,
} from "./negative-prompt-contract";

export {
  getProviderCapabilities,
  getExcludedFields,
  PROVIDER_CAPABILITIES,
} from "./provider-capabilities";

export { negotiateCapabilities } from "./capability-negotiation";

export type {
  RenderIntent,
  ProviderRequest,
  ProviderResponse,
  ProviderMetadata,
  ProviderCapabilities,
  ProviderId,
  RenderAdapter,
  CompiledProviderRequest,
  ProviderRenderFn,
  RenderPipelineOptions,
  RenderPipelineResult,
  NegotiatedFields,
} from "./render-pipeline-types";

export { DEFAULT_FALLBACK_CHAIN } from "./render-pipeline-types";

const GENERATOR_TO_PROVIDER: Record<RenderGeneratorId, ProviderId> = {
  flux: "flux",
  "gpt-image": "gpt-image",
  imagen: "imagen",
};

export class RenderPipeline {
  private readonly adapters = new Map<ProviderId, RenderAdapter>();
  private readonly fallbackChain: readonly ProviderId[];

  constructor(options: RenderPipelineOptions = {}) {
    this.fallbackChain = options.fallbackChain ?? DEFAULT_FALLBACK_CHAIN;
    for (const adapter of [
      new FluxRenderAdapter(options.renderFn),
      new GptImageRenderAdapter(options.renderFn),
      new SdxlRenderAdapter(options.renderFn),
      new PollinationsRenderAdapter(options.renderFn),
    ]) {
      this.adapters.set(adapter.provider, adapter);
    }
  }

  registerAdapter(adapter: RenderAdapter): void {
    this.adapters.set(adapter.provider, adapter);
  }

  getAdapter(provider: ProviderId): RenderAdapter | undefined {
    return this.adapters.get(provider);
  }

  resolveProvider(blueprint: Readonly<RenderBlueprint>): ProviderId {
    const fromGenerator = GENERATOR_TO_PROVIDER[blueprint.meta.generator];
    const fromRender = blueprint.render.provider as ProviderId;
    if (this.adapters.has(fromRender)) return fromRender;
    if (this.adapters.has(fromGenerator)) return fromGenerator;
    return "flux";
  }

  compile(
    blueprint: Readonly<RenderBlueprint>,
    provider?: ProviderId,
  ): CompiledProviderRequest {
    const p = provider ?? this.resolveProvider(blueprint);
    const adapter = this.adapters.get(p);
    if (!adapter) {
      throw new RenderPipelineError(`No adapter registered for provider ${p}`);
    }
    return adapter.compile(blueprint);
  }

  async render(
    blueprint: Readonly<RenderBlueprint>,
    provider?: ProviderId,
  ): Promise<RenderPipelineResult> {
    const p = provider ?? this.resolveProvider(blueprint);
    const adapter = this.adapters.get(p);
    if (!adapter) throw new RenderPipelineError(`No adapter for ${p}`);
    const request = adapter.compile(blueprint);
    const response = await adapter.render(request);
    return { request, response, adapterId: adapter.id, provider: p };
  }

  async renderWithFallback(
    blueprint: Readonly<RenderBlueprint>,
    startProvider?: ProviderId,
  ): Promise<RenderPipelineResult> {
    const chain = startProvider
      ? [startProvider, ...this.fallbackChain.filter((p) => p !== startProvider)]
      : this.fallbackChain;

    let lastError: Error | undefined;
    for (const provider of chain) {
      const adapter = this.adapters.get(provider);
      if (!adapter) continue;
      try {
        const request = adapter.compile(blueprint);
        const response = await adapter.render(request);
        if (response.success) {
          return { request, response, adapterId: adapter.id, provider };
        }
        lastError = new RenderPipelineError(`Provider ${provider} returned failure`);
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e));
      }
    }
    throw lastError ?? new RenderPipelineError("All providers in fallback chain failed");
  }
}

/** Chapter 4 bridge — compile only, output never stored in blueprint */
export function compileFluxAdapterOutput(
  blueprint: Readonly<RenderBlueprint>,
): FluxAdapterOutput {
  assertReadyForAdapter(blueprint);
  const pipeline = new RenderPipeline();
  const request = pipeline.compile(blueprint, "flux");
  return {
    prompt: request.prompt,
    negativePrompt: request.negativePrompt,
    generator: blueprint.meta.generator,
    compiledAt: request.compiledAt,
  };
}

export function toProviderRequest(
  compiled: CompiledProviderRequest,
): ProviderRequest {
  const { intent: _i, negotiated: _n, compiledAt: _c, ...request } = compiled;
  return request;
}

export const defaultRenderPipeline = new RenderPipeline();
