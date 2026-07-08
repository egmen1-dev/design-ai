import fs from "node:fs";
import path from "node:path";

import type {
  FoundationObjectDefinition,
  FoundationObjectRegistry,
  FoundationObjectRegistryDiagnostics,
  FoundationObjectType,
  ValidationIssue,
} from "./types";

const REGISTRY_SCHEMA_VERSION = 1;

const ALLOWED_OBJECT_TYPES: Set<FoundationObjectType> = new Set([
  "GenerationContext",
  "MetricValue",
  "FeatureFlag",
]);

const SEMVER_RE = /^\d+\.\d+\.\d+$/;

const MARKETPLACE_ROOT = path.resolve(__dirname, "../../../..");

function resolveProducerAbsolutePath(producer: string): string {
  if (producer.startsWith("marketplace-infographic/")) {
    return path.resolve(MARKETPLACE_ROOT, "..", producer);
  }
  return path.resolve(MARKETPLACE_ROOT, producer);
}

function compareSemverDesc(a: string, b: string): number {
  const pa = a.split(".").map(Number);
  const pb = b.split(".").map(Number);
  for (let i = 0; i < 3; i++) {
    const diff = (pb[i] ?? 0) - (pa[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

function definitionKey(def: FoundationObjectDefinition): string {
  return `${def.ObjectId}@${def.SchemaVersion}`;
}

function isEligibleForRegistration(def: FoundationObjectDefinition): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  if (!def.ObjectId?.trim()) {
    issues.push({
      code: "REGISTRATION_INELIGIBLE",
      severity: "Error",
      objectId: def.ObjectId,
      message: "Missing stable identity (ObjectId)",
    });
  }
  if (!def.Owner?.trim()) {
    issues.push({
      code: "REGISTRATION_INELIGIBLE",
      severity: "Error",
      objectId: def.ObjectId,
      message: "Missing single owner",
    });
  }
  if (!def.Producer?.trim()) {
    issues.push({
      code: "REGISTRATION_INELIGIBLE",
      severity: "Error",
      objectId: def.ObjectId,
      message: "Missing producer",
    });
  }
  if (!def.Lifecycle?.currentState) {
    issues.push({
      code: "REGISTRATION_INELIGIBLE",
      severity: "Error",
      objectId: def.ObjectId,
      message: "Missing lifecycle",
    });
  }
  if (!def.SchemaVersion?.trim()) {
    issues.push({
      code: "REGISTRATION_INELIGIBLE",
      severity: "Error",
      objectId: def.ObjectId,
      message: "Missing schema version",
    });
  }
  if (!def.ValidationRules?.length) {
    issues.push({
      code: "REGISTRATION_INELIGIBLE",
      severity: "Error",
      objectId: def.ObjectId,
      message: "Missing validation rules",
    });
  }
  if (!def.Diagnostics?.length) {
    issues.push({
      code: "REGISTRATION_INELIGIBLE",
      severity: "Error",
      objectId: def.ObjectId,
      message: "Missing diagnostics",
    });
  }
  const hasConsumers = def.Consumers.length > 0;
  const hasDeferredNotes = def.Notes.trim().length > 0;
  if (!hasConsumers && !hasDeferredNotes) {
    issues.push({
      code: "REGISTRATION_INELIGIBLE",
      severity: "Error",
      objectId: def.ObjectId,
      message: "Missing consumers and deferred Notes",
    });
  }
  return issues;
}

function validateDefinition(
  def: FoundationObjectDefinition,
  knownObjectIds: Set<string>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = [...isEligibleForRegistration(def)];

  if (!ALLOWED_OBJECT_TYPES.has(def.ObjectType)) {
    issues.push({
      code: "UNKNOWN_OBJECT_TYPE",
      severity: "Error",
      objectId: def.ObjectId,
      message: `Unknown object type ${def.ObjectType}`,
    });
  }

  if (!def.Owner.trim()) {
    issues.push({
      code: "MISSING_OWNER",
      severity: "Error",
      objectId: def.ObjectId,
      message: `Missing owner for ${def.ObjectId}`,
    });
  }

  if (!def.Producer.trim()) {
    issues.push({
      code: "MISSING_PRODUCER",
      severity: "Error",
      objectId: def.ObjectId,
      message: `Missing producer for ${def.ObjectId}`,
    });
  } else if (!fs.existsSync(resolveProducerAbsolutePath(def.Producer))) {
    issues.push({
      code: "PRODUCER_UNREACHABLE",
      severity: "Error",
      objectId: def.ObjectId,
      message: `Producer module not found: ${def.Producer}`,
    });
  }

  if (!def.Lifecycle?.currentState) {
    issues.push({
      code: "MISSING_LIFECYCLE",
      severity: "Error",
      objectId: def.ObjectId,
      message: `Missing lifecycle for ${def.ObjectId}`,
    });
  }

  if (!def.Description.trim() || def.Description.trim().length < 10) {
    issues.push({
      code: "MISSING_DESCRIPTION",
      severity: "Error",
      objectId: def.ObjectId,
      message: `Missing or insufficient description for ${def.ObjectId}`,
    });
  }

  if (!def.SchemaVersion.trim()) {
    issues.push({
      code: "MISSING_VERSION",
      severity: "Error",
      objectId: def.ObjectId,
      message: `Missing schema version for ${def.ObjectId}`,
    });
  } else if (!SEMVER_RE.test(def.SchemaVersion)) {
    issues.push({
      code: "INVALID_VERSION",
      severity: "Error",
      objectId: def.ObjectId,
      message: `Invalid semver ${def.SchemaVersion} for ${def.ObjectId}`,
    });
  }

  if (def.Consumers.length === 0 && def.Notes.trim().length > 0) {
    issues.push({
      code: "INCOMPLETE_CONSUMERS",
      severity: "Warning",
      objectId: def.ObjectId,
      message: `Consumers deferred for ${def.ObjectId}`,
    });
  }

  for (const dep of def.Dependencies) {
    if (dep.startsWith("FOUNDATION.")) {
      if (!knownObjectIds.has(dep)) {
        issues.push({
          code: "INVALID_DEPENDENCY",
          severity: "Error",
          objectId: def.ObjectId,
          message: `Unknown foundation dependency ${dep} for ${def.ObjectId}`,
        });
      }
    }
  }

  return issues;
}

function detectDuplicates(definitions: FoundationObjectDefinition[]): {
  duplicateObjectIds: string[];
  duplicateSchemaVersions: Array<{ objectId: string; schemaVersion: string }>;
  issues: ValidationIssue[];
} {
  const duplicateObjectIds: string[] = [];
  const duplicateSchemaVersions: Array<{ objectId: string; schemaVersion: string }> = [];
  const issues: ValidationIssue[] = [];

  const byObjectId = new Map<string, FoundationObjectType>();
  const seenVersionKeys = new Set<string>();

  for (const def of definitions) {
    const versionKey = definitionKey(def);
    if (seenVersionKeys.has(versionKey)) {
      duplicateSchemaVersions.push({
        objectId: def.ObjectId,
        schemaVersion: def.SchemaVersion,
      });
      issues.push({
        code: "DUPLICATE_SCHEMA_VERSION",
        severity: "Error",
        objectId: def.ObjectId,
        message: `Duplicate schema version ${def.SchemaVersion} for ${def.ObjectId}`,
      });
    }
    seenVersionKeys.add(versionKey);

    const prevType = byObjectId.get(def.ObjectId);
    if (prevType && prevType !== def.ObjectType) {
      if (!duplicateObjectIds.includes(def.ObjectId)) {
        duplicateObjectIds.push(def.ObjectId);
      }
      issues.push({
        code: "DUPLICATE_OBJECT_ID",
        severity: "Error",
        objectId: def.ObjectId,
        message: `Conflicting ObjectType for ${def.ObjectId}`,
      });
    } else {
      byObjectId.set(def.ObjectId, def.ObjectType);
    }
  }

  return {
    duplicateObjectIds: duplicateObjectIds.sort(),
    duplicateSchemaVersions,
    issues,
  };
}

function detectDependencyCycles(definitions: FoundationObjectDefinition[]): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const graph = new Map<string, string[]>();
  for (const def of definitions) {
    graph.set(
      def.ObjectId,
      def.Dependencies.filter((d) => d.startsWith("FOUNDATION.")),
    );
  }

  const visiting = new Set<string>();
  const visited = new Set<string>();

  const visit = (node: string): boolean => {
    if (visited.has(node)) return false;
    if (visiting.has(node)) return true;
    visiting.add(node);
    for (const dep of graph.get(node) ?? []) {
      if (visit(dep)) return true;
    }
    visiting.delete(node);
    visited.add(node);
    return false;
  };

  for (const def of definitions) {
    if (visit(def.ObjectId)) {
      issues.push({
        code: "INVALID_DEPENDENCY",
        severity: "Error",
        objectId: def.ObjectId,
        message: `Dependency cycle detected involving ${def.ObjectId}`,
      });
      break;
    }
  }

  return issues;
}

function buildDiagnostics(
  definitions: FoundationObjectDefinition[],
  bootstrapComplete: boolean,
): FoundationObjectRegistryDiagnostics {
  const knownObjectIds = new Set(definitions.map((d) => d.ObjectId));
  const duplicateInfo = detectDuplicates(definitions);
  const validationIssues: ValidationIssue[] = [...duplicateInfo.issues];

  for (const def of definitions) {
    validationIssues.push(...validateDefinition(def, knownObjectIds));
  }
  validationIssues.push(...detectDependencyCycles(definitions));

  const missingOwnerIds = definitions
    .filter((d) => !d.Owner.trim())
    .map((d) => d.ObjectId)
    .sort();

  const missingProducerIds = definitions
    .filter(
      (d) =>
        !d.Producer.trim() || !fs.existsSync(resolveProducerAbsolutePath(d.Producer)),
    )
    .map((d) => d.ObjectId)
    .sort();

  const definitionsByType: Record<string, number> = {};
  const definitionsByOwner: Record<string, number> = {};
  let activeCount = 0;
  let deprecatedCount = 0;

  for (const def of definitions) {
    definitionsByType[def.ObjectType] = (definitionsByType[def.ObjectType] ?? 0) + 1;
    definitionsByOwner[def.Owner] = (definitionsByOwner[def.Owner] ?? 0) + 1;
    if (def.Lifecycle.currentState === "Active" || def.Lifecycle.currentState === "Initialized") {
      activeCount++;
    }
    if (
      def.Lifecycle.currentState === "Deprecated" ||
      def.Lifecycle.currentState === "Archived"
    ) {
      deprecatedCount++;
    }
  }

  const objectTypes = new Set(definitions.map((d) => d.ObjectType));

  const hasErrors = validationIssues.some((i) => i.severity === "Error");
  const foundationRegistryHealthy =
    bootstrapComplete &&
    definitions.length === 3 &&
    objectTypes.size === 3 &&
    duplicateInfo.duplicateObjectIds.length === 0 &&
    duplicateInfo.duplicateSchemaVersions.length === 0 &&
    missingOwnerIds.length === 0 &&
    missingProducerIds.length === 0 &&
    !hasErrors;

  return {
    registrySchemaVersion: REGISTRY_SCHEMA_VERSION,
    bootstrapComplete,
    foundationRegistryHealthy,
    registeredObjects: definitions.slice().sort((a, b) => {
      const idCmp = a.ObjectId.localeCompare(b.ObjectId);
      if (idCmp !== 0) return idCmp;
      return compareSemverDesc(b.SchemaVersion, a.SchemaVersion);
    }),
    duplicates: {
      duplicateObjectIds: duplicateInfo.duplicateObjectIds,
      duplicateSchemaVersions: duplicateInfo.duplicateSchemaVersions,
    },
    missingOwners: { objectIds: missingOwnerIds },
    missingProducers: { objectIds: missingProducerIds },
    dependencyGraph: definitions
      .map((d) => ({
        producer: d.Producer,
        objectId: d.ObjectId,
        consumers: [...d.Consumers].sort(),
      }))
      .sort((a, b) => a.objectId.localeCompare(b.objectId)),
    validationIssues,
    schemaVersions: definitions
      .map((d) => ({
        objectId: d.ObjectId,
        schemaVersion: d.SchemaVersion,
        lifecycleState: d.Lifecycle.currentState,
      }))
      .sort((a, b) => {
        const idCmp = a.objectId.localeCompare(b.objectId);
        if (idCmp !== 0) return idCmp;
        return compareSemverDesc(b.schemaVersion, a.schemaVersion);
      }),
    objectStatistics: {
      totalDefinitions: definitions.length,
      totalObjectTypes: objectTypes.size,
      definitionsByType,
      definitionsByOwner,
      activeCount,
      deprecatedCount,
    },
  };
}

export function getBootstrapFoundationObjectDefinitions(): FoundationObjectDefinition[] {
  return [
    {
      ObjectId: "FOUNDATION.FEATURE_FLAG",
      ObjectName: "FeatureFlag",
      ObjectType: "FeatureFlag",
      Description:
        "Governed runtime feature flag definition for DAOS_* environment keys with ownership and lifecycle metadata.",
      Owner: "Feature Flag Registry",
      Producer:
        "marketplace-infographic/src/lib/daos/feature-flag-registry/feature-flag-registry.ts",
      Consumers: [],
      Lifecycle: { currentState: "Active", instanceMutability: "Immutable" },
      SchemaVersion: "1.0.0",
      Dependencies: ["process.env (read-only, external)"],
      ValidationRules: [
        "FlagId MUST match ^DAOS_[A-Z0-9_]+$",
        "Owner MUST be non-empty per flag definition",
        "LifecycleState MUST be valid enum",
        "DefaultValue MUST be non-empty string",
        "registry MUST NOT write to process.env",
      ],
      Diagnostics: [
        "featureFlagTypeRegistered",
        "delegatedRegistryVersion",
        "foundationFlagCount",
        "discovery.discoveredFlagCount",
        "registered.flagCount",
        "unknownFlags.unknownFlagIds",
        "validationIssues",
      ],
      Notes:
        "Wave 37 producer. Lifecycle governance owner: Platform Governance. Per-flag consumers deferred.",
    },
    {
      ObjectId: "FOUNDATION.METRIC_VALUE",
      ObjectName: "MetricValue",
      ObjectType: "MetricValue",
      Description:
        "Immutable computed metric result emitted by the Metric Registry with value, unit, provenance, and formula version.",
      Owner: "Metric Registry",
      Producer: "marketplace-infographic/src/lib/daos/metric-registry/metric-registry.ts",
      Consumers: [
        "marketplace-infographic/src/lib/scene-graph/SceneGraphLaw003V2.ts",
        "marketplace-infographic/src/lib/scene-graph/SceneGraphConstitutionMirror.ts",
      ],
      Lifecycle: { currentState: "Active", instanceMutability: "Immutable" },
      SchemaVersion: "1.0.0",
      Dependencies: ["FOUNDATION.FEATURE_FLAG"],
      ValidationRules: [
        "metricId MUST be in registered metric catalog",
        "value MUST be finite number",
        "owner MUST match registration Owner",
        "formulaVersion MUST match catalog entry",
        "createdAt MUST be ISO-8601",
      ],
      Diagnostics: [
        "metricValueTypeRegistered",
        "registeredMetricIds",
        "metricRegistryDelegationActive",
        "lastMetricShadowDiagnostic",
      ],
      Notes:
        "Wave 35 producer. Product geometry metric domain owner: SceneGraph. Pilot metric METRIC_PRODUCT_AREA_RATIO only.",
    },
    {
      ObjectId: "FOUNDATION.GENERATION_CONTEXT",
      ObjectName: "GenerationContext",
      ObjectType: "GenerationContext",
      Description:
        "Immutable single source of truth for one commercial generation run with product, marketplace, mode, assets, and provider context.",
      Owner: "GenerationContext",
      Producer:
        "marketplace-infographic/src/lib/daos/generation-context/build-generation-context.ts",
      Consumers: ["marketplace-infographic/src/lib/daos/debug/daos-debug-bundle.ts"],
      Lifecycle: { currentState: "Active", instanceMutability: "Immutable" },
      SchemaVersion: "1.0.0",
      Dependencies: [
        "FOUNDATION.FEATURE_FLAG",
        "marketplace-infographic/src/lib/daos/config/generation-mode.ts",
      ],
      ValidationRules: [
        "metadata.generationId, projectId, runId REQUIRED when instance exists",
        "schemaVersion MUST match registered SchemaVersion",
        "instance MUST be deep-frozen after build",
        "completenessScore and missingFields diagnostics MUST be computable",
      ],
      Diagnostics: [
        "generationContextRegistered",
        "generationContextSchemaVersion",
        "generationContextProducerPath",
        "generationContextCreated",
        "generationContextCompleteness",
        "generationContextMissingFields",
      ],
      Notes:
        "Wave 36 producer. Instance creation gated by DAOS_GENERATION_CONTEXT. Downstream consumer mapping deferred.",
    },
  ];
}

function freezeDefinitions(
  definitions: FoundationObjectDefinition[],
): FoundationObjectDefinition[] {
  return definitions.map((d) => Object.freeze(structuredClone(d)));
}

function buildRegistryFromDefinitions(
  definitions: FoundationObjectDefinition[],
): FoundationObjectRegistry {
  const frozen = freezeDefinitions(definitions);
  const byKey = new Map<string, FoundationObjectDefinition>();
  for (const def of frozen) {
    byKey.set(definitionKey(def), def);
  }

  const latestByObjectId = (objectId: string): FoundationObjectDefinition | undefined => {
    const versions = frozen
      .filter((d) => d.ObjectId === objectId)
      .sort((a, b) => compareSemverDesc(a.SchemaVersion, b.SchemaVersion));
    return versions.find((d) => d.Lifecycle.currentState === "Active") ?? versions[0];
  };

  const latestByType = (
    objectType: FoundationObjectType,
  ): FoundationObjectDefinition | undefined => {
    const versions = frozen
      .filter((d) => d.ObjectType === objectType)
      .sort((a, b) => compareSemverDesc(a.SchemaVersion, b.SchemaVersion));
    return versions.find((d) => d.Lifecycle.currentState === "Active") ?? versions[0];
  };

  const diagnostics = (): FoundationObjectRegistryDiagnostics =>
    buildDiagnostics(frozen, true);

  return Object.freeze({
    Lookup: (objectType) => latestByType(objectType),
    LookupById: (objectId) => latestByObjectId(objectId),
    LookupVersion: (objectId, schemaVersion) =>
      byKey.get(`${objectId}@${schemaVersion}`),
    List: () =>
      frozen
        .slice()
        .sort((a, b) => {
          const idCmp = a.ObjectId.localeCompare(b.ObjectId);
          if (idCmp !== 0) return idCmp;
          return compareSemverDesc(b.SchemaVersion, a.SchemaVersion);
        }),
    ListVersions: (objectId) =>
      frozen
        .filter((d) => d.ObjectId === objectId)
        .sort((a, b) => compareSemverDesc(a.SchemaVersion, b.SchemaVersion)),
    Diagnostics: diagnostics,
    Validate: diagnostics,
  });
}

let cachedRegistry: FoundationObjectRegistry | null = null;

export function createFoundationObjectRegistry(): FoundationObjectRegistry {
  if (cachedRegistry) return cachedRegistry;
  cachedRegistry = buildRegistryFromDefinitions(getBootstrapFoundationObjectDefinitions());
  return cachedRegistry;
}

/** Test-only factory — not exposed from public index. */
export function createFoundationObjectRegistryForTest(
  definitions: FoundationObjectDefinition[],
): FoundationObjectRegistry {
  return buildRegistryFromDefinitions(definitions);
}

export function resetFoundationObjectRegistryCacheForTest(): void {
  cachedRegistry = null;
}
