import type { GenerationContextOperatingMode, GenerationContextOperatingModeName } from "./types";

const VALID_OPERATING_MODES = new Set<GenerationContextOperatingModeName>([
  "production",
  "exploration",
]);

export function resolveGenerationContextOperatingMode(): GenerationContextOperatingMode {
  const raw = process.env.DAOS_OPERATING_MODE?.trim().toLowerCase();
  const warnings: string[] = [];
  const explorationFlags: string[] = [];

  if (!raw) {
    return {
      mode: "production",
      explorationFlags,
      warnings,
    };
  }

  if (raw === "exploration") {
    explorationFlags.push("DAOS_OPERATING_MODE=exploration");
    return {
      mode: "exploration",
      explorationFlags,
      warnings,
    };
  }

  if (!VALID_OPERATING_MODES.has(raw as GenerationContextOperatingModeName)) {
    warnings.push(`Unknown DAOS_OPERATING_MODE="${raw}" — fallback to production`);
    return {
      mode: "production",
      explorationFlags,
      warnings,
    };
  }

  return {
    mode: raw as GenerationContextOperatingModeName,
    explorationFlags,
    warnings,
  };
}
