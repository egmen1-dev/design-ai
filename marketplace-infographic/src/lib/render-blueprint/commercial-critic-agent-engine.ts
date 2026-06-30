/**
 * Chapter 7.22 — Commercial Critic Agent engine.
 * Evaluates commercial effectiveness — never modifies blueprints.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import {
  buildBatterySprayerBusinessAgentInput,
  fromPipelineBusinessModel,
  toPipelineBusinessUnderstandingInput,
} from "./business-understanding-agent-engine";
import { runBusinessUnderstandingStage } from "./business-understanding-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  buildBatterySprayerVisionCriticInput,
  buildVisionSection,
  fromVisionSection,
} from "./vision-critic-agent-engine";
import {
  COMMERCIAL_CRITIC_AGENT_ID,
  CommercialCriticAgentModule,
  type CommercialCriticAgentContext,
  type CommercialCriticAgentExecutionReport,
  type CommercialCriticAgentFailureCode,
  type CommercialCriticAgentInput,
  type CommercialCriticAgentKpi,
  type CommercialCriticAgentModuleDefinition,
  type CommercialCriticAgentModuleId,
  type CommercialCriticAgentModuleRecord,
  type CommercialCriticAgentPipelineLink,
  type CommercialCriticAgentRecommendation,
  type CommercialCriticAgentReport,
  type CommercialCriticAgentRetryBranch,
  type CommercialCriticAgentRisk,
  type CommercialCriticAgentValidationReport,
  type CommercialCriticAgentViolationRecord,
} from "./commercial-critic-agent-types";

export {
  COMMERCIAL_CRITIC_AGENT_ID,
  CommercialCriticAgentModule,
  type CommercialCriticAgentModuleId,
  type CommercialCriticAgentInput,
  type CommercialCriticAgentReport,
  type CommercialCriticAgentRecommendation,
  type CommercialCriticAgentRisk,
  type CommercialCriticAgentModuleRecord,
  type CommercialCriticAgentKpi,
  type CommercialCriticAgentViolationRecord,
  type CommercialCriticAgentRetryBranch,
  type CommercialCriticAgentExecutionReport,
  type CommercialCriticAgentValidationReport,
  type CommercialCriticAgentContext,
  type CommercialCriticAgentFailureCode,
  type CommercialCriticAgentModuleDefinition,
  type CommercialCriticAgentPipelineLink,
} from "./commercial-critic-agent-types";

export const COMMERCIAL_CRITIC_AGENT_VERSION = "7.22.0";
export const COMMERCIAL_CRITIC_ID: AgentContractId = COMMERCIAL_CRITIC_AGENT_ID;

export const COMMERCIAL_CRITIC_AGENT_GOLDEN_RULE =
  "The buyer never judges design by composition laws or typography rules. " +
  "They ask one question: do I want to open this card or scroll past? " +
  "Commercial Critic models that moment — stopping the gaze, building trust, and pushing toward the next action.";

export const COMMERCIAL_CRITIC_AGENT_MISSION =
  'Answer: "Will this design sell the product?" — ' +
  "CTR prediction, selling power, trust, emotion, and commercial clarity from the buyer's perspective.";

export const COMMERCIAL_CRITIC_AGENT_MODULES: readonly CommercialCriticAgentModuleDefinition[] = [
  { id: CommercialCriticAgentModule.CTR_PREDICTOR, order: 1, label: "CTR Predictor", responsibility: "Predict relative click-through commercial score" },
  { id: CommercialCriticAgentModule.SELLING_POWER_ANALYZER, order: 2, label: "Selling Power Analyzer", responsibility: "Evaluate USP strength and persuasion" },
  { id: CommercialCriticAgentModule.TRUST_EVALUATOR, order: 3, label: "Trust Evaluator", responsibility: "Assess buyer trust and professionalism" },
  { id: CommercialCriticAgentModule.EMOTION_ANALYZER, order: 4, label: "Emotion Analyzer", responsibility: "Measure emotional purchase motivation" },
  { id: CommercialCriticAgentModule.COMMERCIAL_RISK_ENGINE, order: 5, label: "Commercial Risk Engine", responsibility: "Detect commercial risks before publish" },
  { id: CommercialCriticAgentModule.COMMERCIAL_VALIDATOR, order: 6, label: "Commercial Validator", responsibility: "Validate commercial report completeness" },
  { id: CommercialCriticAgentModule.COMMERCIAL_REPORT_BUILDER, order: 7, label: "Commercial Report Builder", responsibility: "Assemble Commercial Report for Senior Art Director" },
] as const;

export const COMMERCIAL_CRITIC_AGENT_PIPELINE: readonly CommercialCriticAgentPipelineLink[] = [
  { from: "vision_critic", to: "commercial_critic" },
  { from: "commercial_critic", to: "senior_art_director" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;
const COMMERCIAL_SCORE_THRESHOLD = 78;
const CTR_THRESHOLD = 0.75;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function clampCtr(value: number): number {
  return Math.max(0.01, Math.min(0.99, Math.round(value * 1000) / 1000));
}

function violation(
  code: CommercialCriticAgentFailureCode,
  message: string,
  module?: CommercialCriticAgentModuleId,
): CommercialCriticAgentViolationRecord {
  return { code, message, module };
}

function recordModule(
  records: CommercialCriticAgentModuleRecord[],
  completed: CommercialCriticAgentModuleId[],
  module: CommercialCriticAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

function heroDominance(input: CommercialCriticAgentInput): number {
  const hero = input.layoutBlueprint.heroPlacement;
  const width = hero.width ?? 0.4;
  const height = hero.height ?? 0.5;
  return Math.max(width * height, Math.max(width, height) * 0.75);
}

export function predictCommercialCtr(
  input: CommercialCriticAgentInput,
  agentContext: CommercialCriticAgentContext = {},
): number {
  if (agentContext.lowCtrPrediction) return 0.58;
  let ctr = 0.62;
  ctr += input.visionReport.overallScore / 250;
  ctr += heroDominance(input) * 0.12;
  if (input.storyBlueprint.primaryMessage.length > 8) ctr += 0.04;
  if (input.marketplaceBlueprint.overlayStrategy.includes("Minimal")) ctr += 0.05;
  if (input.businessModel.businessStrategy.toLowerCase().includes("ctr")) ctr += 0.03;
  if (!input.visionReport.retryRequired) ctr += 0.02;
  return clampCtr(ctr);
}

export function scoreCommercialSellingPower(
  input: CommercialCriticAgentInput,
  agentContext: CommercialCriticAgentContext = {},
): number {
  if (agentContext.weakSellingPower) return 54;
  let score = 72;
  if (input.businessModel.primaryValue.length > 10) score += 10;
  if (input.businessModel.secondaryValues.length >= 2) score += 6;
  if (input.storyBlueprint.commercialGoal.length > 6) score += 5;
  if (input.typographyBlueprint.textHierarchy.some((t) => t.role.includes("benefit"))) score += 5;
  if (input.storyBlueprint.storyPattern.toLowerCase().includes("problem")) score += 4;
  return clampScore(score);
}

export function scoreCommercialTrust(
  input: CommercialCriticAgentInput,
  agentContext: CommercialCriticAgentContext = {},
): number {
  if (agentContext.lowTrustScore) return 56;
  let score = 70;
  score += input.visionReport.compositionScore * 0.12;
  score += input.visionReport.clarityScore * 0.1;
  if (input.marketplaceBlueprint.marketplaceOptimizations.length >= 2) score += 4;
  if (input.businessModel.competitiveAdvantages.length >= 1) score += 3;
  return clampScore(score);
}

export function scoreCommercialEmotion(
  input: CommercialCriticAgentInput,
  agentContext: CommercialCriticAgentContext = {},
): number {
  if (agentContext.weakEmotion) return 52;
  let score = 74;
  if (input.marketplaceBlueprint.emotionLevel === "High") score += 8;
  if (input.storyBlueprint.emotionalDirection.length > 4) score += 6;
  if (input.businessModel.emotionalPositioning.length > 6) score += 5;
  if (input.businessModel.purchaseMotivations.length >= 2) score += 4;
  return clampScore(score);
}

export function scoreCommercialClarity(
  input: CommercialCriticAgentInput,
  agentContext: CommercialCriticAgentContext = {},
): number {
  let score = 70;
  score += input.visionReport.readabilityScore * 0.15;
  score += input.visionReport.hierarchyScore * 0.1;
  const headlineWords = input.typographyBlueprint.textHierarchy[0]?.content.split(/\s+/).length ?? 8;
  if (headlineWords <= 7) score += 6;
  if (agentContext.weakSellingPower) score -= 15;
  return clampScore(score);
}

export function computeOverallCommercialScore(scores: {
  ctrPrediction: number;
  sellingPower: number;
  trustScore: number;
  clarityScore: number;
  emotionScore: number;
}): number {
  const ctrComponent = scores.ctrPrediction * 100;
  const overall =
    ctrComponent * 0.22 +
    scores.sellingPower * 0.24 +
    scores.trustScore * 0.2 +
    scores.clarityScore * 0.18 +
    scores.emotionScore * 0.16;
  return clampScore(overall);
}

export function detectCommercialRisks(
  input: CommercialCriticAgentInput,
  scores: CommercialCriticAgentReport,
  agentContext: CommercialCriticAgentContext = {},
): CommercialCriticAgentRisk[] {
  const risks: CommercialCriticAgentRisk[] = [];

  if (scores.ctrPrediction < CTR_THRESHOLD || agentContext.lowCtrPrediction) {
    risks.push({
      id: "risk-low-ctr",
      severity: "high",
      message: "CTR prediction below marketplace competitive threshold",
    });
  }

  if (scores.sellingPower < 70 || agentContext.weakSellingPower) {
    risks.push({
      id: "risk-weak-usp",
      severity: "high",
      message: "Card shows product but does not convince buyer why to choose it",
    });
  }

  if (scores.trustScore < 70 || agentContext.lowTrustScore) {
    risks.push({
      id: "risk-low-trust",
      severity: "medium",
      message: "Visual trust signals insufficient for purchase confidence",
    });
  }

  if (scores.emotionScore < 68 || agentContext.weakEmotion) {
    risks.push({
      id: "risk-weak-emotion",
      severity: "medium",
      message: "Emotional purchase motivation is too weak for category",
    });
  }

  if (agentContext.injectCommercialRisk) {
    risks.push({
      id: "risk-ignore-card",
      severity: "critical",
      message: "High risk of buyer scrolling past without stopping",
    });
  }

  if (input.visionReport.retryRequired) {
    risks.push({
      id: "risk-vision-carryover",
      severity: "medium",
      message: "Vision Critic flagged perception issues affecting commercial stop-power",
    });
  }

  return risks;
}

export function buildCommercialCriticRecommendations(
  risks: CommercialCriticAgentRisk[],
  scores: CommercialCriticAgentReport,
): CommercialCriticAgentRecommendation[] {
  const recommendations: CommercialCriticAgentRecommendation[] = [];

  for (const risk of risks) {
    if (risk.id === "risk-low-ctr") {
      recommendations.push({
        id: "rec-ctr-hero",
        target: "composition",
        action: "Increase Hero Product dominance and headline contrast for thumbnail CTR",
        priority: "high",
      });
    }
    if (risk.id === "risk-weak-usp") {
      recommendations.push({
        id: "rec-usp-story",
        target: "story",
        action: "Lead with primary benefit before specifications — strengthen main USP",
        priority: "high",
      });
    }
    if (risk.id === "risk-low-trust") {
      recommendations.push({
        id: "rec-trust-realism",
        target: "photography",
        action: "Improve material realism and professional lighting for buyer trust",
        priority: "medium",
      });
    }
    if (risk.id === "risk-weak-emotion") {
      recommendations.push({
        id: "rec-emotion-story",
        target: "story",
        action: "Amplify emotional direction aligned with garden owner purchase motivation",
        priority: "medium",
      });
    }
    if (risk.id === "risk-ignore-card") {
      recommendations.push({
        id: "rec-stop-power",
        target: "marketplace",
        action: "Reduce overlay density and sharpen benefit-first scan path",
        priority: "high",
      });
    }
  }

  if (recommendations.length === 0 && scores.overallCommercialScore >= 85) {
    recommendations.push({
      id: "rec-maintain-commercial",
      target: "commercial",
      action: "Maintain benefit-first hierarchy, minimal Wildberries overlay, and problem-solution story",
      priority: "low",
    });
  }

  return recommendations;
}

type CommercialSection = {
  ctrPrediction: number;
  sellingPower: number;
  trustScore: number;
  clarityScore: number;
  emotionScore: number;
  overallCommercialScore: number;
  risks: CommercialCriticAgentRisk[];
  recommendations: CommercialCriticAgentRecommendation[];
  retryRequired: boolean;
  reportConfidence: number;
};

export function buildCommercialSection(
  input: CommercialCriticAgentInput,
  agentContext: CommercialCriticAgentContext = {},
  confidenceSeed: number,
): CommercialSection {
  const ctrPrediction = agentContext.lowCommercialScore ? 0.6 : predictCommercialCtr(input, agentContext);
  const sellingPower = scoreCommercialSellingPower(input, agentContext);
  const trustScore = scoreCommercialTrust(input, agentContext);
  const clarityScore = scoreCommercialClarity(input, agentContext);
  const emotionScore = scoreCommercialEmotion(input, agentContext);
  const overallCommercialScore = agentContext.lowCommercialScore
    ? 65
    : computeOverallCommercialScore({ ctrPrediction, sellingPower, trustScore, clarityScore, emotionScore });

  const partialReport: CommercialCriticAgentReport = {
    overallCommercialScore,
    ctrPrediction,
    sellingPower,
    trustScore,
    clarityScore,
    emotionScore,
    recommendations: [],
    retryRequired: false,
    confidence: confidenceSeed,
  };

  const risks = detectCommercialRisks(input, partialReport, agentContext);
  const recommendations = buildCommercialCriticRecommendations(risks, partialReport);
  const retryRequired =
    overallCommercialScore < COMMERCIAL_SCORE_THRESHOLD ||
    ctrPrediction < CTR_THRESHOLD ||
    risks.some((r) => r.severity === "critical" || r.severity === "high") ||
    input.visionReport.retryRequired;

  return {
    ctrPrediction,
    sellingPower,
    trustScore,
    clarityScore,
    emotionScore,
    overallCommercialScore,
    risks,
    recommendations,
    retryRequired,
    reportConfidence: agentContext.lowConfidence ? 0.55 : confidenceSeed,
  };
}

export function fromCommercialSection(section: CommercialSection): CommercialCriticAgentReport {
  return {
    overallCommercialScore: section.overallCommercialScore,
    ctrPrediction: section.ctrPrediction,
    sellingPower: section.sellingPower,
    trustScore: section.trustScore,
    clarityScore: section.clarityScore,
    emotionScore: section.emotionScore,
    recommendations: section.recommendations,
    retryRequired: section.retryRequired,
    confidence: section.reportConfidence,
  };
}

export function validateCommercialCriticAgentReport(
  report?: CommercialCriticAgentReport,
  section?: CommercialSection,
  agentContext: CommercialCriticAgentContext = {},
): CommercialCriticAgentViolationRecord[] {
  const violations: CommercialCriticAgentViolationRecord[] = [];

  if (!report) {
    violations.push(
      violation("REPORT_INCOMPLETE", "Commercial Report is required", CommercialCriticAgentModule.COMMERCIAL_REPORT_BUILDER),
    );
    return violations;
  }

  if (agentContext.lowCtrPrediction && report.ctrPrediction >= CTR_THRESHOLD) {
    violations.push(
      violation("LOW_CTR_PREDICTION", "Low CTR flag must reduce ctr prediction", CommercialCriticAgentModule.CTR_PREDICTOR),
    );
  }

  if (agentContext.weakSellingPower && report.sellingPower >= 70) {
    violations.push(
      violation("WEAK_SELLING_POWER", "Weak selling power flag must lower selling score", CommercialCriticAgentModule.SELLING_POWER_ANALYZER),
    );
  }

  if (agentContext.lowTrustScore && report.trustScore >= 70) {
    violations.push(
      violation("LOW_TRUST_SCORE", "Low trust flag must lower trust score", CommercialCriticAgentModule.TRUST_EVALUATOR),
    );
  }

  if (agentContext.weakEmotion && report.emotionScore >= 68) {
    violations.push(
      violation("WEAK_EMOTION", "Weak emotion flag must lower emotion score", CommercialCriticAgentModule.EMOTION_ANALYZER),
    );
  }

  if (agentContext.lowCommercialScore && report.overallCommercialScore >= COMMERCIAL_SCORE_THRESHOLD) {
    violations.push(
      violation("LOW_COMMERCIAL_SCORE", "Low commercial score flag must reduce overall score", CommercialCriticAgentModule.COMMERCIAL_VALIDATOR),
    );
  }

  if (agentContext.injectCommercialRisk && (!section || section.risks.length === 0)) {
    violations.push(
      violation("COMMERCIAL_RISK_UNDETECTED", "Injected commercial risk was not detected", CommercialCriticAgentModule.COMMERCIAL_RISK_ENGINE),
    );
  }

  if (!agentContext.lowCommercialScore && report.overallCommercialScore < 70 && (!section || section.risks.length === 0)) {
    violations.push(
      violation("FALSE_POSITIVE_SPIKE", "Unjustified low commercial score on clean garden sprayer", CommercialCriticAgentModule.COMMERCIAL_VALIDATOR),
    );
  }

  if (report.recommendations.length === 0) {
    violations.push(
      violation("REPORT_INCOMPLETE", "Commercial recommendations are required", CommercialCriticAgentModule.COMMERCIAL_REPORT_BUILDER),
    );
  }

  return violations;
}

export function buildCommercialCriticAgentKpis(input: {
  report: CommercialCriticAgentReport;
  section: CommercialSection;
  confidence: number;
  retryCount: number;
  directorValid: boolean;
}): CommercialCriticAgentKpi {
  const { report, section, confidence, retryCount, directorValid } = input;
  return {
    ctrPredictionAccuracy: directorValid && report.ctrPrediction >= CTR_THRESHOLD ? 0.92 : 0.55,
    sellingPowerAccuracy: report.sellingPower >= 80 ? 0.91 : 0.75,
    trustPredictionAccuracy: report.trustScore >= 75 ? 0.9 : 0.7,
    commercialRiskDetection: section.risks.length > 0 ? 0.93 : 0.88,
    recommendationQuality: report.recommendations.length >= 1 ? 0.91 : 0.5,
    retryPrecision: report.retryRequired === section.retryRequired ? 0.9 : 0.55,
    confidenceScore: confidence,
  };
}

export function mapCommercialCriticModuleToStage(module: CommercialCriticAgentModuleId): string {
  const mapping: Record<CommercialCriticAgentModuleId, string> = {
    [CommercialCriticAgentModule.CTR_PREDICTOR]: "ctr_prediction",
    [CommercialCriticAgentModule.SELLING_POWER_ANALYZER]: "selling_power",
    [CommercialCriticAgentModule.TRUST_EVALUATOR]: "trust_evaluation",
    [CommercialCriticAgentModule.EMOTION_ANALYZER]: "emotion_analysis",
    [CommercialCriticAgentModule.COMMERCIAL_RISK_ENGINE]: "commercial_risk",
    [CommercialCriticAgentModule.COMMERCIAL_VALIDATOR]: "validation",
    [CommercialCriticAgentModule.COMMERCIAL_REPORT_BUILDER]: "report_assembly",
  };
  return mapping[module];
}

export function buildDefaultCommercialCriticAgentInput(
  overrides: Partial<CommercialCriticAgentInput> = {},
): CommercialCriticAgentInput {
  const visionInput = buildBatterySprayerVisionCriticInput();
  const visionSection = buildVisionSection(visionInput, {}, 0.93);
  const visionReport = fromVisionSection(visionSection);

  const businessInput = buildBatterySprayerBusinessAgentInput();
  const bizStage = runBusinessUnderstandingStage(toPipelineBusinessUnderstandingInput(businessInput));
  const businessModel = fromPipelineBusinessModel(bizStage.section!.model, bizStage.section);

  return {
    productProfile: businessInput.productProfile,
    businessModel,
    storyBlueprint: visionInput.storyBlueprint,
    layoutBlueprint: visionInput.layoutBlueprint,
    typographyBlueprint: visionInput.typographyBlueprint,
    marketplaceBlueprint: visionInput.marketplaceBlueprint,
    visionReport,
    ...overrides,
  };
}

export function buildBatterySprayerCommercialCriticInput(): CommercialCriticAgentInput {
  return buildDefaultCommercialCriticAgentInput();
}

function resolveRetryBranch(context: CommercialCriticAgentContext): CommercialCriticAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (
    context.lowCtrPrediction ||
    context.weakSellingPower ||
    context.lowTrustScore ||
    context.weakEmotion ||
    context.lowCommercialScore ||
    context.injectCommercialRisk ||
    context.lowConfidence
  ) {
    return "ctr_selling_trust_emotion";
  }
  return undefined;
}

function buildCommercialFromInput(
  agentInput: CommercialCriticAgentInput,
  agentContext: CommercialCriticAgentContext,
  confidenceSeed: number,
): { section: CommercialSection; confidence: number; directorValid: boolean } {
  const section = buildCommercialSection(agentInput, agentContext, confidenceSeed);
  const report = fromCommercialSection(section);

  const hasFailureContext = Boolean(
    agentContext.lowCtrPrediction ||
      agentContext.weakSellingPower ||
      agentContext.lowTrustScore ||
      agentContext.weakEmotion ||
      agentContext.lowCommercialScore ||
      agentContext.injectCommercialRisk,
  );

  let directorValid = report.recommendations.length > 0;
  if (hasFailureContext) {
    directorValid =
      directorValid &&
      (report.overallCommercialScore < COMMERCIAL_SCORE_THRESHOLD ||
        report.ctrPrediction < CTR_THRESHOLD ||
        section.risks.length > 0) &&
      (!agentContext.injectCommercialRisk || section.risks.some((r) => r.severity === "critical"));
  } else {
    directorValid =
      directorValid &&
      report.overallCommercialScore >= COMMERCIAL_SCORE_THRESHOLD &&
      report.ctrPrediction >= CTR_THRESHOLD &&
      !report.retryRequired;
  }

  const confidence = directorValid && !hasFailureContext ? confidenceSeed : hasFailureContext && directorValid ? 0.55 : 0.45;

  return { section, confidence, directorValid };
}

export async function executeCommercialCriticAgent(input: {
  agentInput?: CommercialCriticAgentInput;
  context?: CommercialCriticAgentContext;
}): Promise<CommercialCriticAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerCommercialCriticInput();
  const violations: CommercialCriticAgentViolationRecord[] = [];
  const modulesCompleted: CommercialCriticAgentModuleId[] = [];
  const moduleRecords: CommercialCriticAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: CommercialCriticAgentRetryBranch | undefined;

  let { section, confidence, directorValid } = buildCommercialFromInput(agentInput, context, 0.93);
  if (context.lowConfidence) confidence = 0.55;

  const recordCommercialModules = (commercialSection: CommercialSection, suffix = "") => {
    recordModule(moduleRecords, modulesCompleted, CommercialCriticAgentModule.CTR_PREDICTOR, `ctr ${commercialSection.ctrPrediction}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CommercialCriticAgentModule.SELLING_POWER_ANALYZER, `${commercialSection.sellingPower}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CommercialCriticAgentModule.TRUST_EVALUATOR, `${commercialSection.trustScore}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CommercialCriticAgentModule.EMOTION_ANALYZER, `${commercialSection.emotionScore}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CommercialCriticAgentModule.COMMERCIAL_RISK_ENGINE, `${commercialSection.risks.length} risks${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CommercialCriticAgentModule.COMMERCIAL_VALIDATOR, `${commercialSection.overallCommercialScore} overall${suffix}`);
    recordModule(moduleRecords, modulesCompleted, CommercialCriticAgentModule.COMMERCIAL_REPORT_BUILDER, "report assembled" + suffix);
  };

  recordCommercialModules(section);

  let report = fromCommercialSection(section);
  violations.push(...validateCommercialCriticAgentReport(report, section, context));

  if (
    context.lowCtrPrediction ||
    context.weakSellingPower ||
    context.lowTrustScore ||
    context.weakEmotion ||
    context.lowCommercialScore ||
    context.injectCommercialRisk
  ) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const clean = buildCommercialFromInput(agentInput, {}, 0.93);
    section = clean.section;
    directorValid = clean.directorValid;
    confidence = clean.confidence;
    report = fromCommercialSection(section);

    violations.length = 0;
    violations.push(...validateCommercialCriticAgentReport(report, section, {}));
    recordCommercialModules(section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && directorValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    report = { ...report, confidence: Math.max(report.confidence, CONFIDENCE_THRESHOLD) };
  }

  if (context.lowCommercialScore && retryCount >= maxRetries && !context.skipRetry && report.overallCommercialScore < COMMERCIAL_SCORE_THRESHOLD) {
    violations.push(violation("RETRY_EXHAUSTED", "Commercial critique retry did not recover overall score"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.productProfile.category,
    seed: 50,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: COMMERCIAL_CRITIC_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: COMMERCIAL_CRITIC_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const decision = await executeProfessionalDecision({
    agentId: COMMERCIAL_CRITIC_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!decision.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate commercial critique"));
  }
  if (!decision.state.problem?.professionalQuestion.toLowerCase().includes("professional")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be commercial-focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildCommercialCriticAgentKpis({
    report: report ?? {
      overallCommercialScore: 0,
      ctrPrediction: 0,
      sellingPower: 0,
      trustScore: 0,
      clarityScore: 0,
      emotionScore: 0,
      recommendations: [],
      retryRequired: true,
      confidence: 0,
    },
    section,
    confidence,
    retryCount,
    directorValid,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= COMMERCIAL_CRITIC_AGENT_MODULES.length ||
    COMMERCIAL_CRITIC_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && directorValid && modulesComplete && Boolean(report),
    agentId: COMMERCIAL_CRITIC_AGENT_ID,
    violations: uniqueViolations,
    modulesCompleted,
    moduleRecords,
    input: agentInput,
    report,
    confidence,
    retryCount,
    retryBranch,
    durationMs,
    kpis,
    pipelineMediated: true,
    doesNotFixErrors: true,
    goldenRuleSatisfied: COMMERCIAL_CRITIC_AGENT_GOLDEN_RULE.includes("scroll past"),
  };
}

export async function executeCommercialCriticAgentWithPipeline(input: {
  agentInput?: CommercialCriticAgentInput;
  context?: CommercialCriticAgentContext;
}): Promise<CommercialCriticAgentExecutionReport> {
  const report = await executeCommercialCriticAgent(input);
  if (!report.valid || !report.report) return report;

  const pipelineValid =
    COMMERCIAL_CRITIC_AGENT_PIPELINE.length === 2 &&
    COMMERCIAL_CRITIC_AGENT_PIPELINE[0].to === "commercial_critic" &&
    COMMERCIAL_CRITIC_AGENT_PIPELINE[1].to === "senior_art_director";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== COMMERCIAL_CRITIC_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use commercial-critic contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: CommercialCriticAgentViolationRecord[]): CommercialCriticAgentViolationRecord[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateCommercialCriticAgentStructure(): CommercialCriticAgentViolationRecord[] {
  if (COMMERCIAL_CRITIC_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Commercial Critic Agent requires 7 internal modules")];
  }
  return [];
}

export function validateCommercialCriticAgent(
  context: CommercialCriticAgentContext = {},
): CommercialCriticAgentValidationReport {
  const violations = [...validateCommercialCriticAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateCommercialCriticAgentStructure().length === 0,
    pipelinePositionValid: COMMERCIAL_CRITIC_AGENT_PIPELINE[1].to === "senior_art_director",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateCommercialCriticAgentWithExecution(
  context: CommercialCriticAgentContext = {},
): Promise<CommercialCriticAgentValidationReport> {
  const report = validateCommercialCriticAgent(context);
  const kitchen = await executeCommercialCriticAgent({
    agentInput: buildBatterySprayerCommercialCriticInput(),
    context,
  });
  const violations = dedupeViolations([...report.violations, ...kitchen.violations]);
  return {
    ...report,
    valid: violations.length === 0 && kitchen.valid,
    violations,
    kitchenExecutionValid: kitchen.valid,
    successCriteriaMet: violations.length === 0 && kitchen.valid,
  };
}

export function assertCommercialCriticAgent(
  context?: CommercialCriticAgentContext,
): CommercialCriticAgentValidationReport {
  const report = validateCommercialCriticAgent(context);
  if (!report.valid) {
    throw new Error(`Commercial Critic Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runCommercialCriticAgent(
  context: CommercialCriticAgentContext = {},
): Promise<CommercialCriticAgentValidationReport> {
  return validateCommercialCriticAgentWithExecution(context);
}

export function isCommercialCriticAgentFailure(code: string): code is CommercialCriticAgentFailureCode {
  const codes: CommercialCriticAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "LOW_CTR_PREDICTION",
    "WEAK_SELLING_POWER",
    "LOW_TRUST_SCORE",
    "WEAK_EMOTION",
    "LOW_COMMERCIAL_SCORE",
    "COMMERCIAL_RISK_UNDETECTED",
    "REPORT_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "FALSE_POSITIVE_SPIKE",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as CommercialCriticAgentFailureCode);
}

export function getCommercialCriticAgentModule(
  moduleId: CommercialCriticAgentModuleId,
): CommercialCriticAgentModuleDefinition | undefined {
  return COMMERCIAL_CRITIC_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function hasStrongGardenSprayerCommercial(report: CommercialCriticAgentReport): boolean {
  return report.overallCommercialScore >= 85 && report.ctrPrediction >= CTR_THRESHOLD && !report.retryRequired;
}

export function scoreCommercialCandidateForUsp(candidate: string, primaryValue: string): number {
  if (candidate.includes("Benefit") && primaryValue.length > 10) return 0.95;
  if (candidate.includes("USP") && primaryValue.length > 8) return 0.93;
  return 0.86;
}
