import { createHash } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import sharp from "sharp";

const CANVAS = 1200;
const PRODUCT_MAX_W = 900;
const PRODUCT_MAX_H = 700;
const BOTTOM_PAD = 72;

export type MergeOptions = {
  reflection?: boolean;
};

type Rgb = { r: number; g: number; b: number };

function rec709Luminance({ r, g, b }: Rgb): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

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

async function sampleBackgroundColor(background: sharp.Sharp): Promise<Rgb> {
  const { data, info } = await background
    .clone()
    .resize(1, 1, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  if (info.channels < 3) {
    return { r: 128, g: 128, b: 128 };
  }
  return { r: data[0], g: data[1], b: data[2] };
}

function colorCorrectProduct(
  product: sharp.Sharp,
  bgLuma: number,
): sharp.Sharp {
  const normalized = bgLuma / 255;
  let brightness = 1.05;
  let saturation = 0.92;

  if (normalized < 0.35) {
    brightness = 1.12;
    saturation = 0.95;
  } else if (normalized > 0.65) {
    brightness = 0.96;
    saturation = 0.88;
  }

  return product.modulate({ brightness, saturation });
}

async function prepareProductLayer(
  productBuffer: Buffer,
  bgLuma: number,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const product = colorCorrectProduct(sharp(productBuffer).ensureAlpha(), bgLuma);
  const resized = await product
    .resize(PRODUCT_MAX_W, PRODUCT_MAX_H, {
      fit: "inside",
      withoutEnlargement: false,
    })
    .png()
    .toBuffer({ resolveWithObject: true });

  return {
    buffer: resized.data,
    width: resized.info.width,
    height: resized.info.height,
  };
}

async function createShadowLayer(
  productWidth: number,
  productHeight: number,
): Promise<{ buffer: Buffer; width: number; height: number; offsetY: number }> {
  const shadowW = Math.round(productWidth * 0.62);
  const shadowH = Math.max(28, Math.round(productHeight * 0.06));
  const svg = `
    <svg width="${shadowW}" height="${shadowH}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${shadowW / 2}" cy="${shadowH / 2}" rx="${shadowW * 0.48}" ry="${shadowH * 0.42}" fill="black" fill-opacity="0.45"/>
    </svg>`;

  const shadow = await sharp(Buffer.from(svg))
    .blur(15)
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

  const background = sharp(bgBuffer).resize(CANVAS, CANVAS, {
    fit: "cover",
    position: "centre",
  });

  const bgColor = await sampleBackgroundColor(background);
  const bgLuma = rec709Luminance(bgColor);

  const product = await prepareProductLayer(productRaw, bgLuma);
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
