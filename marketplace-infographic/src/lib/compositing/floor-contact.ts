import sharp from "sharp";
import type { Rgb } from "./scene-analysis";
import { getAlphaBounds, getAlphaFootBottom } from "./ground-detector";

export type FloorContactLayer = {
  buffer: Buffer;
  left: number;
  top: number;
  blend: "multiply" | "over";
};

/** Контактная тень multiply — «прижимает» товар к полу */
export async function renderFloorContactShadow(
  productBuffer: Buffer,
  productLeft: number,
  footCanvasY: number,
  floorColor: Rgb,
): Promise<FloorContactLayer | null> {
  const bounds = await getAlphaBounds(productBuffer);
  if (!bounds) return null;

  const meta = await sharp(productBuffer).metadata();
  const w = meta.width ?? bounds.width;
  const footTop = bounds.top + Math.round(bounds.height * 0.62);
  const footHeight = Math.max(10, bounds.bottom - footTop + 4);

  const slice = await sharp(productBuffer)
    .ensureAlpha()
    .extract({
      left: bounds.left,
      top: footTop,
      width: bounds.width,
      height: footHeight,
    })
    .greyscale()
    .linear(1.4, -35)
    .blur(5)
    .toBuffer();

  const sm = await sharp(slice).metadata();
  const sw = sm.width ?? bounds.width;
  const sh = sm.height ?? footHeight;

  const dark = {
    r: Math.max(0, Math.round(floorColor.r * 0.35)),
    g: Math.max(0, Math.round(floorColor.g * 0.35)),
    b: Math.max(0, Math.round(floorColor.b * 0.35)),
  };

  const buffer = await sharp(slice)
    .resize(Math.round(sw * 1.08), Math.max(14, Math.round(sh * 1.6)), { fit: "fill" })
    .composite([
      {
        input: {
          create: {
            width: Math.round(sw * 1.08),
            height: Math.max(14, Math.round(sh * 1.6)),
            channels: 4,
            background: { r: dark.r, g: dark.g, b: dark.b, alpha: 200 },
          },
        },
        blend: "dest-in",
      },
    ])
    .png()
    .toBuffer();

  const bm = await sharp(buffer).metadata();
  const bw = bm.width ?? sw;
  const bh = bm.height ?? sh;

  return {
    buffer,
    left: productLeft + bounds.left + Math.round(bounds.width / 2) - Math.round(bw / 2),
    top: footCanvasY - Math.round(bh * 0.35),
    blend: "multiply",
  };
}

/** Слабое отражение в полу под «ногами» товара */
export async function renderFloorReflection(
  productBuffer: Buffer,
  productLeft: number,
  productTop: number,
  footCanvasY: number,
  floorColor: Rgb,
): Promise<FloorContactLayer | null> {
  const bounds = await getAlphaBounds(productBuffer);
  if (!bounds) return null;

  const meta = await sharp(productBuffer).metadata();
  const w = meta.width ?? bounds.width;
  const reflectSourceH = Math.min(bounds.height, Math.round(bounds.height * 0.35));
  const extractTop = bounds.bottom - reflectSourceH + 1;

  const reflected = await sharp(productBuffer)
    .ensureAlpha()
    .extract({
      left: bounds.left,
      top: Math.max(0, extractTop),
      width: bounds.width,
      height: Math.max(8, bounds.bottom - Math.max(0, extractTop) + 1),
    })
    .flip()
    .resize(bounds.width, Math.max(16, Math.round(reflectSourceH * 0.55)), { fit: "fill" })
    .linear(0.7, -20)
    .blur(1.8)
    .png()
    .toBuffer();

  const rm = await sharp(reflected).metadata();
  const rw = rm.width ?? bounds.width;
  const rh = rm.height ?? 20;

  const fadeSvg = `
    <svg width="${rw}" height="${rh}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="f" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="rgb(${floorColor.r},${floorColor.g},${floorColor.b})" stop-opacity="0.22"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#f)"/>
    </svg>`;

  const buffer = await sharp(reflected)
    .composite([{ input: Buffer.from(fadeSvg), blend: "dest-in" }])
    .png()
    .toBuffer();

  return {
    buffer,
    left: productLeft + bounds.left,
    top: footCanvasY - 2,
    blend: "over",
  };
}

export async function measureAlphaFootBottom(productBuffer: Buffer): Promise<number> {
  return (await getAlphaFootBottom(productBuffer)) ?? (await sharp(productBuffer).metadata()).height ?? 0;
}

export async function measureAlphaWidth(productBuffer: Buffer): Promise<number> {
  const bounds = await getAlphaBounds(productBuffer);
  return bounds?.width ?? (await sharp(productBuffer).metadata()).width ?? 0;
}
