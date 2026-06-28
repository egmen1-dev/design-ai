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
  fitProductByAlphaBounds,
  resolveAlphaCenteredLeft,
} from "./alpha-fit";

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
  const rel = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  const abs = path.isAbsolute(trimmed)
    ? trimmed
    : path.join(process.cwd(), "public", rel);
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

function computeMaxProductSize(
  compositionLayout: CompositionLayout | undefined,
  objectScale: number,
): { maxW: number; maxH: number } {
  const canvasMaxW = Math.min(PRODUCT_MAX_WIDTH_PX, CANVAS_W - SIDE_MARGIN * 2);
  const canvasMaxH = Math.min(PRODUCT_MAX_H, CANVAS_H - HEADER_RESERVE_PX - BOTTOM_PAD);

  const comp = compositionLayout?.product;
  if (comp) {
    const zoneW = Math.round(xPct(comp.maxWidthPct));
    const zoneH = Math.round(yPct(comp.maxHeightPct));
    const scaleBoost = 0.58 + objectScale * 0.05;
    return {
      maxW: Math.min(canvasMaxW, PRODUCT_MAX_WIDTH_PX, Math.round(zoneW * scaleBoost)),
      maxH: Math.min(canvasMaxH, PRODUCT_MAX_H, Math.round(zoneH * scaleBoost)),
    };
  }

  const scale = 0.55 + objectScale * 0.18;
  return {
    maxW: Math.min(canvasMaxW, Math.round(canvasMaxW * scale)),
    maxH: Math.min(canvasMaxH, Math.round(canvasMaxH * scale)),
  };
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

  const [bgRaw, productRaw] = await Promise.all([
    loadImageBuffer(backgroundUrl),
    loadImageBuffer(productUrl),
  ]);

  const bgResized = await resizeBackground(bgRaw);
  const { maxW, maxH } = computeMaxProductSize(options.compositionLayout, objectScale);

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
  let product = await prepareProductLayer(
    softenedProduct,
    layout,
    rotationDeg,
    maxW,
    maxH,
  );
  product = await fitProductByAlphaBounds(
    product.buffer,
    PRODUCT_ALPHA_MAX_WIDTH_PX,
    PRODUCT_ALPHA_MAX_HEIGHT_PX,
  );

  const floorColor = await sampleFloorColor(
    bgResized,
    Math.round(CANVAS_W / 2),
    floorY,
  );

  const productBuffer = await applyFloorColorSpill(product.buffer, floorColor, 0.14);
  product = { ...product, buffer: productBuffer };

  const alphaFootBottom = (await getAlphaFootBottom(product.buffer)) ?? product.height;
  const productLeft = await resolveAlphaCenteredLeft(
    product.buffer,
    product.width,
    SIDE_MARGIN,
    CANVAS_W,
    options.compositionLayout,
  );
  const productTop = resolveVerticalTop(
    product.height,
    alphaFootBottom,
    floorY,
    options.compositionLayout,
  );

  const bgPrepared = await softenBackgroundCenter(bgRaw, layout);
  const footCanvasY = productTop + alphaFootBottom;

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

  const mergedBuffer = await applySceneHarmony(
    await applyFilmGrain(
      await sharp(bgPrepared).composite(composites).png().toBuffer(),
      0.022,
    ),
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
    .update("ground-v5")
    .digest("hex")
    .slice(0, 16);

  const dir = path.join(process.cwd(), "public", "merged");
  await mkdir(dir, { recursive: true });
  const filename = `${hash}-${Date.now()}.png`;
  const absPath = path.join(dir, filename);
  await writeFile(absPath, mergedBuffer);

  return {
    mergedPath: `/merged/${filename}`,
    mergedBuffer,
    lighting,
    productPlacement: finalPlacement,
  };
}

export async function mergedToDataUrl(imageUrl: string): Promise<string> {
  const buffer = await loadImageBuffer(imageUrl);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}
