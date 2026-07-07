#!/usr/bin/env npx tsx
import { join } from "node:path";
import { writeFileSync } from "node:fs";
import { exportPlanIndex } from "./MarkdownExporter";
import { generateTaskPlan } from "./TaskGenerator";

const plan = generateTaskPlan();
const out = join(__dirname, "../../../docs/cursor/PLAN.md");
writeFileSync(out, exportPlanIndex(plan), "utf8");
console.log(`Wrote ${out}`);
