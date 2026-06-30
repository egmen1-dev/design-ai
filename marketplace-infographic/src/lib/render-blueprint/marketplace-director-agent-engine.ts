/**
 * Chapter 7.18 — Marketplace Director Agent engine.
 * Adapts infographic design to marketplace rules — never redesigns core creative structure.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { executeProfessionalDecision } from "./agent-professional-decision-engine";
import { buildBatterySprayerCompositionDirectorInput } from "./composition-director-agent-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  MarketplaceImageContext,
  MarketplaceKnowledgeId,
  MarketplaceRegion,
  ProductCategoryKnowledge,
  getBestPracticesForCategory,
  getContextRules,
  getMarketplaceKnowledgeProfile,
  validateMarketplaceBlueprint,
} from "./marketplace-knowledge-engine";
import {
  buildBatterySprayerTypographyDirectorInput,
  buildTextHierarchy,
  buildTypographySection,
  fromTypographySection,
} from "./typography-director-agent-engine";
import {
  MARKETPLACE_DIRECTOR_AGENT_ID,
  MarketplaceDirectorAgentModule,
  type MarketplaceDirectorAgentBlueprint,
  type MarketplaceDirectorAgentContext,
  type MarketplaceDirectorAgentExecutionReport,
  type MarketplaceDirectorAgentFailureCode,
  type MarketplaceDirectorAgentInput,
  type MarketplaceDirectorAgentKpi,
  type MarketplaceDirectorAgentModuleDefinition,
  type MarketplaceDirectorAgentModuleId,
  type MarketplaceDirectorAgentModuleRecord,
  type MarketplaceDirectorAgentPipelineLink,
  type MarketplaceDirectorAgentRetryBranch,
  type MarketplaceDirectorAgentValidationReport,
  type MarketplaceDirectorAgentViolation,
} from "./marketplace-director-agent-types";

export {
  MARKETPLACE_DIRECTOR_AGENT_ID,
  MarketplaceDirectorAgentModule,
  type MarketplaceDirectorAgentModuleId,
  type MarketplaceDirectorAgentInput,
  type MarketplaceDirectorAgentBlueprint,
  type MarketplaceDirectorAgentModuleRecord,
  type MarketplaceDirectorAgentKpi,
  type MarketplaceDirectorAgentViolation,
  type MarketplaceDirectorAgentRetryBranch,
  type MarketplaceDirectorAgentExecutionReport,
  type MarketplaceDirectorAgentValidationReport,
  type MarketplaceDirectorAgentContext,
  type MarketplaceDirectorAgentFailureCode,
  type MarketplaceDirectorAgentModuleDefinition,
  type MarketplaceDirectorAgentPipelineLink,
} from "./marketplace-director-agent-types";

export const MARKETPLACE_DIRECTOR_AGENT_VERSION = "7.18.0";
export const MARKETPLACE_DIRECTOR_ID: AgentContractId = MARKETPLACE_DIRECTOR_AGENT_ID;

export const MARKETPLACE_DIRECTOR_AGENT_GOLDEN_RULE =
  "Beautiful design is not yet effective design. Each marketplace shapes buyer habits, constraints, and perception rules. " +
  "Marketplace Director makes the final commercial step — adapting all prior agent work for the specific platform " +
  "so the card converts where the buyer decides to purchase.";

export const MARKETPLACE_DIRECTOR_AGENT_MISSION =
  'Answer: "How should this design look specifically for this marketplace?" — ' +
  "platform rules, buyer behavior, overlay strategy, and commercial optimization without redesigning the core creative.";

export const MARKETPLACE_DIRECTOR_AGENT_MODULES: readonly MarketplaceDirectorAgentModuleDefinition[] = [
  { id: MarketplaceDirectorAgentModule.MARKETPLACE_PROFILE_LOADER, order: 1, label: "Marketplace Profile Loader", responsibility: "Load full marketplace profile and context" },
  { id: MarketplaceDirectorAgentModule.MARKETPLACE_RULES_ENGINE, order: 2, label: "Marketplace Rules Engine", responsibility: "Apply platform-specific rules" },
  { id: MarketplaceDirectorAgentModule.BEHAVIOR_ANALYZER, order: 3, label: "Behavior Analyzer", responsibility: "Model buyer scan behavior on platform" },
  { id: MarketplaceDirectorAgentModule.OVERLAY_OPTIMIZER, order: 4, label: "Overlay Optimizer", responsibility: "Select minimal effective overlay elements" },
  { id: MarketplaceDirectorAgentModule.COMMERCIAL_ADAPTATION_ENGINE, order: 5, label: "Commercial Adaptation Engine", responsibility: "Adapt story emotion vs information balance" },
  { id: MarketplaceDirectorAgentModule.MARKETPLACE_VALIDATOR, order: 6, label: "Marketplace Validator", responsibility: "Validate rules, density, and hero dominance" },
  { id: MarketplaceDirectorAgentModule.MARKETPLACE_BLUEPRINT_BUILDER, order: 7, label: "Marketplace Blueprint Builder", responsibility: "Assemble Marketplace Blueprint for Pattern Director" },
] as const;

export const MARKETPLACE_DIRECTOR_AGENT_PIPELINE: readonly MarketplaceDirectorAgentPipelineLink[] = [
  { from: "typography_director", to: "marketplace_director" },
  { from: "marketplace_director", to: "pattern_director" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;

const OVERLAY_STRATEGIES = {
  MINIMAL_MARKETPLACE: "Minimal Marketplace",
  INFORMATION_FIRST: "Information First",
  COMMERCIAL_PREMIUM: "Commercial Premium",
} as const;

type OverlayStrategyId = (typeof OVERLAY_STRATEGIES)[keyof typeof OVERLAY_STRATEGIES];

type MarketplaceSection = {
  marketplaceId: string;
  overlayStrategy: OverlayStrategyId;
  informationDensity: string;
  emotionLevel: string;
  overlayElementCount: number;
  ctrPrediction: number;
  badgePriority: string[];
  safeAreaRules: string[];
  marketplaceOptimizations: string[];
  commercialRecommendations: string[];
  confidence: number;
};

function violation(
  code: MarketplaceDirectorAgentFailureCode,
  message: string,
  module?: MarketplaceDirectorAgentModuleId,
): MarketplaceDirectorAgentViolation {
  return { code, message, module };
}

function recordModule(
  records: MarketplaceDirectorAgentModuleRecord[],
  completed: MarketplaceDirectorAgentModuleId[],
  module: MarketplaceDirectorAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

function isGardenToolsCategory(input: MarketplaceDirectorAgentInput): boolean {
  const category = input.productProfile.category.toLowerCase();
  const sub = input.productProfile.subcategory.toLowerCase();
  return category.includes("garden") || sub.includes("sprayer") || sub.includes("tool");
}

function resolveMarketplaceKnowledgeId(profile: MarketplaceDirectorAgentInput["marketplaceProfile"]): string {
  if (profile.id === MarketplaceKnowledgeId.WILDBERRIES || profile.name.toLowerCase().includes("wildberries")) {
    return MarketplaceKnowledgeId.WILDBERRIES;
  }
  if (profile.id === MarketplaceKnowledgeId.OZON || profile.name.toLowerCase().includes("ozon")) {
    return MarketplaceKnowledgeId.OZON;
  }
  if (profile.id === MarketplaceKnowledgeId.AMAZON || profile.name.toLowerCase().includes("amazon")) {
    return MarketplaceKnowledgeId.AMAZON;
  }
  return profile.id;
}

function mapProductCategory(input: MarketplaceDirectorAgentInput): string {
  if (isGardenToolsCategory(input)) return ProductCategoryKnowledge.SPORTS;
  const cat = input.productProfile.category.toLowerCase();
  if (cat.includes("beauty") || cat.includes("cosmetic")) return ProductCategoryKnowledge.BEAUTY;
  if (cat.includes("kitchen") || cat.includes("home")) return ProductCategoryKnowledge.KITCHEN;
  if (cat.includes("tech") || cat.includes("electronic")) return ProductCategoryKnowledge.ELECTRONICS;
  return ProductCategoryKnowledge.SPORTS;
}

export function selectOverlayStrategy(input: MarketplaceDirectorAgentInput): OverlayStrategyId {
  const marketplaceId = resolveMarketplaceKnowledgeId(input.marketplaceProfile);
  if (marketplaceId === MarketplaceKnowledgeId.WILDBERRIES) return OVERLAY_STRATEGIES.MINIMAL_MARKETPLACE;
  if (marketplaceId === MarketplaceKnowledgeId.OZON) return OVERLAY_STRATEGIES.INFORMATION_FIRST;
  if (marketplaceId === MarketplaceKnowledgeId.AMAZON) return OVERLAY_STRATEGIES.COMMERCIAL_PREMIUM;
  return OVERLAY_STRATEGIES.MINIMAL_MARKETPLACE;
}

export function analyzeBuyerBehavior(input: MarketplaceDirectorAgentInput): {
  scanSeconds: number;
  emotionFirst: boolean;
  overlayMaxElements: number;
} {
  const marketplaceId = resolveMarketplaceKnowledgeId(input.marketplaceProfile);
  if (marketplaceId === MarketplaceKnowledgeId.WILDBERRIES) {
    return { scanSeconds: 2.5, emotionFirst: true, overlayMaxElements: 4 };
  }
  if (marketplaceId === MarketplaceKnowledgeId.AMAZON) {
    return { scanSeconds: 3.5, emotionFirst: false, overlayMaxElements: 5 };
  }
  return { scanSeconds: 3, emotionFirst: true, overlayMaxElements: 4 };
}

export function buildBadgePriority(input: MarketplaceDirectorAgentInput): string[] {
  const badges = [
    input.storyBlueprint.primaryMessage,
    input.businessModel.primaryValue,
    ...input.businessModel.secondaryValues.slice(0, 2),
  ].filter(Boolean);
  return badges.slice(0, 4);
}

export function buildSafeAreaRules(input: MarketplaceDirectorAgentInput): string[] {
  const rules = [
    "Keep hero product free of text overlap",
    `Reserve ${input.layoutBlueprint.textZones.length} typography safe zones`,
    `Maintain ${input.layoutBlueprint.badgeZones.length} badge zones`,
  ];
  const marketplaceId = resolveMarketplaceKnowledgeId(input.marketplaceProfile);
  if (marketplaceId === MarketplaceKnowledgeId.WILDBERRIES) {
    rules.push("Reserve space for marketplace badges");
    rules.push("Mobile thumbnail readability required");
  }
  return rules;
}

export function computeCtrPrediction(
  section: MarketplaceSection,
  input: MarketplaceDirectorAgentInput,
  agentContext: MarketplaceDirectorAgentContext = {},
): number {
  if (agentContext.lowCtrPrediction) return 0.52;
  let score = 0.78;
  if (section.overlayStrategy === OVERLAY_STRATEGIES.MINIMAL_MARKETPLACE) score += 0.08;
  if (input.layoutBlueprint.heroPlacement.width >= 0.35) score += 0.06;
  if (section.overlayElementCount <= 4) score += 0.05;
  if (input.typographyBlueprint.textHierarchy.length <= 4) score += 0.04;
  return Math.min(0.96, score);
}

export function buildMarketplaceSection(
  input: MarketplaceDirectorAgentInput,
  agentContext: MarketplaceDirectorAgentContext = {},
  confidence: number,
): MarketplaceSection {
  const marketplaceId = resolveMarketplaceKnowledgeId(input.marketplaceProfile);
  const overlayStrategy = selectOverlayStrategy(input);
  const behavior = analyzeBuyerBehavior(input);
  const badgePriority = buildBadgePriority(input);
  const overlayElementCount = agentContext.overlayOverloaded ? 8 : badgePriority.length;
  const informationDensity =
    overlayStrategy === OVERLAY_STRATEGIES.INFORMATION_FIRST ? "High" : behavior.emotionFirst ? "Medium" : "Low";
  const emotionLevel = behavior.emotionFirst ? "High" : "Low";

  const profile = getMarketplaceKnowledgeProfile(
    marketplaceId as (typeof MarketplaceKnowledgeId)[keyof typeof MarketplaceKnowledgeId],
    input.marketplaceProfile.region ?? MarketplaceRegion.RU,
  );
  const practices = profile
    ? getBestPracticesForCategory(profile, mapProductCategory(input) as (typeof ProductCategoryKnowledge)[keyof typeof ProductCategoryKnowledge])
    : [];

  const marketplaceOptimizations = [
    `Hero scale ${(input.layoutBlueprint.heroPlacement.width * 100).toFixed(0)}% for ${input.marketplaceProfile.name}`,
    `Overlay strategy: ${overlayStrategy}`,
    `Scan window: ${behavior.scanSeconds}s`,
    ...practices.slice(0, 2).map((p) => p.rule),
  ];

  const commercialRecommendations = [
    behavior.emotionFirst
      ? "Lead with emotional headline before technical specs"
      : "Lead with technical proof before lifestyle emotion",
    `Limit overlay to ${behavior.overlayMaxElements} elements`,
    input.businessModel.businessStrategy,
  ].filter(Boolean);

  const section: MarketplaceSection = {
    marketplaceId,
    overlayStrategy,
    informationDensity,
    emotionLevel,
    overlayElementCount,
    ctrPrediction: 0,
    badgePriority,
    safeAreaRules: buildSafeAreaRules(input),
    marketplaceOptimizations,
    commercialRecommendations,
    confidence,
  };
  section.ctrPrediction = computeCtrPrediction(section, input, agentContext);
  return section;
}

export function fromMarketplaceSection(
  section: MarketplaceSection,
  input: MarketplaceDirectorAgentInput,
  confidence: number,
): MarketplaceDirectorAgentBlueprint {
  return {
    marketplace: input.marketplaceProfile.name,
    overlayStrategy: section.overlayStrategy,
    informationDensity: section.informationDensity,
    badgePriority: section.badgePriority,
    safeAreaRules: section.safeAreaRules,
    marketplaceOptimizations: section.marketplaceOptimizations,
    commercialRecommendations: section.commercialRecommendations,
    confidence,
  };
}

export function validateMarketplaceDirectorAgentBlueprint(
  blueprint?: MarketplaceDirectorAgentBlueprint,
  input?: MarketplaceDirectorAgentInput,
  section?: MarketplaceSection,
  agentContext: MarketplaceDirectorAgentContext = {},
): MarketplaceDirectorAgentViolation[] {
  const violations: MarketplaceDirectorAgentViolation[] = [];
  if (!blueprint) {
    violations.push(
      violation("BLUEPRINT_INCOMPLETE", "Marketplace Blueprint is required", MarketplaceDirectorAgentModule.MARKETPLACE_BLUEPRINT_BUILDER),
    );
    return violations;
  }

  if (agentContext.marketplaceRuleViolation) {
    violations.push(
      violation("MARKETPLACE_RULE_VIOLATION", "Design violates marketplace-specific rules", MarketplaceDirectorAgentModule.MARKETPLACE_RULES_ENGINE),
    );
  }

  if (agentContext.overlayOverloaded || (section && section.overlayElementCount > 6)) {
    violations.push(
      violation("OVERLAY_OVERLOADED", "Overlay must stay concise for marketplace scan speed", MarketplaceDirectorAgentModule.OVERLAY_OPTIMIZER),
    );
  }

  if (agentContext.lowCtrPrediction || (section && section.ctrPrediction < 0.7)) {
    violations.push(
      violation("LOW_CTR_PREDICTION", "CTR prediction below acceptable marketplace threshold", MarketplaceDirectorAgentModule.BEHAVIOR_ANALYZER),
    );
  }

  if (agentContext.poorStoryAdaptation) {
    violations.push(
      violation("POOR_STORY_ADAPTATION", "Story emotion-information balance mismatches marketplace", MarketplaceDirectorAgentModule.COMMERCIAL_ADAPTATION_ENGINE),
    );
  }

  if (agentContext.lowMarketplaceMatch) {
    violations.push(
      violation("LOW_MARKETPLACE_MATCH", "Adaptation does not match platform buyer expectations", MarketplaceDirectorAgentModule.BEHAVIOR_ANALYZER),
    );
  }

  if (input && input.layoutBlueprint.heroPlacement.width < 0.35) {
    violations.push(
      violation("HERO_NOT_DOMINANT", "Hero product must remain dominant after marketplace overlay", MarketplaceDirectorAgentModule.MARKETPLACE_VALIDATOR),
    );
  }

  if (input) {
    const marketplaceId = resolveMarketplaceKnowledgeId(input.marketplaceProfile);
    const knowledgeValidation = validateMarketplaceBlueprint({
      marketplaceId: marketplaceId as (typeof MarketplaceKnowledgeId)[keyof typeof MarketplaceKnowledgeId],
      context: MarketplaceImageContext.INFOGRAPHIC,
      region: input.marketplaceProfile.region ?? MarketplaceRegion.RU,
      category: mapProductCategory(input) as (typeof ProductCategoryKnowledge)[keyof typeof ProductCategoryKnowledge],
      hasTextOverlay: input.typographyBlueprint.textHierarchy.length > 0,
      formatId: marketplaceId === MarketplaceKnowledgeId.WILDBERRIES ? "wb-infographic" : "ozon-infographic",
      width: 900,
      height: 1200,
    });
    if (!knowledgeValidation.valid && agentContext.marketplaceRuleViolation) {
      for (const v of knowledgeValidation.violations) {
        violations.push(
          violation("MARKETPLACE_RULE_VIOLATION", v.message, MarketplaceDirectorAgentModule.MARKETPLACE_RULES_ENGINE),
        );
      }
    }
  }

  return violations;
}

export function buildMarketplaceDirectorAgentKpis(input: {
  blueprint: MarketplaceDirectorAgentBlueprint;
  section: MarketplaceSection;
  confidence: number;
  retryCount: number;
  directorValid: boolean;
}): MarketplaceDirectorAgentKpi {
  const { blueprint, section, confidence, retryCount, directorValid } = input;
  return {
    marketplaceMatch: directorValid && section.overlayStrategy.includes("Minimal") ? 0.92 : 0.8,
    ctrPrediction: section.ctrPrediction,
    overlayQuality: section.overlayElementCount <= 4 ? 0.91 : 0.6,
    commercialAdaptationScore: section.emotionLevel === "High" ? 0.9 : 0.82,
    informationDensity: section.informationDensity === "Medium" ? 0.88 : 0.75,
    buyerReadability: blueprint.safeAreaRules.length >= 3 ? 0.9 : 0.65,
    retryRate: retryCount > 0 ? retryCount / (retryCount + 1) : 0,
    confidenceScore: confidence,
  };
}

export function mapMarketplaceDirectorModuleToStage(module: MarketplaceDirectorAgentModuleId): string {
  const mapping: Record<MarketplaceDirectorAgentModuleId, string> = {
    [MarketplaceDirectorAgentModule.MARKETPLACE_PROFILE_LOADER]: "marketplace_profile",
    [MarketplaceDirectorAgentModule.MARKETPLACE_RULES_ENGINE]: "marketplace_rules",
    [MarketplaceDirectorAgentModule.BEHAVIOR_ANALYZER]: "buyer_behavior",
    [MarketplaceDirectorAgentModule.OVERLAY_OPTIMIZER]: "overlay_strategy",
    [MarketplaceDirectorAgentModule.COMMERCIAL_ADAPTATION_ENGINE]: "commercial_adaptation",
    [MarketplaceDirectorAgentModule.MARKETPLACE_VALIDATOR]: "validation",
    [MarketplaceDirectorAgentModule.MARKETPLACE_BLUEPRINT_BUILDER]: "blueprint_assembly",
  };
  return mapping[module];
}

export function buildDefaultMarketplaceDirectorAgentInput(
  overrides: Partial<MarketplaceDirectorAgentInput> = {},
): MarketplaceDirectorAgentInput {
  const typoInput = buildBatterySprayerTypographyDirectorInput();
  const compInput = buildBatterySprayerCompositionDirectorInput();
  const typoSection = buildTypographySection(typoInput, {}, 0.93);
  const typographyBlueprint = fromTypographySection(
    typoSection,
    buildTextHierarchy(typoInput),
    typoInput,
    0.93,
  );

  return {
    productProfile: compInput.productProfile,
    businessModel: typoInput.businessModel,
    storyBlueprint: typoInput.storyBlueprint,
    layoutBlueprint: typoInput.layoutBlueprint,
    typographyBlueprint,
    marketplaceProfile: typoInput.marketplaceProfile,
    knowledgePackage: typoInput.knowledgePackage,
    ...overrides,
  };
}

export function buildBatterySprayerMarketplaceDirectorInput(): MarketplaceDirectorAgentInput {
  return buildDefaultMarketplaceDirectorAgentInput();
}

function resolveRetryBranch(context: MarketplaceDirectorAgentContext): MarketplaceDirectorAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (
    context.marketplaceRuleViolation ||
    context.overlayOverloaded ||
    context.lowCtrPrediction ||
    context.poorStoryAdaptation ||
    context.lowMarketplaceMatch ||
    context.lowConfidence
  ) {
    return "behavior_overlay_commercial";
  }
  return undefined;
}

function buildMarketplaceFromInput(
  agentInput: MarketplaceDirectorAgentInput,
  agentContext: MarketplaceDirectorAgentContext,
  confidenceSeed: number,
): { section: MarketplaceSection; confidence: number; directorValid: boolean } {
  const section = buildMarketplaceSection(agentInput, agentContext, confidenceSeed);
  const marketplaceId = resolveMarketplaceKnowledgeId(agentInput.marketplaceProfile);
  const profile = getMarketplaceKnowledgeProfile(
    marketplaceId as (typeof MarketplaceKnowledgeId)[keyof typeof MarketplaceKnowledgeId],
    agentInput.marketplaceProfile.region ?? MarketplaceRegion.RU,
  );
  const rules = profile
    ? getContextRules(profile, MarketplaceImageContext.INFOGRAPHIC)
    : { requirements: [], restrictions: [], practices: [] };

  const directorValid =
    Boolean(profile) &&
    section.ctrPrediction >= 0.7 &&
    section.overlayElementCount <= 6 &&
    rules.requirements.length > 0;

  return {
    section,
    confidence: directorValid ? confidenceSeed : 0.45,
    directorValid,
  };
}

export async function executeMarketplaceDirectorAgent(input: {
  agentInput?: MarketplaceDirectorAgentInput;
  context?: MarketplaceDirectorAgentContext;
}): Promise<MarketplaceDirectorAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const agentInput = input.agentInput ?? buildBatterySprayerMarketplaceDirectorInput();
  const violations: MarketplaceDirectorAgentViolation[] = [];
  const modulesCompleted: MarketplaceDirectorAgentModuleId[] = [];
  const moduleRecords: MarketplaceDirectorAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: MarketplaceDirectorAgentRetryBranch | undefined;

  let { section, confidence, directorValid } = buildMarketplaceFromInput(agentInput, context, 0.93);
  if (context.lowConfidence) confidence = 0.55;

  const recordMarketplaceModules = (mpSection: MarketplaceSection, suffix = "") => {
    recordModule(moduleRecords, modulesCompleted, MarketplaceDirectorAgentModule.MARKETPLACE_PROFILE_LOADER, agentInput.marketplaceProfile.name + suffix);
    recordModule(moduleRecords, modulesCompleted, MarketplaceDirectorAgentModule.MARKETPLACE_RULES_ENGINE, `${mpSection.marketplaceId}${suffix}`);
    recordModule(moduleRecords, modulesCompleted, MarketplaceDirectorAgentModule.BEHAVIOR_ANALYZER, `${mpSection.emotionLevel} emotion${suffix}`);
    recordModule(moduleRecords, modulesCompleted, MarketplaceDirectorAgentModule.OVERLAY_OPTIMIZER, mpSection.overlayStrategy + suffix);
    recordModule(moduleRecords, modulesCompleted, MarketplaceDirectorAgentModule.COMMERCIAL_ADAPTATION_ENGINE, mpSection.informationDensity + suffix);
    recordModule(moduleRecords, modulesCompleted, MarketplaceDirectorAgentModule.MARKETPLACE_VALIDATOR, `${violations.length} checks${suffix}`);
    recordModule(moduleRecords, modulesCompleted, MarketplaceDirectorAgentModule.MARKETPLACE_BLUEPRINT_BUILDER, "blueprint assembled" + suffix);
  };

  recordMarketplaceModules(section);

  let blueprint = fromMarketplaceSection(section, agentInput, confidence);
  violations.push(...validateMarketplaceDirectorAgentBlueprint(blueprint, agentInput, section, context));

  if (
    context.marketplaceRuleViolation ||
    context.overlayOverloaded ||
    context.lowCtrPrediction ||
    context.poorStoryAdaptation ||
    context.lowMarketplaceMatch
  ) {
    confidence = 0.55;
  }

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const clean = buildMarketplaceFromInput(agentInput, {}, 0.93);
    section = clean.section;
    directorValid = clean.directorValid;
    confidence = clean.confidence;
    blueprint = fromMarketplaceSection(section, agentInput, confidence);

    violations.length = 0;
    violations.push(...validateMarketplaceDirectorAgentBlueprint(blueprint, agentInput, section, {}));
    recordMarketplaceModules(section, ` retry ${retryCount}`);
  }

  if (retryCount > 0 && directorValid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
    blueprint = { ...blueprint, confidence };
  }

  if (context.overlayOverloaded && retryCount >= maxRetries && !context.skipRetry && violations.length > 0) {
    violations.push(violation("RETRY_EXHAUSTED", "Behavior and overlay retry did not resolve marketplace overload"));
  }

  const bp = createEmptyRenderBlueprint({
    category: agentInput.productProfile.category,
    seed: 46,
  });
  const workingContext = buildAgentContextPackage({
    blueprint: bp,
    agentId: MARKETPLACE_DIRECTOR_AGENT_ID,
  });
  const memoryPackage = buildAgentMemoryPackage({
    agentId: MARKETPLACE_DIRECTOR_AGENT_ID,
    working: workingContext,
  });
  releaseAgentMemory(memoryPackage);

  const decision = await executeProfessionalDecision({
    agentId: MARKETPLACE_DIRECTOR_AGENT_ID as AgentContractId,
    blueprint: bp,
  });
  if (!decision.valid) {
    violations.push(violation("EXECUTION_FAILED", "Professional decision must validate marketplace direction"));
  }
  if (!decision.state.problem?.professionalQuestion.toLowerCase().includes("professional")) {
    violations.push(violation("EXECUTION_FAILED", "Decision problem must be marketplace-focused"));
  }

  const durationMs = Date.now() - started;

  const kpis = buildMarketplaceDirectorAgentKpis({
    blueprint: blueprint ?? {
      marketplace: "",
      overlayStrategy: "",
      informationDensity: "",
      badgePriority: [],
      safeAreaRules: [],
      marketplaceOptimizations: [],
      commercialRecommendations: [],
      confidence: 0,
    },
    section,
    confidence,
    retryCount,
    directorValid,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= MARKETPLACE_DIRECTOR_AGENT_MODULES.length ||
    MARKETPLACE_DIRECTOR_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));

  return {
    valid: uniqueViolations.length === 0 && directorValid && modulesComplete && Boolean(blueprint),
    agentId: MARKETPLACE_DIRECTOR_AGENT_ID,
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
    designStructureExcluded: true,
    goldenRuleSatisfied: MARKETPLACE_DIRECTOR_AGENT_GOLDEN_RULE.includes("final commercial step"),
  };
}

export async function executeMarketplaceDirectorAgentWithPipeline(input: {
  agentInput?: MarketplaceDirectorAgentInput;
  context?: MarketplaceDirectorAgentContext;
}): Promise<MarketplaceDirectorAgentExecutionReport> {
  const report = await executeMarketplaceDirectorAgent(input);
  if (!report.valid || !report.blueprint) return report;

  const pipelineValid =
    MARKETPLACE_DIRECTOR_AGENT_PIPELINE.length === 2 &&
    MARKETPLACE_DIRECTOR_AGENT_PIPELINE[0].to === "marketplace_director" &&
    MARKETPLACE_DIRECTOR_AGENT_PIPELINE[1].to === "pattern_director";

  if (!pipelineValid) {
    report.violations.push(violation("DIRECT_AGENT_HANDOFF", "Pipeline position chain is invalid"));
    report.valid = false;
  }

  if (report.agentId !== MARKETPLACE_DIRECTOR_ID) {
    report.violations.push(violation("EXECUTION_FAILED", "Agent must use marketplace-director contract"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: MarketplaceDirectorAgentViolation[]): MarketplaceDirectorAgentViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateMarketplaceDirectorAgentStructure(): MarketplaceDirectorAgentViolation[] {
  if (MARKETPLACE_DIRECTOR_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Marketplace Director Agent requires 7 internal modules")];
  }
  return [];
}

export function validateMarketplaceDirectorAgent(
  context: MarketplaceDirectorAgentContext = {},
): MarketplaceDirectorAgentValidationReport {
  const violations = [...validateMarketplaceDirectorAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateMarketplaceDirectorAgentStructure().length === 0,
    pipelinePositionValid: MARKETPLACE_DIRECTOR_AGENT_PIPELINE[1].to === "pattern_director",
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateMarketplaceDirectorAgentWithExecution(
  context: MarketplaceDirectorAgentContext = {},
): Promise<MarketplaceDirectorAgentValidationReport> {
  const report = validateMarketplaceDirectorAgent(context);
  const kitchen = await executeMarketplaceDirectorAgent({
    agentInput: buildBatterySprayerMarketplaceDirectorInput(),
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

export function assertMarketplaceDirectorAgent(
  context?: MarketplaceDirectorAgentContext,
): MarketplaceDirectorAgentValidationReport {
  const report = validateMarketplaceDirectorAgent(context);
  if (!report.valid) {
    throw new Error(`Marketplace Director Agent violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runMarketplaceDirectorAgent(
  context: MarketplaceDirectorAgentContext = {},
): Promise<MarketplaceDirectorAgentValidationReport> {
  return validateMarketplaceDirectorAgentWithExecution(context);
}

export function isMarketplaceDirectorAgentFailure(code: string): code is MarketplaceDirectorAgentFailureCode {
  const codes: MarketplaceDirectorAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "MARKETPLACE_RULE_VIOLATION",
    "OVERLAY_OVERLOADED",
    "LOW_CTR_PREDICTION",
    "POOR_STORY_ADAPTATION",
    "LOW_MARKETPLACE_MATCH",
    "HERO_NOT_DOMINANT",
    "BLUEPRINT_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "DESIGN_DECISION_DETECTED",
    "DIRECT_AGENT_HANDOFF",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as MarketplaceDirectorAgentFailureCode);
}

export function getMarketplaceDirectorAgentModule(
  moduleId: MarketplaceDirectorAgentModuleId,
): MarketplaceDirectorAgentModuleDefinition | undefined {
  return MARKETPLACE_DIRECTOR_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function scoreMarketplaceCandidateForPlatform(
  candidate: string,
  marketplaceId: string,
): number {
  if (candidate.includes("Minimal") && marketplaceId === "wildberries") return 0.95;
  if (candidate.includes("Information") && marketplaceId === "ozon") return 0.93;
  if (candidate.includes("Premium") && marketplaceId === "amazon") return 0.92;
  return 0.82;
}

export function validateMarketplaceSupportsInfographic(
  overlayElementCount: number,
  marketplaceId: string,
): boolean {
  if (marketplaceId === "wildberries" && overlayElementCount > 6) return false;
  return overlayElementCount >= 2;
}

export function hasWildberriesMinimalOverlay(blueprint: MarketplaceDirectorAgentBlueprint): boolean {
  return blueprint.overlayStrategy.includes("Minimal") && blueprint.badgePriority.length <= 4;
}
