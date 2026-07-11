#!/usr/bin/env npx tsx
/**
 * Sprint 6A — Commercial Compositor Audit (read-only).
 * Traces LayoutSpec → compositionLayout → objectScale disconnect without mutating compositor.
 */
import fs from "node:fs";
import path from "node:path";
import { createCommercialGenomeBetaDecision } from "../src/lib/daos/commercial-genome-beta";
import { buildInitialLayoutSpec } from "../src/lib/design/layout-spec/builder";
import {
  stabilizeLayoutSpecWithCommercialIntent,
  COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
} from "../src/lib/design/layout-spec/commercial-layout-integration";
import {
  layoutSpecToTemplatePreference,
  simplifyCardMeaningForSpec,
} from "../src/lib/design/layout-spec/patches";
import { computeProfessionalLayout } from "../src/lib/layout-engine";
import type { CardMeaning } from "../src/lib/layout-engine/types";
import type { ProductAnalysis } from "../src/lib/product-analysis";
import { zoneAreaPct } from "../src/lib/composition/canvas";

/** Production copy — generate-infographic-handler.ts:285 */
function layoutObjectScale(areaPct?: number): number {
  const pct = areaPct ?? 65;
  return Math.min(0.62, Math.max(0.5, pct / 100));
}

/** Proposed integration (NOT applied in 6A) */
function layoutObjectScaleWithLayoutSpec(
  compositionAreaPct?: number,
  layoutSpec?: { heroScale?: number; productAreaPct?: number },
): number {
  const pct =
    layoutSpec?.productAreaPct ??
    (layoutSpec?.heroScale != null ? Math.round(layoutSpec.heroScale * 100) : undefined) ??
    compositionAreaPct ??
    65;
  return Math.min(0.62, Math.max(0.5, pct / 100));
}

/** Production copy — scene-compositor.ts computeMaxProductSize fallback */
function computeMaxProductSizeFallback(objectScale: number) {
  const canvasMaxW = Math.round(900 * 0.68);
  const canvasMaxH = Math.round(1200 * 0.58);
  const scale = 0.55 + objectScale * 0.18;
  return {
    maxW: Math.min(canvasMaxW, Math.round(canvasMaxW * scale)),
    maxH: Math.min(canvasMaxH, Math.round(canvasMaxH * scale)),
  };
}

function computeMaxProductSizeFromLayout(
  product: { maxWidthPct: number; maxHeightPct: number },
  objectScale: number,
) {
  const zoneW = Math.round((product.maxWidthPct / 100) * 900);
  const zoneH = Math.round((product.maxHeightPct / 100) * 1200);
  const scaleBoost = 0.58 + objectScale * 0.05;
  return {
    maxW: Math.min(Math.round(900 * 0.68), Math.round(zoneW * scaleBoost)),
    maxH: Math.min(Math.round(1200 * 0.58), Math.round(zoneH * scaleBoost)),
  };
}

const PRODUCTS: Array<{
  id: string;
  title: string;
  analysis: ProductAnalysis;
  productColor?: string;
}> = [
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
];

const OUT_DIR = path.join(__dirname, "output", "sprint6a");

function buildCardMeaning(title: string): CardMeaning {
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

function auditProduct(product: (typeof PRODUCTS)[0]) {
  const meaning = buildCardMeaning(product.title);
  const legacyLayout = buildInitialLayoutSpec({
    analysis: product.analysis,
    palette: ["#1a1a2e", "#f8fafc", "#f97316", "#64748b"],
  });

  process.env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] = "1";
  process.env.DAOS_COMMERCIAL_GENOME_BETA = "1";

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
  ).layout;

  function runArm(layoutSpec: typeof legacyLayout, arm: "legacy" | "commercial") {
    const simplified = simplifyCardMeaningForSpec(meaning, layoutSpec);
    const templatePref = layoutSpecToTemplatePreference(layoutSpec);
    const pro = computeProfessionalLayout({
      meaning: simplified,
      category: product.analysis,
      seed: `sprint6a:${product.id}:${arm}`,
      layoutSpec,
      templateId: templatePref,
    });

    const compositionAreaPct = pro.layout.metrics.productAreaPct;
    const productionObjectScale = layoutObjectScale(compositionAreaPct);
    const integratedObjectScale = layoutObjectScaleWithLayoutSpec(compositionAreaPct, layoutSpec);

    const maxSizeProduction = computeMaxProductSizeFromLayout(
      {
        maxWidthPct: pro.layout.product.maxWidthPct,
        maxHeightPct: pro.layout.product.maxHeightPct,
      },
      productionObjectScale,
    );
    const maxSizeIntegrated = computeMaxProductSizeFromLayout(
      {
        maxWidthPct: pro.layout.product.maxWidthPct,
        maxHeightPct: pro.layout.product.maxHeightPct,
      },
      integratedObjectScale,
    );

    const layoutSpecTargetPct =
      layoutSpec.productAreaPct ?? Math.round((layoutSpec.heroScale ?? 0.66) * 100);

    return {
      arm,
      layoutSpecFields: {
        heroScale: layoutSpec.heroScale,
        productAreaPct: layoutSpec.productAreaPct,
        primaryObject: layoutSpec.primaryObject,
        hierarchy: layoutSpec.hierarchy,
        maxIcons: layoutSpec.maxIcons,
        maxCharacteristics: layoutSpec.maxCharacteristics,
        scenePreference: layoutSpec.scenePreference,
        backgroundPalettePreference: layoutSpec.backgroundPalettePreference,
        heroPosition: layoutSpec.heroPosition,
        maxSecondaryObjects: layoutSpec.maxSecondaryObjects,
      },
      templateId: pro.templateId,
      compositionLayout: {
        productAreaPct: compositionAreaPct,
        productZonePct: zoneAreaPct(pro.layout.product.width, pro.layout.product.height),
        productLeft: pro.layout.product.left,
        productTop: pro.layout.product.top,
        productWidth: pro.layout.product.width,
        productHeight: pro.layout.product.height,
        maxWidthPct: pro.layout.product.maxWidthPct,
        maxHeightPct: pro.layout.product.maxHeightPct,
        textAreaPct: pro.layout.metrics.textAreaPct,
        whitespacePct: pro.layout.metrics.whitespacePct,
      },
      compositorBridge: {
        layoutSpecTargetPct,
        compositionAreaPct,
        areaPctDelta: compositionAreaPct - layoutSpecTargetPct,
        productionObjectScale,
        integratedObjectScale,
        objectScaleDelta: integratedObjectScale - productionObjectScale,
        maxSizeProduction,
        maxSizeIntegrated,
        maxWidthDelta: maxSizeIntegrated.maxW - maxSizeProduction.maxW,
        maxHeightDelta: maxSizeIntegrated.maxH - maxSizeProduction.maxH,
        layoutSpecFeedsObjectScale: false,
        layoutSpecFeedsCompositionLayout: false,
      },
    };
  }

  const legacy = runArm(legacyLayout, "legacy");
  const commercial = runArm(commercialLayout, "commercial");

  return {
    productId: product.id,
    title: product.title,
    legacy,
    commercial,
    commercialVsLegacy: {
      layoutSpecHeroScaleChanged:
        legacy.layoutSpecFields.heroScale !== commercial.layoutSpecFields.heroScale,
      layoutSpecProductAreaPctChanged:
        legacy.layoutSpecFields.productAreaPct !== commercial.layoutSpecFields.productAreaPct,
      compositionAreaPctChanged:
        legacy.compositionLayout.productAreaPct !== commercial.compositionLayout.productAreaPct,
      objectScaleChanged:
        legacy.compositorBridge.productionObjectScale !==
        commercial.compositorBridge.productionObjectScale,
      compositorWouldChangeWithIntegration:
        commercial.compositorBridge.objectScaleDelta !== 0,
    },
  };
}

function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const productResults = PRODUCTS.map(auditProduct);

  const layoutSpecUsageMatrix = [
    {
      field: "heroScale",
      used: "PARTIAL",
      module: "layout-spec/patches.ts → layoutSpecToTemplatePreference",
      compositor: "NO",
      notes: "Only selects template (hero_right vs commercial). Not passed to objectScale.",
    },
    {
      field: "productAreaPct",
      used: "NO",
      module: "commercial-layout-integration (write only)",
      compositor: "NO",
      notes: "Never read by compositor or layoutObjectScale.",
    },
    {
      field: "primaryObject",
      used: "NO",
      module: "—",
      compositor: "NO",
      notes: "Not referenced in compositor or layout-engine.",
    },
    {
      field: "hierarchy",
      used: "NO",
      module: "visual-pipeline/composition director (geometry only)",
      compositor: "NO",
      notes: "layoutSpec.hierarchy unused; composition director uses geometry.hero x only.",
    },
    {
      field: "maxIcons",
      used: "NO",
      module: "prompt-compiler only",
      compositor: "NO",
      notes: "Badge count not enforced in scene-compositor.",
    },
    {
      field: "maxCharacteristics",
      used: "NO",
      module: "prompt-compiler only",
      compositor: "NO",
      notes: "Typography lines not limited by compositor.",
    },
    {
      field: "scenePreference",
      used: "NO",
      module: "visual-pipeline materializer",
      compositor: "NO",
      notes: "Affects Flux only (Sprint 4). Compositor uses ScenePlan, not scenePreference.",
    },
    {
      field: "backgroundPalettePreference",
      used: "NO",
      module: "visual-pipeline materializer",
      compositor: "NO",
      notes: "Flux prompt only. HTML overlay uses separate accent/palette.",
    },
    {
      field: "visualPriority",
      used: "NO",
      module: "—",
      compositor: "NO",
      notes: "Field does not exist on LayoutSpec; mapped to hierarchy in Genome.",
    },
    {
      field: "productDominance",
      used: "NO",
      module: "—",
      compositor: "NO",
      notes: "Field does not exist on LayoutSpec; mapped to primaryObject in Genome.",
    },
  ];

  const lossAttribution = [
    {
      parameter: "Product Area",
      chain: "Genome → LayoutSpec.heroScale/productAreaPct → (BREAK) → compositionLayout.metrics → layoutObjectScale → objectScale → computeMaxProductSize → fitProductWithSafePlacement → Final PNG",
      lossStage: "Compositor bridge (layoutObjectScale)",
      evidence: "layoutSpec.productAreaPct never read; compositionAreaPct from template.productScale (~65-68%)",
    },
    {
      parameter: "Product Dominance",
      chain: "Genome → primaryObject → (BREAK) → template.productScale + alpha-fit shrink loop → HTML typography overlay",
      lossStage: "Compositor + HTML overlay",
      evidence: "primaryObject unused; fitProductWithSafePlacement may shrink cutout up to 8 attempts",
    },
    {
      parameter: "Visual Hierarchy",
      chain: "Genome → hierarchy → (BREAK) → layout-engine template + infographic-html-templates",
      lossStage: "Layout-engine template + Typography HTML",
      evidence: "hierarchy not passed to compositionLayout or compositor",
    },
    {
      parameter: "Background Separation",
      chain: "Genome → backgroundPalettePreference → VisualSceneBlueprint → Flux → (partial) HTML badges/headline",
      lossStage: "HTML overlay (minor)",
      evidence: "Flux background OK (Sprint 4); final PNG adds text zones not in fidelity measurement",
    },
    {
      parameter: "Scene Consistency",
      chain: "Genome → scenePreference → VisualSceneBlueprint → Flux → compositor (pass-through)",
      lossStage: "None significant at compositor",
      evidence: "scene-compositor resizes background only; does not replace scene",
    },
  ];

  const minimalIntegration = {
    proposal: "LayoutSpec.productAreaPct → layoutObjectScale() → objectScale → compositeProductIntoScene()",
    file: "src/lib/generate-infographic-handler.ts",
    function: "layoutObjectScale",
    callSites: [
      "line ~1199 initial objectScale",
      "line ~1514 chief fix retry",
      "line ~1663 v17 retry path",
    ],
    existingHook: "SceneCompositeOptions.objectScale already consumed by computeMaxProductSize",
    complexity: "Low",
    estimatedProductImpact: "High for Product Area fidelity (pixel bbox scales with objectScale)",
  };

  const summary = {
    sprint: "DAOS Product Sprint 6A — Commercial Compositor Audit",
    timestamp: new Date().toISOString(),
    productionPipeline: {
      cutout: "loadProductCutout → productCutoutPath",
      resize: "prepareProductLayer / fitProductByAlphaBounds",
      scale: "layoutObjectScale → computeMaxProductSize → objectScale",
      placement: "fitProductWithSafePlacement → resolveVerticalTop → detectFloorY",
      shadow: "generateShadows + renderFloorContactShadow",
      overlay: "sharp.composite layers + applySceneHarmony",
      typography: "renderInfographicHtml → infographic-html-templates",
      badges: "marketplace-badges / parametricBadgeHtml",
      finalPng: "renderHtmlToImage (puppeteer) → polishCoverImage",
    },
    productAreaOwnership: {
      layoutSpecTarget: "layoutSpec.heroScale / productAreaPct (commercial integration)",
      compositionMetrics: "layout-engine/builder.ts computeMetrics → zoneAreaPct(product.width, product.height)",
      compositorScale: "generate-infographic-handler layoutObjectScale(compositionLayout.metrics.productAreaPct)",
      compositorMaxSize: "scene-compositor.ts computeMaxProductSize(compositionLayout, objectScale)",
      compositorPlacement: "alpha-fit.ts fitProductWithSafePlacement + ground-detector getAlphaBounds",
      actualBbox: "compositeProductIntoScene returns productPlacement {left, top, width, height}",
    },
    layoutSpecUsageMatrix,
    lossAttribution,
    minimalIntegration,
    productResults,
    aggregate: {
      products: productResults.length,
      commercialLayoutSpecChanged: productResults.filter(
        (r) => r.commercialVsLegacy.layoutSpecProductAreaPctChanged,
      ).length,
      compositionUnchanged: productResults.filter(
        (r) => !r.commercialVsLegacy.compositionAreaPctChanged,
      ).length,
      objectScaleUnchanged: productResults.filter((r) => !r.commercialVsLegacy.objectScaleChanged)
        .length,
      integrationWouldChangeScale: productResults.filter(
        (r) => r.commercialVsLegacy.compositorWouldChangeWithIntegration,
      ).length,
      avgAreaPctGap:
        Math.round(
          (productResults.reduce(
            (a, r) => a + r.commercial.compositorBridge.areaPctDelta,
            0,
          ) /
            productResults.length) *
            10,
        ) / 10,
    },
  };

  const outPath = path.join(OUT_DIR, "compositor-audit.json");
  fs.writeFileSync(outPath, JSON.stringify(summary, null, 2));

  console.log("=== Sprint 6A Compositor Audit ===");
  console.log(`Products: ${summary.aggregate.products}`);
  console.log(
    `Commercial layoutSpec changed: ${summary.aggregate.commercialLayoutSpecChanged}/${summary.aggregate.products}`,
  );
  console.log(
    `Composition productAreaPct unchanged: ${summary.aggregate.compositionUnchanged}/${summary.aggregate.products}`,
  );
  console.log(
    `Production objectScale unchanged: ${summary.aggregate.objectScaleUnchanged}/${summary.aggregate.products}`,
  );
  console.log(
    `Would change with proposed integration: ${summary.aggregate.integrationWouldChangeScale}/${summary.aggregate.products}`,
  );
  console.log(`Avg areaPct gap (composition - layoutSpec): ${summary.aggregate.avgAreaPctGap}%`);
  console.log(`Minimal integration: ${minimalIntegration.proposal}`);
  console.log(`Output: ${outPath}`);
}

main();
