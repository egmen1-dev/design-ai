import sharp from "sharp";
import type { Rgb } from "./scene-analysis";

export type AlphaBounds = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
};

/** Находит bbox непрозрачных пикселей cutout (реальные «ноги» товара). */
export async function getAlphaBounds(productBuffer: Buffer): Promise<AlphaBounds | null> {
  const { data, info } = await sharp(productBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  let left = w;
  let top = h;
  let right = 0;
  let bottom = 0;
  let found = false;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = data[(y * w + x) * info.channels + (info.channels - 1)];
      if (alpha > 12) {
        found = true;
        if (x < left) left = x;
        if (x > right) right = x;
        if (y < top) top = y;
        if (y > bottom) bottom = y;
      }
    }
  }

  if (!found) return null;
  return { left, top, right, bottom, width: right - left + 1, height: bottom - top + 1 };
}

/** Y-координата самых нижних непрозрачных пикселей в нижней зоне cutout */
export async function getAlphaFootBottom(productBuffer: Buffer): Promise<number | null> {
  const bounds = await getAlphaBounds(productBuffer);
  if (!bounds) return null;

  const { data, info } = await sharp(productBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const scanTop = bounds.top + Math.round(bounds.height * 0.55);
  let footBottom = bounds.bottom;

  for (let y = scanTop; y <= bounds.bottom; y++) {
    for (let x = bounds.left; x <= bounds.right; x++) {
      const alpha = data[(y * w + x) * info.channels + (info.channels - 1)];
      if (alpha > 40) {
        footBottom = Math.max(footBottom, y);
      }
    }
  }

  return footBottom;
}

/** Оценивает линию пола по горизонтальному градиенту яркости в нижней части кадра. */
export async function detectFloorY(
  backgroundBuffer: Buffer,
  hint?: { left: number; width: number },
): Promise<number> {
  const meta = await sharp(backgroundBuffer).metadata();
  const w = meta.width ?? 900;
  const h = meta.height ?? 1200;

  const scanLeft = hint ? Math.max(0, hint.left) : Math.round(w * 0.15);
  const scanWidth = hint ? Math.min(w - scanLeft, hint.width) : Math.round(w * 0.7);
  const scanTop = Math.round(h * 0.5);
  const scanHeight = h - scanTop;

  const { data, info } = await sharp(backgroundBuffer)
    .extract({ left: scanLeft, top: scanTop, width: scanWidth, height: scanHeight })
    .resize(scanWidth, Math.min(scanHeight, 200), { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const rows = info.height;
  const cols = info.width;
  const rowLum: number[] = [];

  for (let y = 0; y < rows; y++) {
    let sum = 0;
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * info.channels;
      sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    }
    rowLum.push(sum / cols);
  }

  let bestY = Math.round(rows * 0.72);
  let bestGrad = 0;
  for (let y = 2; y < rows - 2; y++) {
    const grad = Math.abs(rowLum[y + 2] - rowLum[y - 2]);
    if (grad > bestGrad) {
      bestGrad = grad;
      bestY = y;
    }
  }

  const scale = scanHeight / rows;
  const detected = scanTop + Math.round(bestY * scale);

  if (bestGrad < 4) {
    return Math.round(h * 0.78);
  }

  return Math.min(h - 24, Math.max(Math.round(h * 0.68), detected));
}

export async function sampleFloorColor(
  backgroundBuffer: Buffer,
  centerX: number,
  floorY: number,
): Promise<Rgb> {
  const meta = await sharp(backgroundBuffer).metadata();
  const w = meta.width ?? 900;
  const h = meta.height ?? 1200;
  const left = Math.max(0, Math.min(w - 40, centerX - 20));
  const top = Math.max(0, Math.min(h - 12, floorY + 2));

  const { data, info } = await sharp(backgroundBuffer)
    .extract({ left, top, width: 40, height: 12 })
    .resize(8, 4, { fit: "fill" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let r = 0;
  let g = 0;
  let b = 0;
  const n = info.width * info.height;
  for (let i = 0; i < data.length; i += info.channels) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) };
}
