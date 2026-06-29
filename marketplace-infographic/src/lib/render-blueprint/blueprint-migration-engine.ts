/**
 * Chapter 3.13 — Migration engine (upgrade-only chain, no skipping)
 */
import type { BlueprintMigration, MigrationResult, MigrationStep } from "./blueprint-version-types";
import { createInitialLifecycleMeta } from "./lifecycle";
import { RENDER_BLUEPRINT_VERSION } from "./types";
import {
  CURRENT_BLUEPRINT_SCHEMA,
  formatBlueprintVersion,
  parseBlueprintVersion,
  readBlueprintSchemaVersion,
  writeBlueprintSchemaVersion,
} from "./blueprint-version";
import { extractUnknownBlueprintFields } from "./blueprint-fields";

const MIGRATION_1_0_TO_1_1: BlueprintMigration = {
  from: "1.0.0",
  to: "1.1.0",
  migrate(data) {
    const next = { ...data };
    if (!next.meta || typeof next.meta !== "object") {
      next.meta = {
        id: "migrated",
        version: 17,
        revision: 0,
        generator: "flux",
        createdAt: Date.now(),
        seed: 0,
        retry: 0,
        layout: "marketplace",
      };
    } else {
      const meta = next.meta as Record<string, unknown>;
      if (meta.revision === undefined) meta.revision = 0;
      if (meta.layout === undefined) meta.layout = "marketplace";
    }
    writeBlueprintSchemaVersion(next, "1.1.0");
    return next;
  },
};

const MIGRATION_1_1_TO_1_2: BlueprintMigration = {
  from: "1.1.0",
  to: "1.2.0",
  migrate(data) {
    const next = { ...data };
    if (next.constraints && typeof next.constraints === "object") {
      const c = next.constraints as Record<string, unknown>;
      if (c.noText !== undefined && c.mustAvoidText === undefined) {
        c.mustAvoidText = c.noText;
      }
      if (!c.set) {
        c.set = { constraints: [], revision: 0 };
      }
    } else {
      next.constraints = {
        mustLeaveHeadlineSpace: true,
        mustLeaveBadgeSpace: true,
        mustLeaveBenefitsSpace: true,
        mustAvoidText: true,
        mustAvoidDuplicateObjects: true,
        mustAvoidHeroOverlap: true,
        set: { constraints: [], revision: 0 },
      };
    }
    writeBlueprintSchemaVersion(next, "1.2.0");
    return next;
  },
};

const MIGRATION_1_2_TO_2_0: BlueprintMigration = {
  from: "1.2.0",
  to: "2.0.0",
  migrate(data) {
    const next = { ...data };

    if (!next.scene && next.environment) {
      next.scene = {
        environment: next.environment,
        architecture: "modern",
        timeOfDay: "day",
        weather: "clear",
        depth: "medium",
        surface: "matte",
      };
      delete next.environment;
    }

    if (!next.lifecycle) {
      next.lifecycle = createInitialLifecycleMeta();
    }

    const meta = next.meta as Record<string, unknown> | undefined;
    if (meta) {
      meta.version = RENDER_BLUEPRINT_VERSION;
      meta.schemaVersion = CURRENT_BLUEPRINT_SCHEMA;
      if (meta.revision === undefined) meta.revision = 0;
    }

    writeBlueprintSchemaVersion(next, CURRENT_BLUEPRINT_SCHEMA);
    return next;
  },
};

const MIGRATION_REGISTRY: BlueprintMigration[] = [
  MIGRATION_1_0_TO_1_1,
  MIGRATION_1_1_TO_1_2,
  MIGRATION_1_2_TO_2_0,
];

export const BLUEPRINT_MIGRATION_CHAIN = MIGRATION_REGISTRY.map((m) => ({
  from: m.from,
  to: m.to,
}));

export function getMigration(from: string, to: string): BlueprintMigration | undefined {
  return MIGRATION_REGISTRY.find((m) => m.from === from && m.to === to);
}

export function nextMigrationVersion(current: string): string | null {
  const step = MIGRATION_REGISTRY.find((m) => m.from === current);
  return step?.to ?? null;
}

/** Upgrade-only — walks chain one step at a time, never skips versions */
export function runMigrationChain(
  input: Record<string, unknown>,
  unknownFields: Record<string, unknown> = {},
  targetVersion: string = CURRENT_BLUEPRINT_SCHEMA,
): MigrationResult {
  let data = { ...input };
  const preserved = { ...unknownFields };
  let current = readBlueprintSchemaVersion(data);
  const chain: MigrationStep[] = [];

  if (compareMigrationPath(current, targetVersion) > 0) {
    throw new Error(`Downgrade forbidden: ${current} → ${targetVersion}`);
  }

  while (current !== targetVersion) {
    const step = MIGRATION_REGISTRY.find((m) => m.from === current);
    if (!step) {
      throw new Error(`No migration path from ${current} to ${targetVersion}`);
    }
    data = step.migrate(data);
    chain.push({ from: step.from, to: step.to });
    current = step.to;
  }

  if (!data.lifecycle) {
    data.lifecycle = createInitialLifecycleMeta();
  }

  writeBlueprintSchemaVersion(data, targetVersion);

  const { blueprint: cleaned, unknownFields: extra } = extractUnknownBlueprintFields(data);
  return {
    blueprint: cleaned,
    fromVersion: readBlueprintSchemaVersion(input),
    toVersion: targetVersion,
    chain,
    unknownFields: { ...preserved, ...extra },
  };
}

function compareMigrationPath(a: string, b: string): number {
  const va = parseBlueprintVersion(a);
  const vb = parseBlueprintVersion(b);
  if (va.major !== vb.major) return va.major - vb.major;
  if (va.minor !== vb.minor) return va.minor - vb.minor;
  return va.patch - vb.patch;
}

export function registerMigration(migration: BlueprintMigration): void {
  const existing = MIGRATION_REGISTRY.findIndex((m) => m.from === migration.from && m.to === migration.to);
  if (existing >= 0) {
    MIGRATION_REGISTRY[existing] = migration;
    return;
  }
  MIGRATION_REGISTRY.push(migration);
  MIGRATION_REGISTRY.sort((a, b) => compareMigrationPath(a.from, b.from));
}
