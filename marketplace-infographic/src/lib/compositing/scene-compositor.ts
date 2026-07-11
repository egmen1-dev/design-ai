import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

import {
  PRODUCT_ALPHA_MAX_HEIGHT_PX,
  PRODUCT_ALPHA_MAX_WIDTH_PX,
  PRODUCT_BOTTOM_PAD_PX,
  PRODUCT_MAX_WIDTH_PX,
  PRODUCT_SIDE_MARGIN_PX,
  PRODUCT_TARGET_MAX_HEIGHT_PX,
} from "@/lib/product-render-policy";
import { WB_COVER, xPct, yPct } from "@/lib/composition/canvas";
import type { CompositionLayout } from "@/lib/composition/types";
import type { ScenePlan } from "@/lib/design/scene-planner";
import { analyzeSceneLighting } from "./scene-analysis";
import { matchLightingToScene } from "./lighting-matcher";
import { matchColorToScene } from "./color-matcher";
import { generateShadows } from "./shadow-generator";
import { generateReflection } from "./reflection-generator";
import { applyFilmGrain } from "./grain-matcher";
import { applySceneHarmony, softenProductEdges } from "./scene-harmony";
import { detectFloorY, getAlphaFootBottom, sampleFloorColor } from "./ground-detector";
import {
  renderFloorContactShadow,
  renderFloorReflection,
} from "./floor-contact";
import {
  applyFloorColorSpill,
  fitProductWithSafePlacement,
} from "./alpha-fit";
import {
  buildCommercialCalibrationDiagnostics,
  computeMaxProductSize,
  type CommercialCalibrationDiagnostics,
  type CommercialCalibrationMode,
} from "./commercial-calibration";
import {
  buildCommercialAlphaPolicyDiagnostics,
  type CommercialAlphaPolicyDiagnostics,
} from "./commercial-alpha-policy";
import {
  applyBackgroundSeparationHalo,
  enhanceForegroundIsolation,
  foregroundIsolationEnabled,
  type ForegroundIsolationDiagnostics,
} from "./foreground-isolation";
import { publicDir, resolvePublicAssetPath, writablePublicDir } from "@/lib/runtime-paths";

const CANVAS_W = WB_COVER.width;
const CANVAS_H = WB_COVER.height;
const PRODUCT_MAX_H = PRODUCT_TARGET_MAX_HEIGHT_PX;
const BOTTOM_PAD = PRODUCT_BOTTOM_PAD_PX;
const SIDE_MARGIN = PRODUCT_SIDE_MARGIN_PX;
const HEADER_RESERVE_PX = Math.round(CANVAS_H * 0.2);

export type SceneCompositeOptions = {
  layout?: "center" | "marketplace";
  scene: ScenePlan;
  compositionLayout?: CompositionLayout;
  objectScale?: number;
  /** When true, uses Sprint 6C calibrated scaleBoost formula */
  commercialCalibration?: boolean;
};

async function loadImageBuffer(source: string): Promise<Buffer> {
  const trimmed = source.trim();
  if (trimmed.startsWith("data:")) {
    const match = trimmed.match(/^data:image\/[\w+.-]+;base64,(.+)$/i);
    if (!match) throw new Error("INVALID_IMAGE_DATA_URL");
    return Buffer.from(match[1].replace(/\s/g, ""), "base64");
  }
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    const res = await fetch(trimmed);
    if (!res.ok) throw new Error(`FETCH_IMAGE_${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  // URL paths from Next public (/backgrounds, /uploads)
  if (trimmed.startsWith("/")) {
    return readFile(await resolvePublicAssetPath(trimmed));
  }
  const abs = path.isAbsolute(trimmed) ? trimmed : publicDir(trimmed);
  return readFile(abs);
}

async function resizeBackground(bgBuffer: Buffer): Promise<Buffer> {
  return sharp(bgBuffer)
    .resize(CANVAS_W, CANVAS_H, { fit: "cover", position: "centre" })
    .png()
    .toBuffer();
}

export async function softenBackgroundCenter(
  bgBuffer: Buffer,
  layout: SceneCompositeOptions["layout"] = "marketplace",
): Promise<Buffer> {
  const resized = await resizeBackground(bgBuffer);
  if (layout === "marketplace") {
    return resized;
  }

  const pw = Math.round(CANVAS_W * 0.48);
  const ph = Math.round(CANVAS_H * 0.32);
  const left = Math.round((CANVAS_W - pw) / 2);
  const top = Math.round(CANVAS_H * 0.3);

  const patch = await sharp(resized)
    .extract({ left, top, width: pw, height: ph })
    .blur(18)
    .modulate({ brightness: 1.03, saturation: 0.94 })
    .toBuffer();

  const maskSvg = `
    <svg width="${pw}" height="${ph}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="42%" r="52%">
          <stop offset="0%" stop-color="white" stop-opacity="1"/>
          <stop offset="68%" stop-color="white" stop-opacity="0.5"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#g)"/>
    </svg>`;

  const feathered = await sharp(patch)
    .composite([{ input: Buffer.from(maskSvg), blend: "dest-in" }])
    .png()
    .toBuffer();

  return sharp(resized)
    .composite([{ input: feathered, left, top, blend: "over" }])
    .png()
    .toBuffer();
}

async function fitProductInFrame(
  productBuffer: Buffer,
  maxW: number,
  maxH: number,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  let current = await sharp(productBuffer).png().toBuffer({ resolveWithObject: true });
  const margin = SIDE_MARGIN;

  for (let attempt = 0; attempt < 4; attempt++) {
    const w = current.info.width;
    const h = current.info.height;
    const fitsW = w <= maxW && w <= CANVAS_W - margin * 2;
    const fitsH = h <= maxH && h <= CANVAS_H - HEADER_RESERVE_PX - BOTTOM_PAD;
    if (fitsW && fitsH) break;

    const scale = Math.min(
      maxW / w,
      maxH / h,
      (CANVAS_W - margin * 2) / w,
      (CANVAS_H - HEADER_RESERVE_PX - BOTTOM_PAD) / h,
    ) * 0.96;

    current = await sharp(current.data)
      .resize(Math.max(80, Math.round(w * scale)), Math.max(80, Math.round(h * scale)), {
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer({ resolveWithObject: true });
  }

  return {
    buffer: current.data,
    width: current.info.width,
    height: current.info.height,
  };
}

async function prepareProductLayer(
  productBuffer: Buffer,
  layout: SceneCompositeOptions["layout"],
  rotationDeg: number,
  maxWidthPx: number,
  maxHeightPx: number,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  let pipeline = sharp(productBuffer)
    .ensureAlpha()
    .resize(maxWidthPx, maxHeightPx, { fit: "inside", withoutEnlargement: false });

  const tilt =
    rotationDeg !== 0
      ? Math.max(-3, Math.min(3, rotationDeg))
      : 0;

  if (tilt !== 0) {
    pipeline = pipeline.rotate(tilt, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }

  const resized = await pipeline.png().toBuffer({ resolveWithObject: true });
  let { data: buffer, info } = resized;

  const canvasMaxW = CANVAS_W - SIDE_MARGIN * 2;
  const canvasMaxH = CANVAS_H - HEADER_RESERVE_PX - BOTTOM_PAD;
  if (info.width > canvasMaxW || info.height > canvasMaxH) {
    const fitted = await sharp(buffer)
      .resize(canvasMaxW, canvasMaxH, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer({ resolveWithObject: true });
    buffer = fitted.data;
    info = fitted.info;
  }

  return {
    buffer,
    width: info.width,
    height: info.height,
  };
}

function resolveHorizontalLeft(
  productWidth: number,
  compositionLayout?: CompositionLayout,
): number {
  if (compositionLayout) {
    const zoneLeft = Math.round(xPct(compositionLayout.product.left));
    const zoneWidth = Math.round(xPct(compositionLayout.product.width));
    const centered = zoneLeft + Math.round((zoneWidth - productWidth) / 2);
    return Math.max(SIDE_MARGIN, Math.min(centered, CANVAS_W - SIDE_MARGIN - productWidth));
  }
  return Math.max(SIDE_MARGIN, Math.round((CANVAS_W - productWidth) / 2));
}

function resolveVerticalTop(
  productHeight: number,
  alphaFootBottom: number,
  floorY: number,
  compositionLayout?: CompositionLayout,
): number {
  const safeInsetPx = compositionLayout
    ? Math.round(yPct(compositionLayout.safeInsetPct))
    : BOTTOM_PAD;
  const zoneBottom = CANVAS_H - safeInsetPx;

  let top = floorY - alphaFootBottom;
  top = Math.min(top, zoneBottom - productHeight);
  top = Math.max(HEADER_RESERVE_PX, top);
  top = Math.min(top, CANVAS_H - BOTTOM_PAD - productHeight);

  return Math.round(top);
}

export type SceneCompositeResult = {
  mergedPath: string;
  mergedBuffer: Buffer;
  lighting: Awaited<ReturnType<typeof analyzeSceneLighting>>;
  productPlacement: { left: number; top: number; width: number; height: number };
  commercialCalibration?: CommercialCalibrationDiagnostics;
  commercialAlphaPolicy?: CommercialAlphaPolicyDiagnostics;
  foregroundIsolation?: ForegroundIsolationDiagnostics;
};

export async function compositeProductIntoScene(
  backgroundUrl: string,
  productUrl: string,
  options: SceneCompositeOptions,
): Promise<SceneCompositeResult> {
  const layout = options.layout ?? "marketplace";
  const scene = options.scene;
  const objectScale = options.objectScale ?? 0.78;
  const comp = options.compositionLayout?.product;
  const calibrationMode: CommercialCalibrationMode = options.commercialCalibration
    ? "calibrated"
    : "legacy";

  const [bgRaw, productRaw] = await Promise.all([
    loadImageBuffer(backgroundUrl),
    loadImageBuffer(productUrl),
  ]);

  const bgResized = await resizeBackground(bgRaw);
  const maxSize = computeMaxProductSize(
    options.compositionLayout,
    objectScale,
    calibrationMode,
  );
  const { maxW, maxH } = maxSize;

  const prePlacement = {
    left: SIDE_MARGIN,
    top: HEADER_RESERVE_PX,
    width: maxW,
    height: maxH,
  };

  const floorY = await detectFloorY(bgResized, {
    left: prePlacement.left,
    width: prePlacement.width,
  });

  const lighting = await analyzeSceneLighting(bgResized, prePlacement);
  const kelvin = Number(scene.lightingTemperature.replace(/\D/g, "")) || lighting.temperatureKelvin;

  let matched = await matchLightingToScene(productRaw, lighting, {
    expectedDirection: scene.lightingDirection,
    expectedTemperature: kelvin,
    contrastBoost: 0.06,
  });
  matched = await matchColorToScene(matched, bgResized, lighting);
  const softenedProduct = await softenProductEdges(matched);

  const rotationDeg = comp?.rotationDeg ?? 0;
  const prepared = await prepareProductLayer(
    softenedProduct,
    layout,
    rotationDeg,
    maxW,
    maxH,
  );
  const placement = await fitProductWithSafePlacement(
    prepared.buffer,
    prepared.width,
    prepared.height,
    CANVAS_W,
    SIDE_MARGIN,
    PRODUCT_ALPHA_MAX_WIDTH_PX,
    PRODUCT_ALPHA_MAX_HEIGHT_PX,
    options.compositionLayout,
  );

  const floorColor = await sampleFloorColor(
    bgResized,
    Math.round(CANVAS_W / 2),
    floorY,
  );

  const productBuffer = await applyFloorColorSpill(placement.buffer, floorColor, 0.14);
  const product = { ...placement, buffer: productBuffer };

  const alphaFootBottom = (await getAlphaFootBottom(product.buffer)) ?? product.height;
  const productLeft = placement.left;
  const productTop = resolveVerticalTop(
    product.height,
    alphaFootBottom,
    floorY,
    options.compositionLayout,
  );

  let bgPrepared = await softenBackgroundCenter(bgRaw, layout);
  const footCanvasY = productTop + alphaFootBottom;

  let foregroundIsolation: ForegroundIsolationDiagnostics | undefined;
  if (foregroundIsolationEnabled()) {
    bgPrepared = await applyBackgroundSeparationHalo({
      backgroundBuffer: bgPrepared,
      canvasWidth: CANVAS_W,
      canvasHeight: CANVAS_H,
      productBuffer: product.buffer,
      productLeft,
      productTop,
      lighting,
    });
    foregroundIsolation = {
      applied: true,
      backgroundHalo: true,
      localContrast: false,
      edgeSeparation: false,
      version: "1.1.0-quality-cycle-3",
    };
  }

  const floorContact = await renderFloorContactShadow(
    product.buffer,
    productLeft,
    footCanvasY,
    floorColor,
  );
  const floorReflection = await renderFloorReflection(
    product.buffer,
    productLeft,
    productTop,
    footCanvasY,
    floorColor,
  );

  const shadows = await generateShadows({
    productWidth: product.width,
    productHeight: product.height,
    productLeft,
    productTop,
    alphaFootBottom,
    footCanvasY,
    lighting,
    shadowProfile: scene.shadowProfile === "ambient" ? "contact" : scene.shadowProfile,
    productBuffer: product.buffer,
    floorColor,
    lightingDirectionOverride: scene.lightingDirection,
  });

  const composites: sharp.OverlayOptions[] = shadows.map((s) => ({
    input: s.buffer,
    left: s.left,
    top: s.top,
    blend: "over" as const,
  }));

  if (floorContact) {
    composites.push({
      input: floorContact.buffer,
      left: floorContact.left,
      top: floorContact.top,
      blend: floorContact.blend,
    });
  }
  if (floorReflection) {
    composites.push({
      input: floorReflection.buffer,
      left: floorReflection.left,
      top: floorReflection.top,
      blend: floorReflection.blend,
    });
  }

  if (scene.reflectionEnabled) {
    const reflection = await generateReflection({
      productBuffer: product.buffer,
      productWidth: product.width,
      productHeight: product.height,
      productLeft,
      productTop,
      surfaceType: scene.surfaceType,
    });
    if (reflection) {
      composites.push({
        input: reflection.buffer,
        left: reflection.left,
        top: reflection.top,
        blend: "over",
      });
    }
  }

  composites.push({
    input: product.buffer,
    left: productLeft,
    top: productTop,
    blend: "over",
  });

  let mergedRaw = await sharp(bgPrepared).composite(composites).png().toBuffer();

  if (foregroundIsolationEnabled()) {
    mergedRaw = await enhanceForegroundIsolation(mergedRaw, {
      canvasWidth: CANVAS_W,
      canvasHeight: CANVAS_H,
      productBuffer: product.buffer,
      productLeft,
      productTop,
      lighting,
    });
    foregroundIsolation = {
      applied: true,
      backgroundHalo: true,
      localContrast: true,
      edgeSeparation: true,
      version: "1.1.0-quality-cycle-3",
    };
  }

  const mergedBuffer = await applySceneHarmony(
    await applyFilmGrain(mergedRaw, 0.022),
    floorColor,
    lighting.warmth,
  );

  const finalPlacement = {
    left: productLeft,
    top: productTop,
    width: product.width,
    height: product.height,
  };

  const hash = createHash("sha256")
    .update(backgroundUrl)
    .update(productUrl)
    .update(scene.seed)
    .update("ground-v7-isolation")
    .digest("hex")
    .slice(0, 16);

  const dir = path.join(process.cwd(), "public", "merged");
  await mkdir(dir, { recursive: true });
  const filename = `${hash}-${Date.now()}.png`;
  const absPath = path.join(dir, filename);
  await writeFile(absPath, mergedBuffer);

  const measuredAreaPct =
    Math.round(
      ((finalPlacement.width * finalPlacement.height) / (CANVAS_W * CANVAS_H)) * 1000,
    ) / 10;

  return {
    mergedPath: `/merged/${filename}`,
    mergedBuffer,
    lighting,
    productPlacement: finalPlacement,
    commercialCalibration: buildCommercialCalibrationDiagnostics({
      objectScale,
      compositionLayout: options.compositionLayout,
      mode: calibrationMode,
      measuredAreaPct,
    }),
    commercialAlphaPolicy: buildCommercialAlphaPolicyDiagnostics(),
    foregroundIsolation,
  };
}

export async function mergedToDataUrl(imageUrl: string): Promise<string> {
  const buffer = await loadImageBuffer(imageUrl);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}
