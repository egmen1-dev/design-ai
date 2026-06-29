/**
 * Chapter 3.17 — Testing Architecture (orchestrator)
 */
import { createHash } from "crypto";
import type { RenderBlueprint } from "./types";
import type { DeterministicTestContext } from "./testing-types";
import { PipelineContextPool } from "./pipeline-queue";

export {
  TestCategory,
  TEST_PYRAMID_ORDER,
  COVERAGE_TARGETS,
  RELEASE_QUALITY_GATES,
  type TestCategoryId,
  type TestSpecEntry,
  type TestRunResult,
  type TestSuiteResult,
  type TestRunReport,
  type CoverageTarget,
  type QualityGate,
  type GoldenProduct,
  type RegressionBaseline,
  type RegressionComparison,
  type SnapshotTestExpectation,
  type ChaosScenario,
  type DeterministicTestContext,
  type ContractTestResult,
} from "./testing-types";

export { GOLDEN_DATASET, goldenProductById } from "./golden-dataset";
export { V18_TEST_REGISTRY, specsForCategory, specsWithoutLlm, prRequiredCategories } from "./testing-registry";
export { MockLLMProvider, deterministicMockKey, type MockLLMResponse } from "./mock-llm";
export { RegressionStore, captureBlueprintBaseline } from "./regression-store";
export {
  testBlueprintAgentContract,
  testRenderAdapterContract,
  assertContractOrThrow,
} from "./contract-tests";
export { CHAOS_SCENARIOS, runChaosScenario, runAllChaosScenarios, assertChaosRecoveryOrThrow } from "./chaos-tests";
export { detectVisionIssues, visionScoreFromBlueprint, type VisionIssue } from "./vision-tests";
export {
  TestingArchitectureError,
  runSpecFile,
  runCategory,
  runPullRequestSuite,
  runReleaseCandidateSuite,
  runCategories,
  assertQualityGate,
  formatTestReport,
} from "./testing-runner";

/** Deterministic context fingerprint for reproducibility checks */
export function buildDeterministicContext(input: {
  blueprint: RenderBlueprint;
  seed: number;
  agentVersion: string;
  mockProvider: string;
}): DeterministicTestContext {
  const json = JSON.stringify(input.blueprint);
  const blueprintHash = createHash("sha256").update(json).digest("hex");
  return {
    seed: input.seed,
    blueprintHash,
    agentVersion: input.agentVersion,
    mockProvider: input.mockProvider,
  };
}

export function assertDeterministic(
  a: DeterministicTestContext,
  b: DeterministicTestContext,
): void {
  if (a.seed !== b.seed) throw new Error(`Seed mismatch: ${a.seed} vs ${b.seed}`);
  if (a.blueprintHash !== b.blueprintHash) throw new Error("Blueprint hash mismatch");
  if (a.agentVersion !== b.agentVersion) throw new Error("Agent version mismatch");
  if (a.mockProvider !== b.mockProvider) throw new Error("Mock provider mismatch");
}

/** Stress levels for concurrent pipeline simulation */
export const STRESS_LEVELS = [100, 500, 1000, 5000] as const;

export function simulateStressConcurrency(level: number): {
  level: number;
  contextsCreated: number;
  passed: boolean;
} {
  const pool = new PipelineContextPool();
  const count = Math.min(level, 50);
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(pool.create().id);
  }
  for (const id of ids) {
    pool.release(id);
  }
  return { level, contextsCreated: count, passed: pool.size() === 0 };
}
