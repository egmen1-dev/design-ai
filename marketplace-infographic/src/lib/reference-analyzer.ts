import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { promisify } from "node:util";
import potrace from "potrace";
import sharp from "sharp";
import { createWorker } from "tesseract.js";
import { removeProductBackgroundImgly } from "@/lib/imgly-background";

const potraceTrace = promisify(potrace.trace) as (
  input: Buffer,
  options?: { threshold?: number; turdSize?: number; optTolerance?: number },
) => Promise<string>;

export function referencesDir(): string {
  return path.join(process.cwd(), "public", "references");
}

export function publicReferenceUrl(filename: string): string {
  return `/references/${filename}`;
}

export type BadgeExtractionResult = {
  pngUrl: string;
  svgUrl: string;
};

export type FontDetectionResult = {
  text: string;
  fontName: string | null;
};

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
    });

    if (!formResponse.ok) return null;

    const formData = (await formResponse.json()) as unknown;
    return parseWhatTheFontResponse(formData);
  } catch (error) {
    console.warn("WhatTheFont identification failed:", error);
    return null;
  }
}

async function recognizeText(imagePath: string): Promise<string> {
  const worker = await createWorker("rus+eng");
  try {
    const { data } = await worker.recognize(imagePath);
    return data.text.replace(/\s+/g, " ").trim();
  } finally {
    await worker.terminate();
  }
}

export async function extractBadgeFromImage(
  imagePath: string,
  outputBasename: string,
): Promise<BadgeExtractionResult> {
  const inputBuffer = await readFile(imagePath);
  const { buffer: cutout } = await removeProductBackgroundImgly(inputBuffer);

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
  const imageBuffer = await readFile(imagePath);
  const [text, fontName] = await Promise.all([
    recognizeText(imagePath),
    identifyFontWithWhatTheFont(imageBuffer),
  ]);

  return {
    text,
    fontName,
  };
}

export function suggestGoogleFontCss(fontName: string): {
  cssImport: string;
  fontFamily: string;
} {
  const family = fontName.trim();
  const query = family.replace(/\s+/g, "+");
  return {
    cssImport: `<link href="https://fonts.googleapis.com/css2?family=${query}:wght@400;600;700&display=swap" rel="stylesheet">`,
    fontFamily: `'${family}', sans-serif`,
  };
}

export function buildDraftBadgeHtml(pngUrl: string): string {
  return `<div class="library-badge-ref" style="color:{{color}}"><img src="${pngUrl}" alt="{{text}}" /></div>`;
}
