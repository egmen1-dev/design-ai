import sharp from "sharp";
import type { CompositingHints } from "@/lib/design-brief/schema";

type Rgb = { r: number; g: number; b: number };

async function averageRgb(buffer: Buffer): Promise<Rgb> {
  const { data, info } = await sharp(buffer)
    .resize(64, 64, { fit: "cover" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let r = 0;
  let g = 0;
  let b = 0;
  const pixels = info.width * info.height;
  for (let i = 0; i < data.length; i += info.channels) {
    r += data[i];
    g += data[i + 1];
    b += data[i + 2];
  }

  return {
    r: Math.round(r / pixels),
    g: Math.round(g / pixels),
    b: Math.round(b / pixels),
  };
}

function temperatureAdjust(rgb: Rgb, kelvin: number): Rgb {
  const t = (kelvin - 5500) / 5500;
  return {
    r: Math.min(255, Math.max(0, Math.round(rgb.r + t * 18))),
    g: Math.min(255, Math.max(0, Math.round(rgb.g + t * 4))),
    b: Math.min(255, Math.max(0, Math.round(rgb.b - t * 22))),
  };
}

/** Подгоняет товар под освещение фона */
export async function matchProductToBackground(
  productBuffer: Buffer,
  backgroundBuffer: Buffer,
  hints: CompositingHints,
): Promise<Buffer> {
  const bgAvg = await averageRgb(backgroundBuffer);
  const target = temperatureAdjust(bgAvg, hints.lightTemperature);

  const brightness = 0.98 + (target.r + target.g + target.b) / (3 * 255) * 0.06;
  const saturation = hints.lightTemperature > 6000 ? 0.94 : 1.02;

  let pipeline = sharp(productBuffer)
    .ensureAlpha()
    .modulate({ brightness, saturation });

  if (hints.lightDirection.includes("left")) {
    pipeline = pipeline.gamma(1.02);
  }

  return pipeline.png().toBuffer();
}
