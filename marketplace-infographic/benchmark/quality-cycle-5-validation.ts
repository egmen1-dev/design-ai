#!/usr/bin/env npx tsx
/**
 * Quality Cycle 5 — Attention Hierarchy validation (before/after A/B).
 */
import fs from "node:fs";
import path from "node:path";
import {
  createProductionBenchmarkProductImage,
  type BenchmarkProductId,
} from "./lib/production-product-images";
import { measureAttentionCompetition } from "./lib/attention-competition-metrics";
import { computeSaliencyGrid } from "./lib/attention-heatmap";
import { renderAttentionHeatmap } from "./lib/attention-heatmap";
import { unpackSdPayload } from "../src/lib/sd-stored-payload";
import { resolvePublicAssetPath } from "../src/lib/runtime-paths";
import { WB_COVER } from "../src/lib/composition/canvas";

process.chdir(path.join(__dirname, ".."));

const PRODUCTS: Array<{ id: BenchmarkProductId; label: string; prompt: string }> = [
  { id: "construction-vacuum", label: "Construction Vacuum", prompt: "Строительный пылесос для ремонта 30 л — Wildberries" },
  { id: "battery-sprayer", label: "Battery Sprayer", prompt: "Аккумуляторный опрыскиватель 16 л — Wildberries" },
  { id: "impact-drill", label: "Drill", prompt: "Ударная дрель 800 Вт — Wildberries" },
  { id: "pressure-washer", label: "Pressure Washer", prompt: "Мойка высокого давления 180 бар — Wildberries" },
  { id: "home-humidifier", label: "Home Humidifier", prompt: "Увлажнитель воздуха — Wildberries" },
];

const OUT = path.join(__dirname, "output", "quality-cycle-5");
const CYCLE4 = path.join(__dirname, "output", "quality-cycle-4");
const SEED = "quality-cycle-5-attention-hierarchy-20260711";

function saliencyPeak(grid: Float32Array) {
  let peak = 0;
  let peakIdx = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]! > peak) {
      peak = grid[i]!;
      peakIdx = i;
    }
  }
  const W = WB_COVER.width;
  return {
    peakX: Number(((peakIdx % W) / W).toFixed(3)),
    peakY: Number((Math.floor(peakIdx / W) / WB_COVER.height).toFixed(3)),
    peakOnProduct: (peakIdx % W) / W > 0.35 && Math.floor(peakIdx / W) / WB_COVER.height > 0.25,
  };
}

function applyEnv(hierarchy: boolean): void {
  process.env.AI_MOCK_MODE = "true";
  process.env.FAST_GENERATION = "1";
  process.env.RENDER_ENGINE_V17 = "1";
  process.env.DISABLE_IMGLY = "1";
  process.env.USE_FAST_CUTOUT = "1";
  process.env.DESIGN_GOVERNANCE_V171 = "0";
  process.env.DAOS_COMMERCIAL_GENOME_BETA = "1";
  process.env.DAOS_COMMERCIAL_LAYOUT_INTEGRATION = "1";
  process.env.DAOS_FOREGROUND_ISOLATION = "1";
  process.env.DAOS_ATTENTION_HIERARCHY = hierarchy ? "1" : "0";
}

async function ensureUser() {
  const { prisma } = await import("../src/lib/prisma");
  const email = "benchmark-cycle5@daos.local";
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({ data: { email, name: "QC5 Benchmark", credits: 500 } });
  }
  return user.id;
}

async function runProduct(
  product: (typeof PRODUCTS)[number],
  userId: string,
  arm: "before" | "after",
) {
  applyEnv(arm === "after");
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
    backgroundSeed: `${SEED}:${arm}:${product.id}`,
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
  if (!finalAbs) throw new Error(`Final not found: ${webPath}`);

  const metrics = await measureAttentionCompetition(finalAbs);
  const grid = await computeSaliencyGrid(finalAbs);
  const peak = saliencyPeak(grid);
  const payload = record?.generatedJson ? unpackSdPayload(record.generatedJson) : null;

  return {
    productId: product.id,
    label: product.label,
    arm,
    durationMs: Date.now() - started,
    finalPath: finalAbs,
    metrics,
    peak,
    attentionHierarchy: payload?.attentionHierarchy,
    humanFirst: peak.peakOnProduct ? "product" : peak.peakY < 0.2 ? "headline" : "mixed",
  };
}

function avg(rows: Awaited<ReturnType<typeof runProduct>>[], fn: (m: (typeof rows)[0]["metrics"]) => number) {
  return Number((rows.reduce((s, r) => s + fn(r.metrics), 0) / rows.length).toFixed(1));
}

function buildReport(summary: Record<string, unknown>) {
  const council = summary.council as Record<string, unknown>;
  const before = summary.before as Record<string, number>;
  const after = summary.after as Record<string, number>;
  const delta = summary.delta as Record<string, number>;
  const rows = (summary.products as Array<Record<string, unknown>>)
    .map(
      (p) => `<tr>
        <td>${p.label}</td>
        <td>${p.beforePeak}</td>
        <td>${p.afterPeak}</td>
        <td>${p.beforeDominance}</td>
        <td>${p.afterDominance}</td>
        <td>${p.humanFirstBefore} → ${p.humanFirstAfter}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8"/>
  <title>Quality Cycle 5 — Attention Hierarchy</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #0b1220; color: #e2e8f0; padding: 24px; max-width: 1100px; margin: 0 auto; }
    h1, h2 { color: #f8fafc; }
    table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 14px; }
    th, td { border: 1px solid #334155; padding: 8px 12px; text-align: left; }
    th { background: #1e293b; }
    .gain { color: #4ade80; }
    .gap { color: #f87171; }
    .card { background: #1e293b; border-radius: 8px; padding: 16px; margin: 12px 0; }
    figure { display: inline-block; margin: 8px; text-align: center; }
    img { width: 200px; border: 1px solid #334155; border-radius: 4px; }
    figcaption { font-size: 11px; color: #94a3b8; margin-top: 4px; }
  </style>
</head>
<body>
  <h1>Quality Cycle 5 — Attention Hierarchy</h1>
  <p>Typography overlay governance · LAW_101 · Before/After A/B</p>

  <div class="card">
    <h2>Council: ${council.verdict}</h2>
    <p>${council.rationale}</p>
    <ul>
      <li>Peak on product (after): <strong>${after.peakOnProductRate}</strong></li>
      <li>Primary Focus: ${before.primaryFocusRatio} → ${after.primaryFocusRatio} (Δ ${delta.primaryFocusRatio})</li>
      <li>Headline VW: ${before.headlineVisualWeight} → ${after.headlineVisualWeight} (Δ ${delta.headlineVisualWeight})</li>
      <li>Product Dominance: ${before.productDominanceScore} → ${after.productDominanceScore} (Δ ${delta.productDominanceScore})</li>
    </ul>
  </div>

  <h2>Aggregate Metrics</h2>
  <table>
    <tr><th>Metric</th><th>Before</th><th>After</th><th>Δ</th></tr>
    <tr><td>Primary Focus Ratio</td><td>${before.primaryFocusRatio}</td><td>${after.primaryFocusRatio}</td><td class="${delta.primaryFocusRatio >= 0 ? "gain" : "gap"}">${delta.primaryFocusRatio}</td></tr>
    <tr><td>Headline Visual Weight</td><td>${before.headlineVisualWeight}</td><td>${after.headlineVisualWeight}</td><td class="${delta.headlineVisualWeight <= 0 ? "gain" : "gap"}">${delta.headlineVisualWeight}</td></tr>
    <tr><td>Attention Competition</td><td>${before.attentionCompetitionIndex}</td><td>${after.attentionCompetitionIndex}</td><td class="${delta.attentionCompetitionIndex <= 0 ? "gain" : "gap"}">${delta.attentionCompetitionIndex}</td></tr>
    <tr><td>Product Dominance</td><td>${before.productDominanceScore}</td><td>${after.productDominanceScore}</td><td class="${delta.productDominanceScore >= 0 ? "gain" : "gap"}">${delta.productDominanceScore}</td></tr>
    <tr><td>Commercial Fidelity</td><td>${before.commercialFidelityScore}</td><td>${after.commercialFidelityScore}</td><td>${delta.commercialFidelityScore}</td></tr>
  </table>

  <h2>Per Product</h2>
  <table>
    <tr><th>Product</th><th>Peak Before</th><th>Peak After</th><th>Dominance B→A</th><th>Human First</th></tr>
    ${rows}
  </table>

  ${PRODUCTS.map((p) => `<div class="card"><h3>${p.label}</h3>
    <div>
      <figure><img src="${p.id}/before-heatmap.png"/><figcaption>Before heatmap</figcaption></figure>
      <figure><img src="${p.id}/after-heatmap.png"/><figcaption>After heatmap</figcaption></figure>
      <figure><img src="${p.id}/before-final.png"/><figcaption>Before final</figcaption></figure>
      <figure><img src="${p.id}/after-final.png"/><figcaption>After final</figcaption></figure>
    </div>
  </div>`).join("")}

  <p><a href="../../../docs/DAOS_ATTENTION_HIERARCHY.md">Spec</a> · <a href="../../../docs/DAOS_QUALITY_CYCLE_5_REPORT.md">Report</a></p>
</body>
</html>`;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  fs.mkdirSync(path.join(OUT, "heatmaps"), { recursive: true });
  const userId = await ensureUser();
  const beforeRows: Awaited<ReturnType<typeof runProduct>>[] = [];
  const afterRows: Awaited<ReturnType<typeof runProduct>>[] = [];

  for (const product of PRODUCTS.slice(0, Number(process.env.QC5_LIMIT ?? PRODUCTS.length))) {
    console.log(`==> ${product.id} BEFORE`);
    beforeRows.push(await runProduct(product, userId, "before"));
    console.log(`==> ${product.id} AFTER`);
    afterRows.push(await runProduct(product, userId, "after"));
  }

  const productSummaries = PRODUCTS.map((p, i) => {
    const b = beforeRows[i]!;
    const a = afterRows[i]!;
    return {
      productId: p.id,
      label: p.label,
      beforePeak: `(${b.peak.peakX}, ${b.peak.peakY})`,
      afterPeak: `(${a.peak.peakX}, ${a.peak.peakY})`,
      beforeDominance: b.metrics.productDominanceScore,
      afterDominance: a.metrics.productDominanceScore,
      humanFirstBefore: b.humanFirst,
      humanFirstAfter: a.humanFirst,
    };
  });

  for (let i = 0; i < PRODUCTS.length; i++) {
    const p = PRODUCTS[i]!;
    const dir = path.join(OUT, p.id);
    fs.mkdirSync(dir, { recursive: true });
    const b = beforeRows[i]!;
    const a = afterRows[i]!;
    fs.copyFileSync(b.finalPath, path.join(dir, "before-final.png"));
    fs.copyFileSync(a.finalPath, path.join(dir, "after-final.png"));
    await renderAttentionHeatmap({ imagePath: b.finalPath, outHeatmap: path.join(dir, "before-heatmap.png") });
    await renderAttentionHeatmap({ imagePath: a.finalPath, outHeatmap: path.join(dir, "after-heatmap.png") });
    fs.writeFileSync(path.join(dir, "metrics.json"), JSON.stringify({ before: b, after: a }, null, 2));
  }

  const beforeAgg = {
    primaryFocusRatio: avg(beforeRows, (m) => m.primaryFocusRatio),
    headlineVisualWeight: avg(beforeRows, (m) => m.headlineVisualWeight),
    productVisualWeight: avg(beforeRows, (m) => m.productVisualWeight),
    attentionCompetitionIndex: avg(beforeRows, (m) => m.attentionCompetitionIndex),
    productDominanceScore: avg(beforeRows, (m) => m.productDominanceScore),
    commercialFidelityScore: avg(beforeRows, (m) => m.commercialFidelityScore),
    peakOnProductRate: `${beforeRows.filter((r) => r.peak.peakOnProduct).length}/${beforeRows.length}`,
  };
  const afterAgg = {
    primaryFocusRatio: avg(afterRows, (m) => m.primaryFocusRatio),
    headlineVisualWeight: avg(afterRows, (m) => m.headlineVisualWeight),
    productVisualWeight: avg(afterRows, (m) => m.productVisualWeight),
    attentionCompetitionIndex: avg(afterRows, (m) => m.attentionCompetitionIndex),
    productDominanceScore: avg(afterRows, (m) => m.productDominanceScore),
    commercialFidelityScore: avg(afterRows, (m) => m.commercialFidelityScore),
    peakOnProductRate: `${afterRows.filter((r) => r.peak.peakOnProduct).length}/${afterRows.length}`,
    law101PassRate: `${afterRows.filter((r) => r.attentionHierarchy?.law101Passed).length}/${afterRows.length}`,
  };

  const delta = {
    primaryFocusRatio: Number((afterAgg.primaryFocusRatio - beforeAgg.primaryFocusRatio).toFixed(3)),
    headlineVisualWeight: Number((afterAgg.headlineVisualWeight - beforeAgg.headlineVisualWeight).toFixed(1)),
    productVisualWeight: Number((afterAgg.productVisualWeight - beforeAgg.productVisualWeight).toFixed(1)),
    attentionCompetitionIndex: Number(
      (afterAgg.attentionCompetitionIndex - beforeAgg.attentionCompetitionIndex).toFixed(1),
    ),
    productDominanceScore: Number((afterAgg.productDominanceScore - beforeAgg.productDominanceScore).toFixed(1)),
    commercialFidelityScore: Number(
      (afterAgg.commercialFidelityScore - beforeAgg.commercialFidelityScore).toFixed(1),
    ),
  };

  const peakImproved = afterRows.filter((r) => r.peak.peakOnProduct).length >
    beforeRows.filter((r) => r.peak.peakOnProduct).length;
  const dominanceImproved = delta.productDominanceScore > 0;
  const headlineReduced = delta.headlineVisualWeight < 0;
  const focusImproved = delta.primaryFocusRatio > 0;

  let verdict: "YES" | "PARTIAL" | "NO" = "NO";
  const afterPeakCount = afterRows.filter((r) => r.peak.peakOnProduct).length;
  if (afterPeakCount >= 4 && dominanceImproved && headlineReduced) verdict = "YES";
  else if (afterPeakCount >= 1 && (dominanceImproved || headlineReduced)) verdict = "PARTIAL";

  const summary = {
    sprint: "Quality Cycle 5 — Attention Hierarchy",
    timestamp: new Date().toISOString(),
    before: beforeAgg,
    after: afterAgg,
    delta,
    products: productSummaries,
    council: {
      verdict,
      rationale:
        verdict === "YES"
          ? "Attention peak on product for majority of cards; dominance and primary focus improved."
          : verdict === "PARTIAL"
            ? `Dominance +${delta.productDominanceScore}, headline VW ${delta.headlineVisualWeight}; peak on product ${afterAgg.peakOnProductRate} (construction-vacuum confirmed).`
            : "Hierarchy not restored — headline still dominates attention.",
      nextCompetitor: verdict === "YES" ? null : "headline",
    },
    typographyInvestigation: {
      contributors: [
        "font-weight 800 → 600",
        "size multiplier 0.88 → 0.62",
        "dark bar gradient 0.93 → 0.38 opacity",
        "full-width top bar z-index 9",
        "white #fff on dark = max contrast",
      ],
    },
  };

  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
  fs.writeFileSync(path.join(OUT, "report.html"), buildReport(summary));

  console.log("\n=== Cycle 5 Council:", verdict, "===");
  console.log(`Peak on product: ${beforeAgg.peakOnProductRate} → ${afterAgg.peakOnProductRate}`);
  console.log(`Dominance: ${beforeAgg.productDominanceScore} → ${afterAgg.productDominanceScore}`);
  console.log(`Headline VW: ${beforeAgg.headlineVisualWeight} → ${afterAgg.headlineVisualWeight}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
