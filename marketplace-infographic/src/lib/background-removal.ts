import { execFile } from "child_process";
import { mkdtemp, readFile, unlink, writeFile } from "fs/promises";
import { tmpdir } from "os";
import path from "path";
import { promisify } from "util";
import sharp from "sharp";

const execFileAsync = promisify(execFile);

type Rgb = { r: number; g: number; b: number };

function colorDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number,
): number {
  return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function sampleBorderColor(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
): Rgb {
  const samples: Rgb[] = [];
  const step = Math.max(1, Math.floor(Math.min(width, height) / 40));

  for (let x = 0; x < width; x += step) {
    samples.push(readPixel(data, x, 0, width, channels));
    samples.push(readPixel(data, x, height - 1, width, channels));
  }
  for (let y = 0; y < height; y += step) {
    samples.push(readPixel(data, 0, y, width, channels));
    samples.push(readPixel(data, width - 1, y, width, channels));
  }

  samples.sort((a, b) => a.r + a.g + a.b - (b.r + b.g + b.b));
  const mid = samples[Math.floor(samples.length / 2)];
  return mid ?? { r: 255, g: 255, b: 255 };
}

function readPixel(
  data: Buffer,
  x: number,
  y: number,
  width: number,
  channels: number,
): Rgb {
  const i = (y * width + x) * channels;
  return { r: data[i], g: data[i + 1], b: data[i + 2] };
}

/** Лёгкая вырезка фона для референсов (без imgly/onnx). */
export async function removeReferenceBackgroundSharp(input: Buffer): Promise<Buffer> {
  return removeBackgroundWithSharp(input);
}

async function removeBackgroundWithSharp(input: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(input)
    .rotate()
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { width, height, channels } = info;
  const bg = sampleBorderColor(data, width, height, channels);
  const hardCutoff = 38;
  const softRange = 42;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * channels;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const dist = colorDistance(r, g, b, bg.r, bg.g, bg.b);

      if (dist < hardCutoff) {
        data[i + 3] = 0;
      } else if (dist < hardCutoff + softRange) {
        const alpha = Math.round(((dist - hardCutoff) / softRange) * 255);
        data[i + 3] = Math.min(data[i + 3], alpha);
      }
    }
  }

  const png = sharp(data, { raw: { width, height, channels: 4 } }).png();
  try {
    return await png.trim({ threshold: 12 }).toBuffer();
  } catch {
    return png.toBuffer();
  }
}

async function tryRembg(input: Buffer): Promise<Buffer | null> {
  if (process.env.PRODUCT_BG_REMBG === "0") return null;

  const dir = await mkdtemp(path.join(tmpdir(), "rembg-"));
  const inputPath = path.join(dir, "in.png");
  const outputPath = path.join(dir, "out.png");

  try {
    await writeFile(inputPath, input);
    await execFileAsync("rembg", ["i", inputPath, outputPath], {
      timeout: 90_000,
      maxBuffer: 20 * 1024 * 1024,
    });
    return await readFile(outputPath);
  } catch {
    return null;
  } finally {
    await unlink(inputPath).catch(() => undefined);
    await unlink(outputPath).catch(() => undefined);
  }
}

/** Удаляет фон с фото товара → PNG с прозрачностью */
export async function removeProductBackground(input: Buffer): Promise<Buffer> {
  const rembgResult = await tryRembg(input);
  if (rembgResult && rembgResult.length > 100) {
    try {
      return await sharp(rembgResult).png().trim({ threshold: 12 }).toBuffer();
    } catch {
      return sharp(rembgResult).png().toBuffer();
    }
  }
  return removeBackgroundWithSharp(input);
}

export function bufferToDataUrl(buffer: Buffer, mime = "image/png"): string {
  return `data:${mime};base64,${buffer.toString("base64")}`;
}

async function isValidCutout(buffer: Buffer): Promise<boolean> {
  try {
    const meta = await sharp(buffer).metadata();
    return Boolean(meta.width && meta.height && meta.width >= 80 && meta.height >= 80);
  } catch {
    return false;
  }
}

/** Быстрая вырезка без imgly/rembg — стабильно на VPS. */
export async function prepareProductImageFast(
  input: Buffer,
): Promise<{ buffer: Buffer; cutout: boolean }> {
  let cutoutBuffer = await removeBackgroundWithSharp(input);
  if (!(await isValidCutout(cutoutBuffer))) {
    cutoutBuffer = await sharp(input).rotate().png().toBuffer();
    return { buffer: cutoutBuffer, cutout: false };
  }

  const optimized = await sharp(cutoutBuffer)
    .resize(1100, 1100, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  return { buffer: optimized, cutout: true };
}

/** Полная вырезка (rembg + sharp) — для превью и регенерации фона. */
export async function prepareProductImageForRender(
  input: Buffer,
): Promise<{ buffer: Buffer; cutout: boolean }> {
  let cutoutBuffer = await removeProductBackground(input);
  if (!(await isValidCutout(cutoutBuffer))) {
    cutoutBuffer = await sharp(input).rotate().png().toBuffer();
    return { buffer: cutoutBuffer, cutout: false };
  }

  const optimized = await sharp(cutoutBuffer)
    .resize(1100, 1100, { fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  return { buffer: optimized, cutout: true };
}
