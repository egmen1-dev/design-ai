/**
 * Chapter 6.17 — Learning & Feedback Stage engine.
 * Converts generation outcomes into platform knowledge — never mutates blueprint.
 */
import { FinalDecision, RetryStrategy, ChiefProblemSeverity } from "./chief-design-director-types";
import { runChiefDesignDirectorReviewStageFromPipeline } from "./chief-design-director-review-stage-engine";
import { runCommercialValidationStageFromPipeline } from "./commercial-validation-stage-engine";
import { runBlueprintAssemblyStageFromPipeline } from "./blueprint-assembly-stage-engine";
import { runVisionValidationStageFromPipeline } from "./vision-validation-stage-engine";
import { DirectorApprovalStatus } from "./chief-design-director-review-stage-types";
import {
  buildMemoryUpdate,
  computeMemoryOutcomeScore,
  createEmptyDesignKnowledgeStore,
  extractBlueprintPattern,
} from "./design-memory-engine";
import type { DesignMemoryContext } from "./design-memory-types";
import { buildDefaultPipelineInput } from "./design-pipeline-engine";
import {
  KnowledgeLearningSource,
  type KnowledgeLearningFeedback,
  type KnowledgeLearningObject,
  type KnowledgeLearningOutcome,
} from "./knowledge-learning-types";
import {
  getLearningSourceTrust,
  runKnowledgeLearningPipeline,
} from "./knowledge-learning-engine";
import { runRenderingStageSyncFromPipeline } from "./rendering-stage-engine";
import {
  applyAntiPatternLearningFeedback,
  detectDesignAntiPatterns,
  getDesignAntiPattern,
  SEED_DESIGN_ANTI_PATTERNS,
} from "./anti-pattern-library-engine";
import {
  getDesignPattern,
  scorePatternUsage,
  SEED_DESIGN_PATTERNS,
} from "./pattern-library-engine";
import type { DesignAntiPattern } from "./anti-pattern-library-types";
import type { DesignPattern } from "./pattern-library-types";
import type { RenderBlueprint } from "./types";
import { RetryRecommendation } from "./vision-quality-director-types";
import type { VisionQualityReport } from "./vision-quality-director-types";
import type { ChiefReview } from "./chief-design-director-types";
import {
  LearningFeedbackStage,
  type LearningFeedbackContext,
  type LearningFeedbackInput,
  type LearningFeedbackReport,
  type LearningFeedbackSection,
  type LearningFeedbackStageFailureCode,
  type LearningFeedbackStageId,
  type LearningFeedbackStageViolation,
  type LearningFeedbackSystemReport,
  type PlannedAntiPatternStatisticsUpdate,
  type PlannedKnowledgeFeedbackProposal,
  type PlannedLearningFinalScores,
  type PlannedLearningPackage,
  type PlannedLearningRetryHistory,
  type PlannedMarketplaceLearningInsight,
  type PlannedPatternStatisticsUpdate,
  type PlannedUserFeedback,
} from "./learning-feedback-stage-types";

export {
  LearningFeedbackStage,
  type LearningFeedbackStageId,
  type PlannedLearningRetryHistory,
  type PlannedLearningFinalScores,
  type PlannedUserFeedback,
  type PlannedLearningPackage,
  type PlannedPatternStatisticsUpdate,
  type PlannedAntiPatternStatisticsUpdate,
  type PlannedKnowledgeFeedbackProposal,
  type PlannedMarketplaceLearningInsight,
  type LearningFeedbackInput,
  type LearningFeedbackSection,
  type LearningFeedbackStageViolation,
  type LearningFeedbackReport,
  type LearningFeedbackContext,
  type LearningFeedbackSystemReport,
  type LearningFeedbackStageFailureCode,
} from "./learning-feedback-stage-types";

export const LEARNING_FEEDBACK_VERSION = "6.17.0";

export const LEARNING_FEEDBACK_GOLDEN_RULE =
  "Every generation has value — even a failed one. Learning & Feedback turns any outcome into experience " +
  "that becomes part of Design AI collective intelligence, so the platform continuously becomes smarter " +
  "after every project.";

export const LEARNING_FEEDBACK_PIPELINE: readonly LearningFeedbackStageId[] = [
  LearningFeedbackStage.INPUT_ASSEMBLY,
  LearningFeedbackStage.SOURCE_COLLECTION,
  LearningFeedbackStage.COMMERCIAL_METRICS,
  LearningFeedbackStage.RETRY_HISTORY,
  LearningFeedbackStage.PATTERN_LEARNING,
  LearningFeedbackStage.ANTI_PATTERN_LEARNING,
  LearningFeedbackStage.KNOWLEDGE_FEEDBACK,
  LearningFeedbackStage.DESIGN_MEMORY_UPDATE,
  LearningFeedbackStage.TREND_DETECTION,
  LearningFeedbackStage.MARKETPLACE_LEARNING,
  LearningFeedbackStage.LEARNING_PACKAGE_BUILD,
  LearningFeedbackStage.KNOWLEDGE_HANDOFF,
  LearningFeedbackStage.VALIDATION,
  LearningFeedbackStage.STAGE_COMPLETE,
] as const;

export const LEARNING_FEEDBACK_POSITION = [
  "chief-design-review",
  "learning-feedback",
  "next-generation",
] as const;

export const TREND_DETECTION_MIN_SAMPLES = 5;

const PATTERN_TEMPLATE_MAP: Record<string, string> = {
  centered_hero: "comp-centered-hero",
  feature_grid: "comp-feature-grid",
  diagonal_composition: "comp-diagonal-composition",
  lifestyle_split: "comp-lifestyle-split",
  large_product_focus: "comp-large-product-focus",
  luxury_showcase: "story-premium-showcase",
  hero_right: "comp-large-product-focus",
};

const ANTI_PATTERN_VIOLATION_MAP: Record<string, string> = {
  hero: "comp-hero-area-too-small",
  artifact: "render-ai-artifacts",
  lighting: "photo-flat-lighting",
  trust: "biz-missing-hero-product",
};

function violation(
  code: LearningFeedbackStageFailureCode,
  message: string,
  stage?: LearningFeedbackStageId,
): LearningFeedbackStageViolation {
  return { code, message, stage };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

export function resolvePatternIdsFromBlueprint(blueprint: Readonly<RenderBlueprint>): string[] {
  const ids = new Set<string>();
  const templateId = blueprint.composition.templateId ?? blueprint.composition.template;
  if (templateId && PATTERN_TEMPLATE_MAP[templateId]) {
    ids.add(PATTERN_TEMPLATE_MAP[templateId]);
  } else if (templateId) {
    ids.add(`comp-${String(templateId).replace(/_/g, "-")}`);
  }

  if (blueprint.story.storyType?.includes("premium")) ids.add("story-premium-showcase");
  if (blueprint.story.storyType?.includes("lifestyle")) ids.add("story-lifestyle-context");
  if (blueprint.photography.photographyStyle?.includes("premium")) ids.add("photo-premium-lighting");

  if (ids.size === 0) ids.add("comp-centered-hero");
  return [...ids];
}

export function buildPlannedRetryHistory(
  blueprint: Readonly<RenderBlueprint>,
  directorReport: PlannedLearningPackage["director"],
): PlannedLearningRetryHistory {
  const attempts = blueprint.meta.retry ?? 0;
  const reasons = directorReport.criticalIssues.map((issue) => issue.description);
  const fixedIssues =
    attempts > 0 && !directorReport.retryRequired
      ? directorReport.recommendations.map((rec) => rec.action)
      : [];

  return {
    attempts,
    reasons,
    fixedIssues,
    strategiesUsed: directorReport.retryTargets,
  };
}

export function buildPlannedFinalScores(
  learningPackage: Pick<PlannedLearningPackage, "vision" | "commercial" | "director">,
): PlannedLearningFinalScores {
  return {
    visionScore: learningPackage.vision.overallScore,
    commercialScore: learningPackage.commercial.commercialScore,
    professionalScore: learningPackage.director.professionalLevel,
    ctrPrediction: learningPackage.commercial.ctrPrediction,
    marketplaceFit: learningPackage.commercial.marketplaceFit,
  };
}

export function buildPlannedLearningPackage(input: {
  projectId: string;
  blueprint: RenderBlueprint;
  vision: PlannedLearningPackage["vision"];
  commercial: PlannedLearningPackage["commercial"];
  director: PlannedLearningPackage["director"];
  metadata: PlannedLearningPackage["metadata"];
  imageRef: string;
  marketplace: string;
  userFeedback?: PlannedUserFeedback;
}): PlannedLearningPackage {
  const retryHistory = buildPlannedRetryHistory(input.blueprint, input.director);
  const finalScores = buildPlannedFinalScores(input);

  return {
    projectId: input.projectId,
    blueprint: input.blueprint,
    vision: input.vision,
    commercial: input.commercial,
    director: input.director,
    retryHistory,
    finalScores,
    metadata: input.metadata,
    imageRef: input.imageRef,
    marketplace: input.marketplace,
    userFeedback: input.userFeedback,
  };
}

function bridgeChiefReview(director: PlannedLearningPackage["director"]): ChiefReview {
  const approved =
    director.approvalStatus === DirectorApprovalStatus.APPROVED ||
    director.approvalStatus === DirectorApprovalStatus.APPROVED_WITH_NOTES;

  return {
    approved,
    overallScore: director.overallScore,
    estimatedScoreAfterRetry: clampScore(director.overallScore + 10),
    retryRequired: director.retryRequired,
    retryStrategy: director.approvalStatus === DirectorApprovalStatus.BLUEPRINT_REBUILD
      ? RetryStrategy.FULL_PIPELINE_RETRY
      : director.retryRequired
        ? RetryStrategy.LIGHTING_RETRY
        : RetryStrategy.NONE,
    priorityProblems: director.criticalIssues.map((issue) => ({
      code: issue.id,
      severity:
        issue.severity === "critical" ? ChiefProblemSeverity.CRITICAL : ChiefProblemSeverity.MAJOR,
      section: issue.category,
      message: issue.description,
      sourceAgent: issue.source,
    })),
    recommendedMutations: [],
    finalDecision: approved ? FinalDecision.APPROVE : FinalDecision.RETRY,
    confidence: approved ? 0.92 : 0.5,
  };
}

function bridgeVisionReport(vision: PlannedLearningPackage["vision"]): VisionQualityReport {
  return {
    compositionScore: vision.compositionScore,
    sceneAccuracy: vision.renderAccuracy,
    lightingAccuracy: vision.photographyScore,
    materialAccuracy: vision.technicalScore,
    backgroundCleanliness: vision.artifactScore,
    overlaySafety: vision.compositionScore,
    providerArtifacts: vision.artifactScore,
    overallScore: vision.overallScore,
    problems: vision.violations.map((v) => ({
      code: v.id,
      severity: v.severity === "critical" ? "critical" : "high",
      section: v.category,
      message: v.description,
      critical: v.severity === "critical",
    })),
    retryRecommendation: vision.approved ? RetryRecommendation.ACCEPT : RetryRecommendation.RETRY_FULL_RENDER,
    confidence: vision.approved ? 0.9 : 0.55,
  };
}

export function updatePatternStatistics(
  learningPackage: PlannedLearningPackage,
  context: LearningFeedbackContext = {},
): { updates: PlannedPatternStatisticsUpdate[]; patterns: DesignPattern[] } {
  if (context.injectNoPatternUpdate) {
    return { updates: [], patterns: [...SEED_DESIGN_PATTERNS] };
  }

  const patternIds = resolvePatternIdsFromBlueprint(learningPackage.blueprint);
  const patterns = [...SEED_DESIGN_PATTERNS];
  const updates: PlannedPatternStatisticsUpdate[] = [];

  for (const patternId of patternIds) {
    const index = patterns.findIndex((p) => p.id === patternId);
    const existing =
      (index >= 0 ? patterns[index] : getDesignPattern(patternId)) ??
      getDesignPattern("comp-centered-hero");
    if (!existing) continue;

    const scored = scorePatternUsage(existing, {
      patternId,
      visionScore: learningPackage.finalScores.visionScore / 100,
      ctrPrediction: learningPackage.finalScores.ctrPrediction,
      commercialScore: learningPackage.finalScores.commercialScore / 100,
      retryCount: learningPackage.retryHistory.attempts,
      userRating:
        learningPackage.userFeedback?.rating === "positive"
          ? 0.9
          : learningPackage.userFeedback?.rating === "negative"
            ? 0.2
            : 0.5,
    });

    if (index >= 0) patterns[index] = scored;
    updates.push({
      patternId: scored.id,
      patternName: scored.name,
      usageCount: scored.usageCount,
      successRate: Number((scored.successRate * 100).toFixed(1)),
      commercialScore: learningPackage.finalScores.commercialScore,
    });
  }

  return { updates, patterns };
}

export function detectAntiPatternIds(
  learningPackage: PlannedLearningPackage,
  context: LearningFeedbackContext = {},
): string[] {
  const detected = new Set<string>();

  const heroWidth = learningPackage.blueprint.composition.heroWidth ?? 0.5;
  const blueprintCheck = {
    hasHeroProduct: heroWidth >= 0.3,
    heroProductRatio: heroWidth,
    competingFocalPoints: learningPackage.blueprint.composition.focalPoints?.length ?? 1,
    overcrowded: (learningPackage.blueprint.composition.focalPoints?.length ?? 0) > 4,
    negativeSpaceRatio: learningPackage.blueprint.composition.negativeSpace ?? 20,
    thumbnailReadable: learningPackage.commercial.marketplaceFit >= 70,
    safeZoneViolation: learningPackage.commercial.marketplaceFit < 65,
    missingUsp: learningPackage.commercial.sellingPower < 65,
    marketplaceRuleViolation: learningPackage.commercial.marketplaceFit < 60,
  };

  for (const result of detectDesignAntiPatterns(blueprintCheck)) {
    detected.add(result.antiPattern.id);
  }

  for (const issue of learningPackage.director.criticalIssues) {
    for (const [key, antiPatternId] of Object.entries(ANTI_PATTERN_VIOLATION_MAP)) {
      if (issue.category.includes(key) || issue.description.toLowerCase().includes(key)) {
        detected.add(antiPatternId);
      }
    }
  }

  if (context.injectRepeatingAntiPattern) {
    detected.add("comp-hero-area-too-small");
  }

  return [...detected];
}

export function updateAntiPatternStatistics(
  learningPackage: PlannedLearningPackage,
  context: LearningFeedbackContext = {},
): { updates: PlannedAntiPatternStatisticsUpdate[]; antiPatterns: DesignAntiPattern[] } {
  const antiPatternIds = detectAntiPatternIds(learningPackage, context);
  let antiPatterns = [...SEED_DESIGN_ANTI_PATTERNS];
  const updates: PlannedAntiPatternStatisticsUpdate[] = [];

  for (const antiPatternId of antiPatternIds) {
    const existing = getDesignAntiPattern(antiPatternId);
    if (!existing) continue;

    const fixed = learningPackage.retryHistory.fixedIssues.length > 0 && !learningPackage.director.retryRequired;
    antiPatterns = applyAntiPatternLearningFeedback(antiPatterns, {
      antiPatternId,
      detected: true,
      fixed,
      ledToRetry: learningPackage.director.retryRequired,
      commercialScoreImpact: learningPackage.commercial.commercialScore - 80,
    });

    const updated = antiPatterns.find((a) => a.id === antiPatternId) ?? existing;
    updates.push({
      antiPatternId: updated.id,
      antiPatternName: updated.name,
      detectedCount: 1,
      successfullyFixed: fixed ? 1 : 0,
      retryImpact:
        learningPackage.director.retryRequired && learningPackage.retryHistory.attempts > 0
          ? "high"
          : learningPackage.director.retryRequired
            ? "medium"
            : "low",
    });
  }

  return { updates, antiPatterns };
}

export function buildKnowledgeFeedbackProposals(
  learningPackage: PlannedLearningPackage,
  patternUpdates: PlannedPatternStatisticsUpdate[],
): PlannedKnowledgeFeedbackProposal[] {
  const proposals: PlannedKnowledgeFeedbackProposal[] = [];

  if (learningPackage.commercial.trustScore >= 85) {
    proposals.push({
      kind: "rule_update",
      title: "Lighting Rule",
      description: "Warm commercial lighting correlates with higher trust scores",
      confidenceDelta: 0.8,
      status: "pending_validation",
    });
  }

  const topPattern = patternUpdates.sort((a, b) => b.successRate - a.successRate)[0];
  if (topPattern && topPattern.successRate >= 90) {
    proposals.push({
      kind: "pattern_candidate",
      title: topPattern.patternName,
      description: `Pattern ${topPattern.patternId} shows ${topPattern.successRate}% success in recent runs`,
      confidenceDelta: 0.6,
      status: "proposed",
    });
  }

  if (learningPackage.director.criticalIssues.some((issue) => issue.description.toLowerCase().includes("badge"))) {
    proposals.push({
      kind: "anti_pattern_proposal",
      title: "Overloaded Badge Cluster",
      description: "Multiple badge elements reduce hero clarity on marketplace thumbnails",
      confidenceDelta: 0.5,
      status: "proposed",
    });
  }

  if (proposals.length === 0 && learningPackage.finalScores.commercialScore >= 70) {
    proposals.push({
      kind: "rule_update",
      title: "Commercial Composition Rule",
      description: "Generation outcome supports existing marketplace composition guidance",
      confidenceDelta: 0.4,
      status: "pending_validation",
    });
  }

  return proposals;
}

export function detectTrendProposals(
  learningPackage: PlannedLearningPackage,
  patternUpdates: PlannedPatternStatisticsUpdate[],
): PlannedKnowledgeFeedbackProposal[] {
  if (patternUpdates.length < TREND_DETECTION_MIN_SAMPLES) return [];

  const dominant = patternUpdates.filter((p) => p.successRate >= 92);
  if (dominant.length < 2) return [];

  return [
    {
      kind: "pattern_candidate",
      title: "Emerging Marketplace Layout Trend",
      description: `Repeated success with ${dominant.map((p) => p.patternName).join(", ")}`,
      confidenceDelta: 0.45,
      status: "proposed",
    },
  ];
}

export function buildMarketplaceLearningInsights(
  learningPackage: PlannedLearningPackage,
): PlannedMarketplaceLearningInsight[] {
  const marketplace = learningPackage.marketplace.toLowerCase();
  const insights: PlannedMarketplaceLearningInsight[] = [];

  if (marketplace.includes("wildberries")) {
    insights.push({
      marketplace: learningPackage.marketplace,
      insight: "Large hero products outperform balanced layouts on Wildberries thumbnails",
      sampleCount: learningPackage.retryHistory.attempts + 1,
      avgCommercialScore: learningPackage.finalScores.commercialScore,
    });
  } else if (marketplace.includes("amazon")) {
    insights.push({
      marketplace: learningPackage.marketplace,
      insight: "Minimal compositions with strong negative space improve Amazon CTR",
      sampleCount: learningPackage.retryHistory.attempts + 1,
      avgCommercialScore: learningPackage.finalScores.commercialScore,
    });
  } else if (marketplace.includes("ozon")) {
    insights.push({
      marketplace: learningPackage.marketplace,
      insight: "More informative cards with clear benefits perform better on Ozon",
      sampleCount: learningPackage.retryHistory.attempts + 1,
      avgCommercialScore: learningPackage.finalScores.commercialScore,
    });
  } else {
    insights.push({
      marketplace: learningPackage.marketplace,
      insight: "Commercial score and hero dominance remain primary marketplace drivers",
      sampleCount: learningPackage.retryHistory.attempts + 1,
      avgCommercialScore: learningPackage.finalScores.commercialScore,
    });
  }

  return insights;
}

export function buildKnowledgeLearningFeedbackFromPackage(
  learningPackage: PlannedLearningPackage,
): KnowledgeLearningFeedback[] {
  const now = new Date();
  const dimensions = extractBlueprintPattern(learningPackage.blueprint);
  const learningObject: KnowledgeLearningObject = {
    generationId: learningPackage.projectId,
    composition: learningPackage.blueprint.composition.templateId,
    style: learningPackage.blueprint.creative?.emotionalTone,
    lighting: dimensions.lighting,
    camera: dimensions.camera,
    materials: dimensions.materials,
    patternId: resolvePatternIdsFromBlueprint(learningPackage.blueprint)[0],
    marketplace: learningPackage.marketplace,
    category: learningPackage.blueprint.product.category,
  };

  const outcome: KnowledgeLearningOutcome = {
    visionScore: learningPackage.finalScores.visionScore / 100,
    commercialScore: learningPackage.finalScores.commercialScore / 100,
    ctrPrediction: learningPackage.finalScores.ctrPrediction,
    retryCount: learningPackage.retryHistory.attempts,
    userSatisfaction:
      learningPackage.userFeedback?.rating === "positive"
        ? 0.9
        : learningPackage.userFeedback?.rating === "negative"
          ? 0.2
          : 0.65,
  };

  const feedbacks: KnowledgeLearningFeedback[] = [
    {
      source: KnowledgeLearningSource.GENERATION_RESULT,
      trustWeight: getLearningSourceTrust(KnowledgeLearningSource.GENERATION_RESULT),
      generationId: learningPackage.projectId,
      learningObject,
      outcome,
      timestamp: now,
    },
    {
      source: KnowledgeLearningSource.VISION_REPORT,
      trustWeight: getLearningSourceTrust(KnowledgeLearningSource.VISION_REPORT),
      generationId: learningPackage.projectId,
      ruleId: "photo-warm-lighting-rule",
      learningObject,
      outcome,
      timestamp: now,
    },
    {
      source: KnowledgeLearningSource.COMMERCIAL_SCORE,
      trustWeight: getLearningSourceTrust(KnowledgeLearningSource.COMMERCIAL_SCORE),
      generationId: learningPackage.projectId,
      ruleId: "photo-warm-lighting-rule",
      learningObject,
      outcome,
      timestamp: now,
    },
  ];

  if (learningPackage.retryHistory.attempts > 0) {
    feedbacks.push({
      source: KnowledgeLearningSource.RETRY_RESULT,
      trustWeight: getLearningSourceTrust(KnowledgeLearningSource.RETRY_RESULT),
      generationId: learningPackage.projectId,
      learningObject,
      outcome,
      timestamp: now,
    });
  }

  if (learningPackage.userFeedback) {
    feedbacks.push({
      source: KnowledgeLearningSource.USER_FEEDBACK,
      trustWeight: getLearningSourceTrust(KnowledgeLearningSource.USER_FEEDBACK),
      generationId: learningPackage.projectId,
      learningObject,
      outcome,
      userRating: learningPackage.userFeedback.rating,
      timestamp: now,
    });
  }

  return feedbacks;
}

export function buildDesignMemoryUpdateFromPackage(learningPackage: PlannedLearningPackage) {
  const memoryContext: DesignMemoryContext = {
    chiefReview: bridgeChiefReview(learningPackage.director),
    visionReport: bridgeVisionReport(learningPackage.vision),
    retryHistory: {
      attempts: learningPackage.retryHistory.attempts,
      strategiesUsed: learningPackage.retryHistory.strategiesUsed,
    },
    generationMetadata: {
      provider: learningPackage.blueprint.meta.generator ?? "flux",
    },
    userFeedback:
      learningPackage.userFeedback?.rating === "positive"
        ? "like"
        : learningPackage.userFeedback?.rating === "negative"
          ? "dislike"
          : undefined,
    commercialMetrics: {
      ctr: learningPackage.finalScores.ctrPrediction,
      userRating: learningPackage.userFeedback?.rating === "positive" ? 5 : undefined,
    },
    completedAt: Date.now(),
  };

  return buildMemoryUpdate(learningPackage.blueprint, memoryContext, createEmptyDesignKnowledgeStore());
}

export function validateLearningFeedbackInput(
  input: LearningFeedbackInput,
  context: LearningFeedbackContext = {},
): LearningFeedbackStageViolation[] {
  const violations: LearningFeedbackStageViolation[] = [];
  const pkg = input.learningPackage;

  if (context.missingVisionReport || !pkg.vision) {
    violations.push(
      violation("MISSING_VISION_REPORT", "Vision Report required for learning", LearningFeedbackStage.INPUT_ASSEMBLY),
    );
  }
  if (context.missingCommercialReport || !pkg.commercial) {
    violations.push(
      violation(
        "MISSING_COMMERCIAL_REPORT",
        "Commercial Report required for learning",
        LearningFeedbackStage.INPUT_ASSEMBLY,
      ),
    );
  }
  if (context.missingDirectorReport || !pkg.director) {
    violations.push(
      violation(
        "MISSING_DIRECTOR_REPORT",
        "Director Report required for learning",
        LearningFeedbackStage.INPUT_ASSEMBLY,
      ),
    );
  }

  return violations;
}

export function runLearningFeedbackStage(
  input: LearningFeedbackInput,
  context: LearningFeedbackContext = {},
): LearningFeedbackReport {
  const started = Date.now();
  const stagesCompleted: LearningFeedbackStageId[] = [];
  const inputViolations = validateLearningFeedbackInput(input, context);

  if (inputViolations.length > 0) {
    return {
      valid: false,
      violations: inputViolations,
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  const learningPackage = input.learningPackage;
  const blueprintBefore = JSON.stringify(learningPackage.blueprint.meta);

  stagesCompleted.push(
    LearningFeedbackStage.INPUT_ASSEMBLY,
    LearningFeedbackStage.SOURCE_COLLECTION,
    LearningFeedbackStage.COMMERCIAL_METRICS,
    LearningFeedbackStage.RETRY_HISTORY,
  );

  const { updates: patternUpdates } = updatePatternStatistics(learningPackage, context);
  stagesCompleted.push(LearningFeedbackStage.PATTERN_LEARNING);

  const { updates: antiPatternUpdates } = updateAntiPatternStatistics(learningPackage, context);
  stagesCompleted.push(LearningFeedbackStage.ANTI_PATTERN_LEARNING);

  const knowledgeProposals = [
    ...buildKnowledgeFeedbackProposals(learningPackage, patternUpdates),
    ...detectTrendProposals(learningPackage, patternUpdates),
  ];
  stagesCompleted.push(LearningFeedbackStage.KNOWLEDGE_FEEDBACK);

  const { update: memoryUpdate } = buildDesignMemoryUpdateFromPackage(learningPackage);
  stagesCompleted.push(LearningFeedbackStage.DESIGN_MEMORY_UPDATE);

  const marketplaceInsights = buildMarketplaceLearningInsights(learningPackage);
  stagesCompleted.push(LearningFeedbackStage.TREND_DETECTION, LearningFeedbackStage.MARKETPLACE_LEARNING);

  const learningPackageId = `learning-${learningPackage.projectId}`;
  stagesCompleted.push(LearningFeedbackStage.LEARNING_PACKAGE_BUILD);

  let knowledgeCycle;
  if (!context.skipKnowledgeHandoff) {
    const feedback = buildKnowledgeLearningFeedbackFromPackage(learningPackage);
    knowledgeCycle = runKnowledgeLearningPipeline(learningPackage.projectId, feedback, {
      skipValidation: true,
    });
    stagesCompleted.push(LearningFeedbackStage.KNOWLEDGE_HANDOFF);
  }

  const violations: LearningFeedbackStageViolation[] = [];

  if (patternUpdates.length === 0 && !context.injectNoPatternUpdate) {
    violations.push(
      violation("PATTERN_STATS_NOT_UPDATED", "Pattern statistics must be updated", LearningFeedbackStage.PATTERN_LEARNING),
    );
  }

  if (antiPatternUpdates.length === 0 && context.injectRepeatingAntiPattern) {
    violations.push(
      violation(
        "ANTI_PATTERN_STATS_NOT_UPDATED",
        "Repeating anti-pattern must update statistics",
        LearningFeedbackStage.ANTI_PATTERN_LEARNING,
      ),
    );
  }

  if (memoryUpdate.confidence <= 0) {
    violations.push(
      violation("DESIGN_MEMORY_NOT_UPDATED", "Design Memory must record outcome", LearningFeedbackStage.DESIGN_MEMORY_UPDATE),
    );
  }

  if (
    !context.skipKnowledgeHandoff &&
    knowledgeCycle &&
    knowledgeCycle.confidenceAdjustments.length === 0 &&
    !knowledgeCycle.knowledgeUpdated
  ) {
    violations.push(
      violation("KNOWLEDGE_HANDOFF_FAILED", "Knowledge Learning Engine must receive feedback", LearningFeedbackStage.KNOWLEDGE_HANDOFF),
    );
  }

  if (context.injectUserFeedback && !learningPackage.userFeedback) {
    violations.push(
      violation("USER_FEEDBACK_IGNORED", "User feedback must be included in learning package", LearningFeedbackStage.SOURCE_COLLECTION),
    );
  }

  const blueprintAfter = JSON.stringify(learningPackage.blueprint.meta);
  if (blueprintBefore !== blueprintAfter) {
    violations.push(violation("BLUEPRINT_MUTATED", "Learning stage must not mutate blueprint", LearningFeedbackStage.VALIDATION));
  }

  stagesCompleted.push(LearningFeedbackStage.VALIDATION);

  const section: LearningFeedbackSection = {
    learningPackage,
    patternUpdates,
    antiPatternUpdates,
    knowledgeProposals,
    marketplaceInsights,
    memoryUpdate,
    knowledgeCycle,
    learningPackageId,
    blueprint: learningPackage.blueprint,
    stagesCompleted: [...stagesCompleted],
    confidence: memoryUpdate.confidence,
  };

  stagesCompleted.push(LearningFeedbackStage.STAGE_COMPLETE);
  section.stagesCompleted = stagesCompleted;

  return {
    valid: violations.length === 0,
    violations,
    section,
    stagesCompleted,
    durationMs: Date.now() - started,
  };
}

export function enrichPipelineContextWithLearningFeedback(
  ctx: import("./pipeline-context-engine").GenerationPipelineContext,
  section: LearningFeedbackSection,
): {
  context: import("./pipeline-context-engine").GenerationPipelineContext;
  violations: LearningFeedbackStageViolation[];
} {
  return {
    context: {
      ...ctx,
      blueprint: section.blueprint,
      learning: {
        ...ctx.learning,
        feedbackCollected: true,
        designMemoryUpdated: section.memoryUpdate.confidence > 0,
      },
      validation: {
        ...ctx.validation,
        chiefApproved: section.learningPackage.director.approvalStatus.includes("approved"),
        professionalScore: section.learningPackage.director.professionalLevel,
      },
    },
    violations: [],
  };
}

export function runLearningFeedbackStageFromPipeline(
  context: LearningFeedbackContext = {},
): LearningFeedbackReport {
  const chief = runChiefDesignDirectorReviewStageFromPipeline({
    marketplace: context.marketplace,
    providerId: context.providerId ?? "flux",
  });

  if (!chief.valid || !chief.section) {
    return {
      valid: false,
      violations: [
        violation("MISSING_DIRECTOR_REPORT", "Chief Design Director Review must complete before Learning"),
      ],
      stagesCompleted: [],
      durationMs: 0,
    };
  }

  const commercial = runCommercialValidationStageFromPipeline({
    marketplace: context.marketplace,
    providerId: context.providerId ?? "flux",
    injectWeakValueProposition: context.injectRepeatingAntiPattern,
    injectHeroNotDominant: context.injectRepeatingAntiPattern,
  });

  if (!commercial.valid || !commercial.section) {
    return {
      valid: false,
      violations: [
        violation("MISSING_COMMERCIAL_REPORT", "Commercial Validation must complete before Learning"),
      ],
      stagesCompleted: [],
      durationMs: 0,
    };
  }

  const vision = runVisionValidationStageFromPipeline({
    marketplace: context.marketplace,
    providerId: context.providerId ?? "flux",
    injectHeroTooSmall: context.injectRepeatingAntiPattern,
  });

  if (!vision.valid || !vision.section) {
    return {
      valid: false,
      violations: [
        violation("MISSING_VISION_REPORT", "Vision Validation must complete before Learning"),
      ],
      stagesCompleted: [],
      durationMs: 0,
    };
  }

  const assembly = runBlueprintAssemblyStageFromPipeline();
  const rendering = runRenderingStageSyncFromPipeline({
    marketplace: context.marketplace,
    providerId: context.providerId ?? "flux",
  });

  const pipelineInput = buildDefaultPipelineInput();
  const projectId = `gen-${pipelineInput.category}-${Date.now()}`;

  const learningPackage = buildPlannedLearningPackage({
    projectId,
    blueprint: chief.section.blueprint,
    vision: vision.section.plannedReport,
    commercial: commercial.section.plannedReport,
    director: chief.section.plannedReport,
    metadata: assembly.section?.metadata ?? {
      pipelineVersion: "6.17.0",
      knowledgeEngineVersion: "5.19.0",
      patternLibraryVersion: "5.14.0",
      designRulesVersion: "5.7.0",
      marketplaceProfileVersion: "5.6.0",
      agentsUsed: [],
      assemblyHistory: [],
    },
    imageRef: rendering.section?.imageRef ?? "",
    marketplace: context.marketplace ?? pipelineInput.marketplace,
    userFeedback: context.injectUserFeedback,
  });

  return runLearningFeedbackStage({ learningPackage }, context);
}

export function validateLearningFeedbackStage(
  context: LearningFeedbackContext = {},
): LearningFeedbackSystemReport {
  const violations: LearningFeedbackStageViolation[] = [];

  const kitchen = runLearningFeedbackStageFromPipeline(context);
  if (!kitchen.valid || !kitchen.section) {
    violations.push(...kitchen.violations);
  } else {
    if (!kitchen.section.learningPackageId) {
      violations.push(violation("MISSING_LEARNING_PACKAGE", "Kitchen pipeline must produce learning package"));
    }
    if (kitchen.section.patternUpdates.length === 0) {
      violations.push(violation("PATTERN_STATS_NOT_UPDATED", "Kitchen pipeline must update pattern statistics"));
    }
    if (!kitchen.section.memoryUpdate.confidence) {
      violations.push(violation("DESIGN_MEMORY_NOT_UPDATED", "Kitchen pipeline must update design memory"));
    }
  }

  const withUserFeedback = runLearningFeedbackStageFromPipeline({
    ...context,
    injectUserFeedback: {
      rating: "positive",
      comment: "Strong commercial card",
      timestamp: Date.now(),
    },
  });
  if (!withUserFeedback.section?.learningPackage.userFeedback) {
    violations.push(violation("USER_FEEDBACK_IGNORED", "User feedback must be captured in learning package"));
  }

  const repeating = runLearningFeedbackStageFromPipeline({
    ...context,
    injectRepeatingAntiPattern: true,
  });
  if (!repeating.section?.antiPatternUpdates.length) {
    violations.push(
      violation("ANTI_PATTERN_STATS_NOT_UPDATED", "Repeating anti-pattern must update statistics"),
    );
  }

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    learningPackageBuilt: !!kitchen.section?.learningPackage.projectId,
    patternStatisticsUpdated: !!kitchen.section?.patternUpdates.length,
    antiPatternStatisticsUpdated: !!repeating.section?.antiPatternUpdates.length,
    designMemoryUpdated: !!kitchen.section?.memoryUpdate.confidence,
    knowledgeHandoffComplete: !!kitchen.section?.knowledgeCycle,
    downstreamReady: !!kitchen.section?.learningPackageId,
  };
}

export function assertLearningFeedbackStage(
  context: LearningFeedbackContext = {},
): LearningFeedbackSystemReport {
  const report = validateLearningFeedbackStage(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Learning & Feedback Stage failed: ${messages}`);
  }
  return report;
}

export function runLearningFeedbackStageSystem(
  context: LearningFeedbackContext = {},
): LearningFeedbackSystemReport {
  return validateLearningFeedbackStage(context);
}

export function isLearningFeedbackStageFailure(code: string): code is LearningFeedbackStageFailureCode {
  const codes: LearningFeedbackStageFailureCode[] = [
    "MISSING_VISION_REPORT",
    "MISSING_COMMERCIAL_REPORT",
    "MISSING_DIRECTOR_REPORT",
    "MISSING_LEARNING_PACKAGE",
    "PATTERN_STATS_NOT_UPDATED",
    "ANTI_PATTERN_STATS_NOT_UPDATED",
    "DESIGN_MEMORY_NOT_UPDATED",
    "KNOWLEDGE_HANDOFF_FAILED",
    "USER_FEEDBACK_IGNORED",
    "BLUEPRINT_MUTATED",
    "KNOWLEDGE_DEGRADED",
  ];
  return codes.includes(code as LearningFeedbackStageFailureCode);
}
