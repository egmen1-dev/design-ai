import fs from "node:fs";
import path from "node:path";

export type FeatureFlagLifecycleState =
  | "Draft"
  | "Shadow"
  | "Canary"
  | "Production"
  | "Deprecated"
  | "Removed";

export type FeatureFlagScope = "runtime";

export type FeatureFlagCategory =
  | "context"
  | "pipeline"
  | "scene-graph"
  | "benchmark"
  | "runtime";

export type FeatureFlagDefinition = {
  FlagId: string;
  Name: string;
  Owner: string;
  Description: string;
  DefaultValue: string;
  CurrentValue: string;
  Scope: FeatureFlagScope;
  Category: FeatureFlagCategory;
  LifecycleState: FeatureFlagLifecycleState;
  IntroducedInWave: number;
  PlannedRemovalWave: number | null;
  Consumers: string[];
  Dependencies: string[];
  Diagnostics: string[];
  Deprecated: boolean;
  Notes: string;
};

export type FeatureFlagRegistryDiagnostics = {
  RegistryVersion: number;
  discovery: {
    discoveredFlagCount: number;
    discoveredFlags: string[];
  };
  unregistered: {
    unregisteredFlagIds: string[];
  };
  registered: {
    flagCount: number;
    flags: Array<{
      FlagId: string;
      Owner: string;
      LifecycleState: FeatureFlagLifecycleState;
      Category: FeatureFlagCategory;
      CurrentValue: string;
      Consumers: string[];
      Dependencies: string[];
    }>;
  };
  duplicates: {
    duplicateFlagIds: string[];
  };
  unknownFlags: {
    unknownFlagIds: string[];
  };
  deprecatedCandidates: {
    deprecatedFlagIds: string[];
  };
  missingOwnership: {
    missingOwnerFlagIds: string[];
  };
  validationIssues: Array<{
    code:
      | "DUPLICATE_REGISTRATION"
      | "MISSING_OWNER"
      | "MISSING_LIFECYCLE_STATE"
      | "UNKNOWN_LIFECYCLE_STATE"
      | "MISSING_DESCRIPTION"
      | "INVALID_DEFAULT_VALUE";
    flagId?: string;
    message: string;
  }>;
};

const LIFECYCLE_STATES: Set<FeatureFlagLifecycleState> = new Set([
  "Draft",
  "Shadow",
  "Canary",
  "Production",
  "Deprecated",
  "Removed",
]);

const REGISTRY_VERSION = 1;

function isLifecycleState(value: string): value is FeatureFlagLifecycleState {
  return LIFECYCLE_STATES.has(value as FeatureFlagLifecycleState);
}

function inferOwner(flagId: string): string {
  const upper = flagId.toUpperCase();
  if (upper.includes("SCENE_GRAPH")) return "SceneGraph Runtime";
  if (upper.includes("PROMPT_CONTEXT") || upper.includes("RENDER_CONTEXT")) {
    return "GenerationContext Runtime";
  }
  if (upper.includes("V17_") && upper.includes("BRIDGE")) return "V17 Bridge Runtime";
  if (upper.includes("CONTEXT")) return "GenerationContext Runtime";
  return ""; // invalid/unknown owner by design for validation diagnostics
}

function inferCategory(flagId: string): FeatureFlagCategory {
  const upper = flagId.toUpperCase();
  if (upper.includes("SCENE_GRAPH")) return "scene-graph";
  if (upper.includes("PROMPT_CONTEXT") || upper.includes("RENDER_CONTEXT") || upper.includes("CONTEXT"))
    return "context";
  if (upper.includes("V17_") || upper.includes("BRIDGE")) return "pipeline";
  if (upper.includes("BENCHMARK")) return "benchmark";
  return "runtime";
}

function inferDefaultValue(flagId: string): string {
  // Wave 37 migration requires backward compatibility; legacy code treats DAOS flags as booleans.
  // Default to "0" when unset.
  return "0";
}

function inferLifecycleState(flagId: string): FeatureFlagLifecycleState {
  const upper = flagId.toUpperCase();
  if (upper.includes("_REMOVED")) return "Removed";
  if (upper.includes("_DEPRECATED")) return "Deprecated";
  if (upper.includes("_CANARY")) return "Canary";
  if (upper.includes("_SHADOW")) return "Shadow";
  return "Production";
}

function walkFiles(rootDir: string, exts: Set<string>): string[] {
  const out: string[] = [];
  const stack: string[] = [rootDir];

  while (stack.length) {
    const dir = stack.pop()!;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (
          e.name === "node_modules" ||
          e.name === ".next" ||
          e.name === "generated" ||
          e.name === "dist" ||
          e.name === ".git"
        ) {
          continue;
        }
        stack.push(p);
        continue;
      }
      const ext = path.extname(p).toLowerCase().replace(".", "");
      if (exts.has(ext)) out.push(p);
    }
  }
  return out;
}

function discoverDaosFlagIdsFromRepo(): {
  discoveredFlagIds: string[];
  sources: Record<string, Set<string>>;
} {
  // Discovery is deterministic and expensive; cache results per process.
  // (This module is server-only; Next runtime may import it multiple times.)
  // eslint-disable-next-line no-use-before-define
  if (cachedDiscovery) return cachedDiscovery;

  const repoRoot = path.resolve(__dirname, "../../../../../");
  const roots = [
    path.join(repoRoot, "marketplace-infographic", "tmp"),
    path.join(repoRoot, "docs"),
  ].filter((p) => fs.existsSync(p));

  const exts = new Set(["ts", "tsx", "md"]);
  const sources: Record<string, Set<string>> = {};
  const discovered = new Set<string>();

  const add = (flagId: string, sourcePath: string) => {
    if (!flagId) return;
    discovered.add(flagId);
    sources[flagId] ??= new Set<string>();
    sources[flagId]!.add(sourcePath);
  };

  const patterns = {
    processEnv: /\bprocess\.env\.(DAOS_[A-Z0-9_]+)\b/g,
    objKey: /\b(DAOS_[A-Z0-9_]+)\s*:/g,
    benchmarkEnvConstant: /\bBENCHMARK_(DAOS_[A-Z0-9_]+)\b/g,
    assignmentInDocs: /\b(DAOS_[A-Z0-9_]+)\s*=/g,
  };

  for (const root of roots) {
    const files = walkFiles(root, exts);
    for (const f of files) {
      const text = fs.readFileSync(f, "utf8");

      for (const m of text.matchAll(patterns.processEnv)) add(m[1], f);
      for (const m of text.matchAll(patterns.objKey)) add(m[1], f);
      for (const m of text.matchAll(patterns.benchmarkEnvConstant))
        add(m[1], f);
      for (const m of text.matchAll(patterns.assignmentInDocs))
        add(m[1], f);
    }
  }

  cachedDiscovery = { discoveredFlagIds: Array.from(discovered), sources };
  return cachedDiscovery;
}

let cachedDiscovery:
  | {
      discoveredFlagIds: string[];
      sources: Record<string, Set<string>>;
    }
  | null = null;

function validateFlagDefinition(def: FeatureFlagDefinition): {
  issues: FeatureFlagRegistryDiagnostics["validationIssues"];
} {
  const issues: FeatureFlagRegistryDiagnostics["validationIssues"] = [];

  if (!def.Owner.trim()) {
    issues.push({
      code: "MISSING_OWNER",
      flagId: def.FlagId,
      message: `Missing owner for ${def.FlagId}`,
    });
  }

  if (!def.Description.trim()) {
    issues.push({
      code: "MISSING_DESCRIPTION",
      flagId: def.FlagId,
      message: `Missing description for ${def.FlagId}`,
    });
  }

  if (!def.LifecycleState) {
    issues.push({
      code: "MISSING_LIFECYCLE_STATE",
      flagId: def.FlagId,
      message: `Missing lifecycle state for ${def.FlagId}`,
    });
  } else if (!isLifecycleState(def.LifecycleState)) {
    issues.push({
      code: "UNKNOWN_LIFECYCLE_STATE",
      flagId: def.FlagId,
      message: `Unknown lifecycle state ${def.LifecycleState} for ${def.FlagId}`,
    });
  }

  if (typeof def.DefaultValue !== "string" || def.DefaultValue.trim().length === 0) {
    issues.push({
      code: "INVALID_DEFAULT_VALUE",
      flagId: def.FlagId,
      message: `Invalid DefaultValue for ${def.FlagId}`,
    });
  }

  return { issues };
}

export type RuntimeFeatureFlagRegistry = {
  Register: (def: FeatureFlagDefinition) => void;
  Lookup: (flagId: string) => FeatureFlagDefinition | undefined;
  Resolve: (flagId: string) => string | undefined;
  List: () => FeatureFlagDefinition[];
  Diagnostics: () => FeatureFlagRegistryDiagnostics;
  Validate: () => FeatureFlagRegistryDiagnostics;
};

export function createRuntimeFeatureFlagRegistry(params?: {
  env?: NodeJS.ProcessEnv;
  introducedInWave?: number;
}): RuntimeFeatureFlagRegistry {
  const env = params?.env ?? process.env;
  const introducedInWave = params?.introducedInWave ?? 37;

  const { discoveredFlagIds } = discoverDaosFlagIdsFromRepo();

  const registry = new Map<string, FeatureFlagDefinition>();
  const duplicateFlagIds: string[] = [];

  const sourcesForDiagnostics = discoveredFlagIds;

  const registerDiscovered = () => {
    for (const flagId of discoveredFlagIds) {
      const Owner = inferOwner(flagId);
      const Category = inferCategory(flagId);
      const DefaultValue = inferDefaultValue(flagId);
      const LifecycleState = inferLifecycleState(flagId);

      const CurrentValue = env[flagId] ?? DefaultValue;

      const def: FeatureFlagDefinition = {
        FlagId: flagId,
        Name: flagId,
        Owner,
        Description: `Auto-discovered runtime feature flag ${flagId}`,
        DefaultValue,
        CurrentValue: String(CurrentValue),
        Scope: "runtime",
        Category,
        LifecycleState,
        IntroducedInWave: introducedInWave,
        PlannedRemovalWave: null,
        Consumers: [],
        Dependencies: [],
        Diagnostics: [],
        Deprecated: LifecycleState === "Deprecated" || LifecycleState === "Removed",
        Notes: "Discovered from repository usage patterns in Wave 37.",
      };
      registerInternal(def);
    }
  };

  const registerInternal = (def: FeatureFlagDefinition) => {
    if (registry.has(def.FlagId)) {
      if (!duplicateFlagIds.includes(def.FlagId)) duplicateFlagIds.push(def.FlagId);
      return;
    }
    registry.set(def.FlagId, def);
  };

  registerDiscovered();

  const diagnostics = (): FeatureFlagRegistryDiagnostics => {
    const registeredFlags = Array.from(registry.values());
    const validationIssues: FeatureFlagRegistryDiagnostics["validationIssues"] = [];
    for (const f of registeredFlags) {
      validationIssues.push(...validateFlagDefinition(f).issues);
    }

    const unregisteredFlagIds = sourcesForDiagnostics
      .filter((id) => !registry.has(id))
      .sort();

    const missingOwnerFlagIds = validationIssues
      .filter((i) => i.code === "MISSING_OWNER" && i.flagId)
      .map((i) => i.flagId!)
      .sort();

    // Unknown flags are env keys present at runtime which were not discovered as used.
    const unknownFlagIds = Object.keys(env)
      .filter((k) => k.startsWith("DAOS_") && !registry.has(k))
      .sort();

    const deprecatedFlagIds = registeredFlags
      .filter((f) => f.Deprecated || f.LifecycleState === "Deprecated" || f.LifecycleState === "Removed")
      .map((f) => f.FlagId)
      .sort();

    return {
      RegistryVersion: REGISTRY_VERSION,
      discovery: {
        discoveredFlagCount: sourcesForDiagnostics.length,
        discoveredFlags: [...sourcesForDiagnostics].sort(),
      },
      unregistered: {
        unregisteredFlagIds,
      },
      registered: {
        flagCount: registeredFlags.length,
        flags: registeredFlags
          .slice()
          .sort((a, b) => a.FlagId.localeCompare(b.FlagId))
          .map((f) => ({
            FlagId: f.FlagId,
            Owner: f.Owner,
            LifecycleState: f.LifecycleState,
            Category: f.Category,
            CurrentValue: f.CurrentValue,
            Consumers: f.Consumers,
            Dependencies: f.Dependencies,
          })),
      },
      duplicates: {
        duplicateFlagIds: duplicateFlagIds.sort(),
      },
      unknownFlags: {
        unknownFlagIds,
      },
      deprecatedCandidates: {
        deprecatedFlagIds,
      },
      missingOwnership: {
        missingOwnerFlagIds,
      },
      validationIssues,
    };
  };

  return {
    Register: (def) => registerInternal(def),
    Lookup: (flagId) => registry.get(flagId),
    Resolve: (flagId) => {
      const v = env[flagId];
      const known = registry.get(flagId);
      if (!known) return undefined;
      if (typeof v === "string" && v.length > 0) return v;
      return known.DefaultValue;
    },
    List: () => Array.from(registry.values()),
    Diagnostics: () => diagnostics(),
    Validate: () => diagnostics(),
  };
}

export function isDaosFlagId(flagId: string): boolean {
  return /^DAOS_[A-Z0-9_]+$/.test(flagId);
}

