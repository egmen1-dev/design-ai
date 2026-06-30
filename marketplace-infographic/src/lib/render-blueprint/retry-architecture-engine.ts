/**
 * Chapter 4.24 — Retry Architecture engine.
 * Localized pipeline recovery — repair problems, never full regenerate by default.
 */
import { RetryStrategy, FinalDecision } from "./chief-design-director-types";
import { ConflictSeverity } from "./consensus-engine-types";
import { RetryRecommendation } from "./vision-quality-director-types";
import { downstreamSections } from "./agent-dependency-graph";
import { BlueprintLifecycle } from "./lifecycle-types";
import type { BlueprintSection, RenderBlueprint } from "./types";
import {
  RetryLevel,
  type RetryArchitectureContext,
  type RetryBudget,
  type RetryExplainabilityReport,
  type RetryFailureCode,
  type RetryHistoryEntry,
  type RetryPlan,
  type RetryValidationReport,
  type PipelineStage,
  type RetryLevelId,
} from "./retry-architecture-types";

export {
  RetryLevel,
  type RetryLevelId,
  type PipelineStage,
  type ProviderDiagnostics,
  type RetryBudget,
  type RetryHistoryEntry,
  type RetryPlan,
  type RetryArchitectureContext,
  type RetryExplainabilityReport,
  type RetryValidationReport,
  type RetryFailureCode,
} from "./retry-architecture-types";

export const RETRY_ARCHITECTURE_VERSION = "4.24.0";

export const RETRY_ARCHITECTURE_GOLDEN_RULE =
  "Retry must not recreate the system — it must repair only what is actually broken. " +
  "The best retry architecture is one where the user never notices the system revised its decisions.";

export const RETRY_ARCHITECTURE_ID = "retry-architecture" as const;

export const RETRY_ARCHITECTURE_PIPELINE_POSITION = [
  "generation",
  "vision-analysis",
  "consensus-engine",
  "chief-design-director",
  RETRY_ARCHITECTURE_ID,
  "partial-pipeline",
  "new-generation",
] as const;

const LEVEL_COST_CENTS: Record<RetryLevelId, number> = {
  [RetryLevel.NONE]: 0,
  [RetryLevel.PROVIDER]: 2,
  [RetryLevel.ADAPTER]: 3,
  [RetryLevel.TECHNICAL]: 8,
  [RetryLevel.CREATIVE]: 15,
  [RetryLevel.FULL_PIPELINE]: 35,
};

const ALL_MANAGED_SECTIONS: BlueprintSection[] = [
  "product",
  "creative",
  "story",
  "scene",
  "photography",
  "camera",
  "lighting",
  "materials",
  "composition",
  "constraints",
  "validation",
];

const SECTION_TO_STAGE: Partial<Record<BlueprintSection, PipelineStage>> = {
  product: BlueprintLifecycle.PRODUCT_ANALYZED,
  creative: BlueprintLifecycle.CREATIVE_DEFINED,
  story: BlueprintLifecycle.STORY_DEFINED,
  scene: BlueprintLifecycle.SCENE_DEFINED,
  photography: BlueprintLifecycle.PHOTO_DEFINED,
  camera: BlueprintLifecycle.PHOTO_DEFINED,
  lighting: BlueprintLifecycle.PHOTO_DEFINED,
  materials: BlueprintLifecycle.PHOTO_DEFINED,
  composition: BlueprintLifecycle.COMPOSITION_DEFINED,
  constraints: BlueprintLifecycle.CONSTRAINTS_DEFINED,
  validation: BlueprintLifecycle.VALIDATED,
};

const TECHNICAL_SECTIONS = new Set<BlueprintSection>(["lighting", "camera", "materials"]);
const CREATIVE_SECTIONS = new Set<BlueprintSection>(["story", "scene", "composition", "photography"]);

function primarySectionFromChief(strategy: string): BlueprintSection | null {
  switch (strategy) {
    case RetryStrategy.LIGHTING_RETRY:
      return "lighting";
    case RetryStrategy.CAMERA_RETRY:
      return "camera";
    case RetryStrategy.MATERIAL_RETRY:
      return "materials";
    case RetryStrategy.SCENE_RETRY:
      return "scene";
    case RetryStrategy.PHOTOGRAPHY_RETRY:
      return "photography";
    case RetryStrategy.RENDER_RETRY:
      return "render";
    case RetryStrategy.FULL_PIPELINE_RETRY:
      return "story";
    default:
      return null;
  }
}

function levelFromChief(ctx: RetryArchitectureContext): RetryLevelId {
  const strategy = ctx.chiefReview.retryStrategy;
  if (!ctx.chiefReview.retryRequired || strategy === RetryStrategy.NONE) {
    return RetryLevel.NONE;
  }
  if (ctx.chiefReview.finalDecision === FinalDecision.REJECT) {
    return RetryLevel.FULL_PIPELINE;
  }
  if (strategy === RetryStrategy.FULL_PIPELINE_RETRY) return RetryLevel.FULL_PIPELINE;
  if (strategy === RetryStrategy.RENDER_RETRY) {
    return ctx.providerDiagnostics?.promptMappingError
      ? RetryLevel.ADAPTER
      : RetryLevel.PROVIDER;
  }
  const section = primarySectionFromChief(strategy);
  if (section && CREATIVE_SECTIONS.has(section)) return RetryLevel.CREATIVE;
  if (section && TECHNICAL_SECTIONS.has(section)) return RetryLevel.TECHNICAL;
  return RetryLevel.TECHNICAL;
}

function levelFromVision(ctx: RetryArchitectureContext): RetryLevelId | null {
  const vision = ctx.visionReport;
  if (!vision) return null;
  if (vision.retryRecommendation === RetryRecommendation.ACCEPT) return RetryLevel.NONE;
  if (vision.retryRecommendation === RetryRecommendation.REJECT) return RetryLevel.FULL_PIPELINE;
  if (vision.retryRecommendation === RetryRecommendation.RETRY_FULL_RENDER) {
    return ctx.providerDiagnostics?.promptMappingError ? RetryLevel.ADAPTER : RetryLevel.PROVIDER;
  }
  if (vision.retryRecommendation === RetryRecommendation.RETRY_LIGHTING) return RetryLevel.TECHNICAL;
  if (vision.retryRecommendation === RetryRecommendation.RETRY_SCENE) return RetryLevel.CREATIVE;
  return null;
}

function levelFromConsensus(ctx: RetryArchitectureContext): RetryLevelId | null {
  const consensus = ctx.consensusReport;
  if (!consensus || !consensus.requiresRetry) return null;
  const critical = consensus.conflicts.filter((c) => c.severity === ConflictSeverity.CRITICAL);
  if (critical.length >= 2) return RetryLevel.FULL_PIPELINE;
  const weakest = consensus.agreementMatrix.weakestSection;
  if (weakest && CREATIVE_SECTIONS.has(weakest)) return RetryLevel.CREATIVE;
  if (weakest && TECHNICAL_SECTIONS.has(weakest)) return RetryLevel.TECHNICAL;
  return RetryLevel.TECHNICAL;
}

function levelFromProvider(ctx: RetryArchitectureContext): RetryLevelId | null {
  const diag = ctx.providerDiagnostics;
  if (!diag) return null;
  if (diag.promptMappingError) return RetryLevel.ADAPTER;
  if (diag.artifactDetected || (diag.httpStatus && diag.httpStatus >= 500)) {
    return RetryLevel.PROVIDER;
  }
  return null;
}

export function selectRetryLevel(ctx: RetryArchitectureContext): RetryLevelId {
  if (ctx.chiefReview.approved && !ctx.chiefReview.retryRequired) {
    return RetryLevel.NONE;
  }

  const candidates = [
    levelFromChief(ctx),
    levelFromVision(ctx),
    levelFromConsensus(ctx),
    levelFromProvider(ctx),
  ].filter((v): v is RetryLevelId => v !== null);

  return candidates.length ? Math.max(...candidates) as RetryLevelId : RetryLevel.NONE;
}

function adaptiveEscalation(
  level: RetryLevelId,
  primarySection: BlueprintSection | null,
  history: RetryHistoryEntry[] = [],
): { level: RetryLevelId; note?: string } {
  if (!primarySection || history.length < 2) return { level };

  const repeats = history.filter((h) => h.primarySection === primarySection).length;
  if (repeats >= 2 && level === RetryLevel.TECHNICAL) {
    return {
      level: RetryLevel.CREATIVE,
      note: `Repeated ${primarySection} retry ineffective — escalating to creative retry`,
    };
  }
  if (repeats >= 2 && level === RetryLevel.CREATIVE) {
    return {
      level: RetryLevel.FULL_PIPELINE,
      note: `Repeated creative retry on ${primarySection} ineffective — escalating to full pipeline`,
    };
  }
  if (repeats >= 3 && level === RetryLevel.PROVIDER) {
    return {
      level: RetryLevel.ADAPTER,
      note: "Repeated provider retry ineffective — escalating to adapter retry",
    };
  }

  return { level };
}

export function computeRetryScope(
  level: RetryLevelId,
  primarySection: BlueprintSection | null,
): { preserveSections: string[]; rebuildSections: string[]; restartFrom: PipelineStage } {
  if (level === RetryLevel.NONE) {
    return {
      preserveSections: ALL_MANAGED_SECTIONS,
      rebuildSections: [],
      restartFrom: BlueprintLifecycle.FINISHED,
    };
  }

  if (level === RetryLevel.PROVIDER || level === RetryLevel.ADAPTER) {
    return {
      preserveSections: ALL_MANAGED_SECTIONS,
      rebuildSections: ["render"],
      restartFrom: BlueprintLifecycle.FROZEN,
    };
  }

  if (level === RetryLevel.FULL_PIPELINE) {
    return {
      preserveSections: ["product"],
      rebuildSections: ALL_MANAGED_SECTIONS.filter((s) => s !== "product"),
      restartFrom: BlueprintLifecycle.CREATIVE_DEFINED,
    };
  }

  const anchor = primarySection ?? "lighting";
  const downstream = downstreamSections(anchor);
  const rebuild = [anchor, ...downstream.filter((s) => ALL_MANAGED_SECTIONS.includes(s))];
  const preserve = ALL_MANAGED_SECTIONS.filter((s) => !rebuild.includes(s));

  return {
    preserveSections: preserve,
    rebuildSections: [...new Set(rebuild)],
    restartFrom: SECTION_TO_STAGE[anchor] ?? BlueprintLifecycle.PHOTO_DEFINED,
  };
}

function estimateImprovement(ctx: RetryArchitectureContext, level: RetryLevelId): number {
  const chiefGain = Math.max(
    0,
    ctx.chiefReview.estimatedScoreAfterRetry - ctx.chiefReview.overallScore,
  );
  if (chiefGain > 0) return chiefGain;

  const base: Record<RetryLevelId, number> = {
    [RetryLevel.NONE]: 0,
    [RetryLevel.PROVIDER]: 6,
    [RetryLevel.ADAPTER]: 8,
    [RetryLevel.TECHNICAL]: 12,
    [RetryLevel.CREATIVE]: 18,
    [RetryLevel.FULL_PIPELINE]: 25,
  };
  return base[level];
}

function buildRetryReason(
  ctx: RetryArchitectureContext,
  level: RetryLevelId,
  primarySection: BlueprintSection | null,
): string {
  if (level === RetryLevel.NONE) return "No retry required — blueprint accepted";

  const chiefProblem = ctx.chiefReview.priorityProblems[0];
  if (chiefProblem) {
    return `${level === RetryLevel.TECHNICAL ? "Technical" : level === RetryLevel.CREATIVE ? "Creative" : "Pipeline"} retry for ${primarySection ?? "pipeline"}: ${chiefProblem.message}`;
  }

  const consensusConflict = ctx.consensusReport?.conflicts[0];
  if (consensusConflict) {
    return `Consensus conflict ${consensusConflict.code}: ${consensusConflict.explanation}`;
  }

  const visionProblem = ctx.visionReport?.problems[0];
  if (visionProblem) {
    return `Vision analysis: ${visionProblem.message}`;
  }

  if (ctx.providerDiagnostics?.artifactDetected) {
    return "Provider retry: render artifacts detected";
  }

  return `Localized retry level ${level} for ${primarySection ?? "pipeline"}`;
}

export function applyRetryBudget(
  plan: RetryPlan,
  ctx: RetryArchitectureContext,
): RetryPlan {
  const budget = ctx.budget ?? { maxAttempts: 3, maxCostCents: 15, minImprovementScore: 5 };
  const attempts = ctx.retryHistory?.length ?? 0;

  if (attempts >= (budget.maxAttempts ?? 3)) {
    return {
      ...plan,
      retryLevel: RetryLevel.NONE,
      rebuildSections: [],
      preserveSections: ALL_MANAGED_SECTIONS,
      estimatedCost: 0,
      estimatedImprovement: 0,
      reason: `Retry budget exhausted (${attempts}/${budget.maxAttempts}) — cost-aware accept`,
      confidence: 0.7,
    };
  }

  const spent = ctx.retryHistory?.reduce((sum, h) => sum + (h.costCents ?? 0), 0) ?? 0;
  if (spent + plan.estimatedCost > (budget.maxCostCents ?? 15)) {
    return {
      ...plan,
      retryLevel: RetryLevel.NONE,
      rebuildSections: [],
      preserveSections: ALL_MANAGED_SECTIONS,
      estimatedCost: 0,
      estimatedImprovement: 0,
      reason: `Retry cost ${spent + plan.estimatedCost}¢ exceeds budget ${budget.maxCostCents}¢`,
      confidence: 0.68,
    };
  }

  if (plan.estimatedImprovement < (budget.minImprovementScore ?? 5) && plan.retryLevel > RetryLevel.PROVIDER) {
    return {
      ...plan,
      retryLevel: RetryLevel.NONE,
      rebuildSections: [],
      preserveSections: ALL_MANAGED_SECTIONS,
      estimatedCost: 0,
      estimatedImprovement: 0,
      reason: `Expected improvement ${plan.estimatedImprovement} below minimum ${budget.minImprovementScore}`,
      confidence: 0.65,
    };
  }

  return plan;
}

export function buildRetryPlan(
  blueprint: Readonly<RenderBlueprint>,
  ctx: RetryArchitectureContext,
): { plan: RetryPlan; explainability: RetryExplainabilityReport } {
  let level = selectRetryLevel(ctx);
  const chiefSection = primarySectionFromChief(ctx.chiefReview.retryStrategy);
  const consensusSection = ctx.consensusReport?.agreementMatrix.weakestSection ?? null;
  const primarySection = chiefSection ?? consensusSection;

  const adaptive = adaptiveEscalation(level, primarySection, ctx.retryHistory);
  level = adaptive.level;

  const scope = computeRetryScope(level, primarySection);
  const mutationPlan =
    level === RetryLevel.NONE
      ? []
      : ctx.consensusReport?.recommendedMutations.length
        ? ctx.consensusReport.recommendedMutations
        : ctx.chiefReview.recommendedMutations;

  const estimatedCost = LEVEL_COST_CENTS[level];
  const estimatedImprovement = estimateImprovement(ctx, level);
  const reason = buildRetryReason(ctx, level, primarySection);

  let plan: RetryPlan = {
    retryLevel: level,
    restartFrom: scope.restartFrom,
    preserveSections: scope.preserveSections,
    rebuildSections: scope.rebuildSections,
    mutationPlan,
    estimatedCost,
    estimatedImprovement,
    confidence: Math.max(0.5, Math.min(0.95, 0.8 - level * 0.04)),
    reason,
  };

  plan = applyRetryBudget(plan, ctx);

  const explainability: RetryExplainabilityReport = {
    agentId: RETRY_ARCHITECTURE_ID,
    diagnosis: reason,
    preservedDecisions: plan.preserveSections.map((s) => `${s} v${blueprint.meta.revision} — keep`),
    adaptiveEscalation: adaptive.note,
    budgetDecision:
      plan.retryLevel === RetryLevel.NONE && level !== RetryLevel.NONE
        ? plan.reason
        : undefined,
    reasoning: [
      `Selected retry level ${plan.retryLevel} — localized recovery, not full regenerate`,
      `Restart from ${plan.restartFrom}; preserve ${plan.preserveSections.length} sections`,
      `Rebuild ${plan.rebuildSections.join(", ") || "none"}`,
      `Estimated cost ${plan.estimatedCost}¢, improvement +${plan.estimatedImprovement} score`,
      adaptive.note ?? "No adaptive escalation required",
      plan.reason,
    ],
  };

  return { plan, explainability };
}

export function validateRetryPlan(
  plan: RetryPlan,
  ctx: RetryArchitectureContext,
): RetryValidationReport {
  const violations: string[] = [];

  if (!ctx.chiefReview) violations.push("MISSING_CHIEF_REVIEW");
  if (!plan.reason) violations.push("UNEXPLAINABLE_RETRY");

  if (plan.retryLevel === RetryLevel.FULL_PIPELINE && plan.rebuildSections.length <= 2) {
    const couldBeLocal =
      ctx.chiefReview.retryStrategy === RetryStrategy.LIGHTING_RETRY ||
      ctx.chiefReview.retryStrategy === RetryStrategy.CAMERA_RETRY;
    if (couldBeLocal) violations.push("FULL_RESTART_UNNECESSARY");
  }

  if (plan.retryLevel > RetryLevel.NONE && plan.retryLevel < RetryLevel.FULL_PIPELINE) {
    if (!plan.preserveSections.includes("story") && plan.rebuildSections.includes("lighting")) {
      // lighting retry should preserve story
    }
    if (plan.rebuildSections.includes("story") && plan.retryLevel === RetryLevel.TECHNICAL) {
      violations.push("GOOD_SECTIONS_DESTROYED");
    }
  }

  if (plan.estimatedCost > 20 && plan.estimatedImprovement < 5) {
    violations.push("COST_EXCEEDS_BENEFIT");
  }

  return { valid: violations.length === 0, violations, plan };
}

export function isRetryFailure(code: string): code is RetryFailureCode {
  return [
    "FULL_RESTART_UNNECESSARY",
    "GOOD_SECTIONS_DESTROYED",
    "MISSING_RETRY_HISTORY",
    "UNEXPLAINABLE_RETRY",
    "COST_EXCEEDS_BENEFIT",
    "MISSING_CHIEF_REVIEW",
  ].includes(code);
}

export function runRetryArchitecture(input: {
  blueprint: Readonly<RenderBlueprint>;
  context: RetryArchitectureContext;
}): {
  plan: RetryPlan;
  explainability: RetryExplainabilityReport;
} {
  if (!input.context.chiefReview) {
    throw new Error("Chief review is required for retry architecture");
  }
  return buildRetryPlan(input.blueprint, input.context);
}
