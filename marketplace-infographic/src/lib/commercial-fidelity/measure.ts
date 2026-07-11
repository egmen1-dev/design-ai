import sharp from "sharp";
import { WB_COVER } from "@/lib/composition/canvas";
import type { ZoneGeometry } from "./expectations";

export type ZoneImageStats = {
  meanR: number;
  meanG: number;
  meanB: number;
  stdR: number;
  stdG: number;
  stdB: number;
  edgeDensity: number;
  luminance: number;
  pixelCount: number;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function toRect(zone: ZoneGeometry) {
  return {
    left: Math.round(zone.left * WB_COVER.width),
    top: Math.round(zone.top * WB_COVER.height),
    width: Math.max(1, Math.round(zone.width * WB_COVER.width)),
    height: Math.max(1, Math.round(zone.height * WB_COVER.height)),
  };
}

async function extractZoneStats(
  imagePath: string,
  zone: ZoneGeometry,
): Promise<ZoneImageStats> {
  const rect = toRect(zone);
  const { data, info } = await sharp(imagePath)
    .resize(WB_COVER.width, WB_COVER.height, { fit: "fill" })
    .extract(rect)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels;
  const pixels = info.width * info.height;
  let sumR = 0;
  let sumG = 0;
  let sumB = 0;
  let sumL = 0;
  let edgeSum = 0;

  for (let i = 0; i < data.length; i += channels) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    sumR += r;
    sumG += g;
    sumB += b;
    sumL += 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  const meanR = sumR / pixels;
  const meanG = sumG / pixels;
  const meanB = sumB / pixels;
  const luminance = sumL / pixels;

  let varR = 0;
  let varG = 0;
  let varB = 0;
  for (let i = 0; i < data.length; i += channels) {
    varR += (data[i]! - meanR) ** 2;
    varG += (data[i + 1]! - meanG) ** 2;
    varB += (data[i + 2]! - meanB) ** 2;
  }

  const stdR = Math.sqrt(varR / pixels);
  const stdG = Math.sqrt(varG / pixels);
  const stdB = Math.sqrt(varB / pixels);

  const stride = info.width * channels;
  for (let y = 1; y < info.height - 1; y++) {
    for (let x = 1; x < info.width - 1; x++) {
      const idx = y * stride + x * channels;
      const l =
        0.2126 * data[idx]! + 0.7152 * data[idx + 1]! + 0.0722 * data[idx + 2]!;
      const lRight =
        0.2126 * data[idx + channels]! +
        0.7152 * data[idx + channels + 1]! +
        0.0722 * data[idx + channels + 2]!;
      const lDown =
        0.2126 * data[idx + stride]! +
        0.7152 * data[idx + stride + 1]! +
        0.0722 * data[idx + stride + 2]!;
      edgeSum += Math.abs(l - lRight) + Math.abs(l - lDown);
    }
  }

  const edgeDensity = edgeSum / (pixels * 255 * 2);

  return {
    meanR,
    meanG,
    meanB,
    stdR,
    stdG,
    stdB,
    edgeDensity,
    luminance,
    pixelCount: pixels,
  };
}

function colorDistance(a: ZoneImageStats, b: ZoneImageStats): number {
  const dr = a.meanR - b.meanR;
  const dg = a.meanG - b.meanG;
  const db = a.meanB - b.meanB;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

function zoneCanvasPct(zone: ZoneGeometry): number {
  return zone.width * zone.height * 100;
}

export type ImageMeasurements = {
  productAreaPct: number;
  productDominanceScore: number;
  visualHierarchyScore: number;
  backgroundSeparationScore: number;
  sceneConsistencyScore: number;
  measurementMode: "background" | "composite" | "unknown";
  heroStats: ZoneImageStats;
  headlineStats: ZoneImageStats;
  globalStats: ZoneImageStats;
};

export async function measureImageCommercialSignals(input: {
  imagePath: string;
  heroZone: ZoneGeometry;
  headlineZone: ZoneGeometry;
  scenePreference?: string;
}): Promise<ImageMeasurements> {
  const heroStats = await extractZoneStats(input.imagePath, input.heroZone);
  const headlineStats = await extractZoneStats(input.imagePath, input.headlineZone);
  const globalStats = await extractZoneStats(input.imagePath, {
    left: 0,
    top: 0,
    width: 1,
    height: 1,
  });

  const meta = await sharp(input.imagePath).metadata();
  const hasAlpha = (meta.channels ?? 3) === 4;
  const measurementMode: ImageMeasurements["measurementMode"] = hasAlpha
    ? "composite"
    : "background";

  const heroZonePct = zoneCanvasPct(input.heroZone);
  const clarityScore = clamp(1 - heroStats.edgeDensity * 2.8, 0.35, 1);
  const productAreaPct = Math.round(heroZonePct * clarityScore);

  const heroEnergy = heroStats.edgeDensity * 100 + heroStats.stdR * 0.2;
  const headlineEnergy = headlineStats.edgeDensity * 100 + headlineStats.stdR * 0.2;
  const totalEnergy = heroEnergy + headlineEnergy + 0.001;
  const productDominanceScore = Math.round((heroEnergy / totalEnergy) * 100);
  const visualHierarchyScore = Math.round((heroEnergy / totalEnergy) * 100);

  const separationDistance = colorDistance(heroStats, headlineStats);
  const backgroundSeparationScore = Math.round(clamp(separationDistance / 1.8, 0, 100));

  const scene = input.scenePreference ?? "commercial_studio";
  let sceneConsistencyScore = 70;
  switch (scene) {
    case "outdoor_natural":
      sceneConsistencyScore = Math.round(
        clamp((heroStats.meanG - heroStats.meanR) * 0.6 + heroStats.meanG * 0.15, 0, 100),
      );
      break;
    case "industrial_technical":
      sceneConsistencyScore = Math.round(
        clamp(100 - Math.abs(heroStats.meanR - heroStats.meanG) * 0.4 - heroStats.stdR * 0.25, 0, 100),
      );
      break;
    case "light_modern":
      sceneConsistencyScore = Math.round(
        clamp(heroStats.luminance / 2.2 + (100 - heroStats.stdR) * 0.3, 0, 100),
      );
      break;
    case "commercial_studio":
    default:
      sceneConsistencyScore = Math.round(
        clamp(heroStats.luminance / 2.4 + (100 - heroStats.edgeDensity * 120), 0, 100),
      );
      break;
  }

  return {
    productAreaPct,
    productDominanceScore,
    visualHierarchyScore,
    backgroundSeparationScore,
    sceneConsistencyScore,
    measurementMode,
    heroStats,
    headlineStats,
    globalStats,
  };
}
