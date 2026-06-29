import { existsSync } from "fs";
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

/** Персистентное хранилище вне .next (переживает rebuild). */
export function persistentDataDir(...segments: string[]): string {
  return path.join(projectRoot(), "data", ...segments);
}
