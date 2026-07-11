#!/usr/bin/env npx tsx
/**
 * Quality Cycle 3 — Foreground Isolation validation.
 * Compares production handler output with isolation ON vs Cycle 2 baseline.
 */
import fs from "node:fs";
import path from "node:path";
import {
  createProductionBenchmarkProductImage,
  type BenchmarkProductId,
} from "./lib/production-product-images";
import { measureVisualWeightMetrics } from "./lib/visual-weight-metrics";
import { unpackSdPayload } from "../src/lib/sd-stored-payload";
import { resolvePublicAssetPath } from "../src/lib/runtime-paths";

process.chdir(path.join(__dirname, ".."));

const PRODUCTS: Array<{ id: BenchmarkProductId; label: string; prompt: string }> = [
  { id: "construction-vacuum", label: "Construction Vacuum", prompt: "Строительный пылесос для ремонта 30 л — Wildberries" },
  { id: "battery-sprayer", label: "Battery Sprayer", prompt: "Аккумуляторный опрыскиватель 16 л — Wildberries" },
  { id: "impact-drill", label: "Drill", prompt: "Ударная дрель 800 Вт — Wildberries" },
  { id: "pressure-washer", label: "Pressure Washer", prompt: "Мойка высокого давления 180 бар — Wildberries" },
  { id: "home-humidifier", label: "Home Humidifier", prompt: "Увлажнитель воздуха — Wildberries" },
];

const OUT = path.join(__dirname, "output", "quality-cycle-3");
const BASELINE_PATH = path.join(__dirname, "output", "quality-cycle-2", "daos-baseline-index.json");
const SEED = "quality-cycle-3-foreground-isolation-20260711";

function applyEnv(): void {
  process.env.AI_MOCK_MODE = "true";
  process.env.FAST_GENERATION = "1";
  process.env.RENDER_ENGINE_V17 = "1";
  process.env.DISABLE_IMGLY = "1";
  process.env.USE_FAST_CUTOUT = "1";
  process.env.DESIGN_GOVERNANCE_V171 = "0";
  process.env.DAOS_COMMERCIAL_GENOME_BETA = "1";
  process.env.DAOS_COMMERCIAL_LAYOUT_INTEGRATION = "1";
  process.env.DAOS_FOREGROUND_ISOLATION = "1";
}

async function listMergedFiles(): Promise<Set<string>> {
  const mergedDir = path.join(process.cwd(), "public", "merged");
  if (!fs.existsSync(mergedDir)) return new Set();
  return new Set(fs.readdirSync(mergedDir));
}

async function ensureUser() {
  const { prisma } = await import("../src/lib/prisma");
  const email = "benchmark-cycle3@daos.local";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { email, name: "QC3 Benchmark", credits: 500 },
    });
  }
  return user.id;
}

async function runProduct(
  product: (typeof PRODUCTS)[number],
  userId: string,
  mergedBefore: Set<string>,
) {
  const productImage = await createProductionBenchmarkProductImage(product.id);
  const { handleGenerateInfographic } = await import("../src/lib/generate-infographic-handler");
  const { loadDesignLibrary } = await import("../src/lib/design-library");
  const { selectRelevantExamples } = await import("../src/lib/select-relevant-examples");
  const { prisma } = await import("../src/lib/prisma");

  const library = await loadDesignLibrary();
  const examples = await selectRelevantExamples(product.prompt, 5);

  const started = Date.now();
  const result = await handleGenerateInfographic({
    userId,
    prompt: product.prompt,
    productImage,
    backgroundSeed: `${SEED}:${product.id}`,
    ollamaContext: { library, examples },
  });

  const record = await prisma.generatedImage.findUnique({
    where: { id: result.id },
    select: { imagePath: true, generatedJson: true },
  });
  await prisma.$disconnect();

  const webPath = record?.imagePath ?? result.imagePath;
  const normalized = webPath.startsWith("/api/") ? webPath.replace("/api/", "/") : webPath;
  let finalAbs = "";
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      finalAbs = await resolvePublicAssetPath(normalized);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 400));
    }
  }
  if (!finalAbs || !fs.existsSync(finalAbs)) {
    throw new Error(`Final image not found: ${webPath}`);
  }

  const mergedAfter = await listMergedFiles();
  const newMerged = [...mergedAfter].filter((f) => !mergedBefore.has(f));
  const mergedWebPath = newMerged.length ? `/merged/${newMerged.sort().at(-1)}` : null;
  let compositedAbs: string | null = null;
  if (mergedWebPath) {
    try {
      compositedAbs = await resolvePublicAssetPath(mergedWebPath);
    } catch {
      compositedAbs = null;
    }
  }

  const payload = record?.generatedJson ? unpackSdPayload(record.generatedJson) : null;
  const foregroundIsolationApplied = !!payload?.foregroundIsolation?.applied;
  const handlerFlags = (payload?.qualityValidation?.issues?.map((i) => i.code) ?? []).filter(
    (c): c is string => typeof c === "string" && c.length > 0,
  );

  const metricsFinal = await measureVisualWeightMetrics(finalAbs);
  const metricsComposited = compositedAbs
    ? await measureVisualWeightMetrics(compositedAbs)
    : null;

  return {
    productId: product.id,
    label: product.label,
    durationMs: Date.now() - started,
    finalPath: finalAbs,
    compositedPath: compositedAbs,
    composited: !!compositedAbs,
    foregroundIsolationApplied,
    foregroundIsolationDiagnostics: payload?.foregroundIsolation,
    metrics: metricsFinal,
    metricsComposited,
    handlerFlags,
    qualityScore: payload?.qualityScore,
  };
}

function avg(results: Awaited<ReturnType<typeof runProduct>>[], fn: (m: VisualWeightPick) => number) {
  return Number((results.reduce((s, r) => s + fn(r.metrics), 0) / results.length).toFixed(1));
}

type VisualWeightPick = Awaited<ReturnType<typeof measureVisualWeightMetrics>>;

function buildReportHtml(summary: Record<string, unknown>, results: Awaited<ReturnType<typeof runProduct>>[]) {
  const cycle3 = summary.cycle3 as Record<string, number>;
  const cycle2 = summary.cycle2Baseline as Record<string, number>;
  const delta = summary.delta as Record<string, number>;
  const rows = results
    .map(
      (r) => `<tr>
      <td>${r.label}</td>
      <td>${r.metrics.foregroundIsolation}</td>
      <td>${r.metricsComposited?.foregroundIsolation ?? "—"}</td>
      <td>${r.metrics.productDominanceScore}</td>
      <td>${r.metrics.productAreaPct}</td>
      <td>${r.composited ? "Yes" : "No"}</td>
      <td>${r.foregroundIsolationApplied ? "Yes" : "No"}</td>
    </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <title>Quality Cycle 3 — Foreground Isolation</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b1220; color: #e2e8f0; padding: 24px; max-width: 1100px; margin: 0 auto; }
    h1, h2 { color: #f8fafc; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 14px; }
    th, td { border: 1px solid #334155; padding: 8px 12px; text-align: left; }
    th { background: #1e293b; }
    .gap { color: #f87171; }
    .gain { color: #4ade80; }
    .card { background: #1e293b; border-radius: 8px; padding: 16px; margin: 12px 0; }
    figure { display: inline-block; margin: 8px; vertical-align: top; }
    img { max-width: 220px; border: 1px solid #334155; border-radius: 4px; }
    figcaption { font-size: 12px; color: #94a3b8; margin-top: 4px; }
  </style>
</head>
<body>
  <h1>Quality Cycle 3 — Foreground Isolation</h1>
  <p>Additive compositor isolation · 5 benchmark products · Production handler only</p>

  <div class="card">
    <h2>Aggregate</h2>
    <table>
      <tr><th>Metric</th><th>Cycle 2</th><th>Cycle 3 Final</th><th>Δ</th><th>WB Target</th></tr>
      <tr>
        <td>Foreground Isolation</td>
        <td>${cycle2.foregroundIsolation}</td>
        <td>${cycle3.foregroundIsolation}</td>
        <td class="${delta.foregroundIsolation >= 0 ? "gain" : "gap"}">${delta.foregroundIsolation >= 0 ? "+" : ""}${delta.foregroundIsolation}</td>
        <td>50.2</td>
      </tr>
      <tr>
        <td>Product Dominance</td>
        <td>${cycle2.productDominance}</td>
        <td>${cycle3.productDominanceScore}</td>
        <td class="${delta.productDominance >= 0 ? "gain" : "gap"}">${delta.productDominance >= 0 ? "+" : ""}${delta.productDominance}</td>
        <td>—</td>
      </tr>
      <tr>
        <td>Visual Weight (hero)</td>
        <td>${cycle2.visualWeight}</td>
        <td>${cycle3.visualWeightHero}</td>
        <td class="${delta.visualWeight >= 0 ? "gain" : "gap"}">${delta.visualWeight >= 0 ? "+" : ""}${delta.visualWeight}</td>
        <td>—</td>
      </tr>
      <tr>
        <td>Product Area %</td>
        <td>${cycle2.productArea}</td>
        <td>${cycle3.productAreaPct}</td>
        <td>${delta.productArea}</td>
        <td>unchanged</td>
      </tr>
    </table>
  </div>

  <h2>Per Product</h2>
  <table>
    <tr><th>Product</th><th>FI Final</th><th>FI Composited</th><th>Dominance</th><th>Area %</th><th>Compositor</th><th>Isolation ON</th></tr>
    ${rows}
  </table>

  <h2>Visual Package</h2>
  ${results
    .map(
      (r) => `<div class="card">
    <h3>${r.label}</h3>
    <figure><figcaption>03 Composited</figcaption><img src="${r.productId}/03-composited.png" onerror="this.alt='missing'"/></figure>
    <figure><figcaption>04 Final Card</figcaption><img src="${r.productId}/04-final-card.png"/></figure>
  </div>`,
    )
    .join("")}

  <p>
    <a href="../../../docs/DAOS_FOREGROUND_ISOLATION.md">Isolation spec</a> ·
    <a href="../../../docs/DAOS_QUALITY_CYCLE_3_REPORT.md">Full report</a>
  </p>
</body>
</html>`;
}

async function main() {
  applyEnv();
  fs.mkdirSync(OUT, { recursive: true });

  const baseline = fs.existsSync(BASELINE_PATH)
    ? (JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8")) as Array<{
        category: string;
        foregroundIsolation?: number;
        productAreaPct?: number;
        productDominanceScore?: number;
        visualWeightHero?: number;
      }>)
    : [];

  const userId = await ensureUser();
  const results: Awaited<ReturnType<typeof runProduct>>[] = [];

  for (const product of PRODUCTS.slice(0, Number(process.env.QC3_LIMIT ?? PRODUCTS.length))) {
    console.log(`==> ${product.id}`);
    const mergedBefore = await listMergedFiles();
    results.push(await runProduct(product, userId, mergedBefore));
  }

  const cycle2Avg = {
    foregroundIsolation: baseline.length
      ? Number(
          (
            baseline.reduce((s, b) => s + (b.foregroundIsolation ?? b.visualWeightHero ?? 0), 0) /
            baseline.length
          ).toFixed(1),
        )
      : 32.5,
    productDominance: baseline.length
      ? Number(
          (baseline.reduce((s, b) => s + (b.productDominanceScore ?? 0), 0) / baseline.length).toFixed(1),
        )
      : 42.4,
    productArea: baseline.length
      ? Number((baseline.reduce((s, b) => s + (b.productAreaPct ?? 0), 0) / baseline.length).toFixed(1))
      : 31,
    visualWeight: baseline.length
      ? Number((baseline.reduce((s, b) => s + (b.visualWeightHero ?? 0), 0) / baseline.length).toFixed(1))
      : 19.1,
  };

  const cycle2Features = path.join(__dirname, "output", "quality-cycle-2", "feature-matrix.json");
  if (fs.existsSync(cycle2Features)) {
    const feats = JSON.parse(fs.readFileSync(cycle2Features, "utf8")) as Array<{
      source: string;
      foregroundIsolation: number;
    }>;
    const daosFeats = feats.filter((f) => f.source === "daos");
    if (daosFeats.length) {
      cycle2Avg.foregroundIsolation = Number(
        (daosFeats.reduce((s, f) => s + f.foregroundIsolation, 0) / daosFeats.length).toFixed(1),
      );
    }
  }

  const compositedResults = results.filter((r) => r.metricsComposited);
  const summary = {
    sprint: "Quality Cycle 3 — Foreground Isolation",
    timestamp: new Date().toISOString(),
    productCount: results.length,
    wbMedianTarget: { foregroundIsolation: 50.2 },
    cycle2Baseline: cycle2Avg,
    cycle3: {
      foregroundIsolation: avg(results, (m) => m.foregroundIsolation),
      objectSharpness: avg(results, (m) => m.objectSharpness),
      objectContrast: avg(results, (m) => m.objectContrast),
      localContrast: avg(results, (m) => m.localContrast),
      visualWeightHero: avg(results, (m) => m.visualWeightHero),
      productDominanceScore: avg(results, (m) => m.productDominanceScore),
      productAreaPct: avg(results, (m) => m.productAreaPct),
      commercialFidelityScore: avg(results, (m) => m.commercialFidelityScore),
    },
    cycle3Composited: compositedResults.length
      ? {
          foregroundIsolation: Number(
            (
              compositedResults.reduce((s, r) => s + (r.metricsComposited?.foregroundIsolation ?? 0), 0) /
              compositedResults.length
            ).toFixed(1),
          ),
          productDominanceScore: Number(
            (
              compositedResults.reduce((s, r) => s + (r.metricsComposited?.productDominanceScore ?? 0), 0) /
              compositedResults.length
            ).toFixed(1),
          ),
          visualWeightHero: Number(
            (
              compositedResults.reduce((s, r) => s + (r.metricsComposited?.visualWeightHero ?? 0), 0) /
              compositedResults.length
            ).toFixed(1),
          ),
        }
      : null,
    delta: {
      foregroundIsolation: Number((avg(results, (m) => m.foregroundIsolation) - cycle2Avg.foregroundIsolation).toFixed(1)),
      productDominance: Number(
        (avg(results, (m) => m.productDominanceScore) - cycle2Avg.productDominance).toFixed(1),
      ),
      productArea: Number((avg(results, (m) => m.productAreaPct) - cycle2Avg.productArea).toFixed(1)),
      visualWeight: Number((avg(results, (m) => m.visualWeightHero) - cycle2Avg.visualWeight).toFixed(1)),
    },
    compositorSuccessRate: `${results.filter((r) => r.composited).length}/${results.length}`,
    isolationAppliedRate: `${results.filter((r) => r.foregroundIsolationApplied).length}/${results.length}`,
    products: results,
  };

  for (const r of results) {
    const dir = path.join(OUT, r.productId);
    fs.mkdirSync(dir, { recursive: true });
    fs.copyFileSync(r.finalPath, path.join(dir, "04-final-card.png"));
    if (r.compositedPath && fs.existsSync(r.compositedPath)) {
      fs.copyFileSync(r.compositedPath, path.join(dir, "03-composited.png"));
    }
    fs.writeFileSync(path.join(dir, "metrics.json"), JSON.stringify(r, null, 2));
  }

  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(OUT, "report.html"), buildReportHtml(summary, results));

  console.log("\n=== Cycle 3 Summary ===");
  console.log(
    `Foreground Isolation (final): ${cycle2Avg.foregroundIsolation} → ${summary.cycle3.foregroundIsolation} (Δ ${summary.delta.foregroundIsolation})`,
  );
  if (summary.cycle3Composited) {
    console.log(`Foreground Isolation (composited): ${summary.cycle3Composited.foregroundIsolation}`);
  }
  console.log(`Product Dominance: ${cycle2Avg.productDominance} → ${summary.cycle3.productDominanceScore}`);
  console.log(`Product Area: ${cycle2Avg.productArea} → ${summary.cycle3.productAreaPct} (Δ ${summary.delta.productArea})`);
  console.log(`Compositor: ${summary.compositorSuccessRate} · Isolation applied: ${summary.isolationAppliedRate}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
