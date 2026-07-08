/**
 * One-off Stage 4.1 benchmark — SceneGraph whitespace attribution by product.
 */
import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import {
  BENCHMARK_DAOS_SCENE_GRAPH_V2_GATED_ENV,
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

async function extractWhitespaceAttribution(debugEntry?: { projectId: string; runId: string }) {
  if (!debugEntry) return {};
  const bundlePath = resolveDaosDebugBundlePath(debugEntry.projectId, debugEntry.runId);
  const raw = JSON.parse(await readFile(bundlePath, "utf8")) as {
    diagnostics?: Record<string, unknown>;
    sceneGraphWhitespaceAttribution?: {
      primaryCause?: string;
      secondaryCauses?: string[];
      recommendations?: string[];
      productAreaRatio?: number;
      overlayDensity?: number;
      heroTextRatio?: number;
      estimatedWhitespace?: number;
      confidence?: number;
    };
  };
  const d = raw.diagnostics ?? {};
  const attr = raw.sceneGraphWhitespaceAttribution;

  return {
    whitespacePrimaryCause: attr?.primaryCause ?? d.whitespacePrimaryCause,
    whitespaceSecondaryCauses: attr?.secondaryCauses ?? d.whitespaceSecondaryCauses,
    whitespaceRecommendations: attr?.recommendations ?? d.whitespaceRecommendations,
    productAreaRatio: attr?.productAreaRatio,
    overlayDensity: attr?.overlayDensity,
    heroTextRatio: attr?.heroTextRatio,
    estimatedWhitespace: attr?.estimatedWhitespace,
    whitespaceConfidence: attr?.confidence,
  };
}

async function runProduct(input: {
  product: Awaited<ReturnType<typeof loadBenchmarkCatalog>>["products"][number];
  seed: string;
  productImage: string;
  userId: string;
}) {
  applyEnv(BENCHMARK_DAOS_SCENE_GRAPH_V2_GATED_ENV);
  const indexBefore = snapshotDebugIndexKeys((await readDaosDebugIndex()).entries);
  const started = Date.now();
  const { handleGenerateInfographic } = await import("../src/lib/generate-infographic-handler");
  const { loadDesignLibrary } = await import("../src/lib/design-library");
  const { selectRelevantExamples } = await import("../src/lib/select-relevant-examples");
  const library = await loadDesignLibrary();
  const examples = await selectRelevantExamples(input.product.prompt, 5);
  const result = await handleGenerateInfographic({
    userId: input.userId,
    prompt: input.product.prompt,
    productImage: input.productImage,
    backgroundSeed: input.seed,
    ollamaContext: { library, examples },
  });
  const debugEntry = await findNewDebugEntry(indexBefore);
  const base = await buildRunMetrics({
    arm: "daos",
    productId: input.product.id,
    productName: input.product.name,
    imageId: result.id,
    generationTimeMs: Date.now() - started,
    backgroundUrl: result.backgroundUrl,
    imagePath: result.imagePath,
    debugEntry,
  });
  const attribution = await extractWhitespaceAttribution(debugEntry);
  return { ...base, ...attribution };
}

async function runProductSafe(input: Parameters<typeof runProduct>[0]) {
  try {
    return await runProduct(input);
  } catch (error) {
    return {
      productId: input.product.id,
      productName: input.product.name,
      error: error instanceof Error ? error.message.split("\n")[0] : String(error),
    };
  }
}

async function main() {
  const catalog = await loadBenchmarkCatalog(1);
  const userId = await ensureBenchmarkUser();
  const results = [];

  for (const product of catalog.products) {
    const seed = productSeed(catalog.sharedSeed, product.id);
    const productImage = await createBenchmarkProductImage(product);
    console.log(`\n▶ ${product.name}`);
    const row = await runProductSafe({ product, seed, productImage, userId });
    results.push({ product, seed, ...row });
    if (!("error" in row && row.error)) {
      console.log(
        `  cause=${row.whitespacePrimaryCause} product=${row.productAreaRatio?.toFixed(2)} overlay=${row.overlayDensity?.toFixed(2)} hero/text=${row.heroTextRatio?.toFixed(2)}`,
      );
    } else {
      console.log(`  ✗ ${row.error}`);
    }
  }

  const valid = results.filter((r) => !r.error);
  const byCause: Record<string, number> = {};
  for (const row of valid) {
    const cause = String(row.whitespacePrimaryCause ?? "unknown");
    byCause[cause] = (byCause[cause] ?? 0) + 1;
  }

  const aggregate = {
    sampleCount: valid.length,
    primaryCauseCounts: byCause,
    avgProductAreaRatio:
      valid.reduce((s, r) => s + (r.productAreaRatio ?? 0), 0) / Math.max(valid.length, 1),
    avgOverlayDensity:
      valid.reduce((s, r) => s + (r.overlayDensity ?? 0), 0) / Math.max(valid.length, 1),
    avgHeroTextRatio:
      valid.reduce((s, r) => s + (r.heroTextRatio ?? 0), 0) / Math.max(valid.length, 1),
  };

  const outDir = path.join(process.cwd(), "benchmark/output");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "stage4-1-whitespace-attribution-benchmark.json");
  await writeFile(
    outPath,
    JSON.stringify({ createdAt: new Date().toISOString(), results, aggregate }, null, 2),
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
