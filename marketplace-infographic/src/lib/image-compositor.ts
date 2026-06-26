import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

import {
  PRODUCT_BG_NEGATIVE,
  PRODUCT_BOTTOM_PAD_PX,
  PRODUCT_TARGET_MAX_HEIGHT_PX,
} from "@/lib/product-render-policy";

const CANVAS = 1200;
const PRODUCT_MAX_W = 1050;
const PRODUCT_MAX_H = PRODUCT_TARGET_MAX_HEIGHT_PX;
const BOTTOM_PAD = PRODUCT_BOTTOM_PAD_PX;

export type MergeOptions = {
  reflection?: boolean;
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

function prepareProductLayer(
  productBuffer: Buffer,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  return sharp(productBuffer)
    .ensureAlpha()
    .resize(PRODUCT_MAX_W, PRODUCT_MAX_H, {
      fit: "inside",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer({ resolveWithObject: true })
    .then((resized) => ({
      buffer: resized.data,
      width: resized.info.width,
      height: resized.info.height,
    }));
}

async function createShadowLayer(
  productWidth: number,
  productHeight: number,
): Promise<{ buffer: Buffer; width: number; height: number; offsetY: number }> {
  const shadowW = Math.round(productWidth * 0.62);
  const shadowH = Math.max(28, Math.round(productHeight * 0.06));
  const svg = `
    <svg width="${shadowW}" height="${shadowH}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${shadowW / 2}" cy="${shadowH / 2}" rx="${shadowW * 0.48}" ry="${shadowH * 0.42}" fill="black" fill-opacity="0.58"/>
    </svg>`;

  const shadow = await sharp(Buffer.from(svg))
    .blur(22)
    .ensureAlpha()
    .png()
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: shadow.data,
    width: shadow.info.width,
    height: shadow.info.height,
    offsetY: Math.round(shadowH * 0.15),
  };
}

async function createReflectionLayer(
  productBuffer: Buffer,
  productWidth: number,
  productHeight: number,
): Promise<{ buffer: Buffer; width: number; height: number } | null> {
  const reflectH = Math.max(40, Math.round(productHeight * 0.28));
  const maskSvg = `
    <svg width="${productWidth}" height="${reflectH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="white" stop-opacity="0.32"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#fade)"/>
    </svg>`;

  const reflection = await sharp(productBuffer)
    .flip()
    .resize(productWidth, reflectH, { fit: "fill" })
    .ensureAlpha()
    .composite([{ input: Buffer.from(maskSvg), blend: "dest-in" }])
    .png()
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: reflection.data,
    width: reflection.info.width,
    height: reflection.info.height,
  };
}

/** Объединяет фон и товар в один PNG 1200×1200 с тенью и цветокоррекцией */
export async function mergeProductWithBackground(
  backgroundUrl: string,
  productUrl: string,
  options?: MergeOptions,
): Promise<string> {
  const [bgBuffer, productRaw] = await Promise.all([
    loadImageBuffer(backgroundUrl),
    loadImageBuffer(productUrl),
  ]);

  const background = sharp(bgBuffer)
    .resize(CANVAS, CANVAS, {
      fit: "cover",
      position: "centre",
    })
    .blur(10);

  const product = await prepareProductLayer(productRaw);
  const productLeft = Math.round((CANVAS - product.width) / 2);
  const productTop = CANVAS - BOTTOM_PAD - product.height;

  const shadow = await createShadowLayer(product.width, product.height);
  const shadowLeft = Math.round((CANVAS - shadow.width) / 2);
  const shadowTop = productTop + product.height - shadow.offsetY;

  const composites: sharp.OverlayOptions[] = [];

  if (options?.reflection) {
    const reflection = await createReflectionLayer(
      product.buffer,
      product.width,
      product.height,
    );
    if (reflection) {
      composites.push({
        input: reflection.buffer,
        left: productLeft,
        top: productTop + product.height - Math.round(reflection.height * 0.15),
        blend: "over",
      });
    }
  }

  composites.push(
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
  );

  const merged = await background.composite(composites).png().toBuffer();

  const hash = createHash("sha256")
    .update(backgroundUrl)
    .update(productUrl)
    .update(String(options?.reflection ?? false))
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
