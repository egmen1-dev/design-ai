#!/usr/bin/env npx tsx
/**
 * Architecture scanner — Part 34 / CRB-001
 * Reads repository only; writes docs/Code_Rewrite_Bible.md
 */
import { readFileSync, statSync, readdirSync } from "node:fs";
import { join, relative, extname } from "node:path";
import { extractExports, extractImports, resolveDependencies } from "./analyze-imports";
import { buildMigrationPlan, classifyFile } from "./classify-file";
import { computeRisk, detectViolations } from "./detect-violations";
import { writeCodeRewriteBible } from "./generate-code-rewrite-bible";
import { buildSummary } from "./map-architecture";
import { IGNORE_DIRS, SCAN_EXTENSIONS, SCAN_ROOTS } from "./rules";
import type { FileMetadata, ScanResult } from "./types";

const PROJECT_ROOT = join(__dirname, "../..");
const OUTPUT_PATH = join(PROJECT_ROOT, "../docs/Code_Rewrite_Bible.md");

function walk(dir: string, files: string[] = []): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return files;
  }
  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (SCAN_EXTENSIONS.has(extname(entry.name))) files.push(full);
  }
  return files;
}

function scanFile(absolutePath: string): FileMetadata {
  const rel = relative(PROJECT_ROOT, absolutePath).replace(/\\/g, "/");
  const content = readFileSync(absolutePath, "utf8");
  const stat = statSync(absolutePath);
  const imports = extractImports(content);
  const { layer, responsibilities } = classifyFile(rel, content);
  const violations = detectViolations(rel, layer, imports, content);
  const migration = buildMigrationPlan(rel, layer, responsibilities);

  return {
    path: rel,
    extension: extname(rel),
    size: stat.size,
    lines: content.split("\n").length,
    exports: extractExports(content),
    imports,
    dependencies: resolveDependencies(imports),
    detectedLayer: layer,
    detectedResponsibility: responsibilities,
    risk: computeRisk(layer, violations),
    violations,
    migration,
  };
}

export function scanRepository(root = PROJECT_ROOT): ScanResult {
  const paths: string[] = [];
  for (const scanRoot of SCAN_ROOTS) {
    const full = join(root, scanRoot);
    walk(full, paths);
  }

  const files = paths.map(scanFile).sort((a, b) => a.path.localeCompare(b.path));
  const summary = buildSummary(root, files);
  return { summary, files };
}

function main(): void {
  console.log("Architecture scanner — Part 34");
  const result = scanRepository();
  writeCodeRewriteBible(result, OUTPUT_PATH);
}

if (require.main === module) {
  main();
}
