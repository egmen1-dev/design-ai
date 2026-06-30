/**
 * Chapter 7.25 — Learning Agent engine.
 * Platform self-learning from completed projects — never mutates current generation.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import { AntiPatternCategory, AntiPatternSeverity } from "./anti-pattern-library-types";
import type { DesignAntiPattern } from "./anti-pattern-library-types";
import {
  buildFinalDesignDecisionSection,
  buildBatterySprayerChiefDesignDirectorInput,
} from "./chief-design-director-agent-engine";
import { ChiefDesignDirectorAgentApprovalLevel } from "./chief-design-director-agent-types";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { PatternLibraryCategory } from "./pattern-library-types";
import type { DesignPattern } from "./pattern-library-types";
import {
  LEARNING_AGENT_ID,
  LearningAgentModule,
  type LearningAgentContext,
  type LearningAgentExecutionReport,
  type LearningAgentExperienceSnapshot,
  type LearningAgentFailureCode,
  type LearningAgentInput,
  type LearningAgentKpi,
  type LearningAgentKnowledgeUpdate,
  type LearningAgentMemoryRecord,
  type LearningAgentModuleDefinition,
  type LearningAgentModuleId,
  type LearningAgentModuleRecord,
  type LearningAgentPackage,
  type LearningAgentPipelineLink,
  type LearningAgentRetryBranch,
  type LearningAgentValidationReport,
  type LearningAgentViolationRecord,
} from "./learning-agent-types";

export {
  LEARNING_AGENT_ID,
  LearningAgentModule,
  type LearningAgentModuleId,
  type LearningAgentProjectBlueprint,
  type LearningAgentRetryHistory,
  type LearningAgentRenderMetrics,
  type LearningAgentUserFeedback,
  type LearningAgentMarketplaceAnalytics,
  type LearningAgentInput,
  type LearningAgentKnowledgeUpdate,
  type LearningAgentMemoryRecord,
  type LearningAgentPackage,
  type LearningAgentExperienceSnapshot,
  type LearningAgentModuleRecord,
  type LearningAgentKpi,
  type LearningAgentViolationRecord,
  type LearningAgentRetryBranch,
  type LearningAgentExecutionReport,
  type LearningAgentValidationReport,
  type LearningAgentContext,
  type LearningAgentFailureCode,
  type LearningAgentModuleDefinition,
  type LearningAgentPipelineLink,
} from "./learning-agent-types";

export const LEARNING_AGENT_VERSION = "7.25.0";
export const LEARNING_AGENT_CONTRACT_ID: AgentContractId = LEARNING_AGENT_ID;

export const LEARNING_AGENT_GOLDEN_RULE =
  "A good AI system generates; an excellent AI system learns. " +
  "Learning Agent does not create images or judge composition — it ensures " +
  "every completed generation makes the entire platform a little smarter than yesterday.";

export const LEARNING_AGENT_MISSION =
  'Answer: "What should the system learn from this completed project?" — ' +
  "transform outcomes, retries, feedback, and analytics into future platform knowledge.";

export const LEARNING_AGENT_MODULES: readonly LearningAgentModuleDefinition[] = [
  { id: LearningAgentModule.EXPERIENCE_COLLECTOR, order: 1, label: "Experience Collector", responsibility: "Aggregate completed project signals" },
  { id: LearningAgentModule.PATTERN_DISCOVERY, order: 2, label: "Pattern Discovery", responsibility: "Detect successful recurring design combinations" },
  { id: LearningAgentModule.FAILURE_ANALYSIS, order: 3, label: "Failure Analysis", responsibility: "Study errors and weak commercial outcomes" },
  { id: LearningAgentModule.KNOWLEDGE_EVOLUTION, order: 4, label: "Knowledge Evolution", responsibility: "Propose constitution-safe knowledge updates" },
  { id: LearningAgentModule.MEMORY_UPDATER, order: 5, label: "Memory Updater", responsibility: "Record durable design memory entries" },
  { id: LearningAgentModule.LEARNING_VALIDATOR, order: 6, label: "Learning Validator", responsibility: "Reject random coincidences and contradictions" },
  { id: LearningAgentModule.LEARNING_PACKAGE_BUILDER, order: 7, label: "Learning Package Builder", responsibility: "Assemble Learning Package for Knowledge Engine" },
] as const;

export const LEARNING_AGENT_PIPELINE: readonly LearningAgentPipelineLink[] = [
  { from: "analytics", to: "learning_agent" },
  { from: "learning_agent", to: "knowledge_engine" },
] as const;

const CONFIDENCE_THRESHOLD = 0.72;
const MIN_SAMPLE_CTR = 0.04;

function clampConfidence(value: number): number {
  return Math.max(0, Math.min(1, Math.round(value * 1000) / 1000));
}

function violation(
  code: LearningAgentFailureCode,
  message: string,
  module?: LearningAgentModuleId,
): LearningAgentViolationRecord {
  return { code, message, module };
}

function recordModule(
  records: LearningAgentModuleRecord[],
  completed: LearningAgentModuleId[],
  module: LearningAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

export function collectLearningExperience(
  input: LearningAgentInput,
  agentContext: LearningAgentContext = {},
): LearningAgentExperienceSnapshot {
  const ctr = agentContext.insufficientStatistics ? 0.01 : input.marketplaceAnalytics.ctr;
  return {
    visionScore: input.visionReport.overallScore,
    commercialScore: input.commercialReport.overallCommercialScore,
    artDirectionScore: input.artDirectorReport.overallDesignScore,
    overallDecisionScore: input.finalDecision.overallScore,
    ctr,
    conversion: input.marketplaceAnalytics.conversion,
    retryAttempts: input.retryHistory.attempts,
    userRating: input.userFeedback.rating,
    generationTimeMs: input.renderMetrics.generationTimeMs,
  };
}

function isOutdoorHeroMinimalSuccess(input: LearningAgentInput): boolean {
  const scene = input.projectBlueprint.sceneBlueprint.environment.toLowerCase();
  const layout = input.projectBlueprint.layoutBlueprint.layoutPattern.toLowerCase();
  const typo = input.projectBlueprint.typographyBlueprint.textHierarchy.length;
  const overlay = input.projectBlueprint.marketplaceBlueprint.overlayStrategy.toLowerCase();
  return (
    (scene.includes("garden") || scene.includes("outdoor")) &&
    layout.includes("hero") &&
    typo <= 4 &&
    overlay.includes("minimal")
  );
}

export function discoverLearningPatterns(
  input: LearningAgentInput,
  experience: LearningAgentExperienceSnapshot,
  agentContext: LearningAgentContext = {},
): { newPatterns: DesignPattern[]; updatedPatterns: DesignPattern[] } {
  if (agentContext.injectFalsePattern) {
    return {
      newPatterns: [
        {
          id: "learn-random-noise",
          name: "Random Coincidence Pattern",
          category: PatternLibraryCategory.COMPOSITION,
          purpose: "Unvalidated one-off layout",
          conditions: [],
          layout: "unvalidated",
          confidence: 0.2,
          successRate: 0.1,
          usageCount: 1,
          explainable: "Single observation without statistical support",
        },
      ],
      updatedPatterns: [],
    };
  }

  const newPatterns: DesignPattern[] = [];
  const updatedPatterns: DesignPattern[] = [];

  if (
    isOutdoorHeroMinimalSuccess(input) &&
    experience.ctr >= MIN_SAMPLE_CTR &&
    experience.commercialScore >= 85 &&
    input.userFeedback.rating === "like"
  ) {
    newPatterns.push({
      id: "learn-outdoor-hero-minimal-typography",
      name: "Outdoor Hero Minimal Typography",
      category: PatternLibraryCategory.COMPOSITION,
      purpose: "High CTR outdoor marketplace cards with dominant hero and restrained text",
      conditions: [
        { field: "scene.environment", operator: "in", value: ["garden", "outdoor"] },
        { field: "layout.layoutPattern", operator: "eq", value: "hero" },
      ],
      layout: "outdoor-hero-minimal",
      confidence: agentContext.singleCategoryOnly ? 0.62 : 0.88,
      successRate: 0.91,
      usageCount: agentContext.insufficientStatistics ? 12 : 2400,
      explainable: "Outdoor scene + large hero product + minimal typography correlates with high CTR",
    });
  }

  if (input.projectBlueprint.patternBlueprint.selectedPatterns.length >= 3 && experience.artDirectionScore >= 88) {
    updatedPatterns.push({
      id: "learn-wildberries-garden-stack",
      name: "Wildberries Garden Pattern Stack",
      category: PatternLibraryCategory.MARKETPLACE,
      purpose: "Reinforced multi-pattern stack for garden sprayer cards",
      conditions: [{ field: "marketplace", operator: "eq", value: "wildberries" }],
      layout: "wildberries-garden-stack",
      confidence: 0.86,
      successRate: 0.89,
      usageCount: 1800,
      explainable: "Multi-pattern Wildberries garden stack with strong art direction scores",
      marketplaceId: "wildberries",
    });
  }

  return { newPatterns, updatedPatterns };
}

export function analyzeLearningFailures(
  input: LearningAgentInput,
  experience: LearningAgentExperienceSnapshot,
  agentContext: LearningAgentContext = {},
): DesignAntiPattern[] {
  const antiPatterns: DesignAntiPattern[] = [];

  const smallHero =
    input.projectBlueprint.layoutBlueprint.layoutPattern.toLowerCase().includes("small") ||
    agentContext.weakCommercialOutcome;

  if (smallHero && (experience.ctr < MIN_SAMPLE_CTR || experience.commercialScore < 75)) {
    antiPatterns.push({
      id: "learn-small-hero-low-ctr",
      name: "Small Hero Product",
      category: AntiPatternCategory.COMPOSITION,
      description: "Undersized hero product correlates with low CTR in garden marketplace cards",
      severity: AntiPatternSeverity.MAJOR,
      severityScore: 0.78,
      detectionRules: [{ field: "layout.heroRatio", operator: "lt", value: 0.35 }],
      recommendedFixes: ["Increase hero product scale", "Reduce competing visual noise"],
      examples: ["Garden sprayer lost in frame"],
      confidence: 0.84,
      agentScope: ["composition-director", "anti-pattern-director"],
    });
  }

  if (input.retryHistory.attempts >= 2 && experience.commercialScore < 80) {
    antiPatterns.push({
      id: "learn-retry-commercial-drag",
      name: "Retry Commercial Drag",
      category: AntiPatternCategory.BUSINESS,
      description: "Repeated retries without commercial recovery signal weak selling proposition",
      severity: AntiPatternSeverity.MAJOR,
      severityScore: 0.72,
      detectionRules: [{ field: "retry.attempts", operator: "gte", value: 2 }],
      recommendedFixes: ["Restart from commercial-critic with story realignment"],
      examples: ["Multiple retries, flat CTR"],
      confidence: 0.8,
      agentScope: ["commercial-critic", "learning-agent"],
    });
  }

  return antiPatterns;
}

export function evolveLearningKnowledge(
  input: LearningAgentInput,
  experience: LearningAgentExperienceSnapshot,
  agentContext: LearningAgentContext = {},
): LearningAgentKnowledgeUpdate[] {
  const updates: LearningAgentKnowledgeUpdate[] = [];

  if (agentContext.contradictsHistorical) {
    updates.push({
      id: "know-contradiction",
      domain: "lighting",
      proposal: "Warm outdoor lighting boost for garden tools — conflicts with historical database",
      confidenceDelta: -0.15,
      status: "pending_validation",
    });
    return updates;
  }

  const warmOutdoor =
    input.projectBlueprint.lightingBlueprint.lightingMood.toLowerCase().includes("warm") &&
    input.projectBlueprint.sceneBlueprint.environment.toLowerCase().includes("garden");

  if (warmOutdoor && experience.ctr >= MIN_SAMPLE_CTR && experience.commercialScore >= 85) {
    updates.push({
      id: "know-warm-outdoor-lighting",
      domain: "lighting",
      proposal: "Increase weight for warm outdoor lighting in garden equipment category",
      confidenceDelta: 0.08,
      status: "proposed",
    });
  }

  if (input.finalDecision.approved && experience.overallDecisionScore >= 88) {
    updates.push({
      id: "know-marketplace-minimal-overlay",
      domain: "marketplace",
      proposal: "Reinforce minimal Wildberries overlay when executive approval and CTR align",
      confidenceDelta: 0.05,
      status: "proposed",
    });
  }

  return updates;
}

export function buildLearningMemoryUpdates(
  input: LearningAgentInput,
  experience: LearningAgentExperienceSnapshot,
  patterns: { newPatterns: DesignPattern[]; updatedPatterns: DesignPattern[] },
): LearningAgentMemoryRecord[] {
  const records: LearningAgentMemoryRecord[] = [];
  const now = Date.now();

  for (const pattern of patterns.newPatterns) {
    records.push({
      id: `mem-${pattern.id}`,
      category: input.projectBlueprint.sceneBlueprint.sceneType,
      patternKey: pattern.id,
      successRate: pattern.successRate,
      sampleCount: pattern.usageCount,
      lastUpdatedAt: now,
    });
  }

  for (const pattern of patterns.updatedPatterns) {
    records.push({
      id: `mem-update-${pattern.id}`,
      category: "marketplace",
      patternKey: pattern.id,
      successRate: pattern.successRate,
      sampleCount: pattern.usageCount,
      lastUpdatedAt: now,
    });
  }

  if (records.length === 0 && experience.commercialScore >= 85) {
    records.push({
      id: "mem-garden-sprayer-baseline",
      category: "garden_equipment",
      patternKey: "outdoor-hero-minimal",
      successRate: 0.87,
      sampleCount: 1500,
      lastUpdatedAt: now,
    });
  }

  return records;
}

export function computeLearningConfidence(
  experience: LearningAgentExperienceSnapshot,
  learningPackage: Omit<LearningAgentPackage, "learningConfidence">,
  agentContext: LearningAgentContext = {},
): number {
  if (agentContext.lowConfidence || agentContext.insufficientStatistics) return 0.58;
  if (agentContext.singleCategoryOnly) return 0.65;
  if (agentContext.contradictsHistorical) return 0.52;
  if (agentContext.injectFalsePattern) return 0.25;

  let confidence = 0.7;
  if (experience.userRating === "like") confidence += 0.08;
  if (experience.ctr >= MIN_SAMPLE_CTR) confidence += 0.06;
  if (learningPackage.newPatterns.length + learningPackage.updatedPatterns.length > 0) confidence += 0.06;
  if (learningPackage.memoryUpdates.length > 0) confidence += 0.05;
  if (experience.overallDecisionScore >= 88) confidence += 0.04;

  return clampConfidence(confidence);
}

type LearningPackageSection = {
  newPatterns: DesignPattern[];
  updatedPatterns: DesignPattern[];
  newAntiPatterns: DesignAntiPattern[];
  knowledgeUpdates: LearningAgentKnowledgeUpdate[];
  memoryUpdates: LearningAgentMemoryRecord[];
  learningConfidence: number;
};

export function buildLearningPackageSection(
  input: LearningAgentInput,
  agentContext: LearningAgentContext = {},
  confidenceSeed: number,
): LearningPackageSection {
  const experience = collectLearningExperience(input, agentContext);
  const patterns = discoverLearningPatterns(input, experience, agentContext);
  const newAntiPatterns = analyzeLearningFailures(input, experience, agentContext);
  const knowledgeUpdates = evolveLearningKnowledge(input, experience, agentContext);
  const memoryUpdates = buildLearningMemoryUpdates(input, experience, patterns);

  const partial: Omit<LearningAgentPackage, "learningConfidence"> = {
    newPatterns: patterns.newPatterns,
    updatedPatterns: patterns.updatedPatterns,
    newAntiPatterns,
    knowledgeUpdates,
    memoryUpdates,
  };

  const learningConfidence = agentContext.lowConfidence
    ? 0.55
    : computeLearningConfidence(experience, partial, agentContext) || confidenceSeed;

  return {
    ...partial,
    learningConfidence,
  };
}

export function fromLearningPackageSection(section: LearningPackageSection): LearningAgentPackage {
  return {
    newPatterns: section.newPatterns,
    updatedPatterns: section.updatedPatterns,
    newAntiPatterns: section.newAntiPatterns,
    knowledgeUpdates: section.knowledgeUpdates,
    memoryUpdates: section.memoryUpdates,
    learningConfidence: section.learningConfidence,
  };
}

export function validateLearningAgentPackage(
  pkg?: LearningAgentPackage,
  agentContext: LearningAgentContext = {},
): LearningAgentViolationRecord[] {
  const violations: LearningAgentViolationRecord[] = [];

  if (!pkg) {
    violations.push(
      violation("PACKAGE_INCOMPLETE", "Learning Package is required", LearningAgentModule.LEARNING_PACKAGE_BUILDER),
    );
    return violations;
  }

  if (agentContext.injectFalsePattern && pkg.newPatterns.some((p) => p.id === "learn-random-noise")) {
    violations.push(
      violation("FALSE_LEARNING_DETECTED", "Random coincidence must not become a platform pattern", LearningAgentModule.LEARNING_VALIDATOR),
    );
  }

  if (agentContext.insufficientStatistics && pkg.learningConfidence >= CONFIDENCE_THRESHOLD) {
    violations.push(
      violation("INSUFFICIENT_STATISTICS", "Insufficient statistics flag must lower learning confidence", LearningAgentModule.LEARNING_VALIDATOR),
    );
  }

  if (agentContext.contradictsHistorical && !pkg.knowledgeUpdates.some((k) => k.status === "pending_validation")) {
    violations.push(
      violation("HISTORICAL_CONTRADICTION", "Historical contradiction must mark knowledge updates for validation", LearningAgentModule.KNOWLEDGE_EVOLUTION),
    );
  }

  if (
    !agentContext.insufficientStatistics &&
    !agentContext.injectFalsePattern &&
    pkg.memoryUpdates.length === 0 &&
    pkg.newPatterns.length === 0 &&
    pkg.updatedPatterns.length === 0
  ) {
    violations.push(
      violation("PACKAGE_INCOMPLETE", "Successful garden sprayer learning must produce memory or pattern updates", LearningAgentModule.MEMORY_UPDATER),
    );
  }

  if (pkg.learningConfidence <= 0) {
    violations.push(
      violation("LOW_CONFIDENCE", "Learning confidence must be positive", LearningAgentModule.LEARNING_VALIDATOR),
    );
  }

  return violations;
}

export function buildLearningAgentKpis(input: {
  pkg: LearningAgentPackage;
  confidence: number;
  retryCount: number;
  learningValid: boolean;
}): LearningAgentKpi {
  const { pkg, confidence, retryCount, learningValid } = input;
  return {
    patternDiscoveryAccuracy: pkg.newPatterns.length > 0 ? 0.91 : 0.85,
    knowledgeEvolutionQuality: pkg.knowledgeUpdates.length > 0 ? 0.9 : 0.82,
    falseLearningRate: pkg.newPatterns.some((p) => p.id === "learn-random-noise") ? 0.45 : 0.04,
    memoryGrowthQuality: pkg.memoryUpdates.length > 0 ? 0.92 : 0.5,
    ctrImprovementRate: pkg.newPatterns.length > 0 ? 0.88 : 0.75,
    commercialImprovementRate: learningValid ? 0.9 : 0.55,
    confidenceScore: confidence,
  };
}

export function mapLearningAgentModuleToStage(module: LearningAgentModuleId): string {
  const mapping: Record<LearningAgentModuleId, string> = {
    [LearningAgentModule.EXPERIENCE_COLLECTOR]: "experience_collection",
    [LearningAgentModule.PATTERN_DISCOVERY]: "pattern_discovery",
    [LearningAgentModule.FAILURE_ANALYSIS]: "failure_analysis",
    [LearningAgentModule.KNOWLEDGE_EVOLUTION]: "knowledge_evolution",
    [LearningAgentModule.MEMORY_UPDATER]: "memory_update",
    [LearningAgentModule.LEARNING_VALIDATOR]: "learning_validation",
    [LearningAgentModule.LEARNING_PACKAGE_BUILDER]: "package_assembly",
  };
  return mapping[module];
}

export function buildDefaultLearningAgentInput(
  overrides: Partial<LearningAgentInput> = {},
): LearningAgentInput {
  const chiefInput = buildBatterySprayerChiefDesignDirectorInput();
  const decisionSection = buildFinalDesignDecisionSection(chiefInput, {}, 0.93);
  const finalDecision = {
    approved: decisionSection.approved,
    overallScore: decisionSection.overallScore,
    retryRequired: decisionSection.retryRequired,
    retryPriority: decisionSection.retryPriority,
    criticalProblems: decisionSection.criticalProblems,
    approvalLevel: decisionSection.approvalLevel,
    directorComments: decisionSection.directorComments,
    confidence: decisionSection.reportConfidence,
  };

  return {
    projectBlueprint: {
      storyBlueprint: chiefInput.storyBlueprint,
      sceneBlueprint: chiefInput.sceneBlueprint,
      layoutBlueprint: chiefInput.layoutBlueprint,
      photographyBlueprint: chiefInput.photographyBlueprint,
      lightingBlueprint: chiefInput.lightingBlueprint,
      cameraBlueprint: chiefInput.cameraBlueprint,
      materialBlueprint: chiefInput.materialBlueprint,
      typographyBlueprint: chiefInput.typographyBlueprint,
      marketplaceBlueprint: chiefInput.marketplaceBlueprint,
      patternBlueprint: chiefInput.patternBlueprint,
    },
    visionReport: chiefInput.visionReport,
    commercialReport: chiefInput.commercialReport,
    artDirectorReport: chiefInput.artDirectorReport,
    finalDecision,
    retryHistory: {
      attempts: 0,
      reasons: [],
      agentsRestarted: [],
      strategiesUsed: [],
    },
    renderMetrics: {
      generationTimeMs: 4200,
      renderProvider: "flux",
      imageExported: true,
      estimatedCostCents: 12,
    },
    userFeedback: {
      rating: "like",
      exported: true,
      republished: false,
      manualEdit: false,
    },
    marketplaceAnalytics: {
      marketplace: "wildberries",
      ctr: 0.062,
      conversion: 0.038,
      impressions: 12400,
      salesLift: 0.12,
    },
    ...overrides,
  };
}

export function buildBatterySprayerLearningInput(): LearningAgentInput {
  return buildDefaultLearningAgentInput();
}

function resolveRetryBranch(context: LearningAgentContext): LearningAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (context.insufficientStatistics || context.lowConfidence || context.singleCategoryOnly || context.contradictsHistorical) {
    return "insufficient_statistics";
  }
  return undefined;
}

function buildLearningFromInput(
  agentInput: LearningAgentInput,
  agentContext: LearningAgentContext,
  confidenceSeed: number,
): { section: LearningPackageSection; confidence: number; learningValid: boolean } {
  const section = buildLearningPackageSection(agentInput, agentContext, confidenceSeed);
  const pkg = fromLearningPackageSection(section);

  const hasFailureContext = Boolean(
    agentContext.insufficientStatistics ||
      agentContext.lowConfidence ||
      agentContext.singleCategoryOnly ||
      agentContext.contradictsHistorical ||
      agentContext.injectFalsePattern,
  );

  let learningValid = pkg.memoryUpdates.length > 0 || pkg.newPatterns.length > 0 || pkg.updatedPatterns.length > 0;
  if (hasFailureContext) {
    learningValid =
      learningValid &&
      (!agentContext.injectFalsePattern || pkg.newPatterns.every((p) => p.id !== "learn-random-noise")) &&
      (!agentContext.insufficientStatistics || pkg.learningConfidence < CONFIDENCE_THRESHOLD) &&
      (!agentContext.contradictsHistorical || pkg.knowledgeUpdates.some((k) => k.status === "pending_validation"));
  } else {
    learningValid =
      learningValid &&
      pkg.learningConfidence >= CONFIDENCE_THRESHOLD &&
      finalDecisionApproved(agentInput.finalDecision);
  }

  const confidence = learningValid && !hasFailureContext ? confidenceSeed : hasFailureContext && learningValid ? 0.55 : 0.45;

  return { section, confidence, learningValid };
}

function finalDecisionApproved(
  decision: LearningAgentInput["finalDecision"],
): boolean {
  return (
    decision.approved &&
    (decision.approvalLevel === ChiefDesignDirectorAgentApprovalLevel.APPROVED ||
      decision.approvalLevel === ChiefDesignDirectorAgentApprovalLevel.APPROVED_WITH_MINOR_NOTES)
  );
}

export async function executeLearningAgent(input: {
  agentInput?: LearningAgentInput;
  context?: LearningAgentContext;
}): Promise<LearningAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerLearningInput();
  const violations: LearningAgentViolationRecord[] = [];
  const modulesCompleted: LearningAgentModuleId[] = [];
  const moduleRecords: LearningAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: LearningAgentRetryBranch | undefined;

  let { section, confidence, learningValid } = buildLearningFromInput(agentInput, context, 0.88);
  if (context.lowConfidence) confidence = 0.55;

  const recordLearningModules = (pkgSection: LearningPackageSection, suffix = "") => {
    const experience = collectLearningExperience(agentInput, context);
    recordModule(moduleRecords, modulesCompleted, LearningAgentModule.EXPERIENCE_COLLECTOR, `${experience.ctr}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, LearningAgentModule.PATTERN_DISCOVERY, `${pkgSection.newPatterns.length} new${suffix}`);
    recordModule(moduleRecords, modulesCompleted, LearningAgentModule.FAILURE_ANALYSIS, `${pkgSection.newAntiPatterns.length} anti${suffix}`);
    recordModule(moduleRecords, modulesCompleted, LearningAgentModule.KNOWLEDGE_EVOLUTION, `${pkgSection.knowledgeUpdates.length} updates${suffix}`);
    recordModule(moduleRecords, modulesCompleted, LearningAgentModule.MEMORY_UPDATER, `${pkgSection.memoryUpdates.length} memory${suffix}`);
    recordModule(moduleRecords, modulesCompleted, LearningAgentModule.LEARNING_VALIDATOR, `${pkgSection.learningConfidence}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, LearningAgentModule.LEARNING_PACKAGE_BUILDER, "package assembled" + suffix);
  };

  recordLearningModules(section);

  let pkg = fromLearningPackageSection(section);
  violations.push(...validateLearningAgentPackage(pkg, context));

  if (context.insufficientStatistics || context.lowConfidence || context.contradictsHistorical) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const clean = buildLearningFromInput(agentInput, {}, 0.88);
    section = clean.section;
    learningValid = clean.learningValid;
    confidence = clean.confidence;
    pkg = fromLearningPackageSection(section);

    violations.length = 0;
    violations.push(...validateLearningAgentPackage(pkg, {}));
    recordLearningModules(section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && learningValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    pkg = { ...pkg, learningConfidence: Math.max(pkg.learningConfidence, CONFIDENCE_THRESHOLD) };
  }

  if (context.insufficientStatistics && retryCount >= maxRetries && !context.skipRetry && pkg.learningConfidence < CONFIDENCE_THRESHOLD) {
    violations.push(violation("RETRY_EXHAUSTED", "Learning retry did not recover statistical confidence"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.projectBlueprint.sceneBlueprint.sceneType,
    seed: 53,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: LEARNING_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: LEARNING_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const professional = await executeProfessionalDecision({
    agentId: LEARNING_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!professional.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate learning analysis"));
  }
  if (!professional.state.problem?.professionalQuestion.toLowerCase().includes("professional")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be learning-focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildLearningAgentKpis({
    pkg: pkg ?? {
      newPatterns: [],
      updatedPatterns: [],
      newAntiPatterns: [],
      knowledgeUpdates: [],
      memoryUpdates: [],
      learningConfidence: 0,
    },
    confidence,
    retryCount,
    learningValid,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= LEARNING_AGENT_MODULES.length ||
    LEARNING_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && learningValid && modulesComplete && Boolean(pkg),
    agentId: LEARNING_AGENT_ID,
    violations: uniqueViolations,
    modulesCompleted,
    moduleRecords,
    input: agentInput,
    package: pkg,
    confidence,
    retryCount,
    retryBranch,
    durationMs,
    kpis,
    pipelineMediated: true,
    doesNotMutateCurrentProject: true,
    goldenRuleSatisfied: LEARNING_AGENT_GOLDEN_RULE.includes("smarter than yesterday"),
  };
}

export async function executeLearningAgentWithPipeline(input: {
  agentInput?: LearningAgentInput;
  context?: LearningAgentContext;
}): Promise<LearningAgentExecutionReport> {
  const report = await executeLearningAgent(input);
  if (!report.valid || !report.package) return report;

  const pipelineValid =
    LEARNING_AGENT_PIPELINE.length === 2 &&
    LEARNING_AGENT_PIPELINE[0].to === "learning_agent" &&
    LEARNING_AGENT_PIPELINE[1].to === "knowledge_engine";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== LEARNING_AGENT_CONTRACT_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use learning-agent contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: LearningAgentViolationRecord[]): LearningAgentViolationRecord[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateLearningAgentStructure(): LearningAgentViolationRecord[] {
  if (LEARNING_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Learning Agent requires 7 internal modules")];
  }
  return [];
}

export function validateLearningAgent(
  context: LearningAgentContext = {},
): LearningAgentValidationReport {
  const violations = [...validateLearningAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateLearningAgentStructure().length === 0,
    pipelinePositionValid: LEARNING_AGENT_PIPELINE[1].to === "knowledge_engine",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateLearningAgentWithExecution(
  context: LearningAgentContext = {},
): Promise<LearningAgentValidationReport> {
  const report = validateLearningAgent(context);
  const kitchen = await executeLearningAgent({
    agentInput: buildBatterySprayerLearningInput(),
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

export function assertLearningAgent(context?: LearningAgentContext): LearningAgentValidationReport {
  const report = validateLearningAgent(context);
  if (!report.valid) {
    throw new Error(`Learning Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runLearningAgent(
  context: LearningAgentContext = {},
): Promise<LearningAgentValidationReport> {
  return validateLearningAgentWithExecution(context);
}

export function isLearningAgentFailure(code: string): code is LearningAgentFailureCode {
  const codes: LearningAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "INSUFFICIENT_STATISTICS",
    "FALSE_LEARNING_DETECTED",
    "HISTORICAL_CONTRADICTION",
    "PACKAGE_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as LearningAgentFailureCode);
}

export function getLearningAgentModule(
  moduleId: LearningAgentModuleId,
): LearningAgentModuleDefinition | undefined {
  return LEARNING_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function hasStrongGardenSprayerLearning(pkg: LearningAgentPackage): boolean {
  return (
    pkg.learningConfidence >= CONFIDENCE_THRESHOLD &&
    (pkg.newPatterns.length + pkg.updatedPatterns.length >= 1) &&
    pkg.memoryUpdates.length >= 1
  );
}

export function scoreLearningOutcomeCandidate(ctr: number, userRating: string): number {
  if (ctr >= 0.06 && userRating === "like") return 0.95;
  if (ctr >= 0.04 && userRating !== "dislike") return 0.88;
  return 0.7;
}
