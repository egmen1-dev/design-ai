import type { ProductAnalysis } from "@/lib/product-analysis";
import type { SceneBlueprint } from "@/lib/design/scene-blueprint";
import type { LayoutSpec, LayoutSpecPatch } from "@/lib/design/layout-spec";
import type { CompositionLayout } from "@/lib/composition/types";
import type { CardMeaning } from "@/lib/layout-engine/types";
import type { PromptCompilerMetadata } from "@/lib/design/prompt-compiler";

/** Constitution version sets — category-specific law bundles */
export type ConstitutionSetId =
  | "core_v1"
  | "marketplace_v1"
  | "luxury_v2"
  | "industrial_dna"
  | "beauty_dna"
  | "electronics_dna";

export type LawSeverity = "critical" | "major" | "minor";

export type LawCategory =
  | "composition"
  | "typography"
  | "whitespace"
  | "color"
  | "lighting"
  | "depth"
  | "luxury"
  | "marketplace"
  | "accessibility"
  | "brand"
  | "rendering"
  | "photography"
  | "materials"
  | "hierarchy"
  | "eye_flow"
  | "spacing"
  | "contrast"
  | "alignment"
  | "balance"
  | "negative_space"
  | "visual_density";

export type ConstitutionStage =
  | "scene_blueprint"
  | "layout_spec"
  | "prompt"
  | "rendered_critique";

export type SceneBlueprintPatch = {
  reduceDecorativeDensity?: number;
  disableParticles?: boolean;
  enforceGroundPlane?: boolean;
  reduceBackgroundComplexity?: boolean;
  capLightSources?: number;
};

export type ConstitutionPatch = {
  layoutSpecPatch?: LayoutSpecPatch;
  sceneBlueprintPatch?: SceneBlueprintPatch;
  promptRecompile?: boolean;
  priority: number;
};

export type LawValidationResult = {
  passed: boolean;
  reason?: string;
  metrics?: Record<string, number>;
};

export type ConstitutionViolation = {
  lawId: string;
  lawName: string;
  category: LawCategory;
  severity: LawSeverity;
  reason: string;
  recommendedPatch: ConstitutionPatch;
  priority: number;
};

export type DesignLaw = {
  id: string;
  name: string;
  category: LawCategory;
  severity: LawSeverity;
  version: string;
  description: string;
  stages: ConstitutionStage[];
  /** Which constitution sets include this law */
  sets: ConstitutionSetId[];
  validate: (ctx: ConstitutionContext) => LawValidationResult;
  correct: (ctx: ConstitutionContext, result: LawValidationResult) => ConstitutionPatch;
};

export type ConstitutionContext = {
  stage: ConstitutionStage;
  constitutionId: ConstitutionSetId;
  analysis?: ProductAnalysis;
  sceneBlueprint?: SceneBlueprint;
  layoutSpec?: LayoutSpec;
  prompt?: string;
  promptMetadata?: PromptCompilerMetadata;
  layout?: CompositionLayout;
  meaning?: CardMeaning;
  sceneScore?: number;
  compositionScore?: number;
  luxuryScore?: number;
};

export type ConstitutionScores = {
  compositionScore: number;
  hierarchyScore: number;
  whitespaceScore: number;
  luxuryScore: number;
  typographyScore: number;
  contrastScore: number;
  marketplaceScore: number;
  brandScore: number;
  visualNoiseScore: number;
  overallDesignScore: number;
};

export type LawReportEntry = {
  lawId: string;
  lawName: string;
  passed: boolean;
  severity: LawSeverity;
  reason?: string;
  patchApplied?: boolean;
  patchSummary?: string;
};

export type ConstitutionReport = {
  constitutionId: ConstitutionSetId;
  constitutionVersion: string;
  stage: ConstitutionStage;
  passed: boolean;
  overallDesignScore: number;
  scores: ConstitutionScores;
  entries: LawReportEntry[];
  violations: ConstitutionViolation[];
  patchesApplied: ConstitutionPatch[];
  revalidated?: boolean;
  attempts: number;
};

export type ConstitutionValidationResult = {
  passed: boolean;
  report: ConstitutionReport;
  combinedPatch: ConstitutionPatch;
};

export const CONSTITUTION_VERSION = "1.0";
export const CONSTITUTION_PASS_THRESHOLD = 85;
export const MAX_CONSTITUTION_ATTEMPTS = 3;

/** Human-readable rules mirrored in Prompt Compiler metadata */
export const DESIGN_CONSTITUTION_RULES = [
  "max 4 colors",
  "1 hero object",
  "max 3 secondary elements",
  "minimal decorative objects",
  "whitespace 20-35%",
  "no visual clutter",
  "no floating products",
  "no random particles",
  "no unnecessary gradients",
] as const;
