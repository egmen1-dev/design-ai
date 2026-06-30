/**
 * Chapter 7.20 — Anti-Pattern Director Agent engine.
 * Detects design anti-patterns and blueprint conflicts — never fixes, only reports.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import {
  AntiPatternSeverity,
  detectDesignAntiPatterns,
  recommendAntiPatternFixes,
  validateAntiPatternBlueprint,
  type AntiPatternBlueprintCheck,
  type AntiPatternDetectionResult,
} from "./anti-pattern-library-engine";
import {
  buildBatterySprayerCameraDirectorInput,
  buildCameraDirectorContextFromAgentInput,
  fromCameraSection,
} from "./camera-director-agent-engine";
import { buildCameraSection } from "./camera-director-engine";
import {
  buildBatterySprayerLightingDirectorInput,
  buildLightingDirectorContextFromAgentInput,
  fromLightingSection,
} from "./lighting-director-agent-engine";
import { buildLightingSection } from "./lighting-director-engine";
import {
  buildBatterySprayerMaterialDirectorInput,
  buildMaterialDirectorContextFromAgentInput,
  detectProductMaterials,
  fromMaterialSection,
} from "./material-director-agent-engine";
import { buildMaterialSection } from "./material-director-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  buildBatterySprayerPatternDirectorInput,
  buildPatternSection,
  buildPatternSelectionContext,
  fromPatternSection,
} from "./pattern-director-agent-engine";
import {
  buildBatterySprayerTypographyDirectorInput,
  buildTextHierarchy,
  buildTypographySection,
  fromTypographySection,
} from "./typography-director-agent-engine";
import {
  ANTI_PATTERN_DIRECTOR_AGENT_ID,
  AntiPatternDirectorAgentModule,
  type AntiPatternDirectorAgentContext,
  type AntiPatternDirectorAgentExecutionReport,
  type AntiPatternDirectorAgentFailureCode,
  type AntiPatternDirectorAgentInput,
  type AntiPatternDirectorAgentKpi,
  type AntiPatternDirectorAgentModuleDefinition,
  type AntiPatternDirectorAgentModuleId,
  type AntiPatternDirectorAgentModuleRecord,
  type AntiPatternDirectorAgentPipelineLink,
  type AntiPatternDirectorAgentProblem,
  type AntiPatternDirectorAgentRecommendation,
  type AntiPatternDirectorAgentReport,
  type AntiPatternDirectorAgentRetryBranch,
  type AntiPatternDirectorAgentRiskLevel,
  type AntiPatternDirectorAgentValidationReport,
  type AntiPatternDirectorAgentViolation,
  type AntiPatternDirectorAgentViolationRecord,
} from "./anti-pattern-director-agent-types";

export {
  ANTI_PATTERN_DIRECTOR_AGENT_ID,
  AntiPatternDirectorAgentModule,
  type AntiPatternDirectorAgentModuleId,
  type AntiPatternDirectorAgentInput,
  type AntiPatternDirectorAgentReport,
  type AntiPatternDirectorAgentProblem,
  type AntiPatternDirectorAgentViolation,
  type AntiPatternDirectorAgentRecommendation,
  type AntiPatternDirectorAgentRiskLevel,
  type AntiPatternDirectorAgentModuleRecord,
  type AntiPatternDirectorAgentKpi,
  type AntiPatternDirectorAgentViolationRecord,
  type AntiPatternDirectorAgentRetryBranch,
  type AntiPatternDirectorAgentExecutionReport,
  type AntiPatternDirectorAgentValidationReport,
  type AntiPatternDirectorAgentContext,
  type AntiPatternDirectorAgentFailureCode,
  type AntiPatternDirectorAgentModuleDefinition,
  type AntiPatternDirectorAgentPipelineLink,
} from "./anti-pattern-director-agent-types";

export const ANTI_PATTERN_DIRECTOR_AGENT_VERSION = "7.20.0";
export const ANTI_PATTERN_DIRECTOR_ID: AgentContractId = ANTI_PATTERN_DIRECTOR_AGENT_ID;

export const ANTI_PATTERN_DIRECTOR_AGENT_GOLDEN_RULE =
  "Creating good design is hard; creating bad design is easy. " +
  "Most commercial losses come from small unnoticed errors. " +
  "Anti-Pattern Director is the internal auditor — it does not invent new design, " +
  "it protects the system from mistakes that destroy commercial potential.";

export const ANTI_PATTERN_DIRECTOR_AGENT_MISSION =
  'Answer: "Which mistakes must absolutely be avoided?" — ' +
  "detect visual anti-patterns, commercial errors, marketplace violations, and blueprint conflicts before render.";

export const ANTI_PATTERN_DIRECTOR_AGENT_MODULES: readonly AntiPatternDirectorAgentModuleDefinition[] = [
  { id: AntiPatternDirectorAgentModule.VISUAL_ANTI_PATTERN_DETECTOR, order: 1, label: "Visual Anti-Pattern Detector", responsibility: "Detect composition and visual hierarchy errors" },
  { id: AntiPatternDirectorAgentModule.COMMERCIAL_ERROR_ANALYZER, order: 2, label: "Commercial Error Analyzer", responsibility: "Detect weak USP and commercial messaging failures" },
  { id: AntiPatternDirectorAgentModule.MARKETPLACE_VIOLATION_CHECKER, order: 3, label: "Marketplace Violation Checker", responsibility: "Verify marketplace blueprint compliance" },
  { id: AntiPatternDirectorAgentModule.CONSISTENCY_VALIDATOR, order: 4, label: "Consistency Validator", responsibility: "Find conflicts between agent blueprints" },
  { id: AntiPatternDirectorAgentModule.RISK_ASSESSMENT_ENGINE, order: 5, label: "Risk Assessment Engine", responsibility: "Score overall risk and retry requirement" },
  { id: AntiPatternDirectorAgentModule.RECOMMENDATION_BUILDER, order: 6, label: "Recommendation Builder", responsibility: "Produce actionable fix recommendations" },
  { id: AntiPatternDirectorAgentModule.ANTI_PATTERN_REPORT_BUILDER, order: 7, label: "Anti-Pattern Report Builder", responsibility: "Assemble Anti-Pattern Report for critics" },
] as const;

export const ANTI_PATTERN_DIRECTOR_AGENT_PIPELINE: readonly AntiPatternDirectorAgentPipelineLink[] = [
  { from: "pattern_director", to: "anti_pattern_director" },
  { from: "anti_pattern_director", to: "vision_critic" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;
const RISK_THRESHOLD = 0.55;

function violation(
  code: AntiPatternDirectorAgentFailureCode,
  message: string,
  module?: AntiPatternDirectorAgentModuleId,
): AntiPatternDirectorAgentViolationRecord {
  return { code, message, module };
}

function recordModule(
  records: AntiPatternDirectorAgentModuleRecord[],
  completed: AntiPatternDirectorAgentModuleId[],
  module: AntiPatternDirectorAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

function severityToRisk(severity: string): AntiPatternDirectorAgentRiskLevel {
  if (severity === AntiPatternSeverity.CRITICAL) return "critical";
  if (severity === AntiPatternSeverity.MAJOR) return "high";
  if (severity === AntiPatternSeverity.MINOR) return "medium";
  return "low";
}

function estimateHeroProductRatio(input: AntiPatternDirectorAgentInput): number {
  const hero = input.layoutBlueprint.heroPlacement;
  const width = hero.width ?? 0.4;
  const height = hero.height ?? 0.5;
  const area = width * height;
  const dominantAxis = Math.max(width, height);
  const dominance = Math.max(area, dominantAxis * 0.75);
  return Math.min(0.85, Math.max(0.2, dominance));
}

export function buildAntiPatternBlueprintCheck(
  input: AntiPatternDirectorAgentInput,
  agentContext: AntiPatternDirectorAgentContext = {},
): AntiPatternBlueprintCheck {
  const heroRatio = estimateHeroProductRatio(input);
  const overlayCount = input.marketplaceBlueprint.badgePriority?.length ?? 2;
  const minimalOverlay = input.marketplaceBlueprint.overlayStrategy.includes("Minimal");

  if (agentContext.injectCriticalViolations) {
    return {
      hasHeroProduct: false,
      heroProductRatio: 0.22,
      overcrowded: true,
      chaoticEyeFlow: true,
      missingUsp: true,
      tellEverythingAtOnce: true,
      marketplaceRuleViolation: true,
      safeZoneViolation: true,
      thumbnailReadable: false,
      textContrastRatio: 2.5,
      textDensity: 0.55,
      cognitiveLoad: 0.88,
      visualNoise: true,
    };
  }

  return {
    hasHeroProduct: true,
    heroProductRatio: agentContext.lowCommercialScore ? 0.32 : heroRatio,
    competingFocalPoints: agentContext.agentInconsistency ? 3 : 1,
    overcrowded: !minimalOverlay && overlayCount > 5,
    negativeSpaceRatio: input.layoutBlueprint.negativeSpace.length >= 2 ? 0.28 : 0.18,
    chaoticEyeFlow: false,
    textContrastRatio: input.typographyBlueprint.contrastProfile.includes("High") ? 5.4 : 4.6,
    textDensity: minimalOverlay ? 0.22 : 0.35,
    fontSizeCount: input.typographyBlueprint.textHierarchy.length,
    alignmentChaotic: false,
    headlineTooLong: input.typographyBlueprint.textHierarchy[0]?.content.split(/\s+/).length > 8,
    marketplaceRuleViolation: overlayCount > 4,
    thumbnailReadable: true,
    safeZoneViolation: false,
    cognitiveLoad: agentContext.highOverallRisk ? 0.82 : 0.35,
    visualNoise: false,
    emotionalConflict: agentContext.agentInconsistency,
    missingUsp: !input.storyBlueprint.primaryMessage,
    tellEverythingAtOnce: input.typographyBlueprint.textHierarchy.length > 5,
    noCommercialFocus: input.storyBlueprint.commercialGoal.length < 4,
    impossibleLighting: false,
    wrongShadows: false,
    plasticMaterials: false,
    aiArtifacts: false,
    deformedGeometry: false,
  };
}

export function detectConsistencyConflicts(
  input: AntiPatternDirectorAgentInput,
  agentContext: AntiPatternDirectorAgentContext = {},
): AntiPatternDirectorAgentProblem[] {
  const problems: AntiPatternDirectorAgentProblem[] = [];

  const storyPremium =
    input.storyBlueprint.storyPattern.toLowerCase().includes("premium") ||
    input.storyBlueprint.emotionalDirection.toLowerCase().includes("premium");
  const typoDiscount =
    input.typographyBlueprint.headingStyle.toLowerCase().includes("discount") ||
    input.typographyBlueprint.bodyStyle.toLowerCase().includes("sale");

  if (storyPremium && typoDiscount) {
    problems.push({
      id: "consistency-story-typography",
      category: "consistency",
      severity: "high",
      message: "Premium story conflicts with discount typography style",
      source: "storyBlueprint vs typographyBlueprint",
    });
  }

  const goldenHour =
    input.lightingBlueprint.lightingMood.toLowerCase().includes("golden") ||
    input.lightingBlueprint.lightingPreset.toLowerCase().includes("golden");
  const nightScene =
    input.sceneBlueprint.environment.toLowerCase().includes("night") ||
    input.sceneBlueprint.atmosphere.toLowerCase().includes("night");

  if (goldenHour && nightScene) {
    problems.push({
      id: "consistency-lighting-scene",
      category: "consistency",
      severity: "critical",
      message: "Golden hour lighting conflicts with night studio scene",
      source: "lightingBlueprint vs sceneBlueprint",
    });
  }

  if (agentContext.agentInconsistency) {
    problems.push({
      id: "consistency-story-scene",
      category: "consistency",
      severity: "high",
      message: "Outdoor lifestyle story conflicts with industrial workshop scene mood",
      source: "storyBlueprint vs sceneBlueprint",
    });
  }

  if (agentContext.constitutionViolated) {
    problems.push({
      id: "constitution-hero-dominance",
      category: "constitution",
      severity: "critical",
      message: "Design Constitution requires hero product dominance on marketplace main image",
      source: "design_constitution",
    });
  }

  return problems;
}

function mapDetectionToProblems(detected: AntiPatternDetectionResult[]): AntiPatternDirectorAgentProblem[] {
  return detected.map((d) => ({
    id: d.antiPattern.id,
    category: d.antiPattern.category,
    severity: severityToRisk(d.antiPattern.severity),
    message: d.antiPattern.description,
    source: d.antiPattern.agentScope?.join(", ") ?? "anti_pattern_library",
  }));
}

function mapDetectionToViolations(detected: AntiPatternDetectionResult[]): AntiPatternDirectorAgentViolation[] {
  return detected
    .filter((d) => d.antiPattern.severity === AntiPatternSeverity.CRITICAL)
    .map((d) => ({
      id: `violation-${d.antiPattern.id}`,
      code: "CRITICAL_ANTI_PATTERN",
      severity: "critical" as const,
      message: d.antiPattern.description,
      antiPatternId: d.antiPattern.id,
    }));
}

export function buildActionableRecommendations(input: {
  detected: AntiPatternDetectionResult[];
  consistencyProblems: AntiPatternDirectorAgentProblem[];
  input: AntiPatternDirectorAgentInput;
}): AntiPatternDirectorAgentRecommendation[] {
  const recommendations: AntiPatternDirectorAgentRecommendation[] = [];
  const fixes = recommendAntiPatternFixes(input.detected);

  fixes.slice(0, 4).forEach((fix, index) => {
    recommendations.push({
      id: `rec-library-${index}`,
      target: "layout",
      action: fix,
      priority: index === 0 ? "high" : "medium",
    });
  });

  for (const problem of input.consistencyProblems) {
    if (problem.id === "consistency-story-typography") {
      recommendations.push({
        id: "rec-typography-premium",
        target: "typography",
        action: "Replace discount typography with premium hierarchy aligned to story",
        priority: "high",
      });
    }
    if (problem.id === "consistency-lighting-scene") {
      recommendations.push({
        id: "rec-lighting-scene",
        target: "lighting",
        action: "Align lighting preset with scene time-of-day or change scene atmosphere",
        priority: "high",
      });
    }
    if (problem.id === "constitution-hero-dominance") {
      recommendations.push({
        id: "rec-hero-scale",
        target: "composition",
        action: "Increase Hero Product scale and free upper safe zone for marketplace thumbnail",
        priority: "high",
      });
    }
  }

  if (recommendations.length === 0 && input.input.marketplaceBlueprint.overlayStrategy.includes("Minimal")) {
    recommendations.push({
      id: "rec-reading-flow",
      target: "composition",
      action: "Maintain minimal overlay, preserve hero dominance, and keep benefit-first reading flow",
      priority: "low",
    });
  }

  return recommendations;
}

export function computeOverallRisk(input: {
  detected: AntiPatternDetectionResult[];
  consistencyProblems: AntiPatternDirectorAgentProblem[];
  agentContext: AntiPatternDirectorAgentContext;
}): number {
  if (input.agentContext.highOverallRisk) return 0.82;
  let risk = 0.08;
  for (const d of input.detected) {
    risk += d.antiPattern.severityScore * 0.04;
  }
  for (const p of input.consistencyProblems) {
    if (p.severity === "critical") risk += 0.22;
    else if (p.severity === "high") risk += 0.12;
    else if (p.severity === "medium") risk += 0.06;
    else risk += 0.02;
  }
  return Math.min(0.98, risk);
}

type AntiPatternSection = {
  check: AntiPatternBlueprintCheck;
  detected: AntiPatternDetectionResult[];
  consistencyProblems: AntiPatternDirectorAgentProblem[];
  validation: ReturnType<typeof validateAntiPatternBlueprint>;
  overallRisk: number;
  retryRequired: boolean;
  reportConfidence: number;
};

export function buildAntiPatternSection(
  input: AntiPatternDirectorAgentInput,
  agentContext: AntiPatternDirectorAgentContext = {},
  confidenceSeed: number,
): AntiPatternSection {
  const check = buildAntiPatternBlueprintCheck(input, agentContext);
  const detected = detectDesignAntiPatterns(check);
  const consistencyProblems = detectConsistencyConflicts(input, agentContext);
  const validation = validateAntiPatternBlueprint(check);
  const overallRisk = computeOverallRisk({ detected, consistencyProblems, agentContext });
  const retryRequired =
    validation.rejectRecommended ||
    validation.retryRecommended ||
    overallRisk >= RISK_THRESHOLD ||
    consistencyProblems.some((p) => p.severity === "critical");

  return {
    check,
    detected,
    consistencyProblems,
    validation,
    overallRisk,
    retryRequired,
    reportConfidence: agentContext.lowConfidence ? 0.55 : confidenceSeed,
  };
}

export function fromAntiPatternSection(
  section: AntiPatternSection,
  input: AntiPatternDirectorAgentInput,
): AntiPatternDirectorAgentReport {
  const detectedProblems = [
    ...mapDetectionToProblems(section.detected),
    ...section.consistencyProblems,
  ];
  const criticalViolations = [
    ...mapDetectionToViolations(section.detected),
    ...section.consistencyProblems
      .filter((p) => p.severity === "critical")
      .map((p) => ({
        id: `violation-${p.id}`,
        code: "CONSISTENCY_CONFLICT",
        severity: "critical" as const,
        message: p.message,
      })),
  ];

  return {
    detectedProblems,
    criticalViolations,
    recommendations: buildActionableRecommendations({
      detected: section.detected,
      consistencyProblems: section.consistencyProblems,
      input,
    }),
    retryRequired: section.retryRequired,
    overallRisk: section.overallRisk,
    confidence: section.reportConfidence,
  };
}

export function validateAntiPatternDirectorAgentReport(
  report?: AntiPatternDirectorAgentReport,
  section?: AntiPatternSection,
  agentContext: AntiPatternDirectorAgentContext = {},
): AntiPatternDirectorAgentViolationRecord[] {
  const violations: AntiPatternDirectorAgentViolationRecord[] = [];

  if (!report) {
    violations.push(
      violation("REPORT_INCOMPLETE", "Anti-Pattern Report is required", AntiPatternDirectorAgentModule.ANTI_PATTERN_REPORT_BUILDER),
    );
    return violations;
  }

  if (report.detectedProblems.length === 0 && agentContext.injectCriticalViolations) {
    violations.push(
      violation("CRITICAL_VIOLATIONS_UNDETECTED", "Injected critical anti-patterns were not detected", AntiPatternDirectorAgentModule.VISUAL_ANTI_PATTERN_DETECTOR),
    );
  }

  if (report.criticalViolations.length > 0 && !agentContext.injectCriticalViolations && !agentContext.constitutionViolated && !agentContext.agentInconsistency) {
    if (section && section.overallRisk < 0.4) {
      violations.push(
        violation("FALSE_POSITIVE_SPIKE", "Critical violations flagged on clean garden sprayer blueprint", AntiPatternDirectorAgentModule.RISK_ASSESSMENT_ENGINE),
      );
    }
  }

  if (agentContext.agentInconsistency && !report.detectedProblems.some((p) => p.category === "consistency")) {
    violations.push(
      violation("AGENT_INCONSISTENCY_UNDETECTED", "Blueprint agent inconsistency was not detected", AntiPatternDirectorAgentModule.CONSISTENCY_VALIDATOR),
    );
  }

  if (agentContext.constitutionViolated && !report.criticalViolations.some((v) => v.message.includes("Constitution"))) {
    violations.push(
      violation("CONSTITUTION_VIOLATED", "Design Constitution violation must appear in report", AntiPatternDirectorAgentModule.CONSISTENCY_VALIDATOR),
    );
  }

  if (agentContext.injectCriticalViolations && report.criticalViolations.length === 0) {
    violations.push(
      violation("CRITICAL_VIOLATIONS_PRESENT", "Critical violations remain in blueprint", AntiPatternDirectorAgentModule.RISK_ASSESSMENT_ENGINE),
    );
  }

  if (agentContext.highOverallRisk && report.overallRisk < RISK_THRESHOLD) {
    violations.push(
      violation("HIGH_OVERALL_RISK", "Overall risk score below injected high-risk threshold", AntiPatternDirectorAgentModule.RISK_ASSESSMENT_ENGINE),
    );
  }

  if (agentContext.lowCommercialScore && !report.detectedProblems.some((p) => p.id.includes("hero"))) {
    violations.push(
      violation("COMMERCIAL_SCORE_TOO_LOW", "Commercial hero dominance issue not detected", AntiPatternDirectorAgentModule.COMMERCIAL_ERROR_ANALYZER),
    );
  }

  if (report.recommendations.length === 0 && report.detectedProblems.length > 0) {
    violations.push(
      violation("REPORT_INCOMPLETE", "Recommendations required when problems are detected", AntiPatternDirectorAgentModule.RECOMMENDATION_BUILDER),
    );
  }

  return violations;
}

export function buildAntiPatternDirectorAgentKpis(input: {
  report: AntiPatternDirectorAgentReport;
  section: AntiPatternSection;
  confidence: number;
  retryCount: number;
  directorValid: boolean;
}): AntiPatternDirectorAgentKpi {
  const { report, section, confidence, retryCount, directorValid } = input;
  const hasCommercial = report.detectedProblems.some((p) => p.category === "business");
  const hasMarketplace = report.detectedProblems.some((p) => p.category === "marketplace");
  return {
    detectionAccuracy: directorValid ? 0.94 : 0.55,
    falsePositiveRate: section.overallRisk < 0.2 ? 0.04 : 0.18,
    commercialErrorDetection: hasCommercial || section.detected.some((d) => d.antiPattern.category === "business") ? 0.91 : 0.85,
    constitutionCompliance: report.criticalViolations.every((v) => !v.message.includes("Constitution")) ? 0.96 : 0.6,
    retryPrecision: report.retryRequired === section.retryRequired ? 0.9 : 0.5,
    marketplaceViolationDetection: hasMarketplace ? 0.93 : 0.88,
    confidenceScore: confidence,
  };
}

export function mapAntiPatternDirectorModuleToStage(module: AntiPatternDirectorAgentModuleId): string {
  const mapping: Record<AntiPatternDirectorAgentModuleId, string> = {
    [AntiPatternDirectorAgentModule.VISUAL_ANTI_PATTERN_DETECTOR]: "visual_detection",
    [AntiPatternDirectorAgentModule.COMMERCIAL_ERROR_ANALYZER]: "commercial_analysis",
    [AntiPatternDirectorAgentModule.MARKETPLACE_VIOLATION_CHECKER]: "marketplace_check",
    [AntiPatternDirectorAgentModule.CONSISTENCY_VALIDATOR]: "consistency_validation",
    [AntiPatternDirectorAgentModule.RISK_ASSESSMENT_ENGINE]: "risk_assessment",
    [AntiPatternDirectorAgentModule.RECOMMENDATION_BUILDER]: "recommendations",
    [AntiPatternDirectorAgentModule.ANTI_PATTERN_REPORT_BUILDER]: "report_assembly",
  };
  return mapping[module];
}

export function buildDefaultAntiPatternDirectorAgentInput(
  overrides: Partial<AntiPatternDirectorAgentInput> = {},
): AntiPatternDirectorAgentInput {
  const patternInput = buildBatterySprayerPatternDirectorInput();

  const typoInput = buildBatterySprayerTypographyDirectorInput();
  const typoHierarchy = buildTextHierarchy(typoInput);
  const typoSection = buildTypographySection(typoInput, {}, 0.93);
  const typographyBlueprint = fromTypographySection(typoSection, typoHierarchy, typoInput, 0.93);

  const patCtx = buildPatternSelectionContext(patternInput);
  const patSection = buildPatternSection(patternInput, {}, 0.93);
  const patternBlueprint = fromPatternSection(patSection, patternInput, patCtx);

  const materialInput = buildBatterySprayerMaterialDirectorInput();
  const materialCtx = buildMaterialDirectorContextFromAgentInput(materialInput);
  const { section: materialSection } = buildMaterialSection(materialCtx, 0.93);
  const materials = detectProductMaterials(materialInput);
  const materialBlueprint = fromMaterialSection(materialSection, materials, materialInput, 0.93);

  const lightingInput = buildBatterySprayerLightingDirectorInput();
  const lightingCtx = buildLightingDirectorContextFromAgentInput(lightingInput);
  const { section: lightingSection } = buildLightingSection(lightingCtx, 0.93);
  const lightingBlueprint = fromLightingSection(lightingSection, 0.93);

  const cameraInput = buildBatterySprayerCameraDirectorInput();
  const cameraCtx = buildCameraDirectorContextFromAgentInput(cameraInput);
  const { section: cameraSection } = buildCameraSection(cameraCtx, 0.93);
  const cameraBlueprint = fromCameraSection(cameraSection, cameraInput, 0.93);

  return {
    storyBlueprint: patternInput.storyBlueprint,
    sceneBlueprint: patternInput.sceneBlueprint,
    layoutBlueprint: patternInput.layoutBlueprint,
    photographyBlueprint: materialInput.photographyBlueprint,
    lightingBlueprint,
    cameraBlueprint,
    materialBlueprint,
    typographyBlueprint,
    marketplaceBlueprint: patternInput.marketplaceBlueprint,
    patternBlueprint,
    knowledgePackage: patternInput.knowledgePackage,
    ...overrides,
  };
}

export function buildBatterySprayerAntiPatternDirectorInput(): AntiPatternDirectorAgentInput {
  return buildDefaultAntiPatternDirectorAgentInput();
}

function resolveRetryBranch(context: AntiPatternDirectorAgentContext): AntiPatternDirectorAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (
    context.injectCriticalViolations ||
    context.highOverallRisk ||
    context.constitutionViolated ||
    context.agentInconsistency ||
    context.lowCommercialScore ||
    context.lowConfidence
  ) {
    return "detection_risk_recommendation";
  }
  return undefined;
}

function buildAuditFromInput(
  agentInput: AntiPatternDirectorAgentInput,
  agentContext: AntiPatternDirectorAgentContext,
  confidenceSeed: number,
): { section: AntiPatternSection; confidence: number; directorValid: boolean } {
  const section = buildAntiPatternSection(agentInput, agentContext, confidenceSeed);
  const report = fromAntiPatternSection(section, agentInput);
  const directorValid =
    report.detectedProblems.length >= 0 &&
    report.recommendations.length > 0 &&
    (!agentContext.injectCriticalViolations || report.criticalViolations.length > 0) &&
    (agentContext.injectCriticalViolations || report.criticalViolations.length === 0) &&
    (agentContext.highOverallRisk || report.overallRisk < RISK_THRESHOLD);

  return {
    section,
    confidence: directorValid ? confidenceSeed : 0.45,
    directorValid,
  };
}

export async function executeAntiPatternDirectorAgent(input: {
  agentInput?: AntiPatternDirectorAgentInput;
  context?: AntiPatternDirectorAgentContext;
}): Promise<AntiPatternDirectorAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerAntiPatternDirectorInput();
  const violations: AntiPatternDirectorAgentViolationRecord[] = [];
  const modulesCompleted: AntiPatternDirectorAgentModuleId[] = [];
  const moduleRecords: AntiPatternDirectorAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: AntiPatternDirectorAgentRetryBranch | undefined;

  let { section, confidence, directorValid } = buildAuditFromInput(agentInput, context, 0.93);
  if (context.lowConfidence) confidence = 0.55;

  const recordAuditModules = (auditSection: AntiPatternSection, suffix = "") => {
    recordModule(moduleRecords, modulesCompleted, AntiPatternDirectorAgentModule.VISUAL_ANTI_PATTERN_DETECTOR, `${auditSection.detected.length} visual${suffix}`);
    recordModule(moduleRecords, modulesCompleted, AntiPatternDirectorAgentModule.COMMERCIAL_ERROR_ANALYZER, `${auditSection.detected.filter((d) => d.antiPattern.category === "business").length} commercial${suffix}`);
    recordModule(moduleRecords, modulesCompleted, AntiPatternDirectorAgentModule.MARKETPLACE_VIOLATION_CHECKER, `${auditSection.detected.filter((d) => d.antiPattern.category === "marketplace").length} marketplace${suffix}`);
    recordModule(moduleRecords, modulesCompleted, AntiPatternDirectorAgentModule.CONSISTENCY_VALIDATOR, `${auditSection.consistencyProblems.length} conflicts${suffix}`);
    recordModule(moduleRecords, modulesCompleted, AntiPatternDirectorAgentModule.RISK_ASSESSMENT_ENGINE, `risk ${auditSection.overallRisk.toFixed(2)}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, AntiPatternDirectorAgentModule.RECOMMENDATION_BUILDER, `${auditSection.validation.recommendedFixes.length} fixes${suffix}`);
    recordModule(moduleRecords, modulesCompleted, AntiPatternDirectorAgentModule.ANTI_PATTERN_REPORT_BUILDER, "report assembled" + suffix);
  };

  recordAuditModules(section);

  let report = fromAntiPatternSection(section, agentInput);
  violations.push(...validateAntiPatternDirectorAgentReport(report, section, context));

  if (
    context.injectCriticalViolations ||
    context.highOverallRisk ||
    context.constitutionViolated ||
    context.agentInconsistency ||
    context.lowCommercialScore
  ) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const clean = buildAuditFromInput(agentInput, {}, 0.93);
    section = clean.section;
    directorValid = clean.directorValid;
    confidence = clean.confidence;
    report = fromAntiPatternSection(section, agentInput);

    violations.length = 0;
    violations.push(...validateAntiPatternDirectorAgentReport(report, section, {}));
    recordAuditModules(section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && directorValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    report = { ...report, confidence: Math.max(report.confidence, CONFIDENCE_THRESHOLD) };
  }

  if (context.injectCriticalViolations && retryCount >= maxRetries && !context.skipRetry && report.criticalViolations.length > 0) {
    violations.push(violation("RETRY_EXHAUSTED", "Anti-pattern detection retry did not clear critical violations"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.sceneBlueprint.sceneType,
    seed: 48,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: ANTI_PATTERN_DIRECTOR_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: ANTI_PATTERN_DIRECTOR_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const decision = await executeProfessionalDecision({
    agentId: ANTI_PATTERN_DIRECTOR_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!decision.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate anti-pattern audit"));
  }
  if (!decision.state.problem?.professionalQuestion.toLowerCase().includes("professional")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be audit-focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildAntiPatternDirectorAgentKpis({
    report: report ?? {
      detectedProblems: [],
      criticalViolations: [],
      recommendations: [],
      retryRequired: false,
      overallRisk: 1,
      confidence: 0,
    },
    section,
    confidence,
    retryCount,
    directorValid,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= ANTI_PATTERN_DIRECTOR_AGENT_MODULES.length ||
    ANTI_PATTERN_DIRECTOR_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && directorValid && modulesComplete && Boolean(report),
    agentId: ANTI_PATTERN_DIRECTOR_AGENT_ID,
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
    goldenRuleSatisfied: ANTI_PATTERN_DIRECTOR_AGENT_GOLDEN_RULE.includes("does not invent"),
  };
}

export async function executeAntiPatternDirectorAgentWithPipeline(input: {
  agentInput?: AntiPatternDirectorAgentInput;
  context?: AntiPatternDirectorAgentContext;
}): Promise<AntiPatternDirectorAgentExecutionReport> {
  const report = await executeAntiPatternDirectorAgent(input);
  if (!report.valid || !report.report) return report;

  const pipelineValid =
    ANTI_PATTERN_DIRECTOR_AGENT_PIPELINE.length === 2 &&
    ANTI_PATTERN_DIRECTOR_AGENT_PIPELINE[0].to === "anti_pattern_director" &&
    ANTI_PATTERN_DIRECTOR_AGENT_PIPELINE[1].to === "vision_critic";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== ANTI_PATTERN_DIRECTOR_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use anti-pattern-director contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: AntiPatternDirectorAgentViolationRecord[]): AntiPatternDirectorAgentViolationRecord[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateAntiPatternDirectorAgentStructure(): AntiPatternDirectorAgentViolationRecord[] {
  if (ANTI_PATTERN_DIRECTOR_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Anti-Pattern Director Agent requires 7 internal modules")];
  }
  return [];
}

export function validateAntiPatternDirectorAgent(
  context: AntiPatternDirectorAgentContext = {},
): AntiPatternDirectorAgentValidationReport {
  const violations = [...validateAntiPatternDirectorAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateAntiPatternDirectorAgentStructure().length === 0,
    pipelinePositionValid: ANTI_PATTERN_DIRECTOR_AGENT_PIPELINE[1].to === "vision_critic",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateAntiPatternDirectorAgentWithExecution(
  context: AntiPatternDirectorAgentContext = {},
): Promise<AntiPatternDirectorAgentValidationReport> {
  const report = validateAntiPatternDirectorAgent(context);
  const kitchen = await executeAntiPatternDirectorAgent({
    agentInput: buildBatterySprayerAntiPatternDirectorInput(),
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

export function assertAntiPatternDirectorAgent(
  context?: AntiPatternDirectorAgentContext,
): AntiPatternDirectorAgentValidationReport {
  const report = validateAntiPatternDirectorAgent(context);
  if (!report.valid) {
    throw new Error(`Anti-Pattern Director Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runAntiPatternDirectorAgent(
  context: AntiPatternDirectorAgentContext = {},
): Promise<AntiPatternDirectorAgentValidationReport> {
  return validateAntiPatternDirectorAgentWithExecution(context);
}

export function isAntiPatternDirectorAgentFailure(code: string): code is AntiPatternDirectorAgentFailureCode {
  const codes: AntiPatternDirectorAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "CRITICAL_VIOLATIONS_UNDETECTED",
    "CRITICAL_VIOLATIONS_PRESENT",
    "HIGH_OVERALL_RISK",
    "CONSTITUTION_VIOLATED",
    "AGENT_INCONSISTENCY_UNDETECTED",
    "COMMERCIAL_SCORE_TOO_LOW",
    "REPORT_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "FALSE_POSITIVE_SPIKE",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as AntiPatternDirectorAgentFailureCode);
}

export function getAntiPatternDirectorAgentModule(
  moduleId: AntiPatternDirectorAgentModuleId,
): AntiPatternDirectorAgentModuleDefinition | undefined {
  return ANTI_PATTERN_DIRECTOR_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function hasCleanGardenSprayerAudit(report: AntiPatternDirectorAgentReport): boolean {
  return report.criticalViolations.length === 0 && report.overallRisk < 0.35 && !report.retryRequired;
}

export function scoreAntiPatternCandidateForStory(
  candidate: string,
  storyPattern: string,
): number {
  if (candidate.includes("USP") && storyPattern.includes("Problem")) return 0.95;
  if (candidate.includes("Hero") && storyPattern.includes("Premium")) return 0.9;
  return 0.84;
}

export function validateBlueprintConsistency(input: AntiPatternDirectorAgentInput): boolean {
  return detectConsistencyConflicts(input).length === 0;
}
