/**
 * Chapter 3.17 — Testing Architecture types
 */

export const TestCategory = {
  UNIT: "unit",
  BLUEPRINT: "blueprint",
  AGENT: "agent",
  INTEGRATION: "integration",
  PIPELINE: "pipeline",
  VISION: "vision",
  PERFORMANCE: "performance",
  REGRESSION: "regression",
} as const;

export type TestCategoryId = (typeof TestCategory)[keyof typeof TestCategory];

/** Pyramid order — higher = fewer tests, higher value */
export const TEST_PYRAMID_ORDER: TestCategoryId[] = [
  TestCategory.UNIT,
  TestCategory.BLUEPRINT,
  TestCategory.AGENT,
  TestCategory.INTEGRATION,
  TestCategory.PIPELINE,
  TestCategory.VISION,
  TestCategory.PERFORMANCE,
  TestCategory.REGRESSION,
];

export type TestSpecEntry = {
  id: string;
  path: string;
  category: TestCategoryId;
  chapter?: string;
  description: string;
  usesLlm: boolean;
};

export type TestRunResult = {
  id: string;
  path: string;
  category: TestCategoryId;
  passed: boolean;
  durationMs: number;
  error?: string;
};

export type TestSuiteResult = {
  category: TestCategoryId;
  passed: number;
  failed: number;
  total: number;
  durationMs: number;
  results: TestRunResult[];
};

export type TestRunReport = {
  startedAt: number;
  finishedAt: number;
  durationMs: number;
  suites: TestSuiteResult[];
  passed: number;
  failed: number;
  total: number;
  qualityGatePassed: boolean;
};

export type CoverageTarget = {
  component: string;
  minimumPercent: number;
};

export const COVERAGE_TARGETS: CoverageTarget[] = [
  { component: "core", minimumPercent: 95 },
  { component: "lifecycle", minimumPercent: 95 },
  { component: "mutation", minimumPercent: 95 },
  { component: "validation", minimumPercent: 95 },
  { component: "registry", minimumPercent: 95 },
  { component: "adapters", minimumPercent: 90 },
  { component: "agents", minimumPercent: 85 },
  { component: "ui", minimumPercent: 70 },
];

export type QualityGate = {
  id: string;
  name: string;
  categories: TestCategoryId[];
  required: boolean;
};

export const RELEASE_QUALITY_GATES: QualityGate[] = [
  { id: "unit", name: "Unit Tests", categories: [TestCategory.UNIT], required: true },
  { id: "blueprint", name: "Blueprint Tests", categories: [TestCategory.BLUEPRINT], required: true },
  { id: "agent", name: "Agent Tests", categories: [TestCategory.AGENT], required: true },
  { id: "integration", name: "Integration Tests", categories: [TestCategory.INTEGRATION], required: true },
  { id: "pipeline", name: "Pipeline Tests", categories: [TestCategory.PIPELINE], required: true },
  { id: "performance", name: "Performance Benchmark", categories: [TestCategory.PERFORMANCE], required: true },
  { id: "regression", name: "Regression Suite", categories: [TestCategory.REGRESSION], required: true },
  { id: "vision", name: "Vision Benchmark", categories: [TestCategory.VISION], required: true },
];

export type GoldenProduct = {
  id: string;
  name: string;
  category: string;
  seed: number;
};

export type RegressionBaseline = {
  productId: string;
  blueprintHash: string;
  designScore: number;
  visionScore: number;
  retryCount: number;
  constraintRevision: number;
};

export type RegressionComparison = {
  productId: string;
  passed: boolean;
  hashMatch: boolean;
  designScoreDelta: number;
  visionScoreDelta: number;
  retryCountDelta: number;
  issues: string[];
};

export type SnapshotTestExpectation = {
  stage: string;
  revision: number;
  sections: string[];
  validated: boolean;
};

export type ChaosScenario = {
  id: string;
  name: string;
  inject: "provider_failure" | "network_loss" | "snapshot_corrupt" | "composite_fail" | "vision_fail";
  expectRecovery: boolean;
};

export type DeterministicTestContext = {
  seed: number;
  blueprintHash: string;
  agentVersion: string;
  mockProvider: string;
};

export type ContractTestResult = {
  contract: string;
  passed: boolean;
  violations: string[];
};
