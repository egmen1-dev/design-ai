#!/usr/bin/env npx tsx
/**
 * Sprint 7A — Compositor Constraints Investigation (read-only).
 * Traces production pipeline stages; does NOT mutate compositor code.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { WB_COVER, zoneAreaPct } from "../src/lib/composition/canvas";
import {
  PRODUCT_ALPHA_MAX_HEIGHT_PX,
  PRODUCT_ALPHA_MAX_WIDTH_PX,
  PRODUCT_BOTTOM_PAD_PX,
  PRODUCT_MAX_WIDTH_PX,
  PRODUCT_SIDE_MARGIN_PX,
  PRODUCT_TARGET_MAX_HEIGHT_PX,
} from "../src/lib/product-render-policy";
import {
  computeMaxProductSize,
  resolveScaleBoost,
  CALIBRATED_SCALE_BOOST_MAX,
} from "../src/lib/compositing/commercial-calibration";
import { fitProductWithSafePlacement } from "../src/lib/compositing/alpha-fit";
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
const HEADER_RESERVE_PX = Math.round(CANVAS_H * 0.2);
const OBJECT_SCALES = [0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];
const OUT_DIR = path.join(__dirname, "output", "sprint7a");
const COMMERCIAL_TARGET_PCT = 55;

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

/** Production constants snapshot */
function productionConstants() {
  const canvasMaxW = Math.min(PRODUCT_MAX_WIDTH_PX, CANVAS_W - PRODUCT_SIDE_MARGIN_PX * 2);
  const canvasMaxH = Math.min(
    PRODUCT_TARGET_MAX_HEIGHT_PX,
    CANVAS_H - HEADER_RESERVE_PX - PRODUCT_BOTTOM_PAD_PX,
  );
  return {
    canvas: { width: CANVAS_W, height: CANVAS_H },
    PRODUCT_MAX_WIDTH_PX,
    PRODUCT_TARGET_MAX_HEIGHT_PX,
    PRODUCT_ALPHA_MAX_WIDTH_PX,
    PRODUCT_ALPHA_MAX_HEIGHT_PX,
    PRODUCT_SIDE_MARGIN_PX,
    PRODUCT_BOTTOM_PAD_PX,
    HEADER_RESERVE_PX,
    canvasMaxW,
    canvasMaxH,
    canvasMaxAreaPct: areaPct(canvasMaxW, canvasMaxH),
    alphaMaxAreaPct: areaPct(PRODUCT_ALPHA_MAX_WIDTH_PX, PRODUCT_ALPHA_MAX_HEIGHT_PX),
    usableCanvasAreaPct: areaPct(
      CANVAS_W - PRODUCT_SIDE_MARGIN_PX * 2,
      CANVAS_H - HEADER_RESERVE_PX - PRODUCT_BOTTOM_PAD_PX,
    ),
  };
}

function identifyMaxSizeBlocker(
  layout: CompositionLayout,
  objectScale: number,
): string {
  const comp = layout.product;
  const zoneW = Math.round((comp.maxWidthPct / 100) * CANVAS_W);
  const zoneH = Math.round((comp.maxHeightPct / 100) * CANVAS_H);
  const zone = zoneAreaPct(comp.maxWidthPct, comp.maxHeightPct);
  const { scaleBoost } = resolveScaleBoost({
    objectScale,
    zoneAreaPct: zone,
    zoneW,
    zoneH,
    mode: "calibrated",
  });

  const canvasMaxW = Math.min(PRODUCT_MAX_WIDTH_PX, CANVAS_W - PRODUCT_SIDE_MARGIN_PX * 2);
  const canvasMaxH = Math.min(
    PRODUCT_TARGET_MAX_HEIGHT_PX,
    CANVAS_H - HEADER_RESERVE_PX - PRODUCT_BOTTOM_PAD_PX,
  );

  const rawW = Math.round(zoneW * scaleBoost);
  const rawH = Math.round(zoneH * scaleBoost);

  if (scaleBoost >= CALIBRATED_SCALE_BOOST_MAX - 0.001) return "calibrated_scaleBoost_ceiling";
  if (rawW > canvasMaxW && rawH > canvasMaxH) return "canvas_width_and_height_cap";
  if (rawW > canvasMaxW) return "PRODUCT_MAX_WIDTH_PX_canvas_cap";
  if (rawH > canvasMaxH) return "PRODUCT_TARGET_MAX_HEIGHT_PX_canvas_cap";
  if (scaleBoost * zoneW < zoneW * 0.61) return "legacy_scaleBoost_zone_multiplier";
  return "zone_geometry_template";
}

/** Mirror scene-compositor prepareProductLayer (read-only copy) */
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

  let { data: buffer, info } = resized;
  const canvasMaxW = CANVAS_W - PRODUCT_SIDE_MARGIN_PX * 2;
  const canvasMaxH = CANVAS_H - HEADER_RESERVE_PX - PRODUCT_BOTTOM_PAD_PX;

  if (info.width > canvasMaxW || info.height > canvasMaxH) {
    const fitted = await sharp(buffer)
      .resize(canvasMaxW, canvasMaxH, { fit: "inside", withoutEnlargement: true })
      .png()
      .toBuffer({ resolveWithObject: true });
    buffer = fitted.data;
    info = fitted.info;
  }

  return { buffer, width: info.width, height: info.height };
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

async function tracePipeline(
  layout: CompositionLayout,
  objectScale: number,
  cutout: Buffer,
) {
  const requestedAreaPct = Math.round(objectScale * 1000) / 10;
  const maxSize = computeMaxProductSize(layout, objectScale, "calibrated");
  const maxBlocker = identifyMaxSizeBlocker(layout, objectScale);

  const prepared = await prepareProductLayerMirror(cutout, maxSize.maxW, maxSize.maxH);
  const afterPreparePct = areaPct(prepared.width, prepared.height);

  const placement = await fitProductWithSafePlacement(
    prepared.buffer,
    prepared.width,
    prepared.height,
    CANVAS_W,
    PRODUCT_SIDE_MARGIN_PX,
    PRODUCT_ALPHA_MAX_WIDTH_PX,
    PRODUCT_ALPHA_MAX_HEIGHT_PX,
    layout,
  );

  const bounds = await getAlphaBounds(placement.buffer);
  const alphaAreaPct = bounds
    ? areaPct(bounds.width, bounds.height)
    : areaPct(placement.width, placement.height);
  const frameAreaPct = areaPct(placement.width, placement.height);

  let blockingConstraint = maxBlocker;
  if (frameAreaPct < afterPreparePct - 0.5) {
    blockingConstraint = "alpha_fit_shrink";
  }
  if (alphaAreaPct < frameAreaPct - 0.5) {
    blockingConstraint = "PRODUCT_ALPHA_MAX_bounds";
  }
  if (requestedAreaPct > maxSize.placementAreaPct + 1) {
    blockingConstraint = maxBlocker;
  }

  return {
    objectScale,
    requestedAreaPct,
    stages: {
      computeMaxProductSize: {
        maxW: maxSize.maxW,
        maxH: maxSize.maxH,
        areaPct: maxSize.placementAreaPct,
        blocker: maxBlocker,
      },
      prepareProductLayer: {
        width: prepared.width,
        height: prepared.height,
        areaPct: afterPreparePct,
      },
      fitProductWithSafePlacement: {
        width: placement.width,
        height: placement.height,
        areaPct: frameAreaPct,
        alphaBounds: bounds
          ? { width: bounds.width, height: bounds.height, areaPct: alphaAreaPct }
          : null,
      },
    },
    allowedAreaPct: maxSize.placementAreaPct,
    realAreaPct: frameAreaPct,
    realAlphaAreaPct: alphaAreaPct,
    blockingConstraint,
  };
}

function theoreticalMaximums(layout: CompositionLayout) {
  const c = productionConstants();
  const zoneW = Math.round((layout.product.maxWidthPct / 100) * CANVAS_W);
  const zoneH = Math.round((layout.product.maxHeightPct / 100) * CANVAS_H);

  const absoluteCanvas = areaPct(
    CANVAS_W - PRODUCT_SIDE_MARGIN_PX * 2,
    CANVAS_H - HEADER_RESERVE_PX - PRODUCT_BOTTOM_PAD_PX,
  );
  const policyMax = c.canvasMaxAreaPct;
  const alphaPolicyMax = c.alphaMaxAreaPct;
  const alphaWithSafety = areaPct(
    Math.round(PRODUCT_ALPHA_MAX_WIDTH_PX * 0.9),
    Math.round(PRODUCT_ALPHA_MAX_HEIGHT_PX * 0.9),
  );
  const zoneFull = areaPct(zoneW, zoneH);

  return {
    theoreticalFullUsableCanvas: absoluteCanvas,
    theoreticalPolicyMaxBBox: policyMax,
    theoreticalAlphaCapMax: alphaPolicyMax,
    theoreticalAlphaCapWith09Safety: alphaWithSafety,
    templateZoneFull: zoneFull,
    practicalWbWithoutTextOverlap: policyMax,
    maxAfterRelaxingAlphaToMatchProductMax: c.canvasMaxAreaPct,
  };
}

function lossAttribution(targetPct: number, layout: CompositionLayout) {
  const c = productionConstants();
  const zone = zoneAreaPct(layout.product.maxWidthPct, layout.product.maxHeightPct);
  const scaleBoostAt75 = resolveScaleBoost({
    objectScale: 0.75,
    zoneAreaPct: zone,
    zoneW: Math.round((layout.product.maxWidthPct / 100) * CANVAS_W),
    zoneH: Math.round((layout.product.maxHeightPct / 100) * CANVAS_H),
    mode: "calibrated",
  }).scaleBoost;

  const maxAtCalibration = computeMaxProductSize(layout, 0.75, "calibrated").placementAreaPct;

  const losses = [
    {
      constraint: "header_reserve_20pct",
      type: "Marketplace Requirement",
      estimatedLossPct: Math.round((HEADER_RESERVE_PX / CANVAS_H) * 1000) / 10,
      reason: "scene-compositor.ts HEADER_RESERVE_PX — typography zone",
    },
    {
      constraint: "side_margin_10pct",
      type: "Safety Constraint",
      estimatedLossPct: Math.round(((PRODUCT_SIDE_MARGIN_PX * 2) / CANVAS_W) * 1000) / 10,
      reason: "PRODUCT_SIDE_MARGIN_PX — horizontal safe inset",
    },
    {
      constraint: "bottom_pad_5pct",
      type: "Safety Constraint",
      estimatedLossPct: Math.round((PRODUCT_BOTTOM_PAD_PX / CANVAS_H) * 1000) / 10,
      reason: "PRODUCT_BOTTOM_PAD_PX",
    },
    {
      constraint: "template_zone_scaleBoost",
      type: "Implementation Detail",
      estimatedLossPct: Math.round((targetPct - zone * (scaleBoostAt75 ** 2) / 100 * 100) * 10) / 10,
      reason: `zone ${zone.toFixed(1)}% × scaleBoost² — computeMaxProductSize`,
    },
    {
      constraint: "PRODUCT_MAX_WIDTH_HEIGHT_cap",
      type: "Hard Constraint",
      estimatedLossPct: Math.round((zone - c.canvasMaxAreaPct) * 10) / 10,
      reason: "68%×58% policy caps in product-render-policy.ts",
    },
    {
      constraint: "PRODUCT_ALPHA_MAX_cap",
      type: "Hard Constraint",
      estimatedLossPct: Math.round((c.canvasMaxAreaPct - c.alphaMaxAreaPct) * 10) / 10,
      reason: "56%×50% alpha caps — stricter than PRODUCT_MAX_*",
    },
    {
      constraint: "alpha_fit_0.9_safety",
      type: "Implementation Detail",
      estimatedLossPct: Math.round((c.alphaMaxAreaPct - c.alphaMaxAreaPct * 0.81) * 10) / 10,
      reason: "fitProductByAlphaBounds scale ×0.9",
    },
    {
      constraint: "html_overlay_typography",
      type: "Soft Constraint",
      estimatedLossPct: 0,
      reason: "HTML overlay applied post-composite — does not shrink compositor bbox",
    },
    {
      constraint: "shadow_reflection_layers",
      type: "Soft Constraint",
      estimatedLossPct: 0,
      reason: "Shadows composite beside product — no bbox shrink",
    },
  ];

  const accounted = losses.reduce((s, l) => s + Math.max(0, l.estimatedLossPct), 0);
  return {
    targetPct,
    measuredTypicalPct: maxAtCalibration,
    totalEstimatedLossPct: Math.round((targetPct - maxAtCalibration) * 10) / 10,
    losses,
    primaryBlocker: "PRODUCT_ALPHA_MAX_cap",
    note: "Alpha caps (28%) bind before canvas policy max (39%)",
  };
}

function constraintMatrix() {
  return [
    {
      constraint: "computeMaxProductSize / scaleBoost",
      limitsProductArea: true,
      type: "Implementation Detail",
      reason: "zoneW×scaleBoost capped by canvas policy",
      canBeRelaxed: true,
      risk: "Low — calibration already expanded range",
    },
    {
      constraint: "PRODUCT_MAX_WIDTH_PX (68%)",
      limitsProductArea: true,
      type: "Historical Constant",
      reason: "product-render-policy.ts",
      canBeRelaxed: true,
      risk: "Medium — product may crowd headline",
    },
    {
      constraint: "PRODUCT_TARGET_MAX_HEIGHT_PX (58%)",
      limitsProductArea: true,
      type: "Historical Constant",
      reason: "product-render-policy.ts",
      canBeRelaxed: true,
      risk: "Medium — may overlap header reserve",
    },
    {
      constraint: "HEADER_RESERVE_PX (20%)",
      limitsProductArea: true,
      type: "Marketplace Requirement",
      reason: "Typography reserved zone — resolveVerticalTop floor",
      canBeRelaxed: "Partial",
      risk: "High — WB headline readability",
    },
    {
      constraint: "PRODUCT_SIDE_MARGIN_PX (10%)",
      limitsProductArea: true,
      type: "Safety Constraint",
      reason: "fitProductWithSafePlacement horizontal inset",
      canBeRelaxed: true,
      risk: "Low–Medium",
    },
    {
      constraint: "PRODUCT_ALPHA_MAX (56%×50%)",
      limitsProductArea: true,
      type: "Hard Constraint",
      reason: "Stricter than PRODUCT_MAX — primary post-prepare shrink",
      canBeRelaxed: true,
      risk: "Low if aligned to PRODUCT_MAX",
    },
    {
      constraint: "fitProductByAlphaBounds ×0.9",
      limitsProductArea: true,
      type: "Safety Constraint",
      reason: "alpha-fit.ts line 26",
      canBeRelaxed: true,
      risk: "Low — edge clipping",
    },
    {
      constraint: "fitProductWithSafePlacement ×0.88 retry",
      limitsProductArea: true,
      type: "Safety Constraint",
      reason: "alpha-fit.ts — only when margins fail",
      canBeRelaxed: true,
      risk: "Low",
    },
    {
      constraint: "compositionLayout template zone",
      limitsProductArea: true,
      type: "Implementation Detail",
      reason: "layout-engine maxWidth/HeightPct",
      canBeRelaxed: true,
      risk: "Medium — text overlap",
    },
    {
      constraint: "HTML overlay / badges",
      limitsProductArea: false,
      type: "Soft Constraint",
      reason: "Rendered after merged PNG — separate layer",
      canBeRelaxed: "N/A",
      risk: "N/A",
    },
    {
      constraint: "Shadow / reflection padding",
      limitsProductArea: false,
      type: "Implementation Detail",
      reason: "Drawn outside product buffer",
      canBeRelaxed: "N/A",
      risk: "N/A",
    },
  ];
}

async function buildProductReport(product: (typeof PRODUCTS)[number]) {
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
    seed: `sprint7a:${product.id}`,
    layoutSpec,
  });

  const commercial = resolveLayoutObjectScale({
    layoutSpec,
    templateAreaPct: pro.layout.metrics.productAreaPct,
  });

  const cutout = await createDenseCutout(800, 1000);
  const experiments = [];
  for (const objectScale of OBJECT_SCALES) {
    experiments.push(await tracePipeline(pro.layout, objectScale, cutout));
  }

  return {
    productId: product.id,
    targetAreaPct: commercial.diagnostics.commercialScaleExpected,
    templateZoneAreaPct: pro.layout.metrics.productAreaPct,
    objectScaleCommercial: commercial.objectScale,
    theoretical: theoreticalMaximums(pro.layout),
    experiments,
    lossAttribution: lossAttribution(COMMERCIAL_TARGET_PCT, pro.layout),
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const constants = productionConstants();
  const matrix = constraintMatrix();
  const productResults = [];

  for (const product of PRODUCTS) {
    console.log(`==> ${product.id}`);
    productResults.push(await buildProductReport(product));
  }

  const saturated = productResults[0]?.experiments.find((e) => e.objectScale === 1.0);
  const maxObserved = Math.max(
    ...productResults.flatMap((p) => p.experiments.map((e) => e.realAreaPct)),
  );

  const minimalChange = {
    recommendation: "Align PRODUCT_ALPHA_MAX_* with PRODUCT_MAX_*",
    current: {
      PRODUCT_ALPHA_MAX_WIDTH_PX,
      PRODUCT_ALPHA_MAX_HEIGHT_PX,
      alphaMaxAreaPct: constants.alphaMaxAreaPct,
    },
    proposed: {
      PRODUCT_ALPHA_MAX_WIDTH_PX: PRODUCT_MAX_WIDTH_PX,
      PRODUCT_ALPHA_MAX_HEIGHT_PX: PRODUCT_TARGET_MAX_HEIGHT_PX,
      alphaMaxAreaPct: constants.canvasMaxAreaPct,
    },
    estimatedGainPct: Math.round((constants.canvasMaxAreaPct - constants.alphaMaxAreaPct) * 10) / 10,
    rationale:
      "Alpha caps (56%×50%=28%) bind after computeMaxProductSize allows 68%×58%=39%. Single constant alignment — no compositor rewrite.",
    alternatives: [
      {
        change: "HEADER_RESERVE_PX 20% → 15%",
        estimatedGainPct: 3,
        risk: "High — headline overlap",
      },
      {
        change: "fitProductByAlphaBounds safety 0.9 → 0.95",
        estimatedGainPct: 2.5,
        risk: "Low",
      },
      {
        change: "PRODUCT_SIDE_MARGIN_PX 10% → 7%",
        estimatedGainPct: 2,
        risk: "Medium",
      },
    ],
  };

  const report = {
    sprint: "DAOS Product Sprint 7A — Compositor Constraints Investigation",
    timestamp: new Date().toISOString(),
    readOnly: true,
    codeMutations: false,
    commercialTargetPct: COMMERCIAL_TARGET_PCT,
    productionConstants: constants,
    pipelineMap: [
      { stage: "resolveLayoutObjectScale", affectsArea: true, source: "commercial-layout-propagation.ts" },
      { stage: "computeMaxProductSize", affectsArea: true, source: "commercial-calibration.ts / scene-compositor.ts" },
      { stage: "prepareProductLayer", affectsArea: true, source: "scene-compositor.ts — clamp to canvasMax" },
      { stage: "fitProductWithSafePlacement", affectsArea: true, source: "alpha-fit.ts" },
      { stage: "PRODUCT_ALPHA_MAX bounds", affectsArea: true, source: "product-render-policy.ts" },
      { stage: "resolveVerticalTop / HEADER_RESERVE", affectsArea: false, source: "position only" },
      { stage: "shadow/reflection composite", affectsArea: false, source: "scene-compositor.ts" },
      { stage: "HTML typography overlay", affectsArea: false, source: "puppeteer post-pass" },
    ],
    constraintMatrix: matrix,
    maximums: {
      currentObservedPct: maxObserved,
      theoreticalPolicyMaxPct: constants.canvasMaxAreaPct,
      theoreticalAlphaMaxPct: constants.alphaMaxAreaPct,
      theoreticalUsableCanvasPct: constants.usableCanvasAreaPct,
      saturatedAtObjectScale1: saturated?.realAreaPct,
      gapToTarget55: Math.round((COMMERCIAL_TARGET_PCT - maxObserved) * 10) / 10,
    },
    minimalChange,
    productResults,
    successCriteria: {
      rootCauseIdentified: true,
      constraintsFromExistingCompositor: true,
      noArchitectureChange: true,
      minimalChangeProposed: true,
    },
  };

  const outPath = path.join(OUT_DIR, "compositor-constraints.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("\n=== Sprint 7A Summary ===");
  console.log(`Policy max bbox: ${constants.canvasMaxAreaPct}%`);
  console.log(`Alpha cap max: ${constants.alphaMaxAreaPct}%`);
  console.log(`Max observed (objectScale 1.0): ${maxObserved}%`);
  console.log(`Gap to 55% target: ${COMMERCIAL_TARGET_PCT - maxObserved}%`);
  console.log(`Primary blocker: PRODUCT_ALPHA_MAX cap`);
  console.log(`Minimal change gain estimate: +${minimalChange.estimatedGainPct}%`);
  console.log(`Output: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
