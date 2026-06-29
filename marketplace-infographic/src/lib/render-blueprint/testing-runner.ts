/**
 * Chapter 3.17 — Test runner (executes spec files by category)
 */
import { spawnSync } from "child_process";
import { resolve } from "path";
import {
  RELEASE_QUALITY_GATES,
  TestCategory,
  type TestCategoryId,
  type TestRunReport,
  type TestRunResult,
  type TestSuiteResult,
} from "./testing-types";
import { V18_TEST_REGISTRY, prRequiredCategories, specsForCategory } from "./testing-registry";

export class TestingArchitectureError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TestingArchitectureError";
  }
}

export function runSpecFile(
  specPath: string,
  projectRoot: string = process.cwd(),
): TestRunResult {
  const entry = V18_TEST_REGISTRY.find((e) => e.path === specPath || e.path.endsWith(specPath));
  const abs = resolve(projectRoot, specPath);
  const started = Date.now();
  const result = spawnSync("npx", ["tsx", abs], {
    cwd: projectRoot,
    encoding: "utf8",
    timeout: 120_000,
  });
  const durationMs = Date.now() - started;
  const passed = result.status === 0;

  return {
    id: entry?.id ?? specPath,
    path: specPath,
    category: entry?.category ?? TestCategory.UNIT,
    passed,
    durationMs,
    error: passed ? undefined : (result.stderr || result.stdout || `exit ${result.status}`).slice(0, 2000),
  };
}

export function runCategory(
  category: TestCategoryId,
  projectRoot: string = process.cwd(),
): TestSuiteResult {
  const specs = specsForCategory(category);
  const started = Date.now();
  const results = specs.map((s) => runSpecFile(s.path, projectRoot));
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  return {
    category,
    passed,
    failed,
    total: results.length,
    durationMs: Date.now() - started,
    results,
  };
}

export function runPullRequestSuite(projectRoot: string = process.cwd()): TestRunReport {
  return runCategories(prRequiredCategories(), projectRoot, false);
}

export function runReleaseCandidateSuite(projectRoot: string = process.cwd()): TestRunReport {
  const categories = RELEASE_QUALITY_GATES.filter((g) => g.required).flatMap((g) => g.categories);
  const unique = [...new Set(categories)];
  return runCategories(unique, projectRoot, true);
}

export function runCategories(
  categories: TestCategoryId[],
  projectRoot: string = process.cwd(),
  qualityGate: boolean,
): TestRunReport {
  const startedAt = Date.now();
  const suites: TestSuiteResult[] = [];

  for (const category of categories) {
    const specs = specsForCategory(category);
    if (specs.length === 0) {
      suites.push({
        category,
        passed: 0,
        failed: 0,
        total: 0,
        durationMs: 0,
        results: [],
      });
      continue;
    }
    suites.push(runCategory(category, projectRoot));
  }

  const passed = suites.reduce((s, u) => s + u.passed, 0);
  const failed = suites.reduce((s, u) => s + u.failed, 0);
  const finishedAt = Date.now();

  const gateFailed = qualityGate && suites.some((u) => u.failed > 0);

  return {
    startedAt,
    finishedAt,
    durationMs: finishedAt - startedAt,
    suites,
    passed,
    failed,
    total: passed + failed,
    qualityGatePassed: !gateFailed && failed === 0,
  };
}

export function assertQualityGate(report: TestRunReport): void {
  if (!report.qualityGatePassed) {
    const failedSpecs = report.suites
      .flatMap((s) => s.results)
      .filter((r) => !r.passed)
      .map((r) => r.path);
    throw new TestingArchitectureError(
      `Quality gate failed (${report.failed} failures): ${failedSpecs.join(", ")}`,
    );
  }
}

export function formatTestReport(report: TestRunReport): string {
  const lines = [
    `Design AI v18 Test Report`,
    `Total: ${report.total} | Passed: ${report.passed} | Failed: ${report.failed}`,
    `Duration: ${report.durationMs}ms | Quality Gate: ${report.qualityGatePassed ? "PASS" : "FAIL"}`,
    "",
  ];
  for (const suite of report.suites) {
    lines.push(`[${suite.category}] ${suite.passed}/${suite.total} (${suite.durationMs}ms)`);
    for (const r of suite.results) {
      lines.push(`  ${r.passed ? "✔" : "✗"} ${r.id} (${r.durationMs}ms)`);
      if (r.error) lines.push(`    ${r.error.split("\n")[0]}`);
    }
  }
  return lines.join("\n");
}
