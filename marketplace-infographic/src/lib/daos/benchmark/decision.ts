import type {
  BenchmarkAggregateStats,
  BenchmarkDecision,
  BenchmarkPairDelta,
  BenchmarkProductPair,
  BenchmarkRunMetrics,
} from "./types";

function median(values: number[]): number | undefined {
  if (!values.length) return undefined;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function average(values: number[]): number | undefined {
  if (!values.length) return undefined;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function computePairDelta(
  baseline: BenchmarkRunMetrics,
  daos: BenchmarkRunMetrics,
): BenchmarkPairDelta {
  const deltaSummaryScore =
    baseline.summaryScore != null && daos.summaryScore != null
      ? daos.summaryScore - baseline.summaryScore
      : undefined;

  const deltaFinalGateScore =
    baseline.finalGateScore != null && daos.finalGateScore != null
      ? daos.finalGateScore - baseline.finalGateScore
      : undefined;

  const deltaPromptLength =
    baseline.promptLength != null && daos.promptLength != null
      ? daos.promptLength - baseline.promptLength
      : undefined;

  return {
    deltaSummaryScore,
    deltaFinalGateScore,
    deltaPromptLength,
    deltaMeaningLoss: daos.meaningLossCount - baseline.meaningLossCount,
    deltaModulesCompiled: daos.modulesCompiled.length - baseline.modulesCompiled.length,
    deltaModulesStillIgnored:
      daos.modulesStillIgnored.length - baseline.modulesStillIgnored.length,
    backgroundHashChanged:
      Boolean(baseline.backgroundHash) &&
      Boolean(daos.backgroundHash) &&
      baseline.backgroundHash !== daos.backgroundHash,
    finalImageHashChanged:
      Boolean(baseline.finalImageHash) &&
      Boolean(daos.finalImageHash) &&
      baseline.finalImageHash !== daos.finalImageHash,
  };
}

export function computeAggregateStats(pairs: BenchmarkProductPair[]): BenchmarkAggregateStats {
  const summaryDeltas = pairs
    .map((pair) => pair.delta.deltaSummaryScore)
    .filter((value): value is number => value != null);
  const promptDeltas = pairs
    .map((pair) => pair.delta.deltaPromptLength)
    .filter((value): value is number => value != null);
  const meaningLossDeltas = pairs.map((pair) => pair.delta.deltaMeaningLoss);
  const modulesCompiledBaseline = pairs.map((pair) => pair.baseline.modulesCompiled.length);
  const modulesCompiledDaos = pairs.map((pair) => pair.daos.modulesCompiled.length);
  const modulesCompiledDelta = pairs.map((pair) => pair.delta.deltaModulesCompiled);
  const composerScoresBaseline = pairs
    .map((pair) => pair.baseline.composerQualityScore)
    .filter((value): value is number => value != null);
  const composerScoresDaos = pairs
    .map((pair) => pair.daos.composerQualityScore)
    .filter((value): value is number => value != null);
  const composerScoreDelta = pairs
    .map((pair) =>
      pair.baseline.composerQualityScore != null && pair.daos.composerQualityScore != null
        ? pair.daos.composerQualityScore - pair.baseline.composerQualityScore
        : undefined,
    )
    .filter((value): value is number => value != null);
  const productAreaBaseline = pairs
    .map((pair) => pair.baseline.productAreaRatio)
    .filter((value): value is number => value != null);
  const productAreaDaos = pairs
    .map((pair) => pair.daos.productAreaRatio)
    .filter((value): value is number => value != null);
  const compositionRiskBaseline = pairs
    .map((pair) => pair.baseline.finalCompositionRisk)
    .filter((value): value is number => value != null);
  const compositionRiskDaos = pairs
    .map((pair) => pair.daos.finalCompositionRisk)
    .filter((value): value is number => value != null);
  const overlayScoresBaseline = pairs
    .map((pair) => pair.baseline.overlayQualityScore)
    .filter((value): value is number => value != null);
  const overlayScoresDaos = pairs
    .map((pair) => pair.daos.overlayQualityScore)
    .filter((value): value is number => value != null);
  const overlayDensityBaseline = pairs
    .map((pair) => pair.baseline.overlayDensity)
    .filter((value): value is number => value != null);
  const overlayDensityDaos = pairs
    .map((pair) => pair.daos.overlayDensity)
    .filter((value): value is number => value != null);
  const pngRiskBaseline = pairs
    .map((pair) => pair.baseline.pngOverlayFeelRisk)
    .filter((value): value is number => value != null);
  const pngRiskDaos = pairs
    .map((pair) => pair.daos.pngOverlayFeelRisk)
    .filter((value): value is number => value != null);
  const productScaleBaseline = pairs
    .map((pair) => pair.baseline.productScaleScore)
    .filter((value): value is number => value != null);
  const productScaleDaos = pairs
    .map((pair) => pair.daos.productScaleScore)
    .filter((value): value is number => value != null);
  const dominanceBaseline = pairs
    .map((pair) => pair.baseline.productDominanceScore)
    .filter((value): value is number => value != null);
  const dominanceDaos = pairs
    .map((pair) => pair.daos.productDominanceScore)
    .filter((value): value is number => value != null);
  const emptySpaceBaseline = pairs
    .map((pair) => pair.baseline.emptySpaceEstimate)
    .filter((value): value is number => value != null);
  const emptySpaceDaos = pairs
    .map((pair) => pair.daos.emptySpaceEstimate)
    .filter((value): value is number => value != null);
  const sceneFillBaseline = pairs
    .map((pair) => pair.baseline.sceneFillRisk)
    .filter((value): value is number => value != null);
  const sceneFillDaos = pairs
    .map((pair) => pair.daos.sceneFillRisk)
    .filter((value): value is number => value != null);
  const compositeAreaBaseline = pairs
    .map((pair) => pair.baseline.compositeProductAreaRatio)
    .filter((value): value is number => value != null);
  const compositeAreaDaos = pairs
    .map((pair) => pair.daos.compositeProductAreaRatio)
    .filter((value): value is number => value != null);
  const placementFoundBaseline = pairs.filter((pair) => pair.baseline.compositePlacementFound).length;
  const placementFoundDaos = pairs.filter((pair) => pair.daos.compositePlacementFound).length;
  const extractCorrectedBaseline = pairs.filter((pair) => pair.baseline.extractAreaCorrected).length;
  const extractCorrectedDaos = pairs.filter((pair) => pair.daos.extractAreaCorrected).length;
  const law003AfterBaseline = pairs.filter((pair) => pair.baseline.law003After).length;
  const law003AfterDaos = pairs.filter((pair) => pair.daos.law003After).length;
  const law003StaleBaseline = pairs.filter((pair) => pair.baseline.law003StaleMetricDetected).length;
  const law003StaleDaos = pairs.filter((pair) => pair.daos.law003StaleMetricDetected).length;
  const successfulBaseline = pairs.filter((pair) => !pair.baseline.error).length;
  const successfulDaos = pairs.filter((pair) => !pair.daos.error).length;

  const law003BaselineCount = pairs.filter((pair) => pair.baseline.law003WhitespaceViolation).length;
  const law003DaosCount = pairs.filter((pair) => pair.daos.law003WhitespaceViolation).length;
  const law014BaselineCount = pairs.filter((pair) => pair.baseline.law014ContrastViolation).length;
  const law014DaosCount = pairs.filter((pair) => pair.daos.law014ContrastViolation).length;
  const overlayBaselineCount = overlayScoresBaseline.length || pairs.length;
  const overlayDaosCount = overlayScoresDaos.length || pairs.length;

  const averageSummaryDelta = average(summaryDeltas);
  const averageMeaningLossDelta = average(meaningLossDeltas);
  const averageModulesCompiledBaseline = average(modulesCompiledBaseline);
  const averageModulesCompiledDaos = average(modulesCompiledDaos);
  const averageModulesCompiledDelta = average(modulesCompiledDelta);

  const meaningLossImproved =
    averageMeaningLossDelta != null ? averageMeaningLossDelta < 0 : false;
  const modulesCompiledImproved =
    averageModulesCompiledDelta != null ? averageModulesCompiledDelta > 0 : false;

  return {
    count: pairs.length,
    averageSummaryDelta,
    medianSummaryDelta: median(summaryDeltas),
    bestSummaryDelta: summaryDeltas.length ? Math.max(...summaryDeltas) : undefined,
    worstSummaryDelta: summaryDeltas.length ? Math.min(...summaryDeltas) : undefined,
    averagePromptDelta: average(promptDeltas),
    averageMeaningLossDelta,
    averageModulesCompiledBaseline,
    averageModulesCompiledDaos,
    averageModulesCompiledDelta,
    averageComposerQualityScoreBaseline: average(composerScoresBaseline),
    averageComposerQualityScoreDaos: average(composerScoresDaos),
    averageComposerQualityDelta: average(composerScoreDelta),
    averageProductAreaRatioBaseline: average(productAreaBaseline),
    averageProductAreaRatioDaos: average(productAreaDaos),
    averageFinalCompositionRiskBaseline: average(compositionRiskBaseline),
    averageFinalCompositionRiskDaos: average(compositionRiskDaos),
    averageOverlayQualityScoreBaseline: average(overlayScoresBaseline),
    averageOverlayQualityScoreDaos: average(overlayScoresDaos),
    averageOverlayDensityBaseline: average(overlayDensityBaseline),
    averageOverlayDensityDaos: average(overlayDensityDaos),
    averagePngOverlayFeelRiskBaseline: average(pngRiskBaseline),
    averagePngOverlayFeelRiskDaos: average(pngRiskDaos),
    law003ViolationRateBaseline:
      overlayBaselineCount > 0 ? law003BaselineCount / overlayBaselineCount : undefined,
    law003ViolationRateDaos:
      overlayDaosCount > 0 ? law003DaosCount / overlayDaosCount : undefined,
    law014ViolationRateBaseline:
      overlayBaselineCount > 0 ? law014BaselineCount / overlayBaselineCount : undefined,
    law014ViolationRateDaos:
      overlayDaosCount > 0 ? law014DaosCount / overlayDaosCount : undefined,
    averageProductScaleScoreBaseline: average(productScaleBaseline),
    averageProductScaleScoreDaos: average(productScaleDaos),
    averageProductDominanceScoreBaseline: average(dominanceBaseline),
    averageProductDominanceScoreDaos: average(dominanceDaos),
    averageEmptySpaceEstimateBaseline: average(emptySpaceBaseline),
    averageEmptySpaceEstimateDaos: average(emptySpaceDaos),
    averageSceneFillRiskBaseline: average(sceneFillBaseline),
    averageSceneFillRiskDaos: average(sceneFillDaos),
    averageCompositeProductAreaRatioBaseline: average(compositeAreaBaseline),
    averageCompositeProductAreaRatioDaos: average(compositeAreaDaos),
    compositePlacementFoundRateBaseline:
      successfulBaseline > 0 ? placementFoundBaseline / successfulBaseline : undefined,
    compositePlacementFoundRateDaos:
      successfulDaos > 0 ? placementFoundDaos / successfulDaos : undefined,
    extractAreaCorrectedRateBaseline:
      successfulBaseline > 0 ? extractCorrectedBaseline / successfulBaseline : undefined,
    extractAreaCorrectedRateDaos:
      successfulDaos > 0 ? extractCorrectedDaos / successfulDaos : undefined,
    law003AfterViolationRateBaseline:
      successfulBaseline > 0 ? law003AfterBaseline / successfulBaseline : undefined,
    law003AfterViolationRateDaos:
      successfulDaos > 0 ? law003AfterDaos / successfulDaos : undefined,
    law003StaleMetricRateBaseline:
      successfulBaseline > 0 ? law003StaleBaseline / successfulBaseline : undefined,
    law003StaleMetricRateDaos:
      successfulDaos > 0 ? law003StaleDaos / successfulDaos : undefined,
    meaningLossImproved,
    modulesCompiledImproved,
  };
}

export function evaluateBenchmarkDecision(
  aggregate: BenchmarkAggregateStats,
  pairs: BenchmarkProductPair[],
): BenchmarkDecision {
  const criteria = {
    averageSummaryDeltaGte3:
      aggregate.averageSummaryDelta != null && aggregate.averageSummaryDelta >= 3,
    meaningLossImproved: aggregate.meaningLossImproved,
    modulesCompiledImproved: aggregate.modulesCompiledImproved,
  };

  const success =
    criteria.averageSummaryDeltaGte3 ||
    criteria.meaningLossImproved ||
    criteria.modulesCompiledImproved;

  const bottlenecks: string[] = [];

  if (!criteria.averageSummaryDeltaGte3) {
    bottlenecks.push(
      `average summary delta ${aggregate.averageSummaryDelta?.toFixed(1) ?? "n/a"} < +3`,
    );
  }
  if (!criteria.meaningLossImproved) {
    bottlenecks.push(
      `meaning-loss not improved (avg delta ${aggregate.averageMeaningLossDelta?.toFixed(1) ?? "n/a"})`,
    );
  }
  if (!criteria.modulesCompiledImproved) {
    bottlenecks.push(
      `modulesCompiled not improved (avg delta ${aggregate.averageModulesCompiledDelta?.toFixed(1) ?? "n/a"})`,
    );
  }

  const failedPairs = pairs.filter(
    (pair) => (pair.delta.deltaSummaryScore ?? 0) < 0 && pair.daos.error,
  );
  if (failedPairs.length) {
    bottlenecks.push(`${failedPairs.length} product pair(s) had DAOS run errors`);
  }

  const ctrStillIgnored = pairs.filter((pair) =>
    pair.daos.modulesStillIgnored.includes("ctr_wording"),
  ).length;
  if (ctrStillIgnored > 0) {
    bottlenecks.push(`ctr_wording still ignored on ${ctrStillIgnored} product(s)`);
  }

  return {
    status: success ? "SUCCESS" : "STOP",
    recommendation: success
      ? "Continue to Phase 2 — run npm run daos:benchmark:30 when ready."
      : "Do NOT benchmark 30 products. Address bottlenecks before scaling.",
    bottlenecks,
    criteria,
  };
}
