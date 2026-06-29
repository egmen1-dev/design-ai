/**
 * Chapter 3.13 — Blueprint Versioning types
 */

export type BlueprintVersion = {
  major: number;
  minor: number;
  patch: number;
};

export const CompatibilityStatus = {
  NATIVE: "native",
  MIGRATION: "migration",
  UNSUPPORTED: "unsupported",
} as const;

export type CompatibilityStatusId = (typeof CompatibilityStatus)[keyof typeof CompatibilityStatus];

export type BlueprintMigration = {
  from: string;
  to: string;
  migrate(blueprint: Record<string, unknown>): Record<string, unknown>;
};

export type VersionManifest = {
  blueprint: string;
  pipeline: string;
  agents: Record<string, string>;
  adapter: string;
};

export type CompatibilityCheck = {
  status: CompatibilityStatusId;
  blueprint: string;
  pipeline: string;
  message: string;
};

export type MigrationStep = {
  from: string;
  to: string;
};

export type MigrationResult = {
  blueprint: Record<string, unknown>;
  fromVersion: string;
  toVersion: string;
  chain: MigrationStep[];
  unknownFields: Record<string, unknown>;
};

export type VersionReport = {
  blueprint: string;
  pipeline: string;
  agents: Record<string, string>;
  adapter: string;
  migrationChain: MigrationStep[];
  compatibility: CompatibilityStatusId;
};

export type CompatibilityValidationResult = {
  ok: boolean;
  blueprint: CompatibilityCheck;
  agents: Array<{ id: string; version: string; ok: boolean; message?: string }>;
  adapter: { version: string; ok: boolean; message?: string };
  report: VersionReport;
};

export type SnapshotVersionRecord = {
  blueprintVersion: string;
  pipelineVersion: string;
  agentVersions: Record<string, string>;
  adapterVersion: string;
};
