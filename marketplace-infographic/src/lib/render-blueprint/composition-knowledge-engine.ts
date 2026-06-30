/**
 * Chapter 5.8 — Composition Knowledge engine.
 * Formalized spatial relationship rules for commercial infographic composition.
 */
import {
  MarketplaceKnowledgeId,
  ProductCategoryKnowledge,
} from "./marketplace-knowledge-types";
import {
  CompositionBalance,
  CompositionGrid,
  CompositionPatternId,
  CompositionPrinciple,
  type CompositionAntiPattern,
  type CompositionBlueprintCheck,
  type CompositionBlueprintValidation,
  type CompositionCondition,
  type CompositionKnowledgeContext,
  type CompositionKnowledgeFailureCode,
  type CompositionKnowledgeReport,
  type CompositionKnowledgeViolation,
  type CompositionPattern,
  type CompositionRule,
  type CompositionSelectionContext,
  type CompositionValidationViolation,
  type ReadingFlow,
  type VisualHierarchyLevel,
} from "./composition-knowledge-types";

export {
  CompositionPrinciple,
  CompositionBalance,
  CompositionGrid,
  CompositionPatternId,
  type CompositionPrincipleId,
  type CompositionBalanceId,
  type CompositionGridId,
  type CompositionPatternKind,
  type CompositionCondition,
  type CompositionRule,
  type CompositionPattern,
  type CompositionAntiPattern,
  type VisualHierarchyLevel,
  type ReadingFlow,
  type CompositionSelectionContext,
  type CompositionBlueprintCheck,
  type CompositionValidationViolation,
  type CompositionBlueprintValidation,
  type CompositionKnowledgeContext,
  type CompositionKnowledgeViolation,
  type CompositionKnowledgeReport,
  type CompositionKnowledgeFailureCode,
} from "./composition-knowledge-types";

export const COMPOSITION_KNOWLEDGE_VERSION = "5.8.0";

export const COMPOSITION_KNOWLEDGE_GOLDEN_RULE =
  "Composition is not object placement — it is human attention management. " +
  "If the user sees what the Story Director planned within the first seconds, composition is correct. " +
  "All other elements must only strengthen that first impression.";

export const VISUAL_HIERARCHY_LEVELS: readonly VisualHierarchyLevel[] = [
  { rank: 1, role: "hero_product", examples: ["product", "key feature", "main claim"] },
  { rank: 2, role: "primary_benefit", examples: ["headline benefit", "key spec"] },
  { rank: 3, role: "supporting_elements", examples: ["icons", "secondary features"] },
  { rank: 4, role: "additional_information", examples: ["footnotes", "dimensions"] },
  { rank: 5, role: "decorative_elements", examples: ["background accents", "ornaments"] },
] as const;

export const READING_FLOWS: readonly ReadingFlow[] = [
  {
    id: "western_z_pattern",
    name: "Western Z-Pattern",
    path: ["top_left", "center", "bottom_right"],
    regions: ["default", "us", "eu"],
  },
  {
    id: "center_radiating",
    name: "Center Radiating",
    path: ["center", "primary_ring", "periphery"],
    regions: ["hero_focused"],
  },
] as const;

function rule(partial: CompositionRule): CompositionRule {
  return partial;
}

function cond(
  field: string,
  operator: CompositionCondition["operator"],
  value: string | number | string[],
): CompositionCondition {
  return { field, operator, value };
}

export const SEED_COMPOSITION_RULES: readonly CompositionRule[] = [
  rule({
    id: "hero-focal-point",
    name: "Hero Focal Point",
    principle: CompositionPrinciple.FOCAL_POINT,
    conditions: [cond("hasHeroObject", "eq", "true")],
    recommendation: "Establish a single dominant hero object as the primary attention anchor",
    confidence: 0.95,
    examples: ["centered product hero", "single SKU main image"],
  }),
  rule({
    id: "visual-hierarchy-order",
    name: "Visual Hierarchy Order",
    principle: CompositionPrinciple.HIERARCHY,
    conditions: [],
    recommendation: "Order elements: hero product → primary benefit → supporting → additional → decorative",
    confidence: 0.93,
    examples: ["infographic benefit stack", "Amazon secondary image flow"],
  }),
  rule({
    id: "negative-space-premium",
    name: "Premium Negative Space",
    principle: CompositionPrinciple.NEGATIVE_SPACE,
    conditions: [cond("styleId", "in", ["minimal", "minimal-luxury", "luxury", "premium"])],
    recommendation: "Reserve generous negative space to reduce cognitive load and increase premium perception",
    confidence: 0.9,
    examples: ["luxury cosmetics layout", "minimal electronics hero"],
  }),
  rule({
    id: "rule-of-thirds-advisory",
    name: "Rule of Thirds Advisory",
    principle: CompositionPrinciple.RULE_OF_THIRDS,
    conditions: [cond("patternComplexity", "eq", "simple")],
    recommendation: "Apply rule of thirds when no stronger compositional structure is required",
    confidence: 0.75,
    examples: ["lifestyle product offset", "single hero offset placement"],
  }),
  rule({
    id: "golden-ratio-premium",
    name: "Golden Ratio Premium",
    principle: CompositionPrinciple.GOLDEN_RATIO,
    conditions: [cond("styleId", "in", ["luxury", "minimal-luxury", "premium"])],
    recommendation: "Use golden ratio grid only when it measurably improves premium perception",
    confidence: 0.82,
    examples: ["premium watch layout", "jewelry hero framing"],
  }),
  rule({
    id: "asymmetrical-dynamic",
    name: "Asymmetrical Dynamic Balance",
    principle: CompositionPrinciple.BALANCE,
    conditions: [cond("storyEnergy", "in", ["dynamic", "sports", "lifestyle"])],
    recommendation: "Use asymmetrical balance for energetic lifestyle and sports narratives",
    confidence: 0.84,
    examples: ["sports product diagonal flow", "action lifestyle scene"],
  }),
  rule({
    id: "symmetrical-trust",
    name: "Symmetrical Trust Balance",
    principle: CompositionPrinciple.BALANCE,
    conditions: [cond("category", "in", ["medical", "technical", ProductCategoryKnowledge.ELECTRONICS])],
    recommendation: "Use symmetrical balance to convey precision, trust, and reliability",
    confidence: 0.86,
    examples: ["medical device layout", "technical spec infographic"],
  }),
  rule({
    id: "reading-flow-western",
    name: "Western Reading Flow",
    principle: CompositionPrinciple.READING_FLOW,
    conditions: [cond("region", "in", ["default", "us", "eu"])],
    recommendation: "Place hero and primary benefit along top-left → center → bottom-right gaze path",
    confidence: 0.88,
    examples: ["Western marketplace infographic", "Amazon A+ content flow"],
  }),
  rule({
    id: "visual-weight-routing",
    name: "Visual Weight Routing",
    principle: CompositionPrinciple.VISUAL_WEIGHT,
    conditions: [],
    recommendation: "Distribute size, contrast, color, and brightness to guide attention along planned route",
    confidence: 0.91,
    examples: ["hero largest weight", "decorative lowest weight"],
  }),
  rule({
    id: "marketplace-safe-zones",
    name: "Marketplace Safe Zones",
    principle: CompositionPrinciple.GRID,
    conditions: [
      cond("marketplace", "in", [
        MarketplaceKnowledgeId.AMAZON,
        MarketplaceKnowledgeId.OZON,
        MarketplaceKnowledgeId.WILDBERRIES,
      ]),
    ],
    recommendation: "Respect overlay zones, safe margins, and marketplace badge areas",
    confidence: 0.94,
    examples: ["WB badge reserve", "Ozon text readability zone"],
  }),
] as const;

export const COMPOSITION_PATTERNS: readonly CompositionPattern[] = [
  {
    id: CompositionPatternId.CENTERED_HERO,
    name: "Centered Hero",
    description: "Product centered as dominant focal point with radial hierarchy",
    recommendedFor: ["main_image", "single_product", ProductCategoryKnowledge.ELECTRONICS],
    heroProductRatio: { min: 0.55, max: 0.85 },
    negativeSpace: "medium",
    balance: CompositionBalance.SYMMETRICAL,
    grid: CompositionGrid.GRID_3X3,
  },
  {
    id: CompositionPatternId.DIAGONAL_FLOW,
    name: "Diagonal Flow",
    description: "Dynamic diagonal movement guiding eye through benefits",
    recommendedFor: ["sports", "lifestyle", ProductCategoryKnowledge.SPORTS],
    heroProductRatio: { min: 0.4, max: 0.65 },
    negativeSpace: "low",
    balance: CompositionBalance.ASYMMETRICAL,
    grid: CompositionGrid.MODULAR,
  },
  {
    id: CompositionPatternId.SPLIT_LAYOUT,
    name: "Split Layout",
    description: "Frame divided for product and benefit information",
    recommendedFor: ["infographic", "feature_list"],
    heroProductRatio: { min: 0.35, max: 0.55 },
    negativeSpace: "medium",
    balance: CompositionBalance.ASYMMETRICAL,
    grid: CompositionGrid.GRID_2X2,
  },
  {
    id: CompositionPatternId.LIFESTYLE_FOCUS,
    name: "Lifestyle Focus",
    description: "Product within contextual scene showing use case and scale",
    recommendedFor: ["furniture", "kitchen", ProductCategoryKnowledge.FURNITURE, ProductCategoryKnowledge.KITCHEN],
    heroProductRatio: { min: 0.25, max: 0.5 },
    negativeSpace: "high",
    balance: CompositionBalance.ASYMMETRICAL,
    grid: CompositionGrid.OVERLAY,
  },
  {
    id: CompositionPatternId.FEATURE_COMPARISON,
    name: "Feature Comparison",
    description: "Side-by-side or grid comparison of product features",
    recommendedFor: ["electronics", "technical", "infographic"],
    heroProductRatio: { min: 0.3, max: 0.45 },
    negativeSpace: "low",
    balance: CompositionBalance.SYMMETRICAL,
    grid: CompositionGrid.MODULAR,
  },
  {
    id: CompositionPatternId.EXPLODED_VIEW,
    name: "Exploded View",
    description: "Product components separated to show internal features",
    recommendedFor: ["technical", "tools", ProductCategoryKnowledge.ELECTRONICS],
    heroProductRatio: { min: 0.4, max: 0.6 },
    negativeSpace: "medium",
    balance: CompositionBalance.SYMMETRICAL,
    grid: CompositionGrid.GOLDEN_RATIO,
  },
] as const;

export const COMPOSITION_ANTI_PATTERNS: readonly CompositionAntiPattern[] = [
  {
    id: "overcrowded-frame",
    name: "Overcrowded Frame",
    description: "Too many elements competing for attention",
    detectionHints: ["high element count", "low negative space", "multiple equal weights"],
  },
  {
    id: "missing-hero",
    name: "Missing Hero Object",
    description: "No clear primary subject in composition",
    detectionHints: ["no hero object", "equal visual weights"],
  },
  {
    id: "competing-foci",
    name: "Competing Foci",
    description: "Multiple elements claim primary attention",
    detectionHints: ["competingFoci > 1", "dual hero objects"],
  },
  {
    id: "poor-negative-space",
    name: "Poor Negative Space",
    description: "Insufficient breathing room reduces readability",
    detectionHints: ["negativeSpaceRatio < 0.15", "premium style with clutter"],
  },
  {
    id: "visual-chaos",
    name: "Visual Chaos",
    description: "Random placement without hierarchy or flow",
    detectionHints: ["no hierarchy order", "illogical reading flow"],
  },
  {
    id: "unbalanced-composition",
    name: "Unbalanced Composition",
    description: "Visual weight distributed without intentional balance",
    detectionHints: ["lopsided weight", "unintentional asymmetry"],
  },
] as const;

export const ADAPTIVE_HERO_RATIOS: Record<string, { min: number; max: number }> = {
  small: { min: 0.5, max: 0.65 },
  medium: { min: 0.4, max: 0.55 },
  large: { min: 0.25, max: 0.45 },
};

function violation(
  code: CompositionKnowledgeViolation["code"],
  message: string,
  ruleId?: string,
): CompositionKnowledgeViolation {
  return { code, message, ruleId };
}

function checkViolation(
  code: CompositionKnowledgeFailureCode,
  aspect: string,
  message: string,
): CompositionValidationViolation {
  return { code, aspect, message };
}

export function getCompositionRule(ruleId: string): CompositionRule | undefined {
  return SEED_COMPOSITION_RULES.find((r) => r.id === ruleId);
}

export function getCompositionPattern(patternId: string): CompositionPattern | undefined {
  return COMPOSITION_PATTERNS.find((p) => p.id === patternId);
}

export function getVisualHierarchy(): readonly VisualHierarchyLevel[] {
  return VISUAL_HIERARCHY_LEVELS;
}

export function getReadingFlow(flowId: string): ReadingFlow | undefined {
  return READING_FLOWS.find((f) => f.id === flowId);
}

function evaluateRuleCondition(
  condition: CompositionCondition,
  ctx: Record<string, string | number | boolean | undefined>,
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

export function matchCompositionRules(
  ctx: Record<string, string | number | boolean | undefined>,
): CompositionRule[] {
  return SEED_COMPOSITION_RULES.filter((r) => {
    if (r.conditions.length === 0) return true;
    return r.conditions.every((c) => evaluateRuleCondition(c, ctx));
  });
}

export function recommendCompositionPattern(
  ctx: CompositionSelectionContext,
): CompositionPattern | undefined {
  let best: CompositionPattern | undefined;
  let bestScore = -1;

  for (const pattern of COMPOSITION_PATTERNS) {
    let score = 0;
    if (ctx.category && pattern.recommendedFor.some((r) => ctx.category!.toLowerCase().includes(r))) {
      score += 30;
    }
    if (ctx.infographicType && pattern.recommendedFor.includes(ctx.infographicType)) {
      score += 20;
    }
    if (ctx.productSize === "large" && pattern.id === CompositionPatternId.LIFESTYLE_FOCUS) score += 25;
    if (ctx.productSize === "small" && pattern.id === CompositionPatternId.CENTERED_HERO) score += 25;
    if (ctx.informationDensity === "high" && pattern.id === CompositionPatternId.FEATURE_COMPARISON) {
      score += 15;
    }
    if (score > bestScore) {
      bestScore = score;
      best = pattern;
    }
  }

  return best ?? COMPOSITION_PATTERNS[0];
}

export function getAdaptiveHeroRatio(productSize: "small" | "medium" | "large" = "medium"): {
  min: number;
  max: number;
} {
  return ADAPTIVE_HERO_RATIOS[productSize];
}

export function detectAntiPatterns(check: CompositionBlueprintCheck): CompositionAntiPattern[] {
  const detected: CompositionAntiPattern[] = [];

  if (!check.hasHeroObject) {
    detected.push(COMPOSITION_ANTI_PATTERNS.find((a) => a.id === "missing-hero")!);
  }
  if (check.overcrowded) {
    detected.push(COMPOSITION_ANTI_PATTERNS.find((a) => a.id === "overcrowded-frame")!);
  }
  if ((check.competingFoci ?? 0) > 1) {
    detected.push(COMPOSITION_ANTI_PATTERNS.find((a) => a.id === "competing-foci")!);
  }
  if (check.negativeSpaceRatio !== undefined && check.negativeSpaceRatio < 0.15) {
    detected.push(COMPOSITION_ANTI_PATTERNS.find((a) => a.id === "poor-negative-space")!);
  }
  if (!check.hierarchyOrder || check.hierarchyOrder.length < 2) {
    detected.push(COMPOSITION_ANTI_PATTERNS.find((a) => a.id === "visual-chaos")!);
  }

  return detected.filter(Boolean);
}

function hierarchyIsValid(order?: string[]): boolean {
  if (!order || order.length < 2) return false;
  const heroIdx = order.findIndex((r) => r.includes("hero"));
  const decorIdx = order.findIndex((r) => r.includes("decorative"));
  if (heroIdx < 0) return false;
  if (decorIdx >= 0 && decorIdx <= heroIdx) return false;
  return true;
}

export function validateCompositionBlueprint(
  check: CompositionBlueprintCheck,
): CompositionBlueprintValidation {
  const violations: CompositionValidationViolation[] = [];

  if (!check.hasHeroObject) {
    violations.push(
      checkViolation("MISSING_HERO_OBJECT", "hero", "Composition must have a hero object"),
    );
  }

  if (!hierarchyIsValid(check.hierarchyOrder)) {
    violations.push(
      checkViolation(
        "HIERARCHY_VIOLATED",
        "hierarchy",
        "Visual hierarchy must start with hero product before supporting elements",
      ),
    );
  }

  const antiPatterns = detectAntiPatterns(check);
  for (const ap of antiPatterns) {
    violations.push(checkViolation("ANTI_PATTERN_DETECTED", ap.id, ap.description));
  }

  if (check.patternId) {
    const pattern = getCompositionPattern(check.patternId);
    if (!pattern) {
      violations.push(checkViolation("UNKNOWN_PATTERN", "pattern", `Unknown pattern: ${check.patternId}`));
    } else if (check.heroProductRatio !== undefined) {
      if (
        check.heroProductRatio < pattern.heroProductRatio.min ||
        check.heroProductRatio > pattern.heroProductRatio.max
      ) {
        violations.push(
          checkViolation(
            "HIERARCHY_VIOLATED",
            "heroRatio",
            `Hero ratio ${check.heroProductRatio} outside pattern range ${pattern.heroProductRatio.min}-${pattern.heroProductRatio.max}`,
          ),
        );
      }
    }
  }

  if (
    check.styleId &&
    ["minimal", "minimal-luxury", "luxury"].includes(check.styleId) &&
    check.negativeSpaceRatio !== undefined &&
    check.negativeSpaceRatio < 0.2
  ) {
    violations.push(
      checkViolation(
        "NEGATIVE_SPACE_VIOLATED",
        "negativeSpace",
        "Premium/minimal styles require adequate negative space",
      ),
    );
  }

  if (
    check.storyPrimaryFocus &&
    check.firstAttentionTarget &&
    check.storyPrimaryFocus !== check.firstAttentionTarget
  ) {
    violations.push(
      checkViolation(
        "STORY_CONTRADICTION",
        "story",
        `First attention target ${check.firstAttentionTarget} contradicts story focus ${check.storyPrimaryFocus}`,
      ),
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
  };
}

export function applyCompositionLearningFeedback(
  rules: CompositionRule[],
  feedback: { ruleId: string; visionScore?: number; commercialScore?: number },
): CompositionRule[] {
  return rules.map((r) => {
    if (r.id !== feedback.ruleId) return r;
    let delta = 0;
    if (feedback.visionScore !== undefined) delta += (feedback.visionScore - 0.5) * 0.05;
    if (feedback.commercialScore !== undefined) delta += (feedback.commercialScore - 0.5) * 0.08;
    return { ...r, confidence: Math.max(0, Math.min(1, r.confidence + delta)) };
  });
}

export function validateCompositionKnowledge(
  ctx: CompositionKnowledgeContext = {},
): CompositionKnowledgeReport {
  const violations: CompositionKnowledgeViolation[] = [];

  if (ctx.randomPlacement) {
    violations.push(violation("RANDOM_OBJECT_PLACEMENT", "Objects must not be placed randomly"));
  }
  if (ctx.missingHeroObject) {
    violations.push(violation("MISSING_HERO_OBJECT", "Every composition requires a hero object"));
  }
  if (ctx.illogicalReadingFlow) {
    violations.push(violation("ILLOGICAL_READING_FLOW", "Reading flow must be logical"));
  }
  if (ctx.storyContradiction) {
    violations.push(violation("STORY_CONTRADICTION", "Composition must align with story focus"));
  }
  if (ctx.missingQualityRules) {
    violations.push(violation("MISSING_QUALITY_RULES", "Quality evaluation rules are required"));
  }

  if (SEED_COMPOSITION_RULES.length < 5) {
    violations.push(violation("MISSING_QUALITY_RULES", "Insufficient composition rules in knowledge base"));
  }

  const furnitureLarge = recommendCompositionPattern({
    category: ProductCategoryKnowledge.FURNITURE,
    productSize: "large",
  });
  if (furnitureLarge?.id !== CompositionPatternId.LIFESTYLE_FOCUS) {
    violations.push(
      violation("RANDOM_OBJECT_PLACEMENT", "Large furniture should adapt to lifestyle focus pattern"),
    );
  }

  const validCheck = validateCompositionBlueprint({
    hasHeroObject: true,
    hierarchyOrder: ["hero_product", "primary_benefit", "supporting_elements"],
    patternId: CompositionPatternId.CENTERED_HERO,
    heroProductRatio: 0.7,
    negativeSpaceRatio: 0.25,
    storyPrimaryFocus: "product",
    firstAttentionTarget: "product",
  });
  if (!validCheck.valid) {
    violations.push(violation("MISSING_QUALITY_RULES", "Valid composition blueprint must pass validation"));
  }

  const invalidCheck = validateCompositionBlueprint({
    hasHeroObject: false,
    overcrowded: true,
    competingFoci: 3,
    hierarchyOrder: ["decorative_elements", "hero_product"],
    storyPrimaryFocus: "product",
    firstAttentionTarget: "background",
  });
  if (invalidCheck.valid || !invalidCheck.retryRecommended) {
    violations.push(violation("MISSING_QUALITY_RULES", "Invalid compositions must trigger local retry"));
  }

  const matchedLuxury = matchCompositionRules({ styleId: "luxury" });
  const matchedSports = matchCompositionRules({ storyEnergy: "sports" });
  const luxuryOnly = matchedLuxury.filter(
    (r) => !matchedSports.some((s) => s.id === r.id) || r.conditions.length > 0,
  );
  if (matchedLuxury.length === matchedSports.length && luxuryOnly.length === 0) {
    violations.push(violation("RANDOM_OBJECT_PLACEMENT", "Rules must not apply identically across all contexts"));
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    rules: [...SEED_COMPOSITION_RULES],
    patterns: [...COMPOSITION_PATTERNS],
    antiPatterns: [...COMPOSITION_ANTI_PATTERNS],
    goldenRuleSatisfied: unique.length === 0,
    hierarchyDefined: VISUAL_HIERARCHY_LEVELS.length >= 5,
    patternsSupported: COMPOSITION_PATTERNS.length >= 6,
    evolutionReady: true,
  };
}

export function assertCompositionKnowledge(
  ctx?: CompositionKnowledgeContext,
): CompositionKnowledgeReport {
  const report = validateCompositionKnowledge(ctx);
  if (!report.valid) {
    throw new Error(
      `Composition knowledge violation: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function runCompositionKnowledge(input: {
  ctx?: CompositionKnowledgeContext;
}): CompositionKnowledgeReport {
  return validateCompositionKnowledge(input.ctx);
}

export function isCompositionKnowledgeFailure(code: string): code is CompositionKnowledgeFailureCode {
  return [
    "RANDOM_OBJECT_PLACEMENT",
    "MISSING_HERO_OBJECT",
    "ILLOGICAL_READING_FLOW",
    "STORY_CONTRADICTION",
    "MISSING_QUALITY_RULES",
    "HIERARCHY_VIOLATED",
    "NEGATIVE_SPACE_VIOLATED",
    "ANTI_PATTERN_DETECTED",
    "UNKNOWN_PATTERN",
  ].includes(code);
}
