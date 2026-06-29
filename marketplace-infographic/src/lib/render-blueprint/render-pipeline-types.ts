/**
 * Chapter 3.11 — Render Pipeline Contract types
 */
import type { RenderBlueprint, RenderGeneratorId } from "./types";

export type ProviderId = RenderGeneratorId | "sdxl" | "pollinations";

export type ProviderCapabilities = {
  supportsNegativePrompt: boolean;
  supportsSeed: boolean;
  supportsCFG: boolean;
  supportsSteps: boolean;
  supportsAspectRatio: boolean;
  supportsReferenceImage: boolean;
  supportsJsonPrompt: boolean;
};

export type RenderIntent = {
  scene: RenderBlueprint["scene"];
  camera: RenderBlueprint["camera"];
  lighting: RenderBlueprint["lighting"];
  composition: RenderBlueprint["composition"];
  materials: RenderBlueprint["materials"];
  mood: string;
  background: RenderBlueprint["background"];
  constraints: RenderBlueprint["constraints"];
  photography: RenderBlueprint["photography"];
};

export type NegotiatedFields = {
  supported: string[];
  excluded: string[];
};

export type ProviderRequest = {
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  seed: number;
  steps: number;
  cfg: number;
  provider: ProviderId;
  providerOptions: Record<string, string | number | boolean>;
};

export type ProviderMetadata = {
  provider: string;
  model: string;
  seed: number;
  seedSupported: boolean;
  generationTimeMs: number;
  promptTokens: number;
  adapterVersion: string;
};

export type ProviderResponse = {
  success: boolean;
  image: string;
  provider: string;
  seed: number;
  metadata: ProviderMetadata;
};

export type CompiledProviderRequest = ProviderRequest & {
  intent: RenderIntent;
  negotiated: NegotiatedFields;
  compiledAt: number;
};

export type RenderAdapter = {
  readonly id: string;
  readonly provider: ProviderId;
  readonly capabilities: ProviderCapabilities;
  readonly adapterVersion: string;
  compile(blueprint: Readonly<RenderBlueprint>): CompiledProviderRequest;
  render(request: ProviderRequest): Promise<ProviderResponse>;
};

export type ProviderRenderFn = (request: ProviderRequest) => Promise<ProviderResponse>;

export const DEFAULT_FALLBACK_CHAIN: readonly ProviderId[] = [
  "flux",
  "gpt-image",
  "sdxl",
  "pollinations",
] as const;

export type RenderPipelineOptions = {
  fallbackChain?: readonly ProviderId[];
  renderFn?: ProviderRenderFn;
};

export type RenderPipelineResult = {
  request: CompiledProviderRequest;
  response?: ProviderResponse;
  adapterId: string;
  provider: ProviderId;
};
