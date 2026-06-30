/**
 * Chapter 6.5 — Business Understanding Stage engine.
 * Translates product characteristics into commercial value — never design.
 */
import { buildDefaultPipelineInput } from "./design-pipeline-engine";
import {
  runKnowledgeRetrievalStage,
} from "./knowledge-retrieval-stage-engine";
import {
  applyContextPatch,
  PipelineContextSection,
  type GenerationPipelineContext,
} from "./pipeline-context-engine";
import {
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  buildProductAnalysisInputFromPipeline,
} from "./product-analysis-engine";
import { PriceSegment } from "./product-analysis-types";
import { StoryType } from "./visual-story-director-types";
import {
  BusinessUnderstandingStage,
  CompetitivePositioningStrategy,
  PurchaseMotivationType,
  StoryStrategyArc,
  type BusinessUnderstandingContext,
  type BusinessUnderstandingFailureCode,
  type BusinessUnderstandingInput,
  type BusinessUnderstandingReport,
  type BusinessUnderstandingSection,
  type BusinessUnderstandingStageId,
  type BusinessUnderstandingSystemReport,
  type BusinessUnderstandingViolation,
  type CompetitivePositioningStrategyId,
  type FeatureBenefitChain,
  type PipelineBusinessModel,
  type RankedBusinessPriority,
  type StoryStrategyArcId,
} from "./business-understanding-types";

export {
  BusinessUnderstandingStage,
  StoryStrategyArc,
  CompetitivePositioningStrategy,
  PurchaseMotivationType,
  type BusinessUnderstandingStageId,
  type StoryStrategyArcId,
  type CompetitivePositioningStrategyId,
  type PurchaseMotivationTypeId,
  type PipelineBusinessModel,
  type FeatureBenefitChain,
  type RankedBusinessPriority,
  type BusinessUnderstandingInput,
  type BusinessUnderstandingSection,
  type BusinessUnderstandingViolation,
  type BusinessUnderstandingReport,
  type BusinessUnderstandingContext,
  type BusinessUnderstandingSystemReport,
  type BusinessUnderstandingFailureCode,
} from "./business-understanding-types";

export const BUSINESS_UNDERSTANDING_VERSION = "6.5.0";

export const BUSINESS_UNDERSTANDING_GOLDEN_RULE =
  "Buyers do not purchase product specifications — they purchase solutions to their problems. " +
  "Business Understanding transforms technical product description into clear commercial value " +
  "that becomes the foundation of all visual communication.";

export const BUSINESS_UNDERSTANDING_PIPELINE: readonly BusinessUnderstandingStageId[] = [
  BusinessUnderstandingStage.INPUT_ASSEMBLY,
  BusinessUnderstandingStage.COMMERCIAL_GOAL,
  BusinessUnderstandingStage.FEATURE_TRANSFORMATION,
  BusinessUnderstandingStage.PAIN_POINT_ANALYSIS,
  BusinessUnderstandingStage.CUSTOMER_VALUE,
  BusinessUnderstandingStage.PURCHASE_MOTIVATION,
  BusinessUnderstandingStage.EMOTIONAL_POSITIONING,
  BusinessUnderstandingStage.COMPETITIVE_POSITIONING,
  BusinessUnderstandingStage.STORY_STRATEGY,
  BusinessUnderstandingStage.PRIORITY_RANKING,
  BusinessUnderstandingStage.BUSINESS_MODEL_ASSEMBLY,
  BusinessUnderstandingStage.VALIDATION,
] as const;

export const BUSINESS_UNDERSTANDING_PIPELINE_POSITION = [
  "knowledge-retrieval",
  "business-understanding",
  "visual-story-director",
] as const;

type CategoryBusinessSeed = {
  featureChains: FeatureBenefitChain[];
  customerValues: string[];
  purchaseMotivations: PurchaseMotivationTypeId[];
  emotionalDrivers: string[];
  competitiveStrategy: CompetitivePositioningStrategyId;
  storyStrategyArc: StoryStrategyArcId;
  storyStrategyLabel: string;
  businessPriority: string;
};

const CATEGORY_BUSINESS_SEEDS: Record<string, CategoryBusinessSeed> = {
  garden_tools: {
    featureChains: [
      {
        feature: "8 Ah battery",
        benefit: "several hours of autonomous operation",
        customerValue: "time and effort savings",
        priority: 1,
      },
      {
        feature: "16 liter tank",
        benefit: "less frequent refilling",
        customerValue: "fewer interruptions during work",
        priority: 3,
      },
      {
        feature: "telescopic wand",
        benefit: "reach tall trees without a ladder",
        customerValue: "easier treatment of high plants",
        priority: 4,
      },
      {
        feature: "cordless pump",
        benefit: "no manual pumping required",
        customerValue: "reduced physical strain",
        priority: 2,
      },
    ],
    customerValues: [
      "time savings",
      "reduced physical effort",
      "better harvest results",
      "convenience",
      "durability",
      "professional outcome",
    ],
    purchaseMotivations: [
      PurchaseMotivationType.SOLVE_PROBLEM,
      PurchaseMotivationType.EASE_WORK,
      PurchaseMotivationType.INCREASE_EFFICIENCY,
      PurchaseMotivationType.REPLACE_OLD,
    ],
    emotionalDrivers: ["confidence", "control", "reliability", "care for plants"],
    competitiveStrategy: CompetitivePositioningStrategy.MOST_RELIABLE,
    storyStrategyArc: StoryStrategyArc.PROBLEM_SOLUTION_BENEFIT_TRUST_ACTION,
    storyStrategyLabel: "Problem → Solution → Benefit → Trust → Action",
    businessPriority: "conversion",
  },
  kitchen: {
    featureChains: [
      {
        feature: "1200W motor",
        benefit: "smooth blends without lumps",
        customerValue: "confidence in result quality",
        priority: 2,
      },
      {
        feature: "noise reduction",
        benefit: "quiet morning operation",
        customerValue: "comfort for the household",
        priority: 3,
      },
      {
        feature: "premium glass jar",
        benefit: "durable showcase-ready presence",
        customerValue: "kitchen pride and trust",
        priority: 4,
      },
    ],
    customerValues: [
      "morning ritual pleasure",
      "healthy family care",
      "kitchen pride",
      "reliability",
      "premium perception",
    ],
    purchaseMotivations: [
      PurchaseMotivationType.RAISE_STATUS,
      PurchaseMotivationType.ENJOYMENT,
      PurchaseMotivationType.SOLVE_PROBLEM,
    ],
    emotionalDrivers: ["confidence", "luxury", "comfort", "trust"],
    competitiveStrategy: CompetitivePositioningStrategy.BEST_QUALITY,
    storyStrategyArc: StoryStrategyArc.PREMIUM_QUALITY_MATERIALS_STATUS_PURCHASE,
    storyStrategyLabel: "Premium → Quality → Materials → Status → Purchase",
    businessPriority: "premium_conversion",
  },
};

function violation(
  code: BusinessUnderstandingFailureCode,
  message: string,
  stage?: BusinessUnderstandingStageId,
): BusinessUnderstandingViolation {
  return { code, message, stage };
}

function resolveSeed(profile: AnalyzedProductProfile): CategoryBusinessSeed {
  const key = profile.subcategory.toLowerCase().includes("sprayer") || profile.category.toLowerCase().includes("garden")
    ? "garden_tools"
    : "kitchen";
  return CATEGORY_BUSINESS_SEEDS[key] ?? CATEGORY_BUSINESS_SEEDS.kitchen;
}

export function transformFeaturesToBenefits(
  profile: AnalyzedProductProfile,
  context: BusinessUnderstandingContext = {},
): FeatureBenefitChain[] {
  if (context.skipFeatureTransform) return [];
  const seed = resolveSeed(profile);
  const fromProfile = profile.primaryBenefits.map((benefit, index) => ({
    feature: benefit,
    benefit,
    customerValue: profile.emotionalTriggers[index] ?? profile.painPoints[index] ?? "improved daily outcome",
    priority: index + 1,
  }));
  return [...seed.featureChains, ...fromProfile].slice(0, 6);
}

export function extractPainPointsFromKnowledge(
  profile: AnalyzedProductProfile,
  knowledgePainHints: string[] = [],
): string[] {
  const merged = [...profile.painPoints, ...knowledgePainHints];
  return [...new Set(merged)].slice(0, 6);
}

export function rankBusinessPriorities(
  chains: FeatureBenefitChain[],
  profile: AnalyzedProductProfile,
): RankedBusinessPriority[] {
  const sorted = [...chains].sort((a, b) => a.priority - b.priority);
  const priorities: RankedBusinessPriority[] = sorted.map((chain, index) => ({
    rank: index + 1,
    label: chain.customerValue,
    source: "value",
  }));

  if (profile.painPoints[0]) {
    priorities.push({
      rank: priorities.length + 1,
      label: `relief: ${profile.painPoints[0]}`,
      source: "pain_relief",
    });
  }

  return priorities.slice(0, 5);
}

export function selectStoryStrategyArc(
  profile: AnalyzedProductProfile,
  context: BusinessUnderstandingContext = {},
): { arc: StoryStrategyArcId; label: string } {
  if (context.conflictingStrategies) {
    return {
      arc: StoryStrategyArc.PROBLEM_SOLUTION_BENEFIT_TRUST_ACTION,
      label: "conflict",
    };
  }
  const seed = resolveSeed(profile);
  if (profile.priceSegment === PriceSegment.PREMIUM) {
    return {
      arc: StoryStrategyArc.PREMIUM_QUALITY_MATERIALS_STATUS_PURCHASE,
      label: "Premium → Quality → Materials → Status → Purchase",
    };
  }
  if (profile.productType.toLowerCase().includes("agricultural") || profile.subcategory.toLowerCase().includes("sprayer")) {
    return {
      arc: StoryStrategyArc.PROBLEM_SOLUTION_BENEFIT_TRUST_ACTION,
      label: seed.storyStrategyLabel,
    };
  }
  return { arc: seed.storyStrategyArc, label: seed.storyStrategyLabel };
}

export function selectCompetitiveStrategy(
  profile: AnalyzedProductProfile,
): CompetitivePositioningStrategyId {
  const seed = resolveSeed(profile);
  if (profile.competitiveAdvantages.some((a) => a.toLowerCase().includes("autonom"))) {
    return CompetitivePositioningStrategy.MOST_RELIABLE;
  }
  if (profile.priceSegment === PriceSegment.BUDGET) {
    return CompetitivePositioningStrategy.BEST_VALUE;
  }
  if (profile.priceSegment === PriceSegment.PREMIUM) {
    return CompetitivePositioningStrategy.BEST_QUALITY;
  }
  return seed.competitiveStrategy;
}

export function buildPipelineBusinessModel(
  profile: AnalyzedProductProfile,
  chains: FeatureBenefitChain[],
  rankedPriorities: RankedBusinessPriority[],
  story: { arc: StoryStrategyArcId; label: string },
  competitiveStrategy: CompetitivePositioningStrategyId,
  context: BusinessUnderstandingContext = {},
): PipelineBusinessModel {
  const seed = resolveSeed(profile);
  const primaryValue = context.missingPrimaryValue
    ? ""
    : chains[0]?.customerValue ?? seed.customerValues[0] ?? profile.primaryBenefits[0];

  return {
    primaryValue,
    secondaryValues: chains.slice(1, 4).map((c) => c.customerValue),
    painPoints: [...profile.painPoints],
    emotionalDrivers: [...seed.emotionalDrivers, ...profile.emotionalTriggers].slice(0, 5),
    purchaseMotivations: seed.purchaseMotivations,
    competitiveAdvantages: [...profile.competitiveAdvantages],
    storyStrategy: story.label,
    businessPriority: seed.businessPriority,
  };
}

export function validatePipelineBusinessModel(
  model: PipelineBusinessModel,
  chains: FeatureBenefitChain[],
  rankedPriorities: RankedBusinessPriority[],
  context: BusinessUnderstandingContext = {},
): BusinessUnderstandingViolation[] {
  const violations: BusinessUnderstandingViolation[] = [];

  if (!model.primaryValue) {
    violations.push(
      violation("MISSING_PRIMARY_VALUE", "Primary customer value must be defined", BusinessUnderstandingStage.CUSTOMER_VALUE),
    );
  }
  if (model.painPoints.length === 0) {
    violations.push(
      violation("NO_PAIN_POINTS", "Buyer pain points must be identified", BusinessUnderstandingStage.PAIN_POINT_ANALYSIS),
    );
  }
  if (model.secondaryValues.length === 0 && chains.length < 2) {
    violations.push(
      violation("NO_CUSTOMER_VALUE", "Customer value layer must be defined", BusinessUnderstandingStage.CUSTOMER_VALUE),
    );
  }
  if (model.purchaseMotivations.length === 0) {
    violations.push(
      violation("NO_PURCHASE_MOTIVATION", "Purchase motivations must be defined", BusinessUnderstandingStage.PURCHASE_MOTIVATION),
    );
  }
  if (context.conflictingStrategies) {
    violations.push(
      violation("CONFLICTING_STRATEGIES", "Only one primary competitive strategy is allowed", BusinessUnderstandingStage.COMPETITIVE_POSITIONING),
    );
  }
  if (context.unrankedPriorities || rankedPriorities.length === 0) {
    violations.push(
      violation("UNRANKED_PRIORITIES", "Business priorities must be ranked", BusinessUnderstandingStage.PRIORITY_RANKING),
    );
  }
  if (context.skipFeatureTransform || chains.length === 0) {
    violations.push(
      violation("SPECS_NOT_TRANSFORMED", "Features must be transformed into customer value", BusinessUnderstandingStage.FEATURE_TRANSFORMATION),
    );
  }
  if (!model.storyStrategy || model.storyStrategy === "conflict") {
    violations.push(
      violation("MODEL_INCOMPLETE", "Story strategy must be ready for Story Director", BusinessUnderstandingStage.STORY_STRATEGY),
    );
  }

  return violations;
}

export function mapStoryStrategyToStoryType(arc: StoryStrategyArcId): string {
  const map: Record<StoryStrategyArcId, string> = {
    [StoryStrategyArc.PROBLEM_SOLUTION_BENEFIT_TRUST_ACTION]: StoryType.PROBLEM_SOLUTION,
    [StoryStrategyArc.PREMIUM_QUALITY_MATERIALS_STATUS_PURCHASE]: StoryType.PREMIUM_LIFESTYLE,
    [StoryStrategyArc.EFFICIENCY_COMFORT_RESULT_ACTION]: StoryType.EFFICIENCY,
    [StoryStrategyArc.TRUST_RELIABILITY_PROFESSIONAL_ACTION]: StoryType.TRUST,
  };
  return map[arc];
}

export function runBusinessUnderstandingStage(
  input: BusinessUnderstandingInput,
  context: BusinessUnderstandingContext = {},
): BusinessUnderstandingReport {
  const started = Date.now();
  const stagesCompleted: BusinessUnderstandingStageId[] = [];
  const violations: BusinessUnderstandingViolation[] = [];

  if (!input.profile?.category) {
    return {
      valid: false,
      violations: [violation("MISSING_PROFILE", "Product Profile is required", BusinessUnderstandingStage.INPUT_ASSEMBLY)],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }
  if (!input.knowledge?.rawPackage) {
    return {
      valid: false,
      violations: [violation("MISSING_KNOWLEDGE", "Knowledge Package is required", BusinessUnderstandingStage.INPUT_ASSEMBLY)],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  stagesCompleted.push(BusinessUnderstandingStage.INPUT_ASSEMBLY, BusinessUnderstandingStage.COMMERCIAL_GOAL);

  const knowledgePainHints = input.knowledge.antiPatterns.map((a) => a.warning);
  const chains = transformFeaturesToBenefits(input.profile, context);
  stagesCompleted.push(BusinessUnderstandingStage.FEATURE_TRANSFORMATION);

  const painPoints = extractPainPointsFromKnowledge(input.profile, knowledgePainHints);
  stagesCompleted.push(BusinessUnderstandingStage.PAIN_POINT_ANALYSIS, BusinessUnderstandingStage.CUSTOMER_VALUE);

  const seed = resolveSeed(input.profile);
  stagesCompleted.push(
    BusinessUnderstandingStage.PURCHASE_MOTIVATION,
    BusinessUnderstandingStage.EMOTIONAL_POSITIONING,
  );

  const competitiveStrategy = selectCompetitiveStrategy(input.profile);
  stagesCompleted.push(BusinessUnderstandingStage.COMPETITIVE_POSITIONING);

  const story = selectStoryStrategyArc(input.profile, context);
  stagesCompleted.push(BusinessUnderstandingStage.STORY_STRATEGY);

  const rankedPriorities = context.unrankedPriorities ? [] : rankBusinessPriorities(chains, input.profile);
  stagesCompleted.push(BusinessUnderstandingStage.PRIORITY_RANKING);

  const model = buildPipelineBusinessModel(
    { ...input.profile, painPoints },
    chains,
    rankedPriorities,
    story,
    competitiveStrategy,
    context,
  );
  stagesCompleted.push(BusinessUnderstandingStage.BUSINESS_MODEL_ASSEMBLY);

  violations.push(...validatePipelineBusinessModel(model, chains, rankedPriorities, context));
  stagesCompleted.push(BusinessUnderstandingStage.VALIDATION);

  const section: BusinessUnderstandingSection = {
    model,
    featureChains: chains,
    rankedPriorities,
    competitiveStrategy,
    storyStrategyArc: story.arc,
    stagesCompleted,
    confidence: violations.length === 0 ? 0.93 : 0.42,
  };

  return {
    valid: violations.length === 0,
    violations,
    section,
    stagesCompleted,
    durationMs: Date.now() - started,
  };
}

export function enrichPipelineContextWithBusinessUnderstanding(
  ctx: GenerationPipelineContext,
  section: BusinessUnderstandingSection,
): { context: GenerationPipelineContext; violations: BusinessUnderstandingViolation[] } {
  const patch = applyContextPatch(ctx, {
    agentId: "product-analyzer",
    section: PipelineContextSection.BUSINESS,
    changes: {
      businessGoal: {
        goal: ctx.business.businessGoal.goal,
        priority: section.model.businessPriority,
      },
      commercialModel: {
        primaryValue: section.model.primaryValue,
        storyStrategy: section.model.storyStrategy,
        rankedPriorities: section.rankedPriorities.map((p) => p.label),
        emotionalDrivers: section.model.emotionalDrivers,
        storyTypeHint: mapStoryStrategyToStoryType(section.storyStrategyArc),
      },
    },
    reason: "Business Understanding Stage enriched commercial model",
  });

  return {
    context: patch.context,
    violations: patch.violations as BusinessUnderstandingViolation[],
  };
}

export function runBusinessUnderstandingStageFromPipeline(
  context: BusinessUnderstandingContext = {},
): BusinessUnderstandingReport {
  const pipelineInput = buildDefaultPipelineInput();
  const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(pipelineInput));
  if (!analysis.section) {
    return {
      valid: false,
      violations: [violation("MISSING_PROFILE", "Product Analysis must complete before Business Understanding")],
      stagesCompleted: [],
      durationMs: 0,
    };
  }
  const knowledge = runKnowledgeRetrievalStage({
    profile: analysis.section.profile,
    marketplace: pipelineInput.marketplace,
    style: analysis.section.profile.priceSegment,
  });
  if (!knowledge.package) {
    return {
      valid: false,
      violations: [violation("MISSING_KNOWLEDGE", "Knowledge Retrieval must complete before Business Understanding")],
      stagesCompleted: [],
      durationMs: 0,
    };
  }
  return runBusinessUnderstandingStage(
    {
      profile: analysis.section.profile,
      knowledge: knowledge.package,
      marketplace: pipelineInput.marketplace,
      brand: pipelineInput.brand,
    },
    context,
  );
}

export function validateBusinessUnderstanding(
  context: BusinessUnderstandingContext = {},
): BusinessUnderstandingSystemReport {
  const violations: BusinessUnderstandingViolation[] = [];

  const kitchen = runBusinessUnderstandingStageFromPipeline(context);
  if (!kitchen.valid || !kitchen.section) {
    violations.push(...kitchen.violations);
  } else {
    if (kitchen.section.featureChains.some((c) => c.customerValue === c.feature && c.feature.includes("motor"))) {
      violations.push(violation("SPECS_NOT_TRANSFORMED", "Motor spec must transform to customer value"));
    }
  }

  const gardenAnalysis = analyzeProduct(
    buildDefaultProductAnalysisInput({
      category: "garden_tools",
      marketplace: "wildberries",
      businessGoal: "Increase CTR",
      targetAudience: "garden owners",
    }),
  );
  const gardenKnowledge = runKnowledgeRetrievalStage({
    profile: gardenAnalysis.section!.profile,
    marketplace: "wildberries",
  });
  const garden = runBusinessUnderstandingStage(
    {
      profile: gardenAnalysis.section!.profile,
      knowledge: gardenKnowledge.package!,
      marketplace: "wildberries",
    },
    context,
  );
  if (!garden.valid || !garden.section) {
    violations.push(...garden.violations);
  } else {
    const chain = garden.section.featureChains.find((c) => c.feature.toLowerCase().includes("battery"));
    if (
      !chain ||
      (!chain.customerValue.includes("time") &&
        !chain.customerValue.includes("effort") &&
        !chain.customerValue.includes("strain"))
    ) {
      violations.push(violation("SPECS_NOT_TRANSFORMED", "Battery feature must map to time/effort customer value"));
    }
    if (garden.section.model.storyStrategy !== "Problem → Solution → Benefit → Trust → Action") {
      violations.push(violation("MODEL_INCOMPLETE", "Garden sprayer must use problem-solution story arc"));
    }
    if (garden.section.rankedPriorities[0]?.rank !== 1) {
      violations.push(violation("UNRANKED_PRIORITIES", "Top priority must be rank 1"));
    }
  }

  const conflicting = runBusinessUnderstandingStage(
    {
      profile: gardenAnalysis.section!.profile,
      knowledge: gardenKnowledge.package!,
      marketplace: "wildberries",
    },
    { conflictingStrategies: true },
  );
  if (conflicting.valid) {
    violations.push(violation("CONFLICTING_STRATEGIES", "Conflicting strategies must fail validation"));
  }

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    valueOverSpecs: !!garden.section?.featureChains.every((c) => c.customerValue !== c.feature || !c.feature.match(/^\d/)),
    singleStoryStrategy: !!garden.section && !context.conflictingStrategies,
    prioritiesRanked: !!garden.section && garden.section.rankedPriorities.length >= 3,
    storyDirectorReady: !!garden.section?.model.storyStrategy,
    modelComplete: !!kitchen.section && !!garden.section,
  };
}

export function assertBusinessUnderstanding(
  context: BusinessUnderstandingContext = {},
): BusinessUnderstandingSystemReport {
  const report = validateBusinessUnderstanding(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Business Understanding validation failed: ${messages}`);
  }
  return report;
}

export function runBusinessUnderstanding(
  context: BusinessUnderstandingContext = {},
): BusinessUnderstandingSystemReport {
  return validateBusinessUnderstanding(context);
}

export function isBusinessUnderstandingFailure(code: string): code is BusinessUnderstandingFailureCode {
  const codes: BusinessUnderstandingFailureCode[] = [
    "MISSING_PROFILE",
    "MISSING_KNOWLEDGE",
    "MISSING_PRIMARY_VALUE",
    "NO_PAIN_POINTS",
    "NO_CUSTOMER_VALUE",
    "NO_PURCHASE_MOTIVATION",
    "CONFLICTING_STRATEGIES",
    "UNRANKED_PRIORITIES",
    "MODEL_INCOMPLETE",
    "SPECS_NOT_TRANSFORMED",
    "DESIGN_DECISION_DETECTED",
  ];
  return codes.includes(code as BusinessUnderstandingFailureCode);
}
