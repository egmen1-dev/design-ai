import type {
  CompiledRenderPayload,
  ProviderCapabilities,
  ProviderHealth,
  ProviderPricing,
  RenderProviderOptions,
  RenderResult,
  RenderingProvider,
} from "../../types";
import { generateBackground, backgroundToDataUrl } from "@/lib/stable-diffusion";
import { readFile } from "fs/promises";
import path from "path";

/** Legacy HuggingFace FLUX provider — v16 path behind adapter interface */
export class HuggingFaceProvider implements RenderingProvider {
  readonly id = "huggingface" as const;

  capabilities(): ProviderCapabilities {
    return {
      negativePrompt: false,
      aspectRatio: true,
      seed: true,
      imageInput: false,
      models: ["flux"],
    };
  }

  pricing(): ProviderPricing {
    return { currency: "USD", estimatedCostPerImage: 0.03, freeTier: false };
  }

  supportsNegativePrompt() {
    return false;
  }
  supportsAspectRatio() {
    return true;
  }
  supportsSeed() {
    return true;
  }
  supportsImageInput() {
    return false;
  }

  async health(): Promise<ProviderHealth> {
    const ok = !!process.env.HF_API_KEY;
    return { ok, message: ok ? "HF_API_KEY set" : "HF_API_KEY missing" };
  }

  async render(
    payload: CompiledRenderPayload,
    options?: RenderProviderOptions,
  ): Promise<RenderResult> {
    const start = Date.now();
    const url = await generateBackground(payload.prompt, {
      seedSuffix: options?.seedSuffix,
    });
    const rel = url.startsWith("/") ? url.slice(1) : url;
    const abs = path.join(process.cwd(), "public", rel);
    const imageBuffer = await readFile(abs);
    await backgroundToDataUrl(url);
    return {
      imageBuffer,
      imageUrl: url,
      providerId: "huggingface",
      modelId: "flux",
      seed: payload.seed,
      latencyMs: Date.now() - start,
      compiled: payload,
    };
  }
}
