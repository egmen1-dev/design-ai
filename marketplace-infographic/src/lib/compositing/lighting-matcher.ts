import sharp from "sharp";
import type { SceneLightingProfile } from "./scene-analysis";

export type LightingMatchOptions = {
  expectedDirection?: string;
  expectedTemperature?: number;
  contrastBoost?: number;
};

export function normalizeLightingDirection(
  raw?: string,
  fallback: SceneLightingProfile["direction"] = "ambient",
): SceneLightingProfile["direction"] {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("left") && (s.includes("top") || s.includes("45"))) return "top-left";
  if (s.includes("right") && (s.includes("top") || s.includes("45"))) return "top-right";
  if (s.includes("left") || s.includes("слева")) return "left";
  if (s.includes("right") || s.includes("справа")) return "right";
  if (s.includes("top") || s.includes("верх") || s.includes("overhead")) return "top";
  return fallback;
}

function directionToGradient(
  direction: SceneLightingProfile["direction"],
  width: number,
  height: number,
): string {
  const stops: Record<SceneLightingProfile["direction"], [number, number, number, number]> = {
    left: [0, 0.5, 1, 0.5],
    right: [1, 0.5, 0, 0.5],
    top: [0.5, 0, 0.5, 1],
    "top-left": [0, 0, 1, 1],
    "top-right": [1, 0, 0, 1],
    ambient: [0.5, 0.5, 0.5, 0.5],
  };
  const [x1, y1, x2, y2] = stops[direction];
  return `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lg" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
          <stop offset="0%" stop-color="white" stop-opacity="0.14"/>
          <stop offset="55%" stop-color="white" stop-opacity="0"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.1"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#lg)"/>
    </svg>`;
}

function temperatureShift(kelvin: number): { r: number; g: number; b: number } {
  const t = (kelvin - 5500) / 5500;
  return {
    r: Math.round(t * 14),
    g: Math.round(t * 3),
    b: Math.round(-t * 16),
  };
}

/** Подгоняет освещение товара под проанализированную сцену */
export async function matchLightingToScene(
  productBuffer: Buffer,
  lighting: SceneLightingProfile,
  options?: LightingMatchOptions,
): Promise<Buffer> {
  const meta = await sharp(productBuffer).metadata();
  const w = meta.width ?? 400;
  const h = meta.height ?? 400;

  const targetKelvin = options?.expectedTemperature ?? lighting.temperatureKelvin;
  const temp = temperatureShift(targetKelvin);
  const warmthFactor = lighting.warmth;

  let brightness = 0.96 + lighting.brightness * 0.08;
  if (warmthFactor > 0.12) brightness += 0.02;
  if (warmthFactor < -0.12) brightness -= 0.015;

  let saturation = 1.0;
  if (targetKelvin > 6000) saturation = 0.93;
  else if (targetKelvin < 5000) saturation = 1.05;

  let pipeline = sharp(productBuffer)
    .ensureAlpha()
    .modulate({ brightness, saturation });

  if (lighting.contrast > 0.12 || (options?.contrastBoost ?? 0) > 0) {
    const boost = 1 + Math.min(0.12, lighting.contrast * 0.35 + (options?.contrastBoost ?? 0));
    pipeline = pipeline.linear(boost, -(boost - 1) * 18);
  }

  const tinted = await pipeline.png().toBuffer();

  const litDirection = options?.expectedDirection
    ? normalizeLightingDirection(options.expectedDirection, lighting.direction)
    : lighting.direction;
  const gradientSvg = directionToGradient(litDirection, w, h);
  const lit = await sharp(tinted)
    .composite([
      {
        input: Buffer.from(gradientSvg),
        blend: "overlay",
      },
    ])
    .png()
    .toBuffer();

  if (Math.abs(temp.r) + Math.abs(temp.b) < 4) return lit;

  return sharp(lit)
    .recomb([
      [1, 0, 0],
      [0, 1, 0],
      [temp.r / 255, temp.g / 255, 1 + temp.b / 255],
    ])
    .png()
    .toBuffer();
}
