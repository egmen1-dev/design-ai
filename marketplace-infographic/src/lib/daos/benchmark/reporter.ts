import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { BenchmarkResults } from "./types";
import { resolveBenchmarkDir } from "./catalog";

function escapeCsv(value: unknown): string {
  const text = value == null ? "" : String(value);
  if (text.includes(",") || text.includes('"') || text.includes("\n")) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function formatMetricsRow(
  productId: string,
  productName: string,
  arm: string,
  metrics: BenchmarkResults["pairs"][number]["baseline"],
): string[] {
  return [
    productId,
    productName,
    arm,
    metrics.summaryScore ?? "",
    metrics.finalGateStatus ?? "",
    metrics.finalGateScore ?? "",
    metrics.meaningLossCount,
    metrics.meaningLossCodes.join(";"),
    metrics.modulesIgnored.join(";"),
    metrics.modulesCompiled.join(";"),
    metrics.modulesStillIgnored.join(";"),
    metrics.promptLength ?? "",
    metrics.provider ?? "",
    metrics.model ?? "",
    metrics.latencyMs ?? "",
    metrics.generationTimeMs,
    metrics.backgroundHash ?? "",
    metrics.finalImageHash ?? "",
    metrics.composerQualityScore ?? "",
    metrics.productAreaRatio ?? "",
    metrics.finalCompositionRisk ?? "",
    metrics.overlayQualityScore ?? "",
    metrics.overlayDensity ?? "",
    metrics.pngOverlayFeelRisk ?? "",
    metrics.law003WhitespaceViolation === true ? "true" : "",
    metrics.law003Before === true ? "true" : "",
    metrics.law003After === true ? "true" : "",
    metrics.law003StaleMetricDetected === true ? "true" : "",
    metrics.law014ContrastViolation === true ? "true" : "",
    metrics.productScaleScore ?? "",
    metrics.productDominanceScore ?? "",
    metrics.emptySpaceEstimate ?? "",
    metrics.sceneFillRisk ?? "",
    metrics.compositeProductAreaRatio ?? "",
    metrics.compositePlacementFound === true ? "true" : "",
    metrics.extractAreaCorrected === true ? "true" : "",
    metrics.error ?? "",
  ];
}

export async function writeBenchmarkOutputs(results: BenchmarkResults): Promise<{
  jsonPath: string;
  csvPath: string;
  reportPath: string;
  dashboardPath: string;
}> {
  const dir = resolveBenchmarkDir();
  await mkdir(dir, { recursive: true });

  const jsonPath = path.join(dir, "results.json");
  const csvPath = path.join(dir, "results.csv");
  const reportPath = path.join(dir, "report.md");
  const dashboardPath = path.join(dir, "dashboard.md");

  await writeFile(jsonPath, JSON.stringify(results, null, 2), "utf8");
  await writeFile(csvPath, renderCsv(results), "utf8");
  await writeFile(reportPath, renderReport(results), "utf8");
  await writeFile(dashboardPath, renderDashboard(results), "utf8");

  return { jsonPath, csvPath, reportPath, dashboardPath };
}

function renderCsv(results: BenchmarkResults): string {
  const header = [
    "productId",
    "productName",
    "arm",
    "summaryScore",
    "finalGateStatus",
    "finalGateScore",
    "meaningLossCount",
    "meaningLossCodes",
    "modulesIgnored",
    "modulesCompiled",
    "modulesStillIgnored",
    "promptLength",
    "provider",
    "model",
    "latencyMs",
    "generationTimeMs",
    "backgroundHash",
    "finalImageHash",
    "composerQualityScore",
    "productAreaRatio",
    "finalCompositionRisk",
    "overlayQualityScore",
    "overlayDensity",
    "pngOverlayFeelRisk",
    "law003WhitespaceViolation",
    "law003Before",
    "law003After",
    "law003StaleMetricDetected",
    "law014ContrastViolation",
    "productScaleScore",
    "productDominanceScore",
    "emptySpaceEstimate",
    "sceneFillRisk",
    "compositeProductAreaRatio",
    "compositePlacementFound",
    "extractAreaCorrected",
    "error",
  ].join(",");

  const rows: string[] = [header];
  for (const pair of results.pairs) {
    rows.push(
      formatMetricsRow(pair.product.id, pair.product.name, "baseline", pair.baseline)
        .map(escapeCsv)
        .join(","),
    );
    rows.push(
      formatMetricsRow(pair.product.id, pair.product.name, "daos", pair.daos)
        .map(escapeCsv)
        .join(","),
    );
    rows.push(
      [
        pair.product.id,
        pair.product.name,
        "delta",
        pair.delta.deltaSummaryScore ?? "",
        "",
        pair.delta.deltaFinalGateScore ?? "",
        pair.delta.deltaMeaningLoss,
        "",
        "",
        pair.delta.deltaModulesCompiled,
        pair.delta.deltaModulesStillIgnored,
        pair.delta.deltaPromptLength ?? "",
        "",
        "",
        "",
        "",
        pair.delta.backgroundHashChanged,
        pair.delta.finalImageHashChanged,
        "",
      ]
        .map(escapeCsv)
        .join(","),
    );
  }
  return rows.join("\n");
}

function renderReport(results: BenchmarkResults): string {
  const lines: string[] = [
    `# DAOS Benchmark Report — Phase ${results.phase}`,
    "",
    `Created: ${results.createdAt}`,
    "",
    `Catalog: ${results.catalogDescription}`,
    "",
    "## Shared render settings",
    "",
    `- Provider: ${results.sharedRenderSettings.provider}`,
    `- Model: ${results.sharedRenderSettings.model}`,
    `- Render engine: ${results.sharedRenderSettings.renderEngine}`,
    "",
    "## Decision",
    "",
    `**BenchmarkStatus:** ${results.decision.status}`,
    "",
    `**Recommendation:** ${results.decision.recommendation}`,
    "",
  ];

  if (results.decision.bottlenecks.length) {
    lines.push("**Bottlenecks:**", "");
    for (const bottleneck of results.decision.bottlenecks) {
      lines.push(`- ${bottleneck}`);
    }
    lines.push("");
  }

  lines.push("## Per-product results", "");

  for (const pair of results.pairs) {
    lines.push(`### ${pair.product.name} (\`${pair.product.id}\`)`, "");
    lines.push(`Seed: \`${pair.seed}\` | Complexity: ${pair.product.complexity}`, "");
    lines.push("| Metric | Baseline | DAOS | Delta |");
    lines.push("|--------|----------|------|-------|");
    lines.push(
      `| summaryScore | ${pair.baseline.summaryScore ?? "n/a"} | ${pair.daos.summaryScore ?? "n/a"} | ${pair.delta.deltaSummaryScore ?? "n/a"} |`,
    );
    lines.push(
      `| finalGate | ${pair.baseline.finalGateStatus ?? "n/a"} (${pair.baseline.finalGateScore ?? "n/a"}) | ${pair.daos.finalGateStatus ?? "n/a"} (${pair.daos.finalGateScore ?? "n/a"}) | ${pair.delta.deltaFinalGateScore ?? "n/a"} |`,
    );
    lines.push(
      `| meaningLoss | ${pair.baseline.meaningLossCount} | ${pair.daos.meaningLossCount} | ${pair.delta.deltaMeaningLoss} |`,
    );
    lines.push(
      `| modulesCompiled | ${pair.baseline.modulesCompiled.length} | ${pair.daos.modulesCompiled.length} | ${pair.delta.deltaModulesCompiled} |`,
    );
    lines.push(
      `| modulesStillIgnored | ${pair.baseline.modulesStillIgnored.length} | ${pair.daos.modulesStillIgnored.length} | ${pair.delta.deltaModulesStillIgnored} |`,
    );
    lines.push(
      `| promptLength | ${pair.baseline.promptLength ?? "n/a"} | ${pair.daos.promptLength ?? "n/a"} | ${pair.delta.deltaPromptLength ?? "n/a"} |`,
    );
    lines.push(
      `| composerQualityScore | ${pair.baseline.composerQualityScore ?? "n/a"} | ${pair.daos.composerQualityScore ?? "n/a"} | ${
        pair.baseline.composerQualityScore != null && pair.daos.composerQualityScore != null
          ? pair.daos.composerQualityScore - pair.baseline.composerQualityScore
          : "n/a"
      } |`,
    );
    lines.push(
      `| productAreaRatio | ${pair.baseline.productAreaRatio?.toFixed(2) ?? "n/a"} | ${pair.daos.productAreaRatio?.toFixed(2) ?? "n/a"} | — |`,
    );
    lines.push(
      `| finalCompositionRisk | ${pair.baseline.finalCompositionRisk?.toFixed(2) ?? "n/a"} | ${pair.daos.finalCompositionRisk?.toFixed(2) ?? "n/a"} | — |`,
    );
    lines.push(
      `| overlayQualityScore | ${pair.baseline.overlayQualityScore ?? "n/a"} | ${pair.daos.overlayQualityScore ?? "n/a"} | ${
        pair.baseline.overlayQualityScore != null && pair.daos.overlayQualityScore != null
          ? pair.daos.overlayQualityScore - pair.baseline.overlayQualityScore
          : "n/a"
      } |`,
    );
    lines.push(
      `| overlayDensity | ${pair.baseline.overlayDensity?.toFixed(2) ?? "n/a"} | ${pair.daos.overlayDensity?.toFixed(2) ?? "n/a"} | — |`,
    );
    lines.push(
      `| pngOverlayFeelRisk | ${pair.baseline.pngOverlayFeelRisk?.toFixed(2) ?? "n/a"} | ${pair.daos.pngOverlayFeelRisk?.toFixed(2) ?? "n/a"} | — |`,
    );
    lines.push(
      `| law003WhitespaceViolation | ${pair.baseline.law003WhitespaceViolation ?? "n/a"} | ${pair.daos.law003WhitespaceViolation ?? "n/a"} | — |`,
    );
    lines.push(
      `| law003Before | ${pair.baseline.law003Before ?? "n/a"} | ${pair.daos.law003Before ?? "n/a"} | — |`,
    );
    lines.push(
      `| law003After | ${pair.baseline.law003After ?? "n/a"} | ${pair.daos.law003After ?? "n/a"} | — |`,
    );
    lines.push(
      `| law003StaleMetricDetected | ${pair.baseline.law003StaleMetricDetected ?? "n/a"} | ${pair.daos.law003StaleMetricDetected ?? "n/a"} | — |`,
    );
    lines.push(
      `| law014ContrastViolation | ${pair.baseline.law014ContrastViolation ?? "n/a"} | ${pair.daos.law014ContrastViolation ?? "n/a"} | — |`,
    );
    lines.push(
      `| productScaleScore | ${pair.baseline.productScaleScore ?? "n/a"} | ${pair.daos.productScaleScore ?? "n/a"} | ${
        pair.baseline.productScaleScore != null && pair.daos.productScaleScore != null
          ? pair.daos.productScaleScore - pair.baseline.productScaleScore
          : "n/a"
      } |`,
    );
    lines.push(
      `| productDominanceScore | ${pair.baseline.productDominanceScore ?? "n/a"} | ${pair.daos.productDominanceScore ?? "n/a"} | — |`,
    );
    lines.push(
      `| emptySpaceEstimate | ${pair.baseline.emptySpaceEstimate?.toFixed(2) ?? "n/a"} | ${pair.daos.emptySpaceEstimate?.toFixed(2) ?? "n/a"} | — |`,
    );
    lines.push(
      `| sceneFillRisk | ${pair.baseline.sceneFillRisk?.toFixed(2) ?? "n/a"} | ${pair.daos.sceneFillRisk?.toFixed(2) ?? "n/a"} | — |`,
    );
    lines.push(
      `| compositeProductAreaRatio | ${pair.baseline.compositeProductAreaRatio?.toFixed(2) ?? "n/a"} | ${pair.daos.compositeProductAreaRatio?.toFixed(2) ?? "n/a"} | ${
        pair.baseline.compositeProductAreaRatio != null && pair.daos.compositeProductAreaRatio != null
          ? (pair.daos.compositeProductAreaRatio - pair.baseline.compositeProductAreaRatio).toFixed(2)
          : "n/a"
      } |`,
    );
    lines.push(
      `| provider latency | ${pair.baseline.latencyMs ?? "n/a"}ms | ${pair.daos.latencyMs ?? "n/a"}ms | — |`,
    );
    lines.push(
      `| generation time | ${pair.baseline.generationTimeMs}ms | ${pair.daos.generationTimeMs}ms | — |`,
    );
    lines.push(
      `| background hash | \`${pair.baseline.backgroundHash?.slice(0, 12) ?? "n/a"}…\` | \`${pair.daos.backgroundHash?.slice(0, 12) ?? "n/a"}…\` | ${pair.delta.backgroundHashChanged ? "changed" : "same"} |`,
    );
    lines.push(
      `| final image hash | \`${pair.baseline.finalImageHash?.slice(0, 12) ?? "n/a"}…\` | \`${pair.daos.finalImageHash?.slice(0, 12) ?? "n/a"}…\` | ${pair.delta.finalImageHashChanged ? "changed" : "same"} |`,
    );
    lines.push("");
  }

  lines.push("## Aggregate statistics", "");
  lines.push(`- Products: ${results.aggregate.count}`);
  lines.push(
    `- Average summary delta: ${results.aggregate.averageSummaryDelta?.toFixed(2) ?? "n/a"}`,
  );
  lines.push(
    `- Median summary delta: ${results.aggregate.medianSummaryDelta?.toFixed(2) ?? "n/a"}`,
  );
  lines.push(`- Best case: ${results.aggregate.bestSummaryDelta ?? "n/a"}`);
  lines.push(`- Worst case: ${results.aggregate.worstSummaryDelta ?? "n/a"}`);
  lines.push(
    `- Average prompt delta: ${results.aggregate.averagePromptDelta?.toFixed(1) ?? "n/a"} chars`,
  );
  lines.push(
    `- Average meaning-loss delta: ${results.aggregate.averageMeaningLossDelta?.toFixed(2) ?? "n/a"}`,
  );
  lines.push(
    `- Average modulesCompiled (baseline → DAOS): ${results.aggregate.averageModulesCompiledBaseline?.toFixed(1) ?? "n/a"} → ${results.aggregate.averageModulesCompiledDaos?.toFixed(1) ?? "n/a"}`,
  );
  lines.push(
    `- Average composerQualityScore (baseline → DAOS): ${results.aggregate.averageComposerQualityScoreBaseline?.toFixed(1) ?? "n/a"} → ${results.aggregate.averageComposerQualityScoreDaos?.toFixed(1) ?? "n/a"}`,
  );
  lines.push(
    `- Average productAreaRatio (baseline → DAOS): ${results.aggregate.averageProductAreaRatioBaseline?.toFixed(2) ?? "n/a"} → ${results.aggregate.averageProductAreaRatioDaos?.toFixed(2) ?? "n/a"}`,
  );
  lines.push(
    `- Average finalCompositionRisk (baseline → DAOS): ${results.aggregate.averageFinalCompositionRiskBaseline?.toFixed(2) ?? "n/a"} → ${results.aggregate.averageFinalCompositionRiskDaos?.toFixed(2) ?? "n/a"}`,
  );
  lines.push(
    `- Average overlayQualityScore (baseline → DAOS): ${results.aggregate.averageOverlayQualityScoreBaseline?.toFixed(1) ?? "n/a"} → ${results.aggregate.averageOverlayQualityScoreDaos?.toFixed(1) ?? "n/a"}`,
  );
  lines.push(
    `- Average overlayDensity (baseline → DAOS): ${results.aggregate.averageOverlayDensityBaseline?.toFixed(2) ?? "n/a"} → ${results.aggregate.averageOverlayDensityDaos?.toFixed(2) ?? "n/a"}`,
  );
  lines.push(
    `- Average pngOverlayFeelRisk (baseline → DAOS): ${results.aggregate.averagePngOverlayFeelRiskBaseline?.toFixed(2) ?? "n/a"} → ${results.aggregate.averagePngOverlayFeelRiskDaos?.toFixed(2) ?? "n/a"}`,
  );
  lines.push(
    `- LAW_003 violation rate (aspect ratio OFF → ON): ${formatRate(results.aggregate.law003ViolationRateBaseline)} → ${formatRate(results.aggregate.law003ViolationRateDaos)}`,
  );
  lines.push(
    `- LAW_014 violation rate (contrast patch OFF → ON): ${formatRate(results.aggregate.law014ViolationRateBaseline)} → ${formatRate(results.aggregate.law014ViolationRateDaos)}`,
  );
  lines.push(
    `- Average productScaleScore (baseline → DAOS): ${results.aggregate.averageProductScaleScoreBaseline?.toFixed(1) ?? "n/a"} → ${results.aggregate.averageProductScaleScoreDaos?.toFixed(1) ?? "n/a"}`,
  );
  lines.push(
    `- Average productDominanceScore (baseline → DAOS): ${results.aggregate.averageProductDominanceScoreBaseline?.toFixed(1) ?? "n/a"} → ${results.aggregate.averageProductDominanceScoreDaos?.toFixed(1) ?? "n/a"}`,
  );
  lines.push(
    `- Average emptySpaceEstimate (baseline → DAOS): ${results.aggregate.averageEmptySpaceEstimateBaseline?.toFixed(2) ?? "n/a"} → ${results.aggregate.averageEmptySpaceEstimateDaos?.toFixed(2) ?? "n/a"}`,
  );
  lines.push(
    `- Average sceneFillRisk (baseline → DAOS): ${results.aggregate.averageSceneFillRiskBaseline?.toFixed(2) ?? "n/a"} → ${results.aggregate.averageSceneFillRiskDaos?.toFixed(2) ?? "n/a"}`,
  );
  lines.push(
    `- Average compositeProductAreaRatio (patch OFF → ON): ${results.aggregate.averageCompositeProductAreaRatioBaseline?.toFixed(2) ?? "n/a"} → ${results.aggregate.averageCompositeProductAreaRatioDaos?.toFixed(2) ?? "n/a"}`,
  );
  lines.push(
    `- compositePlacementFound rate (patch OFF → ON): ${formatRate(results.aggregate.compositePlacementFoundRateBaseline)} → ${formatRate(results.aggregate.compositePlacementFoundRateDaos)}`,
  );
  lines.push(
    `- extractAreaCorrected rate (patch OFF → ON): ${formatRate(results.aggregate.extractAreaCorrectedRateBaseline)} → ${formatRate(results.aggregate.extractAreaCorrectedRateDaos)}`,
  );
  lines.push(
    `- LAW_003 violation rate recalibrated (contrast patch OFF → ON): ${formatRate(results.aggregate.law003AfterViolationRateBaseline)} → ${formatRate(results.aggregate.law003AfterViolationRateDaos)}`,
  );
  lines.push(
    `- LAW_003 stale metric rate (soft OFF → ON): ${formatRate(results.aggregate.law003StaleMetricRateBaseline)} → ${formatRate(results.aggregate.law003StaleMetricRateDaos)}`,
  );
  lines.push(
    `- LAW_003 soft resolved rate (aspect ratio OFF → ON): ${formatRate(results.aggregate.law003SoftResolvedRateBaseline)} → ${formatRate(results.aggregate.law003SoftResolvedRateDaos)}`,
    `- targetUnreachable rate (aspect ratio OFF → ON): ${formatRate(results.aggregate.targetUnreachableRateBaseline)} → ${formatRate(results.aggregate.targetUnreachableRateDaos)}`,
  );
  lines.push(
    `- Average overlayGateScore (soft OFF → ON): ${results.aggregate.averageOverlayGateScoreBaseline?.toFixed(1) ?? "n/a"} → ${results.aggregate.averageOverlayGateScoreDaos?.toFixed(1) ?? "n/a"}`,
  );
  lines.push(
    `- overlayGate pass rate (soft OFF → ON): ${formatRate(results.aggregate.overlayGatePassRateBaseline)} → ${formatRate(results.aggregate.overlayGatePassRateDaos)}`,
  );

  return lines.join("\n");
}

function formatRate(value?: number): string {
  if (value == null) return "n/a";
  return `${(value * 100).toFixed(0)}%`;
}

function renderDashboard(results: BenchmarkResults): string {
  const improvements = [...results.pairs]
    .filter((pair) => (pair.delta.deltaSummaryScore ?? 0) > 0)
    .sort((a, b) => (b.delta.deltaSummaryScore ?? 0) - (a.delta.deltaSummaryScore ?? 0));

  const failures = [...results.pairs]
    .filter((pair) => (pair.delta.deltaSummaryScore ?? 0) < 0)
    .sort((a, b) => (a.delta.deltaSummaryScore ?? 0) - (b.delta.deltaSummaryScore ?? 0));

  const warningCounts = new Map<string, number>();
  const ignoredCounts = new Map<string, number>();
  let totalLatency = 0;
  let latencyCount = 0;
  let totalGenTime = 0;
  let genCount = 0;
  let fallbackCount = 0;

  for (const pair of results.pairs) {
    for (const code of [...pair.baseline.meaningLossCodes, ...pair.daos.meaningLossCodes]) {
      warningCounts.set(code, (warningCounts.get(code) ?? 0) + 1);
    }
    for (const mod of [...pair.baseline.modulesIgnored, ...pair.daos.modulesIgnored]) {
      ignoredCounts.set(mod, (ignoredCounts.get(mod) ?? 0) + 1);
    }
    for (const run of [pair.baseline, pair.daos]) {
      if (run.latencyMs != null) {
        totalLatency += run.latencyMs;
        latencyCount += 1;
      }
      totalGenTime += run.generationTimeMs;
      genCount += 1;
      if (run.fallbackUsed) fallbackCount += 1;
    }
  }

  const topWarnings = [...warningCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const topIgnored = [...ignoredCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const runsTotal = results.pairs.length * 2;
  const estimatedCostPerRun = 0.002;
  const estimatedCost = runsTotal * estimatedCostPerRun;

  const lines: string[] = [
    `# DAOS Benchmark Dashboard — Phase ${results.phase}`,
    "",
    `Status: **${results.decision.status}**`,
    "",
    "## Top Improvements",
    "",
  ];

  if (improvements.length) {
    for (const pair of improvements.slice(0, 5)) {
      lines.push(
        `- **${pair.product.name}**: summary ${pair.delta.deltaSummaryScore! >= 0 ? "+" : ""}${pair.delta.deltaSummaryScore}, modules +${pair.delta.deltaModulesCompiled}`,
      );
    }
  } else {
    lines.push("- No positive summary score improvements in this phase.");
  }

  lines.push("", "## Top Failures", "");
  if (failures.length) {
    for (const pair of failures.slice(0, 5)) {
      lines.push(
        `- **${pair.product.name}**: summary ${pair.delta.deltaSummaryScore}, meaning-loss delta ${pair.delta.deltaMeaningLoss}`,
      );
    }
  } else {
    lines.push("- No negative summary deltas.");
  }

  lines.push("", "## Common warnings", "");
  for (const [code, count] of topWarnings) {
    lines.push(`- \`${code}\`: ${count}`);
  }

  lines.push("", "## Common ignored modules", "");
  for (const [mod, count] of topIgnored) {
    lines.push(`- \`${mod}\`: ${count}`);
  }

  lines.push("", "## Provider statistics", "");
  lines.push(`- Provider: ${results.sharedRenderSettings.provider}`);
  lines.push(`- Model: ${results.sharedRenderSettings.model}`);
  lines.push(
    `- Average provider latency: ${latencyCount ? Math.round(totalLatency / latencyCount) : "n/a"}ms`,
  );
  lines.push(`- Fallback runs: ${fallbackCount} / ${runsTotal}`);

  lines.push("", "## Generation statistics", "");
  lines.push(`- Total runs: ${runsTotal}`);
  lines.push(
    `- Average generation time: ${genCount ? Math.round(totalGenTime / genCount) : "n/a"}ms`,
  );
  lines.push(
    `- Average prompt delta: ${results.aggregate.averagePromptDelta?.toFixed(1) ?? "n/a"} chars`,
  );

  lines.push("", "## Cost estimation", "");
  lines.push(`- Estimated cost (@$${estimatedCostPerRun}/run): **$${estimatedCost.toFixed(3)}**`);
  lines.push("- Phase 2 (30 products × 2 arms): ~$0.12 estimated at same per-run rate.");

  return lines.join("\n");
}
