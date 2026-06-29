/**
 * Chapter 3.13 — Version Engine (compatibility validation, manifest, reports)
 */
import type { RenderBlueprint } from "./types";
import type {
  CompatibilityValidationResult,
  VersionManifest,
  VersionReport,
} from "./blueprint-version-types";
import { CompatibilityStatus } from "./blueprint-version-types";
import {
  CURRENT_BLUEPRINT_SCHEMA,
  CURRENT_PIPELINE_VERSION,
  compatibilityMessage,
  evaluateCompatibility,
  readBlueprintSchemaVersion,
} from "./blueprint-version";
import { runMigrationChain } from "./blueprint-migration-engine";
import type { AgentRegistry } from "./agent-registry";

export const DEFAULT_ADAPTER_VERSION = "3.11.0";

export class VersionEngineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VersionEngineError";
  }
}

export function buildVersionManifest(input: {
  blueprint: RenderBlueprint | Record<string, unknown>;
  pipelineVersion?: string;
  agents?: Record<string, string>;
  adapterVersion?: string;
}): VersionManifest {
  const raw =
    "meta" in input.blueprint
      ? (input.blueprint as Record<string, unknown>)
      : (input.blueprint as Record<string, unknown>);
  return {
    blueprint: readBlueprintSchemaVersion(raw),
    pipeline: input.pipelineVersion ?? CURRENT_PIPELINE_VERSION,
    agents: input.agents ?? {},
    adapter: input.adapterVersion ?? DEFAULT_ADAPTER_VERSION,
  };
}

export function buildVersionManifestFromRegistry(
  blueprint: RenderBlueprint,
  registry: AgentRegistry,
  adapterVersion: string = DEFAULT_ADAPTER_VERSION,
  pipelineVersion: string = CURRENT_PIPELINE_VERSION,
): VersionManifest {
  const agents: Record<string, string> = {};
  for (const descriptor of registry.listDescriptors()) {
    agents[descriptor.id] = descriptor.version;
  }
  return buildVersionManifest({ blueprint, pipelineVersion, agents, adapterVersion });
}

export function createVersionReport(input: {
  manifest: VersionManifest;
  migrationChain?: Array<{ from: string; to: string }>;
  compatibility?: ReturnType<typeof evaluateCompatibility>;
}): VersionReport {
  const compatibility =
    input.compatibility ??
    evaluateCompatibility(input.manifest.blueprint, input.manifest.pipeline);
  return {
    blueprint: input.manifest.blueprint,
    pipeline: input.manifest.pipeline,
    agents: { ...input.manifest.agents },
    adapter: input.manifest.adapter,
    migrationChain: input.migrationChain ?? [],
    compatibility,
  };
}

export function validateCompatibility(input: {
  blueprint: Record<string, unknown>;
  pipelineVersion?: string;
  agentVersions?: Record<string, string>;
  adapterVersion?: string;
  requiredAgents?: Record<string, string>;
}): CompatibilityValidationResult {
  const pipelineVersion = input.pipelineVersion ?? CURRENT_PIPELINE_VERSION;
  const blueprintVersion = readBlueprintSchemaVersion(input.blueprint);
  const status = evaluateCompatibility(blueprintVersion, pipelineVersion);
  const blueprintCheck = {
    status,
    blueprint: blueprintVersion,
    pipeline: pipelineVersion,
    message: compatibilityMessage(status, blueprintVersion, pipelineVersion),
  };

  const agentVersions = input.agentVersions ?? {};
  const requiredAgents = input.requiredAgents ?? {};
  const agents = Object.entries(requiredAgents).map(([id, requiredVersion]) => {
    const actual = agentVersions[id];
    if (!actual) {
      return { id, version: "", ok: false, message: `Missing agent version for ${id}` };
    }
    if (actual !== requiredVersion) {
      return {
        id,
        version: actual,
        ok: false,
        message: `Agent ${id} version mismatch: expected ${requiredVersion}, got ${actual}`,
      };
    }
    return { id, version: actual, ok: true };
  });

  const adapterVersion = input.adapterVersion ?? DEFAULT_ADAPTER_VERSION;
  const adapter = { version: adapterVersion, ok: true };

  const manifest = buildVersionManifest({
    blueprint: input.blueprint,
    pipelineVersion,
    agents: agentVersions,
    adapterVersion,
  });

  const ok =
    status !== CompatibilityStatus.UNSUPPORTED &&
    agents.every((a) => a.ok) &&
    adapter.ok;

  return {
    ok,
    blueprint: blueprintCheck,
    agents,
    adapter,
    report: createVersionReport({ manifest, compatibility: status }),
  };
}

/** Migrate if needed, then validate — pipeline must not run on unsupported schema */
export function prepareBlueprintForPipeline(
  input: Record<string, unknown>,
  unknownFields: Record<string, unknown> = {},
  options: {
    pipelineVersion?: string;
    targetVersion?: string;
  } = {},
): {
  blueprint: Record<string, unknown>;
  unknownFields: Record<string, unknown>;
  report: VersionReport;
} {
  const pipelineVersion = options.pipelineVersion ?? CURRENT_PIPELINE_VERSION;
  const targetVersion = options.targetVersion ?? CURRENT_BLUEPRINT_SCHEMA;
  const fromVersion = readBlueprintSchemaVersion(input);
  const status = evaluateCompatibility(fromVersion, pipelineVersion);

  if (status === CompatibilityStatus.UNSUPPORTED) {
    throw new VersionEngineError(
      compatibilityMessage(status, fromVersion, pipelineVersion),
    );
  }

  const migrated = runMigrationChain(input, unknownFields, targetVersion);
  const manifest = buildVersionManifest({
    blueprint: migrated.blueprint,
    pipelineVersion,
  });

  return {
    blueprint: migrated.blueprint,
    unknownFields: migrated.unknownFields,
    report: createVersionReport({
      manifest,
      migrationChain: migrated.chain,
      compatibility: evaluateCompatibility(targetVersion, pipelineVersion),
    }),
  };
}

export function assertPipelineCompatible(
  blueprint: Record<string, unknown>,
  pipelineVersion: string = CURRENT_PIPELINE_VERSION,
): void {
  const version = readBlueprintSchemaVersion(blueprint);
  const status = evaluateCompatibility(version, pipelineVersion);
  if (status === CompatibilityStatus.UNSUPPORTED) {
    throw new VersionEngineError(compatibilityMessage(status, version, pipelineVersion));
  }
}
