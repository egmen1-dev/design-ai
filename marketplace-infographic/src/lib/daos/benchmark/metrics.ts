import { createHash } from "crypto";
import { readFile } from "fs/promises";
import path from "path";
import type { BenchmarkArm, BenchmarkRunMetrics } from "./types";
import { readDaosDebugIndex } from "../debug/daos-debug-index";
import { resolveDaosDebugBundlePath } from "../debug/daos-debug-writer";

function asRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item)).filter(Boolean);
}

export async function hashFile(filePath: string): Promise<string | undefined> {
  if (!filePath?.trim()) return undefined;
  const candidates = [
    filePath,
    path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath),
    path.join(process.cwd(), "public", filePath.replace(/^\//, "")),
    path.join(process.cwd(), "public", "generated", path.basename(filePath)),
  ];
  for (const candidate of candidates) {
    try {
      const buf = await readFile(candidate);
      return createHash("md5").update(buf).digest("hex");
    } catch {
      continue;
    }
  }
  return undefined;
}

export async function hashBackgroundUrl(backgroundUrl: string | null): Promise<string | undefined> {
  if (!backgroundUrl) return undefined;
  const relative = backgroundUrl.replace(/^\//, "");
  return hashFile(path.join(process.cwd(), "public", relative));
}

type IndexSnapshot = Set<string>;

export function snapshotDebugIndexKeys(
  entries: Array<{ projectId: string; runId: string }>,
): IndexSnapshot {
  return new Set(entries.map((entry) => `${entry.projectId}::${entry.runId}`));
}

export async function findNewDebugEntry(
  before: IndexSnapshot,
  rootDir?: string,
): Promise<{ projectId: string; runId: string } | undefined> {
  const index = await readDaosDebugIndex({ rootDir });
  for (const entry of index.entries) {
    const key = `${entry.projectId}::${entry.runId}`;
    if (!before.has(key)) {
      return { projectId: entry.projectId, runId: entry.runId };
    }
  }
  return undefined;
}

export async function extractMetricsFromBundle(
  bundlePath: string,
): Promise<Partial<BenchmarkRunMetrics>> {
  try {
    const raw = await readFile(bundlePath, "utf8");
    const bundle = JSON.parse(raw) as Record<string, unknown>;
    const renderDebug = asRecord(bundle.renderDebug);
    const meaningLoss = asRecord(bundle.meaningLossReport);
    const diagnostics = asRecord(bundle.diagnostics);
    const providerPayload = asRecord(renderDebug.providerPayloadSummary);

    const warningItems = Array.isArray(meaningLoss.warnings)
      ? meaningLoss.warnings
      : Array.isArray(diagnostics.warnings)
        ? diagnostics.warnings
        : [];

    const meaningLossCodes = warningItems
      .map((item) => asString(asRecord(item).code))
      .filter((code): code is string => Boolean(code));

    const index = await readDaosDebugIndex();
    const indexEntry = index.entries.find(
      (entry) =>
        entry.projectId === asString(bundle.projectId) &&
        entry.runId === asString(bundle.runId),
    );

    const summaryPath = indexEntry?.summaryPath
      ? path.join(process.cwd(), indexEntry.summaryPath)
      : undefined;
    let summaryScore: number | undefined;
    if (summaryPath) {
      try {
        const summary = JSON.parse(await readFile(summaryPath, "utf8")) as { score?: number };
        summaryScore = summary.score;
      } catch {
        summaryScore = indexEntry?.summaryScore;
      }
    } else {
      summaryScore = indexEntry?.summaryScore;
    }

    return {
      projectId: asString(bundle.projectId),
      runId: asString(bundle.runId),
      summaryScore,
      finalGateStatus: indexEntry?.finalGateStatus,
      finalGateScore: indexEntry?.finalGateScore,
      meaningLossCount: warningItems.length,
      meaningLossCodes,
      modulesIgnored: asStringArray(renderDebug.modulesIgnored),
      modulesCompiled: asStringArray(renderDebug.daosV17ModulesCompiled),
      modulesStillIgnored: asStringArray(renderDebug.daosV17ModulesStillIgnored),
      promptLength: asNumber(renderDebug.promptLength),
      provider: asString(renderDebug.provider),
      model: asString(renderDebug.model),
      latencyMs: asNumber(providerPayload.latencyMs),
      fallbackUsed: renderDebug.fallbackUsed === true,
      composerQualityScore: asNumber(diagnostics.composerQualityScore),
      productAreaRatio: asNumber(diagnostics.productAreaRatio),
      finalCompositionRisk: asNumber(diagnostics.finalCompositionRisk),
    };
  } catch {
    return {};
  }
}

export async function buildRunMetrics(input: {
  arm: BenchmarkArm;
  productId: string;
  productName: string;
  imageId?: string;
  generationTimeMs: number;
  backgroundUrl: string | null;
  imagePath: string;
  debugEntry?: { projectId: string; runId: string };
  rootDir?: string;
  error?: string;
}): Promise<BenchmarkRunMetrics> {
  const base: BenchmarkRunMetrics = {
    arm: input.arm,
    productId: input.productId,
    productName: input.productName,
    imageId: input.imageId,
    generationTimeMs: input.generationTimeMs,
    meaningLossCount: 0,
    meaningLossCodes: [],
    modulesIgnored: [],
    modulesCompiled: [],
    modulesStillIgnored: [],
    backgroundHash: await hashBackgroundUrl(input.backgroundUrl),
    finalImageHash: await hashFile(input.imagePath),
    error: input.error,
  };

  if (!input.debugEntry) return base;

  const bundlePath = resolveDaosDebugBundlePath(
    input.debugEntry.projectId,
    input.debugEntry.runId,
    input.rootDir,
  );
  const extracted = await extractMetricsFromBundle(bundlePath);

  return {
    ...base,
    ...extracted,
    projectId: input.debugEntry.projectId,
    runId: input.debugEntry.runId,
    meaningLossCount: extracted.meaningLossCount ?? 0,
    meaningLossCodes: extracted.meaningLossCodes ?? [],
    modulesIgnored: extracted.modulesIgnored ?? [],
    modulesCompiled: extracted.modulesCompiled ?? [],
    modulesStillIgnored: extracted.modulesStillIgnored ?? [],
  };
}
