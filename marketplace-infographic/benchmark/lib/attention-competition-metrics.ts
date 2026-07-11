/**
 * Quality Cycle 4 — Attention Competition metrics (benchmark/research only).
 */
import sharp from "sharp";
import { resolveMeasurementZones } from "../../src/lib/commercial-fidelity/expectations";
import { measureImageCommercialSignals } from "../../src/lib/commercial-fidelity/measure";
import { WB_COVER } from "../../src/lib/composition/canvas";

export type Zone = { left: number; top: number; width: number; height: number };

export const ATTENTION_ZONES = {
  ...resolveMeasurementZones(),
  benefits: { left: 0.08, top: 0.38, width: 0.38, height: 0.12 },
  cta: { left: 0.08, top: 0.83, width: 0.22, height: 0.06 },
  leftColumn: { left: 0.04, top: 0.05, width: 0.38, height: 0.52 },
  background: { left: 0, top: 0, width: 0.4, height: 1 },
} as const;

function toRect(zone: Zone) {
  return {
    left: Math.round(zone.left * WB_COVER.width),
    top: Math.round(zone.top * WB_COVER.height),
    width: Math.max(1, Math.round(zone.width * WB_COVER.width)),
    height: Math.max(1, Math.round(zone.height * WB_COVER.height)),
  };
}

export type ZoneStats = {
  meanR: number;
  meanG: number;
  meanB: number;
  stdR: number;
  stdG: number;
  stdB: number;
  luminance: number;
  edgeDensity: number;
  highlightPct: number;
  darkPct: number;
  leftLum: number;
  rightLum: number;
  topLum: number;
  bottomLum: number;
  symmetryDelta: number;
  edgeComX: number;
  edgeComY: number;
  activeTextPct: number;
  localPeakCount: number;
};

export async function extractZoneStats(imagePath: string, zone: Zone): Promise<ZoneStats> {
  const rect = toRect(zone);
  const { data, info } = await sharp(imagePath)
    .resize(WB_COVER.width, WB_COVER.height, { fit: "fill" })
    .extract(rect)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const ch = info.channels;
  const w = info.width;
  const h = info.height;
  const pixels = w * h;
  const stride = w * ch;

  let sumR = 0,
    sumG = 0,
    sumB = 0,
    sumL = 0;
  let varR = 0,
    varG = 0,
    varB = 0;
  let edgeSum = 0;
  let highlights = 0;
  let darks = 0;
  let leftL = 0,
    rightL = 0,
    topL = 0,
    botL = 0;
  let leftN = 0,
    rightN = 0,
    topN = 0,
    botN = 0;
  const edgeX: number[] = [];
  const edgeY: number[] = [];
  const edgeGrid: number[] = new Array(pixels).fill(0);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * stride + x * ch;
      const r = data[idx]!;
      const g = data[idx + 1]!;
      const b = data[idx + 2]!;
      const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      sumR += r;
      sumG += g;
      sumB += b;
      sumL += l;
      if (l > 200) highlights++;
      if (l < 55) darks++;
      if (x < w / 2) {
        leftL += l;
        leftN++;
      } else {
        rightL += l;
        rightN++;
      }
      if (y < h / 3) {
        topL += l;
        topN++;
      } else if (y > (2 * h) / 3) {
        botL += l;
        botN++;
      }
    }
  }

  const meanR = sumR / pixels;
  const meanG = sumG / pixels;
  const meanB = sumB / pixels;
  const luminance = sumL / pixels;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * stride + x * ch;
      varR += (data[idx]! - meanR) ** 2;
      varG += (data[idx + 1]! - meanG) ** 2;
      varB += (data[idx + 2]! - meanB) ** 2;
    }
  }

  const stdR = Math.sqrt(varR / pixels);
  const stdG = Math.sqrt(varG / pixels);
  const stdB = Math.sqrt(varB / pixels);

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
      edgeSum += e;
      edgeGrid[y * w + x] = e;
      if (e > 25) {
        edgeX.push(x);
        edgeY.push(y);
      }
    }
  }

  let activeText = 0;
  let peaks = 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const e = edgeGrid[y * w + x]!;
      if (e > 35) activeText++;
      const c = edgeGrid[y * w + x]!;
      const n = edgeGrid[(y - 1) * w + x]!;
      const s = edgeGrid[(y + 1) * w + x]!;
      const wL = edgeGrid[y * w + (x - 1)]!;
      const wR = edgeGrid[y * w + (x + 1)]!;
      if (c > 45 && c >= n && c >= s && c >= wL && c >= wR) peaks++;
    }
  }

  const edgeDensity = edgeSum / (pixels * 255 * 2);
  const comX = edgeX.length ? edgeX.reduce((a, b) => a + b, 0) / edgeX.length / w : 0.5;
  const comY = edgeY.length ? edgeY.reduce((a, b) => a + b, 0) / edgeY.length / h : 0.5;

  return {
    meanR,
    meanG,
    meanB,
    stdR,
    stdG,
    stdB,
    luminance,
    edgeDensity,
    highlightPct: (highlights / pixels) * 100,
    darkPct: (darks / pixels) * 100,
    leftLum: leftL / (leftN || 1),
    rightLum: rightL / (rightN || 1),
    topLum: topL / (topN || 1),
    bottomLum: botL / (botN || 1),
    symmetryDelta: Math.abs(leftL / (leftN || 1) - rightL / (rightN || 1)),
    edgeComX: comX,
    edgeComY: comY,
    activeTextPct: (activeText / pixels) * 100,
    localPeakCount: peaks,
  };
}

function zoneCanvasPct(zone: Zone) {
  return Number((zone.width * zone.height * 100).toFixed(1));
}

function visualWeight(stats: ZoneStats) {
  return Number((stats.edgeDensity * 100 + stats.stdR * 0.3).toFixed(1));
}

function zoneContrast(stats: ZoneStats) {
  return Number(((stats.stdR + stats.stdG + stats.stdB) / 3).toFixed(1));
}

export type AttentionCompetitionMetrics = {
  productAreaPct: number;
  productDominanceScore: number;
  headlineVisualWeight: number;
  badgeVisualWeight: number;
  typographyDensity: number;
  typographyContrast: number;
  badgeCount: number;
  badgeAreaPct: number;
  headlineAreaPct: number;
  textAreaPct: number;
  negativeSpace: number;
  eyePathScore: number;
  primaryFocusRatio: number;
  secondaryFocusRatio: number;
  visualClutter: number;
  attentionCompetitionIndex: number;
  visualBalance: number;
  informationDensity: number;
  whitespaceRatio: number;
  productVisualWeight: number;
  typographyCompetition: number;
  badgeCompetition: number;
  backgroundCompetition: number;
  visualNoise: number;
  productAttention: number;
  foregroundIsolation: number;
  textCompetition: number;
};

export async function measureAttentionCompetition(imagePath: string): Promise<AttentionCompetitionMetrics> {
  const commercial = await measureImageCommercialSignals({
    imagePath,
    heroZone: ATTENTION_ZONES.hero,
    headlineZone: ATTENTION_ZONES.headline,
    scenePreference: "commercial_studio",
  });

  const [hero, headline, benefits, cta, leftColumn, global, background] = await Promise.all([
    extractZoneStats(imagePath, ATTENTION_ZONES.hero),
    extractZoneStats(imagePath, ATTENTION_ZONES.headline),
    extractZoneStats(imagePath, ATTENTION_ZONES.benefits),
    extractZoneStats(imagePath, ATTENTION_ZONES.cta),
    extractZoneStats(imagePath, ATTENTION_ZONES.leftColumn),
    extractZoneStats(imagePath, { left: 0, top: 0, width: 1, height: 1 }),
    extractZoneStats(imagePath, ATTENTION_ZONES.background),
  ]);

  const productVisualWeight = visualWeight(hero);
  const headlineVisualWeight = visualWeight(headline);
  const badgeVisualWeight = visualWeight(cta);
  const benefitsVisualWeight = visualWeight(benefits);

  const headlineAreaPct = Number((zoneCanvasPct(ATTENTION_ZONES.headline) * (headline.activeTextPct / 100)).toFixed(1));
  const badgeAreaPct = Number((zoneCanvasPct(ATTENTION_ZONES.cta) * Math.min(1, cta.activeTextPct / 40 + cta.highlightPct / 100)).toFixed(1));
  const textAreaPct = Number(
    (
      headlineAreaPct +
      zoneCanvasPct(ATTENTION_ZONES.benefits) * (benefits.activeTextPct / 100)
    ).toFixed(1),
  );

  const typographyDensity = Number((headline.edgeDensity * 100 + benefits.edgeDensity * 60).toFixed(1));
  const typographyContrast = zoneContrast(headline);
  const badgeCount = Math.max(1, Math.round(cta.localPeakCount / 12));

  const negativeSpace = Number((100 - commercial.productAreaPct - textAreaPct - badgeAreaPct).toFixed(1));
  const eyePathScore = Number(
    (100 - Math.abs(headline.edgeComY - hero.edgeComY) * 80 - Math.abs(headline.edgeComX - hero.edgeComX) * 40).toFixed(1),
  );

  const totalWeight = productVisualWeight + headlineVisualWeight + badgeVisualWeight + benefitsVisualWeight + 0.01;
  const primaryFocusRatio = Number((productVisualWeight / totalWeight).toFixed(3));
  const secondaryFocusRatio = Number(
    ((headlineVisualWeight + badgeVisualWeight + benefitsVisualWeight) / totalWeight).toFixed(3),
  );

  const visualClutter = Number((global.edgeDensity * 100 - hero.edgeDensity * 30).toFixed(1));
  const backgroundCompetition = Number((background.edgeDensity * 100).toFixed(1));
  const typographyCompetition = Number((headlineVisualWeight + benefitsVisualWeight * 0.7).toFixed(1));
  const badgeCompetition = badgeVisualWeight;
  const visualNoise = Number(Math.max(0, visualClutter - backgroundCompetition * 0.2).toFixed(1));
  const textCompetition = Number((typographyCompetition + typographyDensity * 0.15).toFixed(1));

  const attentionCompetitionIndex = Number(
    (typographyCompetition * 0.35 + badgeCompetition * 0.2 + backgroundCompetition * 0.15 + visualNoise * 0.3).toFixed(1),
  );

  const visualBalance = Number((100 - Math.abs(leftColumn.luminance - hero.luminance)).toFixed(1));
  const informationDensity = Number((textAreaPct + badgeAreaPct).toFixed(1));
  const whitespaceRatio = Number(Math.max(0, negativeSpace).toFixed(1));

  const productAttention = Number(
    (
      productVisualWeight -
      typographyCompetition * 0.4 -
      badgeCompetition * 0.25 -
      backgroundCompetition * 0.1 -
      visualNoise * 0.25
    ).toFixed(1),
  );

  const foregroundIsolation = Number(
    ((hero.edgeDensity / (global.edgeDensity + 0.0001)) * 50).toFixed(1),
  );

  return {
    productAreaPct: commercial.productAreaPct,
    productDominanceScore: commercial.productDominanceScore,
    headlineVisualWeight,
    badgeVisualWeight,
    typographyDensity,
    typographyContrast,
    badgeCount,
    badgeAreaPct,
    headlineAreaPct,
    textAreaPct,
    negativeSpace,
    eyePathScore,
    primaryFocusRatio,
    secondaryFocusRatio,
    visualClutter,
    attentionCompetitionIndex,
    visualBalance,
    informationDensity,
    whitespaceRatio,
    productVisualWeight,
    typographyCompetition,
    badgeCompetition,
    backgroundCompetition,
    visualNoise,
    productAttention,
    foregroundIsolation,
    textCompetition,
  };
}

export function pearson(xs: number[], ys: number[]): number {
  const n = xs.length;
  if (n < 3) return 0;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i]! - mx;
    const b = ys[i]! - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  return den === 0 ? 0 : num / den;
}

export function cohortStats(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  const n = s.length || 1;
  const sum = s.reduce((a, b) => a + b, 0);
  const p = (q: number) => s[Math.min(n - 1, Math.floor(q * (n - 1)))] ?? 0;
  return {
    n: s.length,
    mean: Number((sum / n).toFixed(2)),
    median: Number(p(0.5).toFixed(2)),
    p25: Number(p(0.25).toFixed(2)),
    p75: Number(p(0.75).toFixed(2)),
  };
}
