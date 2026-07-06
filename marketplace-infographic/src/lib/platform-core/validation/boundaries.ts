/** Architecture boundary validation helpers — extended by CI validator. */
export function assertNoLegacyInRuntime(importPath: string): void {
  if (importPath.includes("/legacy/")) {
    throw new Error("Legacy imports forbidden in Runtime");
  }
}

export function assertNoPlatformInPlatform(from: string, to: string): void {
  if (from !== to && from.startsWith("platforms/") && to.startsWith("platforms/")) {
    throw new Error(`Platform must not import platform: ${from} -> ${to}`);
  }
}
