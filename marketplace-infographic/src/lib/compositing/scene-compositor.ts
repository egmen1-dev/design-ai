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

/** Размывает центр фона в зоне товара */
export async function softenBackgroundCenter(bgBuffer: Buffer): Promise<Buffer> {
  const resized = await sharp(bgBuffer)
    .resize(CANVAS_W, CANVAS_H, { fit: "cover", position: "centre" })
    .toBuffer();

  const pw = Math.round(CANVAS_W * 0.5);
  const ph = Math.round(CANVAS_H * 0.46);
  const left = Math.round((CANVAS_W - pw) / 2);
  const top = Math.round(CANVAS_H * 0.38);

  const patch = await sharp(resized)
    .extract({ left, top, width: pw, height: ph })
    .blur(22)
    .modulate({ brightness: 1.04, saturation: 0.92 })
    .toBuffer();

  const maskSvg = `
    <svg width="${pw}" height="${ph}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="g" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="white" stop-opacity="1"/>
          <stop offset="72%" stop-color="white" stop-opacity="0.55"/>
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

  if (rotationDeg !== 0) {
    pipeline = pipeline.rotate(rotationDeg, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  } else if (layout === "marketplace") {
    pipeline = pipeline.rotate(-8, { background: { r: 0, g: 0, b: 0, alpha: 0 } });
  }

  return pipeline.png().toBuffer({ resolveWithObject: true }).then((resized) => ({
    buffer: resized.data,
    width: resized.info.width,
    height: resized.info.height,
  }));
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

  const [bgRaw, productRaw] = await Promise.all([
    loadImageBuffer(backgroundUrl),
    loadImageBuffer(productUrl),
  ]);

  const bgPrepared = await softenBackgroundCenter(bgRaw);

  const comp = options.compositionLayout?.product;
  const rotationDeg = comp?.rotationDeg ?? 0;
  const targetW = comp ? Math.round(xPct(comp.maxWidthPct)) : undefined;
  const targetH = comp ? Math.round(yPct(comp.maxHeightPct)) : undefined;

  const scaleFactor =
    layout === "marketplace"
      ? Math.max(1.2, 0.9 + objectScale * 0.42)
      : 0.75 + objectScale * 0.45;

  let productLeft = Math.round((CANVAS_W - PRODUCT_MAX_W * scaleFactor) / 2);
  let productTop = CANVAS_H - BOTTOM_PAD - Math.round(PRODUCT_MAX_H * scaleFactor);

  if (comp) {
    productLeft = Math.round(xPct(comp.left));
    productTop = Math.round(yPct(comp.top));
  } else if (layout === "marketplace") {
    productLeft = Math.round((CANVAS_W - PRODUCT_MAX_W * scaleFactor) / 2) + Math.round(CANVAS_W * 0.05);
    productTop = CANVAS_H - BOTTOM_PAD - Math.round(PRODUCT_MAX_H * scaleFactor) - 8;
  }

  const placement = {
    left: productLeft,
    top: productTop,
    width: targetW ?? Math.round(PRODUCT_MAX_W * scaleFactor),
    height: targetH ?? Math.round(PRODUCT_MAX_H * scaleFactor),
  };

  const lighting = await analyzeSceneLighting(bgPrepared, placement);

  const kelvin = Number(scene.lightingTemperature.replace(/\D/g, "")) || lighting.temperatureKelvin;

  let matched = await matchLightingToScene(productRaw, lighting, {
    expectedDirection: scene.lightingDirection,
    expectedTemperature: kelvin,
    contrastBoost: scene.shadowProfile === "contact" ? 0.04 : 0,
  });
  matched = await matchColorToScene(matched, bgPrepared, lighting);

  const product = await prepareProductLayer(
    matched,
    layout,
    scaleFactor,
    rotationDeg,
    targetW,
    targetH,
  );

  productLeft = comp
    ? Math.min(Math.max(0, Math.round(xPct(comp.left))), CANVAS_W - product.width)
    : productLeft;
  productTop = comp
    ? Math.min(Math.max(0, Math.round(yPct(comp.top))), CANVAS_H - product.height)
    : productTop;

  const finalPlacement = {
    left: productLeft,
    top: productTop,
    width: product.width,
    height: product.height,
  };

  const shadows = await generateShadows({
    productWidth: product.width,
    productHeight: product.height,
    productLeft,
    productTop,
    lighting,
    shadowProfile: scene.shadowProfile,
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

  const mergedBuffer = await sharp(bgPrepared).composite(composites).png().toBuffer();

  const hash = createHash("sha256")
    .update(backgroundUrl)
    .update(productUrl)
    .update(scene.seed)
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
