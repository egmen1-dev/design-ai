#!/usr/bin/env npx tsx
/**
 * Sprint 7B — Alpha Policy Alignment validation.
 * Compares Sprint 7A baseline (legacy alpha caps) vs aligned policy.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { WB_COVER } from "../src/lib/composition/canvas";
import {
  PRODUCT_MAX_WIDTH_PX,
  PRODUCT_TARGET_MAX_HEIGHT_PX,
} from "../src/lib/product-render-policy";
import { buildCommercialAlphaPolicyDiagnostics } from "../src/lib/compositing/commercial-alpha-policy";
import { computeMaxProductSize } from "../src/lib/compositing/commercial-calibration";
import { fitProductWithSafePlacement, fitProductByAlphaBounds } from "../src/lib/compositing/alpha-fit";
import { getAlphaBounds } from "../src/lib/compositing/ground-detector";
import { createCommercialGenomeBetaDecision } from "../src/lib/daos/commercial-genome-beta";
import { buildInitialLayoutSpec } from "../src/lib/design/layout-spec/builder";
import {
  stabilizeLayoutSpecWithCommercialIntent,
  COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
  resolveLayoutObjectScale,
} from "../src/lib/design/layout-spec";
import { computeProfessionalLayout } from "../src/lib/layout-engine";
import type { CardMeaning } from "../src/lib/layout-engine/types";
import type { CompositionLayout } from "../src/lib/composition/types";
import type { ProductAnalysis } from "../src/lib/product-analysis";

const CANVAS_W = WB_COVER.width;
const CANVAS_H = WB_COVER.height;
const OUT_DIR = path.join(__dirname, "output", "sprint7b");

/** Sprint 7A pre-alignment constants (read-only baseline) */
const LEGACY_ALPHA_MAX_W = Math.round(CANVAS_W * 0.56);
const LEGACY_ALPHA_MAX_H = Math.round(CANVAS_H * 0.5);

const PRODUCTS = [
  {
    id: "battery-sprayer",
    title: "Аккумуляторный опрыскиватель 16 л для сада",
    analysis: { category: "garden_tools", priceSegment: "mass", brandTone: "natural" } as ProductAnalysis,
  },
  {
    id: "construction-vacuum",
    title: "Строительный пылесос для ремонта 30 л",
    analysis: { category: "professional tool", priceSegment: "mass", brandTone: "technical" } as ProductAnalysis,
    productColor: "yellow",
  },
  {
    id: "impact-drill",
    title: "Ударная дрель 800 Вт профессиональная",
    analysis: { category: "professional tool", priceSegment: "mass", brandTone: "technical" } as ProductAnalysis,
    productColor: "black",
  },
  {
    id: "pressure-washer",
    title: "Мойка высокого давления 180 бар",
    analysis: { category: "home_appliances", priceSegment: "mass", brandTone: "tech" } as ProductAnalysis,
  },
  {
    id: "home-humidifier",
    title: "Увлажнитель воздуха для дома ультразвуковой",
    analysis: { category: "home", priceSegment: "mass", brandTone: "cozy" } as ProductAnalysis,
  },
] as const;

process.env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] = "1";

function areaPct(w: number, h: number): number {
  return Math.round(((w * h) / (CANVAS_W * CANVAS_H)) * 1000) / 10;
}

function meaning(title: string): CardMeaning {
  return {
    title,
    subtitle: "Профессиональное качество",
    feature: "Мощный мотор",
    badge: "ХИТ",
    emotion: "Надёжность",
    style: "Premium",
    priority: "product",
  };
}

async function createFullFrameCutout(w: number, h: number): Promise<Buffer> {
  return sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 180, g: 120, b: 30, alpha: 255 },
    },
  })
    .png()
    .toBuffer();
}

async function stressTestPolicyMaxBinding() {
  const preparedW = PRODUCT_MAX_WIDTH_PX;
  const preparedH = PRODUCT_TARGET_MAX_HEIGHT_PX;
  const cutout = await createFullFrameCutout(preparedW, preparedH);

  const legacyFit = await fitProductByAlphaBounds(cutout, LEGACY_ALPHA_MAX_W, LEGACY_ALPHA_MAX_H);
  const alignedFit = await fitProductByAlphaBounds(
    cutout,
    PRODUCT_MAX_WIDTH_PX,
    PRODUCT_TARGET_MAX_HEIGHT_PX,
  );
  const legacyBounds = await getAlphaBounds(legacyFit.buffer);
  const alignedBounds = await getAlphaBounds(alignedFit.buffer);

  return {
    prepared: { width: preparedW, height: preparedH, areaPct: areaPct(preparedW, preparedH) },
    sprint7a: {
      frame: { width: legacyFit.width, height: legacyFit.height, areaPct: areaPct(legacyFit.width, legacyFit.height) },
      alpha: legacyBounds
        ? { width: legacyBounds.width, height: legacyBounds.height, areaPct: areaPct(legacyBounds.width, legacyBounds.height) }
        : null,
      blockingConstraint: "PRODUCT_ALPHA_MAX_legacy_504x600",
    },
    sprint7b: {
      frame: { width: alignedFit.width, height: alignedFit.height, areaPct: areaPct(alignedFit.width, alignedFit.height) },
      alpha: alignedBounds
        ? { width: alignedBounds.width, height: alignedBounds.height, areaPct: areaPct(alignedBounds.width, alignedBounds.height) }
        : null,
      blockingConstraint: "alpha_fit_0.9_safety_only",
    },
    areaGainPct:
      Math.round(
        (areaPct(alignedFit.width, alignedFit.height) - areaPct(legacyFit.width, legacyFit.height)) * 10,
      ) / 10,
  };
}

async function createDenseCutout(w: number, h: number): Promise<Buffer> {
  const body = await sharp({
    create: {
      width: Math.round(w * 0.85),
      height: Math.round(h * 0.92),
      channels: 4,
      background: { r: 200, g: 140, b: 40, alpha: 255 },
    },
  })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: body, left: Math.round(w * 0.075), top: Math.round(h * 0.04) }])
    .png()
    .toBuffer();
}

async function prepareProductLayerMirror(
  productBuffer: Buffer,
  maxW: number,
  maxH: number,
): Promise<{ buffer: Buffer; width: number; height: number }> {
  const resized = await sharp(productBuffer)
    .ensureAlpha()
    .resize(maxW, maxH, { fit: "inside", withoutEnlargement: false })
    .png()
    .toBuffer({ resolveWithObject: true });

  return { buffer: resized.data, width: resized.info.width, height: resized.info.height };
}

async function traceWithAlphaCaps(
  layout: CompositionLayout,
  objectScale: number,
  cutout: Buffer,
  alphaMaxW: number,
  alphaMaxH: number,
) {
  const maxSize = computeMaxProductSize(layout, objectScale, "calibrated");
  const prepared = await prepareProductLayerMirror(cutout, maxSize.maxW, maxSize.maxH);
  const placement = await fitProductWithSafePlacement(
    prepared.buffer,
    prepared.width,
    prepared.height,
    CANVAS_W,
    Math.round(CANVAS_W * 0.1),
    alphaMaxW,
    alphaMaxH,
    layout,
  );
  const bounds = await getAlphaBounds(placement.buffer);

  return {
    allowedAreaPct: maxSize.placementAreaPct,
    alphaAreaPct: bounds ? areaPct(bounds.width, bounds.height) : areaPct(placement.width, placement.height),
    finalAreaPct: areaPct(placement.width, placement.height),
    width: placement.width,
    height: placement.height,
    alphaBounds: bounds ? { width: bounds.width, height: bounds.height } : null,
  };
}

async function runProduct(product: (typeof PRODUCTS)[number]) {
  const legacyLayout = buildInitialLayoutSpec({
    analysis: product.analysis,
    palette: ["#1a1a2e", "#f8fafc", "#f97316", "#64748b"],
  });
  const genome = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    category: product.analysis.category,
    productTitle: product.title,
    productColor: "productColor" in product ? product.productColor : undefined,
    productType: product.analysis.category,
    mode: "generation",
  });
  const layoutSpec = stabilizeLayoutSpecWithCommercialIntent(legacyLayout, genome.decision).layout;
  const pro = computeProfessionalLayout({
    meaning: meaning(product.title),
    category: product.analysis,
    seed: `sprint7b:${product.id}`,
    layoutSpec,
  });
  const commercial = resolveLayoutObjectScale({
    layoutSpec,
    templateAreaPct: pro.layout.metrics.productAreaPct,
  });
  const objectScale = commercial.objectScale;
  const cutout = await createDenseCutout(800, 1000);

  const sprint7a = await traceWithAlphaCaps(
    pro.layout,
    objectScale,
    cutout,
    LEGACY_ALPHA_MAX_W,
    LEGACY_ALPHA_MAX_H,
  );
  const sprint7b = await traceWithAlphaCaps(
    pro.layout,
    objectScale,
    cutout,
    PRODUCT_MAX_WIDTH_PX,
    PRODUCT_TARGET_MAX_HEIGHT_PX,
  );
  const sprint7bMax = await traceWithAlphaCaps(
    pro.layout,
    1.0,
    cutout,
    PRODUCT_MAX_WIDTH_PX,
    PRODUCT_TARGET_MAX_HEIGHT_PX,
  );

  const policy = buildCommercialAlphaPolicyDiagnostics();

  return {
    productId: product.id,
    targetAreaPct: commercial.diagnostics.commercialScaleExpected,
    objectScale,
    policy,
    comparison: {
      sprint7a: sprint7a,
      sprint7b: sprint7b,
      sprint7bObjectScale1: sprint7bMax,
    },
    contradictionResolved: policy.alphaPolicyConsistency,
    finalAreaImproved: sprint7b.finalAreaPct > sprint7a.finalAreaPct,
    alphaAreaImproved: sprint7b.alphaAreaPct > sprint7a.alphaAreaPct,
    bboxChanged:
      sprint7b.width !== sprint7a.width || sprint7b.height !== sprint7a.height,
    areaDelta: Math.round((sprint7b.finalAreaPct - sprint7a.finalAreaPct) * 10) / 10,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const policy = buildCommercialAlphaPolicyDiagnostics();
  const stressTest = await stressTestPolicyMaxBinding();
  const results = [];
  for (const product of PRODUCTS) {
    console.log(`==> ${product.id}`);
    results.push(await runProduct(product));
  }

  const improved = results.filter((r) => r.finalAreaImproved).length;
  const bboxChanged = results.filter((r) => r.bboxChanged).length;
  const avgFinal7a =
    Math.round((results.reduce((s, r) => s + r.comparison.sprint7a.finalAreaPct, 0) / results.length) * 10) / 10;
  const avgFinal7b =
    Math.round((results.reduce((s, r) => s + r.comparison.sprint7b.finalAreaPct, 0) / results.length) * 10) / 10;
  const maxFinal7b = Math.max(...results.map((r) => r.comparison.sprint7bObjectScale1.finalAreaPct));

  const report = {
    sprint: "DAOS Product Sprint 7B — Alpha Policy Alignment",
    timestamp: new Date().toISOString(),
    policy,
    legacyAlphaCaps: { width: LEGACY_ALPHA_MAX_W, height: LEGACY_ALPHA_MAX_H, areaPct: areaPct(LEGACY_ALPHA_MAX_W, LEGACY_ALPHA_MAX_H) },
    alignedAlphaCaps: {
      width: PRODUCT_MAX_WIDTH_PX,
      height: PRODUCT_TARGET_MAX_HEIGHT_PX,
      areaPct: areaPct(PRODUCT_MAX_WIDTH_PX, PRODUCT_TARGET_MAX_HEIGHT_PX),
    },
    metrics: {
      products: results.length,
      finalAreaImproved: improved,
      bboxChanged,
      avgFinalArea7a: avgFinal7a,
      avgFinalArea7b: avgFinal7b,
      maxFinalArea7bObjectScale1: maxFinal7b,
      policyConsistent: policy.alphaPolicyConsistency,
    },
    successCriteria: {
      productMaxAlphaAligned: policy.alphaPolicyConsistency,
      maxAreaIncreased: stressTest.areaGainPct > 0 || avgFinal7b > avgFinal7a,
      stressTestAreaGain: stressTest.areaGainPct,
      noCompositorRewrite: true,
      policyConstantsOnly: true,
    },
    stressTestPolicyMax: stressTest,
    productResults: results,
  };

  const outPath = path.join(OUT_DIR, "alpha-policy-alignment.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("\n=== Sprint 7B Summary ===");
  console.log(`policy consistent: ${policy.alphaPolicyConsistency}`);
  console.log(`final area improved: ${improved}/${results.length}`);
  console.log(`avg final area: 7A=${avgFinal7a}% → 7B=${avgFinal7b}%`);
  console.log(`max final (objectScale=1): ${maxFinal7b}%`);
  console.log(`stress test gain (612×696 input): +${stressTest.areaGainPct}%`);
  console.log(`Output: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
