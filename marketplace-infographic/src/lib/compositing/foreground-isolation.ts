import sharp from "sharp";
import type { SceneLightingProfile } from "./scene-analysis";

export type ForegroundIsolationDiagnostics = {
  applied: boolean;
  backgroundHalo: boolean;
  localContrast: boolean;
  edgeSeparation: boolean;
  version: "1.1.0-quality-cycle-3";
};

export type ForegroundIsolationInput = {
  backgroundBuffer: Buffer;
  canvasWidth: number;
  canvasHeight: number;
  productBuffer: Buffer;
  productLeft: number;
  productTop: number;
  lighting: SceneLightingProfile;
};

function lightVector(direction: SceneLightingProfile["direction"]): { x: number; y: number } {
  const map: Record<SceneLightingProfile["direction"], { x: number; y: number }> = {
    left: { x: -1, y: -0.2 },
    right: { x: 1, y: -0.2 },
    top: { x: 0, y: -1 },
    "top-left": { x: -0.7, y: -0.7 },
    "top-right": { x: 0.7, y: -0.7 },
    ambient: { x: -0.35, y: -0.5 },
  };
  return map[direction] ?? map.ambient;
}

/** Expanded product alpha on full canvas — used for halo and masks. */
async function productAlphaOnCanvas(input: {
  productBuffer: Buffer;
  productLeft: number;
  productTop: number;
  canvasWidth: number;
  canvasHeight: number;
  blurSigma: number;
}): Promise<Buffer> {
  const meta = await sharp(input.productBuffer).metadata();
  const pw = meta.width ?? 1;
  const ph = meta.height ?? 1;

  const base = await sharp({
    create: {
      width: input.canvasWidth,
      height: input.canvasHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: await sharp(input.productBuffer).ensureAlpha().png().toBuffer(),
        left: Math.max(0, input.productLeft),
        top: Math.max(0, input.productTop),
      },
    ])
    .extractChannel("alpha")
    .png()
    .toBuffer();

  if (input.blurSigma <= 0) return base;

  return sharp(base).blur(input.blurSigma).png().toBuffer();
}

/**
 * Slight background darkening behind product — natural depth, not vignette glow.
 */
export async function applyBackgroundSeparationHalo(
  input: ForegroundIsolationInput,
): Promise<Buffer> {
  const expanded = await productAlphaOnCanvas({
    ...input,
    blurSigma: 14,
  });

  const core = await productAlphaOnCanvas({
    ...input,
    blurSigma: 0,
  });

  const expandedMeta = await sharp(expanded).metadata();
  const w = expandedMeta.width ?? input.canvasWidth;
  const h = expandedMeta.height ?? input.canvasHeight;

  const haloMask = await sharp(expanded)
    .composite([{ input: core, blend: "dest-out" }])
    .linear(1, 0)
    .png()
    .toBuffer();

  const softenMask = await sharp(expanded).linear(0.55, 0).png().toBuffer();
  const softenedBg = await sharp(input.backgroundBuffer).blur(2.2).png().toBuffer();
  const localizedSoftness = await sharp(softenedBg)
    .composite([{ input: softenMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  const darkenSvg = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="rgb(10,12,16)"/>
    </svg>`,
  );

  const haloLayer = await sharp(darkenSvg)
    .composite([{ input: haloMask, blend: "dest-in" }])
    .linear(0.42, 0)
    .png()
    .toBuffer();

  const behindProduct = await sharp(expanded).linear(0.38, 0).png().toBuffer();

  const behindLayer = await sharp(darkenSvg)
    .composite([{ input: behindProduct, blend: "dest-in" }])
    .linear(0.5, 0)
    .png()
    .toBuffer();

  return sharp(input.backgroundBuffer)
    .composite([
      { input: localizedSoftness, blend: "over" },
      { input: behindLayer, blend: "multiply" },
      { input: haloLayer, blend: "multiply" },
    ])
    .png()
    .toBuffer();
}

/**
 * Post-merge: local contrast + subtle lit-edge separation (no outline / glow).
 */
export async function enhanceForegroundIsolation(
  mergedBuffer: Buffer,
  input: Omit<ForegroundIsolationInput, "backgroundBuffer">,
): Promise<Buffer> {
  const meta = await sharp(mergedBuffer).metadata();
  const w = meta.width ?? input.canvasWidth;
  const h = meta.height ?? input.canvasHeight;

  const coreMask = await productAlphaOnCanvas({
    productBuffer: input.productBuffer,
    productLeft: input.productLeft,
    productTop: input.productTop,
    canvasWidth: w,
    canvasHeight: h,
    blurSigma: 0,
  });

  const dilated = await productAlphaOnCanvas({
    productBuffer: input.productBuffer,
    productLeft: input.productLeft,
    productTop: input.productTop,
    canvasWidth: w,
    canvasHeight: h,
    blurSigma: 3,
  });

  const edgeBand = await sharp(dilated)
    .composite([{ input: coreMask, blend: "dest-out" }])
    .png()
    .toBuffer();

  const lv = lightVector(input.lighting.direction);
  const rimSvg = Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="rim" x1="${lv.x < 0 ? 1 : 0}" y1="${lv.y < 0 ? 1 : 0.5}"
          x2="${lv.x < 0 ? 0 : 1}" y2="${lv.y < 0 ? 0 : 0.8}">
          <stop offset="0%" stop-color="white" stop-opacity="0.11"/>
          <stop offset="45%" stop-color="white" stop-opacity="0"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#rim)"/>
    </svg>`,
  );

  const rimLayer = await sharp(rimSvg)
    .composite([{ input: edgeBand, blend: "dest-in" }])
    .png()
    .toBuffer();

  const contrastBoost = await sharp(mergedBuffer)
    .linear(1.12, -10)
    .sharpen({ sigma: 0.8, m1: 0.65, m2: 0.4 })
    .png()
    .toBuffer();

  const maskedContrast = await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: contrastBoost, blend: "over" }])
    .composite([{ input: coreMask, blend: "dest-in" }])
    .png()
    .toBuffer();

  return sharp(mergedBuffer)
    .composite([
      { input: maskedContrast, blend: "over" },
      { input: rimLayer, blend: "soft-light" },
    ])
    .png()
    .toBuffer();
}

export function foregroundIsolationEnabled(): boolean {
  return process.env.DAOS_FOREGROUND_ISOLATION !== "0";
}

export async function applyForegroundIsolationPipeline(input: {
  backgroundBuffer: Buffer;
  mergedBuffer: Buffer;
  canvasWidth: number;
  canvasHeight: number;
  productBuffer: Buffer;
  productLeft: number;
  productTop: number;
  lighting: SceneLightingProfile;
}): Promise<{ backgroundBuffer: Buffer; mergedBuffer: Buffer; diagnostics: ForegroundIsolationDiagnostics }> {
  if (!foregroundIsolationEnabled()) {
    return {
      backgroundBuffer: input.backgroundBuffer,
      mergedBuffer: input.mergedBuffer,
      diagnostics: {
        applied: false,
        backgroundHalo: false,
        localContrast: false,
        edgeSeparation: false,
        version: "1.1.0-quality-cycle-3",
      },
    };
  }

  const bgWithHalo = await applyBackgroundSeparationHalo({
    backgroundBuffer: input.backgroundBuffer,
    canvasWidth: input.canvasWidth,
    canvasHeight: input.canvasHeight,
    productBuffer: input.productBuffer,
    productLeft: input.productLeft,
    productTop: input.productTop,
    lighting: input.lighting,
  });

  const enhanced = await enhanceForegroundIsolation(input.mergedBuffer, {
    canvasWidth: input.canvasWidth,
    canvasHeight: input.canvasHeight,
    productBuffer: input.productBuffer,
    productLeft: input.productLeft,
    productTop: input.productTop,
    lighting: input.lighting,
  });

  return {
    backgroundBuffer: bgWithHalo,
    mergedBuffer: enhanced,
    diagnostics: {
      applied: true,
      backgroundHalo: true,
      localContrast: true,
      edgeSeparation: true,
      version: "1.1.0-quality-cycle-3",
    },
  };
}
