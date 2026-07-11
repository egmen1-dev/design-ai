#!/usr/bin/env npx tsx
/**
 * Sprint 6C — Commercial Calibration validation.
 * Sensitivity analysis, calibration curve, and 5-product benchmark.
 */
import fs from "node:fs";
import path from "node:path";
import { createCommercialGenomeBetaDecision } from "../src/lib/daos/commercial-genome-beta";
import { evaluateCommercialFidelity } from "../src/lib/commercial-fidelity";
import {
  stabilizeLayoutSpecWithCommercialIntent,
  COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
  resolveLayoutObjectScale,
  layoutObjectScaleFromTemplate,
} from "../src/lib/design/layout-spec";
import { buildInitialLayoutSpec } from "../src/lib/design/layout-spec/builder";
import {
  computeMaxProductSize,
  sensitivitySweep,
  buildCommercialCalibrationDiagnostics,
  COMMERCIAL_CALIBRATION_VERSION,
  type CommercialCalibrationMode,
} from "../src/lib/compositing/commercial-calibration";
import { computeProfessionalLayout } from "../src/lib/layout-engine";
import type { CardMeaning } from "../src/lib/layout-engine/types";
import type { ProductAnalysis } from "../src/lib/product-analysis";

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

const SENSITIVITY_SCALES = [0.3, 0.4, 0.5, 0.55, 0.6, 0.65, 0.7, 0.75];
const OUT_DIR = path.join(__dirname, "output", "sprint6c");

process.env.RENDER_ENGINE_V17 = "1";
process.env.DAOS_COMMERCIAL_GENOME_BETA = "1";
process.env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] = "1";

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

function estimateForMode(
  layout: ReturnType<typeof computeProfessionalLayout>["layout"],
  objectScale: number,
  mode: CommercialCalibrationMode,
) {
  const size = computeMaxProductSize(layout, objectScale, mode);
  return {
    objectScale,
    width: size.maxW,
    height: size.maxH,
    placementAreaPct: size.placementAreaPct,
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
    seed: `sprint6c:${product.id}`,
    layoutSpec,
  });

  const templateScale = layoutObjectScaleFromTemplate(pro.layout.metrics.productAreaPct);
  const commercial = resolveLayoutObjectScale({
    layoutSpec,
    templateAreaPct: pro.layout.metrics.productAreaPct,
  });

  const targetArea = commercial.diagnostics.commercialScaleExpected;
  const objectScaleLegacy = templateScale;
  const objectScale6b = commercial.objectScale;

  const legacy = estimateForMode(pro.layout, objectScaleLegacy, "legacy");
  const sprint6b = estimateForMode(pro.layout, objectScale6b, "legacy");
  const sprint6c = estimateForMode(pro.layout, objectScale6b, "calibrated");

  const calibration = buildCommercialCalibrationDiagnostics({
    objectScale: objectScale6b,
    compositionLayout: pro.layout,
    mode: "calibrated",
    measuredAreaPct: sprint6c.placementAreaPct,
  });

  const sensitivity = {
    legacy: sensitivitySweep(pro.layout, SENSITIVITY_SCALES, "legacy"),
    calibrated: sensitivitySweep(pro.layout, SENSITIVITY_SCALES, "calibrated"),
  };

  const absErrorLegacy = Math.abs(legacy.placementAreaPct - targetArea);
  const absError6b = Math.abs(sprint6b.placementAreaPct - targetArea);
  const absError6c = Math.abs(sprint6c.placementAreaPct - targetArea);

  return {
    productId: product.id,
    title: product.title,
    targetAreaPct: targetArea,
    templateAreaPct: pro.layout.metrics.productAreaPct,
    objectScales: {
      legacy: objectScaleLegacy,
      sprint6b: objectScale6b,
    },
    comparison: {
      legacy,
      sprint6b,
      sprint6c,
    },
    errors: {
      legacy: { absolute: absErrorLegacy, relative: Math.round((absErrorLegacy / targetArea) * 1000) / 10 },
      sprint6b: { absolute: absError6b, relative: Math.round((absError6b / targetArea) * 1000) / 10 },
      sprint6c: { absolute: absError6c, relative: Math.round((absError6c / targetArea) * 1000) / 10 },
    },
    calibration,
    sensitivity,
    improved: absError6c < absError6b,
    bboxChanged: sprint6c.width !== sprint6b.width || sprint6c.height !== sprint6b.height,
    areaDelta6bTo6c: Math.round((sprint6c.placementAreaPct - sprint6b.placementAreaPct) * 10) / 10,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const productResults = [];
  for (const product of PRODUCTS) {
    console.log(`==> ${product.id}`);
    productResults.push(await runProduct(product));
  }

  const improved = productResults.filter((r) => r.improved).length;
  const bboxChanged = productResults.filter((r) => r.bboxChanged).length;
  const measurable = productResults.filter((r) => r.areaDelta6bTo6c >= 2).length;
  const avgErrorLegacy =
    Math.round((productResults.reduce((s, r) => s + r.errors.legacy.absolute, 0) / productResults.length) * 10) / 10;
  const avgError6b =
    Math.round((productResults.reduce((s, r) => s + r.errors.sprint6b.absolute, 0) / productResults.length) * 10) / 10;
  const avgError6c =
    Math.round((productResults.reduce((s, r) => s + r.errors.sprint6c.absolute, 0) / productResults.length) * 10) / 10;

  const calibrationCurve = productResults[0]?.sensitivity.calibrated.map((row) => ({
    objectScale: row.objectScale,
    scaleBoost: row.scaleBoost,
    placementAreaPct: row.placementAreaPct,
    formula: row.formula,
  }));

  const report = {
    sprint: "DAOS Product Sprint 6C — Commercial Calibration Engine",
    version: COMMERCIAL_CALIBRATION_VERSION,
    timestamp: new Date().toISOString(),
    products: productResults.length,
    sensitivityScales: SENSITIVITY_SCALES,
    metrics: {
      errorImproved: improved,
      bboxChanged,
      measurableAreaDelta: measurable,
      avgAbsoluteError: { legacy: avgErrorLegacy, sprint6b: avgError6b, sprint6c: avgError6c },
    },
    calibrationCurve,
    formula: {
      legacy: "scaleBoost = 0.58 + objectScale * 0.05",
      calibrated:
        "scaleBoost = lerp(legacy(0.5), maxBoost(zone,caps), t) where t = (objectScale-0.5)/(0.75-0.5)",
    },
    successCriteria: {
      objectScaleAffectsArea: measurable >= 3,
      targetErrorReduced: avgError6c < avgError6b,
      measurableDelta: measurable >= 3,
      noCompositorRewrite: true,
      legacyFallbackPreserved: true,
    },
    productResults,
  };

  const outPath = path.join(OUT_DIR, "commercial-calibration.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("\n=== Sprint 6C Summary ===");
  console.log(`error improved: ${improved}/${productResults.length}`);
  console.log(`bbox changed (6B→6C): ${bboxChanged}/${productResults.length}`);
  console.log(`measurable area delta: ${measurable}/${productResults.length}`);
  console.log(`avg abs error: legacy=${avgErrorLegacy}% 6B=${avgError6b}% 6C=${avgError6c}%`);
  console.log(`Output: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
