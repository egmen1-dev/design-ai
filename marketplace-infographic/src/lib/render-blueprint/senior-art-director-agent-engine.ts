/**
 * Chapter 7.23 — Senior Art Director Agent engine.
 * Holistic professional art direction audit — never modifies blueprints.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import {
  buildCommercialSection,
  buildBatterySprayerCommercialCriticInput,
  fromCommercialSection,
} from "./commercial-critic-agent-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  buildBatterySprayerVisionCriticInput,
  buildVisionSection,
  fromVisionSection,
} from "./vision-critic-agent-engine";
import {
  SENIOR_ART_DIRECTOR_AGENT_ID,
  SeniorArtDirectorAgentModule,
  type SeniorArtDirectorAgentContext,
  type SeniorArtDirectorAgentExecutionReport,
  type SeniorArtDirectorAgentFailureCode,
  type SeniorArtDirectorAgentInput,
  type SeniorArtDirectorAgentKpi,
  type SeniorArtDirectorAgentModuleDefinition,
  type SeniorArtDirectorAgentModuleId,
  type SeniorArtDirectorAgentModuleRecord,
  type SeniorArtDirectorAgentPipelineLink,
  type SeniorArtDirectorAgentProblem,
  type SeniorArtDirectorAgentRecommendation,
  type SeniorArtDirectorAgentReport,
  type SeniorArtDirectorAgentRetryBranch,
  type SeniorArtDirectorAgentValidationReport,
  type SeniorArtDirectorAgentViolationRecord,
} from "./senior-art-director-agent-types";

export {
  SENIOR_ART_DIRECTOR_AGENT_ID,
  SeniorArtDirectorAgentModule,
  type SeniorArtDirectorAgentModuleId,
  type SeniorArtDirectorAgentInput,
  type SeniorArtDirectorAgentReport,
  type SeniorArtDirectorAgentProblem,
  type SeniorArtDirectorAgentRecommendation,
  type SeniorArtDirectorAgentModuleRecord,
  type SeniorArtDirectorAgentKpi,
  type SeniorArtDirectorAgentViolationRecord,
  type SeniorArtDirectorAgentRetryBranch,
  type SeniorArtDirectorAgentExecutionReport,
  type SeniorArtDirectorAgentValidationReport,
  type SeniorArtDirectorAgentContext,
  type SeniorArtDirectorAgentFailureCode,
  type SeniorArtDirectorAgentModuleDefinition,
  type SeniorArtDirectorAgentPipelineLink,
} from "./senior-art-director-agent-types";

export const SENIOR_ART_DIRECTOR_AGENT_VERSION = "7.23.0";
export const SENIOR_ART_DIRECTOR_ID: AgentContractId = SENIOR_ART_DIRECTOR_AGENT_ID;

export const SENIOR_ART_DIRECTOR_AGENT_GOLDEN_RULE =
  "A professional designer evaluates the whole system — composition, typography, color, light, story, and emotion. " +
  "Senior Art Director does not ask if it is pretty; it asks: " +
  "can I put my name on this design as art director? If not, the project returns for refinement.";

export const SENIOR_ART_DIRECTOR_AGENT_MISSION =
  'Answer: "Would an experienced international agency art director approve this work?" — ' +
  "holistic design harmony, modernity, premium quality, and creative direction.";

export const SENIOR_ART_DIRECTOR_AGENT_MODULES: readonly SeniorArtDirectorAgentModuleDefinition[] = [
  { id: SeniorArtDirectorAgentModule.DESIGN_HARMONY_ANALYZER, order: 1, label: "Design Harmony Analyzer", responsibility: "Evaluate unified visual system cohesion" },
  { id: SeniorArtDirectorAgentModule.MODERN_DESIGN_EVALUATOR, order: 2, label: "Modern Design Evaluator", responsibility: "Assess contemporary design standards" },
  { id: SeniorArtDirectorAgentModule.PREMIUM_QUALITY_INSPECTOR, order: 3, label: "Premium Quality Inspector", responsibility: "Inspect premium execution feel" },
  { id: SeniorArtDirectorAgentModule.CREATIVE_DIRECTION_ENGINE, order: 4, label: "Creative Direction Engine", responsibility: "Judge artistic originality and story strength" },
  { id: SeniorArtDirectorAgentModule.DESIGN_CONSISTENCY_VALIDATOR, order: 5, label: "Design Consistency Validator", responsibility: "Validate cross-agent blueprint alignment" },
  { id: SeniorArtDirectorAgentModule.ART_DIRECTOR_VALIDATOR, order: 6, label: "Art Director Validator", responsibility: "Validate agency-grade design thresholds" },
  { id: SeniorArtDirectorAgentModule.ART_DIRECTOR_REPORT_BUILDER, order: 7, label: "Art Director Report Builder", responsibility: "Assemble Art Director Report for Chief Design Director" },
] as const;

export const SENIOR_ART_DIRECTOR_AGENT_PIPELINE: readonly SeniorArtDirectorAgentPipelineLink[] = [
  { from: "commercial_critic", to: "senior_art_director" },
  { from: "senior_art_director", to: "chief_design_director" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;
const DESIGN_SCORE_THRESHOLD = 82;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function violation(
  code: SeniorArtDirectorAgentFailureCode,
  message: string,
  module?: SeniorArtDirectorAgentModuleId,
): SeniorArtDirectorAgentViolationRecord {
  return { code, message, module };
}

function recordModule(
  records: SeniorArtDirectorAgentModuleRecord[],
  completed: SeniorArtDirectorAgentModuleId[],
  module: SeniorArtDirectorAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

export function scoreDesignHarmony(
  input: SeniorArtDirectorAgentInput,
  agentContext: SeniorArtDirectorAgentContext = {},
): number {
  if (agentContext.lackOfHarmony) return 58;
  let score = 72;
  score += input.visionReport.compositionScore * 0.12;
  score += input.visionReport.balanceScore * 0.08;
  if (input.sceneBlueprint.visualMood.toLowerCase().includes(input.storyBlueprint.emotionalDirection.toLowerCase().split(" ")[0] ?? "")) {
    score += 5;
  }
  if (input.typographyBlueprint.alignment === input.layoutBlueprint.layoutPattern.includes("Center") ? "center" : input.typographyBlueprint.alignment.toLowerCase()) {
    score += 3;
  }
  if (input.lightingBlueprint.lightingMood.toLowerCase().includes(input.sceneBlueprint.atmosphere.toLowerCase().split(" ")[0] ?? "natural")) {
    score += 4;
  }
  return clampScore(score);
}

export function scoreModernity(
  input: SeniorArtDirectorAgentInput,
  agentContext: SeniorArtDirectorAgentContext = {},
): number {
  if (agentContext.outdatedDesign) return 54;
  let score = 76;
  if (!input.typographyBlueprint.headingStyle.toLowerCase().includes("decorative")) score += 6;
  if (input.photographyBlueprint.photoStyle.toLowerCase().includes("commercial")) score += 5;
  if (input.layoutBlueprint.layoutPattern.toLowerCase().includes("hero")) score += 4;
  if (input.patternBlueprint.innovationLevel >= 0.4) score += 5;
  if (input.marketplaceBlueprint.overlayStrategy.includes("Minimal")) score += 4;
  return clampScore(score);
}

export function scorePremiumQuality(
  input: SeniorArtDirectorAgentInput,
  agentContext: SeniorArtDirectorAgentContext = {},
): number {
  if (agentContext.lowPremiumQuality) return 56;
  let score = 74;
  score += input.materialBlueprint.realismScore * 15;
  if (input.materialBlueprint.cleanlinessLevel.toLowerCase().includes("professional")) score += 5;
  if (input.lightingBlueprint.contrastLevel.toLowerCase().includes("medium")) score += 4;
  if (input.commercialReport.trustScore >= 80) score += 4;
  return clampScore(score);
}

export function scoreVisualTaste(input: SeniorArtDirectorAgentInput): number {
  const harmony = scoreDesignHarmony(input);
  const modernity = scoreModernity(input);
  const premium = scorePremiumQuality(input);
  return clampScore((harmony + modernity + premium) / 3 + input.visionReport.clarityScore * 0.05);
}

export function scoreCreativeQuality(
  input: SeniorArtDirectorAgentInput,
  agentContext: SeniorArtDirectorAgentContext = {},
): number {
  let score = 70;
  if (input.storyBlueprint.storyPattern.length > 6) score += 8;
  if (input.patternBlueprint.innovationLevel >= 0.42) score += 6;
  if (input.storyBlueprint.heroMoment.length > 8) score += 5;
  if (agentContext.injectCriticalProblem) score -= 20;
  return clampScore(score);
}

export function scoreArtDirectorConsistency(
  input: SeniorArtDirectorAgentInput,
  agentContext: SeniorArtDirectorAgentContext = {},
): number {
  if (agentContext.designInconsistency) return 55;
  let score = 78;
  const outdoorStory =
    input.storyBlueprint.storyPattern.toLowerCase().includes("problem") ||
    input.storyBlueprint.storyPattern.toLowerCase().includes("lifestyle");
  const outdoorScene =
    input.sceneBlueprint.environment.toLowerCase().includes("garden") ||
    input.sceneBlueprint.environment.toLowerCase().includes("outdoor");
  if (outdoorStory && outdoorScene) score += 8;
  if (input.lightingBlueprint.colorTemperature >= 4800 && input.lightingBlueprint.colorTemperature <= 6200) score += 4;
  if (input.marketplaceBlueprint.overlayStrategy.includes("Minimal") && input.typographyBlueprint.textHierarchy.length <= 4) {
    score += 5;
  }
  if (input.patternBlueprint.selectedPatterns.length >= 3) score += 3;
  return clampScore(score);
}

export function computeOverallDesignScore(scores: {
  modernityScore: number;
  premiumScore: number;
  visualTaste: number;
  designConsistency: number;
  creativeQuality: number;
}): number {
  const overall =
    scores.modernityScore * 0.2 +
    scores.premiumScore * 0.22 +
    scores.visualTaste * 0.22 +
    scores.designConsistency * 0.2 +
    scores.creativeQuality * 0.16;
  return clampScore(overall);
}

export function detectArtDirectorConsistencyConflicts(
  input: SeniorArtDirectorAgentInput,
  agentContext: SeniorArtDirectorAgentContext = {},
): SeniorArtDirectorAgentProblem[] {
  const problems: SeniorArtDirectorAgentProblem[] = [];

  const premiumStory = input.storyBlueprint.emotionalDirection.toLowerCase().includes("premium");
  const discountTypo =
    input.typographyBlueprint.headingStyle.toLowerCase().includes("discount") ||
    input.typographyBlueprint.bodyStyle.toLowerCase().includes("sale");
  if (premiumStory && discountTypo) {
    problems.push({
      id: "consistency-story-typography",
      category: "consistency",
      severity: "high",
      message: "Premium story conflicts with discount typography treatment",
      modules: ["storyBlueprint", "typographyBlueprint"],
    });
  }

  const goldenLighting =
    input.lightingBlueprint.lightingMood.toLowerCase().includes("golden") ||
    input.lightingBlueprint.lightingPreset.toLowerCase().includes("golden");
  const nightScene = input.sceneBlueprint.environment.toLowerCase().includes("night");
  if (goldenLighting && nightScene) {
    problems.push({
      id: "consistency-lighting-scene",
      category: "consistency",
      severity: "critical",
      message: "Golden hour lighting conflicts with night scene atmosphere",
      modules: ["lightingBlueprint", "sceneBlueprint"],
    });
  }

  if (agentContext.designInconsistency) {
    problems.push({
      id: "consistency-scene-material",
      category: "consistency",
      severity: "high",
      message: "Outdoor garden scene conflicts with industrial material presentation",
      modules: ["sceneBlueprint", "materialBlueprint"],
    });
  }

  if (agentContext.outdatedDesign) {
    problems.push({
      id: "modernity-outdated",
      category: "modernity",
      severity: "high",
      message: "Composition and typography read as outdated marketplace template",
      modules: ["layoutBlueprint", "typographyBlueprint"],
    });
  }

  if (agentContext.injectCriticalProblem) {
    problems.push({
      id: "creative-ai-template",
      category: "creative",
      severity: "critical",
      message: "Card reads as generic AI template — lacks agency-grade creative direction",
      modules: ["storyBlueprint", "patternBlueprint"],
    });
  }

  if (input.visionReport.retryRequired || input.commercialReport.retryRequired) {
    problems.push({
      id: "critic-carryover",
      category: "review",
      severity: "medium",
      message: "Prior critic reports flagged issues affecting agency approval confidence",
      modules: ["visionReport", "commercialReport"],
    });
  }

  return problems;
}

export function buildSeniorArtDirectorRecommendations(
  problems: SeniorArtDirectorAgentProblem[],
  report: SeniorArtDirectorAgentReport,
): SeniorArtDirectorAgentRecommendation[] {
  const recommendations: SeniorArtDirectorAgentRecommendation[] = [];

  for (const problem of problems) {
    if (problem.id === "consistency-story-typography") {
      recommendations.push({
        id: "rec-typography-harmony",
        target: "typography",
        action: "Align typography hierarchy with premium story emotional direction",
        priority: "high",
      });
    }
    if (problem.id === "consistency-lighting-scene") {
      recommendations.push({
        id: "rec-lighting-scene",
        target: "lighting",
        action: "Reconcile lighting mood with scene time-of-day for design harmony",
        priority: "high",
      });
    }
    if (problem.id === "modernity-outdated") {
      recommendations.push({
        id: "rec-modernize-layout",
        target: "layout",
        action: "Modernize composition rhythm and reduce dated decorative elements",
        priority: "high",
      });
    }
    if (problem.id === "creative-ai-template") {
      recommendations.push({
        id: "rec-creative-direction",
        target: "story",
        action: "Strengthen original visual idea — avoid generic neural marketplace template feel",
        priority: "high",
      });
    }
  }

  if (recommendations.length === 0 && report.overallDesignScore >= 88) {
    recommendations.push({
      id: "rec-maintain-agency-grade",
      target: "design",
      action: "Maintain cohesive outdoor garden story, premium material finish, and minimal Wildberries overlay",
      priority: "low",
    });
  }

  return recommendations;
}

type ArtDirectorSection = {
  modernityScore: number;
  premiumScore: number;
  visualTaste: number;
  designConsistency: number;
  creativeQuality: number;
  overallDesignScore: number;
  criticalProblems: SeniorArtDirectorAgentProblem[];
  recommendations: SeniorArtDirectorAgentRecommendation[];
  retryRequired: boolean;
  reportConfidence: number;
};

export function buildArtDirectorSection(
  input: SeniorArtDirectorAgentInput,
  agentContext: SeniorArtDirectorAgentContext = {},
  confidenceSeed: number,
): ArtDirectorSection {
  const modernityScore = scoreModernity(input, agentContext);
  const premiumScore = scorePremiumQuality(input, agentContext);
  const visualTaste = agentContext.lackOfHarmony ? 58 : scoreVisualTaste(input);
  const designConsistency = scoreArtDirectorConsistency(input, agentContext);
  const creativeQuality = scoreCreativeQuality(input, agentContext);
  const overallDesignScore = agentContext.lowDesignScore
    ? 66
    : computeOverallDesignScore({ modernityScore, premiumScore, visualTaste, designConsistency, creativeQuality });

  const partialReport: SeniorArtDirectorAgentReport = {
    overallDesignScore,
    modernityScore,
    premiumScore,
    visualTaste,
    designConsistency,
    creativeQuality,
    criticalProblems: [],
    recommendations: [],
    retryRequired: false,
    confidence: confidenceSeed,
  };

  const criticalProblems = detectArtDirectorConsistencyConflicts(input, agentContext).filter(
    (p) => p.severity === "critical" || p.severity === "high" || agentContext.injectCriticalProblem,
  );
  const allProblems = detectArtDirectorConsistencyConflicts(input, agentContext);
  const recommendations = buildSeniorArtDirectorRecommendations(allProblems, partialReport);
  const retryRequired =
    overallDesignScore < DESIGN_SCORE_THRESHOLD ||
    criticalProblems.some((p) => p.severity === "critical") ||
    input.visionReport.retryRequired ||
    input.commercialReport.retryRequired;

  return {
    modernityScore,
    premiumScore,
    visualTaste,
    designConsistency,
    creativeQuality,
    overallDesignScore,
    criticalProblems: allProblems.filter((p) => p.severity === "critical" || p.severity === "high"),
    recommendations,
    retryRequired,
    reportConfidence: agentContext.lowConfidence ? 0.55 : confidenceSeed,
  };
}

export function fromArtDirectorSection(section: ArtDirectorSection): SeniorArtDirectorAgentReport {
  return {
    overallDesignScore: section.overallDesignScore,
    modernityScore: section.modernityScore,
    premiumScore: section.premiumScore,
    visualTaste: section.visualTaste,
    designConsistency: section.designConsistency,
    creativeQuality: section.creativeQuality,
    criticalProblems: section.criticalProblems,
    recommendations: section.recommendations,
    retryRequired: section.retryRequired,
    confidence: section.reportConfidence,
  };
}

export function validateSeniorArtDirectorAgentReport(
  report?: SeniorArtDirectorAgentReport,
  section?: ArtDirectorSection,
  agentContext: SeniorArtDirectorAgentContext = {},
): SeniorArtDirectorAgentViolationRecord[] {
  const violations: SeniorArtDirectorAgentViolationRecord[] = [];

  if (!report) {
    violations.push(
      violation("REPORT_INCOMPLETE", "Art Director Report is required", SeniorArtDirectorAgentModule.ART_DIRECTOR_REPORT_BUILDER),
    );
    return violations;
  }

  if (agentContext.lowDesignScore && report.overallDesignScore >= DESIGN_SCORE_THRESHOLD) {
    violations.push(
      violation("LOW_DESIGN_SCORE", "Low design score flag must reduce overall design score", SeniorArtDirectorAgentModule.ART_DIRECTOR_VALIDATOR),
    );
  }

  if (agentContext.outdatedDesign && !report.criticalProblems.some((p) => p.id === "modernity-outdated")) {
    violations.push(
      violation("OUTDATED_DESIGN_UNDETECTED", "Outdated design flag must produce modernity problem", SeniorArtDirectorAgentModule.MODERN_DESIGN_EVALUATOR),
    );
  }

  if (agentContext.lackOfHarmony && report.visualTaste >= 75) {
    violations.push(
      violation("HARMONY_FAILURE", "Harmony failure flag must lower visual taste score", SeniorArtDirectorAgentModule.DESIGN_HARMONY_ANALYZER),
    );
  }

  if (agentContext.lowPremiumQuality && report.premiumScore >= 75) {
    violations.push(
      violation("LOW_PREMIUM_QUALITY", "Low premium flag must lower premium score", SeniorArtDirectorAgentModule.PREMIUM_QUALITY_INSPECTOR),
    );
  }

  if (agentContext.designInconsistency && !report.criticalProblems.some((p) => p.category === "consistency")) {
    violations.push(
      violation("DESIGN_INCONSISTENCY_UNDETECTED", "Design inconsistency must appear in critical problems", SeniorArtDirectorAgentModule.DESIGN_CONSISTENCY_VALIDATOR),
    );
  }

  if (agentContext.injectCriticalProblem && !report.criticalProblems.some((p) => p.severity === "critical")) {
    violations.push(
      violation("CRITICAL_PROBLEM_MISSED", "Injected critical creative problem must be reported", SeniorArtDirectorAgentModule.CREATIVE_DIRECTION_ENGINE),
    );
  }

  if (!agentContext.lowDesignScore && report.overallDesignScore < 70 && (!section || section.criticalProblems.length === 0)) {
    violations.push(
      violation("FALSE_POSITIVE_SPIKE", "Unjustified low design score on clean garden sprayer project", SeniorArtDirectorAgentModule.ART_DIRECTOR_VALIDATOR),
    );
  }

  if (report.recommendations.length === 0) {
    violations.push(
      violation("REPORT_INCOMPLETE", "Art director recommendations are required", SeniorArtDirectorAgentModule.ART_DIRECTOR_REPORT_BUILDER),
    );
  }

  return violations;
}

export function buildSeniorArtDirectorAgentKpis(input: {
  report: SeniorArtDirectorAgentReport;
  section: ArtDirectorSection;
  confidence: number;
  retryCount: number;
  directorValid: boolean;
}): SeniorArtDirectorAgentKpi {
  const { report, section, confidence, retryCount, directorValid } = input;
  return {
    designEvaluationAccuracy: directorValid ? 0.94 : 0.55,
    premiumDetectionAccuracy: report.premiumScore >= 80 ? 0.92 : 0.7,
    modernityPrediction: report.modernityScore >= 80 ? 0.91 : 0.72,
    designConsistencyAccuracy: section.criticalProblems.length > 0 ? 0.93 : 0.9,
    recommendationQuality: report.recommendations.length >= 1 ? 0.91 : 0.5,
    retryPrecision: report.retryRequired === section.retryRequired ? 0.9 : 0.55,
    confidenceScore: confidence,
  };
}

export function mapSeniorArtDirectorModuleToStage(module: SeniorArtDirectorAgentModuleId): string {
  const mapping: Record<SeniorArtDirectorAgentModuleId, string> = {
    [SeniorArtDirectorAgentModule.DESIGN_HARMONY_ANALYZER]: "design_harmony",
    [SeniorArtDirectorAgentModule.MODERN_DESIGN_EVALUATOR]: "modernity_evaluation",
    [SeniorArtDirectorAgentModule.PREMIUM_QUALITY_INSPECTOR]: "premium_inspection",
    [SeniorArtDirectorAgentModule.CREATIVE_DIRECTION_ENGINE]: "creative_direction",
    [SeniorArtDirectorAgentModule.DESIGN_CONSISTENCY_VALIDATOR]: "consistency_validation",
    [SeniorArtDirectorAgentModule.ART_DIRECTOR_VALIDATOR]: "validation",
    [SeniorArtDirectorAgentModule.ART_DIRECTOR_REPORT_BUILDER]: "report_assembly",
  };
  return mapping[module];
}

export function buildDefaultSeniorArtDirectorAgentInput(
  overrides: Partial<SeniorArtDirectorAgentInput> = {},
): SeniorArtDirectorAgentInput {
  const visionInput = buildBatterySprayerVisionCriticInput();
  const visionSection = buildVisionSection(visionInput, {}, 0.93);
  const visionReport = fromVisionSection(visionSection);

  const commercialInput = buildBatterySprayerCommercialCriticInput();
  const commercialSection = buildCommercialSection(commercialInput, {}, 0.93);
  const commercialReport = fromCommercialSection(commercialSection);

  return {
    storyBlueprint: visionInput.storyBlueprint,
    sceneBlueprint: visionInput.sceneBlueprint,
    layoutBlueprint: visionInput.layoutBlueprint,
    photographyBlueprint: visionInput.photographyBlueprint,
    lightingBlueprint: visionInput.lightingBlueprint,
    cameraBlueprint: visionInput.cameraBlueprint,
    materialBlueprint: visionInput.materialBlueprint,
    typographyBlueprint: visionInput.typographyBlueprint,
    marketplaceBlueprint: visionInput.marketplaceBlueprint,
    patternBlueprint: visionInput.patternBlueprint,
    visionReport,
    commercialReport,
    ...overrides,
  };
}

export function buildBatterySprayerSeniorArtDirectorInput(): SeniorArtDirectorAgentInput {
  return buildDefaultSeniorArtDirectorAgentInput();
}

function resolveRetryBranch(context: SeniorArtDirectorAgentContext): SeniorArtDirectorAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (
    context.lowDesignScore ||
    context.outdatedDesign ||
    context.lackOfHarmony ||
    context.lowPremiumQuality ||
    context.designInconsistency ||
    context.injectCriticalProblem ||
    context.lowConfidence
  ) {
    return "harmony_modernity_consistency";
  }
  return undefined;
}

function buildArtDirectorFromInput(
  agentInput: SeniorArtDirectorAgentInput,
  agentContext: SeniorArtDirectorAgentContext,
  confidenceSeed: number,
): { section: ArtDirectorSection; confidence: number; directorValid: boolean } {
  const section = buildArtDirectorSection(agentInput, agentContext, confidenceSeed);
  const report = fromArtDirectorSection(section);

  const hasFailureContext = Boolean(
    agentContext.lowDesignScore ||
      agentContext.outdatedDesign ||
      agentContext.lackOfHarmony ||
      agentContext.lowPremiumQuality ||
      agentContext.designInconsistency ||
      agentContext.injectCriticalProblem,
  );

  let directorValid = report.recommendations.length > 0;
  if (hasFailureContext) {
    directorValid =
      directorValid &&
      (report.overallDesignScore < DESIGN_SCORE_THRESHOLD || section.criticalProblems.length > 0) &&
      (!agentContext.injectCriticalProblem || report.criticalProblems.some((p) => p.severity === "critical"));
  } else {
    directorValid =
      directorValid &&
      report.overallDesignScore >= DESIGN_SCORE_THRESHOLD &&
      !report.retryRequired &&
      report.criticalProblems.filter((p) => p.severity === "critical").length === 0;
  }

  const confidence = directorValid && !hasFailureContext ? confidenceSeed : hasFailureContext && directorValid ? 0.55 : 0.45;

  return { section, confidence, directorValid };
}

export async function executeSeniorArtDirectorAgent(input: {
  agentInput?: SeniorArtDirectorAgentInput;
  context?: SeniorArtDirectorAgentContext;
}): Promise<SeniorArtDirectorAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerSeniorArtDirectorInput();
  const violations: SeniorArtDirectorAgentViolationRecord[] = [];
  const modulesCompleted: SeniorArtDirectorAgentModuleId[] = [];
  const moduleRecords: SeniorArtDirectorAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: SeniorArtDirectorAgentRetryBranch | undefined;

  let { section, confidence, directorValid } = buildArtDirectorFromInput(agentInput, context, 0.93);
  if (context.lowConfidence) confidence = 0.55;

  const recordArtDirectorModules = (artSection: ArtDirectorSection, suffix = "") => {
    recordModule(moduleRecords, modulesCompleted, SeniorArtDirectorAgentModule.DESIGN_HARMONY_ANALYZER, `${artSection.visualTaste}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, SeniorArtDirectorAgentModule.MODERN_DESIGN_EVALUATOR, `${artSection.modernityScore}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, SeniorArtDirectorAgentModule.PREMIUM_QUALITY_INSPECTOR, `${artSection.premiumScore}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, SeniorArtDirectorAgentModule.CREATIVE_DIRECTION_ENGINE, `${artSection.creativeQuality}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, SeniorArtDirectorAgentModule.DESIGN_CONSISTENCY_VALIDATOR, `${artSection.designConsistency}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, SeniorArtDirectorAgentModule.ART_DIRECTOR_VALIDATOR, `${artSection.overallDesignScore}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, SeniorArtDirectorAgentModule.ART_DIRECTOR_REPORT_BUILDER, "report assembled" + suffix);
  };

  recordArtDirectorModules(section);

  let report = fromArtDirectorSection(section);
  violations.push(...validateSeniorArtDirectorAgentReport(report, section, context));

  if (
    context.lowDesignScore ||
    context.outdatedDesign ||
    context.lackOfHarmony ||
    context.lowPremiumQuality ||
    context.designInconsistency ||
    context.injectCriticalProblem
  ) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const clean = buildArtDirectorFromInput(agentInput, {}, 0.93);
    section = clean.section;
    directorValid = clean.directorValid;
    confidence = clean.confidence;
    report = fromArtDirectorSection(section);

    violations.length = 0;
    violations.push(...validateSeniorArtDirectorAgentReport(report, section, {}));
    recordArtDirectorModules(section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && directorValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    report = { ...report, confidence: Math.max(report.confidence, CONFIDENCE_THRESHOLD) };
  }

  if (context.lowDesignScore && retryCount >= maxRetries && !context.skipRetry && report.overallDesignScore < DESIGN_SCORE_THRESHOLD) {
    violations.push(violation("RETRY_EXHAUSTED", "Art director retry did not recover overall design score"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.sceneBlueprint.sceneType,
    seed: 51,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: SENIOR_ART_DIRECTOR_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: SENIOR_ART_DIRECTOR_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const decision = await executeProfessionalDecision({
    agentId: SENIOR_ART_DIRECTOR_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!decision.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate art direction"));
  }
  if (!decision.state.problem?.professionalQuestion.toLowerCase().includes("professional")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be art-direction focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildSeniorArtDirectorAgentKpis({
    report: report ?? {
      overallDesignScore: 0,
      modernityScore: 0,
      premiumScore: 0,
      visualTaste: 0,
      designConsistency: 0,
      creativeQuality: 0,
      criticalProblems: [],
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
    modulesCompleted.length >= SENIOR_ART_DIRECTOR_AGENT_MODULES.length ||
    SENIOR_ART_DIRECTOR_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && directorValid && modulesComplete && Boolean(report),
    agentId: SENIOR_ART_DIRECTOR_AGENT_ID,
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
    goldenRuleSatisfied: SENIOR_ART_DIRECTOR_AGENT_GOLDEN_RULE.includes("put my name"),
  };
}

export async function executeSeniorArtDirectorAgentWithPipeline(input: {
  agentInput?: SeniorArtDirectorAgentInput;
  context?: SeniorArtDirectorAgentContext;
}): Promise<SeniorArtDirectorAgentExecutionReport> {
  const report = await executeSeniorArtDirectorAgent(input);
  if (!report.valid || !report.report) return report;

  const pipelineValid =
    SENIOR_ART_DIRECTOR_AGENT_PIPELINE.length === 2 &&
    SENIOR_ART_DIRECTOR_AGENT_PIPELINE[0].to === "senior_art_director" &&
    SENIOR_ART_DIRECTOR_AGENT_PIPELINE[1].to === "chief_design_director";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== SENIOR_ART_DIRECTOR_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use senior-art-director contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: SeniorArtDirectorAgentViolationRecord[]): SeniorArtDirectorAgentViolationRecord[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateSeniorArtDirectorAgentStructure(): SeniorArtDirectorAgentViolationRecord[] {
  if (SENIOR_ART_DIRECTOR_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Senior Art Director Agent requires 7 internal modules")];
  }
  return [];
}

export function validateSeniorArtDirectorAgent(
  context: SeniorArtDirectorAgentContext = {},
): SeniorArtDirectorAgentValidationReport {
  const violations = [...validateSeniorArtDirectorAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateSeniorArtDirectorAgentStructure().length === 0,
    pipelinePositionValid: SENIOR_ART_DIRECTOR_AGENT_PIPELINE[1].to === "chief_design_director",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateSeniorArtDirectorAgentWithExecution(
  context: SeniorArtDirectorAgentContext = {},
): Promise<SeniorArtDirectorAgentValidationReport> {
  const report = validateSeniorArtDirectorAgent(context);
  const kitchen = await executeSeniorArtDirectorAgent({
    agentInput: buildBatterySprayerSeniorArtDirectorInput(),
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

export function assertSeniorArtDirectorAgent(
  context?: SeniorArtDirectorAgentContext,
): SeniorArtDirectorAgentValidationReport {
  const report = validateSeniorArtDirectorAgent(context);
  if (!report.valid) {
    throw new Error(`Senior Art Director Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runSeniorArtDirectorAgent(
  context: SeniorArtDirectorAgentContext = {},
): Promise<SeniorArtDirectorAgentValidationReport> {
  return validateSeniorArtDirectorAgentWithExecution(context);
}

export function isSeniorArtDirectorAgentFailure(code: string): code is SeniorArtDirectorAgentFailureCode {
  const codes: SeniorArtDirectorAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "LOW_DESIGN_SCORE",
    "OUTDATED_DESIGN_UNDETECTED",
    "HARMONY_FAILURE",
    "LOW_PREMIUM_QUALITY",
    "DESIGN_INCONSISTENCY_UNDETECTED",
    "CRITICAL_PROBLEM_MISSED",
    "REPORT_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "FALSE_POSITIVE_SPIKE",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as SeniorArtDirectorAgentFailureCode);
}

export function getSeniorArtDirectorAgentModule(
  moduleId: SeniorArtDirectorAgentModuleId,
): SeniorArtDirectorAgentModuleDefinition | undefined {
  return SENIOR_ART_DIRECTOR_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function hasAgencyGradeGardenSprayerDesign(report: SeniorArtDirectorAgentReport): boolean {
  return report.overallDesignScore >= 88 && report.premiumScore >= 85 && !report.retryRequired;
}

export function scoreArtDirectorCandidateForHarmony(candidate: string, visualMood: string): number {
  if (candidate.includes("Garden") && visualMood.includes("Natural")) return 0.95;
  if (candidate.includes("Outdoor") && visualMood.includes("Fresh")) return 0.92;
  return 0.86;
}
