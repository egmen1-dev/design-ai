/**
 * Chapter 5.12 — Cognitive Psychology Knowledge engine.
 * Formalized human perception, attention, memory, trust, and decision-making rules.
 */
import { KnowledgeEvidenceSource } from "./design-knowledge-philosophy-types";
import {
  EmotionalTrigger,
  GestaltPrinciple,
  LifeContextPattern,
  RecognitionPriority,
  type CognitiveBlueprintCheck,
  type CognitiveBlueprintValidation,
  type CognitivePsychologyCondition,
  type CognitivePsychologyKnowledge,
  type CognitivePsychologyKnowledgeContext,
  type CognitivePsychologyKnowledgeFailureCode,
  type CognitivePsychologyKnowledgeReport,
  type CognitivePsychologyKnowledgeViolation,
  type CognitivePsychologySelectionContext,
  type CognitiveValidationViolation,
  type EmotionalTriggerId,
  type EyeMovementStep,
  type GestaltPrincipleId,
  type LifeContextPatternId,
  type TrustSignal,
} from "./cognitive-psychology-knowledge-types";

export {
  GestaltPrinciple,
  RecognitionPriority,
  EmotionalTrigger,
  LifeContextPattern,
  type GestaltPrincipleId,
  type RecognitionPriorityId,
  type EmotionalTriggerId,
  type LifeContextPatternId,
  type CognitivePsychologyCondition,
  type CognitivePsychologyKnowledge,
  type EyeMovementStep,
  type TrustSignal,
  type CognitivePsychologySelectionContext,
  type CognitiveBlueprintCheck,
  type CognitiveValidationViolation,
  type CognitiveBlueprintValidation,
  type CognitivePsychologyKnowledgeContext,
  type CognitivePsychologyKnowledgeViolation,
  type CognitivePsychologyKnowledgeReport,
  type CognitivePsychologyKnowledgeFailureCode,
} from "./cognitive-psychology-knowledge-types";

export const COGNITIVE_PSYCHOLOGY_KNOWLEDGE_VERSION = "5.12.0";

export const COGNITIVE_PSYCHOLOGY_KNOWLEDGE_GOLDEN_RULE =
  "People buy when the brain quickly understands the product, feels trust, and wants to learn more. " +
  "Commercial infographic design is not about showing maximum information — it forms the right first impression " +
  "with minimal visual means.";

/** Marketplace attention decision window — user decides if card deserves attention */
export const MARKETPLACE_ATTENTION_WINDOW_MS = 1000;

/** Target perception window aligned with marketplace ranking readability factor */
export const MARKETPLACE_SCAN_WINDOW_MS = 2000;

export const MAX_COMPETING_FOCAL_POINTS = 1;

export const MAX_COGNITIVE_LOAD = 0.65;

export const MIN_PRODUCT_HERO_RATIO = 0.35;

export const RECOGNITION_PRIORITY_ORDER = [
  RecognitionPriority.SHAPE,
  RecognitionPriority.IMAGE,
  RecognitionPriority.COLOR,
  RecognitionPriority.TEXT,
] as const;

export const EYE_MOVEMENT_PATH: readonly EyeMovementStep[] = [
  { rank: 1, role: "hero_product", examples: ["product silhouette", "hero object"] },
  { rank: 2, role: "primary_benefit", examples: ["main claim", "key value"] },
  { rank: 3, role: "key_characteristic", examples: ["spec highlight", "feature icon"] },
  { rank: 4, role: "additional_information", examples: ["secondary copy", "footnotes"] },
] as const;

export const GESTALT_PRINCIPLES: readonly GestaltPrincipleId[] = [
  GestaltPrinciple.PROXIMITY,
  GestaltPrinciple.SIMILARITY,
  GestaltPrinciple.CONTINUITY,
  GestaltPrinciple.CLOSURE,
  GestaltPrinciple.FIGURE_GROUND,
  GestaltPrinciple.COMMON_REGION,
  GestaltPrinciple.COMMON_FATE,
] as const;

export const TRUST_SIGNALS: readonly TrustSignal[] = [
  { id: "photo_quality", name: "Photo Quality", description: "Sharp, professional product photography" },
  { id: "clean_composition", name: "Clean Composition", description: "Uncluttered layout without visual noise" },
  { id: "physical_realism", name: "Physical Realism", description: "Believable shadows, scale, and materials" },
  { id: "professional_lighting", name: "Professional Lighting", description: "Consistent commercial lighting quality" },
  { id: "visual_consistency", name: "Visual Consistency", description: "Coherent style across all elements" },
] as const;

export const EMOTIONAL_TRIGGER_GUIDANCE: Record<EmotionalTriggerId, string> = {
  [EmotionalTrigger.SAFETY]: "Soft lighting, stable composition, protective context cues",
  [EmotionalTrigger.RELIABILITY]: "Clean grids, neutral palette, structured information blocks",
  [EmotionalTrigger.TECHNOLOGY]: "Precise geometry, cool tones, technical clarity",
  [EmotionalTrigger.COMFORT]: "Warm lighting, lifestyle scenes, approachable spacing",
  [EmotionalTrigger.SPEED]: "Dynamic diagonals, high contrast focal path, minimal copy",
  [EmotionalTrigger.CLEANLINESS]: "White space, limited palette, crisp edges",
  [EmotionalTrigger.ECO]: "Natural materials, organic textures, green earth tones",
  [EmotionalTrigger.STATUS]: "Premium negative space, restrained accents, elegant proportions",
  [EmotionalTrigger.PROFESSIONALISM]: "Aligned grids, consistent typography, neutral authority",
};

export const LIFE_CONTEXT_GUIDANCE: Record<LifeContextPatternId, string> = {
  [LifeContextPattern.KITCHEN]: "Recognizable kitchen context accelerates product understanding",
  [LifeContextPattern.WORKSHOP]: "Workshop scene signals durability and practical use",
  [LifeContextPattern.GARDEN]: "Garden context supports outdoor and lifestyle categories",
  [LifeContextPattern.OFFICE]: "Office scene communicates productivity and business use",
  [LifeContextPattern.MEDICAL]: "Medical context signals hygiene and care categories",
};

function cond(
  field: string,
  operator: CognitivePsychologyCondition["operator"],
  value: string | number | string[],
): CognitivePsychologyCondition {
  return { field, operator, value };
}

function knowledge(partial: CognitivePsychologyKnowledge): CognitivePsychologyKnowledge {
  return partial;
}

export const SEED_COGNITIVE_PSYCHOLOGY_KNOWLEDGE: readonly CognitivePsychologyKnowledge[] = [
  knowledge({
    id: "human-attention-window",
    rule: "User attention on marketplace is decided in under one second",
    purpose: "First screen must interest — not explain everything",
    conditions: [cond("marketplace", "eq", "marketplace")],
    recommendation: "Lead with single hero product and one primary benefit within attention window",
    confidence: 0.97,
  }),
  knowledge({
    id: "selective-attention",
    rule: "Composition must have one primary attention center",
    purpose: "Multiple competing focal points scatter attention and reduce click probability",
    conditions: [],
    recommendation: "Reserve one hero focal point; demote secondary elements visually",
    confidence: 0.96,
  }),
  knowledge({
    id: "visual-search-questions",
    rule: "Every element must answer: what is sold, how it differs, why better, can I trust",
    purpose: "Visual search follows product discovery with trust and differentiation checks",
    conditions: [],
    recommendation: "Remove elements that do not support product, benefit, or trust questions",
    confidence: 0.94,
  }),
  knowledge({
    id: "cognitive-load-limit",
    rule: "Minimize simultaneous semantic blocks — working memory is limited",
    purpose: "Each extra element increases perception cost",
    conditions: [],
    recommendation: "Prefer few strong meaning blocks over many weak ones",
    confidence: 0.95,
  }),
  knowledge({
    id: "recognition-before-reading",
    rule: "Brain recognizes shape, then image, then color, then text",
    purpose: "Product must be understood before reading — text-only meaning fails composition",
    conditions: [],
    recommendation: "Hero product silhouette and visual cues precede textual explanation",
    confidence: 0.98,
  }),
  knowledge({
    id: "pattern-recognition-scenes",
    rule: "Familiar life contexts accelerate comprehension",
    purpose: "Recognizable scenes reduce cognitive effort vs abstract backgrounds",
    conditions: [cond("imageContext", "in", ["lifestyle", "scene", "in_context"])],
    recommendation: "Use real kitchen, workshop, garden, office, or medical contexts via Scene Director",
    confidence: 0.9,
  }),
  knowledge({
    id: "gestalt-principles",
    rule: "Apply gestalt principles: proximity, similarity, continuity, closure, figure-ground",
    purpose: "Human perception groups visual information by innate laws",
    conditions: [],
    recommendation: "Group related elements, separate figure from ground, maintain visual continuity",
    confidence: 0.93,
  }),
  knowledge({
    id: "trust-formation",
    rule: "Trust forms from visual quality before textual specifications",
    purpose: "Photo quality, cleanliness, realism, lighting, and consistency signal credibility",
    conditions: [],
    recommendation: "Validate trust signals before blueprint enters render pipeline",
    confidence: 0.95,
  }),
  knowledge({
    id: "emotional-decision-first",
    rule: "Click decisions are emotional first — rational comparison follows later",
    purpose: "Image must trigger correct emotional reaction before feature analysis",
    conditions: [],
    recommendation: "Story Director selects emotional trigger aligned with product positioning",
    confidence: 0.92,
    triggerId: EmotionalTrigger.COMFORT,
  }),
  knowledge({
    id: "memory-encoding-simple",
    rule: "Simple visual structures encode in memory faster than complex ones",
    purpose: "Limited palette, few meaning blocks, and strong hero improve recall",
    conditions: [],
    recommendation: "Prefer simple composition with limited palette and strong hero product",
    confidence: 0.91,
  }),
  knowledge({
    id: "eye-movement-path",
    rule: "Gaze must follow planned route: hero → benefit → characteristic → detail",
    purpose: "Chaotic eye movement indicates composition failure",
    conditions: [],
    recommendation: "Project reading path before finalizing blueprint layout",
    confidence: 0.94,
  }),
  knowledge({
    id: "marketplace-fast-scan",
    rule: "Marketplace images are scanned in seconds — not studied at length",
    purpose: "Buyer compares cards quickly, rarely reads long text",
    conditions: [cond("marketplace", "eq", "marketplace")],
    recommendation: "Design for fast scanning with instant product recognition",
    confidence: 0.96,
  }),
  knowledge({
    id: "emotional-trigger-safety",
    rule: "Safety trigger uses soft lighting and stable protective context",
    purpose: "Visual cues for security and care categories",
    conditions: [cond("emotionalGoal", "eq", EmotionalTrigger.SAFETY)],
    recommendation: EMOTIONAL_TRIGGER_GUIDANCE[EmotionalTrigger.SAFETY],
    confidence: 0.88,
    triggerId: EmotionalTrigger.SAFETY,
  }),
  knowledge({
    id: "emotional-trigger-technology",
    rule: "Technology trigger uses precise geometry and technical clarity",
    purpose: "Electronics and innovation categories need structured tech perception",
    conditions: [cond("emotionalGoal", "eq", EmotionalTrigger.TECHNOLOGY)],
    recommendation: EMOTIONAL_TRIGGER_GUIDANCE[EmotionalTrigger.TECHNOLOGY],
    confidence: 0.89,
    triggerId: EmotionalTrigger.TECHNOLOGY,
  }),
] as const;

export const COGNITIVE_PSYCHOLOGY_EVIDENCE_SOURCE = KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY;

function evaluateCondition(
  condition: CognitivePsychologyCondition,
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

export function getCognitivePsychologyKnowledge(id: string): CognitivePsychologyKnowledge | undefined {
  return SEED_COGNITIVE_PSYCHOLOGY_KNOWLEDGE.find((k) => k.id === id);
}

export function getEyeMovementPath(): readonly EyeMovementStep[] {
  return EYE_MOVEMENT_PATH;
}

export function getTrustSignals(): readonly TrustSignal[] {
  return TRUST_SIGNALS;
}

export function matchCognitivePsychologyKnowledge(
  ctx: CognitivePsychologySelectionContext,
): CognitivePsychologyKnowledge[] {
  const map: Record<string, string | number | undefined> = {
    category: ctx.category,
    marketplace: ctx.marketplace,
    storyType: ctx.storyType,
    emotionalGoal: ctx.emotionalGoal,
    productComplexity: ctx.productComplexity,
    imageContext: ctx.imageContext,
  };
  return SEED_COGNITIVE_PSYCHOLOGY_KNOWLEDGE.filter((k) => {
    if (k.conditions.length === 0) return true;
    return k.conditions.every((c) => evaluateCondition(c, map));
  });
}

export function recommendCognitivePsychologyKnowledge(
  ctx: CognitivePsychologySelectionContext,
): CognitivePsychologyKnowledge[] {
  const all = matchCognitivePsychologyKnowledge(ctx);
  const conditional = all.filter((k) => k.conditions.length > 0);
  const universal = all
    .filter((k) => k.conditions.length === 0)
    .sort((a, b) => b.confidence - a.confidence);
  const combined = [...new Map([...conditional, ...universal].map((k) => [k.id, k])).values()];
  return combined.slice(0, 10);
}

export function selectEmotionalTrigger(ctx: CognitivePsychologySelectionContext): EmotionalTriggerId {
  if (ctx.emotionalGoal) return ctx.emotionalGoal;
  if (ctx.category === "electronics" || ctx.storyType === "technical") return EmotionalTrigger.TECHNOLOGY;
  if (ctx.category === "beauty" || ctx.storyType === "luxury") return EmotionalTrigger.STATUS;
  if (ctx.category === "kitchen" || ctx.storyType === "lifestyle") return EmotionalTrigger.COMFORT;
  return EmotionalTrigger.RELIABILITY;
}

export function estimateCognitiveLoad(check: {
  competingFocalPoints?: number;
  semanticBlockCount?: number;
  textDensity?: number;
  paletteColorCount?: number;
  gestaltViolationCount?: number;
}): number {
  const focal = (check.competingFocalPoints ?? 1) * 0.18;
  const blocks = (check.semanticBlockCount ?? 3) * 0.08;
  const text = (check.textDensity ?? 0.15) * 0.35;
  const palette = Math.max(0, (check.paletteColorCount ?? 4) - 3) * 0.04;
  const gestalt = (check.gestaltViolationCount ?? 0) * 0.06;
  return Math.min(1, focal + blocks + text + palette + gestalt);
}

function eyeMovementIsValid(order?: string[]): boolean {
  if (!order || order.length < 2) return true;
  const heroIdx = order.findIndex((r) => r.includes("hero") || r.includes("product"));
  const detailIdx = order.findIndex((r) => r.includes("detail") || r.includes("additional"));
  if (heroIdx < 0) return false;
  if (detailIdx >= 0 && detailIdx <= heroIdx) return false;
  return true;
}

function checkViolation(
  code: CognitivePsychologyKnowledgeFailureCode,
  aspect: string,
  message: string,
): CognitiveValidationViolation {
  return { code, aspect, message };
}

function violation(
  code: CognitivePsychologyKnowledgeFailureCode,
  message: string,
  knowledgeId?: string,
): CognitivePsychologyKnowledgeViolation {
  return { code, message, knowledgeId };
}

export function validateTrustSignals(present?: string[]): boolean {
  if (!present || present.length === 0) return false;
  const required = ["photo_quality", "clean_composition"];
  return required.every((id) => present.includes(id));
}

export function validateCognitivePsychologyBlueprint(
  check: CognitiveBlueprintCheck,
): CognitiveBlueprintValidation {
  const violations: CognitiveValidationViolation[] = [];
  const estimatedLoad =
    check.cognitiveLoad ??
    estimateCognitiveLoad({
      competingFocalPoints: check.competingFocalPoints,
      semanticBlockCount: check.semanticBlockCount,
      paletteColorCount: check.paletteColorCount,
      gestaltViolationCount: check.gestaltViolations?.length,
    });

  if (estimatedLoad > MAX_COGNITIVE_LOAD) {
    violations.push(
      checkViolation(
        "EXCESSIVE_COGNITIVE_LOAD",
        "cognitiveLoad",
        `Cognitive load ${estimatedLoad.toFixed(2)} exceeds maximum ${MAX_COGNITIVE_LOAD}`,
      ),
    );
  }

  if (check.competingFocalPoints !== undefined && check.competingFocalPoints > MAX_COMPETING_FOCAL_POINTS) {
    violations.push(
      checkViolation(
        "COMPETING_ATTENTION_CENTERS",
        "attention",
        `Too many competing focal points (${check.competingFocalPoints}) — max ${MAX_COMPETING_FOCAL_POINTS}`,
      ),
    );
  }

  if (check.competingFocalPoints === 0) {
    violations.push(
      checkViolation("MISSING_FOCAL_POINT", "attention", "Composition requires one primary attention center"),
    );
  }

  if (check.perceptionTimeMs !== undefined && check.perceptionTimeMs > MARKETPLACE_SCAN_WINDOW_MS) {
    violations.push(
      checkViolation(
        "SLOW_VISUAL_PERCEPTION",
        "perception",
        `Perception time ${check.perceptionTimeMs}ms exceeds scan window ${MARKETPLACE_SCAN_WINDOW_MS}ms`,
      ),
    );
  }

  if (check.textOnlyMeaning) {
    violations.push(
      checkViolation(
        "TEXT_ONLY_MEANING",
        "recognition",
        "User must understand image via product visuals — not reading alone",
      ),
    );
  }

  if (check.productRecognizable === false) {
    violations.push(
      checkViolation(
        "PRODUCT_NOT_RECOGNIZABLE",
        "product",
        "Hero product must be recognizable within attention window",
      ),
    );
  }

  if (check.chaoticGaze || !eyeMovementIsValid(check.eyeMovementOrder)) {
    violations.push(
      checkViolation(
        "CHAOTIC_EYE_MOVEMENT",
        "eyeMovement",
        "Gaze must follow hero product → benefit → characteristic → detail",
      ),
    );
  }

  if (check.gestaltViolations && check.gestaltViolations.length > 0) {
    violations.push(
      checkViolation(
        "GESTALT_VIOLATION",
        "gestalt",
        `Gestalt violations: ${check.gestaltViolations.join(", ")}`,
      ),
    );
  }

  if (check.trustSignalsPresent && !validateTrustSignals(check.trustSignalsPresent)) {
    violations.push(
      checkViolation(
        "INSUFFICIENT_TRUST_SIGNALS",
        "trust",
        "Trust requires photo quality and clean composition at minimum",
      ),
    );
  }

  if (check.productHeroRatio !== undefined && check.productHeroRatio < MIN_PRODUCT_HERO_RATIO) {
    violations.push(
      checkViolation(
        "PRODUCT_NOT_RECOGNIZABLE",
        "heroRatio",
        `Product hero ratio ${check.productHeroRatio} below minimum ${MIN_PRODUCT_HERO_RATIO}`,
      ),
    );
  }

  if (check.marketplaceScanOptimized === false) {
    violations.push(
      checkViolation(
        "MARKETPLACE_SCAN_MISMATCH",
        "marketplace",
        "Image must be optimized for fast marketplace card scanning",
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
    estimatedCognitiveLoad: estimatedLoad,
  };
}

export function applyCognitivePsychologyLearningFeedback(
  items: CognitivePsychologyKnowledge[],
  feedback: { knowledgeId: string; commercialScore?: number },
): CognitivePsychologyKnowledge[] {
  return items.map((k) => {
    if (k.id !== feedback.knowledgeId) return k;
    const delta = feedback.commercialScore !== undefined ? (feedback.commercialScore - 0.5) * 0.08 : 0;
    return { ...k, confidence: Math.max(0, Math.min(1, k.confidence + delta)) };
  });
}

export function validateCognitivePsychologyKnowledge(
  ctx: CognitivePsychologyKnowledgeContext = {},
): CognitivePsychologyKnowledgeReport {
  const violations: CognitivePsychologyKnowledgeViolation[] = [];

  if (ctx.overloadedComposition) {
    violations.push(violation("EXCESSIVE_COGNITIVE_LOAD", "Composition must minimize cognitive load"));
  }
  if (ctx.missingFocalPoint) {
    violations.push(violation("MISSING_FOCAL_POINT", "Primary attention center is required"));
  }
  if (ctx.slowPerception) {
    violations.push(violation("SLOW_VISUAL_PERCEPTION", "Image must be understood within scan window"));
  }
  if (ctx.textOnlyMeaning) {
    violations.push(violation("TEXT_ONLY_MEANING", "Product visuals must carry meaning before text"));
  }
  if (ctx.perceptionContradictsPsychology) {
    violations.push(violation("GESTALT_VIOLATION", "Visual structure must follow human perception laws"));
  }

  for (const k of SEED_COGNITIVE_PSYCHOLOGY_KNOWLEDGE) {
    if (!k.purpose || k.purpose.length < 10) {
      violations.push(violation("MISSING_FOCAL_POINT", `Missing purpose: ${k.id}`, k.id));
    }
  }

  const safety = recommendCognitivePsychologyKnowledge({ emotionalGoal: EmotionalTrigger.SAFETY });
  const technology = recommendCognitivePsychologyKnowledge({ emotionalGoal: EmotionalTrigger.TECHNOLOGY });
  if (!safety.some((k) => k.id === "emotional-trigger-safety")) {
    violations.push(violation("GESTALT_VIOLATION", "Safety emotional trigger knowledge must be available"));
  }
  if (!technology.some((k) => k.id === "emotional-trigger-technology")) {
    violations.push(violation("GESTALT_VIOLATION", "Technology emotional trigger knowledge must be available"));
  }

  const safetyTrigger = selectEmotionalTrigger({ emotionalGoal: EmotionalTrigger.SAFETY });
  const techTrigger = selectEmotionalTrigger({ category: "electronics" });
  if (safetyTrigger !== EmotionalTrigger.SAFETY || techTrigger !== EmotionalTrigger.TECHNOLOGY) {
    violations.push(violation("GESTALT_VIOLATION", "Emotional trigger selection must be context-aware"));
  }

  const validBlueprint = validateCognitivePsychologyBlueprint({
    competingFocalPoints: 1,
    semanticBlockCount: 3,
    productRecognizable: true,
    textOnlyMeaning: false,
    eyeMovementOrder: ["hero_product", "primary_benefit", "key_characteristic"],
    trustSignalsPresent: ["photo_quality", "clean_composition", "professional_lighting"],
    perceptionTimeMs: 1500,
    productHeroRatio: 0.45,
    paletteColorCount: 4,
    marketplaceScanOptimized: true,
    chaoticGaze: false,
  });
  if (!validBlueprint.valid) {
    violations.push(violation("SLOW_VISUAL_PERCEPTION", "Valid cognitive blueprint must pass validation"));
  }

  const invalidBlueprint = validateCognitivePsychologyBlueprint({
    competingFocalPoints: 3,
    semanticBlockCount: 8,
    productRecognizable: false,
    textOnlyMeaning: true,
    eyeMovementOrder: ["additional_information", "hero_product"],
    gestaltViolations: [GestaltPrinciple.PROXIMITY, GestaltPrinciple.FIGURE_GROUND],
    trustSignalsPresent: ["photo_quality"],
    perceptionTimeMs: 3500,
    productHeroRatio: 0.2,
    paletteColorCount: 9,
    marketplaceScanOptimized: false,
    chaoticGaze: true,
  });
  if (invalidBlueprint.valid || !invalidBlueprint.retryRecommended) {
    violations.push(violation("EXCESSIVE_COGNITIVE_LOAD", "Invalid cognitive blueprint must trigger retry"));
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    knowledge: [...SEED_COGNITIVE_PSYCHOLOGY_KNOWLEDGE],
    eyeMovementPath: [...EYE_MOVEMENT_PATH],
    goldenRuleSatisfied: unique.length === 0,
    attentionManaged: Boolean(getCognitivePsychologyKnowledge("selective-attention")),
    trustAware: Boolean(getCognitivePsychologyKnowledge("trust-formation")),
    evolutionReady: true,
  };
}

export function assertCognitivePsychologyKnowledge(
  ctx?: CognitivePsychologyKnowledgeContext,
): CognitivePsychologyKnowledgeReport {
  const report = validateCognitivePsychologyKnowledge(ctx);
  if (!report.valid) {
    throw new Error(
      `Cognitive psychology knowledge violation: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function runCognitivePsychologyKnowledge(input: {
  ctx?: CognitivePsychologyKnowledgeContext;
}): CognitivePsychologyKnowledgeReport {
  return validateCognitivePsychologyKnowledge(input.ctx);
}

export function isCognitivePsychologyKnowledgeFailure(
  code: string,
): code is CognitivePsychologyKnowledgeFailureCode {
  return [
    "EXCESSIVE_COGNITIVE_LOAD",
    "MISSING_FOCAL_POINT",
    "COMPETING_ATTENTION_CENTERS",
    "SLOW_VISUAL_PERCEPTION",
    "TEXT_ONLY_MEANING",
    "CHAOTIC_EYE_MOVEMENT",
    "GESTALT_VIOLATION",
    "INSUFFICIENT_TRUST_SIGNALS",
    "PRODUCT_NOT_RECOGNIZABLE",
    "MARKETPLACE_SCAN_MISMATCH",
  ].includes(code);
}
