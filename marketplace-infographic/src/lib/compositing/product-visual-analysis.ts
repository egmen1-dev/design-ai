import sharp from "sharp";
import type { ProductOrientation, ProductShape } from "@/lib/design/scene-planner";

export type ProductVisualProfile = {
  orientation: ProductOrientation;
  shape: ProductShape;
  dominantColors: string[];
  aspectRatio: number;
};

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0")).join("")}`;
}

/** Быстрый визуальный анализ фото товара для Scene Planner */
export async function analyzeProductVisual(buffer: Buffer): Promise<ProductVisualProfile> {
  const meta = await sharp(buffer).metadata();
  const w = meta.width ?? 1;
  const h = meta.height ?? 1;
  const aspectRatio = w / h;

  const orientation: ProductOrientation =
    aspectRatio > 1.15 ? "landscape" : aspectRatio < 0.87 ? "portrait" : "square";

  const shape: ProductShape =
    orientation === "square"
      ? "compact"
      : aspectRatio > 1.5
        ? "wide"
        : aspectRatio < 0.65
          ? "tall"
          : "standard";

  const { data, info } = await sharp(buffer)
    .resize(64, 64, { fit: "inside" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const buckets = new Map<string, number>();
  for (let i = 0; i < data.length; i += info.channels) {
    const r = Math.round(data[i] / 32) * 32;
    const g = Math.round(data[i + 1] / 32) * 32;
    const b = Math.round(data[i + 2] / 32) * 32;
    const key = `${r},${g},${b}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const dominantColors = [...buckets.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([key]) => {
      const [r, g, b] = key.split(",").map(Number);
      return rgbToHex(r, g, b);
    });

  return {
    orientation,
    shape,
    dominantColors: dominantColors.length ? dominantColors : ["#e8e8e8", "#404040"],
    aspectRatio: Math.round(aspectRatio * 100) / 100,
  };
}
