/**
 * Chapter 5.11 — Typography Knowledge engine.
 * Professional typography rules for commercial infographic text communication.
 */
import { MIN_TEXT_CONTRAST_RATIO } from "./color-knowledge-engine";
import { MarketplaceImageContext } from "./marketplace-knowledge-types";
import { StyleFamily } from "./style-knowledge-types";
import {
  FontCharacter,
  FontWeightRole,
  TextAlignment,
  type FontCharacterId,
  type FontWeightRoleId,
  type TextAlignmentId,
  type TextHierarchyLevel,
  type TypographyBlueprintCheck,
  type TypographyBlueprintValidation,
  type TypographyCondition,
  type TypographyKnowledge,
  type TypographyKnowledgeContext,
  type TypographyKnowledgeFailureCode,
  type TypographyKnowledgeReport,
  type TypographyKnowledgeViolation,
  type TypographySelectionContext,
  type TypographyValidationViolation,
} from "./typography-knowledge-types";

export {
  FontCharacter,
  FontWeightRole,
  TextAlignment,
  type FontCharacterId,
  type FontWeightRoleId,
  type TextAlignmentId,
  type TypographyCondition,
  type TypographyKnowledge,
  type TextHierarchyLevel,
  type TypographySelectionContext,
  type TypographyBlueprintCheck,
  type TypographyValidationViolation,
  type TypographyBlueprintValidation,
  type TypographyKnowledgeContext,
  type TypographyKnowledgeViolation,
  type TypographyKnowledgeReport,
  type TypographyKnowledgeFailureCode,
} from "./typography-knowledge-types";

export const TYPOGRAPHY_KNOWLEDGE_VERSION = "5.11.0";

export const TYPOGRAPHY_KNOWLEDGE_GOLDEN_RULE =
  "Typography is not text decoration. Typography manages how quickly, in what order, and with what emotional effect " +
  "a person perceives information. If the user understood the main message in the first seconds, Typography Knowledge succeeded.";

export const READABILITY_FIRST_PRINCIPLE = "Readability > Decoration — beautiful text loses value when hard to read";

export const MAX_BOLD_ELEMENTS = 2;

export const RECOMMENDED_LINE_SPACING = { min: 1.2, max: 1.6 };

export const TEXT_HIERARCHY_LEVELS: readonly TextHierarchyLevel[] = [
  { rank: 1, role: "headline", weight: FontWeightRole.HEADLINE, examples: ["main claim", "hero headline"] },
  { rank: 2, role: "primary_benefit", weight: FontWeightRole.PRIMARY, examples: ["key benefit", "value proposition"] },
  { rank: 3, role: "supporting_text", weight: FontWeightRole.SUPPORTING, examples: ["feature bullets", "secondary copy"] },
  { rank: 4, role: "technical_details", weight: FontWeightRole.SUPPORTING, examples: ["specs", "dimensions"] },
  { rank: 5, role: "small_notes", weight: FontWeightRole.SUPPORTING, examples: ["footnotes", "legal notes"] },
] as const;

export const FONT_CHARACTER_GUIDANCE: Record<FontCharacterId, string> = {
  [FontCharacter.SANS_SERIF]: "Clean neutral sans for marketplace readability",
  [FontCharacter.SERIF]: "Traditional serif for editorial premium contexts",
  [FontCharacter.GEOMETRIC]: "Geometric sans for modern minimal brands",
  [FontCharacter.HUMANIST]: "Humanist sans for lifestyle warmth",
  [FontCharacter.TECHNICAL]: "Technical grotesque for specs and diagrams",
  [FontCharacter.DISPLAY]: "Display face for short headline accents only",
};

function cond(
  field: string,
  operator: TypographyCondition["operator"],
  value: string | number | string[],
): TypographyCondition {
  return { field, operator, value };
}

function knowledge(partial: TypographyKnowledge): TypographyKnowledge {
  return partial;
}

export const SEED_TYPOGRAPHY_KNOWLEDGE: readonly TypographyKnowledge[] = [
  knowledge({
    id: "readability-first",
    rule: READABILITY_FIRST_PRINCIPLE,
    purpose: "Readability is the primary typography criterion before decorative choices",
    conditions: [],
    recommendation: "Evaluate contrast, size, and spacing before stylistic effects",
    confidence: 0.98,
  }),
  knowledge({
    id: "text-hierarchy-order",
    rule: "Maintain hierarchy: headline → primary benefit → supporting → technical → notes",
    purpose: "User must instantly identify the main message without searching",
    conditions: [],
    recommendation: "Apply bold only to headline, medium to primary benefit, regular to supporting",
    confidence: 0.96,
  }),
  knowledge({
    id: "luxury-typography",
    rule: "Luxury style uses careful proportions, limited text, premium alignment",
    purpose: "Premium perception requires restrained elegant typography",
    conditions: [cond("styleId", "in", ["luxury", "minimal-luxury", "premium", StyleFamily.LUXURY])],
    recommendation: "Generous letter spacing, moderate text volume, precise alignment",
    confidence: 0.91,
    styleId: StyleFamily.LUXURY,
  }),
  knowledge({
    id: "technical-typography",
    rule: "Technical style uses clear informational blocks with maximum readability",
    purpose: "Technical buyers need structured scannable information",
    conditions: [cond("styleId", "in", ["technical", StyleFamily.TECHNICAL])],
    recommendation: "Technical sans, structured blocks, left alignment, high contrast",
    confidence: 0.92,
    styleId: StyleFamily.TECHNICAL,
  }),
  knowledge({
    id: "lifestyle-typography",
    rule: "Lifestyle style allows emotional headline accents with humanist character",
    purpose: "Lifestyle storytelling benefits from warmer typographic voice",
    conditions: [cond("styleId", "in", ["lifestyle", StyleFamily.LIFESTYLE])],
    recommendation: "Humanist sans, emotional headline, balanced supporting text",
    confidence: 0.87,
    styleId: StyleFamily.LIFESTYLE,
  }),
  knowledge({
    id: "marketplace-text-contrast",
    rule: "Marketplace text must meet minimum contrast before render pipeline",
    purpose: "Insufficient contrast blocks fast information parsing on thumbnails",
    conditions: [cond("imageContext", "in", [MarketplaceImageContext.INFOGRAPHIC, "infographic", "marketplace"])],
    recommendation: `Ensure text contrast ratio >= ${MIN_TEXT_CONTRAST_RATIO}`,
    confidence: 0.95,
  }),
  knowledge({
    id: "limited-bold-usage",
    rule: "Limit bold weight to headline and at most one emphasis element",
    purpose: "Excessive bold destroys visual hierarchy",
    conditions: [],
    recommendation: `Use bold for headline only — max ${MAX_BOLD_ELEMENTS} bold elements per frame`,
    confidence: 0.94,
  }),
  knowledge({
    id: "line-spacing-balance",
    rule: "Line spacing between 1.2 and 1.6 for body text readability",
    purpose: "Too tight creates overload; too loose breaks semantic connections",
    conditions: [cond("contentType", "in", ["body", "supporting", "benefits"])],
    recommendation: "Apply 1.3–1.5 line height for supporting text blocks",
    confidence: 0.9,
  }),
  knowledge({
    id: "premium-letter-spacing",
    rule: "Slight positive letter spacing for premium brand headlines",
    purpose: "Tracking creates elegance and precision in luxury typography",
    conditions: [cond("styleId", "in", ["luxury", "premium", "minimal-luxury"])],
    recommendation: "Increase tracking 2–4% on uppercase luxury headlines",
    confidence: 0.86,
  }),
  knowledge({
    id: "alignment-composition-match",
    rule: "Text alignment must follow composition grid — no random mixed alignment",
    purpose: "Alignment chaos reduces professionalism and scan speed",
    conditions: [],
    recommendation: "Pick one primary alignment per layout; combined only for structured grids",
    confidence: 0.93,
  }),
  knowledge({
    id: "text-density-limit",
    rule: "Text must be scannable within seconds — reduce, split, or redistribute if overloaded",
    purpose: "Cognitive load limits commercial infographic effectiveness",
    conditions: [cond("informationDensity", "in", ["high", "medium"])],
    recommendation: "Prefer concise blocks; split across secondary images when needed",
    confidence: 0.92,
  }),
  knowledge({
    id: "product-not-obscured",
    rule: "Typography must not obscure or compete with hero product",
    purpose: "Text supports product — product remains visual priority",
    conditions: [],
    recommendation: "Reserve text to safe zones; never cover hero product focal area",
    confidence: 0.97,
  }),
] as const;

function violation(
  code: TypographyKnowledgeViolation["code"],
  message: string,
  knowledgeId?: string,
): TypographyKnowledgeViolation {
  return { code, message, knowledgeId };
}

function checkViolation(
  code: TypographyKnowledgeFailureCode,
  aspect: string,
  message: string,
): TypographyValidationViolation {
  return { code, aspect, message };
}

function evaluateCondition(
  condition: TypographyCondition,
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

export function getTypographyKnowledge(id: string): TypographyKnowledge | undefined {
  return SEED_TYPOGRAPHY_KNOWLEDGE.find((k) => k.id === id);
}

export function getTextHierarchy(): readonly TextHierarchyLevel[] {
  return TEXT_HIERARCHY_LEVELS;
}

export function matchTypographyKnowledge(
  ctx: Record<string, string | number | undefined>,
): TypographyKnowledge[] {
  return SEED_TYPOGRAPHY_KNOWLEDGE.filter((k) => {
    if (k.conditions.length === 0) return true;
    return k.conditions.every((c) => evaluateCondition(c, ctx));
  });
}

export function recommendTypographyKnowledge(ctx: TypographySelectionContext): TypographyKnowledge[] {
  const map: Record<string, string | number | undefined> = {
    styleId: ctx.styleId,
    category: ctx.category,
    marketplace: ctx.marketplace,
    imageContext: ctx.imageContext,
    informationDensity: ctx.informationDensity,
    storyType: ctx.storyType,
  };
  const matched = matchTypographyKnowledge(map);
  const universal = SEED_TYPOGRAPHY_KNOWLEDGE.filter((k) => k.conditions.length === 0);
  const combined = [...new Map([...matched, ...universal].map((k) => [k.id, k])).values()];
  return combined.sort((a, b) => b.confidence - a.confidence).slice(0, 6);
}

export function selectFontCharacter(ctx: TypographySelectionContext): FontCharacterId {
  if (ctx.styleId && [StyleFamily.LUXURY, "luxury", "premium"].includes(ctx.styleId)) {
    return FontCharacter.GEOMETRIC;
  }
  if (ctx.styleId && [StyleFamily.TECHNICAL, "technical"].includes(ctx.styleId)) {
    return FontCharacter.TECHNICAL;
  }
  if (ctx.styleId && [StyleFamily.LIFESTYLE, "lifestyle"].includes(ctx.styleId)) {
    return FontCharacter.HUMANIST;
  }
  if (ctx.marketplace || ctx.imageContext === MarketplaceImageContext.INFOGRAPHIC) {
    return FontCharacter.SANS_SERIF;
  }
  return FontCharacter.SANS_SERIF;
}

function hierarchyIsValid(order?: string[]): boolean {
  if (!order || order.length < 2) return false;
  const headlineIdx = order.findIndex((r) => r.includes("headline"));
  const notesIdx = order.findIndex((r) => r.includes("notes") || r.includes("small"));
  if (headlineIdx < 0) return false;
  if (notesIdx >= 0 && notesIdx <= headlineIdx) return false;
  return true;
}

export function validateTypographyConsistency(check: {
  alignments?: TextAlignmentId[];
  fontCharacters?: FontCharacterId[];
  sizeScaleConsistent?: boolean;
}): boolean {
  if (check.alignments && check.alignments.length > 1) {
    const unique = new Set(check.alignments.filter((a) => a !== TextAlignment.COMBINED));
    if (unique.size > 2) return false;
  }
  if (check.fontCharacters && new Set(check.fontCharacters).size > 2) return false;
  if (check.sizeScaleConsistent === false) return false;
  return true;
}

export function validateTypographyBlueprint(check: TypographyBlueprintCheck): TypographyBlueprintValidation {
  const violations: TypographyValidationViolation[] = [];

  if (!hierarchyIsValid(check.hierarchyOrder)) {
    violations.push(
      checkViolation("MISSING_TEXT_HIERARCHY", "hierarchy", "Text hierarchy must start with headline before supporting levels"),
    );
  }

  if (check.contrastRatio !== undefined && check.contrastRatio < MIN_TEXT_CONTRAST_RATIO) {
    violations.push(
      checkViolation(
        "INSUFFICIENT_TEXT_CONTRAST",
        "contrast",
        `Text contrast ${check.contrastRatio} below minimum ${MIN_TEXT_CONTRAST_RATIO}`,
      ),
    );
  }

  if (check.headlineReadable === false) {
    violations.push(
      checkViolation("UNREADABLE_TEXT", "readability", "Headline must be readable at thumbnail scale"),
    );
  }

  if (check.boldCount !== undefined && check.boldCount > MAX_BOLD_ELEMENTS) {
    violations.push(
      checkViolation(
        "INCONSISTENT_TYPOGRAPHY",
        "weight",
        `Too many bold elements (${check.boldCount}) — max ${MAX_BOLD_ELEMENTS}`,
      ),
    );
  }

  if (check.lineSpacing !== undefined) {
    if (check.lineSpacing < RECOMMENDED_LINE_SPACING.min || check.lineSpacing > RECOMMENDED_LINE_SPACING.max) {
      violations.push(
        checkViolation(
          "UNREADABLE_TEXT",
          "lineSpacing",
          `Line spacing ${check.lineSpacing} outside recommended ${RECOMMENDED_LINE_SPACING.min}-${RECOMMENDED_LINE_SPACING.max}`,
        ),
      );
    }
  }

  if (check.textDensity !== undefined && check.textDensity > 0.35) {
    violations.push(
      checkViolation(
        "EXCESSIVE_TEXT_DENSITY",
        "density",
        "Text density too high — shorten, split blocks, or redistribute across images",
      ),
    );
  }

  if (check.productObscured) {
    violations.push(
      checkViolation(
        "TEXT_DISTRACTS_FROM_PRODUCT",
        "product",
        "Typography must not obscure hero product focal area",
      ),
    );
  }

  if (check.alignment && check.alignment.length > 0) {
    const unique = new Set(check.alignment.filter((a) => a !== TextAlignment.COMBINED));
    if (unique.size > 2) {
      violations.push(
        checkViolation("ALIGNMENT_CHAOS", "alignment", "Random mixed alignment is not allowed"),
      );
    }
  }

  if (check.styleId === "luxury" && check.textDensity !== undefined && check.textDensity > 0.2) {
    violations.push(
      checkViolation(
        "STYLE_TYPOGRAPHY_MISMATCH",
        "style",
        "Luxury style requires moderate text volume and careful proportions",
      ),
    );
  }

  if (check.styleId === "technical" && check.headlineReadable === false) {
    violations.push(
      checkViolation(
        "STYLE_TYPOGRAPHY_MISMATCH",
        "style",
        "Technical style requires maximum readability in all blocks",
      ),
    );
  }

  if (
    check.fontCharacters &&
    !validateTypographyConsistency({
      alignments: check.alignment,
      fontCharacters: check.fontCharacters,
      sizeScaleConsistent: check.sizeScaleConsistent,
    })
  ) {
    violations.push(
      checkViolation("INCONSISTENT_TYPOGRAPHY", "consistency", "Typography must use a unified system across blocks"),
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

export function applyTypographyLearningFeedback(
  items: TypographyKnowledge[],
  feedback: { knowledgeId: string; commercialScore?: number },
): TypographyKnowledge[] {
  return items.map((k) => {
    if (k.id !== feedback.knowledgeId) return k;
    const delta = feedback.commercialScore !== undefined ? (feedback.commercialScore - 0.5) * 0.08 : 0;
    return { ...k, confidence: Math.max(0, Math.min(1, k.confidence + delta)) };
  });
}

export function validateTypographyKnowledge(
  ctx: TypographyKnowledgeContext = {},
): TypographyKnowledgeReport {
  const violations: TypographyKnowledgeViolation[] = [];

  if (ctx.unreadableText) {
    violations.push(violation("UNREADABLE_TEXT", "Text must be readable at intended viewing scale"));
  }
  if (ctx.missingHierarchy) {
    violations.push(violation("MISSING_TEXT_HIERARCHY", "Visual text hierarchy is required"));
  }
  if (ctx.randomSizes) {
    violations.push(violation("RANDOM_FONT_SIZES", "Font sizes must follow relative proportion system"));
  }
  if (ctx.inconsistentBlocks) {
    violations.push(violation("INCONSISTENT_TYPOGRAPHY", "Typography blocks must be consistent"));
  }
  if (ctx.textDistractsFromProduct) {
    violations.push(violation("TEXT_DISTRACTS_FROM_PRODUCT", "Typography must not distract from product"));
  }

  for (const k of SEED_TYPOGRAPHY_KNOWLEDGE) {
    if (!k.purpose || k.purpose.length < 10) {
      violations.push(violation("MISSING_TEXT_HIERARCHY", `Missing purpose: ${k.id}`, k.id));
    }
  }

  const luxury = recommendTypographyKnowledge({ styleId: StyleFamily.LUXURY });
  const technical = recommendTypographyKnowledge({ styleId: StyleFamily.TECHNICAL });
  if (luxury[0]?.id === technical[0]?.id && luxury.length > 0 && technical.length > 0) {
    const luxurySpecific = luxury.find((k) => k.id === "luxury-typography");
    const technicalSpecific = technical.find((k) => k.id === "technical-typography");
    if (!luxurySpecific || !technicalSpecific) {
      violations.push(violation("RANDOM_FONT_SIZES", "Different styles must trigger style-specific typography rules"));
    }
  }

  const luxuryFont = selectFontCharacter({ styleId: StyleFamily.LUXURY });
  const technicalFont = selectFontCharacter({ styleId: StyleFamily.TECHNICAL });
  if (luxuryFont === technicalFont && luxuryFont !== FontCharacter.SANS_SERIF) {
    violations.push(violation("RANDOM_FONT_SIZES", "Font character should vary between luxury and technical styles"));
  }

  const validBlueprint = validateTypographyBlueprint({
    hierarchyOrder: ["headline", "primary_benefit", "supporting_text"],
    contrastRatio: 5,
    boldCount: 1,
    lineSpacing: 1.4,
    textDensity: 0.15,
    headlineReadable: true,
    productObscured: false,
    alignment: [TextAlignment.LEFT],
    fontCharacters: [FontCharacter.GEOMETRIC],
    sizeScaleConsistent: true,
    styleId: "luxury",
  });
  if (!validBlueprint.valid) {
    violations.push(violation("UNREADABLE_TEXT", "Valid typography blueprint must pass validation"));
  }

  const invalidBlueprint = validateTypographyBlueprint({
    hierarchyOrder: ["small_notes", "headline"],
    contrastRatio: 2,
    boldCount: 4,
    lineSpacing: 1.0,
    textDensity: 0.5,
    headlineReadable: false,
    productObscured: true,
    alignment: [TextAlignment.LEFT, TextAlignment.CENTER, TextAlignment.RIGHT],
    fontCharacters: [FontCharacter.DISPLAY, FontCharacter.SERIF, FontCharacter.TECHNICAL],
    sizeScaleConsistent: false,
    styleId: "luxury",
  });
  if (invalidBlueprint.valid || !invalidBlueprint.retryRecommended) {
    violations.push(violation("UNREADABLE_TEXT", "Invalid typography must trigger retry"));
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    knowledge: [...SEED_TYPOGRAPHY_KNOWLEDGE],
    hierarchy: [...TEXT_HIERARCHY_LEVELS],
    goldenRuleSatisfied: unique.length === 0,
    readabilityFirst: Boolean(getTypographyKnowledge("readability-first")),
    styleAware: SEED_TYPOGRAPHY_KNOWLEDGE.some((k) => k.id === "luxury-typography"),
    evolutionReady: true,
  };
}

export function assertTypographyKnowledge(ctx?: TypographyKnowledgeContext): TypographyKnowledgeReport {
  const report = validateTypographyKnowledge(ctx);
  if (!report.valid) {
    throw new Error(`Typography knowledge violation: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export function runTypographyKnowledge(input: {
  ctx?: TypographyKnowledgeContext;
}): TypographyKnowledgeReport {
  return validateTypographyKnowledge(input.ctx);
}

export function isTypographyKnowledgeFailure(code: string): code is TypographyKnowledgeFailureCode {
  return [
    "UNREADABLE_TEXT",
    "MISSING_TEXT_HIERARCHY",
    "RANDOM_FONT_SIZES",
    "INCONSISTENT_TYPOGRAPHY",
    "TEXT_DISTRACTS_FROM_PRODUCT",
    "INSUFFICIENT_TEXT_CONTRAST",
    "EXCESSIVE_TEXT_DENSITY",
    "ALIGNMENT_CHAOS",
    "STYLE_TYPOGRAPHY_MISMATCH",
  ].includes(code);
}
