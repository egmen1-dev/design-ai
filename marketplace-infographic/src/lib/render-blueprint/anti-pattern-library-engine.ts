/**
 * Chapter 5.15 — Anti-Pattern Library engine.
 * Centralized library of design mistakes to detect, prevent, and recover from.
 */
import { MIN_TEXT_CONTRAST_RATIO } from "./color-knowledge-engine";
import { MIN_PRODUCT_HERO_RATIO, MAX_COGNITIVE_LOAD } from "./cognitive-psychology-knowledge-engine";
import {
  AntiPatternCategory,
  AntiPatternSeverity,
  type AntiPatternBlueprintCheck,
  type AntiPatternBlueprintValidation,
  type AntiPatternCategoryId,
  type AntiPatternDetectionContext,
  type AntiPatternDetectionResult,
  type AntiPatternDetectionRule,
  type AntiPatternLearningFeedback,
  type AntiPatternLibraryContext,
  type AntiPatternLibraryFailureCode,
  type AntiPatternLibraryReport,
  type AntiPatternLibraryViolation,
  type AntiPatternSeverityAction,
  type AntiPatternSeverityId,
  type AntiPatternValidationViolation,
  type DesignAntiPattern,
} from "./anti-pattern-library-types";

export {
  AntiPatternCategory,
  AntiPatternSeverity,
  type AntiPatternCategoryId,
  type AntiPatternSeverityId,
  type AntiPatternDetectionRule,
  type DesignAntiPattern,
  type AntiPatternSeverityAction,
  type AntiPatternDetectionContext,
  type AntiPatternBlueprintCheck,
  type AntiPatternDetectionResult,
  type AntiPatternValidationViolation,
  type AntiPatternBlueprintValidation,
  type AntiPatternLearningFeedback,
  type AntiPatternLibraryContext,
  type AntiPatternLibraryViolation,
  type AntiPatternLibraryReport,
  type AntiPatternLibraryFailureCode,
} from "./anti-pattern-library-types";

export const ANTI_PATTERN_LIBRARY_VERSION = "5.15.0";

export const ANTI_PATTERN_LIBRARY_GOLDEN_RULE =
  "Professional design is defined not only by good decisions made, but by mistakes avoided. " +
  "Pattern Library teaches how to create good images. Anti-Pattern Library teaches how never to create bad ones again.";

export const SEVERITY_ACTIONS: readonly AntiPatternSeverityAction[] = [
  {
    severity: AntiPatternSeverity.CRITICAL,
    score: 4,
    action: "reject",
    description: "Image must be rejected — blueprint cannot proceed",
  },
  {
    severity: AntiPatternSeverity.MAJOR,
    score: 3,
    action: "retry",
    description: "Retry required with recommended fixes",
  },
  {
    severity: AntiPatternSeverity.MINOR,
    score: 2,
    action: "correct",
    description: "Correction desirable before render pipeline",
  },
  {
    severity: AntiPatternSeverity.INFO,
    score: 1,
    action: "recommend",
    description: "Recommendation without mandatory fix",
  },
] as const;

const HERO_AREA_CRITICAL_THRESHOLD = MIN_PRODUCT_HERO_RATIO;

function rule(
  field: string,
  operator: AntiPatternDetectionRule["operator"],
  value: string | number | boolean | string[],
): AntiPatternDetectionRule {
  return { field, operator, value };
}

function antiPattern(partial: DesignAntiPattern): DesignAntiPattern {
  return partial;
}

export const SEED_DESIGN_ANTI_PATTERNS: readonly DesignAntiPattern[] = [
  antiPattern({
    id: "biz-missing-usp",
    name: "Missing USP",
    category: AntiPatternCategory.BUSINESS,
    description: "No clear unique selling proposition — buyer cannot answer why buy this product",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("missingUsp", "eq", true)],
    recommendedFixes: ["Add single primary benefit headline", "Clarify commercial value proposition"],
    examples: ["Generic product photo with no claim", "Feature list without main benefit"],
    confidence: 0.94,
    agentScope: ["visual-story-director"],
  }),
  antiPattern({
    id: "biz-missing-hero-product",
    name: "Missing Hero Product",
    category: AntiPatternCategory.BUSINESS,
    description: "Image does not answer what is being sold",
    severity: AntiPatternSeverity.CRITICAL,
    severityScore: 4,
    detectionRules: [rule("hasHeroProduct", "eq", false)],
    recommendedFixes: ["Promote product to hero focal area", "Remove decorative elements competing with product"],
    examples: ["Lifestyle scene without visible product", "Text-only infographic"],
    confidence: 0.97,
    agentScope: ["visual-story-director", "composition-director"],
  }),
  antiPattern({
    id: "biz-tell-everything-at-once",
    name: "Tell Everything At Once",
    category: AntiPatternCategory.BUSINESS,
    description: "Attempting to communicate all information in one image",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("tellEverythingAtOnce", "eq", true)],
    recommendedFixes: ["Split information across images", "Keep one primary message per frame"],
    examples: ["Ten features on main image", "Specs wall on thumbnail"],
    confidence: 0.91,
    agentScope: ["visual-story-director"],
  }),
  antiPattern({
    id: "comp-missing-hero",
    name: "Missing Hero Object",
    category: AntiPatternCategory.COMPOSITION,
    description: "No clear primary subject in composition",
    severity: AntiPatternSeverity.CRITICAL,
    severityScore: 4,
    detectionRules: [rule("hasHeroProduct", "eq", false)],
    recommendedFixes: ["Establish single hero object", "Increase product visual weight"],
    examples: ["Equal-weight icons with no product", "Background dominates frame"],
    confidence: 0.96,
    agentScope: ["composition-director"],
  }),
  antiPattern({
    id: "comp-competing-foci",
    name: "Competing Focal Points",
    category: AntiPatternCategory.COMPOSITION,
    description: "Multiple elements compete for primary attention",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("competingFocalPoints", "gt", 1)],
    recommendedFixes: ["Demote secondary elements", "Reserve one attention center"],
    examples: ["Dual hero products", "Badge and product equal weight"],
    confidence: 0.95,
    agentScope: ["composition-director"],
  }),
  antiPattern({
    id: "comp-overcrowded-frame",
    name: "Overcrowded Frame",
    category: AntiPatternCategory.COMPOSITION,
    description: "Too many elements reduce readability and trust",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("overcrowded", "eq", true)],
    recommendedFixes: ["Remove non-essential elements", "Increase negative space"],
    examples: ["Cluttered infographic", "Too many icons and labels"],
    confidence: 0.93,
    agentScope: ["composition-director"],
  }),
  antiPattern({
    id: "comp-poor-negative-space",
    name: "Poor Negative Space",
    category: AntiPatternCategory.COMPOSITION,
    description: "Insufficient breathing room reduces premium perception",
    severity: AntiPatternSeverity.MINOR,
    severityScore: 2,
    detectionRules: [rule("negativeSpaceRatio", "lt", 0.15)],
    recommendedFixes: ["Increase negative space", "Reduce peripheral elements"],
    examples: ["Edge-to-edge clutter", "No margin around hero"],
    confidence: 0.9,
    agentScope: ["composition-director"],
  }),
  antiPattern({
    id: "comp-chaotic-eye-flow",
    name: "Chaotic Eye Flow",
    category: AntiPatternCategory.COMPOSITION,
    description: "Gaze moves without planned hierarchy path",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("chaoticEyeFlow", "eq", true)],
    recommendedFixes: ["Project hero → benefit → detail path", "Align elements to reading flow"],
    examples: ["Random text placement", "Scattered benefit icons"],
    confidence: 0.92,
    agentScope: ["composition-director"],
  }),
  antiPattern({
    id: "photo-impossible-lighting",
    name: "Impossible Lighting",
    category: AntiPatternCategory.PHOTOGRAPHY,
    description: "Light direction contradicts shadows and materials",
    severity: AntiPatternSeverity.CRITICAL,
    severityScore: 4,
    detectionRules: [rule("impossibleLighting", "eq", true)],
    recommendedFixes: ["Align key light with shadow direction", "Use physically consistent lighting setup"],
    examples: ["Shadow left, highlight right", "Multiple conflicting key lights"],
    confidence: 0.95,
    agentScope: ["lighting-director", "vision-quality-director"],
  }),
  antiPattern({
    id: "photo-wrong-shadows",
    name: "Physically Wrong Shadows",
    category: AntiPatternCategory.PHOTOGRAPHY,
    description: "Shadows do not match object contact and light source",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("wrongShadows", "eq", true)],
    recommendedFixes: ["Recompute contact shadows", "Match shadow softness to light size"],
    examples: ["Floating product", "Detached shadow"],
    confidence: 0.93,
    agentScope: ["lighting-director", "vision-quality-director"],
  }),
  antiPattern({
    id: "photo-plastic-materials",
    name: "Plastic Materials",
    category: AntiPatternCategory.PHOTOGRAPHY,
    description: "Materials look artificial and reduce trust",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("plasticMaterials", "eq", true)],
    recommendedFixes: ["Improve material shaders", "Add micro-texture and realistic specular response"],
    examples: ["Waxy skin", "Rubber metal"],
    confidence: 0.91,
    agentScope: ["material-director", "vision-quality-director"],
  }),
  antiPattern({
    id: "photo-ai-artifacts",
    name: "AI Photography Artifacts",
    category: AntiPatternCategory.PHOTOGRAPHY,
    description: "Generation artifacts break commercial realism",
    severity: AntiPatternSeverity.CRITICAL,
    severityScore: 4,
    detectionRules: [rule("aiArtifacts", "eq", true)],
    recommendedFixes: ["Retry with refined prompt", "Apply artifact cleanup pass"],
    examples: ["Melting edges", "Impossible reflections"],
    confidence: 0.96,
    agentScope: ["vision-quality-director"],
  }),
  antiPattern({
    id: "typo-excessive-text",
    name: "Excessive Text",
    category: AntiPatternCategory.TYPOGRAPHY,
    description: "Too much text increases cognitive load on marketplace",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("textDensity", "gt", 0.35)],
    recommendedFixes: ["Shorten copy", "Split text across secondary images"],
    examples: ["Paragraph on thumbnail", "Spec wall on main image"],
    confidence: 0.94,
    agentScope: ["overlay-engine"],
  }),
  antiPattern({
    id: "typo-low-contrast",
    name: "Low Text Contrast",
    category: AntiPatternCategory.TYPOGRAPHY,
    description: "Text unreadable against background",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("textContrastRatio", "lt", MIN_TEXT_CONTRAST_RATIO)],
    recommendedFixes: ["Increase local contrast", "Add scrim behind text", "Change text or background color"],
    examples: ["Gray on gray headline", "White text on light background"],
    confidence: 0.95,
    agentScope: ["overlay-engine"],
  }),
  antiPattern({
    id: "typo-chaotic-alignment",
    name: "Chaotic Alignment",
    category: AntiPatternCategory.TYPOGRAPHY,
    description: "Random mixed alignment destroys typographic system",
    severity: AntiPatternSeverity.MINOR,
    severityScore: 2,
    detectionRules: [rule("alignmentChaotic", "eq", true)],
    recommendedFixes: ["Unify alignment system", "Use grid-aligned text blocks"],
    examples: ["Left, center, right mixed freely", "Rotated labels without purpose"],
    confidence: 0.89,
    agentScope: ["overlay-engine"],
  }),
  antiPattern({
    id: "typo-headline-too-long",
    name: "Headline Too Long",
    category: AntiPatternCategory.TYPOGRAPHY,
    description: "Long headlines fail at thumbnail scale",
    severity: AntiPatternSeverity.MINOR,
    severityScore: 2,
    detectionRules: [rule("headlineTooLong", "eq", true)],
    recommendedFixes: ["Reduce headline to core claim", "Move details to supporting text"],
    examples: ["Three-line headline on main image", "Full sentence as hero text"],
    confidence: 0.88,
    agentScope: ["overlay-engine"],
  }),
  antiPattern({
    id: "mkt-main-image-violation",
    name: "Main Image Rule Violation",
    category: AntiPatternCategory.MARKETPLACE,
    description: "Blueprint violates marketplace main image requirements",
    severity: AntiPatternSeverity.CRITICAL,
    severityScore: 4,
    detectionRules: [rule("marketplaceRuleViolation", "eq", true)],
    recommendedFixes: ["Apply marketplace safe zones", "Remove prohibited overlay elements"],
    examples: ["Text on Amazon main", "Logo covering product"],
    confidence: 0.97,
    agentScope: ["governance", "marketplace-knowledge"],
  }),
  antiPattern({
    id: "mkt-thumbnail-unreadable",
    name: "Thumbnail Unreadable",
    category: AntiPatternCategory.MARKETPLACE,
    description: "Information not parseable at thumbnail scale",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("thumbnailReadable", "eq", false)],
    recommendedFixes: ["Increase headline size", "Simplify message", "Boost contrast"],
    examples: ["Tiny benefit text", "Complex grid at 200px"],
    confidence: 0.94,
    agentScope: ["marketplace-knowledge"],
  }),
  antiPattern({
    id: "mkt-safe-zone-violation",
    name: "Safe Zone Violation",
    category: AntiPatternCategory.MARKETPLACE,
    description: "Critical content placed in unsafe overlay zones",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("safeZoneViolation", "eq", true)],
    recommendedFixes: ["Move text and badges to safe areas", "Reserve platform badge corners"],
    examples: ["CTA under WB badge", "Text in crop zone"],
    confidence: 0.92,
    agentScope: ["marketplace-knowledge"],
  }),
  antiPattern({
    id: "psych-info-overload",
    name: "Information Overload",
    category: AntiPatternCategory.PSYCHOLOGY,
    description: "Too much simultaneous information exceeds working memory",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("cognitiveLoad", "gt", MAX_COGNITIVE_LOAD)],
    recommendedFixes: ["Reduce semantic blocks", "Prioritize one message"],
    examples: ["Eight benefits at once", "Dense icon matrix"],
    confidence: 0.93,
    agentScope: ["composition-director", "visual-story-director"],
  }),
  antiPattern({
    id: "psych-visual-noise",
    name: "Visual Noise",
    category: AntiPatternCategory.PSYCHOLOGY,
    description: "Visual noise distracts from product and reduces click probability",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("visualNoise", "eq", true)],
    recommendedFixes: ["Remove decorative noise", "Simplify background", "Increase negative space"],
    examples: ["Busy patterns behind product", "Excessive gradients"],
    confidence: 0.9,
    agentScope: ["composition-director"],
  }),
  antiPattern({
    id: "psych-emotional-conflict",
    name: "Emotional Signal Conflict",
    category: AntiPatternCategory.PSYCHOLOGY,
    description: "Contradictory emotional cues confuse buyer perception",
    severity: AntiPatternSeverity.MINOR,
    severityScore: 2,
    detectionRules: [rule("emotionalConflict", "eq", true)],
    recommendedFixes: ["Align color, lighting, and story to one emotional goal", "Remove conflicting accents"],
    examples: ["Luxury gold with discount red", "Calm product in chaotic scene"],
    confidence: 0.87,
    agentScope: ["visual-story-director"],
  }),
  antiPattern({
    id: "render-deformed-geometry",
    name: "Deformed Geometry",
    category: AntiPatternCategory.RENDERING,
    description: "Object geometry is physically impossible or damaged",
    severity: AntiPatternSeverity.CRITICAL,
    severityScore: 4,
    detectionRules: [rule("deformedGeometry", "eq", true)],
    recommendedFixes: ["Retry generation", "Tighten product shape constraints"],
    examples: ["Bent bottle", "Merged parts"],
    confidence: 0.96,
    agentScope: ["vision-quality-director"],
  }),
  antiPattern({
    id: "render-duplicate-objects",
    name: "Duplicate Objects",
    category: AntiPatternCategory.RENDERING,
    description: "Repeated or cloned objects from generation failure",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("duplicateObjects", "eq", true)],
    recommendedFixes: ["Retry with single-object emphasis", "Remove duplicate instances"],
    examples: ["Twin products", "Repeated handles"],
    confidence: 0.94,
    agentScope: ["vision-quality-director"],
  }),
  antiPattern({
    id: "render-ai-noise",
    name: "AI Render Noise",
    category: AntiPatternCategory.RENDERING,
    description: "High-frequency AI noise and texture corruption",
    severity: AntiPatternSeverity.MAJOR,
    severityScore: 3,
    detectionRules: [rule("renderNoise", "eq", true)],
    recommendedFixes: ["Denoise pass", "Retry with lower creativity", "Increase reference image weight"],
    examples: ["Speckled surfaces", "Moiré on flat areas"],
    confidence: 0.92,
    agentScope: ["vision-quality-director"],
  }),
  antiPattern({
    id: "comp-hero-area-too-small",
    name: "Hero Product Area Too Small",
    category: AntiPatternCategory.COMPOSITION,
    description: "Hero product occupies insufficient frame area for marketplace recognition",
    severity: AntiPatternSeverity.CRITICAL,
    severityScore: 4,
    detectionRules: [rule("heroProductRatio", "lt", HERO_AREA_CRITICAL_THRESHOLD)],
    recommendedFixes: ["Increase hero product scale", "Reduce peripheral elements"],
    examples: ["Small product in large lifestyle scene on main image"],
    confidence: 0.95,
    agentScope: ["composition-director"],
  }),
] as const;

function evaluateDetectionRule(
  detectionRule: AntiPatternDetectionRule,
  check: Record<string, string | number | boolean | undefined>,
): boolean {
  const actual = check[detectionRule.field];
  if (actual === undefined) return false;
  const { operator, value } = detectionRule;
  if (operator === "eq") return actual === value;
  if (operator === "gt") return Number(actual) > Number(value);
  if (operator === "lt") return Number(actual) < Number(value);
  if (operator === "gte") return Number(actual) >= Number(value);
  if (operator === "lte") return Number(actual) <= Number(value);
  if (operator === "in") {
    const values = Array.isArray(value) ? value : [value];
    return values.map(String).includes(String(actual));
  }
  return false;
}

export function getDesignAntiPattern(id: string): DesignAntiPattern | undefined {
  return SEED_DESIGN_ANTI_PATTERNS.find((a) => a.id === id);
}

export function getAntiPatternsByCategory(category: AntiPatternCategoryId): DesignAntiPattern[] {
  return SEED_DESIGN_ANTI_PATTERNS.filter((a) => a.category === category);
}

export function getSeverityAction(severity: AntiPatternSeverityId): AntiPatternSeverityAction {
  return SEVERITY_ACTIONS.find((s) => s.severity === severity) ?? SEVERITY_ACTIONS[1];
}

export function detectDesignAntiPatterns(
  check: AntiPatternBlueprintCheck,
  ctx: AntiPatternDetectionContext = {},
): AntiPatternDetectionResult[] {
  const map: Record<string, string | number | boolean | undefined> = { ...check };
  void ctx;
  const results: AntiPatternDetectionResult[] = [];

  for (const antiPattern of SEED_DESIGN_ANTI_PATTERNS) {
    const matchedRules = antiPattern.detectionRules
      .filter((r) => evaluateDetectionRule(r, map))
      .map((r) => `${r.field} ${r.operator} ${String(r.value)}`);
    if (matchedRules.length > 0) {
      results.push({ antiPattern, matchedRules });
    }
  }

  return results.sort((a, b) => b.antiPattern.severityScore - a.antiPattern.severityScore);
}

export function recommendAntiPatternFixes(detected: AntiPatternDetectionResult[]): string[] {
  const fixes = new Set<string>();
  for (const d of detected) {
    for (const fix of d.antiPattern.recommendedFixes) {
      fixes.add(fix);
    }
  }
  return [...fixes];
}

function severityToFailureCode(severity: AntiPatternSeverityId): AntiPatternLibraryFailureCode {
  if (severity === AntiPatternSeverity.CRITICAL) return "CRITICAL_ANTI_PATTERN";
  if (severity === AntiPatternSeverity.MAJOR) return "MAJOR_ANTI_PATTERN";
  return "MAJOR_ANTI_PATTERN";
}

function checkViolation(
  antiPattern: DesignAntiPattern,
  message?: string,
): AntiPatternValidationViolation {
  return {
    code: severityToFailureCode(antiPattern.severity),
    aspect: antiPattern.category,
    message: message ?? antiPattern.description,
    antiPatternId: antiPattern.id,
    severity: antiPattern.severity,
  };
}

function violation(
  code: AntiPatternLibraryFailureCode,
  message: string,
  antiPatternId?: string,
): AntiPatternLibraryViolation {
  return { code, message, antiPatternId };
}

export function validateAntiPatternBlueprint(
  check: AntiPatternBlueprintCheck,
): AntiPatternBlueprintValidation {
  const detected = detectDesignAntiPatterns(check);
  const violations = detected.map((d) => checkViolation(d.antiPattern));
  const recommendedFixes = recommendAntiPatternFixes(detected);
  const hasCritical = detected.some((d) => d.antiPattern.severity === AntiPatternSeverity.CRITICAL);
  const hasMajor = detected.some((d) => d.antiPattern.severity === AntiPatternSeverity.MAJOR);
  const hasMinor = detected.some((d) => d.antiPattern.severity === AntiPatternSeverity.MINOR);
  const highest = detected[0]?.antiPattern.severity;

  return {
    valid: violations.length === 0,
    violations,
    detected,
    rejectRecommended: hasCritical,
    retryRecommended: hasCritical || hasMajor,
    correctionRecommended: hasMinor,
    recommendedFixes,
    explainable: violations.every((v) => v.message.length > 0),
    highestSeverity: highest,
  };
}

export function applyAntiPatternLearningFeedback(
  items: DesignAntiPattern[],
  feedback: AntiPatternLearningFeedback,
): DesignAntiPattern[] {
  return items.map((a) => {
    if (a.id !== feedback.antiPatternId) return a;
    let delta = 0;
    if (feedback.detected && feedback.ledToRetry) delta += 0.03;
    if (feedback.fixed) delta -= 0.02;
    if (feedback.commercialScoreImpact !== undefined) {
      delta += feedback.commercialScoreImpact < 0 ? 0.04 : -0.02;
    }
    return { ...a, confidence: Math.max(0, Math.min(1, a.confidence + delta)) };
  });
}

export function validateAntiPatternLibrary(ctx: AntiPatternLibraryContext = {}): AntiPatternLibraryReport {
  const violations: AntiPatternLibraryViolation[] = [];

  if (ctx.postGenerationOnly) {
    violations.push(violation("POST_GENERATION_ONLY", "Anti-patterns must be detectable before blueprint publication"));
  }
  if (ctx.missingSeverityClassification) {
    violations.push(violation("SEVERITY_NOT_CLASSIFIED", "All anti-patterns require severity classification"));
  }
  if (ctx.noAutoFix) {
    violations.push(violation("MISSING_AUTO_FIX", "Recommended fixes required for auto recovery"));
  }
  if (ctx.repeatingErrors) {
    violations.push(violation("REPEATING_ERROR", "Repeating errors must feed Design Memory"));
  }
  if (ctx.noDesignMemoryLink) {
    violations.push(violation("REPEATING_ERROR", "Anti-pattern learning must link to Design Memory"));
  }

  for (const a of SEED_DESIGN_ANTI_PATTERNS) {
    if (!a.description || a.description.length < 10) {
      violations.push(violation("UNEXPLAINABLE_ANTI_PATTERN", `Missing description: ${a.id}`, a.id));
    }
    if (a.detectionRules.length === 0) {
      violations.push(violation("MISSING_DETECTION_RULES", `Missing detection rules: ${a.id}`, a.id));
    }
    if (a.recommendedFixes.length === 0) {
      violations.push(violation("MISSING_AUTO_FIX", `Missing recommended fixes: ${a.id}`, a.id));
    }
    if (!a.severity || a.severityScore < 1) {
      violations.push(violation("SEVERITY_NOT_CLASSIFIED", `Missing severity: ${a.id}`, a.id));
    }
  }

  const ids = SEED_DESIGN_ANTI_PATTERNS.map((a) => a.id);
  if (new Set(ids).size !== ids.length) {
    violations.push(violation("DUPLICATE_ANTI_PATTERN", "Anti-pattern ids must be unique"));
  }

  const criticalAction = getSeverityAction(AntiPatternSeverity.CRITICAL);
  if (criticalAction.action !== "reject") {
    violations.push(violation("SEVERITY_NOT_CLASSIFIED", "Critical severity must trigger reject"));
  }

  const detected = detectDesignAntiPatterns({
    hasHeroProduct: false,
    heroProductRatio: 0.2,
    competingFocalPoints: 3,
    overcrowded: true,
    chaoticEyeFlow: true,
    textContrastRatio: 2,
    textDensity: 0.5,
    cognitiveLoad: 0.9,
    visualNoise: true,
    marketplaceRuleViolation: true,
    aiArtifacts: true,
    deformedGeometry: true,
  });
  if (detected.length < 5) {
    violations.push(violation("MISSING_DETECTION_RULES", "Detection engine must find multiple anti-patterns"));
  }

  const validBlueprint = validateAntiPatternBlueprint({
    hasHeroProduct: true,
    heroProductRatio: 0.5,
    competingFocalPoints: 1,
    overcrowded: false,
    negativeSpaceRatio: 0.25,
    chaoticEyeFlow: false,
    textContrastRatio: 5,
    textDensity: 0.15,
    cognitiveLoad: 0.4,
    thumbnailReadable: true,
    visualNoise: false,
  });
  if (!validBlueprint.valid) {
    violations.push(violation("CRITICAL_ANTI_PATTERN", "Clean blueprint must pass anti-pattern validation"));
  }

  const invalidBlueprint = validateAntiPatternBlueprint({
    hasHeroProduct: false,
    heroProductRatio: 0.2,
    competingFocalPoints: 3,
    overcrowded: true,
    chaoticEyeFlow: true,
    textContrastRatio: 2,
    textDensity: 0.5,
    cognitiveLoad: 0.9,
    visualNoise: true,
    marketplaceRuleViolation: true,
    aiArtifacts: true,
    deformedGeometry: true,
    missingUsp: true,
    tellEverythingAtOnce: true,
  });
  if (invalidBlueprint.valid || !invalidBlueprint.rejectRecommended || !invalidBlueprint.retryRecommended) {
    violations.push(violation("CRITICAL_ANTI_PATTERN", "Invalid blueprint must trigger reject and retry"));
  }
  if (invalidBlueprint.recommendedFixes.length === 0) {
    violations.push(violation("MISSING_AUTO_FIX", "Detected anti-patterns must provide fixes"));
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    antiPatterns: [...SEED_DESIGN_ANTI_PATTERNS],
    severityActions: [...SEVERITY_ACTIONS],
    goldenRuleSatisfied: unique.length === 0,
    preGenerationDetection: true,
    autoRecoveryReady: SEED_DESIGN_ANTI_PATTERNS.every((a) => a.recommendedFixes.length > 0),
    evolutionReady: true,
  };
}

export function assertAntiPatternLibrary(ctx?: AntiPatternLibraryContext): AntiPatternLibraryReport {
  const report = validateAntiPatternLibrary(ctx);
  if (!report.valid) {
    throw new Error(`Anti-pattern library violation: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export function runAntiPatternLibrary(input: {
  ctx?: AntiPatternLibraryContext;
}): AntiPatternLibraryReport {
  return validateAntiPatternLibrary(input.ctx);
}

export function isAntiPatternLibraryFailure(code: string): code is AntiPatternLibraryFailureCode {
  return [
    "CRITICAL_ANTI_PATTERN",
    "MAJOR_ANTI_PATTERN",
    "UNEXPLAINABLE_ANTI_PATTERN",
    "MISSING_DETECTION_RULES",
    "MISSING_AUTO_FIX",
    "POST_GENERATION_ONLY",
    "DUPLICATE_ANTI_PATTERN",
    "SEVERITY_NOT_CLASSIFIED",
    "REPEATING_ERROR",
  ].includes(code);
}
