import type { BenchmarkArm, BenchmarkProduct, BenchmarkProductPair, BenchmarkResults } from "./types";
import {
  BENCHMARK_BASELINE_ENV,
  BENCHMARK_DAOS_NO_PATCH_ENV,
  BENCHMARK_DAOS_PATCHED_ENV,
  loadBenchmarkCatalog,
  productSeed,
} from "./catalog";
import { createBenchmarkProductImage } from "./product-images";
import {
  buildRunMetrics,
  findNewDebugEntry,
  snapshotDebugIndexKeys,
} from "./metrics";
import { computeAggregateStats, computePairDelta, evaluateBenchmarkDecision } from "./decision";
import { writeBenchmarkOutputs } from "./reporter";
import { readDaosDebugIndex } from "../debug/daos-debug-index";

function applyEnv(env: Record<string, string>): void {
  for (const [key, value] of Object.entries(env)) {
    process.env[key] = value;
  }
}

async function ensureBenchmarkUser(): Promise<string> {
  const { prisma } = await import("@/lib/prisma");
  const email = "benchmark@daos.local";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: "DAOS Benchmark", credits: 500 },
    });
  }
  return user.id;
}

async function runSingleBenchmarkArm(input: {
  arm: BenchmarkArm;
  product: BenchmarkProduct;
  seed: string;
  productImage: string;
  userId: string;
  env: Record<string, string>;
}): Promise<BenchmarkResults["pairs"][number]["baseline"]> {
  applyEnv(input.env);

  const indexBefore = snapshotDebugIndexKeys((await readDaosDebugIndex()).entries);
  const started = Date.now();

  try {
    const { handleGenerateInfographic } = await import("@/lib/generate-infographic-handler");
    const { loadDesignLibrary } = await import("@/lib/design-library");
    const { selectRelevantExamples } = await import("@/lib/select-relevant-examples");

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
    const generationTimeMs = Date.now() - started;

    return buildRunMetrics({
      arm: input.arm,
      productId: input.product.id,
      productName: input.product.name,
      imageId: result.id,
      generationTimeMs,
      backgroundUrl: result.backgroundUrl,
      imagePath: result.imagePath,
      debugEntry,
    });
  } catch (error) {
    const generationTimeMs = Date.now() - started;
    return buildRunMetrics({
      arm: input.arm,
      productId: input.product.id,
      productName: input.product.name,
      generationTimeMs,
      backgroundUrl: null,
      imagePath: "",
      error: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function runDaosBenchmark(phase: number): Promise<BenchmarkResults> {
  const catalog = await loadBenchmarkCatalog(phase);
  const userId = await ensureBenchmarkUser();
  const pairs: BenchmarkProductPair[] = [];

  console.log(`\nDAOS Benchmark — Phase ${phase} (${catalog.products.length} products)\n`);

  for (const product of catalog.products) {
    const seed = productSeed(catalog.sharedSeed, product.id);
    const productImage = await createBenchmarkProductImage(product);

    console.log(`▶ ${product.name} (${product.id}) seed=${seed}`);

    console.log("  Baseline…");
    const baseline = await runSingleBenchmarkArm({
      arm: "baseline",
      product,
      seed,
      productImage,
      userId,
      env: BENCHMARK_BASELINE_ENV,
    });

    console.log("  DAOS (overlay only)…");
    const daosNoPatch = await runSingleBenchmarkArm({
      arm: "baseline",
      product,
      seed,
      productImage,
      userId,
      env: BENCHMARK_DAOS_NO_PATCH_ENV,
    });

    console.log("  DAOS (geometry patched)…");
    const daos = await runSingleBenchmarkArm({
      arm: "daos",
      product,
      seed,
      productImage,
      userId,
      env: BENCHMARK_DAOS_PATCHED_ENV,
    });

    const delta = computePairDelta(daosNoPatch, daos);
    pairs.push({ product, seed, baseline: daosNoPatch, daos, delta });

    console.log(
      `  ✓ summary ${daosNoPatch.summaryScore ?? "?"} → ${daos.summaryScore ?? "?"} (Δ ${delta.deltaSummaryScore ?? "n/a"})`,
    );
  }

  const aggregate = computeAggregateStats(pairs);
  const decision = evaluateBenchmarkDecision(aggregate, pairs);

  const results: BenchmarkResults = {
    version: 1,
    phase,
    createdAt: new Date().toISOString(),
    catalogDescription: catalog.description,
    sharedRenderSettings: {
      provider: "pollinations",
      model: "flux",
      renderEngine: "v17",
    },
    envProfiles: {
      baseline: BENCHMARK_BASELINE_ENV,
      daosNoPatch: BENCHMARK_DAOS_NO_PATCH_ENV,
      daos: BENCHMARK_DAOS_PATCHED_ENV,
    },
    pairs,
    aggregate,
    decision,
  };

  const outputs = await writeBenchmarkOutputs(results);
  console.log("\nBenchmark outputs:");
  console.log(`  ${outputs.jsonPath}`);
  console.log(`  ${outputs.csvPath}`);
  console.log(`  ${outputs.reportPath}`);
  console.log(`  ${outputs.dashboardPath}`);
  console.log(`\nBenchmarkStatus: ${decision.status}`);
  console.log(`Recommendation: ${decision.recommendation}\n`);

  const { prisma } = await import("@/lib/prisma");
  await prisma.$disconnect();

  return results;
}
