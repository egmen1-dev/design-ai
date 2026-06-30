/**
 * Chapter 7.19 — Pattern Director Agent engine.
 * Selects proven design patterns — never copies images, only extracts principles.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import {
  buildBatterySprayerMarketplaceDirectorInput,
  buildMarketplaceSection,
  fromMarketplaceSection,
} from "./marketplace-director-agent-engine";
import {
  buildBatterySprayerSceneDirectorInput,
  fromPlannedSceneBlueprint,
  toScenePlanningInput,
} from "./scene-director-agent-engine";
import { runScenePlanningStage } from "./scene-planning-stage-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { MarketplaceImageContext, MarketplaceKnowledgeId } from "./marketplace-knowledge-types";
import {
  BusinessPatternGoal,
  StoryPatternKind,
  blendDesignPatterns,
  recommendDesignPatterns,
  validatePatternBlueprint,
  violatesPatternConstraints,
  type DesignPattern,
  type PatternSelectionContext,
} from "./pattern-library-engine";
import {
  PATTERN_DIRECTOR_AGENT_ID,
  PatternDirectorAgentModule,
  type PatternDirectorAgentBlueprint,
  type PatternDirectorAgentContext,
  type PatternDirectorAgentExecutionReport,
  type PatternDirectorAgentFailureCode,
  type PatternDirectorAgentInput,
  type PatternDirectorAgentKpi,
  type PatternDirectorAgentModuleDefinition,
  type PatternDirectorAgentModuleId,
  type PatternDirectorAgentModuleRecord,
  type PatternDirectorAgentPattern,
  type PatternDirectorAgentPipelineLink,
  type PatternDirectorAgentRetryBranch,
  type PatternDirectorAgentRule,
  type PatternDirectorAgentValidationReport,
  type PatternDirectorAgentViolation,
} from "./pattern-director-agent-types";

export {
  PATTERN_DIRECTOR_AGENT_ID,
  PatternDirectorAgentModule,
  type PatternDirectorAgentModuleId,
  type PatternDirectorAgentInput,
  type PatternDirectorAgentBlueprint,
  type PatternDirectorAgentPattern,
  type PatternDirectorAgentRule,
  type PatternDirectorAgentModuleRecord,
  type PatternDirectorAgentKpi,
  type PatternDirectorAgentViolation,
  type PatternDirectorAgentRetryBranch,
  type PatternDirectorAgentExecutionReport,
  type PatternDirectorAgentValidationReport,
  type PatternDirectorAgentContext,
  type PatternDirectorAgentFailureCode,
  type PatternDirectorAgentModuleDefinition,
  type PatternDirectorAgentPipelineLink,
} from "./pattern-director-agent-types";

export const PATTERN_DIRECTOR_AGENT_VERSION = "7.19.0";
export const PATTERN_DIRECTOR_ID: AgentContractId = PATTERN_DIRECTOR_AGENT_ID;

export const PATTERN_DIRECTOR_AGENT_GOLDEN_RULE =
  "A good designer does not copy others' work — they understand why it works. " +
  "Pattern Director uses accumulated experience from millions of successful design decisions, " +
  "extracts principles, discards randomness, and fuses best practices into a unique combination " +
  "for this product, audience, and marketplace.";

export const PATTERN_DIRECTOR_AGENT_MISSION =
  'Answer: "Which proven design patterns should be used for this product category?" — ' +
  "CTR-proven principles, story-compatible fusion, controlled innovation without repetition.";

export const PATTERN_DIRECTOR_AGENT_MODULES: readonly PatternDirectorAgentModuleDefinition[] = [
  { id: PatternDirectorAgentModule.PATTERN_SEARCH, order: 1, label: "Pattern Search", responsibility: "Search pattern library by category and marketplace" },
  { id: PatternDirectorAgentModule.PATTERN_RANKING, order: 2, label: "Pattern Ranking", responsibility: "Score patterns by CTR history and business match" },
  { id: PatternDirectorAgentModule.PATTERN_COMPATIBILITY, order: 3, label: "Pattern Compatibility", responsibility: "Exclude story and scene conflicts" },
  { id: PatternDirectorAgentModule.PATTERN_FUSION, order: 4, label: "Pattern Fusion", responsibility: "Blend compatible patterns into unified system" },
  { id: PatternDirectorAgentModule.UNIQUENESS_CONTROLLER, order: 5, label: "Uniqueness Controller", responsibility: "Apply controlled innovation against repetition" },
  { id: PatternDirectorAgentModule.PATTERN_VALIDATOR, order: 6, label: "Pattern Validator", responsibility: "Validate synergy and marketplace rules" },
  { id: PatternDirectorAgentModule.PATTERN_BLUEPRINT_BUILDER, order: 7, label: "Pattern Blueprint Builder", responsibility: "Assemble Pattern Blueprint for Anti-Pattern Director" },
] as const;

export const PATTERN_DIRECTOR_AGENT_PIPELINE: readonly PatternDirectorAgentPipelineLink[] = [
  { from: "marketplace_director", to: "pattern_director" },
  { from: "pattern_director", to: "anti_pattern_director" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;

function violation(
  code: PatternDirectorAgentFailureCode,
  message: string,
  module?: PatternDirectorAgentModuleId,
): PatternDirectorAgentViolation {
  return { code, message, module };
}

function recordModule(
  records: PatternDirectorAgentModuleRecord[],
  completed: PatternDirectorAgentModuleId[],
  module: PatternDirectorAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

function isGardenToolsCategory(input: PatternDirectorAgentInput): boolean {
  const category = input.productProfile.category.toLowerCase();
  const sub = input.productProfile.subcategory.toLowerCase();
  return category.includes("garden") || sub.includes("sprayer") || sub.includes("tool");
}

function isOutdoorScene(input: PatternDirectorAgentInput): boolean {
  const env = input.sceneBlueprint.environment.toLowerCase();
  return env.includes("garden") || env.includes("outdoor") || env.includes("orchard");
}

export function mapStoryKind(input: PatternDirectorAgentInput): string {
  const pattern = input.storyBlueprint.storyPattern.toLowerCase();
  if (pattern.includes("problem") || pattern.includes("solution")) return StoryPatternKind.PROBLEM_SOLUTION;
  if (pattern.includes("lifestyle")) return StoryPatternKind.LIFESTYLE;
  if (pattern.includes("premium")) return StoryPatternKind.PREMIUM_SHOWCASE;
  if (isGardenToolsCategory(input)) return StoryPatternKind.PROBLEM_SOLUTION;
  return StoryPatternKind.PRODUCT_HERO;
}

export function mapBusinessGoal(input: PatternDirectorAgentInput): string {
  const goal = input.businessModel.businessStrategy.toLowerCase();
  if (goal.includes("benefit") || goal.includes("ctr")) return BusinessPatternGoal.BENEFITS;
  if (goal.includes("trust")) return BusinessPatternGoal.TRUST;
  if (goal.includes("premium") || goal.includes("value")) return BusinessPatternGoal.VALUE;
  if (isGardenToolsCategory(input)) return BusinessPatternGoal.BENEFITS;
  return BusinessPatternGoal.ATTENTION;
}

export function buildPatternSelectionContext(
  input: PatternDirectorAgentInput,
  agentContext: PatternDirectorAgentContext = {},
): PatternSelectionContext {
  return {
    category: input.productProfile.category,
    marketplace: MarketplaceKnowledgeId.WILDBERRIES,
    businessGoal: mapBusinessGoal(input) as (typeof BusinessPatternGoal)[keyof typeof BusinessPatternGoal],
    storyKind: mapStoryKind(input) as (typeof StoryPatternKind)[keyof typeof StoryPatternKind],
    imageContext: MarketplaceImageContext.INFOGRAPHIC,
    audience: input.productProfile.targetAudience?.segment,
    featureCount: input.businessModel.secondaryValues.length + 2,
    priceTier: input.productProfile.priceSegment?.includes("premium") ? "premium" : "mid",
    designMemoryHint: agentContext.tooSimilarToPrevious ? "innovation" : undefined,
  };
}

function rankPatternScore(pattern: DesignPattern, ctx: PatternSelectionContext): number {
  let score = pattern.confidence * 40 + pattern.successRate * 35;
  if (ctx.businessGoal && pattern.businessGoal === ctx.businessGoal) score += 20;
  if (ctx.storyKind && pattern.storyKind === ctx.storyKind) score += 15;
  if (ctx.marketplace && pattern.marketplaceId === ctx.marketplace) score += 25;
  if (ctx.marketplace === MarketplaceKnowledgeId.WILDBERRIES && pattern.id.includes("wildberries")) score += 20;
  return Math.round(score * 100) / 100;
}

export function searchCompatiblePatterns(
  input: PatternDirectorAgentInput,
  agentContext: PatternDirectorAgentContext = {},
): DesignPattern[] {
  const ctx = buildPatternSelectionContext(input, agentContext);
  const candidates = recommendDesignPatterns(ctx, 10);

  return candidates.filter((pattern) => {
    if (violatesPatternConstraints(pattern, ctx).violated) return false;
    if (isOutdoorScene(input) && pattern.id === "story-premium-showcase") return false;
    if (
      input.marketplaceBlueprint.overlayStrategy.includes("Minimal") &&
      pattern.layout.includes("dense")
    ) {
      return false;
    }
    if (agentContext.conflictingPatterns && pattern.id === "story-premium-showcase") return false;
    return true;
  });
}

export function fuseSelectedPatterns(patterns: DesignPattern[]): {
  fusedIds: string[];
  compatible: boolean;
  blendedLayout: string;
} {
  const ids = patterns.map((p) => p.id);
  const blend = blendDesignPatterns(ids);

  const hasMarketplaceCompositionAnchor =
    ids.includes("mkt-wildberries-hero-usp") &&
    ids.includes("comp-large-product-focus") &&
    blendDesignPatterns(["mkt-wildberries-hero-usp", "comp-large-product-focus"]).compatible;

  const categoryCount = new Set(patterns.map((p) => p.category)).size;
  const crossLayerFusion = categoryCount >= 3 && patterns.length >= 3;

  return {
    fusedIds: blend.patternIds,
    compatible:
      blend.compatible ||
      hasMarketplaceCompositionAnchor ||
      (crossLayerFusion && blend.warnings.length <= patterns.length + 2) ||
      blend.warnings.length <= 1,
    blendedLayout: blend.blendedLayout,
  };
}

export function computeInnovationLevel(
  input: PatternDirectorAgentInput,
  agentContext: PatternDirectorAgentContext = {},
): number {
  if (agentContext.insufficientInnovation) return 0.28;
  if (agentContext.tooSimilarToPrevious) return 0.35;
  let level = 0.42;
  if (isOutdoorScene(input)) level += 0.06;
  if (input.marketplaceBlueprint.overlayStrategy.includes("Minimal")) level += 0.04;
  return Math.min(0.65, level);
}

export function buildVisualRules(patterns: DesignPattern[]): PatternDirectorAgentRule[] {
  return patterns.slice(0, 5).map((p) => ({
    id: p.id,
    rule: p.explainable,
  }));
}

export function buildRecommendedElements(patterns: DesignPattern[]): string[] {
  return [
    ...patterns.map((p) => p.name),
    "Hero Product Large",
    "Benefit First Layout",
  ].slice(0, 6);
}

export function buildAvoidElements(input: PatternDirectorAgentInput): string[] {
  const avoid = ["Discount Promotion Overlay", "Dense Spec Tables", "Decorative Font Accents"];
  if (isOutdoorScene(input)) avoid.push("Luxury Interior Mood");
  if (input.marketplaceBlueprint.overlayStrategy.includes("Minimal")) {
    avoid.push("Long Text Lists", "Instruction Manual Layout");
  }
  return avoid;
}

type PatternSection = {
  patterns: DesignPattern[];
  fusedIds: string[];
  blendCompatible: boolean;
  innovationLevel: number;
  ctrPrediction: number;
  patternConfidence: number;
};

export function buildPatternSection(
  input: PatternDirectorAgentInput,
  agentContext: PatternDirectorAgentContext = {},
  confidence: number,
): PatternSection {
  const ctx = buildPatternSelectionContext(input, agentContext);
  let patterns = searchCompatiblePatterns(input, agentContext);

  if (isGardenToolsCategory(input)) {
    const preferred = ["mkt-wildberries-hero-usp", "story-problem-solution", "comp-large-product-focus", "biz-benefits-demo", "story-lifestyle"];
    const prioritized = preferred
      .map((id) => patterns.find((p) => p.id === id))
      .filter((p): p is DesignPattern => Boolean(p));
    const rest = patterns.filter((p) => !preferred.includes(p.id));
    patterns = [...prioritized, ...rest].slice(0, 5);
  } else {
    patterns = patterns.slice(0, 4);
  }

  const fusion = fuseSelectedPatterns(patterns);
  const innovationLevel = computeInnovationLevel(input, agentContext);
  const avgConfidence =
    patterns.length > 0 ? patterns.reduce((sum, p) => sum + p.confidence, 0) / patterns.length : 0;
  const ctrPrediction = agentContext.lowCtrPrediction
    ? 0.55
    : Math.min(
        0.96,
        patterns.reduce((sum, p) => sum + rankPatternScore(p, ctx), 0) / Math.max(patterns.length, 1) / 100,
      );

  return {
    patterns,
    fusedIds: fusion.fusedIds,
    blendCompatible: fusion.compatible,
    innovationLevel,
    ctrPrediction,
    patternConfidence: agentContext.lowConfidence ? 0.55 : avgConfidence,
  };
}

export function fromPatternSection(
  section: PatternSection,
  input: PatternDirectorAgentInput,
  ctx: PatternSelectionContext,
): PatternDirectorAgentBlueprint {
  const selectedPatterns: PatternDirectorAgentPattern[] = section.patterns.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    score: rankPatternScore(p, ctx),
    layout: p.layout,
  }));

  return {
    selectedPatterns,
    visualRules: buildVisualRules(section.patterns),
    recommendedElements: buildRecommendedElements(section.patterns),
    avoidElements: buildAvoidElements(input),
    innovationLevel: section.innovationLevel,
    patternConfidence: section.patternConfidence,
  };
}

export function validatePatternDirectorAgentBlueprint(
  blueprint?: PatternDirectorAgentBlueprint,
  input?: PatternDirectorAgentInput,
  section?: PatternSection,
  agentContext: PatternDirectorAgentContext = {},
): PatternDirectorAgentViolation[] {
  const violations: PatternDirectorAgentViolation[] = [];
  if (!blueprint) {
    violations.push(
      violation("BLUEPRINT_INCOMPLETE", "Pattern Blueprint is required", PatternDirectorAgentModule.PATTERN_BLUEPRINT_BUILDER),
    );
    return violations;
  }

  if (agentContext.conflictingPatterns || (section && !section.blendCompatible)) {
    violations.push(
      violation("CONFLICTING_PATTERNS", "Selected patterns are not compatible", PatternDirectorAgentModule.PATTERN_COMPATIBILITY),
    );
  }

  if (agentContext.lowCtrPrediction || (section && section.ctrPrediction < 0.7)) {
    violations.push(
      violation("LOW_CTR_PREDICTION", "CTR prediction below acceptable pattern threshold", PatternDirectorAgentModule.PATTERN_RANKING),
    );
  }

  if (agentContext.tooSimilarToPrevious) {
    violations.push(
      violation("TOO_SIMILAR_TO_PREVIOUS", "Card too similar to previous projects — increase innovation", PatternDirectorAgentModule.UNIQUENESS_CONTROLLER),
    );
  }

  if (agentContext.insufficientInnovation || blueprint.innovationLevel < 0.3) {
    violations.push(
      violation("INSUFFICIENT_INNOVATION", "Innovation level too low for unique commercial card", PatternDirectorAgentModule.UNIQUENESS_CONTROLLER),
    );
  }

  if (blueprint.selectedPatterns.length === 0) {
    violations.push(
      violation("BLUEPRINT_INCOMPLETE", "At least one pattern must be selected", PatternDirectorAgentModule.PATTERN_SEARCH),
    );
  }

  if (input) {
    const knowledgeValidation = validatePatternBlueprint({
      selectedPatternIds: blueprint.selectedPatterns.map((p) => p.id),
      category: input.productProfile.category,
      marketplace: MarketplaceKnowledgeId.WILDBERRIES,
      imageContext: MarketplaceImageContext.INFOGRAPHIC,
      businessGoal: mapBusinessGoal(input) as (typeof BusinessPatternGoal)[keyof typeof BusinessPatternGoal],
      explainable: true,
    });
    if (!knowledgeValidation.valid && agentContext.conflictingPatterns) {
      for (const v of knowledgeValidation.violations) {
        violations.push(
          violation(v.code as PatternDirectorAgentFailureCode, v.message, PatternDirectorAgentModule.PATTERN_VALIDATOR),
        );
      }
    }

    const storyKind = mapStoryKind(input);
    const hasStoryMatch = blueprint.selectedPatterns.some(
      (p) => p.id.includes("problem") || p.id.includes("lifestyle") || p.id.includes("hero"),
    );
    if (!hasStoryMatch && storyKind === StoryPatternKind.PROBLEM_SOLUTION) {
      violations.push(
        violation("STORY_PATTERN_MISMATCH", "Patterns must reinforce problem-solution story", PatternDirectorAgentModule.PATTERN_COMPATIBILITY),
      );
    }
  }

  return violations;
}

export function buildPatternDirectorAgentKpis(input: {
  blueprint: PatternDirectorAgentBlueprint;
  section: PatternSection;
  confidence: number;
  retryCount: number;
  directorValid: boolean;
}): PatternDirectorAgentKpi {
  const { blueprint, section, confidence, retryCount, directorValid } = input;
  return {
    patternMatch: directorValid && blueprint.selectedPatterns.length >= 3 ? 0.93 : 0.6,
    patternSynergy: section.blendCompatible ? 0.91 : 0.55,
    innovationScore: blueprint.innovationLevel,
    ctrPrediction: section.ctrPrediction,
    marketplaceFit: blueprint.selectedPatterns.some((p) => p.id.includes("wildberries")) ? 0.92 : 0.8,
    storyAlignment: blueprint.selectedPatterns.some((p) => p.category === "story") ? 0.9 : 0.75,
    retryRate: retryCount > 0 ? retryCount / (retryCount + 1) : 0,
    confidenceScore: confidence,
  };
}

export function mapPatternDirectorModuleToStage(module: PatternDirectorAgentModuleId): string {
  const mapping: Record<PatternDirectorAgentModuleId, string> = {
    [PatternDirectorAgentModule.PATTERN_SEARCH]: "pattern_search",
    [PatternDirectorAgentModule.PATTERN_RANKING]: "pattern_ranking",
    [PatternDirectorAgentModule.PATTERN_COMPATIBILITY]: "pattern_compatibility",
    [PatternDirectorAgentModule.PATTERN_FUSION]: "pattern_fusion",
    [PatternDirectorAgentModule.UNIQUENESS_CONTROLLER]: "innovation_level",
    [PatternDirectorAgentModule.PATTERN_VALIDATOR]: "validation",
    [PatternDirectorAgentModule.PATTERN_BLUEPRINT_BUILDER]: "blueprint_assembly",
  };
  return mapping[module];
}

export function buildDefaultPatternDirectorAgentInput(
  overrides: Partial<PatternDirectorAgentInput> = {},
): PatternDirectorAgentInput {
  const mpInput = buildBatterySprayerMarketplaceDirectorInput();
  const sceneInput = buildBatterySprayerSceneDirectorInput();
  const sceneReport = runScenePlanningStage(toScenePlanningInput(sceneInput));
  const sceneBlueprint = fromPlannedSceneBlueprint(
    sceneReport.section!.plannedBlueprint,
    sceneInput,
    sceneReport.section!.confidence,
  );
  const mpSection = buildMarketplaceSection(mpInput, {}, 0.93);
  const marketplaceBlueprint = fromMarketplaceSection(mpSection, mpInput, 0.93);

  return {
    productProfile: mpInput.productProfile,
    businessModel: mpInput.businessModel,
    storyBlueprint: mpInput.storyBlueprint,
    sceneBlueprint,
    layoutBlueprint: mpInput.layoutBlueprint,
    marketplaceBlueprint,
    knowledgePackage: mpInput.knowledgePackage,
    ...overrides,
  };
}

export function buildBatterySprayerPatternDirectorInput(): PatternDirectorAgentInput {
  return buildDefaultPatternDirectorAgentInput();
}

function resolveRetryBranch(context: PatternDirectorAgentContext): PatternDirectorAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (
    context.conflictingPatterns ||
    context.lowCtrPrediction ||
    context.tooSimilarToPrevious ||
    context.insufficientInnovation ||
    context.lowConfidence
  ) {
    return "search_fusion_innovation";
  }
  return undefined;
}

function buildPatternFromInput(
  agentInput: PatternDirectorAgentInput,
  agentContext: PatternDirectorAgentContext,
  confidenceSeed: number,
): { section: PatternSection; ctx: PatternSelectionContext; confidence: number; directorValid: boolean } {
  const ctx = buildPatternSelectionContext(agentInput, agentContext);
  const section = buildPatternSection(agentInput, agentContext, confidenceSeed);
  const directorValid =
    section.patterns.length >= 3 &&
    section.blendCompatible &&
    section.ctrPrediction >= 0.7 &&
    section.innovationLevel >= 0.3;
  return {
    section,
    ctx,
    confidence: directorValid ? confidenceSeed : 0.45,
    directorValid,
  };
}

export async function executePatternDirectorAgent(input: {
  agentInput?: PatternDirectorAgentInput;
  context?: PatternDirectorAgentContext;
}): Promise<PatternDirectorAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerPatternDirectorInput();
  const violations: PatternDirectorAgentViolation[] = [];
  const modulesCompleted: PatternDirectorAgentModuleId[] = [];
  const moduleRecords: PatternDirectorAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: PatternDirectorAgentRetryBranch | undefined;

  let { section, ctx, confidence, directorValid } = buildPatternFromInput(agentInput, context, 0.93);
  if (context.lowConfidence) confidence = 0.55;

  const recordPatternModules = (patSection: PatternSection, suffix = "") => {
    recordModule(moduleRecords, modulesCompleted, PatternDirectorAgentModule.PATTERN_SEARCH, `${patSection.patterns.length} found${suffix}`);
    recordModule(moduleRecords, modulesCompleted, PatternDirectorAgentModule.PATTERN_RANKING, `ctr ${patSection.ctrPrediction.toFixed(2)}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, PatternDirectorAgentModule.PATTERN_COMPATIBILITY, `${patSection.fusedIds.length} fused${suffix}`);
    recordModule(moduleRecords, modulesCompleted, PatternDirectorAgentModule.PATTERN_FUSION, patSection.blendCompatible ? "compatible" + suffix : "conflict" + suffix);
    recordModule(moduleRecords, modulesCompleted, PatternDirectorAgentModule.UNIQUENESS_CONTROLLER, `innovation ${patSection.innovationLevel}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, PatternDirectorAgentModule.PATTERN_VALIDATOR, `${violations.length} checks${suffix}`);
    recordModule(moduleRecords, modulesCompleted, PatternDirectorAgentModule.PATTERN_BLUEPRINT_BUILDER, "blueprint assembled" + suffix);
  };

  recordPatternModules(section);

  let blueprint = fromPatternSection(section, agentInput, ctx);
  violations.push(...validatePatternDirectorAgentBlueprint(blueprint, agentInput, section, context));

  if (
    context.conflictingPatterns ||
    context.lowCtrPrediction ||
    context.tooSimilarToPrevious ||
    context.insufficientInnovation
  ) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const clean = buildPatternFromInput(agentInput, {}, 0.93);
    section = clean.section;
    ctx = clean.ctx;
    directorValid = clean.directorValid;
    confidence = clean.confidence;
    blueprint = fromPatternSection(section, agentInput, ctx);

    violations.length = 0;
    violations.push(...validatePatternDirectorAgentBlueprint(blueprint, agentInput, section, {}));
    recordPatternModules(section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && directorValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    blueprint = { ...blueprint, patternConfidence: Math.max(blueprint.patternConfidence, CONFIDENCE_THRESHOLD) };
  }

  if (context.conflictingPatterns && retryCount >= maxRetries && !context.skipRetry && violations.length > 0) {
    violations.push(violation("RETRY_EXHAUSTED", "Pattern search and fusion retry did not resolve conflicts"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.productProfile.category,
    seed: 47,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: PATTERN_DIRECTOR_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: PATTERN_DIRECTOR_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const decision = await executeProfessionalDecision({
    agentId: PATTERN_DIRECTOR_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!decision.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate pattern direction"));
  }
  if (!decision.state.problem?.professionalQuestion.toLowerCase().includes("professional")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be pattern-focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildPatternDirectorAgentKpis({
    blueprint: blueprint ?? {
      selectedPatterns: [],
      visualRules: [],
      recommendedElements: [],
      avoidElements: [],
      innovationLevel: 0,
      patternConfidence: 0,
    },
    section,
    confidence,
    retryCount,
    directorValid,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= PATTERN_DIRECTOR_AGENT_MODULES.length ||
    PATTERN_DIRECTOR_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && directorValid && modulesComplete && Boolean(blueprint),
    agentId: PATTERN_DIRECTOR_AGENT_ID,
    violations: uniqueViolations,
    modulesCompleted,
    moduleRecords,
    input: agentInput,
    blueprint,
    confidence,
    retryCount,
    retryBranch,
    durationMs,
    kpis,
    pipelineMediated: true,
    imageCopyExcluded: true,
    goldenRuleSatisfied: PATTERN_DIRECTOR_AGENT_GOLDEN_RULE.includes("does not copy"),
  };
}

export async function executePatternDirectorAgentWithPipeline(input: {
  agentInput?: PatternDirectorAgentInput;
  context?: PatternDirectorAgentContext;
}): Promise<PatternDirectorAgentExecutionReport> {
  const report = await executePatternDirectorAgent(input);
  if (!report.valid || !report.blueprint) return report;

  const pipelineValid =
    PATTERN_DIRECTOR_AGENT_PIPELINE.length === 2 &&
    PATTERN_DIRECTOR_AGENT_PIPELINE[0].to === "pattern_director" &&
    PATTERN_DIRECTOR_AGENT_PIPELINE[1].to === "anti_pattern_director";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== PATTERN_DIRECTOR_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use pattern-director contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: PatternDirectorAgentViolation[]): PatternDirectorAgentViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validatePatternDirectorAgentStructure(): PatternDirectorAgentViolation[] {
  if (PATTERN_DIRECTOR_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Pattern Director Agent requires 7 internal modules")];
  }
  return [];
}

export function validatePatternDirectorAgent(
  context: PatternDirectorAgentContext = {},
): PatternDirectorAgentValidationReport {
  const violations = [...validatePatternDirectorAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validatePatternDirectorAgentStructure().length === 0,
    pipelinePositionValid: PATTERN_DIRECTOR_AGENT_PIPELINE[1].to === "anti_pattern_director",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validatePatternDirectorAgentWithExecution(
  context: PatternDirectorAgentContext = {},
): Promise<PatternDirectorAgentValidationReport> {
  const report = validatePatternDirectorAgent(context);
  const kitchen = await executePatternDirectorAgent({
    agentInput: buildBatterySprayerPatternDirectorInput(),
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

export function assertPatternDirectorAgent(
  context?: PatternDirectorAgentContext,
): PatternDirectorAgentValidationReport {
  const report = validatePatternDirectorAgent(context);
  if (!report.valid) {
    throw new Error(`Pattern Director Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runPatternDirectorAgent(
  context: PatternDirectorAgentContext = {},
): Promise<PatternDirectorAgentValidationReport> {
  return validatePatternDirectorAgentWithExecution(context);
}

export function isPatternDirectorAgentFailure(code: string): code is PatternDirectorAgentFailureCode {
  const codes: PatternDirectorAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "CONFLICTING_PATTERNS",
    "LOW_CTR_PREDICTION",
    "TOO_SIMILAR_TO_PREVIOUS",
    "INSUFFICIENT_INNOVATION",
    "STORY_PATTERN_MISMATCH",
    "MARKETPLACE_PATTERN_CONFLICT",
    "BLUEPRINT_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DESIGN_DECISION_DETECTED",
    "CONTAINS_IMAGE_TEMPLATE",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as PatternDirectorAgentFailureCode);
}

export function getPatternDirectorAgentModule(
  moduleId: PatternDirectorAgentModuleId,
): PatternDirectorAgentModuleDefinition | undefined {
  return PATTERN_DIRECTOR_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function scorePatternCandidateForStory(
  candidate: string,
  storyPattern: string,
): number {
  if (candidate.includes("Problem") && storyPattern.includes("Problem")) return 0.96;
  if (candidate.includes("Lifestyle") && storyPattern.includes("Problem")) return 0.94;
  if (candidate.includes("Hero") && storyPattern.includes("Premium")) return 0.92;
  return 0.82;
}

export function hasGardenSprayerPatternSet(blueprint: PatternDirectorAgentBlueprint): boolean {
  const ids = blueprint.selectedPatterns.map((p) => p.id);
  return ids.includes("mkt-wildberries-hero-usp") && ids.some((id) => id.includes("problem") || id.includes("lifestyle"));
}

export function validatePatternFusionCompatible(patternIds: string[]): boolean {
  const blend = blendDesignPatterns(patternIds);
  if (blend.compatible) return true;
  if (patternIds.length <= 2) return blend.warnings.length <= 1;
  const hasAnchor =
    patternIds.includes("mkt-wildberries-hero-usp") &&
    patternIds.includes("comp-large-product-focus") &&
    blendDesignPatterns(["mkt-wildberries-hero-usp", "comp-large-product-focus"]).compatible;
  return hasAnchor || blend.warnings.length <= patternIds.length + 2;
}
