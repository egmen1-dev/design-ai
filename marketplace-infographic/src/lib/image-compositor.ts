import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

import {
  PRODUCT_BOTTOM_PAD_PX,
  PRODUCT_TARGET_MAX_HEIGHT_PX,
} from "@/lib/product-render-policy";
import type { CompositingHints } from "@/lib/design-brief/schema";
import { matchProductToBackground } from "@/lib/compositing/color-match";

const CANVAS = 1200;
const PRODUCT_MAX_W = 920;
const PRODUCT_MAX_H = PRODUCT_TARGET_MAX_HEIGHT_PX;
const BOTTOM_PAD = PRODUCT_BOTTOM_PAD_PX;

export type MergeOptions = {
  reflection?: boolean;
  layout?: "center" | "marketplace";
  compositingHints?: CompositingHints;
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

/** Размывает центр фона — убирает «призрак» товара от FLUX */
export async function softenBackgroundCenter(bgBuffer: Buffer): Promise<Buffer> {
  const resized = await sharp(bgBuffer)
    .resize(CANVAS, CANVAS, { fit: "cover", position: "centre" })
    .toBuffer();

  const pw = Math.round(CANVAS * 0.5);
  const ph = Math.round(CANVAS * 0.46);
  const left = Math.round((CANVAS - pw) / 2);
  const top = Math.round(CANVAS * 0.38);

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
  layout: MergeOptions["layout"],
  scale = 1,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const maxW = Math.round(PRODUCT_MAX_W * scale);
  const maxH = Math.round(PRODUCT_MAX_H * scale);
  const pipeline = sharp(productBuffer)
    .ensureAlpha()
    .resize(maxW, maxH, {
      fit: "inside",
      withoutEnlargement: false,
    });

  if (layout === "marketplace") {
    return pipeline
      .rotate(-11, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer({ resolveWithObject: true })
      .then((resized) => ({
        buffer: resized.data,
        width: resized.info.width,
        height: resized.info.height,
      }));
  }

  return pipeline.png().toBuffer({ resolveWithObject: true }).then((resized) => ({
    buffer: resized.data,
    width: resized.info.width,
    height: resized.info.height,
  }));
}

async function createShadowLayer(
  productWidth: number,
  productHeight: number,
  layout: MergeOptions["layout"],
  shadowType?: string,
): Promise<{ buffer: Buffer; width: number; height: number; offsetY: number }> {
  const isHard = shadowType?.includes("contact");
  const isAmbient = shadowType?.includes("ambient");
  const scale = layout === "marketplace" ? 0.72 : isAmbient ? 0.78 : 0.62;
  const shadowW = Math.round(productWidth * scale);
  const shadowH = Math.max(24, Math.round(productHeight * (isHard ? 0.045 : 0.055)));
  const opacity = isHard ? 0.42 : isAmbient ? 0.32 : layout === "marketplace" ? 0.48 : 0.58;
  const blur = isHard ? 12 : isAmbient ? 28 : layout === "marketplace" ? 16 : 22;

  const svg = `
    <svg width="${shadowW}" height="${shadowH}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${shadowW / 2}" cy="${shadowH / 2}" rx="${shadowW * 0.46}" ry="${shadowH * 0.4}" fill="black" fill-opacity="${opacity}"/>
    </svg>`;

  const shadow = await sharp(Buffer.from(svg))
    .blur(blur)
    .ensureAlpha()
    .png()
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: shadow.data,
    width: shadow.info.width,
    height: shadow.info.height,
    offsetY: Math.round(shadowH * 0.12),
  };
}

/** Создаёт отражение товара под ним */
async function createReflectionLayer(
  productBuffer: Buffer,
  productWidth: number,
  productHeight: number,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const reflectH = Math.round(productHeight * 0.22);
  const reflected = await sharp(productBuffer)
    .flip()
    .resize(productWidth, reflectH, { fit: "cover", position: "top" })
    .linear(1, -40)
    .blur(1.5)
    .ensureAlpha()
    .png()
    .toBuffer({ resolveWithObject: true });

  const fadeSvg = `
    <svg width="${productWidth}" height="${reflectH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="white" stop-opacity="0.35"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#fade)"/>
    </svg>`;

  const faded = await sharp(reflected.data)
    .composite([{ input: Buffer.from(fadeSvg), blend: "dest-in" }])
    .png()
    .toBuffer();

  return { buffer: faded, width: productWidth, height: reflectH };
}

/** Объединяет фон и товар в один PNG 1200×1200 с тенью */
export async function mergeProductWithBackground(
  backgroundUrl: string,
  productUrl: string,
  options?: MergeOptions,
): Promise<string> {
  const layout = options?.layout ?? "center";

  const [bgRaw, productRaw] = await Promise.all([
    loadImageBuffer(backgroundUrl),
    loadImageBuffer(productUrl),
  ]);

  const bgPrepared = await softenBackgroundCenter(bgRaw);
  const hints = options?.compositingHints;
  const objectScale = hints?.objectScale ?? 0.58;
  const scaleFactor = 0.75 + objectScale * 0.45;
  const productMatched = hints
    ? await matchProductToBackground(productRaw, bgPrepared, hints)
    : productRaw;
  const product = await prepareProductLayer(productMatched, layout, scaleFactor);

  let productLeft = Math.round((CANVAS - product.width) / 2);
  let productTop = CANVAS - BOTTOM_PAD - product.height;

  if (layout === "marketplace") {
    productLeft = Math.round((CANVAS - product.width) / 2) + 36;
    productTop = CANVAS - BOTTOM_PAD - product.height + 12;
  }

  const shadow = await createShadowLayer(
    product.width,
    product.height,
    layout,
    hints?.shadowType,
  );
  let shadowLeft = Math.round((CANVAS - shadow.width) / 2);
  if (layout === "marketplace") {
    shadowLeft += 28;
  }
  const shadowTop = productTop + product.height - shadow.offsetY;

  const composites: sharp.OverlayOptions[] = [
    { input: shadow.buffer, left: shadowLeft, top: shadowTop, blend: "over" },
    { input: product.buffer, left: productLeft, top: productTop, blend: "over" },
  ];

  const useReflection = options?.reflection ?? hints?.reflection ?? false;
  if (useReflection) {
    const reflection = await createReflectionLayer(
      product.buffer,
      product.width,
      product.height,
    );
    const reflectTop = productTop + product.height - 4;
    composites.splice(1, 0, {
      input: reflection.buffer,
      left: productLeft,
      top: reflectTop,
      blend: "over",
    });
  }

  const merged = await sharp(bgPrepared).composite(composites).png().toBuffer();

  const hash = createHash("sha256")
    .update(backgroundUrl)
    .update(productUrl)
    .update(layout)
    .digest("hex")
    .slice(0, 16);

  const dir = path.join(process.cwd(), "public", "merged");
  await mkdir(dir, { recursive: true });
  const filename = `${hash}-${Date.now()}.png`;
  const absPath = path.join(dir, filename);
  await writeFile(absPath, merged);

  return `/merged/${filename}`;
}

export async function mergedToDataUrl(imageUrl: string): Promise<string> {
  const buffer = await loadImageBuffer(imageUrl);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}
