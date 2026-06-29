import sharp from "sharp";
import type { SceneLightingProfile } from "./scene-analysis";
import type { Rgb } from "./scene-analysis";
import { getAlphaBounds } from "./ground-detector";

export type ShadowType = "contact" | "ambient" | "directional" | "alpha-contact" | "ambient-occlusion";

export type ShadowLayer = {
  buffer: Buffer;
  width: number;
  height: number;
  left: number;
  top: number;
  type: ShadowType;
};

export type ShadowGeneratorInput = {
  productWidth: number;
  productHeight: number;
  productLeft: number;
  productTop: number;
  /** Нижняя точка силуэта внутри cutout (px от верха изображения) */
  alphaFootBottom: number;
  /** Y на холсте, куда должны стоять «ноги» */
  footCanvasY: number;
  lighting: SceneLightingProfile;
  shadowProfile: "contact" | "ambient" | "directional" | "mixed";
  productBuffer?: Buffer;
  floorColor?: Rgb;
  lightingDirectionOverride?: string;
};

function normalizeDirection(
  raw?: string,
  fallback: SceneLightingProfile["direction"] = "ambient",
): SceneLightingProfile["direction"] {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("left") && s.includes("top")) return "top-left";
  if (s.includes("right") && s.includes("top")) return "top-right";
  if (s.includes("left") || s.includes("слева")) return "left";
  if (s.includes("right") || s.includes("справа")) return "right";
  if (s.includes("top") || s.includes("верх") || s.includes("overhead")) return "top";
  return fallback;
}

function lightOffset(
  direction: SceneLightingProfile["direction"],
): { x: number; y: number } {
  const map: Record<SceneLightingProfile["direction"], { x: number; y: number }> = {
    left: { x: 0.14, y: 0.03 },
    right: { x: -0.14, y: 0.03 },
    top: { x: 0, y: 0.06 },
    "top-left": { x: 0.12, y: 0.05 },
    "top-right": { x: -0.12, y: 0.05 },
    ambient: { x: 0, y: 0.02 },
  };
  return map[direction];
}

async function renderShadow(
  width: number,
  height: number,
  type: ShadowType,
  perspectiveSkew: number,
  opacity: number,
  blur: number,
  floorColor?: Rgb,
): Promise<Buffer> {
  const base = floorColor ?? { r: 0, g: 0, b: 0 };
  const rx = type === "contact" ? width * 0.44 : width * 0.5;
  const ry = type === "contact" ? height * 0.34 : height * 0.4;
  const skew = type === "directional" ? perspectiveSkew : perspectiveSkew * 0.55;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="s" cx="${50 + skew * 22}%" cy="50%" rx="50%" ry="42%">
          <stop offset="0%" stop-color="rgb(${base.r},${base.g},${base.b})" stop-opacity="${opacity}"/>
          <stop offset="55%" stop-color="rgb(${base.r},${base.g},${base.b})" stop-opacity="${opacity * 0.55}"/>
          <stop offset="100%" stop-color="rgb(${base.r},${base.g},${base.b})" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="${width / 2 + skew * width * 0.1}" cy="${height / 2}"
        rx="${rx}" ry="${ry}" fill="url(#s)"
        transform="skewX(${skew * 14})"/>
    </svg>`;

  return sharp(Buffer.from(svg)).blur(blur).ensureAlpha().png().toBuffer();
}

/** Тень по силуэту cutout — привязка к реальным «ногам» товара. */
async function renderAlphaContactShadow(
  productBuffer: Buffer,
  opacity: number,
  blur: number,
  skewX: number,
  floorColor?: Rgb,
): Promise<{ buffer: Buffer; width: number; height: number } | null> {
  const bounds = await getAlphaBounds(productBuffer);
  if (!bounds) return null;

  const meta = await sharp(productBuffer).metadata();
  const w = meta.width ?? bounds.width;
  const h = meta.height ?? bounds.height;

  const footTop = bounds.top + Math.round(bounds.height * 0.72);
  const footHeight = Math.max(8, bounds.bottom - footTop + 2);

  const alphaSlice = await sharp(productBuffer)
    .ensureAlpha()
    .extract({
      left: bounds.left,
      top: footTop,
      width: bounds.width,
      height: footHeight,
    })
    .resize(Math.round(bounds.width * 1.05), Math.max(12, Math.round(footHeight * 1.8)), {
      fit: "fill",
    })
    .greyscale()
    .linear(1.2, -20)
    .blur(blur)
    .toBuffer();

  const sliceMeta = await sharp(alphaSlice).metadata();
  const sw = sliceMeta.width ?? bounds.width;
  const sh = sliceMeta.height ?? 20;

  const dark = floorColor ?? { r: 0, g: 0, b: 0 };
  const tinted = await sharp(alphaSlice)
    .composite([
      {
        input: {
          create: {
            width: sw,
            height: sh,
            channels: 4,
            background: { r: dark.r, g: dark.g, b: dark.b, alpha: Math.round(opacity * 255) },
          },
        },
        blend: "dest-in",
      },
    ])
  .png()
  .toBuffer();

  if (Math.abs(skewX) > 0.02) {
    const skewed = await sharp(tinted)
      .affine([1, skewX * 0.35, 0, 1], { background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    const sm = await sharp(skewed).metadata();
    return { buffer: skewed, width: sm.width ?? sw, height: sm.height ?? sh };
  }

  return { buffer: tinted, width: sw, height: sh };
}

async function renderAmbientOcclusion(
  productWidth: number,
  productHeight: number,
  offset: { x: number; y: number },
  floorColor?: Rgb,
): Promise<Buffer> {
  const w = Math.round(productWidth * 0.82);
  const h = Math.max(24, Math.round(productHeight * 0.09));
  const base = floorColor ?? { r: 0, g: 0, b: 0 };

  const svg = `
    <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="ao" cx="${50 + offset.x * 30}%" cy="35%" rx="52%" ry="48%">
          <stop offset="0%" stop-color="rgb(${base.r},${base.g},${base.b})" stop-opacity="0.62"/>
          <stop offset="65%" stop-color="rgb(${base.r},${base.g},${base.b})" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="rgb(${base.r},${base.g},${base.b})" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="${w / 2 + offset.x * w * 0.08}" cy="${h * 0.42}"
        rx="${w * 0.46}" ry="${h * 0.38}" fill="url(#ao)"/>
    </svg>`;

  return sharp(Buffer.from(svg)).blur(6).ensureAlpha().png().toBuffer();
}

/** Генерирует набор теней с перспективой под направление света */
export async function generateShadows(input: ShadowGeneratorInput): Promise<ShadowLayer[]> {
  const {
    productWidth,
    productHeight,
    productLeft,
    productTop,
    alphaFootBottom,
    footCanvasY,
    lighting,
    shadowProfile,
    productBuffer,
    floorColor,
    lightingDirectionOverride,
  } = input;

  const direction = normalizeDirection(lightingDirectionOverride, lighting.direction);
  const offset = lightOffset(direction);
  const layers: ShadowLayer[] = [];
  const footY = footCanvasY;

  if (productBuffer) {
    const alphaShadow = await renderAlphaContactShadow(
      productBuffer,
      0.78,
      8,
      offset.x,
      floorColor,
    );
    if (alphaShadow) {
      const left =
        productLeft +
        Math.round((productWidth - alphaShadow.width) / 2) +
        Math.round(offset.x * productWidth * 0.3);
      const top = footY - Math.round(alphaShadow.height * 0.42);
      layers.push({
        buffer: alphaShadow.buffer,
        width: alphaShadow.width,
        height: alphaShadow.height,
        left,
        top,
        type: "alpha-contact",
      });
    }
  }

  const aoBuffer = await renderAmbientOcclusion(productWidth, productHeight, offset, floorColor);
  const aoW = Math.round(productWidth * 0.78);
  const aoH = Math.max(20, Math.round(productHeight * 0.07));
  layers.push({
    buffer: aoBuffer,
    width: aoW,
    height: aoH,
    left:
      productLeft +
      Math.round((productWidth - aoW) / 2) +
      Math.round(offset.x * productWidth * 0.2),
    top: footY - Math.round(aoH * 0.55),
    type: "ambient-occlusion",
  });

  const types: ShadowType[] =
    shadowProfile === "mixed"
      ? ["contact", "directional"]
      : shadowProfile === "contact"
        ? ["contact", "directional"]
        : shadowProfile === "directional"
          ? ["directional"]
          : ["contact"];

  for (const type of types) {
    const scale = type === "contact" ? 0.74 : 0.58;
    const w = Math.round(productWidth * scale);
    const h = Math.max(28, Math.round(productHeight * (type === "contact" ? 0.085 : 0.1)));
    const opacity = type === "contact" ? 0.58 : 0.36;
    const blur = type === "contact" ? 12 : 18;

    const buffer = await renderShadow(w, h, type, offset.x, opacity, blur, floorColor);
    const left =
      productLeft +
      Math.round((productWidth - w) / 2) +
      Math.round(offset.x * productWidth * 0.55);
    const top = footY - Math.round(h * 0.22) + Math.round(offset.y * productHeight * 0.15);

    layers.push({ buffer, width: w, height: h, left, top, type });
  }

  return layers;
}
