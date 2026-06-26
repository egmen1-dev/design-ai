import sharp from "sharp";
import type { SceneLightingProfile, Rgb } from "./scene-analysis";

export type ColorMatchProfile = {
  whiteBalanceShift: { r: number; g: number; b: number };
  gamma: number;
  saturation: number;
  vibrance: number;
  localContrast: number;
  lift: number;
  gain: number;
};

function rgbDistance(a: Rgb, b: Rgb): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

function computeColorProfile(
  sceneAvg: Rgb,
  productAvg: Rgb,
  lighting: SceneLightingProfile,
): ColorMatchProfile {
  const dist = rgbDistance(sceneAvg, productAvg);
  const blend = Math.min(0.45, dist / 440);

  return {
    whiteBalanceShift: {
      r: Math.round((sceneAvg.r - productAvg.r) * blend * 0.35),
      g: Math.round((sceneAvg.g - productAvg.g) * blend * 0.25),
      b: Math.round((sceneAvg.b - productAvg.b) * blend * 0.35),
    },
    gamma: lighting.contrast > 0.14 ? 1.03 : 1.0,
    saturation: lighting.warmth > 0.1 ? 1.04 : lighting.warmth < -0.1 ? 0.96 : 1.0,
    vibrance: 1 + blend * 0.08,
    localContrast: 1 + lighting.contrast * 0.25,
    lift: lighting.brightness < 0.45 ? 4 : 0,
    gain: lighting.brightness > 0.65 ? 1.04 : 1.0,
  };
}

async function averageProductRgb(buffer: Buffer): Promise<Rgb> {
  const { data, info } = await sharp(buffer)
    .resize(48, 48, { fit: "inside" })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    const alpha = info.channels === 4 ? data[i + 3] : 255;
    if (alpha < 24) continue;
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
    count++;
  }
  if (count === 0) return { r: 128, g: 128, b: 128 };
  return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
}

/** Цветовая гармонизация товара со сценой */
export async function matchColorToScene(
  productBuffer: Buffer,
  sceneBuffer: Buffer,
  lighting: SceneLightingProfile,
): Promise<Buffer> {
  const [sceneAvg, productAvg] = await Promise.all([
    (async () => {
      const { data, info } = await sharp(sceneBuffer)
        .resize(64, 64, { fit: "cover" })
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
    })(),
    averageProductRgb(productBuffer),
  ]);

  const profile = computeColorProfile(sceneAvg, productAvg, lighting);
  const { whiteBalanceShift: wb, gamma, saturation, vibrance, localContrast, lift, gain } =
    profile;

  let pipeline = sharp(productBuffer)
    .ensureAlpha()
    .gamma(gamma)
    .modulate({
      brightness: gain,
      saturation: saturation * vibrance,
    })
    .linear(localContrast, lift);

  const adjusted = await pipeline.png().toBuffer();

  if (Math.abs(wb.r) + Math.abs(wb.g) + Math.abs(wb.b) < 6) {
    return adjusted;
  }

  return sharp(adjusted)
    .recomb([
      [1 + wb.r / 512, wb.g / 1024, wb.b / 1024],
      [wb.r / 1024, 1 + wb.g / 512, wb.b / 1024],
      [wb.r / 1024, wb.g / 1024, 1 + wb.b / 512],
    ])
    .png()
    .toBuffer();
}

/** @deprecated используйте matchColorToScene */
export { matchColorToScene as matchProductToBackgroundEnhanced };
