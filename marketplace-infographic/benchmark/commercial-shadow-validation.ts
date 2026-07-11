#!/usr/bin/env npx tsx
/**
 * Shadow validation — Sprint 1 commercial layout integration.
 * Runs 5 product profiles through Genome → LayoutSpec → Prompt → VisualSceneBlueprint (no render API).
 */
import fs from "node:fs";
import path from "node:path";
import { createCommercialGenomeBetaDecision } from "../src/lib/daos/commercial-genome-beta";
import { buildInitialLayoutSpec } from "../src/lib/design/layout-spec/builder";
import {
  stabilizeLayoutSpecWithCommercialIntent,
  COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
} from "../src/lib/design/layout-spec/commercial-layout-integration";
import { compileRenderingPrompt } from "../src/lib/design/prompt-compiler/compiler";
import { planScene } from "../src/lib/design/scene-planner";
import { rebuildVisualPipelineForRender } from "../src/lib/design/visual-pipeline/rebuild-for-render";
import type { ProductAnalysis } from "../src/lib/product-analysis";

const PRODUCTS: Array<{
  id: string;
  title: string;
  analysis: ProductAnalysis;
  productColor?: string;
}> = [
  {
    id: "yellow-tool",
    title: "Жёлтый шуруповёрт профессиональный",
    analysis: {
      category: "professional tool",
      priceSegment: "mass",
      brandTone: "technical",
    } as ProductAnalysis,
    productColor: "yellow",
  },
  {
    id: "garden-pump",
    title: "Насос для сада и огорода",
    analysis: {
      category: "garden_tools",
      priceSegment: "mass",
      brandTone: "natural",
    } as ProductAnalysis,
  },
  {
    id: "electronics-earbuds",
    title: "Беспроводные наушники TWS",
    analysis: {
      category: "electronics",
      priceSegment: "mass",
      brandTone: "tech",
    } as ProductAnalysis,
  },
  {
    id: "cosmetics-serum",
    title: "Сыворотка для лица премиум",
    analysis: {
      category: "cosmetics",
      priceSegment: "premium",
      brandTone: "luxury",
    } as ProductAnalysis,
  },
  {
    id: "home-diffuser",
    title: "Аромадиффузор для дома уют",
    analysis: {
      category: "home",
      priceSegment: "mass",
      brandTone: "cozy",
    } as ProductAnalysis,
  },
];

process.env.DAOS_COMMERCIAL_GENOME_BETA = "1";
process.env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] = "1";

const results = PRODUCTS.map((product) => {
  const genome = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    category: product.analysis.category,
    productTitle: product.title,
    productColor: product.productColor,
    productType: product.analysis.category,
    mode: "generation",
  });

  const legacyLayout = buildInitialLayoutSpec({
    analysis: product.analysis,
    palette: ["#1a1a2e", "#f8fafc", "#f97316", "#64748b"],
  });

  const integrated = stabilizeLayoutSpecWithCommercialIntent(legacyLayout, genome.decision, {
    includeDebugBundle: true,
  });

  const scenePlan = planScene({
    prompt: product.title,
    seed: `shadow-${product.id}`,
    productVisual: product.productColor
      ? { dominantColors: [product.productColor], shape: "compact" }
      : undefined,
  }).scene;

  const compiled = compileRenderingPrompt({
    prompt: product.title,
    analysis: product.analysis,
    scenePlan,
    layoutSpec: integrated.layout,
  });

  const visual = rebuildVisualPipelineForRender({
    prompt: product.title,
    analysis: product.analysis,
    layoutSpec: integrated.layout,
    scenePlan,
    palette: integrated.layout.palette,
  });

  const hierarchyInPrompt = compiled.prompt.includes("VISUAL HIERARCHY")
    || compiled.prompt.toLowerCase().includes("hierarchy")
    || compiled.metadata.sections.some((s) => s.id === "visual_hierarchy");

  const layoutChanged =
    legacyLayout.heroScale !== integrated.layout.heroScale ||
    legacyLayout.maxIcons !== integrated.layout.maxIcons ||
    !!integrated.layout.hierarchy;

  return {
    productId: product.id,
    productTitle: product.title,
    commercialDecision: genome.decision,
    layoutSpecLegacy: {
      heroScale: legacyLayout.heroScale,
      maxIcons: legacyLayout.maxIcons,
      hierarchy: legacyLayout.hierarchy,
    },
    layoutSpecIntegrated: {
      heroScale: integrated.layout.heroScale,
      productAreaPct: integrated.layout.productAreaPct,
      maxIcons: integrated.layout.maxIcons,
      maxBadges: integrated.layout.maxBadges,
      hierarchy: integrated.layout.hierarchy,
      scenePreference: integrated.layout.scenePreference,
      backgroundPalettePreference: integrated.layout.backgroundPalettePreference,
      typographyStrategy: integrated.layout.typographyStrategy,
      commercialLayout: integrated.layout.commercialLayout,
    },
    promptExcerpt: compiled.prompt.slice(0, 500),
    promptHasHierarchy: hierarchyInPrompt,
    visualSceneBlueprint: {
      sceneType: visual.visualBlueprint.scene.architecture,
      compositionTemplate: visual.visualBlueprint.composition.templateId,
      lighting: visual.visualBlueprint.lighting.preset,
    },
    validation: {
      layoutChanged,
      commercialIntentApplied: integrated.diagnostics.commercialIntentApplied,
      commercialIntentIgnored: integrated.diagnostics.commercialIntentIgnored,
      reachesPrompt: hierarchyInPrompt || integrated.layout.heroScale !== legacyLayout.heroScale,
    },
  };
});

const outDir = path.join(__dirname, "output");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "commercial-shadow-sprint1.json");
fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));

const passed = results.filter((r) => r.validation.layoutChanged).length;
console.log(`Shadow validation: ${passed}/${results.length} products show commercial layout changes`);
console.log(`Output: ${outPath}`);
for (const r of results) {
  console.log(
    `  ${r.productId}: applied=[${r.validation.commercialIntentApplied.join(",")}] prompt=${r.validation.reachesPrompt}`,
  );
}

if (passed < 5) {
  process.exitCode = 1;
}
