#!/usr/bin/env npx tsx
/**
 * Sprint 5 — Commercial Fidelity validation.
 * Legacy → Commercial → Commercial+Fidelity measurement (read-only).
 */
import fs from "node:fs";
import path from "node:path";
import { createCommercialGenomeBetaDecision } from "../src/lib/daos/commercial-genome-beta";
import { evaluateCommercialFidelity } from "../src/lib/commercial-fidelity";
import type { CommercialFidelityReport } from "../src/lib/commercial-fidelity";
import { buildInitialLayoutSpec } from "../src/lib/design/layout-spec/builder";
import {
  stabilizeLayoutSpecWithCommercialIntent,
  COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
} from "../src/lib/design/layout-spec/commercial-layout-integration";
import { planScene } from "../src/lib/design/scene-planner";
import { rebuildVisualPipelineForRender } from "../src/lib/design/visual-pipeline/rebuild-for-render";
import { regenerateMarketplaceBackground } from "../src/lib/render-engine/regenerate-background";
import type { ProductAnalysis } from "../src/lib/product-analysis";
import { diffImages, saveBackgroundBuffer } from "./lib/image-metrics";

const PRODUCTS: Array<{
  id: string;
  title: string;
  analysis: ProductAnalysis;
  productColor?: string;
}> = [
  {
    id: "battery-sprayer",
    title: "Аккумуляторный опрыскиватель 16 л для сада",
    analysis: {
      category: "garden_tools",
      priceSegment: "mass",
      brandTone: "natural",
    } as ProductAnalysis,
  },
  {
    id: "construction-vacuum",
    title: "Строительный пылесос для ремонта 30 л",
    analysis: {
      category: "professional tool",
      priceSegment: "mass",
      brandTone: "technical",
    } as ProductAnalysis,
    productColor: "yellow",
  },
  {
    id: "impact-drill",
    title: "Ударная дрель 800 Вт профессиональная",
    analysis: {
      category: "professional tool",
      priceSegment: "mass",
      brandTone: "technical",
    } as ProductAnalysis,
    productColor: "black",
  },
  {
    id: "pressure-washer",
    title: "Мойка высокого давления 180 бар",
    analysis: {
      category: "home_appliances",
      priceSegment: "mass",
      brandTone: "tech",
    } as ProductAnalysis,
  },
  {
    id: "home-humidifier",
    title: "Увлажнитель воздуха для дома ультразвуковой",
    analysis: {
      category: "home",
      priceSegment: "mass",
      brandTone: "cozy",
    } as ProductAnalysis,
  },
];

const FIXED_SEED = "sprint5-commercial-fidelity-20260709";
const OUT_DIR = path.join(__dirname, "output", "sprint5");
const RENDER_ENABLED = process.env.SPRINT5_SKIP_RENDER !== "1";

process.env.RENDER_ENGINE_V17 = "1";
process.env.DAOS_COMMERCIAL_GENOME_BETA = "1";

type Arm = "legacy" | "commercial";

type ArmResult = {
  arm: Arm;
  imagePath?: string;
  layoutSpec: Record<string, unknown>;
  fidelity?: CommercialFidelityReport;
  renderError?: string;
};

function fidelityTable(report: CommercialFidelityReport) {
  return report.parameters.map((p) => ({
    parameter: p.label,
    expected: p.expected,
    measured: p.measured,
    delta: p.delta,
    status: p.status,
    unit: p.unit,
  }));
}

async function runArm(input: {
  product: (typeof PRODUCTS)[0];
  arm: Arm;
}): Promise<ArmResult> {
  const { product, arm } = input;
  const scenePlan = planScene({
    prompt: product.title,
    seed: `${FIXED_SEED}:${product.id}`,
    productVisual: product.productColor
      ? { dominantColors: [product.productColor], shape: "compact" }
      : undefined,
  }).scene;

  const legacyLayout = buildInitialLayoutSpec({
    analysis: product.analysis,
    palette: ["#1a1a2e", "#f8fafc", "#f97316", "#64748b"],
  });

  const genome =
    arm === "commercial"
      ? createCommercialGenomeBetaDecision({
          marketplace: "wildberries",
          category: product.analysis.category,
          productTitle: product.title,
          productColor: product.productColor,
          productType: product.analysis.category,
          mode: "generation",
        })
      : undefined;

  process.env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] = arm === "commercial" ? "1" : "0";

  const layoutSpec =
    arm === "commercial" && genome
      ? stabilizeLayoutSpecWithCommercialIntent(legacyLayout, genome.decision).layout
      : legacyLayout;

  const pipeline = rebuildVisualPipelineForRender({
    prompt: product.title,
    analysis: product.analysis,
    layoutSpec,
    scenePlan,
    palette: layoutSpec.palette,
  });

  const result: ArmResult = {
    arm,
    layoutSpec: {
      heroScale: layoutSpec.heroScale,
      productAreaPct: layoutSpec.productAreaPct,
      primaryObject: layoutSpec.primaryObject,
      scenePreference: layoutSpec.scenePreference,
      backgroundPalettePreference: layoutSpec.backgroundPalettePreference,
      hierarchy: layoutSpec.hierarchy,
    },
  };

  if (!RENDER_ENABLED) {
    result.renderError = "SPRINT5_SKIP_RENDER=1";
    return result;
  }

  try {
    const bg = await regenerateMarketplaceBackground({
      analysis: product.analysis,
      scenePlan,
      layoutSpec,
      visualBlueprint: pipeline.visualBlueprint,
      sceneBlueprint: pipeline.sceneBlueprint,
      variationSeed: FIXED_SEED,
      seedSuffix: `${product.id}:${arm}`,
      constitutionPassed: true,
      legacyPrompt: product.title,
    });

    const imagePath = await saveBackgroundBuffer(
      bg.engine?.backgroundBuffer ?? Buffer.from([]),
      OUT_DIR,
      `${product.id}-${arm}.png`,
    );
    result.imagePath = imagePath;

    result.fidelity = await evaluateCommercialFidelity({
      imagePath,
      layoutSpec,
      visualBlueprint: pipeline.visualBlueprint,
      productColorHint: product.productColor,
    });
  } catch (e) {
    result.renderError = e instanceof Error ? e.message : String(e);
  }

  return result;
}

function avgScore(reports: CommercialFidelityReport[]): number {
  if (!reports.length) return 0;
  const sum = reports.reduce((a, r) => a + r.diagnostics.commercialFidelityScore, 0);
  return Math.round((sum / reports.length) * 10) / 10;
}

function paramStability(
  results: Array<{ legacy?: CommercialFidelityReport; commercial?: CommercialFidelityReport }>,
) {
  const params = [
    "product_area",
    "product_dominance",
    "visual_hierarchy",
    "background_separation",
    "scene_consistency",
  ] as const;
  return params.map((id) => {
    const deltas = results
      .map((r) => r.commercial?.diagnostics.commercialFidelityDelta[id])
      .filter((d): d is number => d != null);
    const absAvg =
      deltas.length > 0
        ? deltas.reduce((a, d) => a + Math.abs(d), 0) / deltas.length
        : 0;
    return { parameter: id, avgAbsDelta: Math.round(absAvg * 10) / 10, samples: deltas.length };
  });
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const productResults: Array<{
    productId: string;
    title: string;
    legacy: ArmResult;
    commercial: ArmResult;
    comparison: {
      imageDiff?: Awaited<ReturnType<typeof diffImages>>;
      fidelityScoreLegacy?: number;
      fidelityScoreCommercial?: number;
      fidelityScoreDelta?: number;
      commercialFidelityTable?: ReturnType<typeof fidelityTable>;
    };
  }> = [];

  for (const product of PRODUCTS) {
    console.log(`==> ${product.id}`);
    const legacy = await runArm({ product, arm: "legacy" });
    const commercial = await runArm({ product, arm: "commercial" });

    let imageDiff: Awaited<ReturnType<typeof diffImages>> | undefined;
    if (legacy.imagePath && commercial.imagePath) {
      imageDiff = await diffImages(legacy.imagePath, commercial.imagePath);
    }

    productResults.push({
      productId: product.id,
      title: product.title,
      legacy,
      commercial,
      comparison: {
        imageDiff,
        fidelityScoreLegacy: legacy.fidelity?.diagnostics.commercialFidelityScore,
        fidelityScoreCommercial: commercial.fidelity?.diagnostics.commercialFidelityScore,
        fidelityScoreDelta:
          legacy.fidelity && commercial.fidelity
            ? Math.round(
                (commercial.fidelity.diagnostics.commercialFidelityScore -
                  legacy.fidelity.diagnostics.commercialFidelityScore) *
                  10,
              ) / 10
            : undefined,
        commercialFidelityTable: commercial.fidelity
          ? fidelityTable(commercial.fidelity)
          : undefined,
      },
    });
  }

  const commercialReports = productResults
    .map((r) => r.commercial.fidelity)
    .filter((f): f is CommercialFidelityReport => !!f);
  const legacyReports = productResults
    .map((r) => r.legacy.fidelity)
    .filter((f): f is CommercialFidelityReport => !!f);

  const stability = paramStability(productResults.map((r) => ({
    legacy: r.legacy.fidelity,
    commercial: r.commercial.fidelity,
  })));

  const sortedStability = [...stability].sort((a, b) => a.avgAbsDelta - b.avgAbsDelta);
  const mostStable = sortedStability.slice(0, 2).map((s) => s.parameter);
  const mostLost = sortedStability.slice(-2).map((s) => s.parameter);

  const summary = {
    sprint: "DAOS Product Sprint 5 — Commercial Fidelity Engine",
    timestamp: new Date().toISOString(),
    renderEnabled: RENDER_ENABLED,
    products: PRODUCTS.length,
    avgCommercialFidelityScore: avgScore(commercialReports),
    avgLegacyFidelityScore: avgScore(legacyReports),
    mostStableParameters: mostStable,
    mostLostParameters: mostLost,
    unmeasurableAutomatically: [
      "Exact composited product bbox % on background-only Flux images (proxy used)",
      "Typography readability on final card (text overlay not in background render)",
      "Human CTR perception",
      "Brand tone nuance beyond palette/scene proxies",
    ],
    successCriteria: {
      autoCompareDecisionToImage: commercialReports.length >= 5,
      fiveParametersMeasured: commercialReports.every((r) => r.parameters.length === 5),
      avgScoreCalculated: commercialReports.length > 0,
      explainsMismatch: commercialReports.every(
        (r) => r.diagnostics.commercialImprovementCandidates.length > 0 ||
          r.diagnostics.commercialValidationWarnings.length > 0 ||
          r.parameters.some((p) => p.status !== "OK"),
      ),
      noPipelineChanges: true,
    },
    parameterStability: stability,
    productResults,
  };

  const outPath = path.join(OUT_DIR, "commercial-fidelity-validation.json");
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

  console.log("\n=== Sprint 5 Summary ===");
  console.log(`Commercial fidelity reports: ${commercialReports.length}/${PRODUCTS.length}`);
  console.log(`Avg Commercial Fidelity Score: ${summary.avgCommercialFidelityScore}`);
  console.log(`Most stable: ${mostStable.join(", ")}`);
  console.log(`Most lost: ${mostLost.join(", ")}`);
  console.log(`Output: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
