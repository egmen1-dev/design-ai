/**
 * Chapter 3.7 — Constraint Engine types
 * Constraints are typed objects — free-text rules are forbidden.
 */
import type { BlueprintLifecycle } from "./lifecycle-types";

export const ConstraintCategory = {
  LAYOUT: "LAYOUT",
  COMPOSITION: "COMPOSITION",
  BACKGROUND: "BACKGROUND",
  LIGHTING: "LIGHTING",
  CAMERA: "CAMERA",
  TYPOGRAPHY: "TYPOGRAPHY",
  MARKETPLACE: "MARKETPLACE",
  PROVIDER: "PROVIDER",
  USER: "USER",
  SAFETY: "SAFETY",
} as const;

export type ConstraintCategoryId = (typeof ConstraintCategory)[keyof typeof ConstraintCategory];

export const ConstraintPriority = {
  CRITICAL: 100,
  REQUIRED: 80,
  PREFERRED: 50,
  OPTIONAL: 20,
} as const;

export type ConstraintPriorityId = (typeof ConstraintPriority)[keyof typeof ConstraintPriority];

/** Resolution order — higher tier wins over lower */
export const ConstraintSource = {
  SAFETY: "Safety",
  ARCHITECTURE: "Architecture",
  MARKETPLACE: "Marketplace",
  PROVIDER: "Provider",
  CREATIVE: "Creative",
  STORY: "Story",
  COMPOSITION: "Composition",
  USER: "User",
  GOVERNANCE: "Governance",
} as const;

export type ConstraintSourceId = (typeof ConstraintSource)[keyof typeof ConstraintSource];

export const SOURCE_RESOLUTION_ORDER: readonly ConstraintSourceId[] = [
  ConstraintSource.SAFETY,
  ConstraintSource.ARCHITECTURE,
  ConstraintSource.MARKETPLACE,
  ConstraintSource.PROVIDER,
  ConstraintSource.CREATIVE,
  ConstraintSource.STORY,
  ConstraintSource.COMPOSITION,
  ConstraintSource.USER,
  ConstraintSource.GOVERNANCE,
];

export const ResolutionStrategy = {
  KEEP_HIGHER_PRIORITY: "KEEP_HIGHER_PRIORITY",
  KEEP_PROVIDER: "KEEP_PROVIDER",
  KEEP_MARKETPLACE: "KEEP_MARKETPLACE",
  FAIL: "FAIL",
} as const;

export type ResolutionStrategyId =
  (typeof ResolutionStrategy)[keyof typeof ResolutionStrategy];

/** Typed payloads — no free-text constraint values */
export type NumericThresholdPayload = { minimum?: number; maximum?: number };
export type BooleanFlagPayload = { enabled: boolean };
export type AspectRatioPayload = { value: "3:4" | "1:1" | "4:3" };
export type SafeMarginsPayload = { top: number; right: number; bottom: number; left: number };
export type EnvironmentPayload = { mode: "indoor" | "outdoor" };
export type CameraDistancePayload = { distance: "close" | "medium" | "far" };
export type ProviderExclusionPayload = { fields: readonly string[] };
export type LightingTonePayload = { tone: "warm" | "cool" | "neutral" };

export type ConstraintPayload =
  | NumericThresholdPayload
  | BooleanFlagPayload
  | AspectRatioPayload
  | SafeMarginsPayload
  | EnvironmentPayload
  | CameraDistancePayload
  | ProviderExclusionPayload
  | LightingTonePayload;

export type Constraint = {
  id: string;
  category: ConstraintCategoryId;
  priority: number;
  enabled: boolean;
  hard: boolean;
  source: ConstraintSourceId;
  payload: ConstraintPayload;
  /** Canonical id for deduplication (e.g. hard.no-text merges no-text + no-typography) */
  canonicalId: string;
  /** Excluded from provider capability translation — Design AI internal only */
  providerInternal?: boolean;
};

export type ConstraintSet = {
  constraints: Constraint[];
  revision: number;
};

export type ConstraintConflict = {
  a: string;
  b: string;
  message: string;
  strategy: ResolutionStrategyId;
  winnerId?: string;
  resolved: boolean;
};

export type ConstraintReport = {
  revision: number;
  stage: BlueprintLifecycle;
  passed: boolean;
  totalConstraints: number;
  activeConstraints: number;
  ignoredConstraints: number;
  mergedSet: ConstraintSet;
  conflicts: ConstraintConflict[];
  resolutionStrategy: ResolutionStrategyId;
  durationMs: number;
  cached: boolean;
};

export type ConstraintProvider = {
  id: string;
  source: ConstraintSourceId;
  provide(blueprint: Readonly<import("./types").RenderBlueprint>): Constraint[];
};

export type ConstraintEngineOptions = {
  userConstraints?: Constraint[];
  providers?: ConstraintProvider[];
  defaultStrategy?: ResolutionStrategyId;
};
