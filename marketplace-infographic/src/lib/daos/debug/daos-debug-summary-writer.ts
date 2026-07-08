import { writeFile } from "fs/promises";
import path from "path";
import {
  createDaosDebugSummary,
  renderDaosDebugSummaryMarkdown,
} from "./daos-debug-summary";
import {
  renderDaosFinalGateMarkdownSection,
  type DAOSFinalGateResult,
} from "../gates/final-gate";

const SUMMARY_JSON = "daos-debug-summary.json";
const SUMMARY_MARKDOWN = "daos-debug-summary.md";

export type DaosDebugSummaryWriteResult = {
  ok: boolean;
  summaryPath?: string;
  markdownPath?: string;
  relativeSummaryPath?: string;
  relativeMarkdownPath?: string;
  error?: string;
};

function relativeSiblingPath(bundlePath: string, filename: string): string {
  const normalized = bundlePath.replace(/\\/g, "/");
  const marker = "generated/daos-debug/";
  const markerIndex = normalized.indexOf(marker);
  if (markerIndex >= 0) {
    const rest = normalized.slice(markerIndex);
    return rest.replace(/[^/]+$/, filename);
  }
  const cwd = process.cwd().replace(/\\/g, "/");
  if (normalized.startsWith(`${cwd}/`)) {
    const relative = normalized.slice(cwd.length + 1);
    return relative.replace(/[^/]+$/, filename);
  }
  return path.join(path.dirname(normalized), filename).replace(/\\/g, "/");
}

/** Persist summary JSON and markdown next to an existing debug bundle. */
export async function writeDaosDebugSummary(input: {
  bundle: unknown;
  bundlePath?: string;
  finalGate?: DAOSFinalGateResult;
}): Promise<DaosDebugSummaryWriteResult> {
  try {
    const summary = createDaosDebugSummary(input.bundle);
    let markdown = renderDaosDebugSummaryMarkdown(summary);
    if (input.finalGate) {
      markdown += renderDaosFinalGateMarkdownSection(input.finalGate);
    }

    if (!input.bundlePath) {
      return { ok: true };
    }

    const dir = path.dirname(input.bundlePath);
    const summaryPath = path.join(dir, SUMMARY_JSON);
    const markdownPath = path.join(dir, SUMMARY_MARKDOWN);

    await writeFile(summaryPath, JSON.stringify(summary, null, 2), "utf8");
    await writeFile(markdownPath, markdown, "utf8");

    return {
      ok: true,
      summaryPath,
      markdownPath,
      relativeSummaryPath: relativeSiblingPath(input.bundlePath, SUMMARY_JSON),
      relativeMarkdownPath: relativeSiblingPath(input.bundlePath, SUMMARY_MARKDOWN),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: `DAOS debug summary write failed: ${message}`,
    };
  }
}

export { createDaosDebugSummary, renderDaosDebugSummaryMarkdown };
