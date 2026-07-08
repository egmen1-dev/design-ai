/**
 * One-off Stage 4.2 benchmark — LAW_003 current vs mirror V1 vs V2.
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

async function extractLaw003Comparison(debugEntry?: { projectId: string; runId: string }) {
  if (!debugEntry) return {};
  const bundlePath = resolveDaosDebugBundlePath(debugEntry.projectId, debugEntry.runId);
  const raw = JSON.parse(await readFile(bundlePath, "utf8")) as {
    diagnostics?: Record<string, unknown>;
    sceneGraphConstitutionMirror?: {
      law003?: { passed?: boolean };
      law003V2?: {
        passed?: boolean;
        score?: number;
        disagreement?: boolean;
        reason?: string;
        metrics?: {
          productAreaRatio?: number;
          overlayDensity?: number;
          heroTextRatio?: number;
        };
      };
    };
  };
  const d = raw.diagnostics ?? {};
  const mirror = raw.sceneGraphConstitutionMirror;
  const v2 = mirror?.law003V2;

  const law003Current = d.law003WhitespaceViolation === true
    ? false
    : d.law003After === false
      ? false
      : d.law003After === true
        ? true
        : d.law003SoftResolved === true
          ? true
          : d.law003WhitespaceViolation !== true;

  return {
    law003Current,
    law003MirrorV1: mirror?.law003?.passed,
    law003MirrorV2: v2?.passed,
    law003V2Score: v2?.score ?? d.sceneGraphLaw003V2Score,
    law003V2Disagreement: v2?.disagreement ?? d.sceneGraphLaw003V2Disagreement,
    law003V2Reason: v2?.reason ?? d.sceneGraphLaw003V2Reason,
    law003V1V2Disagreement: mirror?.law003?.passed != null && v2?.passed != null
      ? mirror.law003.passed !== v2.passed
      : undefined,
    law003V2ResolvesV1Fail:
      mirror?.law003?.passed === false && v2?.passed === true,
    productAreaRatio: v2?.metrics?.productAreaRatio,
    overlayDensity: v2?.metrics?.overlayDensity,
    heroTextRatio: v2?.metrics?.heroTextRatio,
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
  const law003 = await extractLaw003Comparison(debugEntry);
  return { ...base, ...law003 };
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
        `  current=${row.law003Current} v1=${row.law003MirrorV1} v2=${row.law003MirrorV2} v1v2Δ=${row.law003V1V2Disagreement} resolves=${row.law003V2ResolvesV1Fail}`,
      );
    } else {
      console.log(`  ✗ ${row.error}`);
    }
  }

  const valid = results.filter((r) => !r.error);
  const aggregate = {
    sampleCount: valid.length,
    law003CurrentPassRate: valid.filter((r) => r.law003Current).length / Math.max(valid.length, 1),
    law003MirrorV1PassRate: valid.filter((r) => r.law003MirrorV1).length / Math.max(valid.length, 1),
    law003MirrorV2PassRate: valid.filter((r) => r.law003MirrorV2).length / Math.max(valid.length, 1),
    law003V1V2DisagreementRate:
      valid.filter((r) => r.law003V1V2Disagreement).length / Math.max(valid.length, 1),
    law003V2ResolvesV1FailCount: valid.filter((r) => r.law003V2ResolvesV1Fail).length,
    law003V2StillFailingCount: valid.filter((r) => r.law003MirrorV2 === false).length,
    law003V2StillFailingProducts: valid
      .filter((r) => r.law003MirrorV2 === false)
      .map((r) => r.productId),
    law003V2ResolvedProducts: valid
      .filter((r) => r.law003V2ResolvesV1Fail)
      .map((r) => r.productId),
  };

  const outDir = path.join(process.cwd(), "benchmark/output");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "stage4-2-law003-v2-benchmark.json");
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
