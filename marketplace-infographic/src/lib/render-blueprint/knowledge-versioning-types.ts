/**
 * Chapter 5.18 — Knowledge Versioning types
 */

export const KnowledgeVersionState = {
  DRAFT: "draft",
  VALIDATION: "validation",
  TESTING: "testing",
  APPROVED: "approved",
  DEPRECATED: "deprecated",
  ARCHIVED: "archived",
} as const;

export type KnowledgeVersionStateId =
  (typeof KnowledgeVersionState)[keyof typeof KnowledgeVersionState];

export const KnowledgeCompatibilityLevel = {
  COMPATIBLE: "compatible",
  PARTIALLY_COMPATIBLE: "partially_compatible",
  BREAKING_CHANGE: "breaking_change",
} as const;

export type KnowledgeCompatibilityLevelId =
  (typeof KnowledgeCompatibilityLevel)[keyof typeof KnowledgeCompatibilityLevel];

export const KnowledgeVersionBump = {
  MAJOR: "major",
  MINOR: "minor",
  PATCH: "patch",
} as const;

export type KnowledgeVersionBumpId =
  (typeof KnowledgeVersionBump)[keyof typeof KnowledgeVersionBump];

/** Core version contract per Chapter 5.18 */
export type KnowledgeVersion = {
  id: string;
  knowledgeId: string;
  version: string;
  createdAt: Date;
  author: string;
  changes: string[];
  status: KnowledgeVersionStateId;
  compatibility: KnowledgeCompatibilityLevelId;
  confidence: number;
  experimental?: boolean;
  dependencies?: string[];
  previousVersionId?: string;
  payloadRef?: string;
};

export type KnowledgeVersionAuditEntry = {
  id: string;
  knowledgeId: string;
  versionId: string;
  author: string;
  timestamp: Date;
  changedFields: string[];
  reason: string;
  validationPassed: boolean;
  resultingVersion: string;
};

export type KnowledgeRollbackRecord = {
  knowledgeId: string;
  fromVersionId: string;
  toVersionId: string;
  reason: string;
  timestamp: Date;
  preservedHistory: boolean;
  testResultsRetained: boolean;
};

export type KnowledgeSnapshot = {
  id: string;
  projectId: string;
  createdAt: Date;
  knowledgeVersions: Record<string, string>;
  patternVersions: Record<string, string>;
  marketplaceProfileVersions: Record<string, string>;
  rulesEngineVersion: string;
  reproducible: boolean;
};

export type KnowledgeVersionSelectionContext = {
  marketplace?: string;
  businessContext?: string;
  projectId?: string;
  requireApproved?: boolean;
  allowExperimental?: boolean;
  pinnedVersions?: Record<string, string>;
};

export type KnowledgeVersionSelection = {
  knowledgeId: string;
  selectedVersionId: string;
  version: string;
  status: KnowledgeVersionStateId;
  reason: string;
};

export type KnowledgeVersionViolation = {
  code: KnowledgeVersioningFailureCode;
  message: string;
  knowledgeId?: string;
  versionId?: string;
};

export type KnowledgeVersionPublishReport = {
  versionId: string;
  knowledgeId: string;
  published: boolean;
  status: KnowledgeVersionStateId;
  compatibility: KnowledgeCompatibilityLevelId;
  violations: KnowledgeVersionViolation[];
  auditEntry?: KnowledgeVersionAuditEntry;
  rollbackAvailable: boolean;
};

export type KnowledgeVersioningReport = {
  valid: boolean;
  violations: KnowledgeVersionViolation[];
  versionCount: number;
  approvedCount: number;
  experimentalCount: number;
  snapshotCapable: boolean;
  rollbackReady: boolean;
  goldenRuleSatisfied: boolean;
};

export type KnowledgeVersioningContext = {
  skipValidation?: boolean;
  allowBreakingPublish?: boolean;
  simulationPassed?: boolean;
  regressionPassed?: boolean;
  commercialScoreDelta?: number;
};

export type KnowledgeVersioningFailureCode =
  | "IMMUTABLE_VIOLATION"
  | "INVALID_SEMVER"
  | "INVALID_STATE_TRANSITION"
  | "COMPATIBILITY_BREAK"
  | "DEPENDENCY_BROKEN"
  | "VALIDATION_FAILED"
  | "SIMULATION_FAILED"
  | "REGRESSION_FAILED"
  | "COMMERCIAL_SCORE_DEGRADED"
  | "ROLLBACK_UNAVAILABLE"
  | "SNAPSHOT_INCOMPLETE"
  | "AUDIT_MISSING"
  | "UNAPPROVED_VERSION"
  | "VERSION_HISTORY_LOST";
