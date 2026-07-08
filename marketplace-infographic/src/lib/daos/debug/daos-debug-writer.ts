import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { DaosDebugBundle } from "./daos-debug-bundle";

export type DaosDebugWriteResult =
  | { ok: true; path: string; relativePath: string }
  | { ok: false; warning: string };

const BUNDLE_FILENAME = "daos-debug-bundle.json";

export function resolveDaosDebugBundleDir(
  projectId: string,
  runId: string,
  baseDir?: string,
): string {
  return path.join(baseDir ?? process.cwd(), "generated", "daos-debug", projectId, runId);
}

export function resolveDaosDebugBundlePath(
  projectId: string,
  runId: string,
  baseDir?: string,
): string {
  return path.join(resolveDaosDebugBundleDir(projectId, runId, baseDir), BUNDLE_FILENAME);
}

/** Persist debug bundle to generated/daos-debug/<projectId>/<runId>/daos-debug-bundle.json */
export async function writeDaosDebugBundle(
  bundle: DaosDebugBundle,
  options?: { baseDir?: string },
): Promise<DaosDebugWriteResult> {
  try {
    const dir = resolveDaosDebugBundleDir(bundle.projectId, bundle.runId, options?.baseDir);
    const filePath = path.join(dir, BUNDLE_FILENAME);
    await mkdir(dir, { recursive: true });
    await writeFile(filePath, JSON.stringify(bundle, null, 2), "utf8");

    const relativePath = path.join(
      "generated",
      "daos-debug",
      bundle.projectId,
      bundle.runId,
      BUNDLE_FILENAME,
    );

    return { ok: true, path: filePath, relativePath };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ok: false,
      warning: `DAOS debug bundle write failed: ${message}`,
    };
  }
}
