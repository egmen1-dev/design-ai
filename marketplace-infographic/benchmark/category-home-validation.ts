#!/usr/bin/env npx tsx
/**
 * Home Category Wave 1 — validation benchmark (Дом only).
 * Target: Category Win Rate ≥70% vs BV2 baseline 57.1%.
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
import { HOME_BV2_BASELINE, TIER_A_REFERENCE } from "../src/lib/daos/commercial-genome-beta/category-intelligence/home-category-knowledge";

process.chdir(path.join(__dirname, ".."));

const OUT_DIR = path.join("benchmark", "output", "category-home");
const FIXED_SEED = "category-home-wave1-20260711";
const RESUME = process.env.HOME_RESUME !== "0";
const TARGET_WIN_RATE = 70;
const BV2_BASELINE = HOME_BV2_BASELINE.winRate;

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
  const email = "benchmark-category-home@daos.local";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: "Home Category Wave 1", credits: 5000 },
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

function renderReportHtml(payload: Record<string, unknown>): string {
  const council = payload.council as Record<string, unknown>;
  const products = payload.products as Array<Record<string, unknown>>;
  const rows = products
    .map((p) => {
      const cls = p.overall === "daos" ? "d" : p.overall === "wb" ? "w" : "dr";
      return `<tr><td>${p.slot}</td><td class="${cls}">${p.overall}</td><td>${p.daosDominance}</td><td>${p.wbDominance}</td><td>${p.deltaDominance}</td><td>${p.failure ?? "—"}</td></tr>`;
    })
    .join("");
  const verdict = council.verdict as string;
  const vcls = verdict === "PASS" ? "pass" : verdict === "PARTIAL" ? "partial" : "fail";
  return `<!DOCTYPE html>
<html lang="ru"><head><meta charset="utf-8"/><title>Home Category Wave 1</title>
<style>
body{font-family:system-ui,sans-serif;margin:24px;background:#0b1220;color:#e2e8f0}
h1{color:#38bdf8}.pass{color:#4ade80}.partial{color:#fbbf24}.fail{color:#f87171}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:20px 0}
.card{background:#1e293b;padding:16px;border-radius:8px}.card strong{font-size:1.8rem;display:block}
table{width:100%;border-collapse:collapse;font-size:0.85rem;margin-top:16px}
th,td{border:1px solid #334155;padding:8px}th{background:#1e293b}.d{color:#4ade80}.w{color:#f87171}.dr{color:#fbbf24}
</style></head><body>
<h1>DAOS Home Category — Wave 1 Validation</h1>
<p>${payload.timestamp as string} · n=${payload.productCount as number} · Profile v1.1.0-home-wave1</p>
<div class="grid">
  <div class="card"><strong>${council.winRate as number}%</strong>Category Win Rate<span>Target ≥${TARGET_WIN_RATE}%</span></div>
  <div class="card"><strong>${council.genSuccessRate as number}%</strong>Generation Success</div>
  <div class="card"><strong class="${vcls}">${verdict}</strong>Council Verdict</div>
  <div class="card"><strong>${council.dominanceMean as number}</strong>Avg Dominance<span>BV2: ${BV2_BASELINE}% → ${council.winRate as number}%</span></div>
</div>
<table><thead><tr><th>Slot</th><th>Verdict</th><th>DAOS Dom</th><th>WB Dom</th><th>Δ Dom</th><th>Failure</th></tr></thead><tbody>${rows}</tbody></table>
<p>Council: ${council.rationale as string}</p>
</body></html>`;
}

async function main() {
  applyBenchmarkEnv();
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const products = selectBetaValidation2Products().filter((p) => p.category === "home");
  console.log(`Home Category Wave 1: ${products.length} products (harvest limit; target n≥30)`);

  const userId = await ensureBenchmarkUser();
  const results: Array<{
    product: BetaValidationProduct;
    verdict: HumanVerdict;
    cmp: MetricComparison;
    daosOk: boolean;
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
      console.log(`  [cached] ${product.slot} → ${m.verdict.overall}`);
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
        verdict: {
          overall: "wb",
          moreProfessional: "wb",
          strongerSell: "wb",
          fasterRead: "wb",
          wouldOpen: "wb",
          rationale: gen.error ?? "gen failed",
        },
        cmp: { leader: {} as never, daos: {} as never, delta: {} as never, leaderWins: 0, daosWins: 0, draws: 0 },
        daosOk: false,
      });
      console.log(`  [FAIL] ${product.slot}: ${gen.error}`);
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
          name: product.name,
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
    console.log(
      `  ${product.slot} → ${verdict.overall} (dom ${daosMetrics.productDominance} vs ${leaderMetrics.productDominance})`,
    );
  }

  const genSuccess = results.filter((r) => r.daosOk).length;
  const genRate = Number(((genSuccess / results.length) * 100).toFixed(1));
  const wins = results.filter((r) => r.verdict.overall === "daos").length;
  const winRate = Number(((wins / results.length) * 100).toFixed(1));
  const ci = proportionCi95(wins, results.length);

  const dominanceScores = results.filter((r) => r.daosOk).map((r) => r.cmp.daos.productDominance);
  const fidelityScores = results.filter((r) => r.daosOk).map((r) => r.cmp.daos.commercialFidelity);
  const attentionScores = results.filter((r) => r.daosOk).map((r) => r.cmp.daos.attentionHierarchyScore);
  const isolationScores = results.filter((r) => r.daosOk).map((r) => r.cmp.daos.foregroundIsolation);
  const thumbScores = results.filter((r) => r.daosOk).map((r) => r.cmp.daos.thumbnailReadability);

  const failures = results.filter((r) => r.failure).map((r) => r.failure!);
  const dominanceDelta = Number(
    (summarize(dominanceScores).mean - HOME_BV2_BASELINE.avgDominance).toFixed(1),
  );

  let councilVerdict: "PASS" | "PARTIAL" | "FAIL";
  let rationale: string;
  if (winRate >= TARGET_WIN_RATE && genRate === 100) {
    councilVerdict = "PASS";
    rationale = `Home category reached Tier A threshold (${winRate}% ≥ ${TARGET_WIN_RATE}%). Next: Кухня.`;
  } else if (winRate > BV2_BASELINE && dominanceDelta > 0) {
    councilVerdict = "PARTIAL";
    rationale = `Win rate improved ${BV2_BASELINE}%→${winRate}% but below ${TARGET_WIN_RATE}%. Primary gap: Product Visual Mass on flat organizers (compositor scale).`;
  } else {
    councilVerdict = "FAIL";
    rationale = `No confirmed lift vs BV2 baseline (${BV2_BASELINE}%). Return to category analysis.`;
  }

  const summary = {
    version: "category-home-wave1",
    profileVersion: "1.1.0-home-wave1",
    timestamp: new Date().toISOString(),
    productCount: results.length,
    datasetNote: "WB harvest provides n=14 home products; target n≥30 not met — confidence LOW",
    aggregate: {
      genSuccessRate: genRate,
      categoryWinRate: winRate,
      daosWins: wins,
      wbWins: results.filter((r) => r.verdict.overall === "wb").length,
      draws: results.filter((r) => r.verdict.overall === "draw").length,
      winRateCi: ci,
      baselineWinRate: BV2_BASELINE,
      deltaPp: Number((winRate - BV2_BASELINE).toFixed(1)),
    },
    metrics: {
      productDominance: summarize(dominanceScores),
      commercialFidelity: summarize(fidelityScores),
      attentionHierarchy: summarize(attentionScores),
      foregroundIsolation: summarize(isolationScores),
      thumbnailReadability: summarize(thumbScores),
    },
    tierARegression: {
      note: "Tier A categories not re-run; BV2 frozen results used (Электроинструмент 78.6%, Авто 78.6%, Строительство 71.4%)",
      degraded: false,
    },
    failureReasons: aggregateFailureReasons(failures),
    confidenceLevel: confidenceLevel(results.length),
    council: {
      verdict: councilVerdict,
      winRate,
      targetWinRate: TARGET_WIN_RATE,
      genSuccessRate: genRate,
      dominanceMean: summarize(dominanceScores).mean,
      dominanceDeltaVsBv2: dominanceDelta,
      tierAReference: TIER_A_REFERENCE,
      rationale,
      nextCategory: councilVerdict === "PASS" ? "Кухня" : null,
      primaryGap: councilVerdict === "PARTIAL" ? "Product Visual Mass — flat organizer compositor scale" : undefined,
    },
    products: results.map((r) => ({
      slot: r.product.slot,
      productId: r.product.productId,
      overall: r.verdict.overall,
      daosDominance: r.cmp.daos?.productDominance,
      wbDominance: r.cmp.leader?.productDominance,
      deltaDominance: r.cmp.delta?.productDominance,
      failure: r.failure?.reason,
    })),
  };

  await fsPromises.writeFile(path.join(OUT_DIR, "summary.json"), JSON.stringify(summary, null, 2));
  await fsPromises.writeFile(path.join(OUT_DIR, "report.html"), renderReportHtml(summary));

  console.log("\n=== Home Category Wave 1 ===");
  console.log(`Generation Success: ${genRate}%`);
  console.log(`Category Win Rate: ${winRate}% (baseline ${BV2_BASELINE}%, target ${TARGET_WIN_RATE}%)`);
  console.log(`Avg Dominance: ${summarize(dominanceScores).mean} (BV2: ${HOME_BV2_BASELINE.avgDominance}, Δ${dominanceDelta})`);
  console.log(`Council: ${councilVerdict} — ${rationale}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
