#!/usr/bin/env npx tsx
/**
 * Cursor Task Generator — Part 35 / CTG-001
 * Reads architecture; writes docs/cursor/Wave-*.md (never modifies source)
 */
import { join } from "node:path";
import { exportAllWaves } from "./MarkdownExporter";
import { generateTaskPlan } from "./TaskGenerator";

const OUTPUT_DIR = join(__dirname, "../../../docs/cursor");

function main(): void {
  console.log("Cursor Task Generator — Part 35");
  const plan = generateTaskPlan();
  exportAllWaves(plan, OUTPUT_DIR);
  const total = plan.waves.reduce((n, w) => n + w.tasks.length, 0);
  console.log(`Generated ${total} tasks across ${plan.waves.length} waves`);
}

if (require.main === module) {
  main();
}

export { main as generateTasks };
