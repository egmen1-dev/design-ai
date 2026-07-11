/**
 * Attention heatmap — edge-saliency proxy (benchmark/research only).
 * Red = high visual attention · Blue = low
 */
import sharp from "sharp";
import { WB_COVER } from "@/lib/composition/canvas";

const W = WB_COVER.width;
const H = WB_COVER.height;

function colormap(t: number): [number, number, number] {
  const x = Math.max(0, Math.min(1, t));
  if (x < 0.25) {
    const u = x / 0.25;
    return [Math.round(20 + u * 30), Math.round(30 + u * 80), Math.round(80 + u * 120)];
  }
  if (x < 0.5) {
    const u = (x - 0.25) / 0.25;
    return [Math.round(50 + u * 40), Math.round(110 + u * 100), Math.round(200 - u * 80)];
  }
  if (x < 0.75) {
    const u = (x - 0.5) / 0.25;
    return [Math.round(90 + u * 120), Math.round(210 - u * 40), Math.round(120 - u * 100)];
  }
  const u = (x - 0.75) / 0.25;
  return [Math.round(210 + u * 45), Math.round(170 - u * 100), Math.round(20 + u * 30)];
}

export async function computeSaliencyGrid(imagePath: string): Promise<Float32Array> {
  const { data, info } = await sharp(imagePath)
    .resize(W, H, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels;
  const pixels = W * H;
  const lum = new Float32Array(pixels);
  const sal = new Float32Array(pixels);

  for (let i = 0; i < pixels; i++) {
    const idx = i * ch;
    lum[i] = 0.2126 * data[idx]! + 0.7152 * data[idx + 1]! + 0.0722 * data[idx + 2]!;
  }

  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      const gx =
        -lum[i - W - 1]! - 2 * lum[i - 1]! - lum[i + W - 1]! +
        lum[i - W + 1]! + 2 * lum[i + 1]! + lum[i + W + 1]!;
      const gy =
        -lum[i - W - 1]! - 2 * lum[i - W]! - lum[i - W + 1]! +
        lum[i + W - 1]! + 2 * lum[i + W]! + lum[i + W + 1]!;
      sal[i] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  let max = 0;
  for (let i = 0; i < pixels; i++) {
    if (sal[i]! > max) max = sal[i]!;
  }
  const norm = max > 0 ? max : 1;
  for (let i = 0; i < pixels; i++) sal[i] = sal[i]! / norm;

  return sal;
}

function gridToHeatmapBuffer(grid: Float32Array, blurSigma = 1.8): Buffer {
  const pixels = W * H;
  const raw = Buffer.alloc(pixels * 3);
  for (let i = 0; i < pixels; i++) {
    const [r, g, b] = colormap(grid[i]!);
    raw[i * 3] = r;
    raw[i * 3 + 1] = g;
    raw[i * 3 + 2] = b;
  }
  return sharp(raw, { raw: { width: W, height: H, channels: 3 } })
    .blur(blurSigma)
    .png()
    .toBuffer();
}

export async function renderAttentionHeatmap(input: {
  imagePath: string;
  outHeatmap: string;
  outOverlay?: string;
}): Promise<{ grid: Float32Array; peakX: number; peakY: number }> {
  const grid = await computeSaliencyGrid(input.imagePath);
  const heatBuf = await gridToHeatmapBuffer(grid);
  await sharp(heatBuf).png().toFile(input.outHeatmap);

  if (input.outOverlay) {
    const base = await sharp(input.imagePath).resize(W, H, { fit: "fill" }).png().toBuffer();
    await sharp(base)
      .composite([{ input: heatBuf, blend: "overlay" }])
      .png()
      .toFile(input.outOverlay);
  }

  let peak = 0;
  let peakIdx = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]! > peak) {
      peak = grid[i]!;
      peakIdx = i;
    }
  }
  return {
    grid,
    peakX: Number(((peakIdx % W) / W).toFixed(3)),
    peakY: Number((Math.floor(peakIdx / W) / H).toFixed(3)),
  };
}

export async function renderAttentionDiffHeatmap(input: {
  beforePath: string;
  afterPath: string;
  outPath: string;
}): Promise<void> {
  const before = await computeSaliencyGrid(input.beforePath);
  const after = await computeSaliencyGrid(input.afterPath);
  const pixels = W * H;
  const raw = Buffer.alloc(pixels * 3);

  for (let i = 0; i < pixels; i++) {
    const delta = (after[i]! - before[i]!) * 2 + 0.5;
    const t = Math.max(0, Math.min(1, delta));
    if (t < 0.5) {
      const u = t / 0.5;
      raw[i * 3] = Math.round(30 + u * 40);
      raw[i * 3 + 1] = Math.round(60 + u * 80);
      raw[i * 3 + 2] = Math.round(180 - u * 40);
    } else {
      const u = (t - 0.5) / 0.5;
      raw[i * 3] = Math.round(70 + u * 185);
      raw[i * 3 + 1] = Math.round(140 - u * 100);
      raw[i * 3 + 2] = Math.round(140 - u * 120);
    }
  }

  await sharp(raw, { raw: { width: W, height: H, channels: 3 } })
    .blur(1.2)
    .png()
    .toFile(input.outPath);
}

export async function renderAggregateHeatmap(input: {
  imagePaths: string[];
  outPath: string;
  label?: string;
}): Promise<{ peakX: number; peakY: number }> {
  const pixels = W * H;
  const sum = new Float32Array(pixels);
  let count = 0;

  for (const p of input.imagePaths) {
    try {
      const g = await computeSaliencyGrid(p);
      for (let i = 0; i < pixels; i++) sum[i] += g[i]!;
      count++;
    } catch {
      /* skip */
    }
  }

  const avg = new Float32Array(pixels);
  for (let i = 0; i < pixels; i++) avg[i] = count ? sum[i]! / count : 0;

  const buf = await gridToHeatmapBuffer(avg, 2.5);
  await sharp(buf).png().toFile(input.outPath);

  let peak = 0;
  let peakIdx = 0;
  for (let i = 0; i < pixels; i++) {
    if (avg[i]! > peak) {
      peak = avg[i]!;
      peakIdx = i;
    }
  }
  return {
    peakX: Number(((peakIdx % W) / W).toFixed(3)),
    peakY: Number((Math.floor(peakIdx / W) / H).toFixed(3)),
  };
}
