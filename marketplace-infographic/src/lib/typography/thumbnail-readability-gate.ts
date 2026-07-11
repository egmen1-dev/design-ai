import sharp from "sharp";
import { resolveMeasurementZones } from "@/lib/commercial-fidelity/expectations";

export const THUMBNAIL_GATE_VERSION = "1.0.0-bv1-sequential";
export const THUMBNAIL_GATE_MIN_SCORE = 55;
export const THUMBNAIL_GRID_W = 120;
export const THUMBNAIL_GRID_H = 160;

const zones = resolveMeasurementZones();

export type ThumbnailReadabilityResult = {
  score: number;
  passed: boolean;
  productVisibility: number;
  headlineReadability: number;
  warnings: string[];
};

export function thumbnailReadabilityGateEnabled(): boolean {
  return process.env.DAOS_THUMBNAIL_READABILITY_GATE !== "0";
}

/** Hero edge saliency at WB mobile grid size 120×160 */
export async function measureThumbnailReadabilityScore(imagePath: string): Promise<number> {
  const { data, info } = await sharp(imagePath)
    .resize(THUMBNAIL_GRID_W, THUMBNAIL_GRID_H, { fit: "fill" })
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels;
  const w = info.width;
  const h = info.height;
  const stride = w * ch;

  const heroRect = {
    left: Math.round(zones.hero.left * w),
    top: Math.round(zones.hero.top * h),
    width: Math.max(1, Math.round(zones.hero.width * w)),
    height: Math.max(1, Math.round(zones.hero.height * h)),
  };

  let globalEdge = 0;
  let heroEdge = 0;
  let globalN = 0;
  let heroN = 0;

  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const idx = y * stride + x * ch;
      const l =
        0.2126 * data[idx]! + 0.7152 * data[idx + 1]! + 0.0722 * data[idx + 2]!;
      const lR =
        0.2126 * data[idx + ch]! +
        0.7152 * data[idx + ch + 1]! +
        0.0722 * data[idx + ch + 2]!;
      const lD =
        0.2126 * data[idx + stride]! +
        0.7152 * data[idx + stride + 1]! +
        0.0722 * data[idx + stride + 2]!;
      const e = Math.abs(l - lR) + Math.abs(l - lD);
      globalEdge += e;
      globalN++;
      if (
        x >= heroRect.left &&
        x < heroRect.left + heroRect.width &&
        y >= heroRect.top &&
        y < heroRect.top + heroRect.height
      ) {
        heroEdge += e;
        heroN++;
      }
    }
  }

  const heroDensity = heroN ? heroEdge / heroN : 0;
  const globalDensity = globalN ? globalEdge / globalN : 0.001;
  const ratio = (heroDensity / globalDensity) * 50;
  const contrastBoost = Math.min(25, heroDensity / 8);
  return Number(Math.min(100, ratio + contrastBoost).toFixed(1));
}

export async function evaluateThumbnailReadabilityGate(
  imagePath: string,
): Promise<ThumbnailReadabilityResult> {
  const score = await measureThumbnailReadabilityScore(imagePath);
  const warnings: string[] = [];
  if (score < THUMBNAIL_GATE_MIN_SCORE) {
    warnings.push(`Thumbnail readability ${score} below gate ${THUMBNAIL_GATE_MIN_SCORE}`);
  }
  const productVisibility = Math.min(100, score * 1.05);
  const headlineReadability = Math.max(0, score - 8);
  if (headlineReadability < 45) {
    warnings.push(`Headline readability proxy ${headlineReadability} low at 120×160`);
  }
  return {
    score,
    passed: score >= THUMBNAIL_GATE_MIN_SCORE,
    productVisibility,
    headlineReadability,
    warnings,
  };
}
