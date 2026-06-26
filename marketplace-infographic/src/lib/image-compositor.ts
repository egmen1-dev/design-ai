import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

import {
  PRODUCT_BOTTOM_PAD_PX,
  PRODUCT_TARGET_MAX_HEIGHT_PX,
} from "@/lib/product-render-policy";

const CANVAS = 1200;
const PRODUCT_MAX_W = 920;
const PRODUCT_MAX_H = PRODUCT_TARGET_MAX_HEIGHT_PX;
const BOTTOM_PAD = PRODUCT_BOTTOM_PAD_PX;

export type MergeOptions = {
  reflection?: boolean;
  layout?: "center" | "marketplace";
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
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const pipeline = sharp(productBuffer)
    .ensureAlpha()
    .resize(PRODUCT_MAX_W, PRODUCT_MAX_H, {
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
): Promise<{ buffer: Buffer; width: number; height: number; offsetY: number }> {
  const scale = layout === "marketplace" ? 0.72 : 0.62;
  const shadowW = Math.round(productWidth * scale);
  const shadowH = Math.max(24, Math.round(productHeight * 0.055));
  const opacity = layout === "marketplace" ? 0.48 : 0.58;

  const svg = `
    <svg width="${shadowW}" height="${shadowH}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${shadowW / 2}" cy="${shadowH / 2}" rx="${shadowW * 0.46}" ry="${shadowH * 0.4}" fill="black" fill-opacity="${opacity}"/>
    </svg>`;

  const shadow = await sharp(Buffer.from(svg))
    .blur(layout === "marketplace" ? 16 : 22)
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
  const product = await prepareProductLayer(productRaw, layout);

  let productLeft = Math.round((CANVAS - product.width) / 2);
  let productTop = CANVAS - BOTTOM_PAD - product.height;

  if (layout === "marketplace") {
    productLeft = Math.round((CANVAS - product.width) / 2) + 36;
    productTop = CANVAS - BOTTOM_PAD - product.height + 12;
  }

  const shadow = await createShadowLayer(product.width, product.height, layout);
  let shadowLeft = Math.round((CANVAS - shadow.width) / 2);
  if (layout === "marketplace") {
    shadowLeft += 28;
  }
  const shadowTop = productTop + product.height - shadow.offsetY;

  const composites: sharp.OverlayOptions[] = [
    {
      input: shadow.buffer,
      left: shadowLeft,
      top: shadowTop,
      blend: "over",
    },
    {
      input: product.buffer,
      left: productLeft,
      top: productTop,
      blend: "over",
    },
  ];

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
