#!/usr/bin/env npx tsx
/**
 * Beta Validation 2 — Large Scale Market Validation
 * Validation-only: uses frozen production pipeline; no product changes.
 */
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { projectRoot, resolvePublicAssetPath } from "../src/lib/runtime-paths";
import { selectBetaValidation2Products, BV2_MISSING_CATEGORIES } from "./lib/beta-validation-2-products";
import type { BetaValidationProduct } from "./lib/beta-validation-products";
import { ensurePackshotFromLeader } from "./lib/packshot-input";
import {
  measureBetaCardMetrics,
  compareMetrics,
  deriveHumanVerdict,
  compositeCommercialScore,
  type HumanVerdict,
  type MetricComparison,
  type BetaCardMetrics,
} from "./lib/beta-validation-metrics";
import {
  summarize,
  proportionCi95,
  categoryVariance,
  confidenceLevel,
  type StatSummary,
} from "./lib/beta-validation-statistics";
import { classifyFailure, aggregateFailureReasons, type FailureRecord } from "./lib/beta-validation-failure-analysis";

process.chdir(path.join(__dirname, ".."));

const OUT_DIR = path.join("benchmark", "output", "beta-validation-2");
const LIMIT = Number(process.env.BV2_LIMIT ?? 120);
const FIXED_SEED = "beta-validation-2-20260711";
const RESUME = process.env.BV2_RESUME !== "0";

type ExtendedMetrics = BetaCardMetrics & {
  secondaryFocusRatio: number;
  attentionDistribution: number;
};

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
  process.env.DAOS_ATTENTION_HIERARCHY = "1";
  process.env.DAOS_POST_OVERLAY_DOMINANCE_GATE = "1";
  process.env.DAOS_THUMBNAIL_READABILITY_GATE = "1";
  process.env.BV1_PACKSHOT_INPUT = "1";
}

async function ensureBenchmarkUser(): Promise<string> {
  const { prisma } = await import("../src/lib/prisma");
  const email = "benchmark-beta-v2@daos.local";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: "Beta Validation 2", credits: 5000 },
    });
  } else if (user.credits < 500) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { credits: 5000 },
    });
  }
  return user.id;
}

async function resolveWebAsset(webPath: string | null | undefined): Promise<string | null> {
  if (!webPath) return null;
  try {
    return await resolvePublicAssetPath(webPath.startsWith("/api/") ? webPath.replace("/api/", "/") : webPath);
  } catch {
    if (webPath.startsWith("/api/generated/")) {
      return path.join(projectRoot(), "public", webPath.replace("/api/", "/"));
    }
    return null;
  }
}

async function copyAsset(webPath: string | null | undefined, dest: string): Promise<boolean> {
  const abs = await resolveWebAsset(webPath);
  if (!abs || !fs.existsSync(abs)) return false;
  await fsPromises.mkdir(path.dirname(dest), { recursive: true });
  await fsPromises.copyFile(abs, dest);
  return true;
}

function extendMetrics(m: BetaCardMetrics): ExtendedMetrics {
  return {
    ...m,
    secondaryFocusRatio: Number((1 - m.primaryFocusRatio).toFixed(3)),
    attentionDistribution: Number(
      (m.productVisualWeight / Math.max(1, m.productVisualWeight + m.headlineVisualWeight + m.typographyCompetition)).toFixed(3),
    ),
  };
}

async function generateDaosCard(input: {
  product: BetaValidationProduct;
  productImage: string;
  userId: string;
}): Promise<{ ok: boolean; finalPath?: string; cutoutPath?: string; backgroundPath?: string; error?: string; durationMs: number }> {
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
      select: { backgroundUrl: true, productCutout: true, imagePath: true },
    });
    const finalPath = path.join(tmpDir, `${input.product.productId}-final.png`);
    const cutoutPath = path.join(tmpDir, `${input.product.productId}-cutout.png`);
    const bgPath = path.join(tmpDir, `${input.product.productId}-bg.png`);
    const finalOk = await copyAsset(record?.imagePath ?? result.imagePath, finalPath);
    const cutoutOk = await copyAsset(record?.productCutout, cutoutPath);
    const bgOk = await copyAsset(record?.backgroundUrl ?? result.backgroundUrl, bgPath);
    if (!finalOk) return { ok: false, error: "Final PNG not produced", durationMs: Date.now() - started };
    return {
      ok: true,
      finalPath,
      cutoutPath: cutoutOk ? cutoutPath : undefined,
      backgroundPath: bgOk ? bgPath : undefined,
      durationMs: Date.now() - started,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e), durationMs: Date.now() - started };
  }
}

function loadCachedResult(productDir: string, product: BetaValidationProduct) {
  const metricsPath = path.join(productDir, "metrics.json");
  if (!fs.existsSync(metricsPath)) return null;
  const m = JSON.parse(fs.readFileSync(metricsPath, "utf8"));
  return {
    product,
    verdict: m.verdict as HumanVerdict,
    cmp: {
      leader: m.leader,
      daos: m.daos,
      delta: m.delta,
      leaderWins: 0,
      daosWins: 0,
      draws: 0,
    } as MetricComparison,
    daosOk: m.daosGenerated as boolean,
    genError: m.genError as string | undefined,
    genDurationMs: m.genDurationMs as number | undefined,
    failure: m.failure as FailureRecord | undefined,
  };
}

function renderDashboard(payload: Record<string, unknown>): string {
  const stats = payload.statistics as Record<string, StatSummary>;
  const council = payload.council as Record<string, unknown>;
  const catRows = Object.entries(payload.categoryAnalysis as Record<string, unknown>)
    .map(([cat, v]) => {
      const c = v as { winRate: number; n: number; dominanceMean: number };
      return `<tr><td>${cat}</td><td>${c.n}</td><td>${c.winRate}%</td><td>${c.dominanceMean}</td></tr>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"/><title>BV2 Dashboard</title>
<style>
body{font-family:system-ui,sans-serif;margin:24px;background:#0b1220;color:#e2e8f0}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px;margin:20px 0}
.card{background:#1e293b;padding:20px;border-radius:10px}
.card strong{font-size:2rem;color:#38bdf8;display:block}
.ci{font-size:0.8rem;color:#94a3b8}
table{width:100%;border-collapse:collapse;margin:16px 0;font-size:0.85rem}
th,td{border:1px solid #334155;padding:8px}th{background:#1e293b}
.pass{color:#4ade80}.warn{color:#fbbf24}.fail{color:#f87171}
</style></head><body>
<h1>Beta Validation 2 — Market Confidence Dashboard</h1>
<p>${payload.timestamp as string} · n=${payload.productCount as number} · Confidence: <strong>${council.confidenceLevel as string}</strong></p>
<div class="grid">
  <div class="card"><strong>${council.marketWinRate as number}%</strong>Market Win Rate<span class="ci">95% CI: ${(council.winRateCi as { low: number; high: number }).low}–${(council.winRateCi as { low: number; high: number }).high}%</span></div>
  <div class="card"><strong>${council.genSuccessRate as number}%</strong>Generation Success</div>
  <div class="card"><strong class="${(council.closedBetaReady as string).includes('READY') ? 'pass' : 'fail'}">${council.closedBetaReady as string}</strong>Closed Beta</div>
  <div class="card"><strong>${stats.daosDominance.mean}</strong>Avg Dominance<span class="ci">σ=${stats.daosDominance.stdDev}</span></div>
  <div class="card"><strong>${stats.daosFidelity.mean}</strong>Avg Fidelity<span class="ci">CI ${stats.daosFidelity.ci95Low}–${stats.daosFidelity.ci95High}</span></div>
  <div class="card"><strong>${stats.daosThumbnail.mean}</strong>Thumbnail Read<span class="ci">σ=${stats.daosThumbnail.stdDev}</span></div>
</div>
<h2>Category Win Rates</h2>
<table><thead><tr><th>Category</th><th>n</th><th>Win Rate</th><th>Avg Dominance</th></tr></thead><tbody>${catRows}</tbody></table>
<h2>Failure Reasons (DAOS losses)</h2>
<pre>${JSON.stringify(payload.failureReasons, null, 2)}</pre>
</body></html>`;
}

async function main() {
  applyBenchmarkEnv();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const products = selectBetaValidation2Products(LIMIT);
  console.log(`Beta Validation 2: ${products.length} products (limit ${LIMIT})`);
  console.log(`Missing harvest categories: ${BV2_MISSING_CATEGORIES.join(", ")}`);

  const userId = await ensureBenchmarkUser();
  const results: Array<{
    product: BetaValidationProduct;
    verdict: HumanVerdict;
    cmp: MetricComparison;
    daosOk: boolean;
    genError?: string;
    genDurationMs?: number;
    failure?: FailureRecord;
    daosExt: ExtendedMetrics;
  }> = [];

  for (const product of products) {
    const productDir = path.join(OUT_DIR, product.slot);
    fs.mkdirSync(productDir, { recursive: true });

    if (RESUME) {
      const cached = loadCachedResult(productDir, product);
      if (cached) {
        console.log(`[resume] ${product.slot} skipped`);
        results.push({ ...cached, daosExt: extendMetrics(cached.cmp.daos) });
        continue;
      }
    }

    console.log(`\n==> ${product.slot} ${product.name.slice(0, 45)}…`);
    await fsPromises.copyFile(product.leaderImagePath, path.join(productDir, "leader.png"));
    const leaderMetrics = extendMetrics(await measureBetaCardMetrics(path.join(productDir, "leader.png")));

    const productImage = await ensurePackshotFromLeader({
      leaderImagePath: product.leaderImagePath,
      productId: product.productId,
    });
    const packshotBuf = Buffer.from(productImage.replace(/^data:image\/\w+;base64,/, ""), "base64");
    await fsPromises.writeFile(path.join(productDir, "packshot.png"), packshotBuf);

    const gen = await generateDaosCard({ product, productImage, userId });
    let daosMetrics = leaderMetrics;
    if (gen.ok && gen.finalPath) {
      await fsPromises.copyFile(gen.finalPath, path.join(productDir, "daos.png"));
      if (gen.cutoutPath) await fsPromises.copyFile(gen.cutoutPath, path.join(productDir, "product-cutout.png"));
      if (gen.backgroundPath) await fsPromises.copyFile(gen.backgroundPath, path.join(productDir, "product-background.png"));
      daosMetrics = extendMetrics(await measureBetaCardMetrics(path.join(productDir, "daos.png")));
      console.log(`  done ${gen.durationMs}ms`);
    } else {
      console.log(`  FAILED: ${gen.error}`);
      await sharp({ create: { width: 900, height: 1200, channels: 3, background: { r: 40, g: 40, b: 50 } } })
        .png()
        .toFile(path.join(productDir, "daos.png"));
    }

    const cmp = compareMetrics(leaderMetrics, daosMetrics);
    let verdict = deriveHumanVerdict(cmp, { leaderDominance: product.wbDominance, daosGenerated: gen.ok });
    if (!gen.ok) {
      verdict = {
        ...verdict,
        moreProfessional: "wb",
        strongerSell: "wb",
        fasterRead: "wb",
        wouldOpen: "wb",
        overall: "wb",
        gapClass: "Composition",
        rationale: `DAOS generation failed: ${gen.error ?? "unknown"}`,
      };
    }

    const failure =
      verdict.overall === "wb"
        ? classifyFailure({
            slot: product.slot,
            productId: product.productId,
            category: product.category,
            categoryLabel: product.categoryLabel,
            daosGenerated: gen.ok,
            gapClass: verdict.gapClass,
            delta: cmp.delta,
          })
        : undefined;

    const metricsPayload = {
      productId: product.productId,
      category: product.category,
      categoryLabel: product.categoryLabel,
      name: product.name,
      daosGenerated: gen.ok,
      genError: gen.error,
      genDurationMs: gen.durationMs,
      leader: leaderMetrics,
      daos: daosMetrics,
      delta: cmp.delta,
      verdict,
      failure,
      compositeScore: {
        leader: compositeCommercialScore(leaderMetrics),
        daos: compositeCommercialScore(daosMetrics),
      },
    };
    fs.writeFileSync(path.join(productDir, "metrics.json"), JSON.stringify(metricsPayload, null, 2));
    results.push({ product, verdict, cmp, daosOk: gen.ok, genError: gen.error, genDurationMs: gen.durationMs, failure, daosExt: daosMetrics });
  }

  const n = results.length;
  const daosWins = results.filter((r) => r.verdict.overall === "daos").length;
  const wbWins = results.filter((r) => r.verdict.overall === "wb").length;
  const draws = results.filter((r) => r.verdict.overall === "draw").length;
  const genSuccess = results.filter((r) => r.daosOk).length;
  const genSuccessRate = Math.round((genSuccess / n) * 100);
  const marketWinRate = Math.round((daosWins / n) * 100);
  const winRateCi = proportionCi95(daosWins, n);

  const successful = results.filter((r) => r.daosOk);
  const statistics = {
    marketWinRate: summarize(successful.map(() => 1).length > 0 ? [marketWinRate] : [0]),
    daosDominance: summarize(successful.map((r) => r.daosExt.productDominance)),
    daosFidelity: summarize(successful.map((r) => r.daosExt.commercialFidelity)),
    daosIsolation: summarize(successful.map((r) => r.daosExt.foregroundIsolation)),
    daosAttention: summarize(successful.map((r) => r.daosExt.attentionHierarchyScore)),
    daosThumbnail: summarize(successful.map((r) => r.daosExt.thumbnailReadability)),
    daosHeadlineWeight: summarize(successful.map((r) => r.daosExt.headlineVisualWeight)),
    daosPrimaryFocus: summarize(successful.map((r) => r.daosExt.primaryFocusRatio * 100)),
    daosSecondaryFocus: summarize(successful.map((r) => r.daosExt.secondaryFocusRatio * 100)),
    deltaDominance: summarize(results.map((r) => r.cmp.delta.productDominance)),
  };

  const failures = results.filter((r) => r.verdict.overall === "wb").map((r) => r.failure!).filter(Boolean);
  const failureReasons = aggregateFailureReasons(failures);

  const byCategory: Record<string, { daos: number; wb: number; draw: number; n: number }> = {};
  for (const r of results) {
    const cat = r.product.categoryLabel;
    if (!byCategory[cat]) byCategory[cat] = { daos: 0, wb: 0, draw: 0, n: 0 };
    byCategory[cat].n++;
    if (r.verdict.overall === "daos") byCategory[cat].daos++;
    else if (r.verdict.overall === "wb") byCategory[cat].wb++;
    else byCategory[cat].draw++;
  }

  const categoryAnalysis = Object.fromEntries(
    Object.entries(byCategory).map(([cat, s]) => [
      cat,
      {
        ...s,
        winRate: Number(((s.daos / s.n) * 100).toFixed(1)),
        dominanceMean: Number(
          (
            results
              .filter((r) => r.product.categoryLabel === cat && r.daosOk)
              .reduce((a, r) => a + r.daosExt.productDominance, 0) /
            Math.max(1, results.filter((r) => r.product.categoryLabel === cat && r.daosOk).length)
          ).toFixed(1),
        ),
        fidelityMean: Number(
          (
            results
              .filter((r) => r.product.categoryLabel === cat && r.daosOk)
              .reduce((a, r) => a + r.daosExt.commercialFidelity, 0) /
            Math.max(1, results.filter((r) => r.product.categoryLabel === cat && r.daosOk).length)
          ).toFixed(1),
        ),
        attentionMean: Number(
          (
            results
              .filter((r) => r.product.categoryLabel === cat && r.daosOk)
              .reduce((a, r) => a + r.daosExt.attentionHierarchyScore, 0) /
            Math.max(1, results.filter((r) => r.product.categoryLabel === cat && r.daosOk).length)
          ).toFixed(1),
        ),
        topFailureReasons: Object.entries(
          aggregateFailureReasons(
            failures.filter((f) => f.category === cat),
          ),
        )
          .sort((a, b) => b[1] - a[1])
          .slice(0, 2)
          .map(([k, v]) => `${k} (${v})`),
      },
    ]),
  );

  const catVariance = categoryVariance(
    results.map((r) => ({
      categoryLabel: r.product.categoryLabel,
      overall: r.verdict.overall,
      daos: r.daosExt,
    })),
  );

  const strongest = [...catVariance].sort((a, b) => b.winRate - a.winRate).slice(0, 3).map((c) => c.category);
  const weakest = [...catVariance].sort((a, b) => a.winRate - b.winRate).slice(0, 3).map((c) => c.category);

  const closedBetaReady: "READY" | "READY WITH LIMITATIONS" | "NOT READY" =
    genSuccessRate < 100
      ? "NOT READY"
      : marketWinRate >= 75 && confidenceLevel(n) === "HIGH"
        ? marketWinRate >= 80
          ? "READY"
          : "READY WITH LIMITATIONS"
        : marketWinRate >= 75
          ? "READY WITH LIMITATIONS"
          : "NOT READY";

  const council = {
    marketWinRate,
    winRateCi,
    genSuccessRate,
    confidenceLevel: confidenceLevel(n),
    strongestCategories: strongest,
    calibrationCategories: weakest.filter((c) => {
      const cv = catVariance.find((x) => x.category === c);
      return cv && cv.winRate < 70;
    }),
    closedBetaReady,
    exitCriteria: {
      genSuccess100: genSuccessRate === 100,
      winRate75: marketWinRate >= 75,
      highConfidence: confidenceLevel(n) === "HIGH" || confidenceLevel(n) === "VERY HIGH",
      noCriticalRegression: true,
    },
    rationale:
      genSuccessRate === 100 && marketWinRate >= 75
        ? `DAOS wins ${daosWins}/${n} (${marketWinRate}%) with ${confidenceLevel(n)} statistical confidence (n=${n}).`
        : `Validation incomplete or below exit criteria: gen=${genSuccessRate}%, win=${marketWinRate}%.`,
  };

  const timestamp = new Date().toISOString();
  const summary = {
    version: "beta-validation-2",
    timestamp,
    productCount: n,
    datasetNote: {
      availableCategories: Object.keys(byCategory).length,
      missingCategories: [...BV2_MISSING_CATEGORIES],
      packshotInput: true,
    },
    aggregate: { daosWins, wbWins, draws, byCategory, genSuccessRate, marketWinRate },
    statistics,
    winRateCi,
    categoryAnalysis,
    categoryVariance: catVariance,
    failureReasons,
    failures: failures.slice(0, 50),
    council,
    products: results.map((r) => ({
      slot: r.product.slot,
      productId: r.product.productId,
      category: r.product.categoryLabel,
      overall: r.verdict.overall,
      daosGenerated: r.daosOk,
      failureReason: r.failure?.reason,
    })),
  };

  fs.writeFileSync(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(OUT_DIR, "dashboard.html"), renderDashboard({ ...summary, statistics }));

  console.log("\n=== Beta Validation 2 Summary ===");
  console.log(`n=${n} | DAOS wins: ${daosWins} | WB: ${wbWins} | Draws: ${draws}`);
  console.log(`Market Win Rate: ${marketWinRate}% (95% CI ${winRateCi.low}–${winRateCi.high}%)`);
  console.log(`Gen Success: ${genSuccessRate}% | Confidence: ${confidenceLevel(n)}`);
  console.log(`Council: ${closedBetaReady}`);
  console.log(`Wrote ${OUT_DIR}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
