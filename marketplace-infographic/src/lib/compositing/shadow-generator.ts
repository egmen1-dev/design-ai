import sharp from "sharp";
import type { SceneLightingProfile } from "./scene-analysis";

export type ShadowType = "contact" | "ambient" | "directional";

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
  lighting: SceneLightingProfile;
  shadowProfile: "contact" | "ambient" | "directional" | "mixed";
};

function lightOffset(
  direction: SceneLightingProfile["direction"],
): { x: number; y: number } {
  const map: Record<SceneLightingProfile["direction"], { x: number; y: number }> = {
    left: { x: 0.12, y: 0.04 },
    right: { x: -0.12, y: 0.04 },
    top: { x: 0, y: 0.08 },
    "top-left": { x: 0.1, y: 0.06 },
    "top-right": { x: -0.1, y: 0.06 },
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
): Promise<Buffer> {
  const rx = type === "contact" ? width * 0.42 : width * 0.48;
  const ry = type === "contact" ? height * 0.32 : height * 0.38;
  const skew = type === "directional" ? perspectiveSkew : perspectiveSkew * 0.5;

  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="s" cx="${50 + skew * 20}%" cy="50%" rx="50%" ry="40%">
          <stop offset="0%" stop-color="black" stop-opacity="${opacity}"/>
          <stop offset="70%" stop-color="black" stop-opacity="${opacity * 0.45}"/>
          <stop offset="100%" stop-color="black" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <ellipse cx="${width / 2 + skew * width * 0.08}" cy="${height / 2}"
        rx="${rx}" ry="${ry}" fill="url(#s)"
        transform="skewX(${skew * 12})"/>
    </svg>`;

  return sharp(Buffer.from(svg)).blur(blur).ensureAlpha().png().toBuffer();
}

/** Генерирует набор теней с перспективой под направление света */
export async function generateShadows(input: ShadowGeneratorInput): Promise<ShadowLayer[]> {
  const { productWidth, productHeight, productLeft, productTop, lighting, shadowProfile } =
    input;
  const offset = lightOffset(lighting.direction);
  const layers: ShadowLayer[] = [];

  const types: ShadowType[] =
    shadowProfile === "mixed"
      ? ["contact", "ambient"]
      : shadowProfile === "contact"
        ? ["contact", "directional"]
        : shadowProfile === "directional"
          ? ["directional"]
          : ["ambient"];

  for (const type of types) {
    const scale = type === "contact" ? 0.68 : type === "directional" ? 0.55 : 0.82;
    const w = Math.round(productWidth * scale);
    const h = Math.max(20, Math.round(productHeight * (type === "contact" ? 0.05 : 0.07)));
    const opacity =
      type === "contact" ? 0.5 : type === "directional" ? 0.32 : 0.28;
    const blur = type === "contact" ? 8 : type === "directional" ? 16 : 26;

    const buffer = await renderShadow(w, h, type, offset.x, opacity, blur);
    const left =
      productLeft +
      Math.round((productWidth - w) / 2) +
      Math.round(offset.x * productWidth * 0.5);
    const top =
      productTop +
      productHeight -
      Math.round(h * 0.35) +
      Math.round(offset.y * productHeight);

    layers.push({ buffer, width: w, height: h, left, top, type });
  }

  return layers;
}
