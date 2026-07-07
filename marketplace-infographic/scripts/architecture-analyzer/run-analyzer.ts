#!/usr/bin/env npx tsx
/**
 * Architecture Analyzer — Part 36 / ANA-001
 * Read-only: generates docs/architecture/reports/
 */
import { join } from "node:path";
import { runAnalyzer } from "./Analyzer";

const OUTPUT_DIR = join(__dirname, "../../../docs/architecture/reports");

function main(): void {
  console.log("Architecture Analyzer — Part 36");
  const result = runAnalyzer(OUTPUT_DIR);
  console.log(
    `Score: ${result.architectureScore}/98 | Debt: ${result.technicalDebt.length} | Reports → ${OUTPUT_DIR}`,
  );
}

if (require.main === module) {
  main();
}
