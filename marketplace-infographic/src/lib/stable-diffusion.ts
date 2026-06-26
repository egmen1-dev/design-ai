import { createHash } from "crypto";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { InfographicStyle } from "@/lib/design-trends";
import { WB_COVER } from "@/lib/composition/canvas";
import {
  enrichBackgroundPrompt,
  seedToNumber,
} from "@/lib/style-background-prompt";

const HF_MODEL =
  process.env.HF_SD_MODEL ??
  "black-forest-labs/FLUX.1-schnell";
const HF_INFERENCE_BASE =
  process.env.HF_INFERENCE_BASE_URL?.replace(/\/$/, "") ??
  "https://router.huggingface.co/hf-inference";
const HF_API_URL = `${HF_INFERENCE_BASE}/models/${HF_MODEL}`;
const MAX_ATTEMPTS = 6;
const POLL_MS = 4_000;
const HF_TOTAL_TIMEOUT_MS = 180_000;

function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt.trim().toLowerCase()).digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

import { stripProductFromBackgroundPrompt } from "@/lib/product-render-policy";

function sanitizeBackgroundPrompt(prompt: string): string {
  const stripped = stripProductFromBackgroundPrompt(prompt.trim());
  const noProduct =
    "no text, no words, no letters, no typography, no watermark, no logo, no captions, no product, no trimmer, no garden tool, no equipment, no generator, no appliance, no machinery, no objects on grass, empty foreground, clear center, backdrop only";
  if (/no text|no words|no letters/i.test(stripped)) return stripped;
  return `${stripped}, ${noProduct}`;
}

async function requestHfImage(
  prompt: string,
  options?: { seed?: number },
): Promise<Buffer> {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    throw new Error("HF_API_KEY is not configured");
  }

  let lastError = "HF API error";
  const parameters: Record<string, number> = {
    width: 768,
    height: 1024,
  };
  if (options?.seed !== undefined) {
    parameters.seed = options.seed;
  }

  const deadline = Date.now() + HF_TOTAL_TIMEOUT_MS;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (Date.now() > deadline) {
      throw new Error(`HF API timeout: ${lastError}`);
    }

    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: sanitizeBackgroundPrompt(prompt),
        parameters,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    if (response.status === 503) {
      const body = (await response.json().catch(() => ({}))) as {
        estimated_time?: number;
        error?: string;
      };
      const waitMs = body.estimated_time
        ? Math.min(body.estimated_time * 1000, 30_000)
        : POLL_MS;
      await sleep(waitMs);
      continue;
    }

    if (!response.ok) {
      lastError = await response.text();
      if (response.status === 429) {
        await sleep(POLL_MS * (attempt + 1));
        continue;
      }
      throw new Error(`HF API ${response.status}: ${lastError.slice(0, 200)}`);
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const json = (await response.json()) as { error?: string; estimated_time?: number };
      if (json.estimated_time) {
        await sleep(Math.min(json.estimated_time * 1000, 30_000));
        continue;
      }
      throw new Error(json.error ?? "HF returned JSON instead of image");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length < 100) {
      throw new Error("HF returned empty image");
    }
    return buffer;
  }

  throw new Error(`HF API timeout: ${lastError}`);
}

async function normalizeToWbCover(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .resize(WB_COVER.width, WB_COVER.height, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
}

async function saveBackground(buffer: Buffer, promptHash: string): Promise<string> {
  const normalized = await normalizeToWbCover(buffer);
  const dir = path.join(process.cwd(), "public", "backgrounds");
  await mkdir(dir, { recursive: true });
  const filename = `${promptHash.slice(0, 16)}-${Date.now()}.png`;
  const absPath = path.join(dir, filename);
  await writeFile(absPath, normalized);
  return `/backgrounds/${filename}`;
}

export type GenerateBackgroundOptions = {
  /** Уникальный суффикс — каждая генерация получает новый фон */
  seedSuffix?: string;
  /** Стиль слайда — влияет на промпт и seed */
  style?: InfographicStyle;
};

/** Генерирует фон через Stable Diffusion (HF). Кэш отключён — каждый запрос уникален. */
export async function generateBackground(
  prompt: string,
  options?: GenerateBackgroundOptions,
): Promise<string> {
  const variation =
    options?.seedSuffix ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const style = options?.style ?? "modern";
  const enrichedPrompt = enrichBackgroundPrompt(prompt, style, variation);
  const seed = seedToNumber(`${style}:${variation}`);
  const promptHash = hashPrompt(`${enrichedPrompt}::${variation}`);

  const buffer = await requestHfImage(enrichedPrompt, { seed });
  return saveBackground(buffer, promptHash);
}

export async function backgroundToDataUrl(imageUrl: string): Promise<string> {
  const rel = imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl;
  const absPath = path.join(process.cwd(), "public", rel);
  const buffer = await readFile(absPath);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

export function buildFallbackGradient(colors: string[]): string {
  const [c0 = "#0f172a", c1 = "#1e293b", c2 = "#334155"] = colors;
  return `linear-gradient(145deg, ${c0} 0%, ${c1} 45%, ${c2} 100%)`;
}
