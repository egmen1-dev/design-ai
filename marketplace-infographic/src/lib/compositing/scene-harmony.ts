import sharp from "sharp";
import type { Rgb } from "./scene-analysis";

/** Лёгкая цветовая унификация всего кадра — товар и фон как одно фото */
export async function applySceneHarmony(
  mergedBuffer: Buffer,
  sceneTint?: Rgb,
  warmth = 0,
): Promise<Buffer> {
  const meta = await sharp(mergedBuffer).metadata();
  const w = meta.width ?? 900;
  const h = meta.height ?? 1200;

  const tint = sceneTint ?? { r: 128, g: 126, b: 124 };
  const warmShift = Math.round(warmth * 12);

  const gradeSvg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="v" x1="0.5" y1="0" x2="0.5" y2="1">
          <stop offset="0%" stop-color="rgb(${tint.r + warmShift},${tint.g},${tint.b - warmShift})" stop-opacity="0.06"/>
          <stop offset="55%" stop-color="rgb(${tint.r},${tint.g},${tint.b})" stop-opacity="0.03"/>
          <stop offset="100%" stop-color="rgb(${Math.max(0, tint.r - 8)},${Math.max(0, tint.g - 6)},${tint.b})" stop-opacity="0.08"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#v)"/>
    </svg>`;

  const graded = await sharp(mergedBuffer)
    .modulate({ saturation: 1.04, brightness: 1.01 })
    .linear(1.03, -4)
    .composite([{ input: Buffer.from(gradeSvg), blend: "soft-light" }])
    .png()
    .toBuffer();

  return sharp(graded).sharpen({ sigma: 0.35, m1: 0.5, m2: 0.25 }).png().toBuffer();
}

/** Мягкое «вплетение» краёв cutout в фон */
export async function softenProductEdges(
  productBuffer: Buffer,
  featherPx = 1.2,
): Promise<Buffer> {
  const meta = await sharp(productBuffer).metadata();
  const w = meta.width ?? 400;
  const h = meta.height ?? 400;

  const mask = await sharp(productBuffer)
    .ensureAlpha()
    .extractChannel("alpha")
    .blur(featherPx)
    .toBuffer();

  return sharp(productBuffer)
    .ensureAlpha()
    .joinChannel(mask)
    .png()
    .toBuffer();
}
