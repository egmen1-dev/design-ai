/**
 * Chapter 3.12 / 3.13 — Blueprint schema migrations (before validation)
 */
import type { RenderBlueprint } from "./types";
import { runMigrationChain } from "./blueprint-migration-engine";

export { extractUnknownBlueprintFields, mergeUnknownBlueprintFields } from "./blueprint-fields";
export {
  runMigrationChain,
  BLUEPRINT_MIGRATION_CHAIN,
  getMigration,
  nextMigrationVersion,
  registerMigration,
} from "./blueprint-migration-engine";

/** Migrate loaded blueprint to current schema version (upgrade-only chain) */
export function migrateBlueprint(
  input: Record<string, unknown>,
  unknownFields: Record<string, unknown> = {},
): { blueprint: RenderBlueprint; unknownFields: Record<string, unknown> } {
  const result = runMigrationChain(input, unknownFields);
  return {
    blueprint: result.blueprint as RenderBlueprint,
    unknownFields: result.unknownFields,
  };
}
