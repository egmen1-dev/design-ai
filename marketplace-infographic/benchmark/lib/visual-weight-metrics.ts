/**
 * Quality Cycle 2/3 metrics — benchmark-only, mirrors tmp/quality-cycle-2-analyze.ts
 */
import sharp from "sharp";
import { measureImageCommercialSignals } from "../../src/lib/commercial-fidelity/measure";
import { resolveMeasurementZones } from "../../src/lib/commercial-fidelity/expectations";
import { evaluateCommercialFidelity } from "../../src/lib/commercial-fidelity";
import { WB_COVER } from "../../src/lib/composition/canvas";

const zones = resolveMeasurementZones();

function colorBalance(stats: {
  meanR: number;
  meanG: number;
  meanB: number;
}) {
  return Math.max(stats.meanR, stats.meanG, stats.meanB) - Math.min(stats.meanR, stats.meanG, stats.meanB);
}

async function extractZoneStats(imagePath: string, zone: {
  left: number;
  top: number;
  width: number;
  height: number;
}) {
  const rect = {
    left: Math.round(zone.left * WB_COVER.width),
    top: Math.round(zone.top * WB_COVER.height),
    width: Math.max(1, Math.round(zone.width * WB_COVER.width)),
    height: Math.max(1, Math.round(zone.height * WB_COVER.height)),
  };
  const { data, info } = await sharp(imagePath)
    .resize(WB_COVER.width, WB_COVER.height, { fit: "fill" })
    .extract(rect)
    .raw()
    .toBuffer({ resolveWithObject: true });
  const ch = info.channels;
  const pixels = info.width * info.height;
  let sumR = 0,
    sumG = 0,
    sumB = 0,
    edgeSum = 0;
  const stride = info.width * ch;
  for (let y = 1; y < info.height - 1; y++) {
    for (let x = 1; x < info.width - 1; x++) {
      const idx = y * stride + x * ch;
      const r = data[idx]!;
      const g = data[idx + 1]!;
      const b = data[idx + 2]!;
      sumR += r;
      sumG += g;
      sumB += b;
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      const lR =
        0.2126 * data[idx + ch]! +
        0.7152 * data[idx + ch + 1]! +
        0.0722 * data[idx + ch + 2]!;
      const lD =
        0.2126 * data[idx + stride]! +
        0.7152 * data[idx + stride + 1]! +
        0.0722 * data[idx + stride + 2]!;
      edgeSum += Math.abs(l - lR) + Math.abs(l - lD);
    }
  }
  const meanR = sumR / pixels;
  const meanG = sumG / pixels;
  const meanB = sumB / pixels;
  let varR = 0,
    varG = 0,
    varB = 0;
  for (let i = 0; i < data.length; i += ch) {
    varR += (data[i]! - meanR) ** 2;
    varG += (data[i + 1]! - meanG) ** 2;
    varB += (data[i + 2]! - meanB) ** 2;
  }
  const stdR = Math.sqrt(varR / pixels);
  const stdG = Math.sqrt(varG / pixels);
  const stdB = Math.sqrt(varB / pixels);
  const edgeDensity = edgeSum / (pixels * 255 * 2);
  return { meanR, meanG, meanB, stdR, stdG, stdB, edgeDensity };
}

export type VisualWeightMetrics = {
  productAreaPct: number;
  foregroundIsolation: number;
  objectSharpness: number;
  objectContrast: number;
  localContrast: number;
  visualWeightHero: number;
  productDominanceScore: number;
  commercialFidelityScore: number;
};

export async function measureVisualWeightMetrics(imagePath: string): Promise<VisualWeightMetrics> {
  const commercial = await measureImageCommercialSignals({
    imagePath,
    heroZone: zones.hero,
    headlineZone: zones.headline,
    scenePreference: "commercial_studio",
  });
  const global = await extractZoneStats(imagePath, { left: 0, top: 0, width: 1, height: 1 });
  const hero = commercial.heroStats;
  const fidelity = await evaluateCommercialFidelity({ imagePath });

  const objectContrast = (hero.stdR + hero.stdG + hero.stdB) / 3;
  const edgeContrast = hero.edgeDensity * 100;
  const objectSharpness = edgeContrast + objectContrast * 0.4;
  const localContrast = edgeContrast * 0.6 + objectContrast * 0.4;
  const foregroundIsolation = (hero.edgeDensity / (global.edgeDensity + 0.0001)) * 50;
  const visualWeightHero = edgeContrast + hero.stdR * 0.3;

  return {
    productAreaPct: commercial.productAreaPct,
    foregroundIsolation: Number(foregroundIsolation.toFixed(1)),
    objectSharpness: Number(objectSharpness.toFixed(1)),
    objectContrast: Number(objectContrast.toFixed(1)),
    localContrast: Number(localContrast.toFixed(1)),
    visualWeightHero: Number(visualWeightHero.toFixed(1)),
    productDominanceScore: commercial.productDominanceScore,
    commercialFidelityScore: fidelity.diagnostics.commercialFidelityScore,
  };
}
