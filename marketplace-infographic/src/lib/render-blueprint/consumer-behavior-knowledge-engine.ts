/**
 * Chapter 5.13 — Consumer Behavior Knowledge engine.
 * Formalized buyer decision models for marketplace commercial design.
 */
import { MARKETPLACE_SCAN_WINDOW_MS } from "./cognitive-psychology-knowledge-engine";
import { KnowledgeEvidenceSource } from "./design-knowledge-philosophy-types";
import {
  BuyingMode,
  DecisionJourneyStage,
  PurchaseMotivation,
  type BuyingModeId,
  type ConsumerBehaviorCondition,
  type ConsumerBehaviorKnowledgeContext,
  type ConsumerBehaviorKnowledgeFailureCode,
  type ConsumerBehaviorKnowledgeReport,
  type ConsumerBehaviorKnowledgeSource,
  type ConsumerBehaviorKnowledgeViolation,
  type ConsumerBehaviorRule,
  type ConsumerBehaviorSelectionContext,
  type ConsumerBlueprintCheck,
  type ConsumerBlueprintValidation,
  type ConsumerValidationViolation,
  type DecisionJourneyStageId,
  type DecisionJourneyStep,
  type PurchaseMotivationId,
  type RiskReductionSignal,
  type SocialProofSignal,
} from "./consumer-behavior-knowledge-types";

export {
  DecisionJourneyStage,
  PurchaseMotivation,
  BuyingMode,
  ConsumerSegmentFactor,
  type DecisionJourneyStageId,
  type PurchaseMotivationId,
  type BuyingModeId,
  type ConsumerSegmentFactorId,
  type ConsumerBehaviorCondition,
  type ConsumerBehaviorKnowledgeSource,
  type ConsumerBehaviorRule,
  type DecisionJourneyStep,
  type RiskReductionSignal,
  type SocialProofSignal,
  type ConsumerBehaviorSelectionContext,
  type ConsumerBlueprintCheck,
  type ConsumerValidationViolation,
  type ConsumerBlueprintValidation,
  type ConsumerBehaviorKnowledgeContext,
  type ConsumerBehaviorKnowledgeViolation,
  type ConsumerBehaviorKnowledgeReport,
  type ConsumerBehaviorKnowledgeFailureCode,
} from "./consumer-behavior-knowledge-types";

export const CONSUMER_BEHAVIOR_KNOWLEDGE_VERSION = "5.13.0";

export const CONSUMER_BEHAVIOR_KNOWLEDGE_GOLDEN_RULE =
  "The buyer purchases a solution to their task — not an image. Commercial infographic exists to guide the path: " +
  '"I saw → I understood → I trust → I want to open the card → I want to buy."';

export const MIN_TRUST_SCORE = 0.6;

export const MIN_PERCEIVED_VALUE = 0.55;

export const MAX_DECISION_TIME_MS = MARKETPLACE_SCAN_WINDOW_MS;

export const DECISION_JOURNEY_STEPS: readonly DecisionJourneyStep[] = [
  {
    rank: 1,
    stage: DecisionJourneyStage.ATTENTION,
    designFocus: "Hero product, contrast, simplicity, visual cleanliness",
    buyerQuestion: "Does this card deserve my attention?",
  },
  {
    rank: 2,
    stage: DecisionJourneyStage.INTEREST,
    designFocus: "Primary benefit, visual story, emotional triggers, usage scenario",
    buyerQuestion: "Why might this product interest me?",
  },
  {
    rank: 3,
    stage: DecisionJourneyStage.EVALUATION,
    designFocus: "Differentiation, quality cues, expectation fit, value justification",
    buyerQuestion: "How is this better than alternatives?",
  },
  {
    rank: 4,
    stage: DecisionJourneyStage.TRUST,
    designFocus: "Photo quality, realism, typography, composition, lighting consistency",
    buyerQuestion: "Can I trust this product and seller?",
  },
  {
    rank: 5,
    stage: DecisionJourneyStage.CLICK,
    designFocus: "Fast comprehension, comparative advantage on search grid",
    buyerQuestion: "Is it worth opening the product card?",
  },
  {
    rank: 6,
    stage: DecisionJourneyStage.PURCHASE,
    designFocus: "Risk reduction, value perception, motivation alignment",
    buyerQuestion: "Should I buy this?",
  },
] as const;

export const RISK_REDUCTION_SIGNALS: readonly RiskReductionSignal[] = [
  { id: "real_size", name: "Real Size", description: "Shows actual product dimensions in context" },
  { id: "usage_scenario", name: "Usage Scenario", description: "Demonstrates how product is used in life" },
  { id: "material_quality", name: "Material Quality", description: "Highlights materials and build quality" },
  { id: "construction_benefit", name: "Construction Benefit", description: "Explains structural advantages" },
  { id: "execution_quality", name: "Execution Quality", description: "Signals craftsmanship and finish" },
] as const;

export const SOCIAL_PROOF_SIGNALS: readonly SocialProofSignal[] = [
  { id: "design_level", name: "Design Level", description: "Professional design implies popular quality product" },
  { id: "photo_quality", name: "Photo Quality", description: "High photo quality substitutes for reviews on image" },
  { id: "layout_polish", name: "Layout Polish", description: "Neat layout signals seller professionalism" },
] as const;

export const PURCHASE_MOTIVATION_GUIDANCE: Record<PurchaseMotivationId, string> = {
  [PurchaseMotivation.FUNCTIONAL]: "Solve problem, complete task — lead with capability and specs",
  [PurchaseMotivation.EMOTIONAL]: "Pleasure, status, comfort, care, safety — lead with story and feeling",
};

export const BUYING_MODE_GUIDANCE: Record<BuyingModeId, string> = {
  [BuyingMode.IMPULSE]: "Emotional triggers, visual energy, clear USP, minimal cognitive load",
  [BuyingMode.RATIONAL]: "Structured comparison, details, realism, trust and risk reduction",
};

function source(id: ConsumerBehaviorKnowledgeSource["id"], label: string, evidenceLevel: number): ConsumerBehaviorKnowledgeSource {
  return { id, label, evidenceLevel };
}

function cond(
  field: string,
  operator: ConsumerBehaviorCondition["operator"],
  value: string | number | string[],
): ConsumerBehaviorCondition {
  return { field, operator, value };
}

function rule(partial: ConsumerBehaviorRule): ConsumerBehaviorRule {
  return partial;
}

export const SEED_CONSUMER_BEHAVIOR_RULES: readonly ConsumerBehaviorRule[] = [
  rule({
    id: "attention-stage-hook",
    behavior: "Buyer notices card via hero product and visual cleanliness",
    trigger: "Card appears in marketplace search grid",
    expectedReaction: "User pauses scroll and allocates attention",
    confidence: 0.96,
    conditions: [cond("decisionStage", "eq", DecisionJourneyStage.ATTENTION)],
    references: [
      source(KnowledgeEvidenceSource.MARKETPLACE_RESEARCH, "Marketplace attention research", 0.85),
      source(KnowledgeEvidenceSource.MARKETING, "CTR optimization studies", 0.8),
    ],
    stageId: DecisionJourneyStage.ATTENTION,
  }),
  rule({
    id: "interest-stage-story",
    behavior: "Buyer seeks why this product might be interesting",
    trigger: "Attention captured — card not dismissed",
    expectedReaction: "User reads primary benefit and visual story",
    confidence: 0.94,
    conditions: [cond("decisionStage", "eq", DecisionJourneyStage.INTEREST)],
    references: [
      source(KnowledgeEvidenceSource.MARKETING, "Interest conversion patterns", 0.82),
      source(KnowledgeEvidenceSource.UX, "Visual story comprehension", 0.8),
    ],
    stageId: DecisionJourneyStage.INTEREST,
  }),
  rule({
    id: "evaluation-stage-compare",
    behavior: "Buyer compares differentiation, quality, and price fit",
    trigger: "Interest formed — evaluation begins",
    expectedReaction: "User assesses whether product meets expectations",
    confidence: 0.93,
    conditions: [cond("decisionStage", "eq", DecisionJourneyStage.EVALUATION)],
    references: [
      source(KnowledgeEvidenceSource.MARKETPLACE_RESEARCH, "Comparative shopping behavior", 0.86),
      source(KnowledgeEvidenceSource.SALES_STATISTICS, "Category conversion data", 0.84),
    ],
    stageId: DecisionJourneyStage.EVALUATION,
  }),
  rule({
    id: "trust-measurable-signals",
    behavior: "Trust forms from many small visual quality signals",
    trigger: "Buyer evaluates credibility before specs",
    expectedReaction: "User feels product and seller are credible",
    confidence: 0.95,
    conditions: [],
    references: [
      source(KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY, "Trust formation research", 0.88),
      source(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial quality cues", 0.9),
    ],
    stageId: DecisionJourneyStage.TRUST,
  }),
  rule({
    id: "risk-reduction-visuals",
    behavior: "Visuals reduce purchase risk via size, scenario, materials, construction",
    trigger: "Buyer fears wrong purchase or poor quality",
    expectedReaction: "User perceives lower risk and higher confidence",
    confidence: 0.92,
    conditions: [],
    references: [
      source(KnowledgeEvidenceSource.MARKETING, "Risk reduction in e-commerce", 0.83),
      source(KnowledgeEvidenceSource.UX, "Purchase anxiety mitigation", 0.81),
    ],
  }),
  rule({
    id: "comparative-behavior-grid",
    behavior: "Product is always compared with neighboring cards on same screen",
    trigger: "Marketplace search results displayed",
    expectedReaction: "User selects card that stands out competitively",
    confidence: 0.97,
    conditions: [cond("marketplace", "eq", "marketplace")],
    references: [
      source(KnowledgeEvidenceSource.MARKETPLACE_RESEARCH, "Grid comparison behavior", 0.9),
      source(KnowledgeEvidenceSource.PLATFORM_DATA, "Click-through patterns", 0.85),
    ],
    stageId: DecisionJourneyStage.CLICK,
  }),
  rule({
    id: "impulse-buying-mode",
    behavior: "Impulse categories need emotional triggers and minimal cognitive load",
    trigger: "Low-involvement or emotional category purchase",
    expectedReaction: "User clicks quickly on clear emotional USP",
    confidence: 0.9,
    conditions: [cond("buyingMode", "eq", BuyingMode.IMPULSE)],
    references: [
      source(KnowledgeEvidenceSource.MARKETING, "Impulse purchase psychology", 0.84),
      source(KnowledgeEvidenceSource.SALES_STATISTICS, "Impulse category CTR", 0.82),
    ],
    buyingModeId: BuyingMode.IMPULSE,
  }),
  rule({
    id: "rational-comparison-mode",
    behavior: "High-involvement categories need structured details and trust",
    trigger: "Rational comparison purchase scenario",
    expectedReaction: "User evaluates specs and quality before click",
    confidence: 0.91,
    conditions: [cond("buyingMode", "eq", BuyingMode.RATIONAL)],
    references: [
      source(KnowledgeEvidenceSource.MARKETPLACE_RESEARCH, "Considered purchase behavior", 0.87),
      source(KnowledgeEvidenceSource.UX, "Information comparison patterns", 0.8),
    ],
    buyingModeId: BuyingMode.RATIONAL,
  }),
  rule({
    id: "value-perception-visual",
    behavior: "Perceived value depends on visual presentation quality",
    trigger: "Buyer judges price-worthiness from image alone",
    expectedReaction: "User perceives premium or fair value from visuals",
    confidence: 0.94,
    conditions: [],
    references: [
      source(KnowledgeEvidenceSource.MARKETING, "Value perception studies", 0.86),
      source(KnowledgeEvidenceSource.INDUSTRIAL_DESIGN, "Premium visual signaling", 0.88),
    ],
  }),
  rule({
    id: "functional-motivation",
    behavior: "Functional buyers need problem-solution clarity",
    trigger: "Task-oriented purchase motivation",
    expectedReaction: "User understands how product solves their task",
    confidence: 0.9,
    conditions: [cond("purchaseMotivation", "eq", PurchaseMotivation.FUNCTIONAL)],
    references: [
      source(KnowledgeEvidenceSource.MARKETING, "Functional buying motivation", 0.83),
      source(KnowledgeEvidenceSource.UX, "Task completion framing", 0.79),
    ],
    motivationId: PurchaseMotivation.FUNCTIONAL,
  }),
  rule({
    id: "emotional-motivation",
    behavior: "Emotional buyers respond to pleasure, status, comfort, care, safety",
    trigger: "Emotion-driven purchase motivation",
    expectedReaction: "User feels desired emotional outcome from visuals",
    confidence: 0.91,
    conditions: [cond("purchaseMotivation", "eq", PurchaseMotivation.EMOTIONAL)],
    references: [
      source(KnowledgeEvidenceSource.MARKETING, "Emotional purchase drivers", 0.85),
      source(KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY, "Emotional decision primacy", 0.87),
    ],
    motivationId: PurchaseMotivation.EMOTIONAL,
  }),
  rule({
    id: "social-proof-visual",
    behavior: "Visual quality substitutes for social proof when reviews are not on image",
    trigger: "Buyer infers popularity and professionalism from design",
    expectedReaction: "User assumes product is popular and trustworthy",
    confidence: 0.89,
    conditions: [],
    references: [
      source(KnowledgeEvidenceSource.MARKETING, "Visual social proof heuristics", 0.82),
      source(KnowledgeEvidenceSource.SALES_STATISTICS, "Design quality correlation", 0.8),
    ],
  }),
  rule({
    id: "decision-speed-marketplace",
    behavior: "Marketplace decisions must be fast — long analysis reduces click probability",
    trigger: "Buyer scans multiple cards quickly",
    expectedReaction: "User decides to click within seconds",
    confidence: 0.96,
    conditions: [cond("marketplace", "eq", "marketplace")],
    references: [
      source(KnowledgeEvidenceSource.MARKETPLACE_RESEARCH, "Decision speed on marketplaces", 0.9),
      source(KnowledgeEvidenceSource.PLATFORM_DATA, "Dwell time analytics", 0.86),
    ],
    stageId: DecisionJourneyStage.CLICK,
  }),
  rule({
    id: "consumer-segmentation",
    behavior: "Story adapts to age, expertise, scenario, category, and engagement",
    trigger: "Different audience segments view same category",
    expectedReaction: "User feels image speaks to their specific needs",
    confidence: 0.88,
    conditions: [],
    references: [
      source(KnowledgeEvidenceSource.MARKETPLACE_RESEARCH, "Segment behavior differences", 0.84),
      source(KnowledgeEvidenceSource.MARKETING, "Persona-based conversion", 0.81),
    ],
  }),
] as const;

function evaluateCondition(
  condition: ConsumerBehaviorCondition,
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

export function getConsumerBehaviorRule(id: string): ConsumerBehaviorRule | undefined {
  return SEED_CONSUMER_BEHAVIOR_RULES.find((r) => r.id === id);
}

export function getDecisionJourney(): readonly DecisionJourneyStep[] {
  return DECISION_JOURNEY_STEPS;
}

export function getRiskReductionSignals(): readonly RiskReductionSignal[] {
  return RISK_REDUCTION_SIGNALS;
}

export function getSocialProofSignals(): readonly SocialProofSignal[] {
  return SOCIAL_PROOF_SIGNALS;
}

export function matchConsumerBehaviorRules(
  ctx: ConsumerBehaviorSelectionContext,
): ConsumerBehaviorRule[] {
  const map: Record<string, string | number | undefined> = {
    category: ctx.category,
    marketplace: ctx.marketplace,
    buyingMode: ctx.buyingMode,
    purchaseMotivation: ctx.purchaseMotivation,
    decisionStage: ctx.decisionStage,
    engagementLevel: ctx.engagementLevel,
    ageGroup: ctx.ageGroup,
    professionalLevel: ctx.professionalLevel,
    useScenario: ctx.useScenario,
  };
  return SEED_CONSUMER_BEHAVIOR_RULES.filter((r) => {
    if (r.conditions.length === 0) return true;
    return r.conditions.every((c) => evaluateCondition(c, map));
  });
}

export function recommendConsumerBehaviorRules(
  ctx: ConsumerBehaviorSelectionContext,
): ConsumerBehaviorRule[] {
  const all = matchConsumerBehaviorRules(ctx);
  const conditional = all.filter((r) => r.conditions.length > 0);
  const universal = all
    .filter((r) => r.conditions.length === 0)
    .sort((a, b) => b.confidence - a.confidence);
  const combined = [...new Map([...conditional, ...universal].map((r) => [r.id, r])).values()];
  return combined.slice(0, 10);
}

export function selectBuyingMode(ctx: ConsumerBehaviorSelectionContext): BuyingModeId {
  if (ctx.buyingMode) return ctx.buyingMode;
  if (ctx.category && ["beauty", "gifts", "snacks", "toys"].includes(ctx.category)) {
    return BuyingMode.IMPULSE;
  }
  if (ctx.category && ["electronics", "tools", "appliances"].includes(ctx.category)) {
    return BuyingMode.RATIONAL;
  }
  return ctx.engagementLevel === "low" ? BuyingMode.IMPULSE : BuyingMode.RATIONAL;
}

export function selectPurchaseMotivation(ctx: ConsumerBehaviorSelectionContext): PurchaseMotivationId {
  if (ctx.purchaseMotivation) return ctx.purchaseMotivation;
  if (ctx.category && ["tools", "electronics", "kitchen"].includes(ctx.category)) {
    return PurchaseMotivation.FUNCTIONAL;
  }
  if (ctx.category && ["beauty", "fashion", "gifts"].includes(ctx.category)) {
    return PurchaseMotivation.EMOTIONAL;
  }
  return PurchaseMotivation.FUNCTIONAL;
}

export function estimateTrustScore(check: {
  heroProductPresent?: boolean;
  visualCleanliness?: boolean;
  socialProofSignals?: string[];
  riskReductionSignals?: string[];
}): number {
  let score = 0.35;
  if (check.heroProductPresent) score += 0.2;
  if (check.visualCleanliness) score += 0.15;
  if (check.socialProofSignals?.includes("photo_quality")) score += 0.15;
  if (check.socialProofSignals?.includes("layout_polish")) score += 0.1;
  if (check.riskReductionSignals && check.riskReductionSignals.length >= 2) score += 0.1;
  return Math.min(1, score);
}

export function estimatePerceivedValue(check: {
  trustScore?: number;
  visualCleanliness?: boolean;
  comparativeAdvantage?: boolean;
  primaryBenefitPresent?: boolean;
}): number {
  const trust = check.trustScore ?? 0.5;
  let value = trust * 0.5;
  if (check.visualCleanliness) value += 0.15;
  if (check.comparativeAdvantage) value += 0.2;
  if (check.primaryBenefitPresent) value += 0.15;
  return Math.min(1, value);
}

function checkViolation(
  code: ConsumerBehaviorKnowledgeFailureCode,
  aspect: string,
  message: string,
): ConsumerValidationViolation {
  return { code, aspect, message };
}

function violation(
  code: ConsumerBehaviorKnowledgeFailureCode,
  message: string,
  ruleId?: string,
): ConsumerBehaviorKnowledgeViolation {
  return { code, message, ruleId };
}

export function validateRiskReduction(signals?: string[]): boolean {
  if (!signals || signals.length === 0) return false;
  const core = ["usage_scenario", "material_quality"];
  return core.some((id) => signals.includes(id));
}

export function validateConsumerBehaviorBlueprint(
  check: ConsumerBlueprintCheck,
): ConsumerBlueprintValidation {
  const violations: ConsumerValidationViolation[] = [];
  const trustScore =
    check.trustScore ??
    estimateTrustScore({
      heroProductPresent: check.heroProductPresent,
      visualCleanliness: check.visualCleanliness,
      socialProofSignals: check.socialProofSignals,
      riskReductionSignals: check.riskReductionSignals,
    });
  const perceivedValue =
    check.perceivedValue ??
    estimatePerceivedValue({
      trustScore,
      visualCleanliness: check.visualCleanliness,
      comparativeAdvantage: check.comparativeAdvantage,
      primaryBenefitPresent: check.primaryBenefitPresent,
    });

  if (check.heroProductPresent === false) {
    violations.push(
      checkViolation(
        "MISSING_ATTENTION_HOOK",
        "attention",
        "Hero product is required to win attention on marketplace grid",
      ),
    );
  }

  if (check.primaryBenefitPresent === false) {
    violations.push(
      checkViolation(
        "NO_INTEREST_SIGNAL",
        "interest",
        "Primary benefit must create interest after attention is captured",
      ),
    );
  }

  if (check.decisionStage === DecisionJourneyStage.EVALUATION && check.comparativeAdvantage === false) {
    violations.push(
      checkViolation(
        "WEAK_EVALUATION_SUPPORT",
        "evaluation",
        "Evaluation stage requires clear differentiation from competitors",
      ),
    );
  }

  if (trustScore < MIN_TRUST_SCORE) {
    violations.push(
      checkViolation(
        "INSUFFICIENT_TRUST",
        "trust",
        `Trust score ${trustScore.toFixed(2)} below minimum ${MIN_TRUST_SCORE}`,
      ),
    );
  }

  if (check.riskReductionSignals && !validateRiskReduction(check.riskReductionSignals)) {
    violations.push(
      checkViolation(
        "HIGH_PERCEIVED_RISK",
        "risk",
        "Risk reduction requires usage scenario or material quality signals",
      ),
    );
  }

  if (check.comparativeAdvantage === false && check.decisionStage !== DecisionJourneyStage.ATTENTION) {
    violations.push(
      checkViolation(
        "WEAK_COMPARATIVE_ADVANTAGE",
        "comparison",
        "Image must stand out against neighboring cards on marketplace grid",
      ),
    );
  }

  if (check.decisionTimeMs !== undefined && check.decisionTimeMs > MAX_DECISION_TIME_MS) {
    violations.push(
      checkViolation(
        "SLOW_DECISION_PATH",
        "decisionSpeed",
        `Decision time ${check.decisionTimeMs}ms exceeds marketplace limit ${MAX_DECISION_TIME_MS}ms`,
      ),
    );
  }

  if (check.aestheticOnly) {
    violations.push(
      checkViolation(
        "AESTHETIC_ONLY_DESIGN",
        "philosophy",
        "Design must model buyer behavior — not aesthetics alone",
      ),
    );
  }

  if (check.segmentationMatched === false) {
    violations.push(
      checkViolation(
        "SEGMENTATION_MISMATCH",
        "segmentation",
        "Story must adapt to target consumer segment",
      ),
    );
  }

  if (perceivedValue < MIN_PERCEIVED_VALUE) {
    violations.push(
      checkViolation(
        "MISSING_VALUE_PERCEPTION",
        "value",
        `Perceived value ${perceivedValue.toFixed(2)} below minimum ${MIN_PERCEIVED_VALUE}`,
      ),
    );
  }

  if (check.buyingMode === BuyingMode.IMPULSE && check.impulseOptimized === false) {
    violations.push(
      checkViolation(
        "NO_INTEREST_SIGNAL",
        "impulse",
        "Impulse categories need emotional triggers and minimal cognitive load",
      ),
    );
  }

  if (check.clickIntentLikely === false && check.decisionStage === DecisionJourneyStage.CLICK) {
    violations.push(
      checkViolation(
        "SLOW_DECISION_PATH",
        "click",
        "Blueprint must support likely card open intent at click stage",
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
    estimatedTrustScore: trustScore,
    estimatedPerceivedValue: perceivedValue,
  };
}

export function applyConsumerBehaviorLearningFeedback(
  items: ConsumerBehaviorRule[],
  feedback: { ruleId: string; commercialScore?: number },
): ConsumerBehaviorRule[] {
  return items.map((r) => {
    if (r.id !== feedback.ruleId) return r;
    const delta = feedback.commercialScore !== undefined ? (feedback.commercialScore - 0.5) * 0.08 : 0;
    return { ...r, confidence: Math.max(0, Math.min(1, r.confidence + delta)) };
  });
}

export function validateConsumerBehaviorKnowledge(
  ctx: ConsumerBehaviorKnowledgeContext = {},
): ConsumerBehaviorKnowledgeReport {
  const violations: ConsumerBehaviorKnowledgeViolation[] = [];

  if (ctx.aestheticOnlyDesign) {
    violations.push(violation("AESTHETIC_ONLY_DESIGN", "Design must be built around purchase behavior"));
  }
  if (ctx.ignoresDecisionJourney) {
    violations.push(violation("SLOW_DECISION_PATH", "Decision journey stages must be modeled"));
  }
  if (ctx.missingTrustMechanisms) {
    violations.push(violation("INSUFFICIENT_TRUST", "Trust formation mechanisms are required"));
  }
  if (ctx.highPerceivedRisk) {
    violations.push(violation("HIGH_PERCEIVED_RISK", "Visuals must reduce purchase risk"));
  }
  if (ctx.noBuyerBehaviorModel) {
    violations.push(violation("AESTHETIC_ONLY_DESIGN", "Buyer behavior model is mandatory"));
  }

  for (const r of SEED_CONSUMER_BEHAVIOR_RULES) {
    if (!r.expectedReaction || r.expectedReaction.length < 10) {
      violations.push(violation("NO_INTEREST_SIGNAL", `Missing expected reaction: ${r.id}`, r.id));
    }
    if (r.references.length === 0) {
      violations.push(violation("INSUFFICIENT_TRUST", `Missing references: ${r.id}`, r.id));
    }
  }

  const impulse = recommendConsumerBehaviorRules({ buyingMode: BuyingMode.IMPULSE });
  const rational = recommendConsumerBehaviorRules({ buyingMode: BuyingMode.RATIONAL });
  if (!impulse.some((r) => r.id === "impulse-buying-mode")) {
    violations.push(violation("SEGMENTATION_MISMATCH", "Impulse buying rules must be available"));
  }
  if (!rational.some((r) => r.id === "rational-comparison-mode")) {
    violations.push(violation("SEGMENTATION_MISMATCH", "Rational comparison rules must be available"));
  }

  const impulseMode = selectBuyingMode({ category: "beauty" });
  const rationalMode = selectBuyingMode({ category: "electronics" });
  if (impulseMode !== BuyingMode.IMPULSE || rationalMode !== BuyingMode.RATIONAL) {
    violations.push(violation("SEGMENTATION_MISMATCH", "Buying mode selection must be category-aware"));
  }

  const validBlueprint = validateConsumerBehaviorBlueprint({
    heroProductPresent: true,
    primaryBenefitPresent: true,
    usageScenarioPresent: true,
    visualCleanliness: true,
    comparativeAdvantage: true,
    decisionTimeMs: 1500,
    riskReductionSignals: ["usage_scenario", "material_quality"],
    socialProofSignals: ["photo_quality", "layout_polish"],
    segmentationMatched: true,
    impulseOptimized: true,
    clickIntentLikely: true,
    decisionStage: DecisionJourneyStage.CLICK,
    buyingMode: BuyingMode.IMPULSE,
    purchaseMotivation: PurchaseMotivation.EMOTIONAL,
  });
  if (!validBlueprint.valid) {
    violations.push(violation("INSUFFICIENT_TRUST", "Valid consumer behavior blueprint must pass validation"));
  }

  const invalidBlueprint = validateConsumerBehaviorBlueprint({
    heroProductPresent: false,
    primaryBenefitPresent: false,
    visualCleanliness: false,
    comparativeAdvantage: false,
    decisionTimeMs: 4000,
    riskReductionSignals: [],
    aestheticOnly: true,
    segmentationMatched: false,
    impulseOptimized: false,
    clickIntentLikely: false,
    decisionStage: DecisionJourneyStage.EVALUATION,
    buyingMode: BuyingMode.IMPULSE,
  });
  if (invalidBlueprint.valid || !invalidBlueprint.retryRecommended) {
    violations.push(violation("AESTHETIC_ONLY_DESIGN", "Invalid consumer blueprint must trigger retry"));
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    rules: [...SEED_CONSUMER_BEHAVIOR_RULES],
    decisionJourney: [...DECISION_JOURNEY_STEPS],
    goldenRuleSatisfied: unique.length === 0,
    journeyAware: Boolean(getConsumerBehaviorRule("attention-stage-hook")),
    trustMeasurable: Boolean(getConsumerBehaviorRule("trust-measurable-signals")),
    evolutionReady: true,
  };
}

export function assertConsumerBehaviorKnowledge(
  ctx?: ConsumerBehaviorKnowledgeContext,
): ConsumerBehaviorKnowledgeReport {
  const report = validateConsumerBehaviorKnowledge(ctx);
  if (!report.valid) {
    throw new Error(
      `Consumer behavior knowledge violation: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function runConsumerBehaviorKnowledge(input: {
  ctx?: ConsumerBehaviorKnowledgeContext;
}): ConsumerBehaviorKnowledgeReport {
  return validateConsumerBehaviorKnowledge(input.ctx);
}

export function isConsumerBehaviorKnowledgeFailure(
  code: string,
): code is ConsumerBehaviorKnowledgeFailureCode {
  return [
    "MISSING_ATTENTION_HOOK",
    "NO_INTEREST_SIGNAL",
    "WEAK_EVALUATION_SUPPORT",
    "INSUFFICIENT_TRUST",
    "HIGH_PERCEIVED_RISK",
    "WEAK_COMPARATIVE_ADVANTAGE",
    "SLOW_DECISION_PATH",
    "AESTHETIC_ONLY_DESIGN",
    "SEGMENTATION_MISMATCH",
    "MISSING_VALUE_PERCEPTION",
  ].includes(code);
}
