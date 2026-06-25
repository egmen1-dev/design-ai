import { createHash } from "crypto";
import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";

const HF_MODEL =
  process.env.HF_SD_MODEL ??
  "black-forest-labs/FLUX.1-schnell";
const HF_INFERENCE_BASE =
  process.env.HF_INFERENCE_BASE_URL?.replace(/\/$/, "") ??
  "https://router.huggingface.co/hf-inference";
const HF_API_URL = `${HF_INFERENCE_BASE}/models/${HF_MODEL}`;
const MAX_ATTEMPTS = 12;
const POLL_MS = 5_000;

function hashPrompt(prompt: string): string {
  return createHash("sha256").update(prompt.trim().toLowerCase()).digest("hex");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeBackgroundPrompt(prompt: string): string {
  const base = prompt.trim();
  const noText =
    "no text, no words, no letters, no typography, no watermark, no logo, no captions";
  if (/no text|no words|no letters/i.test(base)) return base;
  return `${base}, ${noText}`;
}

async function requestHfImage(prompt: string): Promise<Buffer> {
  const apiKey = process.env.HF_API_KEY;
  if (!apiKey) {
    throw new Error("HF_API_KEY is not configured");
  }

  let lastError = "HF API error";

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const response = await fetch(HF_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: sanitizeBackgroundPrompt(prompt),
        parameters: { width: 1024, height: 1024 },
      }),
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

async function saveBackground(buffer: Buffer, promptHash: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "backgrounds");
  await mkdir(dir, { recursive: true });
  const filename = `${promptHash.slice(0, 16)}-${Date.now()}.png`;
  const absPath = path.join(dir, filename);
  await writeFile(absPath, buffer);
  return `/backgrounds/${filename}`;
}

export async function getCachedBackground(promptHash: string): Promise<string | null> {
  const cached = await prisma.backgroundCache.findUnique({
    where: { promptHash },
  });
  if (!cached) return null;

  const absPath = path.join(process.cwd(), "public", cached.imageUrl.replace(/^\//, ""));
  try {
    await readFile(absPath);
    return cached.imageUrl;
  } catch {
    await prisma.backgroundCache.delete({ where: { promptHash } }).catch(() => undefined);
    return null;
  }
}

export type GenerateBackgroundOptions = {
  /** Пропустить кэш (перегенерация фона) */
  skipCache?: boolean;
  /** Уникальный суффикс — каждая генерация получает новый фон */
  seedSuffix?: string;
  /** Стиль слайда — влияет на ключ кэша */
  style?: string;
};

/** Генерирует фон через Stable Diffusion (HF) с кэшем по хэшу промпта+стиля+seed */
export async function generateBackground(
  prompt: string,
  options?: GenerateBackgroundOptions,
): Promise<string> {
  const variation =
    options?.seedSuffix ??
    `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const stylePart = options?.style ? `style:${options.style}` : "style:modern";
  const promptKey = `${prompt}::${stylePart}::${variation}`;
  const promptHash = hashPrompt(promptKey);

  if (!options?.skipCache) {
    const cached = await getCachedBackground(promptHash);
    if (cached) return cached;
  }

  const buffer = await requestHfImage(prompt);
  const imageUrl = await saveBackground(buffer, promptHash);

  await prisma.backgroundCache.upsert({
    where: { promptHash },
    create: { promptHash, imageUrl },
    update: { imageUrl },
  });

  return imageUrl;
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
