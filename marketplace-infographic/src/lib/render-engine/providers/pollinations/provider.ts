import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import sharp from "sharp";
import type {
  CompiledRenderPayload,
  ProviderCapabilities,
  ProviderHealth,
  ProviderPricing,
  RenderProviderOptions,
  RenderResult,
  RenderingProvider,
  RenderModelId,
} from "../../types";
import { RENDER_ENGINE_CONFIG } from "../../config";
import { WB_COVER } from "@/lib/composition/canvas";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildImageUrl(payload: CompiledRenderPayload): string {
  const base = RENDER_ENGINE_CONFIG.pollinations.baseUrl;
  const encoded = encodeURIComponent(payload.prompt.slice(0, 2000));
  const params = new URLSearchParams();
  params.set("model", payload.model);
  params.set("width", String(payload.width));
  params.set("height", String(payload.height));
  if (payload.seed != null) params.set("seed", String(payload.seed));
  if (payload.negativePrompt) params.set("negative", payload.negativePrompt.slice(0, 500));
  if (payload.referenceImageUrl) params.set("image", payload.referenceImageUrl);
  const key = RENDER_ENGINE_CONFIG.pollinations.apiKey;
  if (key) params.set("key", key);
  for (const [k, v] of Object.entries(payload.extraParams ?? {})) {
    if (v !== undefined && v !== null) params.set(k, String(v));
  }
  return `${base}/image/${encoded}?${params.toString()}`;
}

async function saveBackground(buffer: Buffer, promptHash: string): Promise<string> {
  const normalized = await sharp(buffer)
    .resize(WB_COVER.width, WB_COVER.height, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
  const dir = path.join(process.cwd(), "public", "backgrounds");
  await mkdir(dir, { recursive: true });
  const filename = `v17-${promptHash.slice(0, 16)}-${Date.now()}.png`;
  await writeFile(path.join(dir, filename), normalized);
  return `/backgrounds/${filename}`;
}

export class PollinationsProvider implements RenderingProvider {
  readonly id = "pollinations" as const;

  capabilities(): ProviderCapabilities {
    return {
      negativePrompt: true,
      aspectRatio: true,
      seed: true,
      imageInput: true,
      models: ["flux", "kontext", "gptimage", "seedream"],
    };
  }

  pricing(): ProviderPricing {
    return {
      currency: "USD",
      estimatedCostPerImage: RENDER_ENGINE_CONFIG.pollinations.apiKey ? 0.02 : 0,
      freeTier: !RENDER_ENGINE_CONFIG.pollinations.apiKey,
    };
  }

  supportsNegativePrompt() {
    return true;
  }
  supportsAspectRatio() {
    return true;
  }
  supportsSeed() {
    return true;
  }
  supportsImageInput() {
    return true;
  }

  async health(): Promise<ProviderHealth> {
    const start = Date.now();
    try {
      const url = `${RENDER_ENGINE_CONFIG.pollinations.baseUrl}/image/models`;
      const headers: Record<string, string> = {};
      const key = RENDER_ENGINE_CONFIG.pollinations.apiKey;
      if (key) headers.Authorization = `Bearer ${key}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10_000), headers });
      return {
        ok: res.ok,
        latencyMs: Date.now() - start,
        message: res.ok ? "pollinations ok" : `status ${res.status}`,
      };
    } catch (e) {
      return {
        ok: false,
        latencyMs: Date.now() - start,
        message: e instanceof Error ? e.message : "health check failed",
      };
    }
  }

  async render(
    payload: CompiledRenderPayload,
    options?: RenderProviderOptions,
  ): Promise<RenderResult> {
    const maxAttempts = options?.maxAttempts ?? RENDER_ENGINE_CONFIG.pollinations.maxAttempts;
    const timeoutMs = options?.timeoutMs ?? RENDER_ENGINE_CONFIG.pollinations.timeoutMs;
    const seed =
      payload.seed ??
      createHash("sha256")
        .update(options?.seedSuffix ?? `${Date.now()}`)
        .digest()
        .readUInt32BE(0);

    const compiled: CompiledRenderPayload = { ...payload, seed };
    const url = buildImageUrl(compiled);
    const headers: Record<string, string> = {};
    const key = RENDER_ENGINE_CONFIG.pollinations.apiKey;
    if (key) headers.Authorization = `Bearer ${key}`;

    const start = Date.now();
    let lastError = "pollinations error";

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (Date.now() - start > timeoutMs) break;
      try {
        const res = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(60_000),
        });
        if (res.status === 429 || res.status === 503) {
          await sleep(3000 * (attempt + 1));
          continue;
        }
        if (!res.ok) {
          lastError = await res.text();
          continue;
        }
        const buffer = Buffer.from(await res.arrayBuffer());
        if (buffer.length < 100) throw new Error("empty image");
        const promptHash = createHash("sha256").update(compiled.prompt).digest("hex");
        const imageUrl = await saveBackground(buffer, promptHash);
        return {
          imageBuffer: buffer,
          imageUrl,
          providerId: "pollinations",
          modelId: payload.model as RenderModelId,
          seed,
          latencyMs: Date.now() - start,
          compiled,
        };
      } catch (e) {
        lastError = e instanceof Error ? e.message : String(e);
        await sleep(2000 * (attempt + 1));
      }
    }
    throw new Error(`Pollinations render failed: ${lastError.slice(0, 200)}`);
  }
}
