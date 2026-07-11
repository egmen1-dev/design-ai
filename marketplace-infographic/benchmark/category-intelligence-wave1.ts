#!/usr/bin/env npx tsx
/**
 * Category Intelligence Program — Wave 1 validation
 * Validates Дом, Кухня, Климат, Мойка win rate improvement vs BV2 baseline.
 */
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { projectRoot, resolvePublicAssetPath } from "../src/lib/runtime-paths";
import { selectBetaValidation2Products } from "./lib/beta-validation-2-products";
import type { BetaValidationProduct } from "./lib/beta-validation-products";
import { ensurePackshotFromLeader } from "./lib/packshot-input";
import {
  measureBetaCardMetrics,
  compareMetrics,
  deriveHumanVerdict,
  type HumanVerdict,
  type MetricComparison,
} from "./lib/beta-validation-metrics";
import { summarize, proportionCi95, confidenceLevel } from "./lib/beta-validation-statistics";
import { classifyFailure, aggregateFailureReasons } from "./lib/beta-validation-failure-analysis";

process.chdir(path.join(__dirname, ".."));

const WAVE1_CATEGORIES = new Set(["home", "kitchen", "humidifier", "pressure-wash"]);
const BV2_BASELINE: Record<string, number> = {
  Дом: 57.1,
  Климат: 50.0,
  Кухня: 50.0,
  Мойка: 50.0,
};
const OUT_DIR = path.join("benchmark", "output", "category-intelligence-wave1");
const FIXED_SEED = "category-intelligence-wave1-20260711";
const RESUME = process.env.CI_RESUME !== "0";

function applyBenchmarkEnv(): void {
  process.env.AI_MOCK_MODE = "true";
  process.env.FAST_GENERATION = "1";
  process.env.RENDER_ENGINE_V17 = "1";
  process.env.DISABLE_IMGLY = "1";
  process.env.USE_FAST_CUTOUT = "1";
  process.env.DESIGN_GOVERNANCE_V171 = "0";
  process.env.GOVERNANCE_ALLOW_GRADIENT_FALLBACK = "0";
  process.env.DAOS_COMMERCIAL_GENOME_BETA = "1";
  process.env.DAOS_COMMERCIAL_LAYOUT_INTEGRATION = "1";
  process.env.DAOS_CATEGORY_INTELLIGENCE = "1";
  process.env.DAOS_ATTENTION_HIERARCHY = "1";
  process.env.DAOS_POST_OVERLAY_DOMINANCE_GATE = "1";
  process.env.DAOS_THUMBNAIL_READABILITY_GATE = "1";
  process.env.BV1_PACKSHOT_INPUT = "1";
}

async function ensureBenchmarkUser(): Promise<string> {
  const { prisma } = await import("../src/lib/prisma");
  const email = "benchmark-category-intel@daos.local";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: "Category Intelligence Wave 1", credits: 5000 },
    });
  } else if (user.credits < 500) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { credits: 5000 },
    });
  }
  return user.id;
}

async function copyAsset(webPath: string | null | undefined, dest: string): Promise<boolean> {
  if (!webPath) return false;
  try {
    const abs = await resolvePublicAssetPath(webPath.startsWith("/api/") ? webPath.replace("/api/", "/") : webPath);
    if (!fs.existsSync(abs)) return false;
    await fsPromises.mkdir(path.dirname(dest), { recursive: true });
    await fsPromises.copyFile(abs, dest);
    return true;
  } catch {
    return false;
  }
}

async function generateDaosCard(input: {
  product: BetaValidationProduct;
  productImage: string;
  userId: string;
}): Promise<{ ok: boolean; finalPath?: string; error?: string; durationMs: number }> {
  const started = Date.now();
  const tmpDir = path.join(OUT_DIR, "_tmp");
  fs.mkdirSync(tmpDir, { recursive: true });
  try {
    const { handleGenerateInfographic } = await import("../src/lib/generate-infographic-handler");
    const { loadDesignLibrary } = await import("../src/lib/design-library");
    const { selectRelevantExamples } = await import("../src/lib/select-relevant-examples");
    const library = await loadDesignLibrary();
    const examples = await selectRelevantExamples(input.product.prompt, 5);
    const result = await handleGenerateInfographic({
      userId: input.userId,
      prompt: input.product.prompt,
      productImage: input.productImage,
      backgroundSeed: `${FIXED_SEED}:${input.product.productId}`,
      ollamaContext: { library, examples },
    });
    const { prisma } = await import("../src/lib/prisma");
    const record = await prisma.generatedImage.findUnique({
      where: { id: result.id },
      select: { imagePath: true },
    });
    const finalPath = path.join(tmpDir, `${input.product.productId}-final.png`);
    const finalOk = await copyAsset(record?.imagePath ?? result.imagePath, finalPath);
    if (!finalOk) return { ok: false, error: "Final PNG not produced", durationMs: Date.now() - started };
    return { ok: true, finalPath, durationMs: Date.now() - started };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), durationMs: Date.now() - started };
  }
}

async function main() {
  applyBenchmarkEnv();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const allProducts = selectBetaValidation2Products();
  const products = allProducts.filter((p) => WAVE1_CATEGORIES.has(p.category));
  console.log(`Category Intelligence Wave 1: ${products.length} products`);

  const userId = await ensureBenchmarkUser();
  const results: Array<{
    product: BetaValidationProduct;
    verdict: HumanVerdict;
    cmp: MetricComparison;
    daosOk: boolean;
    genError?: string;
    failure?: import("./lib/beta-validation-failure-analysis").FailureRecord;
  }> = [];

  for (const product of products) {
    const productDir = path.join(OUT_DIR, product.slot);
    const metricsPath = path.join(productDir, "metrics.json");

    if (RESUME && fs.existsSync(metricsPath)) {
      const m = JSON.parse(fs.readFileSync(metricsPath, "utf8"));
      results.push({
        product,
        verdict: m.verdict,
        cmp: { leader: m.leader, daos: m.daos, delta: m.delta, leaderWins: 0, daosWins: 0, draws: 0 },
        daosOk: m.daosGenerated,
        failure: m.failure,
      });
      console.log(`  [cached] ${product.slot} ${product.categoryLabel} → ${m.verdict.overall}`);
      continue;
    }

    const packshot = await ensurePackshotFromLeader({
      leaderImagePath: product.leaderImagePath,
      productId: product.productId,
    });
    const gen = await generateDaosCard({ product, productImage: packshot, userId });

    if (!gen.ok || !gen.finalPath) {
      results.push({
        product,
        verdict: { overall: "wb", moreProfessional: "wb", strongerSell: "wb", fasterRead: "wb", wouldOpen: "wb", rationale: gen.error ?? "gen failed" },
        cmp: { leader: {} as never, daos: {} as never, delta: {} as never, leaderWins: 0, daosWins: 0, draws: 0 },
        daosOk: false,
        genError: gen.error,
      });
      console.log(`  [FAIL] ${product.slot} ${product.categoryLabel}: ${gen.error}`);
      continue;
    }

    const leaderMetrics = await measureBetaCardMetrics(product.leaderImagePath);
    const daosMetrics = await measureBetaCardMetrics(gen.finalPath);
    const cmp = compareMetrics(leaderMetrics, daosMetrics);
    const verdict = deriveHumanVerdict(cmp, {
      leaderDominance: product.wbDominance,
      daosGenerated: true,
    });
    const failure =
      verdict.overall === "wb"
        ? classifyFailure({
            slot: product.slot,
            productId: product.productId,
            category: product.category,
            categoryLabel: product.categoryLabel,
            daosGenerated: true,
            gapClass: verdict.gapClass,
            delta: cmp.delta,
          })
        : undefined;

    await fsPromises.mkdir(productDir, { recursive: true });
    await fsPromises.writeFile(
      metricsPath,
      JSON.stringify(
        {
          slot: product.slot,
          productId: product.productId,
          category: product.category,
          categoryLabel: product.categoryLabel,
          daosGenerated: true,
          genDurationMs: gen.durationMs,
          leader: leaderMetrics,
          daos: daosMetrics,
          delta: cmp.delta,
          verdict,
          failure,
        },
        null,
        2,
      ),
    );

    results.push({ product, verdict, cmp, daosOk: true, failure });
    console.log(`  ${product.slot} ${product.categoryLabel} → ${verdict.overall} (dom Δ${cmp.delta.dominance?.toFixed(1) ?? "?"})`);
  }

  const genSuccess = results.filter((r) => r.daosOk).length;
  const genRate = Number(((genSuccess / results.length) * 100).toFixed(1));
  const wins = results.filter((r) => r.verdict.overall === "daos").length;
  const winRate = Number(((wins / results.length) * 100).toFixed(1));
  const ci = proportionCi95(wins, results.length);

  const byCategory: Record<string, { daos: number; wb: number; draw: number; n: number }> = {};
  for (const r of results) {
    const label = r.product.categoryLabel;
    byCategory[label] ??= { daos: 0, wb: 0, draw: 0, n: 0 };
    byCategory[label].n++;
    if (r.verdict.overall === "daos") byCategory[label].daos++;
    else if (r.verdict.overall === "wb") byCategory[label].wb++;
    else byCategory[label].draw++;
  }

  const categoryAnalysis: Record<string, unknown> = {};
  const improvements: Record<string, { baseline: number; current: number; delta: number; improved: boolean }> = {};

  for (const [label, s] of Object.entries(byCategory)) {
    const wr = Number(((s.daos / s.n) * 100).toFixed(1));
    const baseline = BV2_BASELINE[label] ?? 0;
    const delta = Number((wr - baseline).toFixed(1));
    improvements[label] = { baseline, current: wr, delta, improved: delta > 0 };
    categoryAnalysis[label] = { ...s, winRate: wr, baselineWinRate: baseline, deltaPp: delta };
  }

  const dominanceScores = results.filter((r) => r.daosOk).map((r) => r.cmp.daos.productDominance ?? 0);
  const failures = results.filter((r) => r.failure).map((r) => r.failure!);

  const summary = {
    version: "category-intelligence-wave1",
    timestamp: new Date().toISOString(),
    productCount: results.length,
    flag: "DAOS_CATEGORY_INTELLIGENCE=1",
    aggregate: {
      genSuccessRate: genRate,
      marketWinRate: winRate,
      daosWins: wins,
      wbWins: results.filter((r) => r.verdict.overall === "wb").length,
      draws: results.filter((r) => r.verdict.overall === "draw").length,
      winRateCi: ci,
    },
    statistics: {
      daosDominance: summarize(dominanceScores),
    },
    categoryAnalysis,
    improvements,
    failureReasons: aggregateFailureReasons(failures),
    confidenceLevel: confidenceLevel(results.length),
    council: {
      allCategoriesImproved: Object.values(improvements).every((i) => i.improved),
      categoriesImproved: Object.entries(improvements)
        .filter(([, v]) => v.improved)
        .map(([k]) => k),
      overallWinRate: winRate,
      baselineAggregate: 51.8,
    },
  };

  await fsPromises.writeFile(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));

  console.log("\n=== Category Intelligence Wave 1 ===");
  console.log(`Generation Success: ${genRate}%`);
  console.log(`Overall Win Rate: ${winRate}% (95% CI ${ci.low}–${ci.high}%)`);
  for (const [label, imp] of Object.entries(improvements)) {
    const mark = imp.improved ? "↑" : "→";
    console.log(`  ${label}: ${imp.baseline}% → ${imp.current}% (${imp.delta >= 0 ? "+" : ""}${imp.delta}pp) ${mark}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
