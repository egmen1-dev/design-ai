/**
 * Chapter 5.18 — Knowledge Versioning engine.
 * Lifecycle management for all Design Knowledge Engine objects.
 */
import {
  buildValidatableKnowledgeCatalog,
  runKnowledgeValidationPipeline,
  type ValidatableKnowledgeEntry,
} from "./knowledge-validation-engine";
import {
  KnowledgeCompatibilityLevel,
  KnowledgeVersionBump,
  KnowledgeVersionState,
  type KnowledgeCompatibilityLevelId,
  type KnowledgeRollbackRecord,
  type KnowledgeSnapshot,
  type KnowledgeVersion,
  type KnowledgeVersionAuditEntry,
  type KnowledgeVersionBumpId,
  type KnowledgeVersionPublishReport,
  type KnowledgeVersionSelection,
  type KnowledgeVersionSelectionContext,
  type KnowledgeVersionStateId,
  type KnowledgeVersionViolation,
  type KnowledgeVersioningContext,
  type KnowledgeVersioningFailureCode,
  type KnowledgeVersioningReport,
} from "./knowledge-versioning-types";

export {
  KnowledgeVersionState,
  KnowledgeCompatibilityLevel,
  KnowledgeVersionBump,
  type KnowledgeVersionStateId,
  type KnowledgeCompatibilityLevelId,
  type KnowledgeVersionBumpId,
  type KnowledgeVersion,
  type KnowledgeVersionAuditEntry,
  type KnowledgeRollbackRecord,
  type KnowledgeSnapshot,
  type KnowledgeVersionSelectionContext,
  type KnowledgeVersionSelection,
  type KnowledgeVersionViolation,
  type KnowledgeVersionPublishReport,
  type KnowledgeVersioningReport,
  type KnowledgeVersioningContext,
  type KnowledgeVersioningFailureCode,
} from "./knowledge-versioning-types";

export const KNOWLEDGE_VERSIONING_VERSION = "5.18.0";

export const KNOWLEDGE_VERSIONING_GOLDEN_RULE =
  "Knowledge becomes valuable not because it constantly changes, but because every change is controlled, " +
  "verified, documented, and can be safely undone. Versioning turns evolution into managed engineering.";

export const VERSION_LIFECYCLE: readonly KnowledgeVersionStateId[] = [
  KnowledgeVersionState.DRAFT,
  KnowledgeVersionState.VALIDATION,
  KnowledgeVersionState.TESTING,
  KnowledgeVersionState.APPROVED,
  KnowledgeVersionState.DEPRECATED,
  KnowledgeVersionState.ARCHIVED,
] as const;

const SEMVER_PATTERN = /^\d+\.\d+\.\d+$/;

const STATE_TRANSITIONS: Record<KnowledgeVersionStateId, KnowledgeVersionStateId[]> = {
  [KnowledgeVersionState.DRAFT]: [KnowledgeVersionState.VALIDATION],
  [KnowledgeVersionState.VALIDATION]: [KnowledgeVersionState.TESTING, KnowledgeVersionState.DRAFT],
  [KnowledgeVersionState.TESTING]: [KnowledgeVersionState.APPROVED, KnowledgeVersionState.DRAFT],
  [KnowledgeVersionState.APPROVED]: [KnowledgeVersionState.DEPRECATED],
  [KnowledgeVersionState.DEPRECATED]: [KnowledgeVersionState.ARCHIVED],
  [KnowledgeVersionState.ARCHIVED]: [],
};

let auditCounter = 0;
let snapshotCounter = 0;

function violation(
  code: KnowledgeVersioningFailureCode,
  message: string,
  knowledgeId?: string,
  versionId?: string,
): KnowledgeVersionViolation {
  return { code, message, knowledgeId, versionId };
}

function versionId(knowledgeId: string, version: string): string {
  return `${knowledgeId}@${version}`;
}

export function parseSemanticVersion(version: string): { major: number; minor: number; patch: number } | null {
  if (!SEMVER_PATTERN.test(version)) return null;
  const [major, minor, patch] = version.split(".").map(Number);
  return { major, minor, patch };
}

export function compareSemanticVersions(a: string, b: string): number {
  const pa = parseSemanticVersion(a);
  const pb = parseSemanticVersion(b);
  if (!pa || !pb) return 0;
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  return pa.patch - pb.patch;
}

export function bumpSemanticVersion(current: string, bump: KnowledgeVersionBumpId): string | null {
  const parsed = parseSemanticVersion(current);
  if (!parsed) return null;
  if (bump === KnowledgeVersionBump.MAJOR) {
    return `${parsed.major + 1}.0.0`;
  }
  if (bump === KnowledgeVersionBump.MINOR) {
    return `${parsed.major}.${parsed.minor + 1}.0`;
  }
  return `${parsed.major}.${parsed.minor}.${parsed.patch + 1}`;
}

export function analyzeVersionCompatibility(
  previous: KnowledgeVersion,
  next: KnowledgeVersion,
): KnowledgeCompatibilityLevelId {
  const prev = parseSemanticVersion(previous.version);
  const nextV = parseSemanticVersion(next.version);
  if (!prev || !nextV) return KnowledgeCompatibilityLevel.BREAKING_CHANGE;

  if (nextV.major > prev.major) {
    return KnowledgeCompatibilityLevel.BREAKING_CHANGE;
  }
  if (nextV.minor > prev.minor || next.changes.some((c) => c.includes("recommendation"))) {
    return KnowledgeCompatibilityLevel.PARTIALLY_COMPATIBLE;
  }
  return KnowledgeCompatibilityLevel.COMPATIBLE;
}

export function canTransitionVersionState(
  from: KnowledgeVersionStateId,
  to: KnowledgeVersionStateId,
): boolean {
  return STATE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function transitionVersionState(
  v: KnowledgeVersion,
  to: KnowledgeVersionStateId,
): { version: KnowledgeVersion; violations: KnowledgeVersionViolation[] } {
  if (!canTransitionVersionState(v.status, to)) {
    return {
      version: v,
      violations: [
        violation(
          "INVALID_STATE_TRANSITION",
          `Cannot transition ${v.status} → ${to}`,
          v.knowledgeId,
          v.id,
        ),
      ],
    };
  }
  return { version: { ...v, status: to }, violations: [] };
}

function entryToVersion(
  e: ValidatableKnowledgeEntry,
  status: KnowledgeVersionStateId,
  author: string,
  changes: string[],
  previousVersionId?: string,
  experimental = false,
): KnowledgeVersion {
  return {
    id: versionId(e.id, e.version),
    knowledgeId: e.id,
    version: e.version,
    createdAt: new Date("2025-06-01T00:00:00Z"),
    author,
    changes,
    status,
    compatibility: KnowledgeCompatibilityLevel.COMPATIBLE,
    confidence: e.confidence,
    experimental,
    dependencies: e.references,
    previousVersionId,
    payloadRef: e.id,
  };
}

export function buildKnowledgeVersionCatalog(): KnowledgeVersion[] {
  const catalog = buildValidatableKnowledgeCatalog();
  const versions: KnowledgeVersion[] = [];

  const chainedKnowledgeIds = new Set(["photo-warm-lighting-rule", "typo-readability-first"]);

  for (const e of catalog) {
    if (chainedKnowledgeIds.has(e.id)) continue;
    versions.push(
      entryToVersion(
        e,
        KnowledgeVersionState.APPROVED,
        "design-knowledge-engine",
        ["Initial stable release from seed catalog"],
      ),
    );
  }

  const lighting = catalog.find((e) => e.id === "photo-warm-lighting-rule");
  if (lighting) {
    const v1 = entryToVersion(
      { ...lighting, version: "1.0.0" },
      KnowledgeVersionState.ARCHIVED,
      "photography-team",
      ["First stable lighting rule"],
    );
    const v2 = entryToVersion(
      { ...lighting, version: "1.1.0", confidence: lighting.confidence + 0.02 },
      KnowledgeVersionState.DEPRECATED,
      "photography-team",
      ["Added marketplace-specific warm tone thresholds", "Updated confidence from analytics"],
      v1.id,
    );
    const v3 = entryToVersion(
      { ...lighting, version: "1.2.0" },
      KnowledgeVersionState.APPROVED,
      "photography-team",
      ["Expanded application conditions", "Resolved conflict annotations"],
      v2.id,
    );
    versions.push(v1, v2, v3);
    v2.compatibility = analyzeVersionCompatibility(v1, v2);
    v3.compatibility = analyzeVersionCompatibility(v2, v3);
  }

  const typo = catalog.find((e) => e.id === "typo-readability-first");
  if (typo) {
    versions.push(
      entryToVersion(
        typo,
        KnowledgeVersionState.APPROVED,
        "typography-team",
        ["Stable typography readability baseline"],
      ),
      entryToVersion(
        { ...typo, version: "1.3.0" },
        KnowledgeVersionState.TESTING,
        "typography-team",
        ["Experimental line-height tuning for mobile infographics"],
        versionId(typo.id, typo.version),
        true,
      ),
    );
  }

  return versions;
}

export function getKnowledgeVersionHistory(
  knowledgeId: string,
  catalog: KnowledgeVersion[] = buildKnowledgeVersionCatalog(),
): KnowledgeVersion[] {
  return catalog
    .filter((v) => v.knowledgeId === knowledgeId)
    .sort((a, b) => compareSemanticVersions(a.version, b.version));
}

export function getLatestApprovedVersion(
  knowledgeId: string,
  catalog: KnowledgeVersion[] = buildKnowledgeVersionCatalog(),
): KnowledgeVersion | undefined {
  return getKnowledgeVersionHistory(knowledgeId, catalog)
    .filter((v) => v.status === KnowledgeVersionState.APPROVED && !v.experimental)
    .sort((a, b) => compareSemanticVersions(b.version, a.version))[0];
}

export function createKnowledgeVersionDraft(
  knowledgeId: string,
  changes: string[],
  bump: KnowledgeVersionBumpId = KnowledgeVersionBump.MINOR,
  author = "knowledge-author",
  catalog: KnowledgeVersion[] = buildKnowledgeVersionCatalog(),
): { draft: KnowledgeVersion | null; violations: KnowledgeVersionViolation[] } {
  const latest = getLatestApprovedVersion(knowledgeId, catalog);
  if (!latest) {
    return {
      draft: null,
      violations: [violation("VERSION_HISTORY_LOST", `No approved version for ${knowledgeId}`, knowledgeId)],
    };
  }

  const nextVersion = bumpSemanticVersion(latest.version, bump);
  if (!nextVersion) {
    return {
      draft: null,
      violations: [violation("INVALID_SEMVER", `Cannot bump version ${latest.version}`, knowledgeId, latest.id)],
    };
  }

  const draft: KnowledgeVersion = {
    id: versionId(knowledgeId, nextVersion),
    knowledgeId,
    version: nextVersion,
    createdAt: new Date(),
    author,
    changes,
    status: KnowledgeVersionState.DRAFT,
    compatibility: analyzeVersionCompatibility(latest, {
      ...latest,
      version: nextVersion,
      changes,
      status: KnowledgeVersionState.DRAFT,
    }),
    confidence: latest.confidence,
    previousVersionId: latest.id,
    dependencies: latest.dependencies,
    payloadRef: latest.payloadRef,
  };

  return { draft, violations: [] };
}

export function validateDependencyVersions(
  v: KnowledgeVersion,
  catalog: KnowledgeVersion[] = buildKnowledgeVersionCatalog(),
): KnowledgeVersionViolation[] {
  const violations: KnowledgeVersionViolation[] = [];
  if (!v.dependencies?.length) return violations;

  const approvedIds = new Set(
    catalog.filter((c) => c.status === KnowledgeVersionState.APPROVED).map((c) => c.knowledgeId),
  );

  for (const dep of v.dependencies) {
    if (!approvedIds.has(dep) && !catalog.some((c) => c.id === dep && c.status === KnowledgeVersionState.APPROVED)) {
      violations.push(
        violation(
          "DEPENDENCY_BROKEN",
          `Dependency ${dep} has no approved version`,
          v.knowledgeId,
          v.id,
        ),
      );
    }
  }

  return violations;
}

export function validateVersionForPublication(
  v: KnowledgeVersion,
  context: KnowledgeVersioningContext = {},
  catalog: KnowledgeVersion[] = buildKnowledgeVersionCatalog(),
): KnowledgeVersionViolation[] {
  const violations: KnowledgeVersionViolation[] = [];

  if (!parseSemanticVersion(v.version)) {
    violations.push(violation("INVALID_SEMVER", `Invalid semver ${v.version}`, v.knowledgeId, v.id));
  }

  if (v.status !== KnowledgeVersionState.TESTING && v.status !== KnowledgeVersionState.VALIDATION) {
    violations.push(
      violation(
        "INVALID_STATE_TRANSITION",
        `Version must be in testing or validation before publish (current: ${v.status})`,
        v.knowledgeId,
        v.id,
      ),
    );
  }

  violations.push(...validateDependencyVersions(v, catalog));

  const previous = v.previousVersionId
    ? catalog.find((c) => c.id === v.previousVersionId)
    : undefined;
  if (previous) {
    const compatibility = analyzeVersionCompatibility(previous, v);
    if (
      compatibility === KnowledgeCompatibilityLevel.BREAKING_CHANGE &&
      !context.allowBreakingPublish
    ) {
      violations.push(
        violation(
          "COMPATIBILITY_BREAK",
          `Breaking change ${previous.version} → ${v.version} requires full validation cycle`,
          v.knowledgeId,
          v.id,
        ),
      );
    }
  }

  if (!context.skipValidation) {
    const entryCatalog = buildValidatableKnowledgeCatalog();
    const entry = entryCatalog.find((e) => e.id === v.knowledgeId);
    if (entry) {
      const validation = runKnowledgeValidationPipeline(
        { ...entry, version: v.version, confidence: v.confidence },
        {
          catalog: entryCatalog,
          skipSimulation: context.simulationPassed === undefined ? false : !context.simulationPassed,
          previousVersion: previous
            ? entryCatalog.find((e) => e.id === previous.knowledgeId)
            : undefined,
        },
      );
      if (!validation.approved) {
        violations.push(
          violation("VALIDATION_FAILED", "Knowledge validation pipeline rejected version", v.knowledgeId, v.id),
        );
      }
    }
  }

  if (context.simulationPassed === false) {
    violations.push(violation("SIMULATION_FAILED", "Simulation did not pass", v.knowledgeId, v.id));
  }
  if (context.regressionPassed === false) {
    violations.push(violation("REGRESSION_FAILED", "Regression tests failed", v.knowledgeId, v.id));
  }
  if (context.commercialScoreDelta !== undefined && context.commercialScoreDelta < 0) {
    violations.push(
      violation("COMMERCIAL_SCORE_DEGRADED", "Commercial score degraded", v.knowledgeId, v.id),
    );
  }

  return violations;
}

export function recordAuditEntry(
  v: KnowledgeVersion,
  changedFields: string[],
  reason: string,
  validationPassed: boolean,
): KnowledgeVersionAuditEntry {
  auditCounter += 1;
  return {
    id: `audit-${auditCounter}`,
    knowledgeId: v.knowledgeId,
    versionId: v.id,
    author: v.author,
    timestamp: new Date(),
    changedFields,
    reason,
    validationPassed,
    resultingVersion: v.version,
  };
}

export function releaseKnowledgeVersion(
  v: KnowledgeVersion,
  context: KnowledgeVersioningContext = {},
  catalog: KnowledgeVersion[] = buildKnowledgeVersionCatalog(),
): KnowledgeVersionPublishReport {
  const publishViolations = validateVersionForPublication(v, context, catalog);
  if (publishViolations.length > 0) {
    return {
      versionId: v.id,
      knowledgeId: v.knowledgeId,
      published: false,
      status: v.status,
      compatibility: v.compatibility,
      violations: publishViolations,
      rollbackAvailable: !!v.previousVersionId,
    };
  }

  const published: KnowledgeVersion = {
    ...v,
    status: KnowledgeVersionState.APPROVED,
    experimental: false,
  };

  const auditEntry = recordAuditEntry(
    published,
    ["status", "version", "confidence"],
    "Published after validation, simulation, and compatibility checks",
    true,
  );

  return {
    versionId: published.id,
    knowledgeId: published.knowledgeId,
    published: true,
    status: KnowledgeVersionState.APPROVED,
    compatibility: published.compatibility,
    violations: [],
    auditEntry,
    rollbackAvailable: !!published.previousVersionId,
  };
}

export function rollbackKnowledgeVersion(
  knowledgeId: string,
  targetVersionId: string,
  reason: string,
  catalog: KnowledgeVersion[] = buildKnowledgeVersionCatalog(),
): { record: KnowledgeRollbackRecord | null; violations: KnowledgeVersionViolation[] } {
  const history = getKnowledgeVersionHistory(knowledgeId, catalog);
  const current = history.find((v) => v.status === KnowledgeVersionState.APPROVED);
  const target = catalog.find((v) => v.id === targetVersionId);

  if (!target || target.knowledgeId !== knowledgeId) {
    return {
      record: null,
      violations: [violation("ROLLBACK_UNAVAILABLE", "Target version not found", knowledgeId, targetVersionId)],
    };
  }

  if (!current) {
    return {
      record: null,
      violations: [violation("ROLLBACK_UNAVAILABLE", "No current approved version", knowledgeId)],
    };
  }

  return {
    record: {
      knowledgeId,
      fromVersionId: current.id,
      toVersionId: target.id,
      reason,
      timestamp: new Date(),
      preservedHistory: true,
      testResultsRetained: true,
    },
    violations: [],
  };
}

export function createKnowledgeSnapshot(
  projectId: string,
  catalog: KnowledgeVersion[] = buildKnowledgeVersionCatalog(),
): KnowledgeSnapshot {
  snapshotCounter += 1;
  const approved = catalog.filter((v) => v.status === KnowledgeVersionState.APPROVED);

  const knowledgeVersions: Record<string, string> = {};
  const patternVersions: Record<string, string> = {};
  const marketplaceProfileVersions: Record<string, string> = {};

  for (const v of approved) {
    knowledgeVersions[v.knowledgeId] = v.version;
    if (v.knowledgeId.startsWith("pattern-")) {
      patternVersions[v.knowledgeId] = v.version;
    }
    if (v.knowledgeId.startsWith("marketplace-")) {
      marketplaceProfileVersions[v.knowledgeId] = v.version;
    }
  }

  return {
    id: `snapshot-${snapshotCounter}`,
    projectId,
    createdAt: new Date(),
    knowledgeVersions,
    patternVersions,
    marketplaceProfileVersions,
    rulesEngineVersion: KNOWLEDGE_VERSIONING_VERSION,
    reproducible: Object.keys(knowledgeVersions).length > 0,
  };
}

export function validateKnowledgeSnapshot(snapshot: KnowledgeSnapshot): KnowledgeVersionViolation[] {
  const violations: KnowledgeVersionViolation[] = [];
  if (!snapshot.reproducible || Object.keys(snapshot.knowledgeVersions).length === 0) {
    violations.push(violation("SNAPSHOT_INCOMPLETE", "Snapshot missing knowledge version map", snapshot.projectId));
  }
  if (!snapshot.rulesEngineVersion) {
    violations.push(violation("SNAPSHOT_INCOMPLETE", "Snapshot missing rules engine version", snapshot.projectId));
  }
  return violations;
}

export function selectKnowledgeVersion(
  knowledgeId: string,
  context: KnowledgeVersionSelectionContext = {},
  catalog: KnowledgeVersion[] = buildKnowledgeVersionCatalog(),
): KnowledgeVersionSelection | null {
  const pinned = context.pinnedVersions?.[knowledgeId];
  if (pinned) {
    const pinnedVersion = catalog.find(
      (v) => v.knowledgeId === knowledgeId && v.version === pinned,
    );
    if (pinnedVersion) {
      return {
        knowledgeId,
        selectedVersionId: pinnedVersion.id,
        version: pinnedVersion.version,
        status: pinnedVersion.status,
        reason: "project-pinned",
      };
    }
  }

  const candidates = getKnowledgeVersionHistory(knowledgeId, catalog).filter((v) => {
    if (context.requireApproved !== false && v.status !== KnowledgeVersionState.APPROVED) {
      return false;
    }
    if (!context.allowExperimental && v.experimental) {
      return false;
    }
    return true;
  });

  const selected = candidates.sort((a, b) => compareSemanticVersions(b.version, a.version))[0];
  if (!selected) return null;

  let reason = "latest-approved";
  if (context.marketplace) reason += `:${context.marketplace}`;
  if (context.businessContext) reason += `:${context.businessContext}`;

  return {
    knowledgeId,
    selectedVersionId: selected.id,
    version: selected.version,
    status: selected.status,
    reason,
  };
}

export function assertImmutablePublishedVersion(
  existing: KnowledgeVersion,
  mutation: Partial<KnowledgeVersion>,
): KnowledgeVersionViolation[] {
  if (existing.status !== KnowledgeVersionState.APPROVED) return [];

  const changedFields = Object.keys(mutation).filter(
    (key) =>
      key !== "status" &&
      mutation[key as keyof KnowledgeVersion] !== undefined &&
      mutation[key as keyof KnowledgeVersion] !== existing[key as keyof KnowledgeVersion],
  );

  if (changedFields.length > 0) {
    return [
      violation(
        "IMMUTABLE_VIOLATION",
        `Published version cannot be mutated (${changedFields.join(", ")}); create new version instead`,
        existing.knowledgeId,
        existing.id,
      ),
    ];
  }

  return [];
}

export function validateKnowledgeVersioning(
  context: KnowledgeVersioningContext = {},
): KnowledgeVersioningReport {
  const catalog = buildKnowledgeVersionCatalog();
  const violations: KnowledgeVersionViolation[] = [];

  const approved = catalog.filter((v) => v.status === KnowledgeVersionState.APPROVED);
  const experimental = catalog.filter((v) => v.experimental);

  const immutabilitySample = approved[0];
  if (
    immutabilitySample &&
    assertImmutablePublishedVersion(immutabilitySample, {
      confidence: immutabilitySample.confidence + 0.1,
    }).length === 0
  ) {
    violations.push(
      violation(
        "IMMUTABLE_VIOLATION",
        "Published versions must reject in-place mutation",
        immutabilitySample.knowledgeId,
        immutabilitySample.id,
      ),
    );
  }

  const lightingHistory = getKnowledgeVersionHistory("photo-warm-lighting-rule", catalog);
  if (lightingHistory.length < 2) {
    violations.push(
      violation("VERSION_HISTORY_LOST", "Lighting rule must preserve version history", "photo-warm-lighting-rule"),
    );
  }

  const snapshot = createKnowledgeSnapshot("validation-project", catalog);
  violations.push(...validateKnowledgeSnapshot(snapshot));

  if (context.skipValidation) {
    violations.push(violation("VALIDATION_FAILED", "Publishing without validation is invalid"));
  }

  return {
    valid: violations.length === 0,
    violations,
    versionCount: catalog.length,
    approvedCount: approved.length,
    experimentalCount: experimental.length,
    snapshotCapable: snapshot.reproducible,
    rollbackReady: lightingHistory.some((v) => v.previousVersionId),
    goldenRuleSatisfied: violations.length === 0,
  };
}

export function assertKnowledgeVersioning(): void {
  const report = validateKnowledgeVersioning();
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Knowledge versioning validation failed: ${messages}`);
  }
}

export function runKnowledgeVersioning(
  context: KnowledgeVersioningContext = {},
): KnowledgeVersioningReport {
  return validateKnowledgeVersioning(context);
}

export function isKnowledgeVersioningFailure(code: string): code is KnowledgeVersioningFailureCode {
  const codes: KnowledgeVersioningFailureCode[] = [
    "IMMUTABLE_VIOLATION",
    "INVALID_SEMVER",
    "INVALID_STATE_TRANSITION",
    "COMPATIBILITY_BREAK",
    "DEPENDENCY_BROKEN",
    "VALIDATION_FAILED",
    "SIMULATION_FAILED",
    "REGRESSION_FAILED",
    "COMMERCIAL_SCORE_DEGRADED",
    "ROLLBACK_UNAVAILABLE",
    "SNAPSHOT_INCOMPLETE",
    "AUDIT_MISSING",
    "UNAPPROVED_VERSION",
    "VERSION_HISTORY_LOST",
  ];
  return codes.includes(code as KnowledgeVersioningFailureCode);
}
