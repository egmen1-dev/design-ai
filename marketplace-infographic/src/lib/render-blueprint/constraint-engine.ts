/**
 * Chapter 3.7 — Constraint Engine
 * Read-only — never mutates RenderBlueprint or makes design decisions.
 */
import type { RenderBlueprint } from "./types";
import { DEFAULT_CONSTRAINT_PROVIDERS } from "./constraint-providers";
import {
  ConstraintSource,
  ResolutionStrategy,
  SOURCE_RESOLUTION_ORDER,
  type Constraint,
  type ConstraintConflict,
  type ConstraintEngineOptions,
  type ConstraintProvider,
  type ConstraintReport,
  type ConstraintSet,
  type ResolutionStrategyId,
} from "./constraint-types";

export {
  ConstraintCategory,
  ConstraintPriority,
  ConstraintSource,
  ResolutionStrategy,
  SOURCE_RESOLUTION_ORDER,
  type Constraint,
  type ConstraintSet,
  type ConstraintConflict,
  type ConstraintReport,
  type ConstraintProvider,
  type ConstraintEngineOptions,
  type ConstraintPayload,
  type ConstraintCategoryId,
  type ResolutionStrategyId,
} from "./constraint-types";

export {
  DEFAULT_CONSTRAINT_PROVIDERS,
  SAFETY_CONSTRAINT_PROVIDER,
  MARKETPLACE_CONSTRAINT_PROVIDER,
  CREATIVE_CONSTRAINT_PROVIDER,
  STORY_CONSTRAINT_PROVIDER,
  COMPOSITION_CONSTRAINT_PROVIDER,
  GOVERNANCE_CONSTRAINT_PROVIDER,
  PROVIDER_FLUX_CONSTRAINT_PROVIDER,
  ARCHITECTURE_CONSTRAINT_PROVIDER,
  userConstraintsFromFlags,
} from "./constraint-providers";

export class ConstraintEngineError extends Error {
  readonly code = "CONSTRAINT_FAILED";

  constructor(message: string) {
    super(message);
    this.name = "ConstraintEngineError";
  }
}

const CONFLICT_PAIRS: Array<{
  a: string;
  b: string;
  message: string;
  strategy: ResolutionStrategyId;
}> = [
  {
    a: "scene.environment-outdoor",
    b: "scene.environment-indoor",
    message: "Outdoor and indoor environment requirements conflict",
    strategy: ResolutionStrategy.KEEP_HIGHER_PRIORITY,
  },
  {
    a: "camera.distance-close",
    b: "camera.distance-far",
    message: "Camera distance close and far conflict",
    strategy: ResolutionStrategy.KEEP_HIGHER_PRIORITY,
  },
  {
    a: "lighting.warm-preferred",
    b: "lighting.cool-preferred",
    message: "Warm and cool lighting preferences conflict",
    strategy: ResolutionStrategy.KEEP_HIGHER_PRIORITY,
  },
];

function sourceTier(source: Constraint["source"]): number {
  const idx = SOURCE_RESOLUTION_ORDER.indexOf(source);
  return idx === -1 ? 0 : SOURCE_RESOLUTION_ORDER.length - idx;
}

function pickWinner(a: Constraint, b: Constraint): Constraint {
  const tierA = sourceTier(a.source);
  const tierB = sourceTier(b.source);
  if (tierA !== tierB) return tierA > tierB ? a : b;
  if (a.priority !== b.priority) return a.priority > b.priority ? a : b;
  return a.hard && !b.hard ? a : b;
}

function mergeNumericThreshold(
  existing: Constraint,
  incoming: Constraint,
): Constraint {
  const ex = existing.payload as { minimum?: number; maximum?: number };
  const inc = incoming.payload as { minimum?: number; maximum?: number };
  return {
    ...pickWinner(existing, incoming),
    payload: {
      minimum:
        ex.minimum !== undefined && inc.minimum !== undefined
          ? Math.max(ex.minimum, inc.minimum)
          : ex.minimum ?? inc.minimum,
      maximum:
        ex.maximum !== undefined && inc.maximum !== undefined
          ? Math.min(ex.maximum, inc.maximum)
          : ex.maximum ?? inc.maximum,
    },
  };
}

function mergeDuplicates(group: Constraint[]): Constraint {
  if (group.length === 1) return group[0]!;
  let merged = group[0]!;
  for (let i = 1; i < group.length; i++) {
    const next = group[i]!;
    const ex = merged.payload as Record<string, unknown>;
    const inc = next.payload as Record<string, unknown>;
    if ("minimum" in ex || "maximum" in ex || "minimum" in inc || "maximum" in inc) {
      merged = mergeNumericThreshold(merged, next);
    } else {
      merged = pickWinner(merged, next);
    }
  }
  return merged;
}

function collectConstraints(
  blueprint: Readonly<RenderBlueprint>,
  providers: ConstraintProvider[],
  userConstraints: Constraint[],
): Constraint[] {
  const raw: Constraint[] = [];
  for (const provider of providers) {
    raw.push(...provider.provide(blueprint));
  }
  raw.push(...userConstraints.filter((c) => c.enabled));
  return raw.filter((c) => c.enabled);
}

function dedupeConstraints(constraints: Constraint[]): Constraint[] {
  const byCanonical = new Map<string, Constraint[]>();
  for (const c of constraints) {
    const list = byCanonical.get(c.canonicalId) ?? [];
    list.push(c);
    byCanonical.set(c.canonicalId, list);
  }
  return [...byCanonical.values()].map(mergeDuplicates);
}

function detectConflicts(merged: Constraint[]): ConstraintConflict[] {
  const ids = new Set(merged.map((c) => c.canonicalId));
  const conflicts: ConstraintConflict[] = [];

  for (const pair of CONFLICT_PAIRS) {
    if (!ids.has(pair.a) || !ids.has(pair.b)) continue;
    const a = merged.find((c) => c.canonicalId === pair.a)!;
    const b = merged.find((c) => c.canonicalId === pair.b)!;
    const winner = pickWinner(a, b);
    conflicts.push({
      a: pair.a,
      b: pair.b,
      message: pair.message,
      strategy: pair.strategy,
      winnerId: winner.canonicalId,
      resolved: true,
    });
    if (winner.canonicalId === pair.a) {
      const idx = merged.findIndex((c) => c.canonicalId === pair.b);
      if (idx >= 0) merged.splice(idx, 1);
    } else {
      const idx = merged.findIndex((c) => c.canonicalId === pair.a);
      if (idx >= 0) merged.splice(idx, 1);
    }
  }

  return conflicts;
}

function validateMergedSet(merged: Constraint[]): string[] {
  const issues: string[] = [];
  for (const c of merged) {
    if (!c.id || !c.canonicalId) issues.push(`Constraint missing id`);
    if (c.priority < 0 || c.priority > 100) {
      issues.push(`Constraint ${c.id} has invalid priority ${c.priority}`);
    }
    const p = c.payload as Record<string, unknown>;
    if ("minimum" in p && "maximum" in p && p.minimum !== undefined && p.maximum !== undefined) {
      if ((p.minimum as number) > (p.maximum as number)) {
        issues.push(`Constraint ${c.id} has minimum > maximum`);
      }
    }
  }
  return issues;
}

function countIgnored(constraints: Constraint[]): number {
  return constraints.filter((c) => c.providerInternal).length;
}

export class ConstraintEngine {
  private readonly providers: ConstraintProvider[];
  private readonly defaultStrategy: ResolutionStrategyId;
  private readonly cache = new Map<string, ConstraintReport>();

  constructor(options: Pick<ConstraintEngineOptions, "providers" | "defaultStrategy"> = {}) {
    this.providers = options.providers ?? DEFAULT_CONSTRAINT_PROVIDERS;
    this.defaultStrategy = options.defaultStrategy ?? ResolutionStrategy.KEEP_HIGHER_PRIORITY;
  }

  registerProvider(provider: ConstraintProvider): void {
    this.providers.push(provider);
  }

  invalidateCache(revision?: number): void {
    if (revision === undefined) {
      this.cache.clear();
      return;
    }
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${revision}:`)) this.cache.delete(key);
    }
  }

  /**
   * Merge constraints from all sources, detect conflicts, produce report.
   * Never mutates blueprint.
   */
  evaluate(
    blueprint: Readonly<RenderBlueprint>,
    options: ConstraintEngineOptions = {},
  ): ConstraintReport {
    const revision = blueprint.meta.revision ?? 0;
    const stage = blueprint.lifecycle.stage;
    const cacheKey = `${revision}:${stage}`;
    const hit = this.cache.get(cacheKey);
    if (hit) return { ...hit, cached: true };

    const started = Date.now();
    const providers = options.providers ?? this.providers;
    const userConstraints = options.userConstraints ?? [];
    const strategy = options.defaultStrategy ?? this.defaultStrategy;

    const raw = collectConstraints(blueprint, providers, userConstraints);
    const mergedList = dedupeConstraints(raw);
    const conflicts = detectConflicts(mergedList);
    const validationIssues = validateMergedSet(mergedList);

    const unresolvedHard = conflicts.filter(
      (c) => c.strategy === ResolutionStrategy.FAIL && !c.resolved,
    );
    const passed = validationIssues.length === 0 && unresolvedHard.length === 0;

    const mergedSet: ConstraintSet = {
      constraints: mergedList,
      revision,
    };

    const report: ConstraintReport = {
      revision,
      stage,
      passed,
      totalConstraints: raw.length,
      activeConstraints: mergedList.length,
      ignoredConstraints: countIgnored(mergedList),
      mergedSet,
      conflicts,
      resolutionStrategy: strategy,
      durationMs: Date.now() - started,
      cached: false,
    };

    if (validationIssues.length) {
      (report as ConstraintReport & { validationIssues?: string[] }).validationIssues =
        validationIssues;
    }

    this.cache.set(cacheKey, report);
    return report;
  }

  /** Assert constraints pass — used before Render Adapter */
  assertReady(
    blueprint: Readonly<RenderBlueprint>,
    options: ConstraintEngineOptions = {},
  ): ConstraintReport {
    const report = this.evaluate(blueprint, options);
    if (!report.passed) {
      const detail =
        (report as ConstraintReport & { validationIssues?: string[] }).validationIssues?.join(
          "; ",
        ) ??
        report.conflicts
          .filter((c) => !c.resolved)
          .map((c) => c.message)
          .join("; ");
      throw new ConstraintEngineError(`Constraint evaluation failed: ${detail || "unresolved conflict"}`);
    }
    return report;
  }
}

/** Provider capability view — excludes Design AI internal marketplace fields */
export function constraintsForProviderCapability(report: ConstraintReport): Constraint[] {
  return report.mergedSet.constraints.filter((c) => !c.providerInternal);
}
