import sharp from "sharp";

export type Rgb = { r: number; g: number; b: number };

export type SceneLightingProfile = {
  average: Rgb;
  brightness: number;
  contrast: number;
  warmth: number;
  direction: "left" | "right" | "top" | "top-left" | "top-right" | "ambient";
  temperatureKelvin: number;
};

async function regionAverage(
  buffer: Buffer,
  region: { left: number; top: number; width: number; height: number },
): Promise<Rgb> {
  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? 900;
  const h = meta.height ?? 1200;
  const left = Math.max(0, Math.min(w - 1, region.left));
  const top = Math.max(0, Math.min(h - 1, region.top));
  const width = Math.max(1, Math.min(w - left, region.width));
  const height = Math.max(1, Math.min(h - top, region.height));

  const { data, info } = await sharp(buffer)
    .extract({ left, top, width, height })
    .resize(32, 32, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let r = 0;
  let g = 0;
  let b = 0;
  const pixels = info.width * info.height;
  for (let i = 0; i < data.length; i += info.channels) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }
  return {
    r: Math.round(r / pixels),
    g: Math.round(g / pixels),
    b: Math.round(b / pixels),
  };
}

function luminance(rgb: Rgb): number {
  return (rgb.r * 0.299 + rgb.g * 0.587 + rgb.b * 0.114) / 255;
}

function estimateKelvin(rgb: Rgb): number {
  const warmth = (rgb.r - rgb.b) / 255;
  return Math.round(5500 + warmth * 2200);
}

/** Анализирует освещение сгенерированной сцены */
export async function analyzeSceneLighting(
  backgroundBuffer: Buffer,
  productPlacement?: { left: number; top: number; width: number; height: number },
): Promise<SceneLightingProfile> {
  const meta = await sharp(backgroundBuffer).metadata();
  const w = meta.width ?? 900;
  const h = meta.height ?? 1200;

  const [full, left, right, top] = await Promise.all([
    regionAverage(backgroundBuffer, { left: 0, top: 0, width: w, height: h }),
    regionAverage(backgroundBuffer, { left: 0, top: 0, width: Math.round(w * 0.35), height: h }),
    regionAverage(backgroundBuffer, {
      left: Math.round(w * 0.65),
      top: 0,
      width: Math.round(w * 0.35),
      height: h,
    }),
    regionAverage(backgroundBuffer, { left: 0, top: 0, width: w, height: Math.round(h * 0.35) }),
  ]);

  const leftLum = luminance(left);
  const rightLum = luminance(right);
  const topLum = luminance(top);

  let direction: SceneLightingProfile["direction"] = "ambient";
  const lrDiff = leftLum - rightLum;
  if (Math.abs(lrDiff) > 0.06) {
    direction = lrDiff > 0 ? "left" : "right";
  } else if (topLum > luminance(full) + 0.04) {
    direction = lrDiff >= 0 ? "top-left" : "top-right";
  }

  const brightness = luminance(full);
  const samples = [left, right, top, full].map(luminance);
  const contrast = Math.max(...samples) - Math.min(...samples);

  let average = full;
  if (productPlacement) {
    average = await regionAverage(backgroundBuffer, productPlacement);
  }

  return {
    average,
    brightness,
    contrast,
    warmth: (average.r - average.b) / 255,
    direction,
    temperatureKelvin: estimateKelvin(average),
  };
}
