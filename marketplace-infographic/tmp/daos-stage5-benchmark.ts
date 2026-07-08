/**
 * One-off Stage 5 benchmark — mattress baseline vs wide product template.
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  BENCHMARK_DAOS_WIDE_PRODUCT_TEMPLATE_BASELINE_ENV,
  BENCHMARK_DAOS_WIDE_PRODUCT_TEMPLATE_ENV,
  loadBenchmarkCatalog,
  productSeed,
} from "../src/lib/daos/benchmark/catalog";
import { createBenchmarkProductImage } from "../src/lib/daos/benchmark/product-images";
import {
  buildRunMetrics,
  findNewDebugEntry,
  snapshotDebugIndexKeys,
} from "../src/lib/daos/benchmark/metrics";
import { readDaosDebugIndex } from "../src/lib/daos/debug/daos-debug-index";
import { resolveDaosDebugBundlePath } from "../src/lib/daos/debug/daos-debug-writer";

function applyEnv(env: Record<string, string>): void {
  const keysToClear = Object.keys(process.env).filter((k) => k.startsWith("DAOS_") || [
    "AI_MOCK_MODE", "FAST_GENERATION", "RENDER_ENGINE_V17", "DISABLE_IMGLY",
    "USE_FAST_CUTOUT", "DESIGN_GOVERNANCE_V171", "GOVERNANCE_ALLOW_GRADIENT_FALLBACK",
  ].includes(k));
  for (const key of keysToClear) delete process.env[key];
  for (const [key, value] of Object.entries(env)) process.env[key] = value;
}

async function ensureBenchmarkUser(): Promise<string> {
  const { prisma } = await import("../src/lib/prisma");
  const email = "benchmark@daos.local";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, name: "DAOS Benchmark", credits: 500 } });
  }
  return user.id;
}

async function extractMattressMetrics(debugEntry?: { projectId: string; runId: string }) {
  if (!debugEntry) return {};
  const bundlePath = resolveDaosDebugBundlePath(debugEntry.projectId, debugEntry.runId);
  const raw = JSON.parse(await readFile(bundlePath, "utf8")) as {
    diagnostics?: Record<string, unknown>;
    sceneGraphConstitutionMirror?: {
      law003V2?: { passed?: boolean; score?: number; reason?: string; metrics?: Record<string, number> };
      law014?: { passed?: boolean };
    };
    wideProductTemplate?: { applied?: boolean; strategy?: string };
  };
  const d = raw.diagnostics ?? {};
  const mirror = raw.sceneGraphConstitutionMirror;
  const v2 = mirror?.law003V2;

  return {
    wideProductTemplateApplied: d.wideProductTemplateApplied ?? raw.wideProductTemplate?.applied,
    wideProductTemplateStrategy: d.wideProductTemplateStrategy ?? raw.wideProductTemplate?.strategy,
    law003V2Passed: v2?.passed ?? d.sceneGraphLaw003V2Passed,
    law003V2Score: v2?.score ?? d.sceneGraphLaw003V2Score,
    law003V2Reason: v2?.reason ?? d.sceneGraphLaw003V2Reason,
    law014MirrorPassed: mirror?.law014?.passed ?? d.sceneGraphLaw014Passed,
    productAreaRatio: v2?.metrics?.productAreaRatio ?? d.compositeProductAreaRatio,
    overlayDensity: v2?.metrics?.overlayDensity ?? d.overlayDensity,
    heroTextRatio: v2?.metrics?.heroTextRatio,
    overlayQualityScore: d.overlayQualityScore,
    wideProductHeroZone: d.wideProductHeroZone,
    wideProductTextZone: d.wideProductTextZone,
  };
}

async function runMattress(arm: "baseline" | "template", userId: string) {
  const catalog = await loadBenchmarkCatalog(1);
  const product = catalog.products.find((p) => p.id === "mattress");
  if (!product) throw new Error("mattress product not found in catalog");

  applyEnv(
    arm === "template"
      ? BENCHMARK_DAOS_WIDE_PRODUCT_TEMPLATE_ENV
      : BENCHMARK_DAOS_WIDE_PRODUCT_TEMPLATE_BASELINE_ENV,
  );

  const seed = productSeed(catalog.sharedSeed, product.id);
  const productImage = await createBenchmarkProductImage(product);
  const indexBefore = snapshotDebugIndexKeys((await readDaosDebugIndex()).entries);
  const started = Date.now();

  const { handleGenerateInfographic } = await import("../src/lib/generate-infographic-handler");
  const { loadDesignLibrary } = await import("../src/lib/design-library");
  const { selectRelevantExamples } = await import("../src/lib/select-relevant-examples");
  const library = await loadDesignLibrary();
  const examples = await selectRelevantExamples(product.prompt, 5);
  const result = await handleGenerateInfographic({
    userId,
    prompt: product.prompt,
    productImage,
    backgroundSeed: seed,
    ollamaContext: { library, examples },
  });

  const debugEntry = await findNewDebugEntry(indexBefore);
  const base = await buildRunMetrics({
    arm,
    productId: product.id,
    productName: product.name,
    imageId: result.id,
    generationTimeMs: Date.now() - started,
    backgroundUrl: result.backgroundUrl,
    imagePath: result.imagePath,
    debugEntry,
  });
  const metrics = await extractMattressMetrics(debugEntry);
  return { arm, product, seed, ...base, ...metrics };
}

async function main() {
  const userId = await ensureBenchmarkUser();
  console.log("\n▶ mattress baseline (template=0)");
  const baseline = await runMattress("baseline", userId);
  console.log(
    `  LAW_003 V2=${baseline.law003V2Passed} LAW_014=${baseline.law014MirrorPassed} hero/text=${baseline.heroTextRatio?.toFixed(2)} overlayQ=${baseline.overlayQualityScore}`,
  );

  console.log("\n▶ mattress template (template=1)");
  const template = await runMattress("template", userId);
  console.log(
    `  LAW_003 V2=${template.law003V2Passed} LAW_014=${template.law014MirrorPassed} hero/text=${template.heroTextRatio?.toFixed(2)} overlayQ=${template.overlayQualityScore}`,
  );

  const aggregate = {
    mattress: {
      baseline: {
        law003V2Passed: baseline.law003V2Passed,
        law014MirrorPassed: baseline.law014MirrorPassed,
        productAreaRatio: baseline.productAreaRatio,
        overlayDensity: baseline.overlayDensity,
        heroTextRatio: baseline.heroTextRatio,
        overlayQualityScore: baseline.overlayQualityScore,
        finalImageHash: baseline.finalImageHash,
        law003V2Reason: baseline.law003V2Reason,
      },
      template: {
        wideProductTemplateApplied: template.wideProductTemplateApplied,
        law003V2Passed: template.law003V2Passed,
        law014MirrorPassed: template.law014MirrorPassed,
        productAreaRatio: template.productAreaRatio,
        overlayDensity: template.overlayDensity,
        heroTextRatio: template.heroTextRatio,
        overlayQualityScore: template.overlayQualityScore,
        finalImageHash: template.finalImageHash,
        law003V2Reason: template.law003V2Reason,
        wideProductHeroZone: template.wideProductHeroZone,
        wideProductTextZone: template.wideProductTextZone,
      },
      law003V2Improved: baseline.law003V2Passed === false && template.law003V2Passed === true,
      visualHashChanged: baseline.finalImageHash !== template.finalImageHash,
    },
  };

  const outDir = path.join(process.cwd(), "benchmark/output");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "stage5-wide-product-template-benchmark.json");
  await writeFile(
    outPath,
    JSON.stringify(
      { createdAt: new Date().toISOString(), results: [baseline, template], aggregate },
      null,
      2,
    ),
  );
  console.log(`\nWrote ${outPath}`);
  console.log(JSON.stringify(aggregate, null, 2));

  const { prisma } = await import("../src/lib/prisma");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
