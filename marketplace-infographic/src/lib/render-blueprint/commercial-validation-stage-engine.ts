/**
 * Chapter 6.15 — Commercial Validation Stage engine.
 * Evaluates commercial effectiveness — never technical image quality.
 */
import { runBusinessUnderstandingStage } from "./business-understanding-engine";
import { runKnowledgeRetrievalStage } from "./knowledge-retrieval-stage-engine";
import {
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  buildProductAnalysisInputFromPipeline,
} from "./product-analysis-engine";
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
import type { PlannedVisionReport } from "./vision-validation-stage-types";
import {
  CommercialValidationStage,
  type CommercialLayerScores,
  type CommercialValidationContext,
  type CommercialValidationInput,
  type CommercialValidationReport,
  type CommercialValidationSection,
  type CommercialValidationStageFailureCode,
  type CommercialValidationStageId,
  type CommercialValidationStageViolation,
  type CommercialValidationSystemReport,
  type PlannedCommercialRecommendation,
  type PlannedCommercialReport,
} from "./commercial-validation-stage-types";

export {
  CommercialValidationStage,
  type CommercialValidationStageId,
  type PlannedCommercialRecommendation,
  type PlannedCommercialReport,
  type CommercialLayerScores,
  type CommercialValidationInput,
  type CommercialValidationSection,
  type CommercialValidationStageViolation,
  type CommercialValidationReport,
  type CommercialValidationContext,
  type CommercialValidationSystemReport,
  type CommercialValidationStageFailureCode,
} from "./commercial-validation-stage-types";

export const COMMERCIAL_VALIDATION_VERSION = "6.15.0";

export const COMMERCIAL_VALIDATION_GOLDEN_RULE =
  "Perfect composition, flawless lighting, and professional photography have no value if the image " +
  "does not help sell the product. Commercial Validation reminds the system that Design AI exists " +
  "to create commercially effective visual communication — not beautiful pictures.";

export const COMMERCIAL_VALIDATION_PIPELINE: readonly CommercialValidationStageId[] = [
  CommercialValidationStage.INPUT_ASSEMBLY,
  CommercialValidationStage.ATTENTION_ANALYSIS,
  CommercialValidationStage.CTR_PREDICTION,
  CommercialValidationStage.TRUST_ANALYSIS,
  CommercialValidationStage.SELLING_POWER,
  CommercialValidationStage.MARKETPLACE_FIT,
  CommercialValidationStage.PURCHASE_INTENT,
  CommercialValidationStage.BUSINESS_GOAL_ALIGNMENT,
  CommercialValidationStage.CLARITY_ANALYSIS,
  CommercialValidationStage.COMMERCIAL_SCORE,
  CommercialValidationStage.RECOMMENDATION_ENGINE,
  CommercialValidationStage.EXPLAINABILITY,
  CommercialValidationStage.APPROVAL_DECISION,
  CommercialValidationStage.VALIDATION,
  CommercialValidationStage.STAGE_COMPLETE,
] as const;

export const COMMERCIAL_VALIDATION_POSITION = [
  "vision-analysis",
  "commercial-validation",
  "chief-design-review",
] as const;

export const COMMERCIAL_MIN_APPROVAL_SCORE = 72;

const RETRY_TARGET_MAP: Record<string, string> = {
  attention: "composition-director",
  composition: "composition-director",
  story: "visual-story-director",
  value: "business-understanding",
  marketplace: "composition-director",
  trust: "commercial-photo-director",
  clarity: "visual-story-director",
};

function violation(
  code: CommercialValidationStageFailureCode,
  message: string,
  stage?: CommercialValidationStageId,
): CommercialValidationStageViolation {
  return { code, message, stage };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function clampCtr(value: number): number {
  return Math.max(0.01, Math.min(0.2, Math.round(value * 1000) / 1000));
}

export function scoreAttention(
  blueprint: Readonly<RenderBlueprint>,
  visionReport: PlannedVisionReport,
  context: CommercialValidationContext = {},
): number {
  let score = 86;
  const heroWidth = blueprint.composition.heroArea?.width ?? 0.45;
  const heroWeight = blueprint.composition.heroWeight ?? 50;

  if (context.injectHeroNotDominant || heroWidth < 0.35) score -= 28;
  if (!blueprint.story.hook || blueprint.story.hook.length < 8) score -= 12;
  if (context.injectWeakStory) score -= 22;
  if (heroWeight < 45) score -= 10;

  score += Math.min(10, visionReport.compositionScore / 12);
  if (blueprint.story.visualFocus) score += 4;

  return clampScore(score);
}

export function predictCtr(
  attentionScore: number,
  sellingPower: number,
  marketplaceFit: number,
  business: BusinessUnderstandingSection,
  context: CommercialValidationContext = {},
): number {
  let ctr = 0.035 + attentionScore / 2800 + sellingPower / 3200 + marketplaceFit / 4000;

  const priority = business.model.businessPriority.toLowerCase();
  if (priority.includes("ctr") || priority.includes("conversion")) ctr += 0.012;
  if (priority.includes("trust")) ctr += 0.004;
  if (priority.includes("premium")) ctr += 0.003;

  if (context.injectWeakValueProposition) ctr -= 0.025;
  if (context.injectHeroNotDominant) ctr -= 0.015;
  if (context.injectLowMarketplaceFit) ctr -= 0.02;

  return clampCtr(ctr);
}

export function scoreTrust(
  visionReport: PlannedVisionReport,
  business: BusinessUnderstandingSection,
  context: CommercialValidationContext = {},
): number {
  let score = clampScore((visionReport.technicalScore + visionReport.artifactScore + visionReport.renderAccuracy) / 3);

  if (business.model.businessPriority.toLowerCase().includes("trust")) {
    score += 4;
  }
  if (business.competitiveStrategy.includes("reliable") || business.competitiveStrategy.includes("professional")) {
    score += 3;
  }
  if (context.injectLowTrust) score -= 25;
  if (visionReport.violations.some((v) => v.severity === "critical")) score -= 15;

  return clampScore(score);
}

export function scoreSellingPower(
  blueprint: Readonly<RenderBlueprint>,
  business: BusinessUnderstandingSection,
  context: CommercialValidationContext = {},
): number {
  let score = 84;

  if (business.model.primaryValue.length > 10) score += 6;
  if (business.featureChains.length >= 2) score += 4;
  if (blueprint.story.narrative && blueprint.story.narrative.length > 20) score += 5;
  if (blueprint.story.visualPromise) score += 3;

  if (context.injectWeakValueProposition || !business.model.primaryValue) score -= 30;
  if (context.injectWeakStory || !blueprint.story.narrative) score -= 18;
  if (!business.rankedPriorities.length) score -= 8;

  return clampScore(score);
}

export function scoreMarketplaceFit(
  blueprint: Readonly<RenderBlueprint>,
  business: BusinessUnderstandingSection,
  marketplace: string,
  visionReport: PlannedVisionReport,
  context: CommercialValidationContext = {},
): number {
  let score = 88;

  if (marketplace.toLowerCase().includes("wildberries")) {
    if ((blueprint.composition.safeZones?.length ?? 0) > 0) score += 4;
    else score -= 12;
  }
  if (marketplace.toLowerCase().includes("amazon")) {
    if (blueprint.constraints.mustAvoidText) score += 3;
  }

  if (business.model.businessPriority.toLowerCase().includes("premium") && blueprint.creative.priceSegment === "premium") {
    score += 4;
  }

  score += Math.min(6, visionReport.renderAccuracy / 18);
  if (context.injectLowMarketplaceFit) score -= 28;

  return clampScore(score);
}

export function scorePurchaseIntent(
  trustScore: number,
  sellingPower: number,
  attentionScore: number,
  business: BusinessUnderstandingSection,
): number {
  let score = clampScore(trustScore * 0.35 + sellingPower * 0.35 + attentionScore * 0.3);

  if (business.model.purchaseMotivations.length >= 2) score += 4;
  if (business.model.emotionalDrivers.length >= 2) score += 3;

  return clampScore(score);
}

export function scoreClarity(
  blueprint: Readonly<RenderBlueprint>,
  business: BusinessUnderstandingSection,
  context: CommercialValidationContext = {},
): number {
  let score = 85;

  if (blueprint.constraints.mustLeaveHeadlineSpace) score += 3;
  if (blueprint.composition.negativeSpace && blueprint.composition.negativeSpace > 25) score += 5;
  if (business.featureChains.some((c) => c.benefit.length > 8)) score += 4;

  if (context.injectWeakValueProposition) score -= 20;
  if (!blueprint.story.customerDesire) score -= 8;

  return clampScore(score);
}

export function computeCommercialLayerScores(
  input: CommercialValidationInput,
  context: CommercialValidationContext = {},
): CommercialLayerScores {
  const attention = scoreAttention(input.blueprint, input.visionReport, context);
  const trust = scoreTrust(input.visionReport, input.business, context);
  const sellingPower = scoreSellingPower(input.blueprint, input.business, context);
  const marketplaceFit = scoreMarketplaceFit(input.blueprint, input.business, input.marketplace, input.visionReport, context);
  const clarity = scoreClarity(input.blueprint, input.business, context);
  const purchaseIntent = scorePurchaseIntent(trust, sellingPower, attention, input.business);

  return { attention, trust, sellingPower, marketplaceFit, purchaseIntent, clarity };
}

export function computeCommercialScore(layerScores: CommercialLayerScores): number {
  return clampScore(
    layerScores.attention * 0.2 +
      layerScores.trust * 0.18 +
      layerScores.sellingPower * 0.22 +
      layerScores.marketplaceFit * 0.15 +
      layerScores.purchaseIntent * 0.15 +
      layerScores.clarity * 0.1,
  );
}

export function buildCommercialRecommendations(
  layerScores: CommercialLayerScores,
  context: CommercialValidationContext = {},
): PlannedCommercialRecommendation[] {
  const recommendations: PlannedCommercialRecommendation[] = [];

  if (context.injectWeakValueProposition || layerScores.sellingPower < 70) {
    recommendations.push({
      target: RETRY_TARGET_MAP.value,
      action: "Increase Value Proposition",
      reason: "Primary benefit too weak for marketplace conversion",
    });
  }
  if (context.injectHeroNotDominant || layerScores.attention < 70) {
    recommendations.push({
      target: RETRY_TARGET_MAP.composition,
      action: "Retry Composition Director — increase hero dominance",
      reason: "Hero product does not dominate thumbnail attention",
    });
  }
  if (context.injectWeakStory || layerScores.clarity < 72) {
    recommendations.push({
      target: RETRY_TARGET_MAP.story,
      action: "Retry Story Director — strengthen emotional hook",
      reason: "Story does not create sufficient purchase emotion",
    });
  }
  if (context.injectLowMarketplaceFit || layerScores.marketplaceFit < 72) {
    recommendations.push({
      target: RETRY_TARGET_MAP.marketplace,
      action: "Adjust composition for marketplace safe zones",
      reason: "Image does not fit marketplace thumbnail expectations",
    });
  }
  if (context.injectLowTrust || layerScores.trust < 70) {
    recommendations.push({
      target: RETRY_TARGET_MAP.trust,
      action: "Improve commercial photography trust signals",
      reason: "Trust score too low for conversion",
    });
  }

  return recommendations;
}

export function buildPlannedCommercialReport(
  layerScores: CommercialLayerScores,
  ctrPrediction: number,
  recommendations: PlannedCommercialRecommendation[],
): PlannedCommercialReport {
  const commercialScore = computeCommercialScore(layerScores);
  const approved = commercialScore >= COMMERCIAL_MIN_APPROVAL_SCORE && recommendations.length === 0;

  return {
    commercialScore,
    ctrPrediction,
    attentionScore: layerScores.attention,
    clarityScore: layerScores.clarity,
    trustScore: layerScores.trust,
    sellingPower: layerScores.sellingPower,
    marketplaceFit: layerScores.marketplaceFit,
    purchaseIntent: layerScores.purchaseIntent,
    recommendations,
    approved,
  };
}

export function validateCommercialValidationInput(
  input: CommercialValidationInput,
  context: CommercialValidationContext = {},
): CommercialValidationStageViolation[] {
  const violations: CommercialValidationStageViolation[] = [];

  if (context.missingVisionReport || !input.visionReport) {
    violations.push(violation("MISSING_VISION_REPORT", "Vision Report required from Vision Validation Stage", CommercialValidationStage.INPUT_ASSEMBLY));
  }
  if (context.missingBusinessModel || !input.business?.model?.primaryValue) {
    violations.push(violation("MISSING_BUSINESS_MODEL", "Business Model required for commercial evaluation", CommercialValidationStage.INPUT_ASSEMBLY));
  }

  return violations;
}

export function runCommercialValidationStage(
  input: CommercialValidationInput,
  context: CommercialValidationContext = {},
): CommercialValidationReport {
  const started = Date.now();
  const stagesCompleted: CommercialValidationStageId[] = [];

  const inputViolations = validateCommercialValidationInput(input, context);
  if (inputViolations.length > 0) {
    return {
      valid: false,
      violations: inputViolations,
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  stagesCompleted.push(CommercialValidationStage.INPUT_ASSEMBLY);

  const layerScores = computeCommercialLayerScores(input, context);
  stagesCompleted.push(
    CommercialValidationStage.ATTENTION_ANALYSIS,
    CommercialValidationStage.TRUST_ANALYSIS,
    CommercialValidationStage.SELLING_POWER,
    CommercialValidationStage.MARKETPLACE_FIT,
    CommercialValidationStage.PURCHASE_INTENT,
    CommercialValidationStage.BUSINESS_GOAL_ALIGNMENT,
    CommercialValidationStage.CLARITY_ANALYSIS,
  );

  const ctrPrediction = predictCtr(
    layerScores.attention,
    layerScores.sellingPower,
    layerScores.marketplaceFit,
    input.business,
    context,
  );
  stagesCompleted.push(CommercialValidationStage.CTR_PREDICTION);

  const recommendations = buildCommercialRecommendations(layerScores, context);
  const plannedReport = buildPlannedCommercialReport(layerScores, ctrPrediction, recommendations);
  stagesCompleted.push(CommercialValidationStage.COMMERCIAL_SCORE, CommercialValidationStage.RECOMMENDATION_ENGINE);

  const violations: CommercialValidationStageViolation[] = [];

  if (!plannedReport.ctrPrediction) {
    violations.push(violation("MISSING_CTR_PREDICTION", "CTR prediction must be calculated", CommercialValidationStage.CTR_PREDICTION));
  }

  if (input.business.model.businessPriority.length < 3 && !context.missingBusinessModel) {
    violations.push(violation("BUSINESS_GOAL_IGNORED", "Business priority must inform commercial scoring", CommercialValidationStage.BUSINESS_GOAL_ALIGNMENT));
  }

  for (const rec of recommendations) {
    if (!rec.reason || !rec.action) {
      violations.push(violation("MISSING_EXPLAINABILITY", "Every recommendation must be explainable", CommercialValidationStage.EXPLAINABILITY));
      break;
    }
  }

  if (plannedReport.approved && plannedReport.commercialScore < COMMERCIAL_MIN_APPROVAL_SCORE) {
    violations.push(violation("UNAPPROVED_WITH_LOW_SCORE", "Low commercial score must block approval", CommercialValidationStage.APPROVAL_DECISION));
  }

  stagesCompleted.push(CommercialValidationStage.EXPLAINABILITY, CommercialValidationStage.APPROVAL_DECISION, CommercialValidationStage.VALIDATION);

  const section: CommercialValidationSection = {
    plannedReport,
    layerScores,
    blueprint: {
      ...input.blueprint,
      validation: {
        ...input.blueprint.validation,
        chiefApproved: plannedReport.approved,
        professionalScore: plannedReport.commercialScore,
        warnings: plannedReport.recommendations.map((r) => r.reason),
      },
    },
    stagesCompleted: [...stagesCompleted],
    confidence: plannedReport.approved ? 0.94 : 0.4,
  };

  stagesCompleted.push(CommercialValidationStage.STAGE_COMPLETE);
  section.stagesCompleted = stagesCompleted;

  return {
    valid: violations.length === 0,
    violations,
    section,
    stagesCompleted,
    durationMs: Date.now() - started,
  };
}

export function enrichPipelineContextWithCommercialValidation(
  ctx: GenerationPipelineContext,
  section: CommercialValidationSection,
): { context: GenerationPipelineContext; violations: CommercialValidationStageViolation[] } {
  const patch = applyContextPatch(ctx, {
    agentId: CHIEF_DESIGN_DIRECTOR_ID,
    section: PipelineContextSection.VALIDATION,
    changes: {
      commercialScore: section.plannedReport.commercialScore,
      ctrPrediction: section.plannedReport.ctrPrediction,
      commercialApproved: section.plannedReport.approved,
    },
    reason: "Commercial Validation Stage recorded conversion-focused assessment",
  });

  return {
    context: {
      ...patch.context,
      blueprint: section.blueprint,
      validation: {
        ...patch.context.validation,
        commercialScore: section.plannedReport.commercialScore,
        violations: section.plannedReport.recommendations.map((r) => r.reason),
      },
    },
    violations: patch.violations as CommercialValidationStageViolation[],
  };
}

export function runCommercialValidationStageFromPipeline(
  context: CommercialValidationContext = {},
): CommercialValidationReport {
  const vision = runVisionValidationStageFromPipeline({
    marketplace: context.marketplace,
    providerId: context.providerId ?? "flux",
  });

  if (!vision.valid || !vision.section) {
    return {
      valid: false,
      violations: [violation("MISSING_VISION_REPORT", "Vision Validation must complete before Commercial Validation")],
      stagesCompleted: [],
      durationMs: 0,
    };
  }

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

  return runCommercialValidationStage(
    {
      profile: analysis.section!.profile,
      business: business.section!,
      blueprint: vision.section.blueprint,
      visionReport: vision.section.plannedReport,
      imageRef: rendering.section?.imageRef ?? "",
      knowledge: knowledge.package!,
      marketplace: context.marketplace ?? pipelineInput.marketplace,
    },
    context,
  );
}

export function validateCommercialValidationStage(
  context: CommercialValidationContext = {},
): CommercialValidationSystemReport {
  const violations: CommercialValidationStageViolation[] = [];

  const kitchen = runCommercialValidationStageFromPipeline(context);
  if (!kitchen.valid || !kitchen.section) {
    violations.push(...kitchen.violations);
  } else {
    if (!kitchen.section.plannedReport.commercialScore) {
      violations.push(violation("MISSING_COMMERCIAL_REPORT", "Kitchen pipeline must compute commercial score"));
    }
    if (!kitchen.section.plannedReport.ctrPrediction) {
      violations.push(violation("MISSING_CTR_PREDICTION", "Kitchen pipeline must predict CTR"));
    }
  }

  const weakValue = runCommercialValidationStageFromPipeline({ ...context, injectWeakValueProposition: true });
  if (weakValue.section?.plannedReport.approved) {
    violations.push(violation("UNAPPROVED_WITH_LOW_SCORE", "Weak value proposition must block commercial approval"));
  }
  if (!weakValue.section?.plannedReport.recommendations.some((r) => r.action.includes("Value Proposition"))) {
    violations.push(violation("MISSING_EXPLAINABILITY", "Weak value case must recommend value proposition improvement"));
  }

  const heroWeak = runCommercialValidationStageFromPipeline({ ...context, injectHeroNotDominant: true });
  if (heroWeak.section?.plannedReport.approved) {
    violations.push(violation("UNAPPROVED_WITH_LOW_SCORE", "Non-dominant hero must block commercial approval"));
  }

  const differentiated =
    !!kitchen.section &&
    !!weakValue.section &&
    kitchen.section.plannedReport.commercialScore !== weakValue.section.plannedReport.commercialScore;

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    businessGoalConsidered: !!kitchen.section?.plannedReport.sellingPower,
    ctrPredicted: !!kitchen.section?.plannedReport.ctrPrediction,
    explainabilityComplete: !!weakValue.section?.plannedReport.recommendations.length,
    differentiatedScores: differentiated,
    downstreamReady: !!kitchen.section?.plannedReport.commercialScore,
  };
}

export function assertCommercialValidationStage(
  context: CommercialValidationContext = {},
): CommercialValidationSystemReport {
  const report = validateCommercialValidationStage(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Commercial Validation Stage failed: ${messages}`);
  }
  return report;
}

export function runCommercialValidationStageSystem(
  context: CommercialValidationContext = {},
): CommercialValidationSystemReport {
  return validateCommercialValidationStage(context);
}

export function isCommercialValidationStageFailure(code: string): code is CommercialValidationStageFailureCode {
  const codes: CommercialValidationStageFailureCode[] = [
    "MISSING_VISION_REPORT",
    "MISSING_BUSINESS_MODEL",
    "MISSING_COMMERCIAL_REPORT",
    "MISSING_CTR_PREDICTION",
    "BUSINESS_GOAL_IGNORED",
    "AESTHETIC_ONLY_JUDGMENT",
    "UNAPPROVED_WITH_LOW_SCORE",
    "MISSING_EXPLAINABILITY",
    "IDENTICAL_SCORES",
  ];
  return codes.includes(code as CommercialValidationStageFailureCode);
}
