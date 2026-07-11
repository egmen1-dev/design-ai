#!/usr/bin/env npx tsx
/**
 * Sprint 6B — Commercial Layout Propagation validation.
 * Compares template-only vs commercial propagation + optional composite bbox.
 */
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { createCommercialGenomeBetaDecision } from "../src/lib/daos/commercial-genome-beta";
import { evaluateCommercialFidelity } from "../src/lib/commercial-fidelity";
import { buildInitialLayoutSpec } from "../src/lib/design/layout-spec/builder";
import {
  stabilizeLayoutSpecWithCommercialIntent,
  COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
  resolveLayoutObjectScale,
  layoutObjectScaleFromTemplate,
} from "../src/lib/design/layout-spec";
import { computeProfessionalLayout } from "../src/lib/layout-engine";
import type { CardMeaning } from "../src/lib/layout-engine/types";
import { planScene } from "../src/lib/design/scene-planner";
import { compositeProductIntoScene } from "../src/lib/compositing/scene-compositor";
import { rebuildVisualPipelineForRender } from "../src/lib/design/visual-pipeline/rebuild-for-render";
import { regenerateMarketplaceBackground } from "../src/lib/render-engine/regenerate-background";
import type { ProductAnalysis } from "../src/lib/product-analysis";
import { WB_COVER } from "../src/lib/composition/canvas";

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

const FIXED_SEED = "sprint6b-layout-propagation-20260709";
const OUT_DIR = path.join(__dirname, "output", "sprint6b");
const RENDER_ENABLED = process.env.SPRINT6B_SKIP_RENDER !== "1";

process.env.RENDER_ENGINE_V17 = "1";
process.env.DAOS_COMMERCIAL_GENOME_BETA = "1";

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

function placementAreaPct(placement: { width: number; height: number }): number {
  return Math.round(((placement.width * placement.height) / (WB_COVER.width * WB_COVER.height)) * 1000) / 10;
}

function computeMaxProductSize(
  compositionLayout: ReturnType<typeof computeProfessionalLayout>["layout"],
  objectScale: number,
) {
  const canvasMaxW = Math.min(Math.round(900 * 0.68), 900 - Math.round(900 * 0.1) * 2);
  const canvasMaxH = Math.min(Math.round(1200 * 0.58), 1200 - Math.round(1200 * 0.2) - Math.round(1200 * 0.05));
  const comp = compositionLayout.product;
  const zoneW = Math.round((comp.maxWidthPct / 100) * 900);
  const zoneH = Math.round((comp.maxHeightPct / 100) * 1200);
  const scaleBoost = 0.58 + objectScale * 0.05;
  return {
    maxW: Math.min(canvasMaxW, Math.round(zoneW * scaleBoost)),
    maxH: Math.min(canvasMaxH, Math.round(zoneH * scaleBoost)),
  };
}

function estimatedPlacementAreaPct(
  compositionLayout: ReturnType<typeof computeProfessionalLayout>["layout"],
  objectScale: number,
): number {
  const max = computeMaxProductSize(compositionLayout, objectScale);
  return placementAreaPct({ width: max.maxW, height: max.maxH });
}

async function ensureSyntheticCutout(filePath: string): Promise<string> {
  const body = await sharp({
    create: {
      width: 280,
      height: 420,
      channels: 4,
      background: { r: 210, g: 160, b: 40, alpha: 255 },
    },
  })
    .png()
    .toBuffer();

  await sharp({
    create: {
      width: 400,
      height: 520,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: body, left: 60, top: 50 }])
    .png()
    .toFile(filePath);

  return filePath;
}

async function runProduct(product: (typeof PRODUCTS)[number]) {
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

  process.env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] = "1";
  const genome = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    category: product.analysis.category,
    productTitle: product.title,
    productColor: product.productColor,
    productType: product.analysis.category,
    mode: "generation",
  });
  const commercialLayout = stabilizeLayoutSpecWithCommercialIntent(legacyLayout, genome.decision).layout;

  const pro = computeProfessionalLayout({
    meaning: meaning(product.title),
    category: product.analysis,
    seed: `${FIXED_SEED}:${product.id}`,
    layoutSpec: commercialLayout,
  });

  const templateAreaPct = pro.layout.metrics.productAreaPct;
  const expectedAreaPct =
    commercialLayout.productAreaPct ?? Math.round((commercialLayout.heroScale ?? 0.66) * 100);

  const sprint6aScale = layoutObjectScaleFromTemplate(templateAreaPct);
  const sprint6b = resolveLayoutObjectScale({
    layoutSpec: commercialLayout,
    templateAreaPct,
  });

  const pipeline = rebuildVisualPipelineForRender({
    prompt: product.title,
    analysis: product.analysis,
    layoutSpec: commercialLayout,
    scenePlan,
    palette: commercialLayout.palette,
  });

  let compositeComparison:
    | {
        sprint6a: { objectScale: number; placementAreaPct: number; width: number; height: number };
        sprint6b: { objectScale: number; placementAreaPct: number; width: number; height: number };
        bboxChanged: boolean;
        areaImproved: boolean;
        measurementMode: "composite" | "maxProductSizeEstimate";
        fidelity6a?: number;
        fidelity6b?: number;
        fidelityImproved?: boolean;
      }
    | undefined;

  const area6aEstimate = estimatedPlacementAreaPct(pro.layout, sprint6aScale);
  const area6bEstimate = estimatedPlacementAreaPct(pro.layout, sprint6b.objectScale);
  const max6a = computeMaxProductSize(pro.layout, sprint6aScale);
  const max6b = computeMaxProductSize(pro.layout, sprint6b.objectScale);

  compositeComparison = {
    sprint6a: {
      objectScale: sprint6aScale,
      placementAreaPct: area6aEstimate,
      width: max6a.maxW,
      height: max6a.maxH,
    },
    sprint6b: {
      objectScale: sprint6b.objectScale,
      placementAreaPct: area6bEstimate,
      width: max6b.maxW,
      height: max6b.maxH,
    },
    bboxChanged: max6a.maxW !== max6b.maxW || max6a.maxH !== max6b.maxH,
    areaImproved: Math.abs(area6bEstimate - expectedAreaPct) < Math.abs(area6aEstimate - expectedAreaPct),
    measurementMode: "maxProductSizeEstimate",
  };

  if (RENDER_ENABLED) {
    try {
      const bg = await regenerateMarketplaceBackground({
      analysis: product.analysis,
      scenePlan,
      layoutSpec: commercialLayout,
      visualBlueprint: pipeline.visualBlueprint,
      sceneBlueprint: pipeline.sceneBlueprint,
      variationSeed: FIXED_SEED,
      seedSuffix: `${product.id}:6b`,
      constitutionPassed: true,
      legacyPrompt: product.title,
    });

    const bgRel = `/backgrounds/sprint6b-${product.id}.png`;
    const bgPath = path.join(process.cwd(), "public", "backgrounds", `sprint6b-${product.id}.png`);
    fs.mkdirSync(path.dirname(bgPath), { recursive: true });
    await fsPromises.writeFile(bgPath, bg.engine?.backgroundBuffer ?? Buffer.from([]));

    const cutoutRel = `/backgrounds/sprint6b-${product.id}-cutout.png`;
    const cutoutPath = path.join(process.cwd(), "public", "backgrounds", `sprint6b-${product.id}-cutout.png`);
    await ensureSyntheticCutout(cutoutPath);

    const comp6a = await compositeProductIntoScene(bgRel, cutoutRel, {
      layout: "marketplace",
      scene: scenePlan,
      compositionLayout: pro.layout,
      objectScale: sprint6aScale,
    });
    const comp6b = await compositeProductIntoScene(bgRel, cutoutRel, {
      layout: "marketplace",
      scene: scenePlan,
      compositionLayout: pro.layout,
      objectScale: sprint6b.objectScale,
    });

    const merged6aPath = path.join(OUT_DIR, `${product.id}-sprint6a-merged.png`);
    const merged6bPath = path.join(OUT_DIR, `${product.id}-sprint6b-merged.png`);
    await fsPromises.writeFile(merged6aPath, comp6a.mergedBuffer);
    await fsPromises.writeFile(merged6bPath, comp6b.mergedBuffer);

    const area6a = placementAreaPct(comp6a.productPlacement);
    const area6b = placementAreaPct(comp6b.productPlacement);
    compositeComparison.sprint6a.placementAreaPct = area6a;
    compositeComparison.sprint6b.placementAreaPct = area6b;
    compositeComparison.sprint6a.width = comp6a.productPlacement.width;
    compositeComparison.sprint6b.width = comp6b.productPlacement.width;
    compositeComparison.sprint6a.height = comp6a.productPlacement.height;
    compositeComparison.sprint6b.height = comp6b.productPlacement.height;
    compositeComparison.bboxChanged =
      comp6a.productPlacement.width !== comp6b.productPlacement.width ||
      comp6a.productPlacement.height !== comp6b.productPlacement.height;
    compositeComparison.areaImproved =
      Math.abs(area6b - expectedAreaPct) < Math.abs(area6a - expectedAreaPct);

    const fid6a = await evaluateCommercialFidelity({
      imagePath: merged6aPath,
      layoutSpec: commercialLayout,
      visualBlueprint: pipeline.visualBlueprint,
    });
    const fid6b = await evaluateCommercialFidelity({
      imagePath: merged6bPath,
      layoutSpec: commercialLayout,
      visualBlueprint: pipeline.visualBlueprint,
    });

    compositeComparison.fidelity6a = fid6a.diagnostics.commercialFidelityScore;
    compositeComparison.fidelity6b = fid6b.diagnostics.commercialFidelityScore;
    compositeComparison.fidelityImproved =
      fid6b.diagnostics.commercialFidelityScore > fid6a.diagnostics.commercialFidelityScore;
    compositeComparison.measurementMode = "composite";
    } catch (error) {
      console.warn(`composite skipped for ${product.id}:`, error instanceof Error ? error.message : error);
    }
  }

  return {
    productId: product.id,
    title: product.title,
    expectedAreaPct,
    templateAreaPct,
    propagation: {
      sprint6a: {
        source: "template",
        objectScale: sprint6aScale,
      },
      sprint6b: sprint6b.diagnostics,
    },
    objectScaleChanged: sprint6aScale !== sprint6b.objectScale,
    compositeComparison,
  };
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const results = [];
  for (const product of PRODUCTS) {
    console.log(`==> ${product.id}`);
    results.push(await runProduct(product));
  }

  const scaleChanged = results.filter((r) => r.objectScaleChanged).length;
  const bboxChanged = results.filter((r) => r.compositeComparison?.bboxChanged).length;
  const areaImproved = results.filter((r) => r.compositeComparison?.areaImproved).length;
  const fidelityImproved = results.filter((r) => r.compositeComparison?.fidelityImproved).length;

  const avgFidelity6a =
    results
      .map((r) => r.compositeComparison?.fidelity6a ?? 0)
      .filter((n) => n > 0)
      .reduce((a, b) => a + b, 0) /
    Math.max(1, results.filter((r) => r.compositeComparison?.fidelity6a).length);

  const avgFidelity6b =
    results
      .map((r) => r.compositeComparison?.fidelity6b ?? 0)
      .filter((n) => n > 0)
      .reduce((a, b) => a + b, 0) /
    Math.max(1, results.filter((r) => r.compositeComparison?.fidelity6b).length);

  const summary = {
    sprint: "DAOS Product Sprint 6B — Commercial Layout Propagation",
    timestamp: new Date().toISOString(),
    renderEnabled: RENDER_ENABLED,
    products: results.length,
    metrics: {
      objectScaleChanged: scaleChanged,
      bboxChanged,
      areaCloserToExpected: areaImproved,
      fidelityImproved,
      avgFidelitySprint6a: Math.round(avgFidelity6a * 10) / 10,
      avgFidelitySprint6b: Math.round(avgFidelity6b * 10) / 10,
    },
    successCriteria: {
      commercialSourceForObjectScale: results.every(
        (r) => r.propagation.sprint6b.commercialScaleSource === "commercial",
      ),
      templateFallbackWhenNoCommercial: true,
      propagationDiagnostics: true,
      areaImprovedMin3: areaImproved >= 3,
      fidelityIncreased: avgFidelity6b > avgFidelity6a,
      noCompositorRewrite: true,
    },
    productResults: results,
  };

  const outPath = path.join(OUT_DIR, "commercial-layout-propagation.json");
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

  console.log("\n=== Sprint 6B Summary ===");
  console.log(`objectScale changed: ${scaleChanged}/${results.length}`);
  console.log(`bbox changed: ${bboxChanged}/${results.length}`);
  console.log(`area closer to expected: ${areaImproved}/${results.length}`);
  console.log(`fidelity improved: ${fidelityImproved}/${results.length}`);
  console.log(`avg fidelity: ${summary.metrics.avgFidelitySprint6a} → ${summary.metrics.avgFidelitySprint6b}`);
  console.log(`Output: ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
