#!/usr/bin/env npx tsx
/**
 * Sprint 8C — Product Area Target Recalibration benchmark.
 * Compares Sprint 8B (aspirational 55% / objectScale 0.55) vs 8C (reachable 42% / ceiling harvest).
 */
import fs from "node:fs";
import path from "node:path";
import { WB_COVER } from "../src/lib/composition/canvas";
import { computeMaxProductSize } from "../src/lib/compositing/commercial-calibration";
import { fitProductWithSafePlacement } from "../src/lib/compositing/alpha-fit";
import { getAlphaBounds } from "../src/lib/compositing/ground-detector";
import {
  PRODUCT_MAX_WIDTH_PX,
  PRODUCT_TARGET_MAX_HEIGHT_PX,
} from "../src/lib/product-render-policy";
import { computeProfessionalLayout } from "../src/lib/layout-engine";
import { getTemplate } from "../src/lib/layout-engine/templates";
import { createCommercialGenomeBetaDecision } from "../src/lib/daos/commercial-genome-beta";
import { buildInitialLayoutSpec } from "../src/lib/design/layout-spec/builder";
import {
  stabilizeLayoutSpecWithCommercialIntent,
  COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
} from "../src/lib/design/layout-spec/commercial-layout-integration";
import { resolveLayoutObjectScale } from "../src/lib/design/layout-spec/commercial-layout-propagation";
import { GEOMETRY_CEILING_OBJECT_SCALE } from "../src/lib/design/layout-spec/commercial-target-propagation";
import {
  ASPIRATIONAL_PRODUCT_AREA_TARGET,
  REACHABLE_PRODUCT_AREA_TARGET,
} from "../src/lib/daos/commercial-genome-beta/product-area-targets";
import { deriveProductAreaTargets } from "../src/lib/commercial-fidelity/expectations";
import type { CardMeaning } from "../src/lib/layout-engine/types";
import type { ProductAnalysis } from "../src/lib/product-analysis";

const CANVAS_W = WB_COVER.width;
const CANVAS_H = WB_COVER.height;
const OUT_DIR = path.join(__dirname, "output", "sprint8c");

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
  { id: "battery-sprayer", title: "Аккумуляторный опрыскиватель 16 л", category: "garden_tools" },
  { id: "construction-vacuum", title: "Строительный пылесос 30 л", category: "professional tool" },
  { id: "impact-drill", title: "Ударная дрель 800 Вт", category: "professional tool" },
  { id: "pressure-washer", title: "Мойка высокого давления 180 бар", category: "home_appliances" },
  { id: "home-humidifier", title: "Увлажнитель воздуха ультразвуковой", category: "home" },
] as const;

process.env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] = "1";

function areaPct(w: number, h: number): number {
  return Math.round(((w * h) / (CANVAS_W * CANVAS_H)) * 1000) / 10;
}

function fidelityScoreForProductArea(expected: number, measured: number): number {
  const delta = Math.abs(measured - expected);
  const penalty = Math.min(100, delta * 2.5);
  return Math.round(Math.max(0, 100 - penalty) * 10) / 10;
}

/** Sprint 8B model — aspirational 55% target, objectScale 0.55 */
function sprint8bLayoutSpec(genomeLayout: ReturnType<typeof buildInitialLayoutSpec>) {
  return {
    ...genomeLayout,
    heroScale: 0.55,
    productAreaPct: 55,
    commercialLayout: {
      commercialIntentReceived: true,
      commercialIntentApplied: ["heroScale", "productAreaPct"],
      commercialIntentIgnored: [],
      commercialIntentReason: {},
      commercialIntegrationVersion: "1.1.0-sprint1",
      commercialDecisionId: "sprint8b-legacy",
    },
  };
}

async function traceProduct(
  product: (typeof PRODUCTS)[number],
  mode: "sprint8b" | "sprint8c",
) {
  const analysis = { category: product.category, priceSegment: "mass", brandTone: "natural" } as ProductAnalysis;
  const genome = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    category: product.category,
    productTitle: product.title,
    productType: product.category,
    mode: "generation",
  });

  const baseLayout = buildInitialLayoutSpec({
    analysis,
    palette: ["#1a1a2e", "#f8fafc", "#f97316", "#64748b"],
  });

  const layoutSpec =
    mode === "sprint8c"
      ? stabilizeLayoutSpecWithCommercialIntent(baseLayout, genome.decision).layout
      : sprint8bLayoutSpec(baseLayout);

  const pro = computeProfessionalLayout({
    meaning: STANDARD_MEANING,
    category: analysis,
    seed: `sprint8c:${mode}:${product.id}`,
    layoutSpec,
  });

  const propagation =
    mode === "sprint8c"
      ? resolveLayoutObjectScale({
          layoutSpec,
          templateAreaPct: pro.layout.metrics.productAreaPct,
        })
      : {
          objectScale: 0.55,
          diagnostics: {
            commercialScaleExpected: 55,
            commercialScaleApplied: 0.55,
            commercialPropagationMode: "legacy_aspirational_55",
          },
        };

  const maxSize = computeMaxProductSize(
    pro.layout,
    propagation.objectScale,
    "calibrated",
  );

  const cutout = await sharpPlaceholder(maxSize.maxW, maxSize.maxH);
  const placement = await fitProductWithSafePlacement(
    cutout,
    maxSize.maxW,
    maxSize.maxH,
    CANVAS_W,
    Math.round(CANVAS_W * 0.1),
    PRODUCT_MAX_WIDTH_PX,
    PRODUCT_TARGET_MAX_HEIGHT_PX,
    pro.layout,
  );
  const bounds = await getAlphaBounds(placement.buffer);
  const measuredArea = bounds ? areaPct(bounds.width, bounds.height) : maxSize.placementAreaPct;

  const targets =
    mode === "sprint8c"
      ? deriveProductAreaTargets({ layoutSpec })
      : {
          reachableTarget: Math.round(REACHABLE_PRODUCT_AREA_TARGET * 100),
          aspirationalTarget: 55,
        };
  const expectedForScoring = mode === "sprint8c" ? targets.reachableTarget : targets.aspirationalTarget;
  const aspirational = targets.aspirationalTarget;
  const reachable = targets.reachableTarget;

  const fidelityScore = fidelityScoreForProductArea(expectedForScoring, measuredArea);
  const aspirationalScore = fidelityScoreForProductArea(aspirational, measuredArea);
  const reachableScore = fidelityScoreForProductArea(reachable, measuredArea);

  return {
    productId: product.id,
    templateId: pro.templateId,
    mode,
    objectScale: propagation.objectScale,
    propagationMode: propagation.diagnostics.commercialPropagationMode,
    expectedTarget: expectedForScoring,
    reachableTarget: reachable,
    aspirationalTarget: aspirational,
    measuredArea,
    allowedArea: maxSize.placementAreaPct,
    fidelityScore,
    aspirationalScore,
    reachableScore,
    unreachableGap: Math.round((aspirational - measuredArea) * 10) / 10,
    targetConflict:
      mode === "sprint8b" ? aspirational - measuredArea > 25 : Math.abs(reachable - measuredArea) < 12,
    productAreaModel: {
      aspirationalTarget: aspirational,
      reachableTarget: reachable,
      measuredArea,
      unreachableGap: Math.round((aspirational - measuredArea) * 10) / 10,
    },
  };
}

async function sharpPlaceholder(w: number, h: number): Promise<Buffer> {
  const sharp = (await import("sharp")).default;
  return sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 200, g: 140, b: 40, alpha: 255 },
    },
  })
    .png()
    .toBuffer();
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const results8b = [];
  const results8c = [];

  for (const p of PRODUCTS) {
    console.log(`==> ${p.id}`);
    results8b.push(await traceProduct(p, "sprint8b"));
    results8c.push(await traceProduct(p, "sprint8c"));
  }

  const avg = (rows: typeof results8c, key: keyof (typeof results8c)[0]) =>
    Math.round((rows.reduce((s, r) => s + (r[key] as number), 0) / rows.length) * 10) / 10;

  const report = {
    sprint: "DAOS Product Sprint 8C — Product Area Target Recalibration",
    timestamp: new Date().toISOString(),
    recalibration: {
      reachableTarget: REACHABLE_PRODUCT_AREA_TARGET,
      aspirationalTarget: ASPIRATIONAL_PRODUCT_AREA_TARGET,
      geometryCeilingObjectScale: GEOMETRY_CEILING_OBJECT_SCALE,
    },
    comparison: {
      sprint8b: {
        objectScale: 0.55,
        expectedTargetPct: 55,
        avgMeasuredArea: avg(results8b, "measuredArea"),
        avgFidelityScore: avg(results8b, "fidelityScore"),
        avgUnreachableGap: avg(results8b, "unreachableGap"),
        targetConflicts: results8b.filter((r) => !r.targetConflict).length,
      },
      sprint8c: {
        objectScale: GEOMETRY_CEILING_OBJECT_SCALE,
        expectedTargetPct: 42,
        avgMeasuredArea: avg(results8c, "measuredArea"),
        avgFidelityScore: avg(results8c, "fidelityScore"),
        avgUnreachableGap: avg(results8c, "unreachableGap"),
        honestTargetAlignment: results8c.filter((r) => r.targetConflict).length,
      },
      measuredAreaGain: Math.round((avg(results8c, "measuredArea") - avg(results8b, "measuredArea")) * 10) / 10,
      fidelityScoreGain: Math.round((avg(results8c, "fidelityScore") - avg(results8b, "fidelityScore")) * 10) / 10,
    },
    successCriteria: {
      targetNoLongerConflictsWithCeiling: avg(results8c, "measuredArea") >= 30,
      fidelityScoreImproved: avg(results8c, "fidelityScore") > avg(results8b, "fidelityScore"),
      honestMeasurement: avg(results8c, "reachableScore") >= avg(results8b, "aspirationalScore"),
      dualTargetModel: true,
    },
    products: PRODUCTS.map((p, i) => ({
      productId: p.id,
      sprint8b: results8b[i],
      sprint8c: results8c[i],
      fidelityDelta: Math.round((results8c[i].fidelityScore - results8b[i].fidelityScore) * 10) / 10,
      measuredAreaDelta:
        Math.round((results8c[i].measuredArea - results8b[i].measuredArea) * 10) / 10,
    })),
  };

  const outPath = path.join(OUT_DIR, "commercial-target-recalibration.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2));

  console.log("\n=== Sprint 8C Summary ===");
  console.log(
    `measured area: ${report.comparison.sprint8b.avgMeasuredArea}% → ${report.comparison.sprint8c.avgMeasuredArea}% (+${report.comparison.measuredAreaGain})`,
  );
  console.log(
    `fidelity score: ${report.comparison.sprint8b.avgFidelityScore} → ${report.comparison.sprint8c.avgFidelityScore} (+${report.comparison.fidelityScoreGain})`,
  );
  console.log(`Output: ${outPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
