#!/usr/bin/env npx tsx
/**
 * Sprint 3 — Generation Control Surface validation.
 * A/B: Legacy vs Commercial Genome across LayoutSpec → Prompt → Render (Flux/Pollinations).
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
import { materializeCommercialLayoutIntent } from "../src/lib/design/prompt-compiler/commercial-layout-materializer";
import { rebuildVisualPipelineForRender } from "../src/lib/design/visual-pipeline/rebuild-for-render";
import { compilePollinationsPrompt } from "../src/lib/render-engine/adapters/pollinations-compiler";
import { regenerateMarketplaceBackground } from "../src/lib/render-engine/regenerate-background";
import type { ProductAnalysis } from "../src/lib/product-analysis";
import { diffImages, saveBackgroundBuffer, sha256Buffer } from "./lib/image-metrics";

type ControlStrength = "NONE" | "WEAK" | "MEDIUM" | "STRONG" | "DIRECT";

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

const FIXED_SEED = "sprint3-control-surface-20260709";
const OUT_DIR = path.join(__dirname, "output", "sprint3-control-surface");
const RENDER_ENABLED = process.env.SPRINT3_SKIP_RENDER !== "1";

process.env.RENDER_ENGINE_V17 = "1";
process.env.DAOS_COMMERCIAL_GENOME_BETA = "1";

type ArmResult = {
  arm: "legacy" | "commercial";
  layoutSpec: Record<string, unknown>;
  promptCompiler: {
    prompt: string;
    promptLength: number;
    commercialIntentRead: string[];
    commercialIntentIgnored: string[];
  };
  pollinations: {
    prompt: string;
    tokenEstimate: number;
    validationOk: boolean;
    validationIssues: string[];
    architecture: string;
    negativeSpace: string;
  };
  render?: {
    ok: boolean;
    url?: string;
    localPath?: string;
    sha256?: string;
    adapterPrompt?: string;
    overallScore?: number;
    error?: string;
  };
};

function promptChanged(a: string, b: string): boolean {
  return a.trim() !== b.trim();
}

function layoutFieldChanged(
  legacy: Record<string, unknown>,
  commercial: Record<string, unknown>,
  field: string,
): boolean {
  return JSON.stringify(legacy[field]) !== JSON.stringify(commercial[field]);
}

function inferControlStrength(input: {
  inLayout: boolean;
  inPromptCompiler: boolean;
  inPollinations: boolean;
  pollinationsIdentical: boolean;
  imageChanged: boolean;
  meanAbsDiff: number;
}): ControlStrength {
  if (!input.inLayout && !input.inPromptCompiler && !input.inPollinations) return "NONE";
  if (input.inLayout && !input.inPromptCompiler && !input.inPollinations) return "NONE";
  if (input.inPromptCompiler && input.pollinationsIdentical && !input.inPollinations) {
    return input.imageChanged && input.meanAbsDiff > 15 ? "WEAK" : "WEAK";
  }
  if (input.inPromptCompiler && !input.inPollinations && input.pollinationsIdentical) return "WEAK";
  if (input.inPollinations && input.imageChanged && input.meanAbsDiff < 5) return "MEDIUM";
  if (input.inPollinations && input.imageChanged && input.meanAbsDiff >= 5) return "STRONG";
  if (input.inLayout && !input.pollinationsIdentical && input.imageChanged) return "MEDIUM";
  return "WEAK";
}

function pickLayoutSnapshot(
  layout: ReturnType<typeof buildInitialLayoutSpec>,
): Record<string, unknown> {
  return {
    heroScale: layout.heroScale,
    productAreaPct: layout.productAreaPct,
    primaryObject: layout.primaryObject,
    hierarchy: layout.hierarchy,
    maxIcons: layout.maxIcons,
    maxBadges: layout.maxBadges,
    maxCharacteristics: layout.maxCharacteristics,
    typographyStrategy: layout.typographyStrategy,
    scenePreference: layout.scenePreference,
    backgroundPalettePreference: layout.backgroundPalettePreference,
    commercialIntentApplied: layout.commercialLayout?.commercialIntentApplied,
  };
}

async function runArm(input: {
  id: string;
  title: string;
  analysis: ProductAnalysis;
  productColor?: string;
  arm: "legacy" | "commercial";
}): Promise<ArmResult> {
  const productId = input.id;
  const scenePlan = planScene({
    prompt: input.title,
    seed: `${FIXED_SEED}:${productId}`,
    productVisual: input.productColor
      ? { dominantColors: [input.productColor], shape: "compact" }
      : undefined,
  }).scene;

  const legacyLayout = buildInitialLayoutSpec({
    analysis: input.analysis,
    palette: ["#1a1a2e", "#f8fafc", "#f97316", "#64748b"],
  });

  const genome =
    input.arm === "commercial"
      ? createCommercialGenomeBetaDecision({
          marketplace: "wildberries",
          category: input.analysis.category,
          productTitle: input.title,
          productColor: input.productColor,
          productType: input.analysis.category,
          mode: "generation",
        })
      : undefined;

  process.env[COMMERCIAL_LAYOUT_INTEGRATION_FLAG] = input.arm === "commercial" ? "1" : "0";

  const layoutSpec =
    input.arm === "commercial" && genome
      ? stabilizeLayoutSpecWithCommercialIntent(legacyLayout, genome.decision, {
          includeDebugBundle: true,
        }).layout
      : legacyLayout;

  const compiled = compileRenderingPrompt({
    prompt: input.title,
    analysis: input.analysis,
    scenePlan,
    layoutSpec,
  });

  const materialized = materializeCommercialLayoutIntent(layoutSpec);
  const pipeline = rebuildVisualPipelineForRender({
    prompt: input.title,
    analysis: input.analysis,
    layoutSpec,
    scenePlan,
    palette: layoutSpec.palette,
  });

  const pollinations = compilePollinationsPrompt(
    pipeline.visualBlueprint,
    "commercial",
    { coverConceptId: scenePlan.coverConceptId },
  );

  const armResult: ArmResult = {
    arm: input.arm,
    layoutSpec: pickLayoutSnapshot(layoutSpec),
    promptCompiler: {
      prompt: compiled.prompt,
      promptLength: compiled.prompt.length,
      commercialIntentRead: compiled.metadata.promptCommercial?.commercialIntentRead ?? [],
      commercialIntentIgnored: compiled.metadata.promptCommercial?.commercialIntentIgnored ?? [],
    },
    pollinations: {
      prompt: pollinations.prompt,
      tokenEstimate: pollinations.tokenEstimate,
      validationOk: pollinations.validation.ok,
      validationIssues: pollinations.validation.issues,
      architecture: pipeline.visualBlueprint.scene.architecture,
      negativeSpace: pipeline.visualBlueprint.composition.negativeSpace,
    },
  };

  if (!RENDER_ENABLED) {
    armResult.render = { ok: false, error: "SPRINT3_SKIP_RENDER=1" };
    return armResult;
  }

  try {
    const bg = await regenerateMarketplaceBackground({
      analysis: input.analysis,
      scenePlan,
      layoutSpec,
      visualBlueprint: pipeline.visualBlueprint,
      sceneBlueprint: pipeline.sceneBlueprint,
      variationSeed: FIXED_SEED,
      seedSuffix: `${productId}:ab`,
      constitutionPassed: true,
      legacyPrompt: compiled.prompt,
    });

    const localPath = await saveBackgroundBuffer(
      bg.engine?.backgroundBuffer ?? Buffer.from([]),
      OUT_DIR,
      `${productId}-${input.arm}.png`,
    );

    const sha256 =
      bg.engine?.backgroundBuffer != null
        ? await sha256Buffer(bg.engine.backgroundBuffer)
        : undefined;

    armResult.render = {
      ok: true,
      url: bg.url,
      localPath,
      sha256,
      adapterPrompt: bg.adapterPrompt,
      overallScore: bg.engine?.overallScore,
    };
  } catch (e) {
    armResult.render = {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }

  return armResult;
}

function paramInPromptCompiler(prompt: string, param: string): boolean {
  const p = prompt.toLowerCase();
  switch (param) {
    case "productAreaTarget":
      return p.includes("product hero target area") || p.includes("55%");
    case "heroDominance":
      return p.includes("product-first dominance");
    case "hierarchy":
      return p.includes("visual hierarchy") || p.includes("h1");
    case "maxCharacteristics":
      return p.includes("characteristic lines");
    case "badgeLimit":
      return p.includes("icon elements") || p.includes("badge elements");
    case "typographyStrategy":
      return p.includes("typography strategy");
    case "backgroundPalettePreference":
      return p.includes("background separation") || p.includes("cool neutral");
    case "scenePreference":
    case "environmentDirection":
      return p.includes("scene preference") || p.includes("environment");
    case "backgroundContrastDirection":
      return p.includes("neutral background") || p.includes("contrast");
    case "mainMessage":
      return false;
    default:
      return false;
  }
}

function paramInPollinations(prompt: string, param: string): boolean {
  const p = prompt.toLowerCase();
  switch (param) {
    case "scenePreference":
    case "environmentDirection":
      return p.includes("outdoor") || p.includes("industrial") || p.includes("workshop") || p.includes("studio");
    case "backgroundPalettePreference":
    case "backgroundContrastDirection":
      return p.includes("neutral") || p.includes("clean");
    default:
      return false;
  }
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const productResults: Array<{
    productId: string;
    title: string;
    legacy: ArmResult;
    commercial: ArmResult;
    diff: {
      promptCompilerChanged: boolean;
      pollinationsChanged: boolean;
      pollinationsIdentical: boolean;
      pollinationsPromptDelta: string[];
      promptCompilerAddedLines: string[];
      imageDiff?: Awaited<ReturnType<typeof diffImages>>;
      imageDiffLikelyNoise: boolean;
    };
  }> = [];

  for (const product of PRODUCTS) {
    console.log(`==> ${product.id}`);
    const legacy = await runArm({ ...product, arm: "legacy" });
    const commercial = await runArm({ ...product, arm: "commercial" });

    const legacyParts = new Set(legacy.promptCompiler.prompt.split(", ").map((s) => s.trim()));
    const addedLines = commercial.promptCompiler.prompt
      .split(", ")
      .map((s) => s.trim())
      .filter((line) => line && !legacyParts.has(line));

    const pollLegacy = legacy.pollinations.prompt.split(", ").map((s) => s.trim());
    const pollCommercial = new Set(commercial.pollinations.prompt.split(", ").map((s) => s.trim()));
    const pollinationsDelta = pollLegacy.filter((line) => !pollCommercial.has(line));

    let imageDiff: Awaited<ReturnType<typeof diffImages>> | undefined;
    if (
      legacy.render?.ok &&
      commercial.render?.ok &&
      legacy.render.localPath &&
      commercial.render.localPath
    ) {
      imageDiff = await diffImages(legacy.render.localPath, commercial.render.localPath);
    }

    const pollinationsIdentical = !promptChanged(
      legacy.pollinations.prompt,
      commercial.pollinations.prompt,
    );

    productResults.push({
      productId: product.id,
      title: product.title,
      legacy,
      commercial,
      diff: {
        promptCompilerChanged: promptChanged(
          legacy.promptCompiler.prompt,
          commercial.promptCompiler.prompt,
        ),
        pollinationsChanged: !pollinationsIdentical,
        pollinationsIdentical,
        pollinationsPromptDelta: pollinationsDelta,
        promptCompilerAddedLines: addedLines,
        imageDiff,
        imageDiffLikelyNoise: pollinationsIdentical && !!imageDiff && !imageDiff.identical,
      },
    });
  }

  const PARAMS = [
    "productAreaTarget",
    "heroDominance",
    "hierarchy",
    "maxCharacteristics",
    "badgeLimit",
    "typographyStrategy",
    "backgroundPalettePreference",
    "scenePreference",
    "environmentDirection",
    "backgroundContrastDirection",
    "mainMessage",
  ] as const;

  const layoutFieldMap: Record<string, string> = {
    productAreaTarget: "heroScale",
    heroDominance: "primaryObject",
    hierarchy: "hierarchy",
    maxCharacteristics: "maxCharacteristics",
    badgeLimit: "maxIcons",
    typographyStrategy: "typographyStrategy",
    backgroundPalettePreference: "backgroundPalettePreference",
    scenePreference: "scenePreference",
    environmentDirection: "scenePreference",
    backgroundContrastDirection: "backgroundPalettePreference",
    mainMessage: "mainMessage",
  };

  const controlSurface = PARAMS.map((param) => {
    const layoutHits = productResults.filter((r) =>
      layoutFieldMap[param]
        ? layoutFieldChanged(r.legacy.layoutSpec, r.commercial.layoutSpec, layoutFieldMap[param]!)
        : false,
    ).length;

    const promptHits = productResults.filter((r) =>
      paramInPromptCompiler(r.commercial.promptCompiler.prompt, param),
    ).length;

    const pollHits = productResults.filter((r) =>
      paramInPollinations(r.commercial.pollinations.prompt, param),
    ).length;

    const imageHits = productResults.filter(
      (r) => r.diff.imageDiff && !r.diff.imageDiff.identical,
    ).length;

    const avgDiff =
      productResults
        .map((r) => r.diff.imageDiff?.meanAbsDiff ?? 0)
        .reduce((a, b) => a + b, 0) / productResults.length;

    const inLayout = layoutHits >= 3;
    const inPrompt = promptHits >= 3;
    const pollinationsIdenticalAll = productResults.every((r) => r.diff.pollinationsIdentical);

    const inPoll = pollHits >= 2 && !pollinationsIdenticalAll;
    const imageChanged = imageHits >= 3;
    const pollIdentical = productResults.every((r) => r.diff.pollinationsIdentical);

    const strength = inferControlStrength({
      inLayout,
      inPromptCompiler: inPrompt,
      inPollinations: inPoll,
      pollinationsIdentical: pollIdentical,
      imageChanged,
      meanAbsDiff: avgDiff,
    });

    let bottleneck = "—";
    if (inLayout && inPrompt && pollIdentical) {
      bottleneck = "Prompt Compiler → Pollinations (v17 production path)";
    } else if (inLayout && !inPrompt) bottleneck = "LayoutSpec → Prompt Compiler";
    else if (inPrompt && pollIdentical) bottleneck = "Prompt Compiler → Pollinations (v17 bypass)";
    else if (inPoll && !imageChanged) bottleneck = "Pollinations → Flux";
    else if (!inLayout) bottleneck = "Commercial Decision → LayoutSpec";
    else if (pollIdentical && imageChanged) {
      bottleneck = "Image delta is Flux noise — Pollinations prompt identical";
    }

    return {
      commercialIntent: param,
      layoutSpec: inLayout ? "YES" : layoutHits > 0 ? "PARTIAL" : "NO",
      promptCompiler: inPrompt ? "YES" : promptHits > 0 ? "PARTIAL" : "NO",
      visibleImage:
        pollIdentical && imageChanged
          ? "NOISE"
          : imageChanged
            ? "YES"
            : imageHits > 0
              ? "PARTIAL"
              : "NO",
      controlStrength: strength,
      bottleneck,
      evidence: {
        layoutProducts: layoutHits,
        promptProducts: promptHits,
        pollinationsProducts: pollHits,
        imageProducts: imageHits,
        avgMeanAbsDiff: Math.round(avgDiff * 100) / 100,
      },
    };
  });

  const fluxLevers = [
    {
      lever: "Background Palette",
      reachesPollinations: productResults.some((r) =>
        /neutral|clean|separation/i.test(r.commercial.pollinations.prompt),
      ),
      reachesImage: productResults.some((r) => r.diff.imageDiff && !r.diff.imageDiff.identical),
      controlStrength: "WEAK",
      notes: "scenePreference/backgroundPalettePreference not wired into VisualSceneBlueprint",
    },
    {
      lever: "Scene / Environment",
      reachesPollinations: productResults.some(
        (r) => r.diff.pollinationsChanged,
      ),
      reachesImage: productResults.some((r) => r.diff.imageDiff && !r.diff.imageDiff.identical),
      controlStrength: productResults.every((r) => !r.diff.pollinationsChanged)
        ? "NONE"
        : "WEAK",
      notes: "Pollinations architecture from category/coverConcept, not commercial scenePreference",
    },
    {
      lever: "Camera",
      reachesPollinations: true,
      reachesImage: true,
      controlStrength: "MEDIUM",
      notes: "Camera/lens in pollinations optional segments; not commercial-controlled",
    },
    {
      lever: "Product Scale",
      reachesPollinations: false,
      reachesImage: false,
      controlStrength: "NONE",
      notes: "heroScale on LayoutSpec; percentages banned in Pollinations; layout-engine ignores",
    },
    {
      lever: "Typography",
      reachesPollinations: false,
      reachesImage: false,
      controlStrength: "NONE",
      notes: "Typography on overlay/HTML layer; background prompt forbids text",
    },
    {
      lever: "Environment",
      reachesPollinations: productResults.some((r) =>
        /workshop|outdoor|studio|kitchen/i.test(r.commercial.pollinations.prompt),
      ),
      reachesImage: productResults.some((r) => r.diff.imageDiff && !r.diff.imageDiff.identical),
      controlStrength: "WEAK",
      notes: "Category-driven, not commercial genome scenePreference",
    },
  ];

  const output = {
    generatedAt: new Date().toISOString(),
    seed: FIXED_SEED,
    renderEnabled: RENDER_ENABLED,
    productCount: PRODUCTS.length,
    controlSurface,
    fluxLevers,
    productResults,
    summary: {
      promptCompilerChangedCount: productResults.filter((r) => r.diff.promptCompilerChanged)
        .length,
      pollinationsChangedCount: productResults.filter((r) => r.diff.pollinationsChanged).length,
      imageChangedCount: productResults.filter(
        (r) => r.diff.imageDiff && !r.diff.imageDiff.identical,
      ).length,
      renderSuccessCount: productResults.filter((r) => r.commercial.render?.ok).length,
      pollinationsIdenticalCount: productResults.filter((r) => r.diff.pollinationsIdentical)
        .length,
      imageNoiseLikelyCount: productResults.filter((r) => r.diff.imageDiffLikelyNoise).length,
    },
  };

  const jsonPath = path.join(OUT_DIR, "generation-control-surface.json");
  fs.writeFileSync(jsonPath, JSON.stringify(output, null, 2));

  console.log("\n=== Generation Control Surface Summary ===");
  console.log(`Products: ${PRODUCTS.length}`);
  console.log(
    `Prompt compiler changed: ${output.summary.promptCompilerChangedCount}/${PRODUCTS.length}`,
  );
  console.log(
    `Pollinations (Flux) changed: ${output.summary.pollinationsChangedCount}/${PRODUCTS.length}`,
  );
  console.log(`Render success: ${output.summary.renderSuccessCount}/${PRODUCTS.length}`);
  console.log(`Image diff detected: ${output.summary.imageChangedCount}/${PRODUCTS.length}`);
  console.log(`Output: ${jsonPath}`);

  for (const row of controlSurface) {
    console.log(
      `  ${row.commercialIntent}: Layout=${row.layoutSpec} Prompt=${row.promptCompiler} Image=${row.visibleImage} → ${row.controlStrength}`,
    );
  }

  if (output.summary.renderSuccessCount === 0 && RENDER_ENABLED) {
    console.warn("WARNING: no successful renders — image metrics unavailable");
    process.exitCode = 0;
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
