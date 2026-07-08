export type BenchmarkProductImage = {
  background: string;
  accent: string;
  shape: string;
};

export type BenchmarkProduct = {
  id: string;
  name: string;
  category: string;
  complexity: "low" | "medium" | "high";
  prompt: string;
  image: BenchmarkProductImage;
};

export type BenchmarkCatalog = {
  phase: number;
  description: string;
  sharedSeed: string;
  products: BenchmarkProduct[];
};

export type BenchmarkArm = "baseline" | "daos";

export type BenchmarkEnvProfile = {
  name: BenchmarkArm;
  label: string;
  env: Record<string, string>;
};

export type BenchmarkRunMetrics = {
  arm: BenchmarkArm;
  productId: string;
  productName: string;
  imageId?: string;
  projectId?: string;
  runId?: string;
  summaryScore?: number;
  finalGateStatus?: string;
  finalGateScore?: number;
  meaningLossCount: number;
  meaningLossCodes: string[];
  modulesIgnored: string[];
  modulesCompiled: string[];
  modulesStillIgnored: string[];
  promptLength?: number;
  provider?: string;
  model?: string;
  latencyMs?: number;
  generationTimeMs: number;
  backgroundHash?: string;
  finalImageHash?: string;
  fallbackUsed?: boolean;
  error?: string;
  composerQualityScore?: number;
  productAreaRatio?: number;
  finalCompositionRisk?: number;
  overlayQualityScore?: number;
  overlayDensity?: number;
  pngOverlayFeelRisk?: number;
  law003WhitespaceViolation?: boolean;
  law014ContrastViolation?: boolean;
  productScaleScore?: number;
  productDominanceScore?: number;
  emptySpaceEstimate?: number;
  sceneFillRisk?: number;
  compositeProductAreaRatio?: number;
  compositeProductWidthRatio?: number;
  compositeProductHeightRatio?: number;
  extractAreaCorrected?: boolean;
  compositePlacementFound?: boolean;
  law003Before?: boolean;
  law003After?: boolean;
  law003StaleMetricDetected?: boolean;
  law003GovernanceSource?: string;
  law003SoftResolved?: boolean;
  overlayGateStatus?: string;
  overlayGateScore?: number;
  targetUnreachable?: boolean;
  aspectRatioPlacementPatchApplied?: boolean;
  fitStrategy?: string;
};

export type BenchmarkPairDelta = {
  deltaSummaryScore?: number;
  deltaFinalGateScore?: number;
  deltaPromptLength?: number;
  deltaMeaningLoss: number;
  deltaModulesCompiled: number;
  deltaModulesStillIgnored: number;
  backgroundHashChanged: boolean;
  finalImageHashChanged: boolean;
};

export type BenchmarkProductPair = {
  product: BenchmarkProduct;
  seed: string;
  baseline: BenchmarkRunMetrics;
  daos: BenchmarkRunMetrics;
  delta: BenchmarkPairDelta;
};

export type BenchmarkAggregateStats = {
  count: number;
  averageSummaryDelta?: number;
  medianSummaryDelta?: number;
  bestSummaryDelta?: number;
  worstSummaryDelta?: number;
  averagePromptDelta?: number;
  averageMeaningLossDelta?: number;
  averageModulesCompiledBaseline?: number;
  averageModulesCompiledDaos?: number;
  averageModulesCompiledDelta?: number;
  averageComposerQualityScoreBaseline?: number;
  averageComposerQualityScoreDaos?: number;
  averageComposerQualityDelta?: number;
  averageProductAreaRatioBaseline?: number;
  averageProductAreaRatioDaos?: number;
  averageFinalCompositionRiskBaseline?: number;
  averageFinalCompositionRiskDaos?: number;
  averageOverlayQualityScoreBaseline?: number;
  averageOverlayQualityScoreDaos?: number;
  averageOverlayDensityBaseline?: number;
  averageOverlayDensityDaos?: number;
  averagePngOverlayFeelRiskBaseline?: number;
  averagePngOverlayFeelRiskDaos?: number;
  law003ViolationRateBaseline?: number;
  law003ViolationRateDaos?: number;
  law014ViolationRateBaseline?: number;
  law014ViolationRateDaos?: number;
  averageProductScaleScoreBaseline?: number;
  averageProductScaleScoreDaos?: number;
  averageProductDominanceScoreBaseline?: number;
  averageProductDominanceScoreDaos?: number;
  averageEmptySpaceEstimateBaseline?: number;
  averageEmptySpaceEstimateDaos?: number;
  averageSceneFillRiskBaseline?: number;
  averageSceneFillRiskDaos?: number;
  averageCompositeProductAreaRatioBaseline?: number;
  averageCompositeProductAreaRatioDaos?: number;
  compositePlacementFoundRateBaseline?: number;
  compositePlacementFoundRateDaos?: number;
  extractAreaCorrectedRateBaseline?: number;
  extractAreaCorrectedRateDaos?: number;
  law003AfterViolationRateBaseline?: number;
  law003AfterViolationRateDaos?: number;
  law003StaleMetricRateBaseline?: number;
  law003StaleMetricRateDaos?: number;
  law003SoftResolvedRateBaseline?: number;
  law003SoftResolvedRateDaos?: number;
  averageOverlayGateScoreBaseline?: number;
  averageOverlayGateScoreDaos?: number;
  overlayGatePassRateBaseline?: number;
  overlayGatePassRateDaos?: number;
  targetUnreachableRateBaseline?: number;
  targetUnreachableRateDaos?: number;
  meaningLossImproved: boolean;
  modulesCompiledImproved: boolean;
};

export type BenchmarkDecision = {
  status: "SUCCESS" | "STOP";
  recommendation: string;
  bottlenecks: string[];
  criteria: {
    averageSummaryDeltaGte3: boolean;
    meaningLossImproved: boolean;
    modulesCompiledImproved: boolean;
    law003SoftImproved: boolean;
  };
};

export type BenchmarkResults = {
  version: 1;
  phase: number;
  createdAt: string;
  catalogDescription: string;
  sharedRenderSettings: {
    provider: string;
    model: string;
    renderEngine: string;
  };
  envProfiles: {
    baseline: Record<string, string>;
    daosNoPatch?: Record<string, string>;
    daos: Record<string, string>;
  };
  pairs: BenchmarkProductPair[];
  aggregate: BenchmarkAggregateStats;
  decision: BenchmarkDecision;
};
