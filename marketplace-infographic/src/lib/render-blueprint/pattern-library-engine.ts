/**
 * Chapter 5.14 — Pattern Library engine.
 * Centralized library of proven design decision patterns for commercial infographics.
 */
import { CompositionPatternId } from "./composition-knowledge-types";
import { MarketplaceImageContext, MarketplaceKnowledgeId } from "./marketplace-knowledge-types";
import {
  BusinessPatternGoal,
  PatternLibraryCategory,
  StoryPatternKind,
  type BusinessPatternGoalId,
  type DesignPattern,
  type PatternBlendResult,
  type PatternBlueprintCheck,
  type PatternBlueprintValidation,
  type PatternCondition,
  type PatternConstraint,
  type PatternHierarchyLevel,
  type PatternLibraryCategoryId,
  type PatternLibraryContext,
  type PatternLibraryFailureCode,
  type PatternLibraryReport,
  type PatternLibraryViolation,
  type PatternPublicationCheck,
  type PatternScoreFeedback,
  type PatternSelectionContext,
  type PatternValidationViolation,
  type StoryPatternKindId,
} from "./pattern-library-types";

export {
  PatternLibraryCategory,
  BusinessPatternGoal,
  StoryPatternKind,
  type PatternLibraryCategoryId,
  type BusinessPatternGoalId,
  type StoryPatternKindId,
  type PatternCondition,
  type PatternConstraint,
  type DesignPattern,
  type PatternHierarchyLevel,
  type PatternSelectionContext,
  type PatternBlendResult,
  type PatternScoreFeedback,
  type PatternPublicationCheck,
  type PatternBlueprintCheck,
  type PatternValidationViolation,
  type PatternBlueprintValidation,
  type PatternLibraryContext,
  type PatternLibraryViolation,
  type PatternLibraryReport,
  type PatternLibraryFailureCode,
} from "./pattern-library-types";

export const PATTERN_LIBRARY_VERSION = "5.14.0";

export const PATTERN_LIBRARY_GOLDEN_RULE =
  "Pattern Library stores experience — not images. Each pattern is a formalized design decision " +
  "that has already proven effectiveness. Reusing successful decisions lets Design AI evolve faster " +
  "than systems that start every card from scratch.";

export const MIN_SUCCESS_RATE_FOR_PUBLICATION = 0.5;

export const MIN_PATTERN_CONFIDENCE = 0.7;

export const PATTERN_HIERARCHY: readonly PatternHierarchyLevel[] = [
  {
    rank: 1,
    category: PatternLibraryCategory.BUSINESS,
    description: "Defines commercial strategy for the card",
    drives: "All other pattern levels serve the business goal",
  },
  {
    rank: 2,
    category: PatternLibraryCategory.STORY,
    description: "Describes the product narrative scenario",
    drives: "Composition, photography, and typography patterns",
  },
  {
    rank: 3,
    category: PatternLibraryCategory.COMPOSITION,
    description: "Defines element placement and visual flow",
    drives: "Photography framing and text zones",
  },
  {
    rank: 4,
    category: PatternLibraryCategory.PHOTOGRAPHY,
    description: "Lighting, camera, depth, and environment schemes",
    drives: "Material demonstration and realism",
  },
  {
    rank: 5,
    category: PatternLibraryCategory.TYPOGRAPHY,
    description: "Text hierarchy, blocks, badges, and CTA structure",
    drives: "Overlay Engine text layout",
  },
  {
    rank: 6,
    category: PatternLibraryCategory.MARKETPLACE,
    description: "Platform-specific presentation conventions",
    drives: "Final adaptation per marketplace rules",
  },
] as const;

function cond(
  field: string,
  operator: PatternCondition["operator"],
  value: string | number | string[],
): PatternCondition {
  return { field, operator, value };
}

function pattern(partial: DesignPattern): DesignPattern {
  return partial;
}

function constraint(id: string, rule: string, blockedWhen: PatternCondition[]): PatternConstraint {
  return { id, rule, blockedWhen };
}

export const SEED_DESIGN_PATTERNS: readonly DesignPattern[] = [
  pattern({
    id: "biz-attention-capture",
    name: "Attention Capture",
    category: PatternLibraryCategory.BUSINESS,
    purpose: "Win scroll attention on marketplace grid",
    conditions: [cond("businessGoal", "eq", BusinessPatternGoal.ATTENTION)],
    layout: "hero_dominant_high_contrast",
    confidence: 0.95,
    usageCount: 120,
    successRate: 0.82,
    explainable: "Large hero and contrast proven to increase card pause rate",
    businessGoal: BusinessPatternGoal.ATTENTION,
    blendableWith: ["comp-centered-hero", "mkt-wildberries-hero-usp"],
  }),
  pattern({
    id: "biz-trust-building",
    name: "Trust Building",
    category: PatternLibraryCategory.BUSINESS,
    purpose: "Increase perceived credibility before specs are read",
    conditions: [cond("businessGoal", "eq", BusinessPatternGoal.TRUST)],
    layout: "clean_professional_minimal_noise",
    confidence: 0.93,
    usageCount: 98,
    successRate: 0.79,
    explainable: "Clean professional visuals correlate with higher trust scores",
    businessGoal: BusinessPatternGoal.TRUST,
    blendableWith: ["photo-premium-lighting", "mkt-amazon-minimal-product"],
  }),
  pattern({
    id: "biz-benefits-demo",
    name: "Benefits Demonstration",
    category: PatternLibraryCategory.BUSINESS,
    purpose: "Show key product advantages clearly",
    conditions: [cond("businessGoal", "eq", BusinessPatternGoal.BENEFITS)],
    layout: "structured_benefit_blocks",
    confidence: 0.91,
    usageCount: 145,
    successRate: 0.77,
    explainable: "Structured benefit blocks improve comprehension on dense marketplaces",
    businessGoal: BusinessPatternGoal.BENEFITS,
    blendableWith: ["comp-feature-grid", "mkt-ozon-structured-benefits"],
  }),
  pattern({
    id: "biz-value-perception",
    name: "Value Perception",
    category: PatternLibraryCategory.BUSINESS,
    purpose: "Increase perceived product value through visual quality",
    conditions: [cond("businessGoal", "eq", BusinessPatternGoal.VALUE)],
    layout: "premium_spacing_restrained_palette",
    confidence: 0.9,
    usageCount: 76,
    successRate: 0.81,
    explainable: "Premium spacing and restrained palette raise perceived value",
    businessGoal: BusinessPatternGoal.VALUE,
    blendableWith: ["story-premium-showcase", "photo-premium-lighting"],
  }),
  pattern({
    id: "story-product-hero",
    name: "Product Hero Story",
    category: PatternLibraryCategory.STORY,
    purpose: "Product as undisputed visual protagonist",
    conditions: [cond("storyKind", "eq", StoryPatternKind.PRODUCT_HERO)],
    layout: "single_hero_narrative",
    confidence: 0.96,
    usageCount: 210,
    successRate: 0.84,
    explainable: "Hero product story is default high-conversion narrative for main images",
    storyKind: StoryPatternKind.PRODUCT_HERO,
    blendableWith: ["comp-centered-hero", "comp-large-product-focus", "photo-premium-lighting"],
  }),
  pattern({
    id: "story-problem-solution",
    name: "Problem Solution Story",
    category: PatternLibraryCategory.STORY,
    purpose: "Show problem state then product as solution",
    conditions: [cond("storyKind", "eq", StoryPatternKind.PROBLEM_SOLUTION)],
    layout: "before_after_flow",
    confidence: 0.88,
    usageCount: 54,
    successRate: 0.73,
    explainable: "Problem-solution framing accelerates functional purchase motivation",
    storyKind: StoryPatternKind.PROBLEM_SOLUTION,
    blendableWith: ["comp-lifestyle-split", "typo-hierarchy-headline"],
  }),
  pattern({
    id: "story-lifestyle",
    name: "Lifestyle Story",
    category: PatternLibraryCategory.STORY,
    purpose: "Product shown in real-life usage context",
    conditions: [cond("storyKind", "eq", StoryPatternKind.LIFESTYLE)],
    layout: "contextual_scene_narrative",
    confidence: 0.9,
    usageCount: 132,
    successRate: 0.78,
    explainable: "Lifestyle context speeds recognition and emotional connection",
    storyKind: StoryPatternKind.LIFESTYLE,
    constraints: [
      constraint(
        "no-amazon-main-lifestyle",
        "Lifestyle story not suitable for most Amazon main images",
        [cond("marketplace", "eq", MarketplaceKnowledgeId.AMAZON), cond("imageContext", "eq", MarketplaceImageContext.MAIN_IMAGE)],
      ),
    ],
    blendableWith: ["comp-lifestyle-split", "photo-soft-lifestyle"],
  }),
  pattern({
    id: "story-premium-showcase",
    name: "Premium Showcase",
    category: PatternLibraryCategory.STORY,
    purpose: "Elevated presentation for premium positioning",
    conditions: [cond("storyKind", "eq", StoryPatternKind.PREMIUM_SHOWCASE)],
    layout: "luxury_negative_space_elegant",
    confidence: 0.89,
    usageCount: 48,
    successRate: 0.8,
    explainable: "Premium showcase increases perceived value for mid-to-premium tiers",
    storyKind: StoryPatternKind.PREMIUM_SHOWCASE,
    constraints: [
      constraint(
        "no-budget-premium",
        "Luxury pattern not used for budget categories",
        [cond("priceTier", "eq", "budget")],
      ),
    ],
    blendableWith: ["photo-premium-lighting", "typo-hierarchy-headline"],
  }),
  pattern({
    id: "comp-centered-hero",
    name: "Centered Hero",
    category: PatternLibraryCategory.COMPOSITION,
    purpose: "Product centered as dominant focal point",
    conditions: [],
    layout: CompositionPatternId.CENTERED_HERO,
    confidence: 0.94,
    usageCount: 188,
    successRate: 0.83,
    explainable: "Centered hero guides attention to product with symmetrical balance",
    blendableWith: ["photo-premium-lighting", "story-product-hero"],
  }),
  pattern({
    id: "comp-diagonal-composition",
    name: "Diagonal Composition",
    category: PatternLibraryCategory.COMPOSITION,
    purpose: "Dynamic diagonal flow through benefits",
    conditions: [],
    layout: CompositionPatternId.DIAGONAL_FLOW,
    confidence: 0.87,
    usageCount: 67,
    successRate: 0.74,
    explainable: "Diagonal flow creates energy for sports and lifestyle categories",
    blendableWith: ["story-lifestyle", "photo-soft-lifestyle"],
  }),
  pattern({
    id: "comp-feature-grid",
    name: "Feature Grid",
    category: PatternLibraryCategory.COMPOSITION,
    purpose: "Grid layout for multiple product features",
    conditions: [],
    layout: CompositionPatternId.FEATURE_COMPARISON,
    confidence: 0.86,
    usageCount: 91,
    successRate: 0.75,
    explainable: "Feature grid supports multi-feature product comparison",
    constraints: [
      constraint(
        "no-single-feature-grid",
        "Feature grid not recommended for single-key-feature products",
        [cond("featureCount", "lte", 1)],
      ),
    ],
    blendableWith: ["biz-benefits-demo", "mkt-ozon-structured-benefits"],
  }),
  pattern({
    id: "comp-lifestyle-split",
    name: "Lifestyle Split",
    category: PatternLibraryCategory.COMPOSITION,
    purpose: "Split frame for product and lifestyle context",
    conditions: [],
    layout: CompositionPatternId.SPLIT_LAYOUT,
    confidence: 0.88,
    usageCount: 103,
    successRate: 0.76,
    explainable: "Split layout balances product clarity with usage context",
    blendableWith: ["story-lifestyle", "story-problem-solution"],
  }),
  pattern({
    id: "comp-large-product-focus",
    name: "Large Product Focus",
    category: PatternLibraryCategory.COMPOSITION,
    purpose: "Maximum product scale with minimal distraction",
    conditions: [],
    layout: "large_hero_minimal_periphery",
    confidence: 0.92,
    usageCount: 156,
    successRate: 0.85,
    explainable: "Large product focus maximizes recognition at thumbnail scale",
    blendableWith: ["mkt-amazon-minimal-product", "mkt-wildberries-hero-usp"],
  }),
  pattern({
    id: "photo-premium-lighting",
    name: "Premium Lighting",
    category: PatternLibraryCategory.PHOTOGRAPHY,
    purpose: "Soft premium lighting for elevated product perception",
    conditions: [],
    layout: "soft_key_fill_rim",
    confidence: 0.91,
    usageCount: 84,
    successRate: 0.8,
    explainable: "Premium three-point lighting signals quality and trust",
    blendableWith: ["story-premium-showcase", "comp-centered-hero", "story-product-hero"],
  }),
  pattern({
    id: "photo-soft-lifestyle",
    name: "Soft Lifestyle Lighting",
    category: PatternLibraryCategory.PHOTOGRAPHY,
    purpose: "Warm natural lighting for lifestyle scenes",
    conditions: [],
    layout: "warm_natural_ambient",
    confidence: 0.89,
    usageCount: 72,
    successRate: 0.77,
    explainable: "Warm lifestyle lighting supports comfort and home categories",
    blendableWith: ["story-lifestyle", "comp-lifestyle-split"],
  }),
  pattern({
    id: "photo-technical-detail",
    name: "Technical Detail",
    category: PatternLibraryCategory.PHOTOGRAPHY,
    purpose: "Sharp detail shots for specs and materials",
    conditions: [cond("storyKind", "eq", StoryPatternKind.TECHNICAL_EXPLANATION)],
    layout: "macro_sharp_depth_controlled",
    confidence: 0.87,
    usageCount: 59,
    successRate: 0.74,
    explainable: "Technical detail photography supports rational evaluation stage",
    storyKind: StoryPatternKind.TECHNICAL_EXPLANATION,
    blendableWith: ["comp-feature-grid", "typo-hierarchy-headline"],
  }),
  pattern({
    id: "typo-hierarchy-headline",
    name: "Headline Hierarchy",
    category: PatternLibraryCategory.TYPOGRAPHY,
    purpose: "Clear headline → benefit → supporting text hierarchy",
    conditions: [],
    layout: "headline_primary_supporting",
    confidence: 0.93,
    usageCount: 201,
    successRate: 0.81,
    explainable: "Headline hierarchy ensures instant message comprehension",
    blendableWith: ["biz-attention-capture", "mkt-wildberries-hero-usp"],
  }),
  pattern({
    id: "typo-cta-badge",
    name: "CTA Badge Layout",
    category: PatternLibraryCategory.TYPOGRAPHY,
    purpose: "Structured badges and call-to-action zones",
    conditions: [],
    layout: "badge_zones_cta_corners",
    confidence: 0.85,
    usageCount: 63,
    successRate: 0.72,
    explainable: "Badge and CTA zones reserve marketplace-safe overlay areas",
    blendableWith: ["mkt-ozon-structured-benefits", "biz-benefits-demo"],
  }),
  pattern({
    id: "mkt-wildberries-hero-usp",
    name: "Wildberries Hero USP",
    category: PatternLibraryCategory.MARKETPLACE,
    purpose: "Large hero product with bright readable USP for Wildberries",
    conditions: [cond("marketplace", "eq", MarketplaceKnowledgeId.WILDBERRIES)],
    layout: "wb_large_hero_bright_usp",
    confidence: 0.94,
    usageCount: 167,
    successRate: 0.83,
    explainable: "WB grid favors large hero and high-contrast USP readability",
    marketplaceId: MarketplaceKnowledgeId.WILDBERRIES,
    blendableWith: ["comp-large-product-focus", "typo-hierarchy-headline"],
  }),
  pattern({
    id: "mkt-amazon-minimal-product",
    name: "Amazon Minimal Product",
    category: PatternLibraryCategory.MARKETPLACE,
    purpose: "Minimal clean composition with maximum product focus for Amazon",
    conditions: [cond("marketplace", "eq", MarketplaceKnowledgeId.AMAZON)],
    layout: "amazon_minimal_clean_hero",
    confidence: 0.95,
    usageCount: 142,
    successRate: 0.86,
    explainable: "Amazon main images require clean minimal product-dominant presentation",
    marketplaceId: MarketplaceKnowledgeId.AMAZON,
    blendableWith: ["comp-centered-hero", "comp-large-product-focus"],
  }),
  pattern({
    id: "mkt-ozon-structured-benefits",
    name: "Ozon Structured Benefits",
    category: PatternLibraryCategory.MARKETPLACE,
    purpose: "Information-rich structured benefit presentation for Ozon",
    conditions: [cond("marketplace", "eq", MarketplaceKnowledgeId.OZON)],
    layout: "ozon_structured_benefit_blocks",
    confidence: 0.92,
    usageCount: 118,
    successRate: 0.78,
    explainable: "Ozon buyers expect structured benefit demonstration on infographics",
    marketplaceId: MarketplaceKnowledgeId.OZON,
    blendableWith: ["comp-feature-grid", "typo-cta-badge"],
  }),
] as const;

function evaluateCondition(
  condition: PatternCondition,
  ctx: Record<string, string | number | undefined>,
): boolean {
  const actual = ctx[condition.field];
  if (actual === undefined) return false;
  if (condition.operator === "eq") {
    return String(actual).toLowerCase() === String(condition.value).toLowerCase();
  }
  if (condition.operator === "gte") {
    return Number(actual) >= Number(condition.value);
  }
  if (condition.operator === "lte") {
    return Number(actual) <= Number(condition.value);
  }
  if (condition.operator === "in") {
    const values = Array.isArray(condition.value) ? condition.value : [condition.value];
    return values.map((v) => String(v).toLowerCase()).includes(String(actual).toLowerCase());
  }
  return false;
}

export function getDesignPattern(id: string): DesignPattern | undefined {
  return SEED_DESIGN_PATTERNS.find((p) => p.id === id);
}

export function getPatternHierarchy(): readonly PatternHierarchyLevel[] {
  return PATTERN_HIERARCHY;
}

export function getPatternsByCategory(category: PatternLibraryCategoryId): DesignPattern[] {
  return SEED_DESIGN_PATTERNS.filter((p) => p.category === category);
}

export function matchDesignPatterns(ctx: PatternSelectionContext): DesignPattern[] {
  const map: Record<string, string | number | undefined> = {
    category: ctx.category,
    marketplace: ctx.marketplace,
    businessGoal: ctx.businessGoal,
    storyKind: ctx.storyKind,
    styleId: ctx.styleId,
    imageContext: ctx.imageContext,
    audience: ctx.audience,
    featureCount: ctx.featureCount,
    priceTier: ctx.priceTier,
    designMemoryHint: ctx.designMemoryHint,
  };
  return SEED_DESIGN_PATTERNS.filter((p) => {
    if (p.conditions.length === 0) return true;
    return p.conditions.every((c) => evaluateCondition(c, map));
  });
}

function scorePattern(pattern: DesignPattern, ctx: PatternSelectionContext): number {
  let score = pattern.confidence * 40 + pattern.successRate * 35;
  if (ctx.businessGoal && pattern.businessGoal === ctx.businessGoal) score += 20;
  if (ctx.storyKind && pattern.storyKind === ctx.storyKind) score += 15;
  if (ctx.marketplace && pattern.marketplaceId === ctx.marketplace) score += 25;
  if (ctx.designMemoryHint && pattern.id.includes(ctx.designMemoryHint)) score += 10;
  if (ctx.category && pattern.purpose.toLowerCase().includes(ctx.category)) score += 5;
  return score;
}

export function recommendDesignPatterns(ctx: PatternSelectionContext, limit = 5): DesignPattern[] {
  const matched = matchDesignPatterns(ctx);
  const universal = SEED_DESIGN_PATTERNS.filter((p) => p.conditions.length === 0);
  const pool = [...new Map([...matched, ...universal].map((p) => [p.id, p])).values()];
  return pool
    .filter((p) => !violatesPatternConstraints(p, ctx).violated)
    .sort((a, b) => scorePattern(b, ctx) - scorePattern(a, ctx))
    .slice(0, limit);
}

export function violatesPatternConstraints(
  pattern: DesignPattern,
  ctx: PatternSelectionContext,
): { violated: boolean; constraintId?: string } {
  if (!pattern.constraints || pattern.constraints.length === 0) {
    return { violated: false };
  }
  const map: Record<string, string | number | undefined> = {
    category: ctx.category,
    marketplace: ctx.marketplace,
    imageContext: ctx.imageContext,
    priceTier: ctx.priceTier,
    featureCount: ctx.featureCount,
    businessGoal: ctx.businessGoal,
    storyKind: ctx.storyKind,
  };
  for (const c of pattern.constraints) {
    if (c.blockedWhen.every((cond) => evaluateCondition(cond, map))) {
      return { violated: true, constraintId: c.id };
    }
  }
  return { violated: false };
}

export function blendDesignPatterns(patternIds: string[]): PatternBlendResult {
  const patterns = patternIds.map((id) => getDesignPattern(id)).filter((p): p is DesignPattern => Boolean(p));
  const warnings: string[] = [];
  if (patterns.length === 0) {
    return { patternIds: [], blendedLayout: "", compatible: false, warnings: ["No valid patterns to blend"] };
  }
  if (patterns.length === 1) {
    return { patternIds: [patterns[0].id], blendedLayout: patterns[0].layout, compatible: true, warnings };
  }
  for (let i = 0; i < patterns.length; i++) {
    for (let j = i + 1; j < patterns.length; j++) {
      const a = patterns[i];
      const b = patterns[j];
      const aAllows = a.blendableWith?.includes(b.id) ?? false;
      const bAllows = b.blendableWith?.includes(a.id) ?? false;
      if (!aAllows && !bAllows) {
        warnings.push(`Patterns ${a.id} and ${b.id} are not explicitly blendable`);
      }
    }
  }
  const blendedLayout = patterns.map((p) => p.layout).join(" + ");
  return {
    patternIds: patterns.map((p) => p.id),
    blendedLayout,
    compatible: warnings.length === 0,
    warnings,
  };
}

export function scorePatternUsage(
  pattern: DesignPattern,
  feedback: PatternScoreFeedback,
): DesignPattern {
  const vision = feedback.visionScore ?? 0.5;
  const ctr = feedback.ctrPrediction ?? 0.5;
  const commercial = feedback.commercialScore ?? 0.5;
  const retryPenalty = Math.min(0.2, (feedback.retryCount ?? 0) * 0.05);
  const user = feedback.userRating ?? 0.5;
  const sampleScore = vision * 0.25 + ctr * 0.25 + commercial * 0.3 + user * 0.2 - retryPenalty;
  const newUsage = pattern.usageCount + 1;
  const newSuccess = (pattern.successRate * pattern.usageCount + sampleScore) / newUsage;
  const confidenceDelta = (sampleScore - 0.5) * 0.04;
  return {
    ...pattern,
    usageCount: newUsage,
    successRate: Math.max(0, Math.min(1, newSuccess)),
    confidence: Math.max(0, Math.min(1, pattern.confidence + confidenceDelta)),
  };
}

function checkViolation(
  code: PatternLibraryFailureCode,
  aspect: string,
  message: string,
): PatternValidationViolation {
  return { code, aspect, message };
}

function violation(
  code: PatternLibraryFailureCode,
  message: string,
  patternId?: string,
): PatternLibraryViolation {
  return { code, message, patternId };
}

export function validatePatternForPublication(check: PatternPublicationCheck): {
  valid: boolean;
  violations: PatternLibraryViolation[];
} {
  const violations: PatternLibraryViolation[] = [];
  const { pattern, existingPatterns = SEED_DESIGN_PATTERNS } = check;

  const duplicate = existingPatterns.some(
    (p) => p.id !== pattern.id && (p.layout === pattern.layout || p.name === pattern.name),
  );
  if (duplicate) {
    violations.push(violation("DUPLICATE_PATTERN", "Pattern must not duplicate existing layout or name", pattern.id));
  }

  if (!pattern.explainable || pattern.explainable.length < 10) {
    violations.push(violation("UNEXPLAINABLE_PATTERN", "Pattern must be explainable", pattern.id));
  }

  if (pattern.usageCount < 1) {
    violations.push(violation("MISSING_USAGE_STATISTICS", "Pattern requires usage statistics", pattern.id));
  }

  if (pattern.successRate < MIN_SUCCESS_RATE_FOR_PUBLICATION) {
    violations.push(violation("LOW_SUCCESS_RATE", "Success rate below publication threshold", pattern.id));
  }

  if (check.businessGoalAligned === false) {
    violations.push(violation("MISSING_BUSINESS_GOAL_ALIGNMENT", "Pattern must align with business goal", pattern.id));
  }

  if (check.compatibleWithLibrary === false) {
    violations.push(violation("INCOMPATIBLE_PATTERN_BLEND", "Pattern conflicts with library patterns", pattern.id));
  }

  return { valid: violations.length === 0, violations };
}

export function validatePatternBlueprint(check: PatternBlueprintCheck): PatternBlueprintValidation {
  const violations: PatternValidationViolation[] = [];
  const recommended = recommendDesignPatterns({
    category: check.category,
    marketplace: check.marketplace,
    businessGoal: check.businessGoal,
    imageContext: check.imageContext,
    priceTier: check.priceTier,
    featureCount: check.featureCount,
  });

  if (check.containsImageTemplate) {
    violations.push(
      checkViolation(
        "IMAGE_TEMPLATE_STORED",
        "library",
        "Pattern Library stores design decisions — not image templates",
      ),
    );
  }

  if (check.selectedPatternIds) {
    for (const id of check.selectedPatternIds) {
      const pattern = getDesignPattern(id);
      if (!pattern) {
        violations.push(
          checkViolation("UNPUBLISHED_PATTERN", "pattern", `Unknown or unpublished pattern: ${id}`),
        );
        continue;
      }
      if (pattern.successRate < MIN_SUCCESS_RATE_FOR_PUBLICATION) {
        violations.push(
          checkViolation(
            "LOW_SUCCESS_RATE",
            "successRate",
            `Pattern ${id} success rate ${pattern.successRate} below minimum`,
          ),
        );
      }
      const constraint = violatesPatternConstraints(pattern, {
        category: check.category,
        marketplace: check.marketplace,
        imageContext: check.imageContext,
        priceTier: check.priceTier,
        featureCount: check.featureCount,
        businessGoal: check.businessGoal,
      });
      if (constraint.violated) {
        violations.push(
          checkViolation(
            "PATTERN_CONSTRAINT_VIOLATION",
            "constraint",
            `Pattern ${id} violates constraint ${constraint.constraintId}`,
          ),
        );
      }
    }

    if (check.selectedPatternIds.length > 1) {
      const blend = blendDesignPatterns(check.selectedPatternIds);
      if (!blend.compatible) {
        violations.push(
          checkViolation(
            "INCOMPATIBLE_PATTERN_BLEND",
            "blend",
            `Incompatible pattern blend: ${blend.warnings.join("; ")}`,
          ),
        );
      }
    }
  }

  if (check.explainable === false) {
    violations.push(
      checkViolation("UNEXPLAINABLE_PATTERN", "explainability", "Selected patterns must be explainable"),
    );
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    retryRecommended: unique.length > 0,
    explainable: unique.every((v) => v.message.length > 0),
    recommendedPatterns: recommended,
  };
}

export function validatePatternLibrary(ctx: PatternLibraryContext = {}): PatternLibraryReport {
  const violations: PatternLibraryViolation[] = [];

  if (ctx.storesImageTemplates) {
    violations.push(violation("IMAGE_TEMPLATE_STORED", "Library must store knowledge — not image templates"));
  }
  if (ctx.duplicatePatterns) {
    violations.push(violation("DUPLICATE_PATTERN", "Duplicate patterns are not allowed"));
  }
  if (ctx.missingStatistics) {
    violations.push(violation("MISSING_USAGE_STATISTICS", "Usage statistics are required"));
  }
  if (ctx.unexplainablePatterns) {
    violations.push(violation("UNEXPLAINABLE_PATTERN", "All patterns must be explainable"));
  }
  if (ctx.ignoresCommercialEffectiveness) {
    violations.push(violation("LOW_SUCCESS_RATE", "Commercial effectiveness must be tracked"));
  }

  for (const p of SEED_DESIGN_PATTERNS) {
    if (!p.explainable || p.explainable.length < 10) {
      violations.push(violation("UNEXPLAINABLE_PATTERN", `Missing explainability: ${p.id}`, p.id));
    }
    if (p.usageCount < 1) {
      violations.push(violation("MISSING_USAGE_STATISTICS", `Missing usage count: ${p.id}`, p.id));
    }
  }

  const ids = SEED_DESIGN_PATTERNS.map((p) => p.id);
  if (new Set(ids).size !== ids.length) {
    violations.push(violation("DUPLICATE_PATTERN", "Pattern ids must be unique"));
  }

  const wb = recommendDesignPatterns({ marketplace: MarketplaceKnowledgeId.WILDBERRIES });
  const amazon = recommendDesignPatterns({ marketplace: MarketplaceKnowledgeId.AMAZON });
  if (!wb.some((p) => p.id === "mkt-wildberries-hero-usp")) {
    violations.push(violation("MISSING_BUSINESS_GOAL_ALIGNMENT", "Wildberries marketplace patterns required"));
  }
  if (!amazon.some((p) => p.id === "mkt-amazon-minimal-product")) {
    violations.push(violation("MISSING_BUSINESS_GOAL_ALIGNMENT", "Amazon marketplace patterns required"));
  }

  const lifestyleConstraint = violatesPatternConstraints(getDesignPattern("story-lifestyle")!, {
    marketplace: MarketplaceKnowledgeId.AMAZON,
    imageContext: MarketplaceImageContext.MAIN_IMAGE,
  });
  if (!lifestyleConstraint.violated) {
    violations.push(violation("PATTERN_CONSTRAINT_VIOLATION", "Lifestyle constraint must block Amazon main images"));
  }

  const gridConstraint = violatesPatternConstraints(getDesignPattern("comp-feature-grid")!, {
    featureCount: 1,
  });
  if (!gridConstraint.violated) {
    violations.push(violation("PATTERN_CONSTRAINT_VIOLATION", "Feature grid must block single-feature products"));
  }

  const blend = blendDesignPatterns(["comp-centered-hero", "photo-premium-lighting", "story-product-hero"]);
  if (!blend.compatible || !blend.blendedLayout.includes("+")) {
    violations.push(violation("INCOMPATIBLE_PATTERN_BLEND", "Known blendable patterns must combine cleanly"));
  }

  const validBlueprint = validatePatternBlueprint({
    selectedPatternIds: ["comp-centered-hero", "photo-premium-lighting"],
    marketplace: MarketplaceKnowledgeId.AMAZON,
    imageContext: MarketplaceImageContext.MAIN_IMAGE,
    businessGoal: BusinessPatternGoal.ATTENTION,
    explainable: true,
  });
  if (!validBlueprint.valid) {
    violations.push(violation("UNPUBLISHED_PATTERN", "Valid pattern blueprint must pass validation"));
  }

  const invalidBlueprint = validatePatternBlueprint({
    selectedPatternIds: ["story-lifestyle", "comp-feature-grid"],
    marketplace: MarketplaceKnowledgeId.AMAZON,
    imageContext: MarketplaceImageContext.MAIN_IMAGE,
    featureCount: 1,
    containsImageTemplate: true,
    explainable: false,
  });
  if (invalidBlueprint.valid || !invalidBlueprint.retryRecommended) {
    violations.push(violation("PATTERN_CONSTRAINT_VIOLATION", "Invalid pattern blueprint must trigger retry"));
  }

  const pubCheck = validatePatternForPublication({
    pattern: getDesignPattern("comp-centered-hero")!,
    businessGoalAligned: true,
    compatibleWithLibrary: true,
  });
  if (!pubCheck.valid) {
    violations.push(violation("UNPUBLISHED_PATTERN", "Seed patterns must pass publication validation"));
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    patterns: [...SEED_DESIGN_PATTERNS],
    hierarchy: [...PATTERN_HIERARCHY],
    goldenRuleSatisfied: unique.length === 0,
    reusableKnowledge: SEED_DESIGN_PATTERNS.every((p) => p.purpose.length > 10),
    blendCapable: blend.compatible,
    evolutionReady: true,
  };
}

export function assertPatternLibrary(ctx?: PatternLibraryContext): PatternLibraryReport {
  const report = validatePatternLibrary(ctx);
  if (!report.valid) {
    throw new Error(`Pattern library violation: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export function runPatternLibrary(input: { ctx?: PatternLibraryContext }): PatternLibraryReport {
  return validatePatternLibrary(input.ctx);
}

export function isPatternLibraryFailure(code: string): code is PatternLibraryFailureCode {
  return [
    "DUPLICATE_PATTERN",
    "IMAGE_TEMPLATE_STORED",
    "MISSING_USAGE_STATISTICS",
    "UNEXPLAINABLE_PATTERN",
    "PATTERN_CONSTRAINT_VIOLATION",
    "INCOMPATIBLE_PATTERN_BLEND",
    "MISSING_BUSINESS_GOAL_ALIGNMENT",
    "LOW_SUCCESS_RATE",
    "UNPUBLISHED_PATTERN",
  ].includes(code);
}
