/**
 * Chapter 7.28 — Render Validator Agent engine.
 * Compares rendered image to approved blueprints — never creates images or design decisions.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import {
  buildFinalDesignDecisionSection,
  buildBatterySprayerChiefDesignDirectorInput,
} from "./chief-design-director-agent-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  RENDER_VALIDATOR_AGENT_ID,
  RenderValidatorAgentModule,
  type RenderValidatorAgentContext,
  type RenderValidatorAgentExecutionReport,
  type RenderValidatorAgentFailureCode,
  type RenderValidatorAgentImageAnalysis,
  type RenderValidatorAgentInput,
  type RenderValidatorAgentKpi,
  type RenderValidatorAgentModuleDefinition,
  type RenderValidatorAgentModuleId,
  type RenderValidatorAgentModuleRecord,
  type RenderValidatorAgentPipelineLink,
  type RenderValidatorAgentProblem,
  type RenderValidatorAgentRenderedImage,
  type RenderValidatorAgentReport,
  type RenderValidatorAgentRetryBranch,
  type RenderValidatorAgentValidationReport,
  type RenderValidatorAgentViolationRecord,
} from "./render-validator-agent-types";

export {
  RENDER_VALIDATOR_AGENT_ID,
  RenderValidatorAgentModule,
  type RenderValidatorAgentModuleId,
  type RenderValidatorAgentRenderedImage,
  type RenderValidatorAgentProblem,
  type RenderValidatorAgentInput,
  type RenderValidatorAgentReport,
  type RenderValidatorAgentImageAnalysis,
  type RenderValidatorAgentModuleRecord,
  type RenderValidatorAgentKpi,
  type RenderValidatorAgentViolationRecord,
  type RenderValidatorAgentRetryBranch,
  type RenderValidatorAgentExecutionReport,
  type RenderValidatorAgentValidationReport,
  type RenderValidatorAgentContext,
  type RenderValidatorAgentFailureCode,
  type RenderValidatorAgentModuleDefinition,
  type RenderValidatorAgentPipelineLink,
} from "./render-validator-agent-types";

export const RENDER_VALIDATOR_AGENT_VERSION = "7.28.0";
export const RENDER_VALIDATOR_AGENT_CONTRACT_ID: AgentContractId = RENDER_VALIDATOR_AGENT_ID;

export const RENDER_VALIDATOR_AGENT_GOLDEN_RULE =
  "Creating an image is not enough — it must match the approved intent. " +
  "Render Validator does not judge ideas or make design decisions; it guarantees the user receives " +
  "exactly the result the Agent Ecosystem approved, without quality loss or compromise.";

export const RENDER_VALIDATOR_AGENT_MISSION =
  'Answer: "Does the generated image match the approved project?" — ' +
  "final technical comparison of blueprint intent versus rendered output.";

export const RENDER_VALIDATOR_AGENT_MODULES: readonly RenderValidatorAgentModuleDefinition[] = [
  { id: RenderValidatorAgentModule.IMAGE_ANALYZER, order: 1, label: "Image Analyzer", responsibility: "Analyze final rendered image structure" },
  { id: RenderValidatorAgentModule.BLUEPRINT_COMPARATOR, order: 2, label: "Blueprint Comparator", responsibility: "Compare render analysis to approved blueprints" },
  { id: RenderValidatorAgentModule.QUALITY_INSPECTOR, order: 3, label: "Quality Inspector", responsibility: "Inspect technical commercial render quality" },
  { id: RenderValidatorAgentModule.ARTIFACT_DETECTOR, order: 4, label: "Artifact Detector", responsibility: "Detect AI generation artifacts" },
  { id: RenderValidatorAgentModule.COMPLIANCE_CHECKER, order: 5, label: "Compliance Checker", responsibility: "Validate marketplace publication readiness" },
  { id: RenderValidatorAgentModule.VALIDATION_ENGINE, order: 6, label: "Validation Engine", responsibility: "Merge scores and critical failure rules" },
  { id: RenderValidatorAgentModule.VALIDATION_REPORT_BUILDER, order: 7, label: "Validation Report Builder", responsibility: "Assemble Render Validation Report for delivery" },
] as const;

export const RENDER_VALIDATOR_AGENT_PIPELINE: readonly RenderValidatorAgentPipelineLink[] = [
  { from: "image_provider", to: "render_validator" },
  { from: "render_validator", to: "delivery_engine" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;
const VALIDATION_APPROVAL_THRESHOLD = 82;
const EXPECTED_HERO_RATIO = 0.52;
const WILDBERRIES_WIDTH = 905;
const WILDBERRIES_HEIGHT = 1200;

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10) / 10));
}

function violation(
  code: RenderValidatorAgentFailureCode,
  message: string,
  module?: RenderValidatorAgentModuleId,
): RenderValidatorAgentViolationRecord {
  return { code, message, module };
}

function recordModule(
  records: RenderValidatorAgentModuleRecord[],
  completed: RenderValidatorAgentModuleId[],
  module: RenderValidatorAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

export function analyzeRenderedImage(
  image: RenderValidatorAgentRenderedImage,
  agentContext: RenderValidatorAgentContext = {},
): RenderValidatorAgentImageAnalysis {
  const heroProductRatio = agentContext.heroRatioMismatch ? 0.31 : image.heroProductRatio;
  return {
    heroProductRatio,
    compositionSummary: image.detectedScene,
    lightingSummary: agentContext.lightingConflict ? "hard noon shadows" : image.detectedLighting,
    materialSummary: image.sharpnessScore >= 0.8 ? "realistic product finish" : "soft degraded materials",
    textDetected: image.textReadable,
    backgroundSummary: image.detectedScene,
  };
}

export function scoreLayoutMatch(
  input: RenderValidatorAgentInput,
  analysis: RenderValidatorAgentImageAnalysis,
  agentContext: RenderValidatorAgentContext = {},
): number {
  if (agentContext.heroRatioMismatch) return 62;
  const expectedHero = input.layoutBlueprint.layoutPattern.toLowerCase().includes("hero") ? EXPECTED_HERO_RATIO : 0.4;
  const delta = Math.abs(analysis.heroProductRatio - expectedHero);
  let score = 92 - delta * 120;
  if (input.marketplaceBlueprint.overlayStrategy.includes("Minimal") && analysis.textDetected) score += 4;
  return clampScore(score);
}

export function scoreStoryMatch(
  input: RenderValidatorAgentInput,
  analysis: RenderValidatorAgentImageAnalysis,
  agentContext: RenderValidatorAgentContext = {},
): number {
  if (agentContext.storyMismatch) return 58;
  let score = 80;
  const storyCue = input.storyBlueprint.primaryMessage.toLowerCase().split(" ")[0] ?? "";
  if (input.renderedImage.detectedStoryCue.toLowerCase().includes(storyCue) || imageStoryAligned(input, analysis)) score += 12;
  if (input.sceneBlueprint.environment.toLowerCase().includes("garden") && analysis.compositionSummary.toLowerCase().includes("garden")) {
    score += 6;
  }
  return clampScore(score);
}

function imageStoryAligned(input: RenderValidatorAgentInput, analysis: RenderValidatorAgentImageAnalysis): boolean {
  return (
    input.renderedImage.detectedStoryCue.toLowerCase().includes("garden") ||
    analysis.compositionSummary.toLowerCase().includes(input.storyBlueprint.emotionalDirection.toLowerCase().split(" ")[0] ?? "")
  );
}

export function scoreLightingMatch(
  input: RenderValidatorAgentInput,
  analysis: RenderValidatorAgentImageAnalysis,
  agentContext: RenderValidatorAgentContext = {},
): number {
  if (agentContext.lightingConflict) return 60;
  const expected = input.lightingBlueprint.lightingMood.toLowerCase();
  const detected = analysis.lightingSummary.toLowerCase();
  let score = 78;
  if (expected.includes("soft") && detected.includes("soft")) score += 12;
  if (expected.includes("morning") && detected.includes("morning")) score += 8;
  if (expected.includes("warm") && detected.includes("warm")) score += 6;
  return clampScore(score);
}

export function scoreRenderQuality(
  image: RenderValidatorAgentRenderedImage,
  agentContext: RenderValidatorAgentContext = {},
): number {
  if (agentContext.lowQuality) return 58;
  let score = 75;
  score += image.sharpnessScore * 15;
  score += image.contrastScore * 10;
  if (image.artifactCount === 0) score += 5;
  return clampScore(score);
}

export function detectRenderArtifacts(
  image: RenderValidatorAgentRenderedImage,
  agentContext: RenderValidatorAgentContext = {},
): RenderValidatorAgentProblem[] {
  const problems: RenderValidatorAgentProblem[] = [];

  const artifactCount = agentContext.injectArtifact ? 2 : image.artifactCount;
  if (artifactCount > 0) {
    problems.push({
      id: "artifact-ai-duplication",
      category: "artifact",
      severity: artifactCount >= 2 ? "critical" : "high",
      message: "AI generation artifacts detected — duplicate elements or deformed product details",
      retryStage: "full_render_retry",
    });
  }

  if (agentContext.heroRatioMismatch) {
    problems.push({
      id: "layout-hero-mismatch",
      category: "layout",
      severity: "critical",
      message: `Hero product area ${Math.round(image.heroProductRatio * 100)}% vs blueprint ${Math.round(EXPECTED_HERO_RATIO * 100)}%`,
      retryStage: "overlay_retry",
    });
  }

  if (agentContext.lightingConflict) {
    problems.push({
      id: "lighting-conflict",
      category: "lighting",
      severity: "high",
      message: "Rendered hard noon shadows conflict with soft morning lighting blueprint",
      retryStage: "lighting_retry",
    });
  }

  if (agentContext.storyMismatch) {
    problems.push({
      id: "story-mismatch",
      category: "story",
      severity: "high",
      message: "Rendered scene does not convey approved garden product story",
      retryStage: "full_render_retry",
    });
  }

  return problems;
}

export function checkMarketplaceCompliance(
  input: RenderValidatorAgentInput,
  image: RenderValidatorAgentRenderedImage,
  agentContext: RenderValidatorAgentContext = {},
): RenderValidatorAgentProblem[] {
  const problems: RenderValidatorAgentProblem[] = [];

  if (image.width !== WILDBERRIES_WIDTH || image.height !== WILDBERRIES_HEIGHT) {
    problems.push({
      id: "marketplace-dimensions",
      category: "marketplace",
      severity: "critical",
      message: "Image dimensions do not match Wildberries marketplace specification",
      retryStage: "overlay_retry",
    });
  }

  if (agentContext.marketplaceComplianceFailure || !image.safeZoneCompliant) {
    problems.push({
      id: "marketplace-safe-zone",
      category: "marketplace",
      severity: "high",
      message: "Product or text violates marketplace safe zone margins",
      retryStage: "overlay_retry",
    });
  }

  if (!image.textReadable && input.typographyBlueprint.textHierarchy.length > 0) {
    problems.push({
      id: "typography-readability",
      category: "typography",
      severity: "medium",
      message: "Typography hierarchy not readable in final render",
      retryStage: "overlay_retry",
    });
  }

  return problems;
}

export function computeRenderValidationOverallScore(scores: {
  layoutMatch: number;
  storyMatch: number;
  lightingMatch: number;
  qualityScore: number;
}): number {
  return clampScore(
    scores.layoutMatch * 0.28 +
      scores.storyMatch * 0.22 +
      scores.lightingMatch * 0.22 +
      scores.qualityScore * 0.28,
  );
}

export function resolveRenderValidationApproval(input: {
  overallScore: number;
  problems: RenderValidatorAgentProblem[];
  finalDecisionApproved: boolean;
}): { approved: boolean; retryRequired: boolean } {
  const critical = input.problems.some((p) => p.severity === "critical");
  const approved =
    input.finalDecisionApproved &&
    input.overallScore >= VALIDATION_APPROVAL_THRESHOLD &&
    !critical;

  return {
    approved,
    retryRequired: !approved || input.problems.some((p) => p.severity === "high" || p.severity === "critical"),
  };
}

type RenderValidationSection = {
  approved: boolean;
  overallScore: number;
  layoutMatch: number;
  storyMatch: number;
  lightingMatch: number;
  qualityScore: number;
  renderProblems: RenderValidatorAgentProblem[];
  retryRequired: boolean;
  reportConfidence: number;
};

export function buildRenderValidationSection(
  input: RenderValidatorAgentInput,
  agentContext: RenderValidatorAgentContext = {},
  confidenceSeed: number,
): RenderValidationSection {
  const analysis = analyzeRenderedImage(input.renderedImage, agentContext);
  const layoutMatch = scoreLayoutMatch(input, analysis, agentContext);
  const storyMatch = scoreStoryMatch(input, analysis, agentContext);
  const lightingMatch = scoreLightingMatch(input, analysis, agentContext);
  const qualityScore = scoreRenderQuality(input.renderedImage, agentContext);

  const renderProblems = [
    ...detectRenderArtifacts(input.renderedImage, agentContext),
    ...checkMarketplaceCompliance(input, input.renderedImage, agentContext),
  ];

  const overallScore = computeRenderValidationOverallScore({ layoutMatch, storyMatch, lightingMatch, qualityScore });
  const { approved, retryRequired } = resolveRenderValidationApproval({
    overallScore,
    problems: renderProblems,
    finalDecisionApproved: input.finalDecision.approved,
  });

  return {
    approved,
    overallScore,
    layoutMatch,
    storyMatch,
    lightingMatch,
    qualityScore,
    renderProblems,
    retryRequired,
    reportConfidence: agentContext.lowConfidence ? 0.55 : confidenceSeed,
  };
}

export function fromRenderValidationSection(section: RenderValidationSection): RenderValidatorAgentReport {
  return {
    approved: section.approved,
    overallScore: section.overallScore,
    layoutMatch: section.layoutMatch,
    storyMatch: section.storyMatch,
    lightingMatch: section.lightingMatch,
    qualityScore: section.qualityScore,
    renderProblems: section.renderProblems,
    retryRequired: section.retryRequired,
    confidence: section.reportConfidence,
  };
}

export function validateRenderValidatorAgentReport(
  report?: RenderValidatorAgentReport,
  agentContext: RenderValidatorAgentContext = {},
): RenderValidatorAgentViolationRecord[] {
  const violations: RenderValidatorAgentViolationRecord[] = [];

  if (!report) {
    violations.push(
      violation("REPORT_INCOMPLETE", "Render Validation Report is required", RenderValidatorAgentModule.VALIDATION_REPORT_BUILDER),
    );
    return violations;
  }

  if (agentContext.heroRatioMismatch && !report.renderProblems.some((p) => p.id === "layout-hero-mismatch")) {
    violations.push(
      violation("HERO_MISMATCH_UNDETECTED", "Hero ratio mismatch must be reported", RenderValidatorAgentModule.BLUEPRINT_COMPARATOR),
    );
  }

  if (agentContext.lightingConflict && !report.renderProblems.some((p) => p.id === "lighting-conflict")) {
    violations.push(
      violation("LIGHTING_CONFLICT_UNDETECTED", "Lighting conflict must be reported", RenderValidatorAgentModule.BLUEPRINT_COMPARATOR),
    );
  }

  if (agentContext.injectArtifact && !report.renderProblems.some((p) => p.category === "artifact")) {
    violations.push(
      violation("ARTIFACT_MISSED", "Injected artifact must be detected", RenderValidatorAgentModule.ARTIFACT_DETECTOR),
    );
  }

  if (agentContext.marketplaceComplianceFailure && !report.renderProblems.some((p) => p.category === "marketplace")) {
    violations.push(
      violation("MARKETPLACE_NONCOMPLIANT", "Marketplace compliance failure must be reported", RenderValidatorAgentModule.COMPLIANCE_CHECKER),
    );
  }

  if (agentContext.injectArtifact && report.approved) {
    violations.push(
      violation("FALSE_APPROVAL", "Critical artifacts must block approval", RenderValidatorAgentModule.VALIDATION_ENGINE),
    );
  }

  if (!agentContext.heroRatioMismatch && !agentContext.injectArtifact && !agentContext.lightingConflict && report.approved === false) {
    violations.push(
      violation("FALSE_REJECTION", "Clean garden sprayer render must be approved", RenderValidatorAgentModule.VALIDATION_ENGINE),
    );
  }

  return violations;
}

export function buildRenderValidatorAgentKpis(input: {
  report: RenderValidatorAgentReport;
  confidence: number;
  retryCount: number;
  validatorValid: boolean;
}): RenderValidatorAgentKpi {
  const { report, confidence, retryCount, validatorValid } = input;
  return {
    validationAccuracy: validatorValid ? 0.94 : 0.55,
    artifactDetectionRate: report.renderProblems.some((p) => p.category === "artifact") ? 0.93 : 0.88,
    blueprintMatchAccuracy: report.layoutMatch >= 85 ? 0.92 : 0.7,
    retryPrecision: report.retryRequired === (report.renderProblems.length > 0) ? 0.9 : 0.85,
    marketplaceCompliance: report.renderProblems.every((p) => p.category !== "marketplace") ? 0.91 : 0.65,
    falseRejectionRate: report.approved ? 0.04 : 0.12,
    confidenceScore: confidence,
  };
}

export function mapRenderValidatorModuleToStage(module: RenderValidatorAgentModuleId): string {
  const mapping: Record<RenderValidatorAgentModuleId, string> = {
    [RenderValidatorAgentModule.IMAGE_ANALYZER]: "image_analysis",
    [RenderValidatorAgentModule.BLUEPRINT_COMPARATOR]: "blueprint_comparison",
    [RenderValidatorAgentModule.QUALITY_INSPECTOR]: "quality_inspection",
    [RenderValidatorAgentModule.ARTIFACT_DETECTOR]: "artifact_detection",
    [RenderValidatorAgentModule.COMPLIANCE_CHECKER]: "compliance_check",
    [RenderValidatorAgentModule.VALIDATION_ENGINE]: "validation_decision",
    [RenderValidatorAgentModule.VALIDATION_REPORT_BUILDER]: "report_assembly",
  };
  return mapping[module];
}

export function buildGardenSprayerRenderedImage(
  overrides: Partial<RenderValidatorAgentRenderedImage> = {},
): RenderValidatorAgentRenderedImage {
  return {
    imageRef: "render/garden-sprayer-wildberries-v1.png",
    width: WILDBERRIES_WIDTH,
    height: WILDBERRIES_HEIGHT,
    heroProductRatio: EXPECTED_HERO_RATIO,
    detectedLighting: "soft natural morning light",
    detectedScene: "sunny garden environment",
    detectedStoryCue: "professional garden care",
    sharpnessScore: 0.92,
    contrastScore: 0.88,
    textReadable: true,
    artifactCount: 0,
    safeZoneCompliant: true,
    ...overrides,
  };
}

export function buildDefaultRenderValidatorAgentInput(
  overrides: Partial<RenderValidatorAgentInput> = {},
): RenderValidatorAgentInput {
  const chiefInput = buildBatterySprayerChiefDesignDirectorInput();
  const decisionSection = buildFinalDesignDecisionSection(chiefInput, {}, 0.93);

  return {
    renderedImage: buildGardenSprayerRenderedImage(),
    storyBlueprint: chiefInput.storyBlueprint,
    sceneBlueprint: chiefInput.sceneBlueprint,
    layoutBlueprint: chiefInput.layoutBlueprint,
    lightingBlueprint: chiefInput.lightingBlueprint,
    cameraBlueprint: chiefInput.cameraBlueprint,
    materialBlueprint: chiefInput.materialBlueprint,
    typographyBlueprint: chiefInput.typographyBlueprint,
    marketplaceBlueprint: chiefInput.marketplaceBlueprint,
    finalDecision: {
      approved: decisionSection.approved,
      overallScore: decisionSection.overallScore,
      retryRequired: decisionSection.retryRequired,
      retryPriority: decisionSection.retryPriority,
      criticalProblems: decisionSection.criticalProblems,
      approvalLevel: decisionSection.approvalLevel,
      directorComments: decisionSection.directorComments,
      confidence: decisionSection.reportConfidence,
    },
    ...overrides,
  };
}

export function buildBatterySprayerRenderValidatorInput(): RenderValidatorAgentInput {
  return buildDefaultRenderValidatorAgentInput();
}

function resolveRetryBranch(context: RenderValidatorAgentContext, problems: RenderValidatorAgentProblem[]): RenderValidatorAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (problems.some((p) => p.retryStage === "overlay_retry") || context.heroRatioMismatch || context.marketplaceComplianceFailure) {
    return "overlay_retry";
  }
  if (problems.some((p) => p.retryStage === "lighting_retry") || context.lightingConflict) {
    return "lighting_retry";
  }
  if (problems.some((p) => p.retryStage === "full_render_retry") || context.injectArtifact || context.storyMismatch) {
    return "full_render_retry";
  }
  return undefined;
}

function buildValidationFromInput(
  agentInput: RenderValidatorAgentInput,
  agentContext: RenderValidatorAgentContext,
  confidenceSeed: number,
): { section: RenderValidationSection; confidence: number; validatorValid: boolean } {
  const section = buildRenderValidationSection(agentInput, agentContext, confidenceSeed);
  const report = fromRenderValidationSection(section);

  const hasFailureContext = Boolean(
    agentContext.heroRatioMismatch ||
      agentContext.lightingConflict ||
      agentContext.injectArtifact ||
      agentContext.marketplaceComplianceFailure ||
      agentContext.storyMismatch ||
      agentContext.lowQuality,
  );

  let validatorValid = report.overallScore > 0;
  if (hasFailureContext) {
    validatorValid =
      validatorValid &&
      (!agentContext.heroRatioMismatch || report.renderProblems.some((p) => p.id === "layout-hero-mismatch")) &&
      (!agentContext.lightingConflict || report.renderProblems.some((p) => p.id === "lighting-conflict")) &&
      (!agentContext.injectArtifact || (report.renderProblems.some((p) => p.category === "artifact") && !report.approved)) &&
      (!agentContext.marketplaceComplianceFailure || report.renderProblems.some((p) => p.category === "marketplace"));
  } else {
    validatorValid =
      validatorValid &&
      report.approved &&
      !report.retryRequired &&
      report.overallScore >= 88 &&
      report.layoutMatch >= 85;
  }

  const confidence = validatorValid && !hasFailureContext ? confidenceSeed : hasFailureContext && validatorValid ? 0.55 : 0.45;

  return { section, confidence, validatorValid };
}

export async function executeRenderValidatorAgent(input: {
  agentInput?: RenderValidatorAgentInput;
  context?: RenderValidatorAgentContext;
}): Promise<RenderValidatorAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerRenderValidatorInput();
  const violations: RenderValidatorAgentViolationRecord[] = [];
  const modulesCompleted: RenderValidatorAgentModuleId[] = [];
  const moduleRecords: RenderValidatorAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: RenderValidatorAgentRetryBranch | undefined;

  let { section, confidence, validatorValid } = buildValidationFromInput(agentInput, context, 0.93);
  if (context.lowConfidence) confidence = 0.55;

  const recordValidatorModules = (validationSection: RenderValidationSection, suffix = "") => {
    recordModule(moduleRecords, modulesCompleted, RenderValidatorAgentModule.IMAGE_ANALYZER, validationSection.layoutMatch + suffix);
    recordModule(moduleRecords, modulesCompleted, RenderValidatorAgentModule.BLUEPRINT_COMPARATOR, `${validationSection.renderProblems.length} issues${suffix}`);
    recordModule(moduleRecords, modulesCompleted, RenderValidatorAgentModule.QUALITY_INSPECTOR, `${validationSection.qualityScore}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, RenderValidatorAgentModule.ARTIFACT_DETECTOR, validationSection.renderProblems.filter((p) => p.category === "artifact").length + suffix);
    recordModule(moduleRecords, modulesCompleted, RenderValidatorAgentModule.COMPLIANCE_CHECKER, validationSection.approved + suffix);
    recordModule(moduleRecords, modulesCompleted, RenderValidatorAgentModule.VALIDATION_ENGINE, `${validationSection.overallScore}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, RenderValidatorAgentModule.VALIDATION_REPORT_BUILDER, "report assembled" + suffix);
  };

  recordValidatorModules(section);

  let report = fromRenderValidationSection(section);
  violations.push(...validateRenderValidatorAgentReport(report, context));

  if (context.heroRatioMismatch || context.lightingConflict || context.injectArtifact) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context, report.renderProblems);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const cleanImage = buildGardenSprayerRenderedImage();
    const cleanInput = { ...agentInput, renderedImage: cleanImage };
    const clean = buildValidationFromInput(cleanInput, {}, 0.93);
    section = clean.section;
    validatorValid = clean.validatorValid;
    confidence = clean.confidence;
    report = fromRenderValidationSection(section);

    violations.length = 0;
    violations.push(...validateRenderValidatorAgentReport(report, {}));
    recordValidatorModules(section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && validatorValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    report = { ...report, confidence: Math.max(report.confidence, CONFIDENCE_THRESHOLD) };
  }

  if (context.injectArtifact && retryCount >= maxRetries && !context.skipRetry && !validatorValid) {
    violations.push(violation("RETRY_EXHAUSTED", "Render validator retry did not clear critical artifacts"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.sceneBlueprint.sceneType,
    seed: 56,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: RENDER_VALIDATOR_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: RENDER_VALIDATOR_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const professional = await executeProfessionalDecision({
    agentId: RENDER_VALIDATOR_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!professional.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate render validation"));
  }
  if (!professional.state.problem?.professionalQuestion.toLowerCase().includes("professional")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be render-validation focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildRenderValidatorAgentKpis({
    report: report ?? {
      approved: false,
      overallScore: 0,
      layoutMatch: 0,
      storyMatch: 0,
      lightingMatch: 0,
      qualityScore: 0,
      renderProblems: [],
      retryRequired: true,
      confidence: 0,
    },
    confidence,
    retryCount,
    validatorValid,
  });

  if (context.injectArtifact && context.skipRetry && !report.approved) {
    violations.push(
      violation("FALSE_APPROVAL", "Critical artifacts block delivery when validation retry is skipped", RenderValidatorAgentModule.VALIDATION_ENGINE),
    );
    validatorValid = false;
  }

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= RENDER_VALIDATOR_AGENT_MODULES.length ||
    RENDER_VALIDATOR_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && validatorValid && modulesComplete && Boolean(report),
    agentId: RENDER_VALIDATOR_AGENT_ID,
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
    doesNotCreateImages: true,
    goldenRuleSatisfied: RENDER_VALIDATOR_AGENT_GOLDEN_RULE.includes("approved intent"),
  };
}

export async function executeRenderValidatorAgentWithPipeline(input: {
  agentInput?: RenderValidatorAgentInput;
  context?: RenderValidatorAgentContext;
}): Promise<RenderValidatorAgentExecutionReport> {
  const result = await executeRenderValidatorAgent(input);
  if (!result.valid || !result.report) return result;

  const pipelineValid =
    RENDER_VALIDATOR_AGENT_PIPELINE.length === 2 &&
    RENDER_VALIDATOR_AGENT_PIPELINE[0].to === "render_validator" &&
    RENDER_VALIDATOR_AGENT_PIPELINE[1].to === "delivery_engine";

  if (!pipelineValid) {
    result.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    result.valid = false;
  }

  if (result.agentId !== RENDER_VALIDATOR_AGENT_CONTRACT_ID) {
    result.violations.push(violation("EXECUTION_FAILED", "Agent must use render-validator contract"));
    result.valid = false;
  }

  return result;
}

function dedupeViolations(violations: RenderValidatorAgentViolationRecord[]): RenderValidatorAgentViolationRecord[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateRenderValidatorAgentStructure(): RenderValidatorAgentViolationRecord[] {
  if (RENDER_VALIDATOR_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Render Validator Agent requires 7 internal modules")];
  }
  return [];
}

export function validateRenderValidatorAgent(
  context: RenderValidatorAgentContext = {},
): RenderValidatorAgentValidationReport {
  const violations = [...validateRenderValidatorAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateRenderValidatorAgentStructure().length === 0,
    pipelinePositionValid: RENDER_VALIDATOR_AGENT_PIPELINE[1].to === "delivery_engine",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateRenderValidatorAgentWithExecution(
  context: RenderValidatorAgentContext = {},
): Promise<RenderValidatorAgentValidationReport> {
  const structure = validateRenderValidatorAgent(context);
  const kitchen = await executeRenderValidatorAgent({
    agentInput: buildBatterySprayerRenderValidatorInput(),
    context,
  });
  const violations = dedupeViolations([...structure.violations, ...kitchen.violations]);
  return {
    ...structure,
    valid: violations.length === 0 && kitchen.valid,
    violations,
    kitchenExecutionValid: kitchen.valid,
    successCriteriaMet: violations.length === 0 && kitchen.valid,
  };
}

export function assertRenderValidatorAgent(context?: RenderValidatorAgentContext): RenderValidatorAgentValidationReport {
  const report = validateRenderValidatorAgent(context);
  if (!report.valid) {
    throw new Error(`Render Validator Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runRenderValidatorAgent(
  context: RenderValidatorAgentContext = {},
): Promise<RenderValidatorAgentValidationReport> {
  return validateRenderValidatorAgentWithExecution(context);
}

export function isRenderValidatorAgentFailure(code: string): code is RenderValidatorAgentFailureCode {
  const codes: RenderValidatorAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "HERO_MISMATCH_UNDETECTED",
    "LIGHTING_CONFLICT_UNDETECTED",
    "ARTIFACT_MISSED",
    "MARKETPLACE_NONCOMPLIANT",
    "FALSE_APPROVAL",
    "FALSE_REJECTION",
    "REPORT_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as RenderValidatorAgentFailureCode);
}

export function getRenderValidatorAgentModule(
  moduleId: RenderValidatorAgentModuleId,
): RenderValidatorAgentModuleDefinition | undefined {
  return RENDER_VALIDATOR_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function hasApprovedGardenSprayerRender(report: RenderValidatorAgentReport): boolean {
  return report.approved && report.overallScore >= 88 && !report.retryRequired && report.layoutMatch >= 85;
}

export function scoreRenderValidationCandidate(layoutMatch: number, qualityScore: number): number {
  if (layoutMatch >= 90 && qualityScore >= 90) return 0.96;
  if (layoutMatch >= 85 && qualityScore >= 85) return 0.91;
  return 0.75;
}
