/**
 * Chapter 3.11 / 4.17 — Render Adapters (stateless translators)
 */
import type { RenderBlueprint } from "./types";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { BlueprintLifecycle } from "./lifecycle-types";
import {
  runRenderAdapter,
  RENDER_ADAPTER_VERSION,
} from "./render-adapter-engine";
import { getProviderCapabilities } from "./provider-capabilities";
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

function buildRequest(
  blueprint: Readonly<RenderBlueprint>,
  provider: ProviderId,
  adapterId: string,
): CompiledProviderRequest {
  const { compiled } = runRenderAdapter({
    blueprint,
    context: {
      providerId: provider,
      quality: blueprint.render.quality,
      aspectRatio: blueprint.render.aspectRatio,
      seed: blueprint.meta.seed,
    },
  });

  return {
    ...compiled,
    providerOptions: {
      ...compiled.providerOptions,
      adapterId,
      adapterVersion: RENDER_ADAPTER_VERSION,
    },
  };
}

abstract class BaseRenderAdapter implements RenderAdapter {
  abstract readonly id: string;
  abstract readonly provider: ProviderId;
  readonly adapterVersion = RENDER_ADAPTER_VERSION;
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
