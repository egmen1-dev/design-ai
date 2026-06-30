/**
 * Chapter 6.16 — Chief Design Director Review Stage engine.
 * Final executive review across all pipeline reports — never generates images.
 */
import { runBusinessUnderstandingStage } from "./business-understanding-engine";
import { runKnowledgeRetrievalStage } from "./knowledge-retrieval-stage-engine";
import {
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  buildProductAnalysisInputFromPipeline,
} from "./product-analysis-engine";
import { runBlueprintAssemblyStageFromPipeline } from "./blueprint-assembly-stage-engine";
import { runConsensusValidationStageFromPipeline } from "./consensus-validation-stage-engine";
import { runCommercialValidationStageFromPipeline } from "./commercial-validation-stage-engine";
import { buildDefaultPipelineInput } from "./design-pipeline-engine";
import { CHIEF_DESIGN_DIRECTOR_ID } from "./chief-design-director-engine";
import {
  applyContextPatch,
  PipelineContextSection,
  type GenerationPipelineContext,
} from "./pipeline-context-engine";
import { runRenderingStageSyncFromPipeline } from "./rendering-stage-engine";
import { runVisionValidationStageFromPipeline } from "./vision-validation-stage-engine";
import type { RenderBlueprint } from "./types";
import type { BusinessUnderstandingSection } from "./business-understanding-types";
import type { PlannedConsensusReport } from "./consensus-validation-stage-types";
import type { PlannedCommercialReport } from "./commercial-validation-stage-types";
import type { PlannedVisionReport } from "./vision-validation-stage-types";
import {
  ChiefDesignDirectorReviewStage,
  DirectorApprovalStatus,
  DirectorFinalDecision,
  type ChiefDesignDirectorReviewContext,
  type ChiefDesignDirectorReviewInput,
  type ChiefDesignDirectorReviewReport,
  type ChiefDesignDirectorReviewSection,
  type ChiefDesignDirectorReviewStageFailureCode,
  type ChiefDesignDirectorReviewStageId,
  type ChiefDesignDirectorReviewStageViolation,
  type ChiefDesignDirectorReviewSystemReport,
  type DirectorDimensionScores,
  type DirectorLearningFeedback,
  type PlannedDirectorIssue,
  type PlannedDirectorRecommendation,
  type PlannedDirectorReport,
} from "./chief-design-director-review-stage-types";

export {
  ChiefDesignDirectorReviewStage,
  DirectorApprovalStatus,
  DirectorFinalDecision,
  type ChiefDesignDirectorReviewStageId,
  type PlannedDirectorIssue,
  type PlannedDirectorRecommendation,
  type PlannedDirectorReport,
  type DirectorDimensionScores,
  type DirectorLearningFeedback,
  type ChiefDesignDirectorReviewInput,
  type ChiefDesignDirectorReviewSection,
  type ChiefDesignDirectorReviewStageViolation,
  type ChiefDesignDirectorReviewReport,
  type ChiefDesignDirectorReviewContext,
  type ChiefDesignDirectorReviewSystemReport,
  type ChiefDesignDirectorReviewStageFailureCode,
} from "./chief-design-director-review-stage-types";

export const CHIEF_DESIGN_DIRECTOR_REVIEW_VERSION = "6.16.0";

export const CHIEF_DESIGN_DIRECTOR_REVIEW_GOLDEN_RULE =
  "All Design AI agents are specialists — but only Chief Design Director sees the project as a whole. " +
  "The final decision is made not by the image generator, not by a single critic, and not by the render " +
  "provider, but by Chief Design Director — the chief guardian of quality for the entire Design AI platform.";

export const CHIEF_DESIGN_DIRECTOR_REVIEW_PIPELINE: readonly ChiefDesignDirectorReviewStageId[] = [
  ChiefDesignDirectorReviewStage.INPUT_ASSEMBLY,
  ChiefDesignDirectorReviewStage.BUSINESS_REVIEW,
  ChiefDesignDirectorReviewStage.CREATIVE_REVIEW,
  ChiefDesignDirectorReviewStage.TECHNICAL_REVIEW,
  ChiefDesignDirectorReviewStage.MARKETPLACE_REVIEW,
  ChiefDesignDirectorReviewStage.COMMERCIAL_REVIEW,
  ChiefDesignDirectorReviewStage.PROFESSIONAL_SCORE,
  ChiefDesignDirectorReviewStage.RETRY_DECISION,
  ChiefDesignDirectorReviewStage.ESCALATION_POLICY,
  ChiefDesignDirectorReviewStage.FINAL_APPROVAL,
  ChiefDesignDirectorReviewStage.LEARNING_FEEDBACK,
  ChiefDesignDirectorReviewStage.EXPLAINABILITY,
  ChiefDesignDirectorReviewStage.VALIDATION,
  ChiefDesignDirectorReviewStage.STAGE_COMPLETE,
] as const;

export const CHIEF_DESIGN_DIRECTOR_REVIEW_POSITION = [
  "commercial-validation",
  "chief-design-review",
  "retry",
] as const;

export const CHIEF_MIN_PROFESSIONAL_SCORE = 74;
export const CHIEF_MAX_LOCAL_RETRIES = 3;

const RETRY_TARGET_MAP = {
  story: "story-director",
  scene: "scene-director",
  composition: "composition-director",
  lighting: "lighting-director",
  photography: "commercial-photo-director",
  blueprint: "blueprint-assembly",
} as const;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function violation(
  code: ChiefDesignDirectorReviewStageFailureCode,
  message: string,
  stage?: ChiefDesignDirectorReviewStageId,
): ChiefDesignDirectorReviewStageViolation {
  return { code, message, stage };
}

export function scoreBusinessReview(
  business: BusinessUnderstandingSection,
  commercialReport: PlannedCommercialReport,
  consensusReport: PlannedConsensusReport,
  context: ChiefDesignDirectorReviewContext = {},
): number {
  let score = 86;

  if (business.model.primaryValue.length > 10) score += 5;
  if (business.featureChains.length >= 2) score += 4;
  if (consensusReport.overallScore >= 80) score += 3;
  if (commercialReport.sellingPower >= 80) score += 4;

  if (context.injectWeakBusinessAlignment) score -= 32;
  if (!business.model.businessPriority) score -= 12;
  if (commercialReport.sellingPower < 70) score -= 10;

  return clampScore(score);
}

export function scoreCreativeReview(
  blueprint: Readonly<RenderBlueprint>,
  consensusReport: PlannedConsensusReport,
  context: ChiefDesignDirectorReviewContext = {},
): number {
  let score = 88;

  if (blueprint.story.narrative && blueprint.story.narrative.length > 20) score += 4;
  if (blueprint.story.visualFocus) score += 3;
  if (blueprint.composition.templateId) score += 3;
  if (consensusReport.overallScore >= 82) score += 3;

  if (context.injectWeakCreative) score -= 30;
  if (!blueprint.story.hook || blueprint.story.hook.length < 8) score -= 10;
  if (consensusReport.conflicts.length > 2) score -= 8;

  return clampScore(score);
}

export function scoreTechnicalReview(
  visionReport: PlannedVisionReport,
  context: ChiefDesignDirectorReviewContext = {},
): number {
  let score = clampScore(
    visionReport.technicalScore * 0.3 +
      visionReport.compositionScore * 0.25 +
      visionReport.photographyScore * 0.25 +
      visionReport.renderAccuracy * 0.2,
  );

  if (context.injectCriticalTechnical) score -= 35;
  if (!visionReport.approved) score -= 20;
  if (visionReport.violations.some((v) => v.severity === "critical")) score -= 25;

  return clampScore(score);
}

export function scoreMarketplaceReview(
  commercialReport: PlannedCommercialReport,
  consensusReport: PlannedConsensusReport,
  marketplace: string,
  context: ChiefDesignDirectorReviewContext = {},
): number {
  let score = clampScore((commercialReport.marketplaceFit + consensusReport.overallScore) / 2);

  if (marketplace.toLowerCase().includes("wildberries") && commercialReport.marketplaceFit >= 85) {
    score += 3;
  }
  if (consensusReport.retryTargets.some((t) => t.includes("marketplace"))) score -= 12;

  if (context.injectWeakCommercial) score -= 15;

  return clampScore(score);
}

export function scoreCommercialDimension(
  commercialReport: PlannedCommercialReport,
  context: ChiefDesignDirectorReviewContext = {},
): number {
  let score = commercialReport.commercialScore;

  if (commercialReport.ctrPrediction >= 0.05) score += 2;
  if (commercialReport.purchaseIntent >= 85) score += 2;

  if (context.injectWeakCommercial) score -= 28;
  if (!commercialReport.approved) score -= 18;

  return clampScore(score);
}

export function computeDirectorDimensionScores(
  input: ChiefDesignDirectorReviewInput,
  context: ChiefDesignDirectorReviewContext = {},
): DirectorDimensionScores {
  return {
    business: scoreBusinessReview(input.business, input.commercialReport, input.consensusReport, context),
    creative: scoreCreativeReview(input.blueprint, input.consensusReport, context),
    technical: scoreTechnicalReview(input.visionReport, context),
    marketplace: scoreMarketplaceReview(
      input.commercialReport,
      input.consensusReport,
      input.marketplace,
      context,
    ),
    commercial: scoreCommercialDimension(input.commercialReport, context),
  };
}

export function computeProfessionalLevel(dimensions: DirectorDimensionScores): number {
  return clampScore(
    dimensions.business * 0.2 +
      dimensions.creative * 0.2 +
      dimensions.technical * 0.2 +
      dimensions.marketplace * 0.15 +
      dimensions.commercial * 0.25,
  );
}

export function collectCriticalIssues(
  visionReport: PlannedVisionReport,
  commercialReport: PlannedCommercialReport,
  consensusReport: PlannedConsensusReport,
  context: ChiefDesignDirectorReviewContext = {},
): PlannedDirectorIssue[] {
  const issues: PlannedDirectorIssue[] = [];

  for (const v of visionReport.violations.filter((item) => item.severity === "critical")) {
    issues.push({
      id: v.id,
      category: v.category,
      description: v.description,
      severity: v.severity,
      source: "vision-validation",
    });
  }

  for (const conflict of consensusReport.conflicts.filter((c) => c.severity === "critical")) {
    issues.push({
      id: conflict.id,
      category: "consensus",
      description: conflict.description,
      severity: conflict.severity,
      source: "consensus-validation",
    });
  }

  if (context.injectCriticalTechnical) {
    issues.push({
      id: "chief-critical-technical",
      category: "technical",
      description: "Technical quality insufficient for marketplace publication",
      severity: "critical",
      source: "chief-design-director",
    });
  }

  if (context.injectWeakCommercial || !commercialReport.approved) {
    issues.push({
      id: "chief-weak-commercial",
      category: "commercial",
      description: "Commercial potential too weak for publication",
      severity: "critical",
      source: "chief-design-director",
    });
  }

  return issues;
}

export function buildDirectorRecommendations(
  dimensions: DirectorDimensionScores,
  commercialReport: PlannedCommercialReport,
  consensusReport: PlannedConsensusReport,
  context: ChiefDesignDirectorReviewContext = {},
): PlannedDirectorRecommendation[] {
  const recommendations: PlannedDirectorRecommendation[] = [];

  for (const rec of commercialReport.recommendations) {
    recommendations.push({
      target: rec.target,
      action: rec.action,
      reason: rec.reason,
    });
  }

  for (const rec of consensusReport.recommendations) {
    recommendations.push({
      target: rec.target,
      action: rec.action,
      reason: rec.reason,
    });
  }

  if (context.injectWeakBusinessAlignment || dimensions.business < 72) {
    recommendations.push({
      target: RETRY_TARGET_MAP.story,
      action: "Strengthen value proposition and business alignment",
      reason: "Image does not convincingly solve the business goal",
    });
  }

  if (context.injectWeakCreative || dimensions.creative < 72) {
    recommendations.push({
      target: RETRY_TARGET_MAP.story,
      action: "Retry Story Director — improve creative cohesion",
      reason: "Creative story lacks emotional impact and originality",
    });
  }

  if (dimensions.technical < 72) {
    recommendations.push({
      target: RETRY_TARGET_MAP.photography,
      action: "Improve commercial photography quality",
      reason: "Technical review score below professional threshold",
    });
  }

  if (dimensions.marketplace < 72) {
    recommendations.push({
      target: RETRY_TARGET_MAP.composition,
      action: "Adjust composition for marketplace competitiveness",
      reason: "Thumbnail readability and category fit need improvement",
    });
  }

  return recommendations;
}

export function planDirectorRetryTargets(
  recommendations: PlannedDirectorRecommendation[],
  criticalIssues: PlannedDirectorIssue[],
  context: ChiefDesignDirectorReviewContext = {},
): string[] {
  const targets = new Set<string>();

  for (const rec of recommendations) {
    if (rec.target) targets.add(rec.target);
  }

  for (const issue of criticalIssues) {
    if (issue.category === "technical") targets.add(RETRY_TARGET_MAP.photography);
    if (issue.category === "consensus") targets.add(RETRY_TARGET_MAP.scene);
    if (issue.category === "commercial") targets.add(RETRY_TARGET_MAP.story);
  }

  if (context.injectWeakCreative) targets.add(RETRY_TARGET_MAP.story);
  if (context.injectWeakBusinessAlignment) targets.add(RETRY_TARGET_MAP.story);
  if (context.injectCriticalTechnical) targets.add(RETRY_TARGET_MAP.lighting);

  return [...targets];
}

export function resolveEscalation(
  professionalLevel: number,
  criticalIssues: PlannedDirectorIssue[],
  retryAttempts: number,
  context: ChiefDesignDirectorReviewContext = {},
): { blueprintRebuild: boolean; retryRequired: boolean } {
  if (context.injectBlueprintRebuild) {
    return { blueprintRebuild: true, retryRequired: true };
  }

  const exhausted =
    context.injectExhaustedRetries || retryAttempts >= CHIEF_MAX_LOCAL_RETRIES;

  if (exhausted && professionalLevel < CHIEF_MIN_PROFESSIONAL_SCORE) {
    return { blueprintRebuild: true, retryRequired: true };
  }

  if (criticalIssues.length >= 3 && professionalLevel < 65) {
    return { blueprintRebuild: true, retryRequired: true };
  }

  if (professionalLevel < CHIEF_MIN_PROFESSIONAL_SCORE || criticalIssues.length > 0) {
    return { blueprintRebuild: false, retryRequired: true };
  }

  return { blueprintRebuild: false, retryRequired: false };
}

export function determineApprovalStatus(
  professionalLevel: number,
  retryRequired: boolean,
  blueprintRebuild: boolean,
  recommendations: PlannedDirectorRecommendation[],
): string {
  if (blueprintRebuild) return DirectorApprovalStatus.BLUEPRINT_REBUILD;
  if (retryRequired) return DirectorApprovalStatus.RETRY_REQUIRED;
  if (recommendations.length > 0) return DirectorApprovalStatus.APPROVED_WITH_NOTES;
  if (professionalLevel >= CHIEF_MIN_PROFESSIONAL_SCORE) return DirectorApprovalStatus.APPROVED;
  return DirectorApprovalStatus.RETRY_REQUIRED;
}

export function mapApprovalToFinalDecision(approvalStatus: string): string {
  switch (approvalStatus) {
    case DirectorApprovalStatus.APPROVED:
      return DirectorFinalDecision.APPROVED;
    case DirectorApprovalStatus.APPROVED_WITH_NOTES:
      return DirectorFinalDecision.APPROVED_WITH_NOTES;
    case DirectorApprovalStatus.BLUEPRINT_REBUILD:
      return DirectorFinalDecision.BLUEPRINT_REBUILD;
    default:
      return DirectorFinalDecision.RETRY_REQUIRED;
  }
}

export function buildDirectorLearningFeedback(
  plannedReport: PlannedDirectorReport,
  dimensions: DirectorDimensionScores,
): DirectorLearningFeedback {
  const successes: string[] = [];
  const errors: string[] = [];

  if (dimensions.business >= 85) successes.push("Strong business goal alignment");
  if (dimensions.creative >= 85) successes.push("Cohesive creative story and composition");
  if (dimensions.technical >= 85) successes.push("Professional technical execution");
  if (dimensions.commercial >= 85) successes.push("High commercial conversion potential");

  if (dimensions.business < 72) errors.push("Business value proposition unclear");
  if (dimensions.creative < 72) errors.push("Creative direction lacks impact");
  if (dimensions.technical < 72) errors.push("Technical quality below publication standard");
  if (dimensions.commercial < 72) errors.push("Weak commercial selling power");

  for (const issue of plannedReport.criticalIssues) {
    errors.push(issue.description);
  }

  return {
    professionalScore: plannedReport.professionalLevel,
    successes,
    errors,
    recommendations: plannedReport.recommendations.map((r) => `${r.action}: ${r.reason}`),
  };
}

export function buildPlannedDirectorReport(
  dimensions: DirectorDimensionScores,
  criticalIssues: PlannedDirectorIssue[],
  recommendations: PlannedDirectorRecommendation[],
  retryTargets: string[],
  escalation: { blueprintRebuild: boolean; retryRequired: boolean },
): PlannedDirectorReport {
  const professionalLevel = computeProfessionalLevel(dimensions);
  const approvalStatus = determineApprovalStatus(
    professionalLevel,
    escalation.retryRequired,
    escalation.blueprintRebuild,
    recommendations,
  );
  const finalDecision = mapApprovalToFinalDecision(approvalStatus);

  return {
    overallScore: professionalLevel,
    professionalLevel,
    approvalStatus,
    retryRequired: escalation.retryRequired,
    retryTargets: escalation.retryRequired || escalation.blueprintRebuild ? retryTargets : [],
    criticalIssues,
    recommendations,
    finalDecision,
  };
}

export function validateChiefDesignDirectorReviewInput(
  input: ChiefDesignDirectorReviewInput,
  context: ChiefDesignDirectorReviewContext = {},
): ChiefDesignDirectorReviewStageViolation[] {
  const violations: ChiefDesignDirectorReviewStageViolation[] = [];

  if (context.missingVisionReport || !input.visionReport) {
    violations.push(
      violation(
        "MISSING_VISION_REPORT",
        "Vision Report required from Vision Validation Stage",
        ChiefDesignDirectorReviewStage.INPUT_ASSEMBLY,
      ),
    );
  }
  if (context.missingCommercialReport || !input.commercialReport) {
    violations.push(
      violation(
        "MISSING_COMMERCIAL_REPORT",
        "Commercial Report required from Commercial Validation Stage",
        ChiefDesignDirectorReviewStage.INPUT_ASSEMBLY,
      ),
    );
  }
  if (context.missingConsensusReport || !input.consensusReport) {
    violations.push(
      violation(
        "MISSING_CONSENSUS_REPORT",
        "Consensus Report required from Consensus Validation Stage",
        ChiefDesignDirectorReviewStage.INPUT_ASSEMBLY,
      ),
    );
  }

  return violations;
}

export function runChiefDesignDirectorReviewStage(
  input: ChiefDesignDirectorReviewInput,
  context: ChiefDesignDirectorReviewContext = {},
): ChiefDesignDirectorReviewReport {
  const started = Date.now();
  const stagesCompleted: ChiefDesignDirectorReviewStageId[] = [];

  const inputViolations = validateChiefDesignDirectorReviewInput(input, context);
  if (inputViolations.length > 0) {
    return {
      valid: false,
      violations: inputViolations,
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  stagesCompleted.push(ChiefDesignDirectorReviewStage.INPUT_ASSEMBLY);

  const dimensions = computeDirectorDimensionScores(input, context);
  stagesCompleted.push(
    ChiefDesignDirectorReviewStage.BUSINESS_REVIEW,
    ChiefDesignDirectorReviewStage.CREATIVE_REVIEW,
    ChiefDesignDirectorReviewStage.TECHNICAL_REVIEW,
    ChiefDesignDirectorReviewStage.MARKETPLACE_REVIEW,
    ChiefDesignDirectorReviewStage.COMMERCIAL_REVIEW,
  );

  const criticalIssues = collectCriticalIssues(
    input.visionReport,
    input.commercialReport,
    input.consensusReport,
    context,
  );
  const recommendations = buildDirectorRecommendations(
    dimensions,
    input.commercialReport,
    input.consensusReport,
    context,
  );
  const retryTargets = planDirectorRetryTargets(recommendations, criticalIssues, context);
  const retryAttempts = context.retryAttempts ?? input.blueprint.meta.retry ?? 0;
  const professionalLevel = computeProfessionalLevel(dimensions);

  stagesCompleted.push(ChiefDesignDirectorReviewStage.PROFESSIONAL_SCORE);

  const escalation = resolveEscalation(professionalLevel, criticalIssues, retryAttempts, context);
  stagesCompleted.push(
    ChiefDesignDirectorReviewStage.RETRY_DECISION,
    ChiefDesignDirectorReviewStage.ESCALATION_POLICY,
  );

  const plannedReport = buildPlannedDirectorReport(
    dimensions,
    criticalIssues,
    recommendations,
    retryTargets,
    escalation,
  );
  stagesCompleted.push(ChiefDesignDirectorReviewStage.FINAL_APPROVAL);

  const learningFeedback = buildDirectorLearningFeedback(plannedReport, dimensions);
  stagesCompleted.push(ChiefDesignDirectorReviewStage.LEARNING_FEEDBACK);

  const violations: ChiefDesignDirectorReviewStageViolation[] = [];

  if (!input.business.model.businessPriority && !context.missingConsensusReport) {
    violations.push(
      violation(
        "BUSINESS_GOAL_IGNORED",
        "Business priority must inform chief review",
        ChiefDesignDirectorReviewStage.BUSINESS_REVIEW,
      ),
    );
  }

  if (plannedReport.professionalLevel < 50 && !context.injectWeakCommercial) {
    const commercialWeight = dimensions.commercial;
    const technicalOnly =
      dimensions.technical >= 90 &&
      dimensions.business < 60 &&
      dimensions.commercial < 60;
    if (technicalOnly) {
      violations.push(
        violation(
          "SINGLE_METRIC_DECISION",
          "Chief must not approve based on technical quality alone",
          ChiefDesignDirectorReviewStage.COMMERCIAL_REVIEW,
        ),
      );
    }
    if (commercialWeight < 40) {
      violations.push(
        violation(
          "COMMERCIAL_SCORE_IGNORED",
          "Commercial dimension must influence final decision",
          ChiefDesignDirectorReviewStage.COMMERCIAL_REVIEW,
        ),
      );
    }
  }

  for (const rec of recommendations) {
    if (!rec.reason || !rec.action) {
      violations.push(
        violation(
          "MISSING_EXPLAINABILITY",
          "Every recommendation must be explainable",
          ChiefDesignDirectorReviewStage.EXPLAINABILITY,
        ),
      );
      break;
    }
  }

  const approved =
    plannedReport.approvalStatus === DirectorApprovalStatus.APPROVED ||
    plannedReport.approvalStatus === DirectorApprovalStatus.APPROVED_WITH_NOTES;

  if (approved && plannedReport.professionalLevel < CHIEF_MIN_PROFESSIONAL_SCORE) {
    violations.push(
      violation(
        "UNAPPROVED_WITH_LOW_SCORE",
        "Low professional score must block approval",
        ChiefDesignDirectorReviewStage.FINAL_APPROVAL,
      ),
    );
  }

  if (
    plannedReport.retryRequired &&
    plannedReport.retryTargets.length === 0 &&
    !plannedReport.approvalStatus.includes("blueprint")
  ) {
    violations.push(
      violation(
        "CHAOTIC_RETRY",
        "Retry required must identify specific retry targets",
        ChiefDesignDirectorReviewStage.RETRY_DECISION,
      ),
    );
  }

  stagesCompleted.push(
    ChiefDesignDirectorReviewStage.EXPLAINABILITY,
    ChiefDesignDirectorReviewStage.VALIDATION,
  );

  const section: ChiefDesignDirectorReviewSection = {
    plannedReport,
    dimensionScores: dimensions,
    learningFeedback,
    blueprint: {
      ...input.blueprint,
      validation: {
        ...input.blueprint.validation,
        chiefApproved: approved,
        professionalScore: plannedReport.professionalLevel,
        warnings: plannedReport.recommendations.map((r) => r.reason),
      },
    },
    stagesCompleted: [...stagesCompleted],
    confidence: approved ? 0.96 : escalation.blueprintRebuild ? 0.35 : 0.45,
  };

  stagesCompleted.push(ChiefDesignDirectorReviewStage.STAGE_COMPLETE);
  section.stagesCompleted = stagesCompleted;

  return {
    valid: violations.length === 0,
    violations,
    section,
    stagesCompleted,
    durationMs: Date.now() - started,
  };
}

export function enrichPipelineContextWithChiefDesignDirectorReview(
  ctx: GenerationPipelineContext,
  section: ChiefDesignDirectorReviewSection,
): {
  context: GenerationPipelineContext;
  violations: ChiefDesignDirectorReviewStageViolation[];
} {
  const approved =
    section.plannedReport.approvalStatus === DirectorApprovalStatus.APPROVED ||
    section.plannedReport.approvalStatus === DirectorApprovalStatus.APPROVED_WITH_NOTES;

  const patch = applyContextPatch(ctx, {
    agentId: CHIEF_DESIGN_DIRECTOR_ID,
    section: PipelineContextSection.VALIDATION,
    changes: {
      chiefApproved: approved,
      professionalScore: section.plannedReport.professionalLevel,
      directorDecision: section.plannedReport.finalDecision,
      retryTargets: section.plannedReport.retryTargets,
    },
    reason: "Chief Design Director Review recorded final executive decision",
  });

  return {
    context: {
      ...patch.context,
      blueprint: section.blueprint,
      validation: {
        ...patch.context.validation,
        chiefApproved: approved,
        professionalScore: section.plannedReport.professionalLevel,
        violations: section.plannedReport.criticalIssues.map((i) => i.description),
      },
      learning: {
        ...patch.context.learning,
        feedbackCollected: true,
        designMemoryUpdated: approved,
      },
    },
    violations: patch.violations as ChiefDesignDirectorReviewStageViolation[],
  };
}

export function runChiefDesignDirectorReviewStageFromPipeline(
  context: ChiefDesignDirectorReviewContext = {},
): ChiefDesignDirectorReviewReport {
  const commercial = runCommercialValidationStageFromPipeline({
    marketplace: context.marketplace,
    providerId: context.providerId ?? "flux",
    injectWeakValueProposition: context.injectWeakCommercial,
    injectLowTrust: context.injectWeakCommercial,
  });

  if (!commercial.valid || !commercial.section) {
    return {
      valid: false,
      violations: [
        violation(
          "MISSING_COMMERCIAL_REPORT",
          "Commercial Validation must complete before Chief Design Director Review",
        ),
      ],
      stagesCompleted: [],
      durationMs: 0,
    };
  }

  const vision = runVisionValidationStageFromPipeline({
    marketplace: context.marketplace,
    providerId: context.providerId ?? "flux",
    injectCriticalArtifact: context.injectCriticalTechnical,
    injectLightingDrift: context.injectCriticalTechnical,
  });

  if (!vision.valid || !vision.section) {
    return {
      valid: false,
      violations: [
        violation("MISSING_VISION_REPORT", "Vision Validation must complete before Chief review"),
      ],
      stagesCompleted: [],
      durationMs: 0,
    };
  }

  const consensus = runConsensusValidationStageFromPipeline();
  const assembly = runBlueprintAssemblyStageFromPipeline();
  const pipelineInput = buildDefaultPipelineInput();
  const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(pipelineInput));
  const knowledge = runKnowledgeRetrievalStage({
    profile: analysis.section!.profile,
    marketplace: pipelineInput.marketplace,
  });
  const business = runBusinessUnderstandingStage({
    profile: analysis.section!.profile,
    knowledge: knowledge.package!,
    marketplace: pipelineInput.marketplace,
    brand: pipelineInput.brand,
  });
  const rendering = runRenderingStageSyncFromPipeline({
    marketplace: context.marketplace,
    providerId: context.providerId ?? "flux",
  });

  return runChiefDesignDirectorReviewStage(
    {
      profile: analysis.section!.profile,
      business: business.section!,
      blueprint: commercial.section.blueprint,
      visionReport: vision.section.plannedReport,
      commercialReport: commercial.section.plannedReport,
      consensusReport: consensus.section?.plannedReport ?? {
        overallScore: 0,
        status: "inconsistent",
        conflicts: [],
        recommendations: [],
        retryRequired: true,
        retryTargets: [],
        approved: false,
      },
      metadata: assembly.section?.metadata ?? {
        pipelineVersion: "6.0",
        knowledgeEngineVersion: "1.0",
        patternLibraryVersion: "1.0",
        designRulesVersion: "1.0",
        marketplaceProfileVersion: "1.0",
        agentsUsed: [],
        assemblyHistory: [],
      },
      imageRef: rendering.section?.imageRef ?? "",
      knowledge: knowledge.package!,
      marketplace: context.marketplace ?? pipelineInput.marketplace,
    },
    context,
  );
}

export function validateChiefDesignDirectorReviewStage(
  context: ChiefDesignDirectorReviewContext = {},
): ChiefDesignDirectorReviewSystemReport {
  const violations: ChiefDesignDirectorReviewStageViolation[] = [];

  const kitchen = runChiefDesignDirectorReviewStageFromPipeline(context);
  if (!kitchen.valid || !kitchen.section) {
    violations.push(...kitchen.violations);
  } else {
    if (!kitchen.section.plannedReport.professionalLevel) {
      violations.push(
        violation("MISSING_DIRECTOR_REPORT", "Kitchen pipeline must compute professional score"),
      );
    }
    if (!kitchen.section.plannedReport.finalDecision) {
      violations.push(
        violation("MISSING_DIRECTOR_REPORT", "Kitchen pipeline must produce final decision"),
      );
    }
  }

  const weakCommercial = runChiefDesignDirectorReviewStageFromPipeline({
    ...context,
    injectWeakCommercial: true,
  });
  if (
    weakCommercial.section?.plannedReport.approvalStatus === DirectorApprovalStatus.APPROVED ||
    weakCommercial.section?.plannedReport.approvalStatus === DirectorApprovalStatus.APPROVED_WITH_NOTES
  ) {
    violations.push(
      violation("WEAK_IMAGE_APPROVED", "Weak commercial potential must block chief approval"),
    );
  }

  const criticalTechnical = runChiefDesignDirectorReviewStageFromPipeline({
    ...context,
    injectCriticalTechnical: true,
  });
  if (!criticalTechnical.section?.plannedReport.retryRequired) {
    violations.push(
      violation("UNAPPROVED_WITH_LOW_SCORE", "Critical technical issues must require retry"),
    );
  }
  if (!criticalTechnical.section?.plannedReport.retryTargets.length) {
    violations.push(
      violation("CHAOTIC_RETRY", "Critical technical retry must name retry targets"),
    );
  }

  const differentiated =
    !!kitchen.section &&
    !!weakCommercial.section &&
    kitchen.section.plannedReport.professionalLevel !==
      weakCommercial.section.plannedReport.professionalLevel;

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    multiDimensionalReview: !!kitchen.section?.dimensionScores.business,
    allReportsConsidered: !!kitchen.section?.plannedReport.overallScore,
    explainabilityComplete: !!criticalTechnical.section?.plannedReport.recommendations.length,
    retryTargeted: !!criticalTechnical.section?.plannedReport.retryTargets.length,
    downstreamReady: !!kitchen.section?.plannedReport.finalDecision,
  };
}

export function assertChiefDesignDirectorReviewStage(
  context: ChiefDesignDirectorReviewContext = {},
): ChiefDesignDirectorReviewSystemReport {
  const report = validateChiefDesignDirectorReviewStage(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Chief Design Director Review Stage failed: ${messages}`);
  }
  return report;
}

export function runChiefDesignDirectorReviewStageSystem(
  context: ChiefDesignDirectorReviewContext = {},
): ChiefDesignDirectorReviewSystemReport {
  return validateChiefDesignDirectorReviewStage(context);
}

export function isChiefDesignDirectorReviewStageFailure(
  code: string,
): code is ChiefDesignDirectorReviewStageFailureCode {
  const codes: ChiefDesignDirectorReviewStageFailureCode[] = [
    "MISSING_VISION_REPORT",
    "MISSING_COMMERCIAL_REPORT",
    "MISSING_CONSENSUS_REPORT",
    "MISSING_DIRECTOR_REPORT",
    "SINGLE_METRIC_DECISION",
    "BUSINESS_GOAL_IGNORED",
    "COMMERCIAL_SCORE_IGNORED",
    "UNAPPROVED_WITH_LOW_SCORE",
    "MISSING_EXPLAINABILITY",
    "CHAOTIC_RETRY",
    "WEAK_IMAGE_APPROVED",
  ];
  return codes.includes(code as ChiefDesignDirectorReviewStageFailureCode);
}
