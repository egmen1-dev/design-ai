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
    daos: Record<string, string>;
  };
  pairs: BenchmarkProductPair[];
  aggregate: BenchmarkAggregateStats;
  decision: BenchmarkDecision;
};
