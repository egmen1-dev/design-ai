/**
 * One-off Stage 4 benchmark — current governance vs SceneGraph constitution mirror.
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

async function extractConstitutionMetrics(debugEntry?: { projectId: string; runId: string }) {
  if (!debugEntry) return {};
  const bundlePath = resolveDaosDebugBundlePath(debugEntry.projectId, debugEntry.runId);
  const raw = JSON.parse(await readFile(bundlePath, "utf8")) as {
    diagnostics?: Record<string, unknown>;
    sceneGraphConstitutionMirror?: {
      law003?: { passed?: boolean; reasons?: string[]; estimatedWhitespace?: number; productAreaRatio?: number };
      law014?: { passed?: boolean; reasons?: string[]; overlapCount?: number };
      sceneGraphConstitutionSource?: string;
    };
    law003Recalibration?: { law003Before?: boolean; law003After?: boolean };
  };
  const d = raw.diagnostics ?? {};
  const mirror = raw.sceneGraphConstitutionMirror;

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
    law003SoftResolved: d.law003SoftResolved === true,
    law003After: d.law003After === true,
    law003ConstitutionViolation: d.law003WhitespaceViolation === true,
    law014Current: d.law014ContrastViolation !== true,
    law003SceneGraph: mirror?.law003?.passed,
    law014SceneGraph: mirror?.law014?.passed,
    sceneGraphConstitutionSource: mirror?.sceneGraphConstitutionSource ?? d.sceneGraphConstitutionSource,
    law003MirrorReasons: mirror?.law003?.reasons ?? [],
    law014MirrorReasons: mirror?.law014?.reasons ?? [],
    law003MirrorWhitespace: mirror?.law003?.estimatedWhitespace,
    law003MirrorProductArea: mirror?.law003?.productAreaRatio,
    law014MirrorOverlapCount: mirror?.law014?.overlapCount,
    law003Disagreement:
      mirror?.law003?.passed != null && law003Current !== mirror.law003.passed,
    law014Disagreement:
      mirror?.law014?.passed != null && (d.law014ContrastViolation !== true) !== mirror.law014.passed,
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
  const constitution = await extractConstitutionMetrics(debugEntry);
  return { ...base, ...constitution };
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
        `  LAW_003 current=${row.law003Current} mirror=${row.law003SceneGraph} | LAW_014 current=${row.law014Current} mirror=${row.law014SceneGraph} | disagree L3=${row.law003Disagreement} L14=${row.law014Disagreement}`,
      );
    } else {
      console.log(`  ✗ ${row.error}`);
    }
  }

  const valid = results.filter((r) => !r.error);
  const aggregate = {
    sampleCount: valid.length,
    law003DisagreementRate:
      valid.filter((r) => r.law003Disagreement).length / Math.max(valid.length, 1),
    law014DisagreementRate:
      valid.filter((r) => r.law014Disagreement).length / Math.max(valid.length, 1),
    law003CurrentPassRate:
      valid.filter((r) => r.law003Current).length / Math.max(valid.length, 1),
    law003SceneGraphPassRate:
      valid.filter((r) => r.law003SceneGraph).length / Math.max(valid.length, 1),
    law014CurrentPassRate:
      valid.filter((r) => r.law014Current).length / Math.max(valid.length, 1),
    law014SceneGraphPassRate:
      valid.filter((r) => r.law014SceneGraph).length / Math.max(valid.length, 1),
  };

  const outDir = path.join(process.cwd(), "benchmark/output");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, "stage4-constitution-mirror-benchmark.json");
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
