#!/usr/bin/env npx tsx
/**
 * Product Sprint 2 validation — legacy vs commercial prompt diff (3 products).
 */
import fs from "node:fs";
import path from "node:path";
import { createCommercialGenomeBetaDecision } from "../src/lib/daos/commercial-genome-beta";
import { buildInitialLayoutSpec } from "../src/lib/design/layout-spec/builder";
import {
  stabilizeLayoutSpecWithCommercialIntent,
  COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
} from "../src/lib/design/layout-spec/commercial-layout-integration";
import { planScene } from "../src/lib/design/scene-planner";
import { compileRenderingPrompt } from "../src/lib/design/prompt-compiler/compiler";
import type { ProductAnalysis } from "../src/lib/product-analysis";

const PRODUCTS = [
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
];

process.env.DAOS_COMMERCIAL_GENOME_BETA = "1";
process.env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] = "1";

function diffPromptLines(legacy: string, commercial: string): string[] {
  const legacyParts = legacy.split(", ").map((s) => s.trim());
  const commercialParts = new Set(commercial.split(", ").map((s) => s.trim()));
  return legacyParts.filter((part) => !commercialParts.has(part));
}

function addedPromptLines(legacy: string, commercial: string): string[] {
  const legacyParts = new Set(legacy.split(", ").map((s) => s.trim()));
  return commercial
    .split(", ")
    .map((s) => s.trim())
    .filter((part) => part.length > 0 && !legacyParts.has(part));
}

const results = PRODUCTS.map((product) => {
  const scenePlan = planScene({
    prompt: product.title,
    seed: `sprint2-${product.id}`,
    productVisual: product.productColor
      ? { dominantColors: [product.productColor], shape: "compact" }
      : undefined,
  }).scene;

  const legacyLayout = buildInitialLayoutSpec({
    analysis: product.analysis,
    palette: ["#1a1a2e", "#f8fafc", "#f97316", "#64748b"],
  });

  const genome = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    category: product.analysis.category,
    productTitle: product.title,
    productColor: product.productColor,
    productType: product.analysis.category,
    mode: "generation",
  });

  const commercialLayout = stabilizeLayoutSpecWithCommercialIntent(
    legacyLayout,
    genome.decision,
    { includeDebugBundle: true },
  ).layout;

  const legacyCompiled = compileRenderingPrompt({
    prompt: product.title,
    analysis: product.analysis,
    scenePlan,
    layoutSpec: legacyLayout,
  });

  const commercialCompiled = compileRenderingPrompt({
    prompt: product.title,
    analysis: product.analysis,
    scenePlan,
    layoutSpec: commercialLayout,
  });

  const addedLines = addedPromptLines(legacyCompiled.prompt, commercialCompiled.prompt);
  const layoutDriven = addedLines.filter(
    (line) =>
      line.includes("product hero target") ||
      line.includes("product-first") ||
      line.includes("icon elements") ||
      line.includes("typography strategy") ||
      line.includes("scene preference") ||
      line.includes("background separation") ||
      line.includes("characteristic lines"),
  );

  return {
    productId: product.id,
    productTitle: product.title,
    commercialDecision: genome.decision,
    layoutSpecLegacy: {
      heroScale: legacyLayout.heroScale,
      maxIcons: legacyLayout.maxIcons,
    },
    layoutSpecCommercial: {
      heroScale: commercialLayout.heroScale,
      productAreaPct: commercialLayout.productAreaPct,
      maxIcons: commercialLayout.maxIcons,
      hierarchy: commercialLayout.hierarchy,
      scenePreference: commercialLayout.scenePreference,
      backgroundPalettePreference: commercialLayout.backgroundPalettePreference,
      typographyStrategy: commercialLayout.typographyStrategy,
    },
    promptLegacyExcerpt: legacyCompiled.prompt.slice(0, 400),
    promptCommercialExcerpt: commercialCompiled.prompt.slice(0, 400),
    promptAddedLines: addedLines,
    layoutDrivenPromptLines: layoutDriven,
    promptCommercialDiagnostics: commercialCompiled.metadata.promptCommercial,
    imageImpactHypothesis: layoutDriven.map((line) => ({
      promptLine: line,
      expectedImageEffect:
        line.includes("55%") || line.includes("hero target")
          ? "smaller/larger product zone in background"
          : line.includes("product-first")
            ? "stronger product dominance vs text"
            : line.includes("icon") || line.includes("badge")
              ? "fewer decorative badges in scene"
              : line.includes("cool neutral") || line.includes("background separation")
                ? "background color/contrast shift"
                : line.includes("industrial") || line.includes("outdoor")
                  ? "environment mood shift"
                  : line.includes("typography")
                    ? "headline area treatment"
                    : "hierarchy/read order",
    })),
    validation: {
      promptChanged: legacyCompiled.prompt !== commercialCompiled.prompt,
      layoutDrivenLines: layoutDriven.length,
      commercialIntentRead:
        commercialCompiled.metadata.promptCommercial?.commercialIntentRead ?? [],
    },
  };
});

const outDir = path.join(__dirname, "output");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "product-sprint2-prompt-validation.json");
fs.writeFileSync(outPath, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));

const passed = results.filter(
  (r) => r.validation.promptChanged && r.validation.layoutDrivenLines >= 3,
).length;

console.log(`Product Sprint 2 validation: ${passed}/${results.length} products with layout-driven prompt changes`);
for (const r of results) {
  console.log(
    `  ${r.productId}: +${r.validation.layoutDrivenLines} layout-driven lines, read=[${r.validation.commercialIntentRead.join(",")}]`,
  );
}
console.log(`Output: ${outPath}`);

if (passed < 3) {
  process.exitCode = 1;
}
