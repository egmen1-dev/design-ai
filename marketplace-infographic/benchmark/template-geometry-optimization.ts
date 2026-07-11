#!/usr/bin/env npx tsx
/**
 * Sprint 8B — Template Geometry Clamp Optimization validation.
 * Compares Sprint 8A legacy finalH (85) vs Sprint 8B production (58).
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
import {
  buildGeometryClampDiagnostics,
  legacyFinalHeightPct,
} from "../src/lib/layout-engine/geometry-clamp-optimization";
import { PRODUCT_FINAL_HEIGHT_LEGACY_MAX_PCT } from "../src/lib/layout-engine/constants";
import type { CardMeaning, LayoutTemplateId } from "../src/lib/layout-engine/types";
import type { CompositionLayout } from "../src/lib/composition/types";
import { createCommercialGenomeBetaDecision } from "../src/lib/daos/commercial-genome-beta";
import { buildInitialLayoutSpec } from "../src/lib/design/layout-spec/builder";
import {
  stabilizeLayoutSpecWithCommercialIntent,
  COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
  resolveLayoutObjectScale,
} from "../src/lib/design/layout-spec";
import { computeProfessionalLayout } from "../src/lib/layout-engine";
import type { ProductAnalysis } from "../src/lib/product-analysis";

const CANVAS_W = WB_COVER.width;
const CANVAS_H = WB_COVER.height;
const OUT_DIR = path.join(__dirname, "output", "sprint8b");
const POLICY_MAX = 39.4;

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
  {
    id: "battery-sprayer",
    title: "Аккумуляторный опрыскиватель 16 л",
    category: "garden_tools",
  },
  {
    id: "construction-vacuum",
    title: "Строительный пылесос 30 л",
    category: "professional tool",
  },
  {
    id: "impact-drill",
    title: "Ударная дрель 800 Вт",
    category: "professional tool",
  },
  {
    id: "pressure-washer",
    title: "Мойка высокого давления 180 бар",
    category: "home_appliances",
  },
  {
    id: "home-humidifier",
    title: "Увлажнитель воздуха ультразвуковой",
    category: "home",
  },
] as const;

process.env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] = "1";

function areaPct(w: number, h: number): number {
  return Math.round(((w * h) / (CANVAS_W * CANVAS_H)) * 1000) / 10;
}

function cloneLayout(layout: CompositionLayout): CompositionLayout {
  return JSON.parse(JSON.stringify(layout)) as CompositionLayout;
}

function applyLegacyFinalH(layout: CompositionLayout, productScale: number): CompositionLayout {
  const legacyH = legacyFinalHeightPct(productScale);
  const next = cloneLayout(layout);
  next.product.height = legacyH;
  next.product.maxHeightPct = legacyH;
  next.product.areaPct = zoneAreaPct(next.product.maxWidthPct, legacyH);
  next.metrics = {
    ...next.metrics,
    productAreaPct: zoneAreaPct(next.product.maxWidthPct, legacyH),
  };
  return next;
}

async function tracePipeline(layout: CompositionLayout, objectScale: number) {
  const maxSize = computeMaxProductSize(layout, objectScale, "calibrated");
  const cutout = await sharp({
    create: {
      width: maxSize.maxW,
      height: maxSize.maxH,
      channels: 4,
      background: { r: 200, g: 140, b: 40, alpha: 255 },
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
    maxW: maxSize.maxW,
    maxH: maxSize.maxH,
    overlapPct: layout.metrics.overlapPct,
  };
}

function surveyTemplate(templateId: LayoutTemplateId, productScale: number) {
  const { layout } = buildLayoutFromTemplate(getTemplate(templateId), STANDARD_MEANING);
  const legacy = applyLegacyFinalH(layout, productScale);
  const at1 = computeMaxProductSize(layout, 1.0, "calibrated").placementAreaPct;
  const legacyAt1 = computeMaxProductSize(legacy, 1.0, "calibrated").placementAreaPct;
  return {
    templateId,
    productZoneH8b: layout.product.maxHeightPct,
    productZoneHLegacy: legacy.product.maxHeightPct,
    allowedAtObjectScale1_8b: at1,
    allowedAtObjectScale1_legacy: legacyAt1,
    gapToPolicy8b: Math.round((POLICY_MAX - at1) * 10) / 10,
    gain: Math.round((at1 - legacyAt1) * 10) / 10,
  };
}

async function runProduct(product: (typeof PRODUCTS)[number]) {
  const analysis = { category: product.category, priceSegment: "mass", brandTone: "natural" } as ProductAnalysis;
  const legacyLayout = buildInitialLayoutSpec({
    analysis,
    palette: ["#1a1a2e", "#f8fafc", "#f97316", "#64748b"],
  });
  const genome = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    category: product.category,
    productTitle: product.title,
    productType: product.category,
    mode: "generation",
  });
  const layoutSpec = stabilizeLayoutSpecWithCommercialIntent(legacyLayout, genome.decision).layout;
  const pro = computeProfessionalLayout({
    meaning: STANDARD_MEANING,
    category: analysis,
    seed: `sprint8b:${product.id}`,
    layoutSpec,
  });

  const commercial = resolveLayoutObjectScale({
    layoutSpec,
    templateAreaPct: pro.layout.metrics.productAreaPct,
  });
  const productScale = getTemplate(pro.templateId).productScale;
  const legacyLayoutGeom = applyLegacyFinalH(pro.layout, productScale);

  const sprint8a = await tracePipeline(legacyLayoutGeom, commercial.objectScale);
  const sprint8bCommercial = await tracePipeline(pro.layout, commercial.objectScale);
  const sprint8bMax = await tracePipeline(pro.layout, 1.0);
  const sprint8aMax = await tracePipeline(legacyLayoutGeom, 1.0);

  const diagnostics = buildGeometryClampDiagnostics({
    layout: pro.layout,
    productScale,
    objectScale: commercial.objectScale,
  });

  return {
    productId: product.id,
    templateId: pro.templateId,
    targetAreaPct: commercial.diagnostics.commercialScaleExpected,
    objectScale: commercial.objectScale,
    diagnostics,
    comparison: {
      sprint7b_8a_commercial: sprint8a,
      sprint8b_commercial: sprint8bCommercial,
      sprint7b_8a_max: sprint8aMax,
      sprint8b_max: sprint8bMax,
    },
    areaGainCommercial:
      Math.round((sprint8bCommercial.allowedAreaPct - sprint8a.allowedAreaPct) * 10) / 10,
    areaGainMax:
      Math.round((sprint8bMax.allowedAreaPct - sprint8aMax.allowedAreaPct) * 10) / 10,
    bboxChanged:
      sprint8bCommercial.width !== sprint8a.width || sprint8bCommercial.height !== sprint8a.height,
    overlapRegression: sprint8bCommercial.overlapPct > sprint8a.overlapPct + 2,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const templateSurvey = LAYOUT_TEMPLATES.map((t) => surveyTemplate(t.id, t.productScale));
  const productResults = [];

  for (const p of PRODUCTS) {
    console.log(`==> ${p.id}`);
    productResults.push(await runProduct(p));
  }

  const avgLegacyMax =
    Math.round(
      (productResults.reduce((s, r) => s + r.comparison.sprint7b_8a_max.allowedAreaPct, 0) /
        productResults.length) *
        10,
    ) / 10;
  const avg8bMax =
    Math.round(
      (productResults.reduce((s, r) => s + r.comparison.sprint8b_max.allowedAreaPct, 0) /
        productResults.length) *
        10,
    ) / 10;
  const avgGain = Math.round((avg8bMax - avgLegacyMax) * 10) / 10;
  const ceilingReached = productResults.filter(
    (r) => r.comparison.sprint8b_max.allowedAreaPct >= 38.5,
  ).length;

  const report = {
    sprint: "DAOS Product Sprint 8B — Template Geometry Clamp Optimization",
    timestamp: new Date().toISOString(),
    change: {
      file: "layout-engine/builder.ts",
      finalHClampMax: `${PRODUCT_FINAL_HEIGHT_LEGACY_MAX_PCT} → 58`,
    },
    policyMaxPct: POLICY_MAX,
    templateSurvey,
    metrics: {
      templates: templateSurvey.length,
      products: productResults.length,
      avgAllowedLegacyMax: avgLegacyMax,
      avgAllowed8bMax: avg8bMax,
      avgGainPct: avgGain,
      ceilingReachedCount: ceilingReached,
      overlapRegressions: productResults.filter((r) => r.overlapRegression).length,
    },
    successCriteria: {
      ceilingIncreased: avg8bMax >= 35,
      gapToPolicyReduced: avg8bMax > avgLegacyMax,
      noOverlapRegression: productResults.every((r) => !r.overlapRegression),
      minimalLocalChange: true,
      note:
        "Ceiling measured @ objectScale=1. Commercial objectScale=0.55 is fixed by propagation (out of scope); re-run calibration to harvest ceiling gain in production.",
    },
    productResults,
  };

  const outPath = path.join(OUT_DIR, "template-geometry-optimization.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("\n=== Sprint 8B Summary ===");
  console.log(`avg allowed @ objectScale=1: ${avgLegacyMax}% → ${avg8bMax}% (+${avgGain})`);
  console.log(`policy ceiling reached: ${ceilingReached}/${productResults.length}`);
  console.log(`overlap regressions: ${report.metrics.overlapRegressions}`);
  console.log(`Output: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
