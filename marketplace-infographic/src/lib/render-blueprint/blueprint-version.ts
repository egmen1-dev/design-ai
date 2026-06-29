/**
 * Chapter 3.13 — SemVer utilities and compatibility matrix
 */
import type { BlueprintVersion, CompatibilityStatusId } from "./blueprint-version-types";
import { CompatibilityStatus } from "./blueprint-version-types";
import { RENDER_BLUEPRINT_VERSION } from "./types";

/** Current blueprint schema SemVer (maps from integer meta.version 18) */
export const CURRENT_BLUEPRINT_SCHEMA = "2.0.0";

/** Pipeline protocol version — independent from blueprint schema */
export const CURRENT_PIPELINE_VERSION = "2.0.0";

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

export function parseBlueprintVersion(input: string | BlueprintVersion): BlueprintVersion {
  if (typeof input === "object") return input;
  const match = SEMVER_RE.exec(input.trim());
  if (!match) {
    throw new Error(`Invalid blueprint version: ${input}`);
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

export function formatBlueprintVersion(version: BlueprintVersion): string {
  return `${version.major}.${version.minor}.${version.patch}`;
}

export function compareBlueprintVersions(
  a: string | BlueprintVersion,
  b: string | BlueprintVersion,
): number {
  const va = typeof a === "string" ? parseBlueprintVersion(a) : a;
  const vb = typeof b === "string" ? parseBlueprintVersion(b) : b;
  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  return va.patch - vb.patch;
}

/** Read schema version from raw blueprint — supports SemVer string or legacy integer */
export function readBlueprintSchemaVersion(raw: Record<string, unknown>): string {
  const meta = raw.meta;
  if (meta && typeof meta === "object") {
    const m = meta as Record<string, unknown>;
    if (typeof m.schemaVersion === "string") return m.schemaVersion;
    if (typeof m.version === "number") {
      if (m.version >= RENDER_BLUEPRINT_VERSION) return CURRENT_BLUEPRINT_SCHEMA;
      if (m.version >= 17) return "1.0.0";
    }
  }
  if (typeof raw.schemaVersion === "string") return raw.schemaVersion;
  return "0.0.0";
}

export function writeBlueprintSchemaVersion(
  raw: Record<string, unknown>,
  schemaVersion: string,
): void {
  if (!raw.meta || typeof raw.meta !== "object") {
    raw.meta = {};
  }
  const meta = raw.meta as Record<string, unknown>;
  meta.schemaVersion = schemaVersion;
  meta.version = RENDER_BLUEPRINT_VERSION;
}

/**
 * Compatibility matrix (Ch 3.13):
 * - same major, blueprint <= pipeline → native or migration
 * - blueprint major > pipeline major → unsupported
 */
export function evaluateCompatibility(
  blueprintVersion: string,
  pipelineVersion: string,
): CompatibilityStatusId {
  const b = parseBlueprintVersion(blueprintVersion);
  const p = parseBlueprintVersion(pipelineVersion);

  if (b.major > p.major) return CompatibilityStatus.UNSUPPORTED;
  if (b.major < p.major) return CompatibilityStatus.MIGRATION;

  const cmp = compareBlueprintVersions(b, p);
  if (cmp === 0) return CompatibilityStatus.NATIVE;
  if (cmp < 0) return CompatibilityStatus.MIGRATION;
  return CompatibilityStatus.NATIVE;
}

export function compatibilityMessage(
  status: CompatibilityStatusId,
  blueprintVersion: string,
  pipelineVersion: string,
): string {
  switch (status) {
    case CompatibilityStatus.NATIVE:
      return `Blueprint ${blueprintVersion} is natively supported by pipeline ${pipelineVersion}`;
    case CompatibilityStatus.MIGRATION:
      return `Blueprint ${blueprintVersion} requires migration before pipeline ${pipelineVersion}`;
    case CompatibilityStatus.UNSUPPORTED:
      return `Blueprint ${blueprintVersion} is not supported by pipeline ${pipelineVersion}`;
  }
}

export function isUpgradeOnly(fromVersion: string, toVersion: string): boolean {
  return compareBlueprintVersions(fromVersion, toVersion) < 0;
}
