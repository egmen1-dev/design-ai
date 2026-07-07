import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { renderDaosDebugIndexMarkdown } from "./daos-debug-index-markdown";

export type DAOSDebugIndexEntry = {
  projectId: string;
  runId: string;
  createdAt?: string;
  generationMode?: string;
  summaryStatus?: "ok" | "warning" | "critical";
  summaryScore?: number;
  finalGateStatus?: "passed" | "warning" | "failed";
  finalGateScore?: number;
  bundlePath?: string;
  summaryPath?: string;
  markdownPath?: string;
  warnings?: number;
  criticals?: number;
};

export type DAOSDebugIndex = {
  version: 1;
  updatedAt: string;
  entries: DAOSDebugIndexEntry[];
};

const INDEX_VERSION = 1 as const;
const MAX_ENTRIES = 500;
const INDEX_JSON = "index.json";
const INDEX_MARKDOWN = "index.md";

export function resolveDaosDebugIndexDir(rootDir?: string): string {
  return path.join(rootDir ?? process.cwd(), "generated", "daos-debug");
}

export function resolveDaosDebugIndexJsonPath(rootDir?: string): string {
  return path.join(resolveDaosDebugIndexDir(rootDir), INDEX_JSON);
}

export function resolveDaosDebugIndexMarkdownPath(rootDir?: string): string {
  return path.join(resolveDaosDebugIndexDir(rootDir), INDEX_MARKDOWN);
}

function emptyIndex(): DAOSDebugIndex {
  return {
    version: INDEX_VERSION,
    updatedAt: new Date().toISOString(),
    entries: [],
  };
}

function sortEntriesDesc(entries: DAOSDebugIndexEntry[]): DAOSDebugIndexEntry[] {
  return [...entries].sort((a, b) => {
    const aTime = a.createdAt ? Date.parse(a.createdAt) : 0;
    const bTime = b.createdAt ? Date.parse(b.createdAt) : 0;
    if (bTime !== aTime) return bTime - aTime;
    return `${b.projectId}/${b.runId}`.localeCompare(`${a.projectId}/${a.runId}`);
  });
}

function trimEntries(entries: DAOSDebugIndexEntry[]): DAOSDebugIndexEntry[] {
  return sortEntriesDesc(entries).slice(0, MAX_ENTRIES);
}

function entryKey(entry: DAOSDebugIndexEntry): string {
  return `${entry.projectId}::${entry.runId}`;
}

export async function readDaosDebugIndex(input?: {
  rootDir?: string;
}): Promise<DAOSDebugIndex> {
  const indexPath = resolveDaosDebugIndexJsonPath(input?.rootDir);
  try {
    const raw = await readFile(indexPath, "utf8");
    const parsed = JSON.parse(raw) as Partial<DAOSDebugIndex>;
    if (parsed.version !== INDEX_VERSION || !Array.isArray(parsed.entries)) {
      return emptyIndex();
    }
    return {
      version: INDEX_VERSION,
      updatedAt: typeof parsed.updatedAt === "string" ? parsed.updatedAt : new Date().toISOString(),
      entries: trimEntries(parsed.entries as DAOSDebugIndexEntry[]),
    };
  } catch {
    return emptyIndex();
  }
}

export async function updateDaosDebugIndex(input: {
  rootDir?: string;
  entry: DAOSDebugIndexEntry;
}): Promise<{ ok: boolean; indexPath?: string; markdownPath?: string; relativeIndexPath?: string; error?: string }> {
  try {
    const dir = resolveDaosDebugIndexDir(input.rootDir);
    const indexPath = path.join(dir, INDEX_JSON);
    const markdownPath = path.join(dir, INDEX_MARKDOWN);

    await mkdir(dir, { recursive: true });

    const current = await readDaosDebugIndex({ rootDir: input.rootDir });
    const nextKey = entryKey(input.entry);
    const merged = [
      input.entry,
      ...current.entries.filter((entry) => entryKey(entry) !== nextKey),
    ];

    const index: DAOSDebugIndex = {
      version: INDEX_VERSION,
      updatedAt: new Date().toISOString(),
      entries: trimEntries(merged),
    };

    await writeFile(indexPath, JSON.stringify(index, null, 2), "utf8");
    await writeFile(markdownPath, renderDaosDebugIndexMarkdown(index), "utf8");

    const relativeIndexPath = path
      .join("generated", "daos-debug", INDEX_JSON)
      .replace(/\\/g, "/");

    return {
      ok: true,
      indexPath,
      markdownPath,
      relativeIndexPath,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      error: `DAOS debug index update failed: ${message}`,
    };
  }
}

export { MAX_ENTRIES as DAOS_DEBUG_INDEX_MAX_ENTRIES };
