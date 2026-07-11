import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export async function sha256File(filePath: string): Promise<string> {
  const buf = await fs.readFile(filePath);
  return createHash("sha256").update(buf).digest("hex");
}

export async function sha256Buffer(buf: Buffer): Promise<string> {
  return createHash("sha256").update(buf).digest("hex");
}

export type ImageDiffMetrics = {
  identical: boolean;
  meanAbsDiff: number;
  changedPixelPct: number;
  hashA: string;
  hashB: string;
};

/** Pixel diff on resized RGB buffers (0–255 mean absolute channel delta). */
export async function diffImages(
  pathA: string,
  pathB: string,
): Promise<ImageDiffMetrics> {
  const size = { width: 900, height: 1200 };
  const [a, b] = await Promise.all([
    sharp(pathA).resize(size.width, size.height).removeAlpha().raw().toBuffer(),
    sharp(pathB).resize(size.width, size.height).removeAlpha().raw().toBuffer(),
  ]);

  const hashA = createHash("sha256").update(a).digest("hex");
  const hashB = createHash("sha256").update(b).digest("hex");
  if (hashA === hashB) {
    return {
      identical: true,
      meanAbsDiff: 0,
      changedPixelPct: 0,
      hashA,
      hashB,
    };
  }

  let sum = 0;
  let changedPixels = 0;
  const pixels = size.width * size.height;
  for (let i = 0; i < a.length; i++) {
    const d = Math.abs(a[i]! - b[i]!);
    sum += d;
    if (d > 8) changedPixels++;
  }
  const channels = 3;
  const meanAbsDiff = sum / (a.length);
  const changedPixelPct = (changedPixels / (pixels * channels)) * 100;

  return {
    identical: false,
    meanAbsDiff: Math.round(meanAbsDiff * 100) / 100,
    changedPixelPct: Math.round(changedPixelPct * 100) / 100,
    hashA,
    hashB,
  };
}

export async function saveBackgroundBuffer(
  buffer: Buffer,
  outDir: string,
  filename: string,
): Promise<string> {
  await fs.mkdir(outDir, { recursive: true });
  const filePath = path.join(outDir, filename);
  await fs.writeFile(filePath, buffer);
  return filePath;
}
