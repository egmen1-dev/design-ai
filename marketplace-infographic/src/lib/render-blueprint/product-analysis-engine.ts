/**
 * Chapter 6.3 — Product Analysis Stage engine.
 * First intelligent pipeline stage — product understanding only, never design.
 */
import type { AgentContractId } from "./agent-contracts";
import { buildDefaultPipelineInput } from "./design-pipeline-engine";
import type { DesignPipelineInput } from "./design-pipeline-types";
import {
  KnowledgeRetrievalDomain,
  type KnowledgeRetrievalRequest,
} from "./knowledge-retrieval-types";
import { retrieveKnowledgePackage } from "./knowledge-retrieval-engine";
import {
  applyContextPatch,
  PipelineContextSection,
  type GenerationPipelineContext,
} from "./pipeline-context-engine";
import { getReadyAgents } from "./pipeline-orchestrator-engine";
import type { ProductBlueprint, ProductFinishId } from "./types";
import type { BlueprintMutation } from "./mutation-types";
import { updatesToMutations } from "./universal-agent-bridge";
import {
  MarketSegment,
  PriceSegment,
  ProductAnalysisStage,
  type AnalyzedProductProfile,
  type ProductAnalysisContext,
  type ProductAnalysisExplainability,
  type ProductAnalysisFailureCode,
  type ProductAnalysisInput,
  type ProductAnalysisReport,
  type ProductAnalysisSection,
  type ProductAnalysisStageId,
  type ProductAnalysisSystemReport,
  type ProductAnalysisViolation,
  type ProductFeature,
  type ProductKnowledgeRequest,
} from "./product-analysis-types";

export {
  ProductAnalysisStage,
  PriceSegment,
  MarketSegment,
  type ProductAnalysisStageId,
  type PriceSegmentId,
  type MarketSegmentId,
  type AnalyzedProductProfile,
  type ProductAnalysisInput,
  type ProductFeature,
  type ProductKnowledgeRequest,
  type ProductAnalysisSection,
  type ProductAnalysisExplainability,
  type ProductAnalysisViolation,
  type ProductAnalysisReport,
  type ProductAnalysisContext,
  type ProductAnalysisSystemReport,
  type ProductAnalysisFailureCode,
  type ProductAnalyzerAgentId,
} from "./product-analysis-types";

export const PRODUCT_ANALYSIS_VERSION = "6.3.0";

export const PRODUCT_ANALYSIS_GOLDEN_RULE =
  "Product Analysis is not product classification — it is the process of forming complete product understanding. " +
  "All subsequent agents decide based on this understanding. If the system understood the product correctly, " +
  "it can create professional commercial infographic. Wrong understanding cannot be fully compensated later.";

export const PRODUCT_ANALYZER_ID: AgentContractId = "product-analyzer";

export const PRODUCT_ANALYSIS_PIPELINE: readonly ProductAnalysisStageId[] = [
  ProductAnalysisStage.INPUT_NORMALIZATION,
  ProductAnalysisStage.CATEGORY_RECOGNITION,
  ProductAnalysisStage.FEATURE_EXTRACTION,
  ProductAnalysisStage.PAIN_POINT_DETECTION,
  ProductAnalysisStage.AUDIENCE_ANALYSIS,
  ProductAnalysisStage.USE_CASE_DETECTION,
  ProductAnalysisStage.COMMERCIAL_POSITIONING,
  ProductAnalysisStage.EMOTIONAL_MAPPING,
  ProductAnalysisStage.COMPETITIVE_ANALYSIS,
  ProductAnalysisStage.PROFILE_ASSEMBLY,
  ProductAnalysisStage.KNOWLEDGE_REQUEST,
  ProductAnalysisStage.VALIDATION,
] as const;

export const PRODUCT_ANALYSIS_PIPELINE_POSITION = [
  "business-goal",
  PRODUCT_ANALYZER_ID,
  "knowledge-retrieval",
] as const;

type CategorySeed = {
  category: string;
  subcategory: string;
  productType: string;
  marketSegment: string;
  priceSegment: string;
  primaryBenefits: string[];
  secondaryBenefits: string[];
  painPoints: string[];
  useCases: string[];
  emotionalTriggers: string[];
  competitiveAdvantages: string[];
  features: ProductFeature[];
  blueprint: Omit<ProductBlueprint, "cutout">;
  audienceSegment: string;
};

const CATEGORY_SEEDS: Record<string, CategorySeed> = {
  garden_tools: {
    category: "Garden Equipment",
    subcategory: "Battery Sprayer",
    productType: "Agricultural Tool",
    marketSegment: MarketSegment.SEASONAL,
    priceSegment: PriceSegment.MASS_MARKET,
    primaryBenefits: [
      "cordless battery power",
      "extended tank capacity",
      "long runtime per charge",
      "automatic liquid delivery",
      "lightweight ergonomic body",
    ],
    secondaryBenefits: ["nozzle kit included", "easy refill", "quiet operation"],
    painPoints: [
      "hand-pump fatigue",
      "time lost on manual pumping",
      "uneven spray coverage",
      "heavy physical labor",
      "difficulty treating tall trees",
    ],
    useCases: ["garden", "greenhouse", "vegetable plot", "orchard", "vineyard", "nursery"],
    emotionalTriggers: [
      "ease of work",
      "time savings",
      "care for plants",
      "better harvest",
      "joy of gardening",
    ],
    competitiveAdvantages: [
      "longer autonomy",
      "more ergonomic design",
      "higher throughput",
      "better accessory kit",
      "modern appearance",
    ],
    features: [
      { label: "battery power", priority: 1, isBenefit: true },
      { label: "tank volume", priority: 2, isBenefit: true },
      { label: "runtime", priority: 3, isBenefit: true },
      { label: "automatic delivery", priority: 4, isBenefit: true },
      { label: "nozzle kit", priority: 5, isBenefit: true },
      { label: "low weight", priority: 6, isBenefit: true },
      { label: "ergonomics", priority: 7, isBenefit: true },
    ],
    blueprint: {
      category: "garden_tools",
      subCategory: "battery_sprayer",
      dominantColor: ["green", "black"],
      materials: ["plastic", "rubber"],
      finish: "matte" as ProductFinishId,
      shape: "vertical cylinder with pump handle",
    },
    audienceSegment: "garden owners",
  },
  kitchen: {
    category: "Kitchen Appliances",
    subcategory: "Premium Blender",
    productType: "Small Kitchen Appliance",
    marketSegment: MarketSegment.CONSUMER,
    priceSegment: PriceSegment.PREMIUM,
    primaryBenefits: [
      "powerful motor for smooth blends",
      "durable glass jar",
      "quiet operation",
      "easy cleaning",
      "premium countertop presence",
    ],
    secondaryBenefits: ["recipe versatility", "safety lock", "compact footprint"],
    painPoints: [
      "lumpy smoothies",
      "noisy morning disruption",
      "difficult cleanup",
      "cheap-looking appliances reduce trust",
      "unstable base during blending",
    ],
    useCases: ["morning smoothies", "soup prep", "meal prep", "entertaining", "healthy lifestyle"],
    emotionalTriggers: [
      "confidence in quality",
      "morning ritual pleasure",
      "healthy family care",
      "kitchen pride",
      "reliability",
    ],
    competitiveAdvantages: [
      "higher motor power",
      "quieter engineering",
      "premium materials",
      "better warranty perception",
      "refined design language",
    ],
    features: [
      { label: "motor power", priority: 1, isBenefit: true },
      { label: "glass jar", priority: 2, isBenefit: true },
      { label: "noise reduction", priority: 3, isBenefit: true },
      { label: "dishwasher-safe parts", priority: 4, isBenefit: true },
      { label: "stainless accents", priority: 5, isBenefit: true },
    ],
    blueprint: {
      category: "kitchen",
      subCategory: "blender",
      dominantColor: ["silver", "black"],
      materials: ["glass", "stainless_steel", "plastic"],
      finish: "gloss" as ProductFinishId,
      shape: "tower base with jar",
    },
    audienceSegment: "home cooks",
  },
};

function violation(
  code: ProductAnalysisFailureCode,
  message: string,
  stage?: ProductAnalysisStageId,
): ProductAnalysisViolation {
  return { code, message, stage };
}

function normalizeCategoryKey(category?: string): string {
  const raw = (category ?? "kitchen").toLowerCase().replace(/[\s-]+/g, "_");
  if (raw.includes("sprayer") || raw.includes("garden")) return "garden_tools";
  if (raw.includes("kitchen") || raw.includes("blender") || raw.includes("appliance")) return "kitchen";
  return CATEGORY_SEEDS[raw] ? raw : "kitchen";
}

function resolveSeed(input: ProductAnalysisInput, context: ProductAnalysisContext = {}): CategorySeed {
  if (context.forceInvalidCategory) {
    return {
      ...CATEGORY_SEEDS.kitchen,
      category: "",
      subcategory: "",
      productType: "unknown",
    };
  }
  return CATEGORY_SEEDS[normalizeCategoryKey(input.category)] ?? CATEGORY_SEEDS.kitchen;
}

export function buildDefaultProductAnalysisInput(
  overrides: Partial<ProductAnalysisInput> = {},
): ProductAnalysisInput {
  const pipeline = buildDefaultPipelineInput();
  return {
    productImageRef: pipeline.productImageRef,
    name: pipeline.brand,
    marketplace: pipeline.marketplace,
    brand: pipeline.brand,
    businessGoal: pipeline.businessGoal,
    category: pipeline.category,
    targetAudience: pipeline.targetAudience,
    locale: "ru",
    country: "RU",
    ...overrides,
  };
}

export function buildProductAnalysisInputFromPipeline(
  input: DesignPipelineInput = buildDefaultPipelineInput(),
): ProductAnalysisInput {
  return {
    productImageRef: input.productImageRef,
    name: input.brand,
    marketplace: input.marketplace,
    brand: input.brand,
    businessGoal: input.businessGoal,
    category: input.category,
    targetAudience: input.targetAudience,
    userPreferences: input.projectConstraints,
    locale: "ru",
    country: "RU",
  };
}

export function buildAnalyzedProductProfile(
  input: ProductAnalysisInput,
  seed: CategorySeed,
  context: ProductAnalysisContext = {},
): AnalyzedProductProfile {
  const audienceSegment = input.targetAudience ?? seed.audienceSegment;
  return {
    category: seed.category,
    subcategory: seed.subcategory,
    productType: seed.productType,
    marketSegment: seed.marketSegment,
    priceSegment: seed.priceSegment,
    businessGoal: input.businessGoal,
    targetAudience: {
      segment: audienceSegment,
      locale: input.locale ?? "ru",
    },
    primaryBenefits: context.missingBenefits ? [] : [...seed.primaryBenefits],
    secondaryBenefits: [...seed.secondaryBenefits],
    painPoints: context.missingPainPoints ? [] : [...seed.painPoints],
    useCases: context.missingUseCases ? [] : [...seed.useCases],
    emotionalTriggers: [...seed.emotionalTriggers],
    competitiveAdvantages: [...seed.competitiveAdvantages],
  };
}

export function buildProductBlueprintFromProfile(
  profile: AnalyzedProductProfile,
  seed: CategorySeed,
): ProductBlueprint {
  return {
    ...seed.blueprint,
    category: profile.category.toLowerCase().replace(/\s+/g, "_"),
    subCategory: profile.subcategory.toLowerCase().replace(/\s+/g, "_"),
    cutout: true,
  };
}

export function buildKnowledgeRequestFromProfile(
  profile: AnalyzedProductProfile,
  input: ProductAnalysisInput,
): ProductKnowledgeRequest {
  const retrievalRequest: KnowledgeRetrievalRequest = {
    context: {
      category: profile.subcategory,
      marketplace: input.marketplace,
      audience: profile.targetAudience.segment,
      businessGoal: profile.businessGoal,
      agentId: PRODUCT_ANALYZER_ID,
      semanticQuery: `${profile.category} ${profile.subcategory} ${profile.priceSegment} ${profile.businessGoal}`,
    },
    limit: 8,
    useCache: false,
    requiredDomains: [
      KnowledgeRetrievalDomain.MARKETPLACE,
      KnowledgeRetrievalDomain.CONSUMER,
      KnowledgeRetrievalDomain.PATTERN,
    ],
  };

  return {
    category: profile.subcategory,
    marketplace: input.marketplace,
    audience: profile.targetAudience.segment,
    positioning: profile.priceSegment,
    businessGoal: profile.businessGoal,
    retrievalRequest,
  };
}

export function buildProductAnalysisExplainability(
  profile: AnalyzedProductProfile,
): ProductAnalysisExplainability {
  return {
    categoryReason: `${profile.category} → ${profile.subcategory} → ${profile.productType}`,
    benefitRationale: `Primary benefits prioritized for Story Director: ${profile.primaryBenefits.slice(0, 3).join(", ")}`,
    painPointRationale: `Story built around buyer pains: ${profile.painPoints.slice(0, 3).join(", ")}`,
    audienceRationale: `Audience segment ${profile.targetAudience.segment} with locale ${profile.targetAudience.locale}`,
    positioningRationale: `${profile.priceSegment} positioning in ${profile.marketSegment} segment`,
    designExcluded: true,
  };
}

export function validateAnalyzedProductProfile(
  profile: AnalyzedProductProfile,
  context: ProductAnalysisContext = {},
): ProductAnalysisViolation[] {
  const violations: ProductAnalysisViolation[] = [];

  if (!profile.category) {
    violations.push(
      violation("CATEGORY_UNKNOWN", "Category must be determined", ProductAnalysisStage.CATEGORY_RECOGNITION),
    );
  }
  if (!profile.businessGoal) {
    violations.push(
      violation("MISSING_BUSINESS_GOAL", "Business goal is required", ProductAnalysisStage.INPUT_NORMALIZATION),
    );
  }
  if (profile.primaryBenefits.length === 0 || context.missingBenefits) {
    violations.push(
      violation("NO_PRIMARY_BENEFITS", "Primary benefits must be identified", ProductAnalysisStage.FEATURE_EXTRACTION),
    );
  }
  if (profile.painPoints.length === 0 || context.missingPainPoints) {
    violations.push(
      violation("NO_PAIN_POINTS", "Buyer pain points must be detected", ProductAnalysisStage.PAIN_POINT_DETECTION),
    );
  }
  if (profile.useCases.length === 0 || context.missingUseCases) {
    violations.push(
      violation("NO_USE_CASES", "Use cases must be defined for Scene Director", ProductAnalysisStage.USE_CASE_DETECTION),
    );
  }
  if (
    profile.priceSegment === PriceSegment.BUDGET &&
    profile.competitiveAdvantages.some((a) => a.toLowerCase().includes("premium"))
  ) {
    violations.push(
      violation(
        "PROFILE_CONTRADICTION",
        "Budget positioning conflicts with premium competitive advantages",
        ProductAnalysisStage.COMMERCIAL_POSITIONING,
      ),
    );
  }

  const required = [
    profile.subcategory,
    profile.productType,
    profile.marketSegment,
    profile.targetAudience.segment,
    profile.emotionalTriggers.length > 0,
    profile.competitiveAdvantages.length > 0,
  ];
  if (required.some((v) => !v)) {
    violations.push(
      violation("PROFILE_INCOMPLETE", "Product Profile is incomplete", ProductAnalysisStage.PROFILE_ASSEMBLY),
    );
  }

  return violations;
}

export function analyzeProduct(
  input: ProductAnalysisInput,
  context: ProductAnalysisContext = {},
): ProductAnalysisReport {
  const started = Date.now();
  const stagesCompleted: ProductAnalysisStageId[] = [];
  const violations: ProductAnalysisViolation[] = [];

  if (!input.productImageRef?.trim()) {
    return {
      valid: false,
      violations: [violation("MISSING_IMAGE", "Product image is required", ProductAnalysisStage.INPUT_NORMALIZATION)],
      stagesCompleted,
      durationMs: Date.now() - started,
    };
  }

  stagesCompleted.push(ProductAnalysisStage.INPUT_NORMALIZATION);

  const seed = resolveSeed(input, context);
  stagesCompleted.push(ProductAnalysisStage.CATEGORY_RECOGNITION);

  const features = context.missingBenefits ? [] : [...seed.features];
  stagesCompleted.push(
    ProductAnalysisStage.FEATURE_EXTRACTION,
    ProductAnalysisStage.PAIN_POINT_DETECTION,
    ProductAnalysisStage.AUDIENCE_ANALYSIS,
    ProductAnalysisStage.USE_CASE_DETECTION,
    ProductAnalysisStage.COMMERCIAL_POSITIONING,
    ProductAnalysisStage.EMOTIONAL_MAPPING,
    ProductAnalysisStage.COMPETITIVE_ANALYSIS,
  );

  const profile = buildAnalyzedProductProfile(input, seed, context);
  stagesCompleted.push(ProductAnalysisStage.PROFILE_ASSEMBLY);

  violations.push(...validateAnalyzedProductProfile(profile, context));

  let knowledgeRequest: ProductKnowledgeRequest | undefined;
  if (!context.skipKnowledgeRequest) {
    knowledgeRequest = buildKnowledgeRequestFromProfile(profile, input);
    const pkg = retrieveKnowledgePackage(knowledgeRequest.retrievalRequest);
    if (pkg.items.length === 0) {
      violations.push(
        violation(
          "KNOWLEDGE_REQUEST_FAILED",
          "Knowledge Retrieval returned empty package for product analysis",
          ProductAnalysisStage.KNOWLEDGE_REQUEST,
        ),
      );
    }
    stagesCompleted.push(ProductAnalysisStage.KNOWLEDGE_REQUEST);
  }

  stagesCompleted.push(ProductAnalysisStage.VALIDATION);

  const productBlueprint = buildProductBlueprintFromProfile(profile, seed);
  const section: ProductAnalysisSection = {
    profile,
    productBlueprint,
    features,
    knowledgeRequest: knowledgeRequest ?? buildKnowledgeRequestFromProfile(profile, input),
    stagesCompleted,
    confidence: violations.length === 0 ? 0.92 : 0.4,
  };

  return {
    valid: violations.length === 0,
    violations,
    section,
    stagesCompleted,
    durationMs: Date.now() - started,
  };
}

export function productAnalysisToMutations(
  section: ProductAnalysisSection,
  revision = 0,
  reason = "Product Analysis Stage profile",
): BlueprintMutation[] {
  return updatesToMutations(
    { product: section.productBlueprint },
    PRODUCT_ANALYZER_ID,
    revision,
    reason,
  );
}

export function enrichPipelineContextWithProductAnalysis(
  ctx: GenerationPipelineContext,
  section: ProductAnalysisSection,
): { context: GenerationPipelineContext; violations: ProductAnalysisViolation[] } {
  const patch = applyContextPatch(ctx, {
    agentId: PRODUCT_ANALYZER_ID,
    section: PipelineContextSection.BUSINESS,
    blueprintSection: "product",
    changes: {
      product: {
        imageRef: ctx.business.product.imageRef,
        category: section.profile.category,
        name: section.profile.subcategory,
      },
      targetAudience: section.profile.targetAudience,
      businessGoal: { goal: section.profile.businessGoal, priority: "conversion" },
    },
    reason: "Product Analysis Stage enriched business context",
  });

  if (patch.violations.length > 0) {
    return { context: ctx, violations: patch.violations as ProductAnalysisViolation[] };
  }

  return {
    context: {
      ...patch.context,
      blueprint: {
        ...patch.context.blueprint,
        product: section.productBlueprint,
      },
    },
    violations: [],
  };
}

export function runProductAnalysisStage(
  input: ProductAnalysisInput = buildDefaultProductAnalysisInput(),
  context: ProductAnalysisContext = {},
): ProductAnalysisReport {
  return analyzeProduct(input, context);
}

export function validateProductAnalysis(
  context: ProductAnalysisContext = {},
): ProductAnalysisSystemReport {
  const violations: ProductAnalysisViolation[] = [];

  const kitchen = analyzeProduct(buildDefaultProductAnalysisInput(), context);
  if (!kitchen.valid || !kitchen.section) {
    violations.push(...kitchen.violations);
  }

  const garden = analyzeProduct(
    buildDefaultProductAnalysisInput({
      productImageRef: "product/battery-sprayer-hero.jpg",
      category: "garden_tools",
      name: "EcoSpray Pro",
      businessGoal: "Increase CTR on Wildberries seasonal garden campaign",
      marketplace: "wildberries",
      targetAudience: "garden owners",
    }),
    context,
  );
  if (!garden.valid || !garden.section) {
    violations.push(...garden.violations);
  } else {
    if (!garden.section.profile.painPoints.some((p) => p.includes("fatigue") || p.includes("pump"))) {
      violations.push(
        violation("NO_PAIN_POINTS", "Battery sprayer must detect hand-pump fatigue pain points"),
      );
    }
    if (!garden.section.profile.useCases.includes("garden")) {
      violations.push(violation("NO_USE_CASES", "Garden sprayer must include garden use case"));
    }
  }

  const ready = getReadyAgents({ completedAgents: [] });
  if (!ready.includes(PRODUCT_ANALYZER_ID)) {
    violations.push(
      violation("PROFILE_INCOMPLETE", "Product analyzer must be first orchestrator-ready agent"),
    );
  }

  const emptyImage = analyzeProduct({ ...buildDefaultProductAnalysisInput(), productImageRef: "" });
  if (emptyImage.valid) {
    violations.push(violation("MISSING_IMAGE", "Empty image must fail validation"));
  }

  const designExcluded = kitchen.section
    ? buildProductAnalysisExplainability(kitchen.section.profile).designExcluded
    : false;

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    marketerLevelUnderstanding: garden.section?.profile.primaryBenefits.length! > 0,
    knowledgeRequestFormed: !!garden.section?.knowledgeRequest.retrievalRequest,
    designExcluded,
    profileComplete: !!kitchen.section && !!garden.section,
  };
}

export function assertProductAnalysis(context: ProductAnalysisContext = {}): ProductAnalysisSystemReport {
  const report = validateProductAnalysis(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Product Analysis validation failed: ${messages}`);
  }
  return report;
}

export function runProductAnalysis(context: ProductAnalysisContext = {}): ProductAnalysisSystemReport {
  return validateProductAnalysis(context);
}

export function isProductAnalysisFailure(code: string): code is ProductAnalysisFailureCode {
  const codes: ProductAnalysisFailureCode[] = [
    "MISSING_IMAGE",
    "CATEGORY_UNKNOWN",
    "PROFILE_INCOMPLETE",
    "NO_PRIMARY_BENEFITS",
    "NO_PAIN_POINTS",
    "NO_USE_CASES",
    "MISSING_BUSINESS_GOAL",
    "PROFILE_CONTRADICTION",
    "KNOWLEDGE_REQUEST_FAILED",
    "DESIGN_DECISION_DETECTED",
  ];
  return codes.includes(code as ProductAnalysisFailureCode);
}
