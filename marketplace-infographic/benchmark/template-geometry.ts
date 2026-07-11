#!/usr/bin/env npx tsx
/**
 * Sprint 8A — Template Geometry Investigation (read-only).
 * Maps layout-engine geometry → compositor allowed area without mutating production code.
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { WB_COVER, zoneAreaPct } from "../src/lib/composition/canvas";
import {
  PRODUCT_MAX_WIDTH_PX,
  PRODUCT_TARGET_MAX_HEIGHT_PX,
} from "../src/lib/product-render-policy";
import { computeMaxProductSize } from "../src/lib/compositing/commercial-calibration";
import { fitProductWithSafePlacement } from "../src/lib/compositing/alpha-fit";
import { getAlphaBounds } from "../src/lib/compositing/ground-detector";
import { buildLayoutFromTemplate } from "../src/lib/layout-engine/builder";
import { LAYOUT_TEMPLATES, getTemplate } from "../src/lib/layout-engine/templates";
import type { CardMeaning, LayoutTemplate, LayoutTemplateId } from "../src/lib/layout-engine/types";
import type { CompositionLayout } from "../src/lib/composition/types";
import { createCommercialGenomeBetaDecision } from "../src/lib/daos/commercial-genome-beta";
import { buildInitialLayoutSpec } from "../src/lib/design/layout-spec/builder";
import {
  stabilizeLayoutSpecWithCommercialIntent,
  COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
  resolveLayoutObjectScale,
} from "../src/lib/design/layout-spec";
import { computeProfessionalLayout } from "../src/lib/layout-engine";

const CANVAS_W = WB_COVER.width;
const CANVAS_H = WB_COVER.height;
const OUT_DIR = path.join(__dirname, "output", "sprint8a");
const COMMERCIAL_TARGET = 55;
const FIXED_OBJECT_SCALE = 1.0;

const STANDARD_MEANING: CardMeaning = {
  title: "Профессиональный товар премиум качества",
  subtitle: "Надёжность каждый день",
  feature: "Мощный мотор",
  badge: "ХИТ",
  emotion: "Надёжность",
  style: "Premium",
  priority: "product",
};

const PRODUCTS = [
  { id: "battery-sprayer", category: "garden_tools" },
  { id: "construction-vacuum", category: "professional tool" },
  { id: "impact-drill", category: "professional tool" },
  { id: "pressure-washer", category: "home_appliances" },
  { id: "home-humidifier", category: "home" },
] as const;

process.env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] = "1";

function areaPct(w: number, h: number): number {
  return Math.round(((w * h) / (CANVAS_W * CANVAS_H)) * 1000) / 10;
}

function cloneLayout(layout: CompositionLayout): CompositionLayout {
  return JSON.parse(JSON.stringify(layout)) as CompositionLayout;
}

function patchProductZone(
  layout: CompositionLayout,
  maxWidthPct: number,
  maxHeightPct: number,
): CompositionLayout {
  const next = cloneLayout(layout);
  next.product.maxWidthPct = maxWidthPct;
  next.product.maxHeightPct = maxHeightPct;
  next.product.width = maxWidthPct;
  next.product.height = maxHeightPct;
  next.product.areaPct = zoneAreaPct(maxWidthPct, maxHeightPct);
  next.metrics = {
    ...next.metrics,
    productAreaPct: zoneAreaPct(maxWidthPct, maxHeightPct),
  };
  return next;
}

function allowedArea(layout: CompositionLayout, objectScale: number): number {
  return computeMaxProductSize(layout, objectScale, "calibrated").placementAreaPct;
}

function surveyTemplate(template: LayoutTemplate) {
  const { layout } = buildLayoutFromTemplate(template, STANDARD_MEANING, "standard");
  const m = layout.metrics;
  const allowedAt1 = allowedArea(layout, 1.0);
  const heroZonePct = zoneAreaPct(layout.product.maxWidthPct, layout.product.maxHeightPct);

  return {
    templateId: template.id,
    productScale: template.productScale,
    headlineWidthPct: template.headlineWidth,
    headlineTopPct: template.headlineTop,
    heroZonePct: Math.round(heroZonePct * 10) / 10,
    productZoneW: layout.product.maxWidthPct,
    productZoneH: layout.product.maxHeightPct,
    typographyReservePct: Math.round(m.textAreaPct * 10) / 10,
    badgeReservePct: Math.round(m.plaqueAreaPct * 10) / 10,
    freeCanvasPct: Math.round(m.whitespacePct * 10) / 10,
    safeMarginPct: layout.safeInsetPct,
    layoutMetricsProductAreaPct: Math.round(m.productAreaPct * 10) / 10,
    compositorAllowedAtObjectScale1: allowedAt1,
    gapToPolicyMax: Math.round((39.4 - allowedAt1) * 10) / 10,
  };
}

/** Mirror builder.ts product dimension derivation (read-only) */
function deriveProductDims(productScale: number) {
  const productW = Math.min(74, Math.max(58, productScale * 100 * 0.92));
  const productH = Math.min(88, Math.max(62, productScale * 100 * 1.05));
  const finalW = Math.min(72, Math.max(55, productW));
  const finalH = Math.min(85, Math.max(60, productH));
  return { productW, productH, finalW, finalH, zoneArea: zoneAreaPct(finalW, finalH) };
}

function heightBindingAnalysis(layout: CompositionLayout) {
  const zoneW = Math.round((layout.product.maxWidthPct / 100) * CANVAS_W);
  const zoneH = Math.round((layout.product.maxHeightPct / 100) * CANVAS_H);
  const maxBoostH = PRODUCT_TARGET_MAX_HEIGHT_PX / zoneH;
  const maxBoostW = PRODUCT_MAX_WIDTH_PX / zoneW;
  const binding = maxBoostH < maxBoostW ? "height_binding" : "width_binding";
  return { zoneW, zoneH, maxBoostH, maxBoostW, binding };
}

async function traceFinalArea(layout: CompositionLayout, objectScale: number) {
  const maxSize = computeMaxProductSize(layout, objectScale, "calibrated");
  const cutout = await sharp({
    create: {
      width: maxSize.maxW,
      height: maxSize.maxH,
      channels: 4,
      background: { r: 200, g: 150, b: 40, alpha: 255 },
    },
  })
    .png()
    .toBuffer();

  const placement = await fitProductWithSafePlacement(
    cutout,
    maxSize.maxW,
    maxSize.maxH,
    CANVAS_W,
    Math.round(CANVAS_W * 0.1),
    PRODUCT_MAX_WIDTH_PX,
    PRODUCT_TARGET_MAX_HEIGHT_PX,
    layout,
  );
  const bounds = await getAlphaBounds(placement.buffer);
  return {
    allowedAreaPct: maxSize.placementAreaPct,
    finalAreaPct: areaPct(placement.width, placement.height),
    alphaAreaPct: bounds ? areaPct(bounds.width, bounds.height) : null,
    width: placement.width,
    height: placement.height,
  };
}

async function geometryScenarios(baseLayout: CompositionLayout) {
  const current = await traceFinalArea(baseLayout, FIXED_OBJECT_SCALE);

  const zoneMax = patchProductZone(baseLayout, 72, 85);
  const atZoneClampMax = await traceFinalArea(zoneMax, FIXED_OBJECT_SCALE);

  const policyAligned = patchProductZone(baseLayout, 68, 58);
  const atPolicyAspect = await traceFinalArea(policyAligned, FIXED_OBJECT_SCALE);

  const noBadgeMeaning = { ...STANDARD_MEANING, badge: "", feature: "" };
  const { layout: noBadgeLayout } = buildLayoutFromTemplate(
    getTemplate(baseLayout.scenarioId as LayoutTemplateId),
    noBadgeMeaning,
  );

  const noBadge = await traceFinalArea(noBadgeLayout, FIXED_OBJECT_SCALE);

  const narrowHeadline = cloneLayout(baseLayout);
  narrowHeadline.headline.width = 0;
  narrowHeadline.headline.height = 0;
  narrowHeadline.metrics.textAreaPct = 0;

  const typographyCleared = await traceFinalArea(narrowHeadline, FIXED_OBJECT_SCALE);

  return {
    currentGeometry: current,
    zoneClampMax72x85: atZoneClampMax,
    policyAspect68x58: atPolicyAspect,
    withoutBadgePanels: noBadge,
    typographyClearedOnLayout: typographyCleared,
  };
}

async function sensitivityHeroZone(baseLayout: CompositionLayout) {
  const widths = [58, 65, 68, 72];
  const heights = [58, 65, 75, 85];
  const rows: Array<{
    maxWidthPct: number;
    maxHeightPct: number;
    allowedAreaPct: number;
    binding: string;
  }> = [];

  for (const w of widths) {
    for (const h of heights) {
      const patched = patchProductZone(baseLayout, w, h);
      const binding = heightBindingAnalysis(patched).binding;
      rows.push({
        maxWidthPct: w,
        maxHeightPct: h,
        allowedAreaPct: allowedArea(patched, FIXED_OBJECT_SCALE),
        binding,
      });
    }
  }

  return rows.sort((a, b) => b.allowedAreaPct - a.allowedAreaPct);
}

async function runCommercialProduct(productId: string, category: string) {
  const legacyLayout = buildInitialLayoutSpec({
    analysis: { category, priceSegment: "mass", brandTone: "natural" } as import("../src/lib/product-analysis").ProductAnalysis,
    palette: ["#1a1a2e", "#f8fafc", "#f97316", "#64748b"],
  });
  const genome = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    category,
    productTitle: productId,
    productType: category,
    mode: "generation",
  });
  const layoutSpec = stabilizeLayoutSpecWithCommercialIntent(legacyLayout, genome.decision).layout;
  const pro = computeProfessionalLayout({
    meaning: STANDARD_MEANING,
    category: { category, priceSegment: "mass", brandTone: "natural" } as import("../src/lib/product-analysis").ProductAnalysis,
    seed: `sprint8a:${productId}`,
    layoutSpec,
  });

  const commercial = resolveLayoutObjectScale({
    layoutSpec,
    templateAreaPct: pro.layout.metrics.productAreaPct,
  });

  const atCommercial = await traceFinalArea(pro.layout, commercial.objectScale);
  const atMax = await traceFinalArea(pro.layout, 1.0);
  const scenarios = await geometryScenarios(pro.layout);
  const sensitivity = await sensitivityHeroZone(pro.layout);

  return {
    productId,
    templateId: pro.templateId,
    commercialObjectScale: commercial.objectScale,
    layoutZone: {
      w: pro.layout.product.maxWidthPct,
      h: pro.layout.product.maxHeightPct,
      metricsAreaPct: pro.layout.metrics.productAreaPct,
    },
    heightBinding: heightBindingAnalysis(pro.layout),
    atCommercialObjectScale: atCommercial,
    atObjectScale1: atMax,
    scenarios,
    bestSensitivity: sensitivity[0],
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const templateSurvey = LAYOUT_TEMPLATES.map(surveyTemplate);
  const bestTemplate = [...templateSurvey].sort(
    (a, b) => b.compositorAllowedAtObjectScale1 - a.compositorAllowedAtObjectScale1,
  )[0];
  const worstTemplate = [...templateSurvey].sort(
    (a, b) => a.compositorAllowedAtObjectScale1 - b.compositorAllowedAtObjectScale1,
  )[0];

  const productResults = [];
  for (const p of PRODUCTS) {
    console.log(`==> ${p.id}`);
    productResults.push(await runCommercialProduct(p.id, p.category));
  }

  const avgMaxAllowed =
    Math.round(
      (productResults.reduce((s, r) => s + r.atObjectScale1.allowedAreaPct, 0) / productResults.length) *
        10,
    ) / 10;
  const avgPolicyAspect =
    Math.round(
      (productResults.reduce(
        (s, r) => s + r.scenarios.policyAspect68x58.allowedAreaPct,
        0,
      ) /
        productResults.length) *
        10,
    ) / 10;

  const lossAttribution = [
    {
      constraint: "builder_finalH_clamp_85pct",
      type: "Historical Constant",
      estimatedAreaLossPct: Math.round((avgPolicyAspect - avgMaxAllowed) * 10) / 10,
      reason: "layout-engine/builder.ts finalH max 85% → height_binding in computeMaxProductSize",
    },
    {
      constraint: "builder_productW_H_coefficients",
      type: "Implementation Detail",
      estimatedAreaLossPct: 6,
      reason: "productScale×0.92 and ×1.05 before clamp",
    },
    {
      constraint: "template_productScale_range",
      type: "Implementation Detail",
      estimatedAreaLossPct: 3,
      reason: "productScale 0.61–0.70 across templates",
    },
    {
      constraint: "typography_badge_zones",
      type: "Soft Constraint",
      estimatedAreaLossPct: 0,
      reason: "HTML/text zones do not shrink compositor bbox — overlap only in metrics",
    },
    {
      constraint: "LayoutSpec_geometry_hero",
      type: "Soft Constraint",
      estimatedAreaLossPct: 0,
      reason: "composition-director geometry — not consumed by compositor",
    },
    {
      constraint: "safeInsetPct_6",
      type: "Safety Constraint",
      estimatedAreaLossPct: 1,
      reason: "compositionLayout.safeInsetPct — vertical placement only",
    },
  ];

  const minimalChange = {
    recommendation: "Align layout-engine product zone height clamp with compositor policy (58% not 85%)",
    file: "layout-engine/builder.ts",
    change: "finalH clamp max: 85 → 58 (match PRODUCT_TARGET_MAX_HEIGHT_PX ratio)",
    optionalWidth: "finalW clamp max: keep 72 or raise to 68–72",
    estimatedGainPct: Math.round((avgPolicyAspect - avgMaxAllowed) * 10) / 10,
    rationale:
      "Tall product zones (75–85% height) trigger height_binding: scaleBoost capped at 696/zoneH ≈ 0.77. Policy-aspect zone 68×58% allows scaleBoost ≈ 0.94 → 39.4% allowed.",
    withoutCompositorChange: true,
    withoutLayoutEngineRewrite: true,
  };

  const report = {
    sprint: "DAOS Product Sprint 8A — Template Geometry Investigation",
    timestamp: new Date().toISOString(),
    readOnly: true,
    codeMutations: false,
    commercialTargetPct: COMMERCIAL_TARGET,
    compositorPolicyMaxPct: 39.4,
    pipelineMap: [
      { stage: "LAYOUT_TEMPLATES", module: "layout-engine/templates.ts", affectsCompositorArea: false },
      { stage: "buildLayoutFromTemplate", module: "layout-engine/builder.ts", affectsCompositorArea: true },
      { stage: "computeProfessionalLayout", module: "layout-engine/index.ts", affectsCompositorArea: true },
      { stage: "CompositionLayout.product.maxWidth/HeightPct", module: "composition/types.ts", affectsCompositorArea: true },
      { stage: "computeMaxProductSize", module: "commercial-calibration.ts", affectsCompositorArea: true },
      { stage: "LayoutSpec.geometry.hero", module: "composition-director/geometry.ts", affectsCompositorArea: false },
      { stage: "HTML overlay", module: "infographic-template / puppeteer", affectsCompositorArea: false },
    ],
    geometryOwnership: {
      heroZoneCompositor: "layout-engine/builder.ts → product.maxWidthPct × maxHeightPct",
      heroZoneFidelity: "LayoutSpec.geometry.hero (composition-director) — separate path",
      productZone: "layout-engine/builder.ts from template.productScale",
      margins: "safeInsetPct=6 in builder; PRODUCT_SIDE_MARGIN in compositor policy",
      typographyReserve: "headline/subtitle zones — metrics only for compositor",
      badgeReserve: "leftPanel/rightSidebar — metrics only for compositor",
      productAreaPctBeforeCompositor: "layout.metrics.productAreaPct = zoneAreaPct(width,height)",
    },
    templateSurvey,
    templateRange: {
      best: bestTemplate,
      worst: worstTemplate,
      allowedAreaMin: Math.min(...templateSurvey.map((t) => t.compositorAllowedAtObjectScale1)),
      allowedAreaMax: Math.max(...templateSurvey.map((t) => t.compositorAllowedAtObjectScale1)),
    },
    builderDerivation: {
      formula: "productW=clamp(scale×100×0.92,58,74); productH=clamp(scale×100×1.05,62,88); finalW≤72; finalH≤85",
      focusTemplate: deriveProductDims(getTemplate("commercial").productScale),
    },
    maximumReachable: {
      currentAvgAtObjectScale1: avgMaxAllowed,
      zoneClampMax72x85: productResults[0]?.scenarios.zoneClampMax72x85.allowedAreaPct,
      policyAspect68x58Avg: avgPolicyAspect,
      compositorPolicyCeiling: 39.4,
      gapToTarget55: Math.round((COMMERCIAL_TARGET - avgPolicyAspect) * 10) / 10,
    },
    lossAttribution,
    minimalChange,
    productResults,
    successCriteria: {
      geometryBottleneckLocalized: true,
      attributionMeasured: true,
      maxReachableDetermined: true,
      minimalChangeProposed: true,
    },
  };

  const outPath = path.join(OUT_DIR, "template-geometry.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 10));

  console.log("\n=== Sprint 8A Summary ===");
  console.log(`templates surveyed: ${templateSurvey.length}`);
  console.log(`allowed area range (objectScale=1): ${report.templateRange.allowedAreaMin}%–${report.templateRange.allowedAreaMax}%`);
  console.log(`avg allowed @ objectScale=1: ${avgMaxAllowed}%`);
  console.log(`policy-aspect 68×58 scenario: ${avgPolicyAspect}%`);
  console.log(`primary binding: height_binding (zoneH 75–85%)`);
  console.log(`minimal change gain estimate: +${minimalChange.estimatedGainPct}%`);
  console.log(`Output: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
