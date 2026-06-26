import sharp from "sharp";
import type { SurfaceType } from "@/lib/design/scene-planner";

export type ReflectionInput = {
  productBuffer: Buffer;
  productWidth: number;
  productHeight: number;
  productLeft: number;
  productTop: number;
  surfaceType: SurfaceType;
};

const REFLECTIVE_SURFACES: SurfaceType[] = [
  "studio_floor",
  "glass",
  "tile",
  "water",
  "gloss",
];

/** Проверяет, допустимо ли отражение для данной поверхности */
export function shouldGenerateReflection(surfaceType: SurfaceType): boolean {
  return REFLECTIVE_SURFACES.includes(surfaceType);
}

/** Слабое отражение товара — только для глянцевых поверхностей */
export async function generateReflection(
  input: ReflectionInput,
): Promise<{ buffer: Buffer; left: number; top: number } | null> {
  if (!shouldGenerateReflection(input.surfaceType)) return null;

  const intensity =
    input.surfaceType === "water"
      ? 0.28
      : input.surfaceType === "glass" || input.surfaceType === "gloss"
        ? 0.32
        : 0.22;

  const reflectH = Math.round(input.productHeight * 0.2);
  const reflected = await sharp(input.productBuffer)
    .flip()
    .resize(input.productWidth, reflectH, { fit: "cover", position: "top" })
    .linear(0.85, -30)
    .blur(input.surfaceType === "water" ? 2.5 : 1.2)
    .ensureAlpha()
    .png()
    .toBuffer();

  const fadeSvg = `
    <svg width="${input.productWidth}" height="${reflectH}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="white" stop-opacity="${intensity}"/>
          <stop offset="100%" stop-color="white" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="100%" height="100%" fill="url(#fade)"/>
    </svg>`;

  const buffer = await sharp(reflected)
    .composite([{ input: Buffer.from(fadeSvg), blend: "dest-in" }])
    .png()
    .toBuffer();

  return {
    buffer,
    left: input.productLeft,
    top: input.productTop + input.productHeight - 3,
  };
}
