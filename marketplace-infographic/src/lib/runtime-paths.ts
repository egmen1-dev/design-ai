import { existsSync } from "fs";
import { access } from "fs/promises";
import { constants } from "fs";
import path from "path";

/** Корень runtime: standalone при PM2, иначе cwd проекта. */
export function runtimeRoot(): string {
  const cwd = process.cwd();
  const nestedStandalone = path.join(cwd, ".next", "standalone");

  if (existsSync(path.join(nestedStandalone, "server.js"))) {
    return nestedStandalone;
  }

  if (existsSync(path.join(cwd, "server.js"))) {
    return cwd;
  }

  return cwd;
}

export function publicDir(...segments: string[]): string {
  return path.join(runtimeRoot(), "public", ...segments);
}

export function projectRoot(): string {
  const root = runtimeRoot();
  if (root.replace(/\\/g, "/").includes("/.next/standalone")) {
    return path.resolve(root, "..", "..");
  }
  return root;
}

/** Куда писать uploads/backgrounds — вне standalone, переживает rebuild */
export function writablePublicDir(...segments: string[]): string {
  return path.join(projectRoot(), "public", ...segments);
}

/** Резолв web-пути (/backgrounds/..., /uploads/...) в файл на диске */
export async function resolvePublicAssetPath(webPath: string): Promise<string> {
  const rel = webPath.replace(/^\//, "");
  const candidates = [
    path.join(projectRoot(), "public", rel),
    publicDir(rel),
    path.join(process.cwd(), "public", rel),
  ];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const normalized = path.normalize(candidate);
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    try {
      await access(normalized, constants.R_OK);
      return normalized;
    } catch {
      continue;
    }
  }
  throw new Error(`PUBLIC_ASSET_NOT_FOUND: ${webPath}`);
}

/** Персистентное хранилище вне .next (переживает rebuild). */
export function persistentDataDir(...segments: string[]): string {
  return path.join(projectRoot(), "data", ...segments);
}
