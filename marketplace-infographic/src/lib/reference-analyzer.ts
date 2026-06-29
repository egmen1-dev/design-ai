import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { promisify } from "node:util";
import "server-only";
import potrace from "potrace";
import sharp from "sharp";
import { createWorker } from "tesseract.js";
import { removeReferenceBackgroundSharp } from "@/lib/background-removal";
import {
  publicReferenceUrl,
  referencesDir,
} from "@/lib/reference-storage";

export { publicReferenceUrl, referencesDir };

const potraceTrace = promisify(potrace.trace) as (
  input: Buffer,
  options?: { threshold?: number; turdSize?: number; optTolerance?: number },
) => Promise<string>;

export type BadgeExtractionResult = {
  pngUrl: string;
  svgUrl: string;
};

export type FontDetectionResult = {
  text: string;
  fontName: string | null;
};

const OCR_TIMEOUT_MS = 60_000;
const WHATTHEFONT_TIMEOUT_MS = 15_000;
const REFERENCE_MAX_EDGE = 1200;

async function loadReferenceImageBuffer(imagePath: string): Promise<Buffer> {
  const inputBuffer = await readFile(imagePath);
  return sharp(inputBuffer)
    .rotate()
    .resize(REFERENCE_MAX_EDGE, REFERENCE_MAX_EDGE, {
      fit: "inside",
      withoutEnlargement: true,
    })
    .png()
    .toBuffer();
}

function parseWhatTheFontResponse(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;

  const firstFont = Array.isArray(record.fonts) ? record.fonts[0] : null;
  const firstMatch = Array.isArray(record.matches) ? record.matches[0] : null;
  const firstResult = Array.isArray(record.results) ? record.results[0] : null;

  const candidates = [
    record.fontName,
    record.font_name,
    record.title,
    firstFont && typeof firstFont === "object"
      ? (firstFont as Record<string, unknown>).name ??
        (firstFont as Record<string, unknown>).fontName
      : null,
    firstMatch && typeof firstMatch === "object"
      ? (firstMatch as Record<string, unknown>).fontName ??
        (firstMatch as Record<string, unknown>).name
      : null,
    firstResult && typeof firstResult === "object"
      ? (firstResult as Record<string, unknown>).title ??
        (firstResult as Record<string, unknown>).name
      : null,
  ];

  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

async function identifyFontWithWhatTheFont(imageBuffer: Buffer): Promise<string | null> {
  const apiKey = process.env.WHATTHEFONT_API_KEY;
  if (!apiKey) return null;

  const endpoint =
    process.env.WHATTHEFONT_API_URL ??
    "https://api.monotype.com/whatthefont/v1/identify";

  try {
    const jsonResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "X-Api-Key": apiKey,
      },
      body: JSON.stringify({
        image: imageBuffer.toString("base64"),
        format: "png",
      }),
      signal: AbortSignal.timeout(WHATTHEFONT_TIMEOUT_MS),
    });

    if (jsonResponse.ok) {
      const data = (await jsonResponse.json()) as unknown;
      const fontName = parseWhatTheFontResponse(data);
      if (fontName) return fontName;
    }

    const form = new FormData();
    form.append("api_key", apiKey);
    form.append(
      "image",
      new Blob([new Uint8Array(imageBuffer)], { type: "image/png" }),
      "reference.png",
    );

    const formResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "X-Api-Key": apiKey,
      },
      body: form,
      signal: AbortSignal.timeout(WHATTHEFONT_TIMEOUT_MS),
    });

    if (!formResponse.ok) return null;

    const formData = (await formResponse.json()) as unknown;
    return parseWhatTheFontResponse(formData);
  } catch (error) {
    console.warn("WhatTheFont identification failed:", error);
    return null;
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms}ms`));
    }, ms);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

async function recognizeText(imageBuffer: Buffer): Promise<string> {
  const cachePath = path.join(process.cwd(), ".tesseract-cache");
  await mkdir(cachePath, { recursive: true });

  const ocrInput = await sharp(imageBuffer)
    .resize(1200, 1200, { fit: "inside", withoutEnlargement: true })
    .greyscale()
    .normalize()
    .sharpen()
    .png()
    .toBuffer();

  try {
    return await withTimeout(
      (async () => {
        const worker = await createWorker("rus+eng", undefined, {
          cachePath,
          logger: () => undefined,
        });
        try {
          const { data } = await worker.recognize(ocrInput);
          return data.text.replace(/\s+/g, " ").trim();
        } finally {
          await worker.terminate();
        }
      })(),
      OCR_TIMEOUT_MS,
      "Tesseract OCR",
    );
  } catch (error) {
    console.warn("Tesseract OCR failed:", error);
    return "";
  }
}

export async function extractBadgeFromImage(
  imagePath: string,
  outputBasename: string,
): Promise<BadgeExtractionResult> {
  const prepared = await loadReferenceImageBuffer(imagePath);
  const cutout = await removeReferenceBackgroundSharp(prepared);

  const dir = referencesDir();
  await mkdir(dir, { recursive: true });

  const pngFilename = `${outputBasename}-cutout.png`;
  const svgFilename = `${outputBasename}.svg`;
  const pngPath = path.join(dir, pngFilename);
  const svgPath = path.join(dir, svgFilename);

  await writeFile(pngPath, cutout);

  const traceBuffer = await sharp(cutout).greyscale().normalize().png().toBuffer();
  const svg = await potraceTrace(traceBuffer, {
    threshold: 128,
    turdSize: 2,
    optTolerance: 0.2,
  });
  await writeFile(svgPath, svg, "utf8");

  return {
    pngUrl: publicReferenceUrl(pngFilename),
    svgUrl: publicReferenceUrl(svgFilename),
  };
}

export async function detectFontFromImage(imagePath: string): Promise<FontDetectionResult> {
  const imageBuffer = await loadReferenceImageBuffer(imagePath);
  const text = await recognizeText(imageBuffer);
  const fontName = await identifyFontWithWhatTheFont(imageBuffer);

  return {
    text,
    fontName,
  };
}

export function buildDraftBadgeHtml(pngUrl: string): string {
  return `<div class="library-badge-ref" style="color:{{color}}"><img src="${pngUrl}" alt="{{text}}" /></div>`;
}
