#!/usr/bin/env npx tsx
/**
 * Cycle 6 — Marketplace Learning MVP
 * Knowledge Runtime only — no production pipeline changes.
 *
 * Learning loop:
 *   Top N WB cards → feature extraction → correlations → law validation → report
 *
 * Usage:
 *   npx tsx benchmark/marketplace-learning.ts
 *   ML_EXTRACT=1 npx tsx benchmark/marketplace-learning.ts   # live sharp extraction
 */
import fs from "node:fs";
import path from "node:path";
import {
  measureAttentionCompetition,
  pearson,
  cohortStats,
} from "./lib/attention-competition-metrics";
import { measureVisualWeightMetrics } from "./lib/visual-weight-metrics";
import {
  KNOWLEDGE_BASE_V1,
  LEARNING_CATEGORIES,
  VISUAL_WEIGHT_FEATURES,
  ATTENTION_FEATURES,
} from "./lib/knowledge-base-baseline";
import {
  validateAllLaws,
  discoverCandidateLaws,
  summarizeValidation,
  type CorrelationRow,
  type LawValidationResult,
  type CandidateLaw,
} from "./lib/law-validation";

process.chdir(path.join(__dirname, ".."));

const CYCLE1 = path.join("benchmark", "output", "quality-cycle-1");
const CYCLE2 = path.join("benchmark", "output", "quality-cycle-2");
const CYCLE4 = path.join("benchmark", "output", "quality-cycle-4");
const OUT = path.join("benchmark", "output", "market-learning");

const USE_LIVE_EXTRACT = process.env.ML_EXTRACT === "1";

type WbCardMeta = {
  source: string;
  category: string;
  categoryLabel: string;
  productId: number;
  productDominanceScore: number;
  visualWeightHero: number;
  [key: string]: unknown;
};

type FeatureRow = Record<string, number | string> & {
  source: string;
  category: string;
  categoryLabel: string;
  productId: number;
  productDominanceScore: number;
  visualWeightHero: number;
};

const ALL_FEATURES = [
  ...new Set([...VISUAL_WEIGHT_FEATURES, ...ATTENTION_FEATURES, "visualWeightHero"]),
];

function loadWbIndex(): WbCardMeta[] {
  return JSON.parse(fs.readFileSync(path.join(CYCLE1, "wb-cards-index.json"), "utf8")) as WbCardMeta[];
}

function imagePath(row: WbCardMeta): string {
  return path.join(CYCLE1, "wb-cards", row.category, `${row.productId}.png`);
}

function loadCachedFeatures(): Map<number, Partial<FeatureRow>> {
  const cycle2 = JSON.parse(
    fs.readFileSync(path.join(CYCLE2, "feature-matrix.json"), "utf8"),
  ) as Array<Record<string, unknown>>;
  const cycle4 = JSON.parse(
    fs.readFileSync(path.join(CYCLE4, "feature-matrix.json"), "utf8"),
  ) as Array<Record<string, unknown>>;

  const map = new Map<number, Partial<FeatureRow>>();
  for (const row of cycle2) {
    if (row.source !== "wildberries") continue;
    const id = Number(row.productId);
    map.set(id, { ...(map.get(id) ?? {}), ...row } as Partial<FeatureRow>);
  }
  for (const row of cycle4) {
    if (row.source !== "wildberries") continue;
    const layer = String(row.layer ?? "wb");
    if (layer !== "wb" && layer !== "final") continue;
    const id = Number(row.productId);
    map.set(id, { ...(map.get(id) ?? {}), ...row } as Partial<FeatureRow>);
  }
  return map;
}

async function extractLive(row: WbCardMeta): Promise<FeatureRow> {
  const img = imagePath(row);
  const [attention, visual] = await Promise.all([
    measureAttentionCompetition(img),
    measureVisualWeightMetrics(img),
  ]);
  return {
    ...attention,
    ...visual,
    source: "wildberries",
    category: row.category,
    categoryLabel: row.categoryLabel,
    productId: row.productId,
    productDominanceScore: row.productDominanceScore,
    visualWeightHero: row.visualWeightHero,
  };
}

async function buildFeatureMatrix(
  cards: WbCardMeta[],
): Promise<FeatureRow[]> {
  const cached = loadCachedFeatures();
  const rows: FeatureRow[] = [];

  for (const card of cards) {
    if (USE_LIVE_EXTRACT) {
      if (!fs.existsSync(imagePath(card))) continue;
      rows.push(await extractLive(card));
      continue;
    }
    const features = cached.get(card.productId);
    if (!features) continue;
    rows.push({
      ...(features as Record<string, number>),
      source: "wildberries",
      category: card.category,
      categoryLabel: card.categoryLabel,
      productId: card.productId,
      productDominanceScore: card.productDominanceScore,
      visualWeightHero: card.visualWeightHero,
    } as FeatureRow);
  }
  return rows;
}

function computeCorrelations(rows: FeatureRow[], featureKeys: string[]): CorrelationRow[] {
  const dominance = rows.map((r) => r.productDominanceScore);
  return featureKeys
    .map((feature) => {
      const vals = rows.map((r) => Number(r[feature] ?? 0));
      const r = pearson(vals, dominance);
      const absR = Math.abs(r);
      const st = cohortStats(vals);
      return {
        feature,
        correlation: Number(r.toFixed(3)),
        absCorrelation: Number(absR.toFixed(3)),
        n: rows.length,
        wbMean: st.mean,
        wbMedian: st.median,
      };
    })
    .sort((a, b) => b.absCorrelation - a.absCorrelation);
}

function categoryCards(index: WbCardMeta[], categoryId: string, topN: number): WbCardMeta[] {
  return index
    .filter((c) => c.category === categoryId)
    .slice(0, topN);
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function statusClass(status: string): string {
  if (status.includes("Contradict") || status.includes("Review Required")) return "bad";
  if (status.includes("Decreased")) return "warn";
  if (status.includes("Increased")) return "good";
  return "ok";
}

function renderHtml(payload: {
  timestamp: string;
  mode: string;
  cardCount: number;
  correlations: CorrelationRow[];
  lawResults: LawValidationResult[];
  candidates: CandidateLaw[];
  categorySnapshots: Array<{
    category: string;
    label: string;
    n: number;
    topDriver: string;
    topR: number;
    dominanceMean: number;
  }>;
  summary: ReturnType<typeof summarizeValidation>;
}): string {
  const lawRows = payload.lawResults
    .map(
      (l) => `<tr>
        <td><code>${escapeHtml(l.lawId)}</code></td>
        <td>${escapeHtml(l.lawName)}</td>
        <td>${escapeHtml(l.productionStatus)}</td>
        <td>${l.baselineCorrelation ?? "—"}</td>
        <td>${l.currentCorrelation ?? "—"}</td>
        <td>${l.deltaCorrelation ?? "—"}</td>
        <td class="${statusClass(l.validationStatus)}">${escapeHtml(l.validationStatus)}</td>
        <td>${escapeHtml(l.finding)}</td>
        <td>${escapeHtml(l.rationale)}</td>
      </tr>`,
    )
    .join("");

  const corrRows = payload.correlations
    .slice(0, 15)
    .map(
      (c) => `<tr>
        <td><code>${escapeHtml(c.feature)}</code></td>
        <td>${c.correlation}</td>
        <td>${c.absCorrelation}</td>
        <td>${c.n}</td>
        <td>${c.wbMean}</td>
      </tr>`,
    )
    .join("");

  const candidateRows =
    payload.candidates.length === 0
      ? `<tr><td colspan="5">No new Candidate Laws above threshold (|r|≥0.28, n≥30)</td></tr>`
      : payload.candidates
          .map(
            (c) => `<tr>
            <td><code>${escapeHtml(c.feature)}</code></td>
            <td>${c.correlation}</td>
            <td>${c.direction}</td>
            <td>${c.n}</td>
            <td>${escapeHtml(c.rationale)}</td>
          </tr>`,
          )
          .join("");

  const catRows = payload.categorySnapshots
    .map(
      (c) => `<tr>
        <td>${escapeHtml(c.label)}</td>
        <td>${c.n}</td>
        <td>${c.dominanceMean}</td>
        <td><code>${escapeHtml(c.topDriver)}</code></td>
        <td>${c.topR}</td>
      </tr>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <title>DAOS Marketplace Learning — Knowledge Update Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 24px; background: #0f172a; color: #e2e8f0; }
    h1, h2 { color: #f8fafc; }
    .meta { color: #94a3b8; margin-bottom: 24px; }
    .cards { display: flex; gap: 16px; flex-wrap: wrap; margin: 16px 0; }
    .card { background: #1e293b; padding: 16px 20px; border-radius: 8px; min-width: 140px; }
    .card strong { display: block; font-size: 1.6rem; color: #38bdf8; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 28px; font-size: 0.9rem; }
    th, td { border: 1px solid #334155; padding: 8px 10px; text-align: left; vertical-align: top; }
    th { background: #1e293b; }
    .good { color: #4ade80; }
    .warn { color: #fbbf24; }
    .bad { color: #f87171; }
    .ok { color: #94a3b8; }
    code { background: #334155; padding: 2px 6px; border-radius: 4px; }
  </style>
</head>
<body>
  <h1>DAOS Marketplace Learning MVP</h1>
  <p class="meta">Cycle 6 · Knowledge Runtime · ${escapeHtml(payload.timestamp)} · Mode: ${escapeHtml(payload.mode)} · Cards: ${payload.cardCount}</p>

  <div class="cards">
    <div class="card"><strong>${payload.summary.stillProven}</strong>Still Proven / Likely</div>
    <div class="card"><strong>${payload.summary.confidenceIncreased}</strong>Confidence Increased</div>
    <div class="card"><strong>${payload.summary.confidenceDecreased}</strong>Confidence Decreased</div>
    <div class="card"><strong>${payload.summary.contradicted}</strong>Contradicted / Review</div>
    <div class="card"><strong>${payload.candidates.length}</strong>Candidate Laws</div>
  </div>

  <h2>Law Validation</h2>
  <table>
    <thead><tr>
      <th>Law</th><th>Name</th><th>Status</th><th>Baseline r</th><th>Current r</th><th>Δ</th>
      <th>Validation</th><th>Finding</th><th>Rationale</th>
    </tr></thead>
    <tbody>${lawRows}</tbody>
  </table>

  <h2>Top Correlations (Current Scan)</h2>
  <table>
    <thead><tr><th>Feature</th><th>r</th><th>|r|</th><th>n</th><th>Mean</th></tr></thead>
    <tbody>${corrRows}</tbody>
  </table>

  <h2>Candidate Laws (Not Auto-Promoted)</h2>
  <table>
    <thead><tr><th>Feature</th><th>r</th><th>Direction</th><th>n</th><th>Rationale</th></tr></thead>
    <tbody>${candidateRows}</tbody>
  </table>

  <h2>Per-Category Snapshots</h2>
  <table>
    <thead><tr><th>Category</th><th>n</th><th>Dominance Mean</th><th>Top Driver</th><th>|r|</th></tr></thead>
    <tbody>${catRows}</tbody>
  </table>

  <p class="meta">Baseline: Commercial Knowledge Base v1 · Laws: ${KNOWLEDGE_BASE_V1.length} · No production runtime changes.</p>
</body>
</html>`;
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const index = loadWbIndex();

  // Step 1: Top N per category
  const selected: WbCardMeta[] = [];
  for (const cat of LEARNING_CATEGORIES) {
    selected.push(...categoryCards(index, cat.id, cat.topN));
  }

  console.log(`Marketplace Learning: ${selected.length} WB cards across ${LEARNING_CATEGORIES.length} categories`);
  console.log(`Mode: ${USE_LIVE_EXTRACT ? "live extraction (ML_EXTRACT=1)" : "cached feature matrices"}`);

  // Step 2–3: Extract features + compute correlations
  const rows = await buildFeatureMatrix(selected);
  console.log(`Feature matrix: ${rows.length} cards`);

  const correlations = computeCorrelations(rows, ALL_FEATURES as unknown as string[]);

  // Step 4–5: Validate laws + discover candidates
  const lawResults = validateAllLaws(correlations);
  const mapped = new Set(KNOWLEDGE_BASE_V1.filter((l) => l.feature).map((l) => l.feature!));
  const candidates = discoverCandidateLaws(correlations, mapped);
  const summary = summarizeValidation(lawResults);

  // Per-category snapshots
  const categorySnapshots = [];
  for (const cat of LEARNING_CATEGORIES) {
    const catRows = rows.filter((r) => r.category === cat.id);
    if (catRows.length < 5) continue;
    const catCorr = computeCorrelations(catRows, ALL_FEATURES as unknown as string[]);
    const top = catCorr[0];
    const domMean = cohortStats(catRows.map((r) => r.productDominanceScore)).mean;
    categorySnapshots.push({
      category: cat.id,
      label: cat.label,
      n: catRows.length,
      topDriver: top?.feature ?? "—",
      topR: top?.absCorrelation ?? 0,
      dominanceMean: domMean,
    });
  }

  const timestamp = new Date().toISOString();
  const payload = {
    version: "market-learning-v1",
    sprint: "Quality Cycle 6 — Marketplace Learning MVP",
    timestamp,
    mode: USE_LIVE_EXTRACT ? "live_extract" : "cached_features",
    knowledgeBaseVersion: "1.0.0-knowledge-freeze",
    dataset: {
      categories: LEARNING_CATEGORIES.map((c) => c.id),
      cardCount: rows.length,
      source: "quality-cycle-1/wb-cards",
    },
    correlations,
    lawValidation: lawResults,
    candidateLaws: candidates,
    categorySnapshots,
    summary: {
      ...summary,
      candidateLawCount: candidates.length,
      lawsValidated: lawResults.length,
    },
  };

  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(payload, null, 2));
  fs.writeFileSync(path.join(OUT, "correlation-matrix.json"), JSON.stringify(correlations, null, 2));
  fs.writeFileSync(path.join(OUT, "law-validation.json"), JSON.stringify(lawResults, null, 2));
  fs.writeFileSync(path.join(OUT, "candidate-laws.json"), JSON.stringify(candidates, null, 2));
  fs.writeFileSync(path.join(OUT, "feature-matrix.json"), JSON.stringify(rows, null, 2));
  fs.writeFileSync(
    path.join(OUT, "report.html"),
    renderHtml({
      timestamp,
      mode: payload.mode,
      cardCount: rows.length,
      correlations,
      lawResults,
      candidates,
      categorySnapshots,
      summary,
    }),
  );

  console.log("\nLaw Validation Summary:");
  console.log(`  Still Proven/Likely: ${summary.stillProven}`);
  console.log(`  Confidence Increased: ${summary.confidenceIncreased}`);
  console.log(`  Confidence Decreased: ${summary.confidenceDecreased}`);
  console.log(`  Contradicted/Review: ${summary.contradicted}`);
  console.log(`  Candidate Laws: ${candidates.length}`);
  console.log("\nTop 5 current correlations:");
  for (const c of correlations.slice(0, 5)) {
    console.log(`  ${c.feature}: r=${c.correlation}`);
  }
  console.log(`\nWrote ${OUT}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
