/**
 * Chapter 5.10 — Color Knowledge engine.
 * Professional color theory for commercial infographic communication.
 */
import { ProductCategoryKnowledge } from "./marketplace-knowledge-types";
import { StyleFamily } from "./style-knowledge-types";
import {
  CategoryColorProfile,
  ColorHarmony,
  ColorName,
  PaletteColorTemperature,
  ContrastType,
  type AccentColorPolicy,
  type CategoryColorProfileId,
  type ColorBlueprintCheck,
  type ColorBlueprintValidation,
  type ColorHarmonyId,
  type ColorKnowledge,
  type ColorKnowledgeContext,
  type ColorKnowledgeFailureCode,
  type ColorKnowledgeReport,
  type ColorKnowledgeViolation,
  type ColorPsychologyProfile,
  type ColorSelectionContext,
  type ColorNameId,
  type PaletteColorTemperatureId,
  type ColorValidationViolation,
  type ContrastTypeId,
} from "./color-knowledge-types";

export {
  ColorName,
  ColorHarmony,
  PaletteColorTemperature,
  ContrastType,
  CategoryColorProfile,
  type ColorNameId,
  type ColorHarmonyId,
  type PaletteColorTemperatureId,
  type ContrastTypeId,
  type CategoryColorProfileId,
  type ColorKnowledge,
  type ColorPsychologyProfile,
  type AccentColorPolicy,
  type ColorSelectionContext,
  type ColorBlueprintCheck,
  type ColorValidationViolation,
  type ColorBlueprintValidation,
  type ColorKnowledgeContext,
  type ColorKnowledgeViolation,
  type ColorKnowledgeReport,
  type ColorKnowledgeFailureCode,
} from "./color-knowledge-types";

export const COLOR_KNOWLEDGE_VERSION = "5.10.0";

export const COLOR_KNOWLEDGE_GOLDEN_RULE =
  "Color exists not to make an image beautiful. Color exists to direct attention, evoke emotions, " +
  "strengthen product value, and help the buyer decide faster. If color does not help sell, it is chosen incorrectly.";

export const ACCENT_COLOR_POLICY: AccentColorPolicy = {
  primary: 1,
  secondary: 1,
  accent: 1,
  maxTotal: 3,
};

export const MIN_TEXT_CONTRAST_RATIO = 4.5;

export const COLOR_PSYCHOLOGY: readonly ColorPsychologyProfile[] = [
  {
    color: ColorName.BLUE,
    effects: ["trust", "reliability", "technology", "safety"],
    commercialUse: "Technical and medical products requiring credibility",
  },
  {
    color: ColorName.GREEN,
    effects: ["naturalness", "health", "eco_friendliness"],
    commercialUse: "Organic, wellness, and sustainable product lines",
  },
  {
    color: ColorName.BLACK,
    effects: ["luxury", "status", "premium"],
    commercialUse: "Luxury cosmetics, watches, premium electronics",
  },
  {
    color: ColorName.WHITE,
    effects: ["cleanliness", "simplicity", "medical", "minimalism"],
    commercialUse: "Medical devices, minimal marketplace main images",
  },
  {
    color: ColorName.RED,
    effects: ["energy", "urgency", "activity", "attention"],
    commercialUse: "Promotional accents and high-energy sports categories",
  },
] as const;

export const CATEGORY_COLOR_PROFILES: Record<CategoryColorProfileId, string[]> = {
  [CategoryColorProfile.MEDICAL]: [ColorName.WHITE, ColorName.BLUE, ColorName.GRAY],
  [CategoryColorProfile.LUXURY_COSMETICS]: [ColorName.BLACK, ColorName.GOLD, ColorName.CREAM],
  [CategoryColorProfile.ECO]: [ColorName.GREEN, ColorName.BROWN, "natural_tones"],
  [CategoryColorProfile.ELECTRONICS]: [ColorName.GRAY, "graphite", ColorName.BLUE, ColorName.WHITE],
};

function knowledge(partial: ColorKnowledge): ColorKnowledge {
  return partial;
}

export const SEED_COLOR_KNOWLEDGE: readonly ColorKnowledge[] = [
  knowledge({
    id: "hero-product-contrast",
    palette: "neutral_background + product_natural",
    purpose: "Hero product must never be lost against background or overlay",
    psychologicalEffects: ["clarity", "focus"],
    recommendedCategories: ["all"],
    forbiddenCategories: [],
    confidence: 0.96,
  }),
  knowledge({
    id: "medical-clean-palette",
    palette: "white + light_blue + light_gray",
    purpose: "Medical category palette conveying safety and clinical trust",
    psychologicalEffects: ["cleanliness", "trust", "safety"],
    recommendedCategories: ["medical", "health", "pharma", StyleFamily.MEDICAL],
    forbiddenCategories: ["luxury_decor", "sports_energy"],
    confidence: 0.92,
    harmony: ColorHarmony.ANALOGOUS,
    temperature: PaletteColorTemperature.COLD,
  }),
  knowledge({
    id: "luxury-cosmetics-palette",
    palette: "black + gold + cream",
    purpose: "Luxury cosmetics palette emphasizing premium status",
    psychologicalEffects: ["luxury", "exclusivity", "premium"],
    recommendedCategories: ["cosmetics", "beauty", ProductCategoryKnowledge.BEAUTY],
    forbiddenCategories: ["budget_household", "industrial"],
    confidence: 0.93,
    harmony: ColorHarmony.MONOCHROMATIC,
    temperature: PaletteColorTemperature.WARM,
  }),
  knowledge({
    id: "eco-natural-palette",
    palette: "green + brown + natural_tones",
    purpose: "Eco products palette reinforcing sustainability message",
    psychologicalEffects: ["naturalness", "environmental_responsibility", "health"],
    recommendedCategories: ["eco", "organic", StyleFamily.ECO],
    forbiddenCategories: ["synthetic_industrial"],
    confidence: 0.9,
    harmony: ColorHarmony.ANALOGOUS,
    temperature: PaletteColorTemperature.WARM,
  }),
  knowledge({
    id: "electronics-tech-palette",
    palette: "gray + graphite + blue + white",
    purpose: "Electronics palette conveying precision and innovation",
    psychologicalEffects: ["technology", "precision", "reliability"],
    recommendedCategories: [ProductCategoryKnowledge.ELECTRONICS, "technical"],
    forbiddenCategories: ["romantic", "handmade"],
    confidence: 0.91,
    harmony: ColorHarmony.COMPLEMENTARY,
    temperature: PaletteColorTemperature.COLD,
  }),
  knowledge({
    id: "warm-home-palette",
    palette: "warm_neutrals + soft_accents",
    purpose: "Warm palette for home and kitchen comfort storytelling",
    psychologicalEffects: ["comfort", "home", "warmth"],
    recommendedCategories: [ProductCategoryKnowledge.KITCHEN, "home"],
    forbiddenCategories: ["medical", "industrial"],
    confidence: 0.87,
    harmony: ColorHarmony.ANALOGOUS,
    temperature: PaletteColorTemperature.WARM,
  }),
  knowledge({
    id: "marketplace-high-contrast",
    palette: "high_luminance_contrast",
    purpose: "Marketplace infographics require strong luminance contrast for fast parsing",
    psychologicalEffects: ["clarity", "speed"],
    recommendedCategories: ["marketplace", "infographic"],
    forbiddenCategories: [],
    confidence: 0.94,
  }),
  knowledge({
    id: "limited-accent-colors",
    palette: "primary + secondary + accent",
    purpose: "Limit accent colors to reduce cognitive load — one primary, one secondary, one accent",
    psychologicalEffects: ["focus", "clarity"],
    recommendedCategories: ["all"],
    forbiddenCategories: [],
    confidence: 0.95,
  }),
  knowledge({
    id: "brand-priority-palette",
    palette: "brand_colors_adapted",
    purpose: "Brand palette is priority but must not harm readability or product perception",
    psychologicalEffects: ["brand_recognition"],
    recommendedCategories: ["branded"],
    forbiddenCategories: [],
    confidence: 0.88,
  }),
  knowledge({
    id: "low-saturation-premium",
    palette: "muted_neutrals + selective_saturation",
    purpose: "Low saturation backgrounds with selective hero saturation for premium feel",
    psychologicalEffects: ["premium", "calm", "sophistication"],
    recommendedCategories: ["premium", "luxury", StyleFamily.LUXURY],
    forbiddenCategories: ["discount", "flash_sale"],
    confidence: 0.89,
    harmony: ColorHarmony.MONOCHROMATIC,
    temperature: PaletteColorTemperature.NEUTRAL,
  }),
] as const;

export const CONTRAST_GUIDANCE: Record<ContrastTypeId, string> = {
  [ContrastType.COLOR]: "Hue difference between product and background",
  [ContrastType.LUMINANCE]: "Brightness difference for readability",
  [ContrastType.SATURATION]: "Saturation contrast to direct attention to hero",
  [ContrastType.LOCAL]: "Contrast between adjacent elements",
  [ContrastType.GLOBAL]: "Overall palette contrast across the frame",
};

function violation(
  code: ColorKnowledgeViolation["code"],
  message: string,
  knowledgeId?: string,
): ColorKnowledgeViolation {
  return { code, message, knowledgeId };
}

function checkViolation(
  code: ColorKnowledgeFailureCode,
  aspect: string,
  message: string,
): ColorValidationViolation {
  return { code, aspect, message };
}

export function getColorKnowledge(id: string): ColorKnowledge | undefined {
  return SEED_COLOR_KNOWLEDGE.find((k) => k.id === id);
}

export function getColorPsychology(color: ColorNameId): ColorPsychologyProfile | undefined {
  return COLOR_PSYCHOLOGY.find((p) => p.color === color);
}

export function getCategoryColorProfile(profileId: CategoryColorProfileId): string[] {
  return CATEGORY_COLOR_PROFILES[profileId];
}

export function recommendColorKnowledge(ctx: ColorSelectionContext): ColorKnowledge[] {
  const scores = new Map<string, number>();

  for (const k of SEED_COLOR_KNOWLEDGE) {
    let score = k.confidence * 10;
    if (ctx.category) {
      if (k.recommendedCategories.some((r) => ctx.category!.toLowerCase().includes(r.toLowerCase()))) {
        score += 30;
      }
      if (k.forbiddenCategories.some((f) => ctx.category!.toLowerCase().includes(f.toLowerCase()))) {
        score -= 50;
      }
    }
    if (ctx.styleId) {
      if (k.recommendedCategories.includes(ctx.styleId)) score += 20;
      if (k.id.includes("luxury") && ctx.styleId.includes("luxury")) score += 25;
      if (k.id.includes("eco") && ctx.styleId === StyleFamily.ECO) score += 25;
    }
    if (ctx.businessGoal) {
      const goal = ctx.businessGoal.toLowerCase();
      if (goal.includes("luxury") && k.id.includes("luxury")) score += 20;
      if (goal.includes("premium") && k.id.includes("premium")) score += 20;
    }
    if (ctx.brandPalette && k.id === "brand-priority-palette") score += 25;
    scores.set(k.id, score);
  }

  return [...scores.entries()]
    .filter(([, s]) => s > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => getColorKnowledge(id)!)
    .filter(Boolean);
}

export function selectColorHarmony(ctx: ColorSelectionContext): ColorHarmonyId {
  if (ctx.styleId && ["luxury", "minimal-luxury", "premium"].includes(ctx.styleId)) {
    return ColorHarmony.MONOCHROMATIC;
  }
  if (ctx.category && [ProductCategoryKnowledge.ELECTRONICS, "technical"].includes(ctx.category)) {
    return ColorHarmony.COMPLEMENTARY;
  }
  if (ctx.styleId === StyleFamily.ECO || ctx.category === "eco") {
    return ColorHarmony.ANALOGOUS;
  }
  return ColorHarmony.TRIADIC;
}

export function selectPaletteColorTemperature(ctx: ColorSelectionContext): PaletteColorTemperatureId {
  if (ctx.category && [ProductCategoryKnowledge.KITCHEN, "home"].includes(ctx.category)) {
    return PaletteColorTemperature.WARM;
  }
  if (ctx.category && [ProductCategoryKnowledge.ELECTRONICS, "medical", "technical"].includes(ctx.category)) {
    return PaletteColorTemperature.COLD;
  }
  return PaletteColorTemperature.NEUTRAL;
}

export function resolveBrandColorConflict(input: {
  brandColors: string[];
  readabilityContrast: number;
  productVisibility: number;
}): { resolution: string; prioritize: "brand" | "readability" | "product" } {
  if (input.readabilityContrast < MIN_TEXT_CONTRAST_RATIO) {
    return { resolution: "Readability overrides brand — adjust brand tint for contrast", prioritize: "readability" };
  }
  if (input.productVisibility < 0.5) {
    return { resolution: "Product visibility overrides brand — neutralize background", prioritize: "product" };
  }
  return { resolution: "Brand palette applied with commercial compromise", prioritize: "brand" };
}

export function validateAgentPaletteConsistency(palette: {
  lighting?: string;
  material?: string;
  overlay?: string;
  background?: string;
}): boolean {
  const colors = [palette.lighting, palette.material, palette.overlay, palette.background].filter(Boolean);
  if (colors.length < 2) return true;
  const warm = colors.filter((c) => c!.includes("warm")).length;
  const cold = colors.filter((c) => c!.includes("cold")).length;
  return !(warm > 0 && cold > 0);
}

export function validateColorBlueprint(check: ColorBlueprintCheck): ColorBlueprintValidation {
  const violations: ColorValidationViolation[] = [];

  if (check.accentCount !== undefined && check.accentCount > ACCENT_COLOR_POLICY.maxTotal) {
    violations.push(
      checkViolation(
        "EXCESSIVE_ACCENT_COLORS",
        "accents",
        `Accent colors (${check.accentCount}) exceed maximum ${ACCENT_COLOR_POLICY.maxTotal}`,
      ),
    );
  }

  if (check.contrastRatio !== undefined && check.contrastRatio < 3) {
    violations.push(
      checkViolation(
        "INSUFFICIENT_CONTRAST",
        "contrast",
        "Insufficient color contrast reduces readability and perception speed",
      ),
    );
  }

  if (check.textContrastRatio !== undefined && check.textContrastRatio < MIN_TEXT_CONTRAST_RATIO) {
    violations.push(
      checkViolation(
        "ACCESSIBILITY_CONTRAST_FAIL",
        "accessibility",
        `Text contrast ratio ${check.textContrastRatio} below minimum ${MIN_TEXT_CONTRAST_RATIO}`,
      ),
    );
  }

  if (check.backgroundColor && check.heroProductColor && check.backgroundColor === check.heroProductColor) {
    violations.push(
      checkViolation(
        "HERO_LOST_ON_BACKGROUND",
        "hero",
        "Hero product color matches background — product will be lost",
      ),
    );
  }

  if (
    check.storyEmotion === "trust" &&
    check.palette?.includes(ColorName.RED) &&
    !check.palette.includes(ColorName.BLUE)
  ) {
    violations.push(
      checkViolation(
        "STORY_CONTRADICTION",
        "story",
        "Red-dominant palette contradicts trust-focused story without balancing blue",
      ),
    );
  }

  if (check.styleId === "minimal" && check.palette && check.palette.length > 4) {
    violations.push(
      checkViolation(
        "STORY_CONTRADICTION",
        "style",
        "Minimal style requires limited palette — too many colors",
      ),
    );
  }

  if (check.lightingColor && check.materialColor && check.overlayColor) {
    if (
      !validateAgentPaletteConsistency({
        lighting: check.lightingColor,
        material: check.materialColor,
        overlay: check.overlayColor,
        background: check.backgroundColor,
      })
    ) {
      violations.push(
        checkViolation(
          "INCONSISTENT_AGENT_PALETTE",
          "consistency",
          "Lighting, material, and overlay use conflicting color temperatures",
        ),
      );
    }
  }

  if (check.brandColors && check.textContrastRatio !== undefined && check.textContrastRatio < 4) {
    violations.push(
      checkViolation(
        "BRAND_READABILITY_CONFLICT",
        "brand",
        "Brand colors reduce text readability below acceptable threshold",
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

export function applyColorLearningFeedback(
  items: ColorKnowledge[],
  feedback: { knowledgeId: string; commercialScore?: number },
): ColorKnowledge[] {
  return items.map((k) => {
    if (k.id !== feedback.knowledgeId) return k;
    const delta = feedback.commercialScore !== undefined ? (feedback.commercialScore - 0.5) * 0.08 : 0;
    return { ...k, confidence: Math.max(0, Math.min(1, k.confidence + delta)) };
  });
}

export function validateColorKnowledge(ctx: ColorKnowledgeContext = {}): ColorKnowledgeReport {
  const violations: ColorKnowledgeViolation[] = [];

  if (ctx.randomColorSelection) {
    violations.push(violation("RANDOM_COLOR_SELECTION", "Colors must not be selected randomly"));
  }
  if (ctx.noBusinessGoalLink) {
    violations.push(violation("NO_BUSINESS_GOAL_LINK", "Color must link to business goal"));
  }
  if (ctx.storyContradiction) {
    violations.push(violation("STORY_CONTRADICTION", "Palette must align with story"));
  }
  if (ctx.insufficientContrast) {
    violations.push(violation("INSUFFICIENT_CONTRAST", "Contrast requirements must be enforced"));
  }
  if (ctx.inconsistentAgentPalette) {
    violations.push(violation("INCONSISTENT_AGENT_PALETTE", "Agents must share unified palette"));
  }

  for (const k of SEED_COLOR_KNOWLEDGE) {
    if (!k.purpose || k.purpose.length < 10) {
      violations.push(violation("NO_BUSINESS_GOAL_LINK", `Missing purpose: ${k.id}`, k.id));
    }
  }

  const luxury = recommendColorKnowledge({ category: ProductCategoryKnowledge.BEAUTY, styleId: "luxury" });
  const medical = recommendColorKnowledge({ category: "medical", styleId: StyleFamily.MEDICAL });
  if (luxury[0]?.id === medical[0]?.id && luxury.length > 0 && medical.length > 0) {
    violations.push(violation("RANDOM_COLOR_SELECTION", "Different categories must recommend different palettes"));
  }

  const warm = selectPaletteColorTemperature({ category: ProductCategoryKnowledge.KITCHEN });
  const cold = selectPaletteColorTemperature({ category: ProductCategoryKnowledge.ELECTRONICS });
  if (warm === cold) {
    violations.push(violation("RANDOM_COLOR_SELECTION", "Color temperature must vary by category"));
  }

  const validBlueprint = validateColorBlueprint({
    palette: [ColorName.WHITE, ColorName.GRAY, ColorName.BLUE],
    backgroundColor: "#ffffff",
    heroProductColor: "#333333",
    accentCount: 2,
    contrastRatio: 4.5,
    textContrastRatio: 5,
    lightingColor: "warm_neutral",
    materialColor: "warm_wood",
    overlayColor: "warm_accent",
    storyEmotion: "trust",
    styleId: "minimal",
  });
  if (!validBlueprint.valid) {
    violations.push(violation("INSUFFICIENT_CONTRAST", "Valid color blueprint must pass validation"));
  }

  const invalidBlueprint = validateColorBlueprint({
    backgroundColor: "#ff0000",
    heroProductColor: "#ff0000",
    accentCount: 5,
    contrastRatio: 1.5,
    textContrastRatio: 2,
    storyEmotion: "trust",
    palette: [ColorName.RED, "orange", "yellow", "green", "blue"],
    lightingColor: "warm",
    materialColor: "cold_steel",
    overlayColor: "cold_blue",
    styleId: "minimal",
  });
  if (invalidBlueprint.valid || !invalidBlueprint.retryRecommended) {
    violations.push(violation("INSUFFICIENT_CONTRAST", "Invalid color blueprint must trigger retry"));
  }

  const brandConflict = resolveBrandColorConflict({
    brandColors: ["#brand"],
    readabilityContrast: 3,
    productVisibility: 0.8,
  });
  if (brandConflict.prioritize !== "readability") {
    violations.push(violation("BRAND_READABILITY_CONFLICT", "Low contrast must prioritize readability over brand"));
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    knowledge: [...SEED_COLOR_KNOWLEDGE],
    psychology: [...COLOR_PSYCHOLOGY],
    harmonies: Object.values(ColorHarmony),
    goldenRuleSatisfied: unique.length === 0,
    contrastAware: Boolean(CONTRAST_GUIDANCE[ContrastType.LUMINANCE]),
    consistencyEnforced: true,
    evolutionReady: true,
  };
}

export function assertColorKnowledge(ctx?: ColorKnowledgeContext): ColorKnowledgeReport {
  const report = validateColorKnowledge(ctx);
  if (!report.valid) {
    throw new Error(`Color knowledge violation: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export function runColorKnowledge(input: { ctx?: ColorKnowledgeContext }): ColorKnowledgeReport {
  return validateColorKnowledge(input.ctx);
}

export function isColorKnowledgeFailure(code: string): code is ColorKnowledgeFailureCode {
  return [
    "RANDOM_COLOR_SELECTION",
    "NO_BUSINESS_GOAL_LINK",
    "STORY_CONTRADICTION",
    "INSUFFICIENT_CONTRAST",
    "INCONSISTENT_AGENT_PALETTE",
    "HERO_LOST_ON_BACKGROUND",
    "EXCESSIVE_ACCENT_COLORS",
    "BRAND_READABILITY_CONFLICT",
    "ACCESSIBILITY_CONTRAST_FAIL",
  ].includes(code);
}
