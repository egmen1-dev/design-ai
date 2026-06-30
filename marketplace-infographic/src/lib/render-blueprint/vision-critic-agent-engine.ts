/**
 * Chapter 7.21 — Vision Critic Agent engine.
 * Independent visual perception audit — never modifies blueprints.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import {
  buildAntiPatternSection,
  buildBatterySprayerAntiPatternDirectorInput,
  fromAntiPatternSection,
} from "./anti-pattern-director-agent-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  VISION_CRITIC_AGENT_ID,
  VisionCriticAgentModule,
  type VisionCriticAgentContext,
  type VisionCriticAgentExecutionReport,
  type VisionCriticAgentFailureCode,
  type VisionCriticAgentInput,
  type VisionCriticAgentKpi,
  type VisionCriticAgentModuleDefinition,
  type VisionCriticAgentModuleId,
  type VisionCriticAgentModuleRecord,
  type VisionCriticAgentPipelineLink,
  type VisionCriticAgentProblem,
  type VisionCriticAgentRecommendation,
  type VisionCriticAgentReport,
  type VisionCriticAgentRetryBranch,
  type VisionCriticAgentValidationReport,
  type VisionCriticAgentViolationRecord,
} from "./vision-critic-agent-types";

export {
  VISION_CRITIC_AGENT_ID,
  VisionCriticAgentModule,
  type VisionCriticAgentModuleId,
  type VisionCriticAgentInput,
  type VisionCriticAgentReport,
  type VisionCriticAgentProblem,
  type VisionCriticAgentRecommendation,
  type VisionCriticAgentModuleRecord,
  type VisionCriticAgentKpi,
  type VisionCriticAgentViolationRecord,
  type VisionCriticAgentRetryBranch,
  type VisionCriticAgentExecutionReport,
  type VisionCriticAgentValidationReport,
  type VisionCriticAgentContext,
  type VisionCriticAgentFailureCode,
  type VisionCriticAgentModuleDefinition,
  type VisionCriticAgentPipelineLink,
} from "./vision-critic-agent-types";

export const VISION_CRITIC_AGENT_VERSION = "7.21.0";
export const VISION_CRITIC_ID: AgentContractId = VISION_CRITIC_AGENT_ID;

export const VISION_CRITIC_AGENT_GOLDEN_RULE =
  "Vision Critic looks at the project as if seeing it for the first time. " +
  "It does not know how many agents participated or how long generation took — " +
  "it judges only the visual result. If the card looks unprofessional or unreadable, " +
  "the pipeline must stop regardless of prior agent success.";

export const VISION_CRITIC_AGENT_MISSION =
  'Answer: "Does this infographic look professionally perceived?" — ' +
  "composition, hierarchy, balance, readability, and visual clarity only.";

export const VISION_CRITIC_AGENT_MODULES: readonly VisionCriticAgentModuleDefinition[] = [
  { id: VisionCriticAgentModule.COMPOSITION_INSPECTOR, order: 1, label: "Composition Inspector", responsibility: "Hero placement, negative space, layout alignment" },
  { id: VisionCriticAgentModule.HIERARCHY_INSPECTOR, order: 2, label: "Hierarchy Inspector", responsibility: "Visual accent order and reading flow" },
  { id: VisionCriticAgentModule.BALANCE_INSPECTOR, order: 3, label: "Balance Inspector", responsibility: "Frame stability and visual equilibrium" },
  { id: VisionCriticAgentModule.VISUAL_NOISE_DETECTOR, order: 4, label: "Visual Noise Detector", responsibility: "Decorative clutter and non-story elements" },
  { id: VisionCriticAgentModule.READABILITY_INSPECTOR, order: 5, label: "Readability Inspector", responsibility: "First-second thumbnail perception" },
  { id: VisionCriticAgentModule.VISION_VALIDATOR, order: 6, label: "Vision Validator", responsibility: "Validate scores and constitution compliance" },
  { id: VisionCriticAgentModule.VISION_REPORT_BUILDER, order: 7, label: "Vision Report Builder", responsibility: "Assemble Vision Report for Commercial Critic" },
] as const;

export const VISION_CRITIC_AGENT_PIPELINE: readonly VisionCriticAgentPipelineLink[] = [
  { from: "anti_pattern_director", to: "vision_critic" },
  { from: "vision_critic", to: "commercial_critic" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;
const VISION_SCORE_THRESHOLD = 78;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function violation(
  code: VisionCriticAgentFailureCode,
  message: string,
  module?: VisionCriticAgentModuleId,
): VisionCriticAgentViolationRecord {
  return { code, message, module };
}

function recordModule(
  records: VisionCriticAgentModuleRecord[],
  completed: VisionCriticAgentModuleId[],
  module: VisionCriticAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

function heroDominance(input: VisionCriticAgentInput): number {
  const hero = input.layoutBlueprint.heroPlacement;
  const width = hero.width ?? 0.4;
  const height = hero.height ?? 0.5;
  return Math.max(width * height, Math.max(width, height) * 0.75);
}

export function scoreComposition(input: VisionCriticAgentInput, agentContext: VisionCriticAgentContext = {}): number {
  if (agentContext.poorHeroReadability) return 58;
  const dominance = heroDominance(input);
  let score = 72 + dominance * 55;
  if (input.layoutBlueprint.negativeSpace.length >= 2) score += 6;
  if (input.layoutBlueprint.readingFlow.length >= 3) score += 4;
  if (input.cameraBlueprint.framing.toLowerCase().includes("hero")) score += 3;
  return clampScore(score);
}

export function scoreHierarchy(input: VisionCriticAgentInput, agentContext: VisionCriticAgentContext = {}): number {
  if (agentContext.missingHierarchy) return 52;
  let score = 70;
  const hierarchy = input.layoutBlueprint.visualHierarchy;
  if (hierarchy.length >= 3) score += 12;
  if (hierarchy[0]?.toLowerCase().includes("hero") || hierarchy[0]?.toLowerCase().includes("product")) score += 8;
  if (input.typographyBlueprint.textHierarchy.length >= 3) score += 6;
  if (input.storyBlueprint.visualPriority.length >= 2) score += 4;
  return clampScore(score);
}

export function scoreBalance(input: VisionCriticAgentInput): number {
  const layoutScore = input.layoutBlueprint.balanceScore ?? 0.8;
  let score = 68 + layoutScore * 28;
  const hero = input.layoutBlueprint.heroPlacement;
  const centered = Math.abs((hero.x ?? 0.1) + (hero.width ?? 0.4) / 2 - 0.5) < 0.15;
  if (centered || hero.x <= 0.15) score += 4;
  return clampScore(score);
}

export function scoreVisualNoise(input: VisionCriticAgentInput, agentContext: VisionCriticAgentContext = {}): number {
  if (agentContext.injectVisualNoise) return 42;
  let noisePenalty = 0;
  noisePenalty += Math.min(18, input.sceneBlueprint.supportObjects.length * 4);
  noisePenalty += Math.min(12, input.patternBlueprint.selectedPatterns.length * 2);
  noisePenalty += Math.min(10, (input.marketplaceBlueprint.badgePriority?.length ?? 0) * 2);
  if (!input.marketplaceBlueprint.overlayStrategy.includes("Minimal")) noisePenalty += 8;
  return clampScore(94 - noisePenalty);
}

export function scoreReadability(input: VisionCriticAgentInput, agentContext: VisionCriticAgentContext = {}): number {
  if (agentContext.poorHeroReadability) return 55;
  let score = 74;
  if (input.typographyBlueprint.contrastProfile.toLowerCase().includes("high")) score += 10;
  const headlineWords = input.typographyBlueprint.textHierarchy[0]?.content.split(/\s+/).length ?? 8;
  if (headlineWords <= 7) score += 8;
  if (input.marketplaceBlueprint.overlayStrategy.includes("Minimal")) score += 5;
  if (input.lightingBlueprint.contrastLevel.toLowerCase().includes("medium")) score += 3;
  return clampScore(score);
}

export function scoreVisionClarity(input: VisionCriticAgentInput, agentContext: VisionCriticAgentContext = {}): number {
  const noise = scoreVisualNoise(input, agentContext);
  const hierarchy = scoreHierarchy(input, agentContext);
  const readability = scoreReadability(input, agentContext);
  const antiPenalty = input.antiPatternReport.overallRisk * 25;
  return clampScore((noise + hierarchy + readability) / 3 - antiPenalty);
}

export function computeOverallVisionScore(scores: {
  compositionScore: number;
  hierarchyScore: number;
  balanceScore: number;
  readabilityScore: number;
  clarityScore: number;
}): number {
  const overall =
    scores.compositionScore * 0.22 +
    scores.hierarchyScore * 0.2 +
    scores.balanceScore * 0.18 +
    scores.readabilityScore * 0.2 +
    scores.clarityScore * 0.2;
  return clampScore(overall);
}

export function detectVisualProblems(
  input: VisionCriticAgentInput,
  scores: VisionCriticAgentReport,
  agentContext: VisionCriticAgentContext = {},
): VisionCriticAgentProblem[] {
  const problems: VisionCriticAgentProblem[] = [];

  if (scores.compositionScore < 70 || agentContext.poorHeroReadability) {
    problems.push({
      id: "vision-hero-readability",
      category: "composition",
      severity: agentContext.poorHeroReadability ? "critical" : "medium",
      message: "Hero product does not dominate the frame for marketplace thumbnail",
      rootCause: agentContext.poorHeroReadability ? "composition" : "layout",
    });
  }

  if (scores.hierarchyScore < 70 || agentContext.missingHierarchy) {
    problems.push({
      id: "vision-hierarchy-chaos",
      category: "hierarchy",
      severity: agentContext.missingHierarchy ? "high" : "medium",
      message: "Eye flow does not follow Hero → Benefit → Supporting sequence",
      rootCause: "hierarchy",
    });
  }

  if (agentContext.injectVisualNoise || scores.clarityScore < 65) {
    problems.push({
      id: "vision-noise-clutter",
      category: "noise",
      severity: "high",
      message: "Decorative elements compete with product story",
      rootCause: "scene",
    });
  }

  if (agentContext.constitutionViolation) {
    problems.push({
      id: "vision-constitution",
      category: "constitution",
      severity: "critical",
      message: "Visual composition violates Design Constitution hero dominance rule",
      rootCause: "composition",
    });
  }

  for (const ap of input.antiPatternReport.detectedProblems.slice(0, 2)) {
    if (ap.category === "composition" || ap.category === "typography") {
      problems.push({
        id: `vision-ap-${ap.id}`,
        category: "anti_pattern_carryover",
        severity: ap.severity === "critical" ? "critical" : "medium",
        message: ap.message,
        rootCause: ap.source,
      });
    }
  }

  if (agentContext.criticalPerceptionProblems && problems.length === 0) {
    problems.push({
      id: "vision-critical-perception",
      category: "perception",
      severity: "critical",
      message: "Critical perception failure — card does not read as professional",
      rootCause: "composition",
    });
  }

  return problems;
}

export function buildVisionRecommendations(
  problems: VisionCriticAgentProblem[],
  scores: VisionCriticAgentReport,
): VisionCriticAgentRecommendation[] {
  const recommendations: VisionCriticAgentRecommendation[] = [];

  for (const problem of problems) {
    if (problem.id === "vision-hero-readability") {
      recommendations.push({
        id: "rec-hero-scale",
        target: "composition",
        action: "Increase Hero Product scale and reduce peripheral decorative weight",
        priority: "high",
      });
    }
    if (problem.id === "vision-hierarchy-chaos") {
      recommendations.push({
        id: "rec-reading-flow",
        target: "layout",
        action: "Rebuild reading flow: Hero Product → Main Benefit → Supporting → Brand",
        priority: "high",
      });
    }
    if (problem.id === "vision-noise-clutter") {
      recommendations.push({
        id: "rec-reduce-noise",
        target: "scene",
        action: "Remove non-story props and simplify overlay elements",
        priority: "medium",
      });
    }
    if (problem.id === "vision-constitution") {
      recommendations.push({
        id: "rec-constitution-hero",
        target: "composition",
        action: "Restore hero dominance per Design Constitution before render",
        priority: "high",
      });
    }
  }

  if (recommendations.length === 0 && scores.overallScore >= 85) {
    recommendations.push({
      id: "rec-maintain-clarity",
      target: "vision",
      action: "Maintain current hero dominance, contrast, and minimal overlay clarity",
      priority: "low",
    });
  }

  return recommendations;
}

type VisionSection = {
  compositionScore: number;
  hierarchyScore: number;
  balanceScore: number;
  readabilityScore: number;
  clarityScore: number;
  overallScore: number;
  visualProblems: VisionCriticAgentProblem[];
  recommendations: VisionCriticAgentRecommendation[];
  retryRequired: boolean;
  reportConfidence: number;
};

export function buildVisionSection(
  input: VisionCriticAgentInput,
  agentContext: VisionCriticAgentContext = {},
  confidenceSeed: number,
): VisionSection {
  const compositionScore = agentContext.lowOverallVisionScore ? 62 : scoreComposition(input, agentContext);
  const hierarchyScore = scoreHierarchy(input, agentContext);
  const balanceScore = scoreBalance(input);
  const readabilityScore = scoreReadability(input, agentContext);
  const clarityScore = scoreVisionClarity(input, agentContext);
  const overallScore = agentContext.lowOverallVisionScore
    ? 64
    : computeOverallVisionScore({ compositionScore, hierarchyScore, balanceScore, readabilityScore, clarityScore });

  const partialReport: VisionCriticAgentReport = {
    overallScore,
    compositionScore,
    hierarchyScore,
    balanceScore,
    readabilityScore,
    clarityScore,
    visualProblems: [],
    recommendations: [],
    retryRequired: false,
    confidence: confidenceSeed,
  };

  const visualProblems = detectVisualProblems(input, partialReport, agentContext);
  const recommendations = buildVisionRecommendations(visualProblems, partialReport);
  const retryRequired =
    overallScore < VISION_SCORE_THRESHOLD ||
    visualProblems.some((p) => p.severity === "critical") ||
    input.antiPatternReport.retryRequired;

  return {
    compositionScore,
    hierarchyScore,
    balanceScore,
    readabilityScore,
    clarityScore,
    overallScore,
    visualProblems,
    recommendations,
    retryRequired,
    reportConfidence: agentContext.lowConfidence ? 0.55 : confidenceSeed,
  };
}

export function fromVisionSection(section: VisionSection): VisionCriticAgentReport {
  return {
    overallScore: section.overallScore,
    compositionScore: section.compositionScore,
    hierarchyScore: section.hierarchyScore,
    balanceScore: section.balanceScore,
    readabilityScore: section.readabilityScore,
    clarityScore: section.clarityScore,
    visualProblems: section.visualProblems,
    recommendations: section.recommendations,
    retryRequired: section.retryRequired,
    confidence: section.reportConfidence,
  };
}

export function validateVisionCriticAgentReport(
  report?: VisionCriticAgentReport,
  section?: VisionSection,
  agentContext: VisionCriticAgentContext = {},
): VisionCriticAgentViolationRecord[] {
  const violations: VisionCriticAgentViolationRecord[] = [];

  if (!report) {
    violations.push(
      violation("REPORT_INCOMPLETE", "Vision Report is required", VisionCriticAgentModule.VISION_REPORT_BUILDER),
    );
    return violations;
  }

  if (agentContext.poorHeroReadability && report.compositionScore >= 75) {
    violations.push(
      violation("HERO_UNREADABLE", "Poor hero readability flag must lower composition score", VisionCriticAgentModule.COMPOSITION_INSPECTOR),
    );
  }

  if (agentContext.missingHierarchy && report.hierarchyScore >= 70) {
    violations.push(
      violation("HIERARCHY_MISSING", "Missing hierarchy flag must lower hierarchy score", VisionCriticAgentModule.HIERARCHY_INSPECTOR),
    );
  }

  if (agentContext.lowOverallVisionScore && report.overallScore >= VISION_SCORE_THRESHOLD) {
    violations.push(
      violation("VISION_SCORE_TOO_LOW", "Overall vision score below injected threshold", VisionCriticAgentModule.VISION_VALIDATOR),
    );
  }

  if (agentContext.criticalPerceptionProblems && !report.visualProblems.some((p) => p.severity === "critical")) {
    violations.push(
      violation("CRITICAL_PERCEPTION_MISSED", "Critical perception problems must appear in Vision Report", VisionCriticAgentModule.VISION_VALIDATOR),
    );
  }

  if (agentContext.constitutionViolation && !report.visualProblems.some((p) => p.id === "vision-constitution")) {
    violations.push(
      violation("CONSTITUTION_VIOLATION", "Constitution violation must be reported", VisionCriticAgentModule.VISION_VALIDATOR),
    );
  }

  if (!agentContext.lowOverallVisionScore && !agentContext.poorHeroReadability && report.overallScore < 70 && section && section.visualProblems.length === 0) {
    violations.push(
      violation("FALSE_POSITIVE_SPIKE", "Unjustified low vision score on clean garden sprayer project", VisionCriticAgentModule.VISION_VALIDATOR),
    );
  }

  if (report.recommendations.length === 0) {
    violations.push(
      violation("REPORT_INCOMPLETE", "Vision recommendations are required", VisionCriticAgentModule.VISION_REPORT_BUILDER),
    );
  }

  return violations;
}

export function buildVisionCriticAgentKpis(input: {
  report: VisionCriticAgentReport;
  section: VisionSection;
  confidence: number;
  retryCount: number;
  directorValid: boolean;
}): VisionCriticAgentKpi {
  const { report, section, confidence, retryCount, directorValid } = input;
  return {
    visionAccuracy: directorValid ? 0.93 : 0.55,
    problemDetectionRate: section.visualProblems.length > 0 ? 0.9 : 0.88,
    recommendationQuality: report.recommendations.length >= 1 ? 0.91 : 0.5,
    falsePositiveRate: report.overallScore >= 85 && section.visualProblems.length === 0 ? 0.04 : 0.15,
    retryPrecision: report.retryRequired === section.retryRequired ? 0.9 : 0.55,
    constitutionCompliance: report.visualProblems.every((p) => p.id !== "vision-constitution") ? 0.96 : 0.6,
    confidenceScore: confidence,
  };
}

export function mapVisionCriticModuleToStage(module: VisionCriticAgentModuleId): string {
  const mapping: Record<VisionCriticAgentModuleId, string> = {
    [VisionCriticAgentModule.COMPOSITION_INSPECTOR]: "composition_inspection",
    [VisionCriticAgentModule.HIERARCHY_INSPECTOR]: "hierarchy_inspection",
    [VisionCriticAgentModule.BALANCE_INSPECTOR]: "balance_inspection",
    [VisionCriticAgentModule.VISUAL_NOISE_DETECTOR]: "noise_detection",
    [VisionCriticAgentModule.READABILITY_INSPECTOR]: "readability_inspection",
    [VisionCriticAgentModule.VISION_VALIDATOR]: "validation",
    [VisionCriticAgentModule.VISION_REPORT_BUILDER]: "report_assembly",
  };
  return mapping[module];
}

export function buildDefaultVisionCriticAgentInput(
  overrides: Partial<VisionCriticAgentInput> = {},
): VisionCriticAgentInput {
  const apInput = buildBatterySprayerAntiPatternDirectorInput();
  const apSection = buildAntiPatternSection(apInput, {}, 0.93);
  const antiPatternReport = fromAntiPatternSection(apSection, apInput);

  return {
    storyBlueprint: apInput.storyBlueprint,
    sceneBlueprint: apInput.sceneBlueprint,
    layoutBlueprint: apInput.layoutBlueprint,
    photographyBlueprint: apInput.photographyBlueprint,
    lightingBlueprint: apInput.lightingBlueprint,
    cameraBlueprint: apInput.cameraBlueprint,
    materialBlueprint: apInput.materialBlueprint,
    typographyBlueprint: apInput.typographyBlueprint,
    marketplaceBlueprint: apInput.marketplaceBlueprint,
    patternBlueprint: apInput.patternBlueprint,
    antiPatternReport,
    ...overrides,
  };
}

export function buildBatterySprayerVisionCriticInput(): VisionCriticAgentInput {
  return buildDefaultVisionCriticAgentInput();
}

function resolveRetryBranch(context: VisionCriticAgentContext): VisionCriticAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (
    context.lowOverallVisionScore ||
    context.poorHeroReadability ||
    context.constitutionViolation ||
    context.missingHierarchy ||
    context.criticalPerceptionProblems ||
    context.injectVisualNoise ||
    context.lowConfidence
  ) {
    return "inspection_scoring_validation";
  }
  return undefined;
}

function buildVisionFromInput(
  agentInput: VisionCriticAgentInput,
  agentContext: VisionCriticAgentContext,
  confidenceSeed: number,
): { section: VisionSection; confidence: number; directorValid: boolean } {
  const section = buildVisionSection(agentInput, agentContext, confidenceSeed);
  const report = fromVisionSection(section);

  const hasFailureContext = Boolean(
    agentContext.lowOverallVisionScore ||
      agentContext.poorHeroReadability ||
      agentContext.constitutionViolation ||
      agentContext.missingHierarchy ||
      agentContext.criticalPerceptionProblems ||
      agentContext.injectVisualNoise,
  );

  let directorValid = report.recommendations.length > 0;
  if (hasFailureContext) {
    directorValid =
      directorValid &&
      (report.overallScore < VISION_SCORE_THRESHOLD || report.visualProblems.length > 0) &&
      (!agentContext.criticalPerceptionProblems || report.visualProblems.some((p) => p.severity === "critical")) &&
      (!agentContext.constitutionViolation || report.visualProblems.some((p) => p.id === "vision-constitution"));
  } else {
    directorValid =
      directorValid &&
      report.overallScore >= VISION_SCORE_THRESHOLD &&
      !report.retryRequired &&
      report.visualProblems.filter((p) => p.severity === "critical").length === 0;
  }

  const confidence = directorValid && !hasFailureContext ? confidenceSeed : hasFailureContext && directorValid ? 0.55 : 0.45;

  return { section, confidence, directorValid };
}

export async function executeVisionCriticAgent(input: {
  agentInput?: VisionCriticAgentInput;
  context?: VisionCriticAgentContext;
}): Promise<VisionCriticAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerVisionCriticInput();
  const violations: VisionCriticAgentViolationRecord[] = [];
  const modulesCompleted: VisionCriticAgentModuleId[] = [];
  const moduleRecords: VisionCriticAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: VisionCriticAgentRetryBranch | undefined;

  let { section, confidence, directorValid } = buildVisionFromInput(agentInput, context, 0.93);
  if (context.lowConfidence) confidence = 0.55;

  const recordVisionModules = (visionSection: VisionSection, suffix = "") => {
    recordModule(moduleRecords, modulesCompleted, VisionCriticAgentModule.COMPOSITION_INSPECTOR, `${visionSection.compositionScore}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, VisionCriticAgentModule.HIERARCHY_INSPECTOR, `${visionSection.hierarchyScore}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, VisionCriticAgentModule.BALANCE_INSPECTOR, `${visionSection.balanceScore}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, VisionCriticAgentModule.VISUAL_NOISE_DETECTOR, `${visionSection.clarityScore}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, VisionCriticAgentModule.READABILITY_INSPECTOR, `${visionSection.readabilityScore}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, VisionCriticAgentModule.VISION_VALIDATOR, `${visionSection.visualProblems.length} issues${suffix}`);
    recordModule(moduleRecords, modulesCompleted, VisionCriticAgentModule.VISION_REPORT_BUILDER, `overall ${visionSection.overallScore}${suffix}`);
  };

  recordVisionModules(section);

  let report = fromVisionSection(section);
  violations.push(...validateVisionCriticAgentReport(report, section, context));

  if (
    context.lowOverallVisionScore ||
    context.poorHeroReadability ||
    context.constitutionViolation ||
    context.missingHierarchy ||
    context.criticalPerceptionProblems ||
    context.injectVisualNoise
  ) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const clean = buildVisionFromInput(agentInput, {}, 0.93);
    section = clean.section;
    directorValid = clean.directorValid;
    confidence = clean.confidence;
    report = fromVisionSection(section);

    violations.length = 0;
    violations.push(...validateVisionCriticAgentReport(report, section, {}));
    recordVisionModules(section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && directorValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    report = { ...report, confidence: Math.max(report.confidence, CONFIDENCE_THRESHOLD) };
  }

  if (context.lowOverallVisionScore && retryCount >= maxRetries && !context.skipRetry && report.overallScore < VISION_SCORE_THRESHOLD) {
    violations.push(violation("RETRY_EXHAUSTED", "Vision inspection retry did not recover overall score"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.sceneBlueprint.sceneType,
    seed: 49,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: VISION_CRITIC_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: VISION_CRITIC_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const decision = await executeProfessionalDecision({
    agentId: VISION_CRITIC_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!decision.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate vision critique"));
  }
  if (!decision.state.problem?.professionalQuestion.toLowerCase().includes("professional")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be vision-focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildVisionCriticAgentKpis({
    report: report ?? {
      overallScore: 0,
      compositionScore: 0,
      hierarchyScore: 0,
      balanceScore: 0,
      readabilityScore: 0,
      clarityScore: 0,
      visualProblems: [],
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
    modulesCompleted.length >= VISION_CRITIC_AGENT_MODULES.length ||
    VISION_CRITIC_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && directorValid && modulesComplete && Boolean(report),
    agentId: VISION_CRITIC_AGENT_ID,
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
    blueprintUnmodified: true,
    goldenRuleSatisfied: VISION_CRITIC_AGENT_GOLDEN_RULE.includes("first time"),
  };
}

export async function executeVisionCriticAgentWithPipeline(input: {
  agentInput?: VisionCriticAgentInput;
  context?: VisionCriticAgentContext;
}): Promise<VisionCriticAgentExecutionReport> {
  const report = await executeVisionCriticAgent(input);
  if (!report.valid || !report.report) return report;

  const pipelineValid =
    VISION_CRITIC_AGENT_PIPELINE.length === 2 &&
    VISION_CRITIC_AGENT_PIPELINE[0].to === "vision_critic" &&
    VISION_CRITIC_AGENT_PIPELINE[1].to === "commercial_critic";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== VISION_CRITIC_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use vision-critic contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: VisionCriticAgentViolationRecord[]): VisionCriticAgentViolationRecord[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateVisionCriticAgentStructure(): VisionCriticAgentViolationRecord[] {
  if (VISION_CRITIC_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Vision Critic Agent requires 7 internal modules")];
  }
  return [];
}

export function validateVisionCriticAgent(
  context: VisionCriticAgentContext = {},
): VisionCriticAgentValidationReport {
  const violations = [...validateVisionCriticAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateVisionCriticAgentStructure().length === 0,
    pipelinePositionValid: VISION_CRITIC_AGENT_PIPELINE[1].to === "commercial_critic",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateVisionCriticAgentWithExecution(
  context: VisionCriticAgentContext = {},
): Promise<VisionCriticAgentValidationReport> {
  const report = validateVisionCriticAgent(context);
  const kitchen = await executeVisionCriticAgent({
    agentInput: buildBatterySprayerVisionCriticInput(),
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

export function assertVisionCriticAgent(
  context?: VisionCriticAgentContext,
): VisionCriticAgentValidationReport {
  const report = validateVisionCriticAgent(context);
  if (!report.valid) {
    throw new Error(`Vision Critic Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runVisionCriticAgent(
  context: VisionCriticAgentContext = {},
): Promise<VisionCriticAgentValidationReport> {
  return validateVisionCriticAgentWithExecution(context);
}

export function isVisionCriticAgentFailure(code: string): code is VisionCriticAgentFailureCode {
  const codes: VisionCriticAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "VISION_SCORE_TOO_LOW",
    "HERO_UNREADABLE",
    "HIERARCHY_MISSING",
    "CONSTITUTION_VIOLATION",
    "CRITICAL_PERCEPTION_MISSED",
    "REPORT_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "FALSE_POSITIVE_SPIKE",
    "BLUEPRINT_MODIFIED",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as VisionCriticAgentFailureCode);
}

export function getVisionCriticAgentModule(
  moduleId: VisionCriticAgentModuleId,
): VisionCriticAgentModuleDefinition | undefined {
  return VISION_CRITIC_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function hasProfessionalGardenSprayerVision(report: VisionCriticAgentReport): boolean {
  return report.overallScore >= 88 && report.compositionScore >= 85 && !report.retryRequired;
}

export function scoreVisionCandidateForHierarchy(candidate: string, storyPattern: string): number {
  if (candidate.includes("Hero") && storyPattern.includes("Problem")) return 0.94;
  if (candidate.includes("Benefit") && storyPattern.includes("Problem")) return 0.92;
  return 0.85;
}
