import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

import {
  PRODUCT_BOTTOM_PAD_PX,
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
import { detectFloorY, sampleFloorColor } from "./ground-detector";

const CANVAS_W = WB_COVER.width;
const CANVAS_H = WB_COVER.height;
const PRODUCT_MAX_W = 980;
const PRODUCT_MAX_H = PRODUCT_TARGET_MAX_HEIGHT_PX;
const BOTTOM_PAD = PRODUCT_BOTTOM_PAD_PX;

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

/** Лёгкое размытие верхней зоны — для marketplace не применяем (фон должен остаться читаемым) */
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

function prepareProductLayer(
  productBuffer: Buffer,
  layout: SceneCompositeOptions["layout"],
  scale: number,
  rotationDeg: number,
  maxWidthPx?: number,
  maxHeightPx?: number,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const maxW = maxWidthPx ?? Math.round(PRODUCT_MAX_W * scale);
  const maxH = maxHeightPx ?? Math.round(PRODUCT_MAX_H * scale);
  let pipeline = sharp(productBuffer)
    .ensureAlpha()
    .resize(maxW, maxH, { fit: "inside", withoutEnlargement: false });

  const tilt =
    rotationDeg !== 0
      ? rotationDeg
      : layout === "marketplace"
        ? -5
        : 0;

  if (tilt !== 0) {
    pipeline = pipeline.rotate(tilt, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }

  return pipeline.png().toBuffer({ resolveWithObject: true }).then((resized) => ({
    buffer: resized.data,
    width: resized.info.width,
    height: resized.info.height,
  }));
}

function bottomAnchorTop(
  productHeight: number,
  compositionLayout?: CompositionLayout,
  floorY?: number,
): number {
  const safeInsetPx = compositionLayout
    ? Math.round(yPct(compositionLayout.safeInsetPct))
    : BOTTOM_PAD;
  const zoneBottom = CANVAS_H - safeInsetPx;

  let top = zoneBottom - productHeight;

  if (compositionLayout) {
    const zoneTop = Math.round(yPct(compositionLayout.product.top));
    top = Math.max(zoneTop, Math.min(top, zoneBottom - productHeight));
  }

  if (floorY !== undefined) {
    const alphaFootOffset = Math.round(productHeight * 0.02);
    const targetBottom = floorY + alphaFootOffset;
    top = Math.min(top, targetBottom - productHeight);
    top = Math.max(0, Math.min(top, CANVAS_H - productHeight));
  }

  return top;
}

function centerInZone(
  productWidth: number,
  compositionLayout: CompositionLayout,
): number {
  const zoneLeft = Math.round(xPct(compositionLayout.product.left));
  const zoneWidth = Math.round(xPct(compositionLayout.product.width));
  return zoneLeft + Math.round((zoneWidth - productWidth) / 2);
}

export type SceneCompositeResult = {
  mergedPath: string;
  mergedBuffer: Buffer;
  lighting: Awaited<ReturnType<typeof analyzeSceneLighting>>;
  productPlacement: { left: number; top: number; width: number; height: number };
};

/**
 * Scene-first композитинг:
 * Lighting Matcher → Color Matcher → Shadows → Reflection → Sharp Composite
 */
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

  const rotationDeg = comp?.rotationDeg ?? 0;
  const targetW = comp ? Math.round(xPct(comp.maxWidthPct)) : undefined;
  const targetH = comp ? Math.round(yPct(comp.maxHeightPct)) : undefined;

  const scaleFactor =
    layout === "marketplace"
      ? Math.max(1.2, 0.9 + objectScale * 0.42)
      : 0.75 + objectScale * 0.45;

  const prePlacement = {
    left: comp
      ? Math.round(xPct(comp.left))
      : Math.round((CANVAS_W - PRODUCT_MAX_W * scaleFactor) / 2) +
        (layout === "marketplace" ? Math.round(CANVAS_W * 0.05) : 0),
    top: 0,
    width: targetW ?? Math.round(PRODUCT_MAX_W * scaleFactor),
    height: targetH ?? Math.round(PRODUCT_MAX_H * scaleFactor),
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

  const product = await prepareProductLayer(
    softenedProduct,
    layout,
    scaleFactor,
    rotationDeg,
    targetW,
    targetH,
  );

  const productLeft = comp
    ? centerInZone(product.width, options.compositionLayout!)
    : Math.min(
        Math.max(0, prePlacement.left),
        CANVAS_W - product.width,
      );

  const productTop = comp
    ? bottomAnchorTop(product.height, options.compositionLayout, floorY)
    : layout === "marketplace"
      ? bottomAnchorTop(product.height, options.compositionLayout, floorY) -
        8
      : CANVAS_H - BOTTOM_PAD - product.height;

  const floorColor = await sampleFloorColor(
    bgResized,
    productLeft + Math.round(product.width / 2),
    floorY,
  );

  const bgPrepared = await softenBackgroundCenter(bgRaw, layout);

  const shadows = await generateShadows({
    productWidth: product.width,
    productHeight: product.height,
    productLeft,
    productTop,
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
    .update("ground-v2")
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
