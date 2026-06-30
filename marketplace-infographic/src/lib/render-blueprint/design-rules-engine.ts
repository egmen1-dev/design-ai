/**
 * Chapter 5.6 — Design Rules Engine.
 * Applies Design Knowledge to agent-specific, context-dependent recommendations.
 */
import type { AgentContractId } from "./agent-contracts";
import { getSeedKnowledgeRules } from "./design-knowledge-philosophy-engine";
import { KnowledgeEvidenceSource } from "./design-knowledge-philosophy-types";
import {
  MarketplaceImageContext,
  MarketplaceKnowledgeId,
  ProductCategoryKnowledge,
} from "./marketplace-knowledge-types";
import {
  RuleDomain,
  RuleKind,
  type AgentRuleRecommendation,
  type ComposedRecommendation,
  type DesignRule,
  type DesignRuleConflict,
  type DesignRuleContext,
  type DesignRuleKnowledgeSource,
  type DesignRuleRecommendation,
  type DesignRulesEngineContext,
  type DesignRulesEngineFailureCode,
  type DesignRulesEngineReport,
  type DesignRulesEngineViolation,
  type DesignRulesExecutionResult,
  type RuleCondition,
  type RuleLearningFeedback,
  type RuleMatchResult,
  type RuleScoreWeights,
} from "./design-rules-engine-types";

export {
  RuleKind,
  RuleDomain,
  type RuleKindId,
  type RuleDomainId,
  type RuleCondition,
  type DesignRuleRecommendation,
  type DesignRuleKnowledgeSource,
  type DesignRule,
  type DesignRuleContext,
  type RuleScoreWeights,
  type RuleMatchResult,
  type DesignRuleConflict,
  type ComposedRecommendation,
  type AgentRuleRecommendation,
  type DesignRulesExecutionResult,
  type RuleLearningFeedback,
  type DesignRulesEngineContext,
  type DesignRulesEngineViolation,
  type DesignRulesEngineReport,
  type DesignRulesEngineFailureCode,
} from "./design-rules-engine-types";

export const DESIGN_RULES_ENGINE_VERSION = "5.6.0";

export const DESIGN_RULES_ENGINE_GOLDEN_RULE =
  "Knowledge answers what is known. Design Rules Engine answers what should be done right now. " +
  "It transforms a static knowledge base into a working intelligent system that helps each agent " +
  "make professional, context-dependent, and explainable design decisions.";

export const RULE_SCORE_WEIGHTS: RuleScoreWeights = {
  priority: 0.4,
  confidence: 0.3,
  contextMatch: 0.2,
  historicalSuccess: 0.1,
};

const EVIDENCE_LEVEL_MAP: Record<string, number> = {
  [KnowledgeEvidenceSource.EXPERT_CURATED]: 0.95,
  [KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY]: 0.9,
  [KnowledgeEvidenceSource.MARKETPLACE_RESEARCH]: 0.85,
  [KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY]: 0.85,
  [KnowledgeEvidenceSource.MARKETING]: 0.8,
  [KnowledgeEvidenceSource.SALES_STATISTICS]: 0.8,
};

function source(id: string, label: string, evidenceLevel: number): DesignRuleKnowledgeSource {
  return { id, label, evidenceLevel };
}

function condition(
  field: string,
  operator: RuleCondition["operator"],
  value: string | string[],
): RuleCondition {
  return { field, operator, value };
}

function rule(partial: DesignRule): DesignRule {
  return partial;
}

export const SEED_DESIGN_RULES: readonly DesignRule[] = [
  rule({
    id: "amazon-main-white-background",
    domain: RuleDomain.MARKETPLACE,
    kind: RuleKind.MANDATORY,
    conditions: [
      condition("marketplace", "eq", MarketplaceKnowledgeId.AMAZON),
      condition("imageContext", "eq", MarketplaceImageContext.MAIN_IMAGE),
    ],
    recommendation: {
      action: "use_pure_white_background",
      summary: "Pure white background (RGB 255,255,255)",
      reason: "Amazon main image policy requires pure white background for listing approval.",
    },
    priority: 100,
    confidence: 0.99,
    constraints: ["background must be #ffffff"],
    sources: [source("marketplace-research", "Amazon Seller Central", 0.95)],
    agentIds: ["composition-director", "scene-director", "commercial-photo-director"],
  }),
  rule({
    id: "luxury-kitchen-warm-lighting",
    domain: RuleDomain.LIGHTING,
    kind: RuleKind.ADVISORY,
    conditions: [
      condition("category", "in", [ProductCategoryKnowledge.KITCHEN, "kitchen"]),
      condition("businessGoal", "in", ["Premium", "Luxury", "premium", "luxury"]),
    ],
    recommendation: {
      action: "warm_soft_lighting",
      summary: "Warm Soft Lighting",
      reason:
        "Luxury kitchen products show higher conversion with warm natural lighting that conveys home comfort.",
    },
    priority: 75,
    confidence: 0.83,
    constraints: [],
    sources: [
      source(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial Photography", 0.9),
      source(KnowledgeEvidenceSource.MARKETING, "Marketing Analytics", 0.8),
    ],
    historicalSuccess: 0.88,
    agentIds: ["lighting-director", "commercial-photo-director"],
  }),
  rule({
    id: "electronics-minimal-background",
    domain: RuleDomain.COMPOSITION,
    kind: RuleKind.ADVISORY,
    conditions: [
      condition("category", "in", [ProductCategoryKnowledge.ELECTRONICS, "electronics"]),
    ],
    recommendation: {
      action: "minimal_clean_background",
      summary: "Minimal Background",
      reason: "Electronics buyers expect technological precision conveyed through clean minimal composition.",
    },
    priority: 70,
    confidence: 0.85,
    constraints: [],
    sources: [source(KnowledgeEvidenceSource.INDUSTRIAL_DESIGN, "Industrial Design", 0.88)],
    historicalSuccess: 0.82,
    agentIds: ["composition-director", "scene-director"],
  }),
  rule({
    id: "beauty-soft-premium-lighting",
    domain: RuleDomain.LIGHTING,
    kind: RuleKind.ADVISORY,
    conditions: [
      condition("category", "in", [ProductCategoryKnowledge.BEAUTY, "beauty", "cosmetics"]),
    ],
    recommendation: {
      action: "soft_premium_lighting",
      summary: "Soft Premium Lighting",
      reason: "Beauty products perform better with soft premium lighting that enhances texture and trust.",
    },
    priority: 72,
    confidence: 0.87,
    constraints: [],
    sources: [
      source(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY, "Commercial Photography", 0.9),
      source(KnowledgeEvidenceSource.COGNITIVE_PSYCHOLOGY, "Cognitive Psychology", 0.85),
    ],
    historicalSuccess: 0.9,
    agentIds: ["lighting-director", "visual-story-director"],
  }),
  rule({
    id: "marketplace-large-product",
    domain: RuleDomain.MARKETPLACE,
    kind: RuleKind.MANDATORY,
    conditions: [condition("imageContext", "eq", MarketplaceImageContext.MAIN_IMAGE)],
    recommendation: {
      action: "product_fills_frame",
      summary: "Large Product in Frame",
      reason: "Main images must show the product prominently to maximize click-through on marketplace search.",
    },
    priority: 90,
    confidence: 0.92,
    constraints: ["product fill >= 85%"],
    sources: [source("marketplace-research", "Marketplace CTR Studies", 0.85)],
    agentIds: ["composition-director"],
    conflictsWith: ["composition-large-negative-space"],
  }),
  rule({
    id: "composition-large-negative-space",
    domain: RuleDomain.COMPOSITION,
    kind: RuleKind.ADVISORY,
    conditions: [
      condition("businessGoal", "in", ["Premium", "Luxury", "Minimal", "premium", "luxury", "minimal"]),
    ],
    recommendation: {
      action: "large_negative_space",
      summary: "Large Negative Space",
      reason: "Premium and minimal compositions benefit from generous negative space conveying luxury.",
    },
    priority: 65,
    confidence: 0.8,
    constraints: [],
    sources: [source(KnowledgeEvidenceSource.EXPERT_CURATED, "Expert Curated", 0.9)],
    historicalSuccess: 0.78,
    agentIds: ["composition-director"],
    conflictsWith: ["marketplace-large-product"],
  }),
  rule({
    id: "sports-dynamic-energy",
    domain: RuleDomain.PHOTOGRAPHY,
    kind: RuleKind.ADVISORY,
    conditions: [
      condition("category", "in", [ProductCategoryKnowledge.SPORTS, "sports"]),
    ],
    recommendation: {
      action: "dynamic_energetic_composition",
      summary: "Dynamic Energetic Composition",
      reason: "Sports products convert better with dynamic high-energy visual language.",
    },
    priority: 68,
    confidence: 0.81,
    constraints: [],
    sources: [source(KnowledgeEvidenceSource.MARKETING, "Marketing Analytics", 0.8)],
    historicalSuccess: 0.84,
    agentIds: ["visual-story-director", "scene-director"],
  }),
  rule({
    id: "furniture-spacious-interior",
    domain: RuleDomain.COMPOSITION,
    kind: RuleKind.ADVISORY,
    conditions: [
      condition("category", "in", [ProductCategoryKnowledge.FURNITURE, "furniture"]),
    ],
    recommendation: {
      action: "spacious_interior_context",
      summary: "Spacious Interior Context",
      reason: "Furniture buyers need room-scale context to evaluate size and fit.",
    },
    priority: 70,
    confidence: 0.86,
    constraints: [],
    sources: [source(KnowledgeEvidenceSource.EXPERT_CURATED, "Expert Curated", 0.9)],
    historicalSuccess: 0.85,
    agentIds: ["scene-director", "composition-director"],
  }),
] as const;

export const RULES_ENGINE_AGENT_SCOPE: readonly AgentContractId[] = [
  "lighting-director",
  "composition-director",
  "scene-director",
  "commercial-photo-director",
  "visual-story-director",
] as const;

function violation(
  code: DesignRulesEngineViolation["code"],
  message: string,
  ruleId?: string,
): DesignRulesEngineViolation {
  return { code, message, ruleId };
}

function getContextValue(ctx: DesignRuleContext, field: string): string | undefined {
  const map: Record<string, string | undefined> = {
    product: ctx.product,
    category: ctx.category,
    marketplace: ctx.marketplace,
    audience: ctx.audience,
    scene: ctx.scene,
    brand: ctx.brand,
    businessGoal: ctx.businessGoal,
    story: ctx.story,
    imageContext: ctx.imageContext,
    priceSegment: ctx.priceSegment,
  };
  return map[field]?.toLowerCase();
}

export function evaluateCondition(cond: RuleCondition, ctx: DesignRuleContext): boolean {
  const actual = getContextValue(ctx, cond.field);
  if (actual === undefined) return false;

  if (cond.operator === "eq") {
    return actual === String(cond.value).toLowerCase();
  }
  if (cond.operator === "contains") {
    return actual.includes(String(cond.value).toLowerCase());
  }
  if (cond.operator === "in") {
    const values = Array.isArray(cond.value) ? cond.value : [cond.value];
    return values.map((v) => v.toLowerCase()).includes(actual);
  }
  return false;
}

export function computeContextMatch(designRule: DesignRule, ctx: DesignRuleContext): number {
  if (designRule.conditions.length === 0) return 0;
  const matched = designRule.conditions.filter((c) => evaluateCondition(c, ctx)).length;
  return Math.round((matched / designRule.conditions.length) * 100);
}

export function computeRuleScore(
  designRule: DesignRule,
  contextMatch: number,
  weights: RuleScoreWeights = RULE_SCORE_WEIGHTS,
): number {
  const priorityNorm = Math.min(designRule.priority, 100);
  const confidenceNorm = designRule.confidence * 100;
  const historicalNorm = (designRule.historicalSuccess ?? 0.5) * 100;

  const score =
    priorityNorm * weights.priority +
    confidenceNorm * weights.confidence +
    contextMatch * weights.contextMatch +
    historicalNorm * weights.historicalSuccess;

  return Math.round(score);
}

export function matchRule(designRule: DesignRule, ctx: DesignRuleContext): RuleMatchResult {
  const allMatch =
    designRule.conditions.length === 0 ||
    designRule.conditions.every((c) => evaluateCondition(c, ctx));
  const contextMatch = computeContextMatch(designRule, ctx);
  const score = allMatch ? computeRuleScore(designRule, contextMatch) : 0;

  return {
    rule: designRule,
    contextMatch,
    score,
    matched: allMatch,
    mandatory: designRule.kind === RuleKind.MANDATORY,
  };
}

export function matchRules(
  rules: readonly DesignRule[],
  ctx: DesignRuleContext,
): RuleMatchResult[] {
  return rules.map((r) => matchRule(r, ctx)).filter((m) => m.matched);
}

export function prioritizeRules(matches: RuleMatchResult[]): RuleMatchResult[] {
  const mandatory = matches.filter((m) => m.mandatory);
  const advisory = matches
    .filter((m) => !m.mandatory)
    .sort((a, b) => b.score - a.score);
  return [...mandatory.sort((a, b) => b.score - a.score), ...advisory];
}

export function resolveRuleConflicts(matches: RuleMatchResult[]): {
  resolved: RuleMatchResult[];
  conflicts: DesignRuleConflict[];
} {
  const conflicts: DesignRuleConflict[] = [];
  const excluded = new Set<string>();
  const byId = new Map(matches.map((m) => [m.rule.id, m]));

  for (const match of matches) {
    if (!match.rule.conflictsWith) continue;
    for (const otherId of match.rule.conflictsWith) {
      const other = byId.get(otherId);
      if (!other) continue;

      const winner =
        match.mandatory && !other.mandatory
          ? match
          : other.mandatory && !match.mandatory
            ? other
            : match.score >= other.score
              ? match
              : other;
      const loser = winner.rule.id === match.rule.id ? other : match;

      conflicts.push({
        ruleA: match.rule.id,
        ruleB: other.rule.id,
        winner: winner.rule.id,
        resolution:
          winner.mandatory
            ? `Mandatory ${winner.rule.id} overrides advisory ${loser.rule.id}`
            : `Higher score (${winner.score} vs ${loser.score}) — business goal and confidence resolved conflict`,
      });
      excluded.add(loser.rule.id);
    }
  }

  return {
    resolved: matches.filter((m) => !excluded.has(m.rule.id)),
    conflicts,
  };
}

export function composeRules(matches: RuleMatchResult[]): ComposedRecommendation {
  const actions = matches.map((m) => m.rule.recommendation.action);
  const reasons = matches.map((m) => m.rule.recommendation.reason);
  const summaries = matches.map((m) => m.rule.recommendation.summary);
  const explainable = reasons.every((r) => r.trim().length > 0);
  const avgScore =
    matches.length > 0
      ? Math.round(matches.reduce((sum, m) => sum + m.score, 0) / matches.length)
      : 0;

  return {
    actions,
    summary: summaries.join(" + "),
    reasons,
    ruleIds: matches.map((m) => m.rule.id),
    explainable,
    finalScore: avgScore,
  };
}

export function selectRulesForAgent(
  agentId: AgentContractId,
  rules: readonly DesignRule[],
  ctx: DesignRuleContext,
): AgentRuleRecommendation {
  const scoped = rules.filter((r) => !r.agentIds || r.agentIds.includes(agentId));
  const matched = matchRules(scoped, ctx);
  const { resolved, conflicts } = resolveRuleConflicts(matched);
  const mandatoryRules = resolved.filter((m) => m.mandatory).map((m) => m.rule);
  const advisoryRules = resolved.filter((m) => !m.mandatory);
  const prioritized = prioritizeRules(resolved);
  const recommendation = composeRules(prioritized);

  return {
    agentId,
    recommendation,
    mandatoryRules,
    advisoryRules,
    conflictsResolved: conflicts,
  };
}

export function applyRuleLearningFeedback(
  rules: DesignRule[],
  feedback: RuleLearningFeedback[],
): DesignRule[] {
  return rules.map((r) => {
    const fb = feedback.find((f) => f.ruleId === r.id);
    if (!fb) return r;

    let delta = 0;
    if (fb.visionScore !== undefined) delta += (fb.visionScore - 0.5) * 0.05;
    if (fb.commercialScore !== undefined) delta += (fb.commercialScore - 0.5) * 0.08;
    if (fb.retryCount !== undefined && fb.retryCount > 0) delta -= fb.retryCount * 0.03;
    if (fb.userRating === "positive") delta += 0.05;
    if (fb.userRating === "negative") delta -= 0.08;

    const historicalSuccess = Math.max(0, Math.min(1, (r.historicalSuccess ?? 0.5) + delta));
    const confidence = Math.max(0, Math.min(1, r.confidence + delta * 0.5));

    return { ...r, historicalSuccess, confidence };
  });
}

export function knowledgeObjectsToDesignRules(): DesignRule[] {
  const knowledgeRules = getSeedKnowledgeRules();
  return knowledgeRules.slice(0, 3).map((kr) =>
    rule({
      id: `knowledge-${kr.id}`,
      domain: kr.domain,
      kind: RuleKind.ADVISORY,
      conditions: [
        condition("category", "in", [kr.category, kr.subCategory ?? kr.category]),
      ],
      recommendation: {
        action: kr.preference,
        summary: kr.preference.replace(/_/g, " "),
        reason: kr.reason,
      },
      priority: 60,
      confidence: 0.8,
      constraints: [],
      sources: kr.evidenceSources.map((e) =>
        source(e, e, EVIDENCE_LEVEL_MAP[e] ?? 0.75),
      ),
      historicalSuccess: 0.75,
      agentIds: kr.applicableAgents,
    }),
  );
}

export function buildDesignRuleCatalog(): DesignRule[] {
  return [...SEED_DESIGN_RULES, ...knowledgeObjectsToDesignRules()];
}

export function executeDesignRules(input: {
  context: DesignRuleContext;
  agentIds?: AgentContractId[];
  rules?: DesignRule[];
}): DesignRulesExecutionResult {
  const rules = input.rules ?? buildDesignRuleCatalog();
  const agents = input.agentIds ?? [...RULES_ENGINE_AGENT_SCOPE];
  const agentRecommendations = agents.map((agentId) =>
    selectRulesForAgent(agentId, rules, input.context),
  );

  const allMatched = agentRecommendations.flatMap((a) => [
    ...a.mandatoryRules.map((r) => ({ rule: r, matched: true })),
    ...a.advisoryRules,
  ]);

  return {
    agentRecommendations,
    stateless: true,
    totalRulesEvaluated: rules.length * agents.length,
    totalRulesMatched: allMatched.length,
  };
}

export function validateDesignRulesEngine(
  ctx: DesignRulesEngineContext = {},
): DesignRulesEngineReport {
  const violations: DesignRulesEngineViolation[] = [];
  const catalog = buildDesignRuleCatalog();

  if (ctx.identicalApplication) {
    violations.push(
      violation("ALL_RULES_APPLIED_IDENTICALLY", "Rules must not apply identically regardless of context"),
    );
  }

  if (ctx.skipContextAnalysis) {
    violations.push(
      violation("MISSING_CONTEXT_ANALYSIS", "Context analysis is required before rule application"),
    );
  }

  if (ctx.unresolvableConflict) {
    violations.push(
      violation(
        "UNRESOLVABLE_CONFLICT",
        `Cannot resolve conflict between ${ctx.unresolvableConflict.ruleA} and ${ctx.unresolvableConflict.ruleB}`,
      ),
    );
  }

  if (ctx.unexplainableRecommendation) {
    violations.push(
      violation("UNEXPLAINABLE_RECOMMENDATION", "Every recommendation must include an explanation"),
    );
  }

  if (ctx.rawKnowledgeLeak) {
    violations.push(
      violation("RAW_KNOWLEDGE_OBJECTS_LEAKED", "Agents must not receive raw Knowledge Objects"),
    );
  }

  const kitchenCtx: DesignRuleContext = {
    product: "Kitchen Knife",
    category: ProductCategoryKnowledge.KITCHEN,
    marketplace: MarketplaceKnowledgeId.AMAZON,
    audience: "Professional Chef",
    businessGoal: "Luxury",
    imageContext: MarketplaceImageContext.SECONDARY_IMAGE,
  };

  const electronicsCtx: DesignRuleContext = {
    category: ProductCategoryKnowledge.ELECTRONICS,
    marketplace: MarketplaceKnowledgeId.AMAZON,
  };

  const kitchenResult = executeDesignRules({ context: kitchenCtx, agentIds: ["lighting-director"] });
  const electronicsResult = executeDesignRules({
    context: electronicsCtx,
    agentIds: ["composition-director"],
  });

  const kitchenActions = kitchenResult.agentRecommendations[0]?.recommendation.actions ?? [];
  const electronicsActions = electronicsResult.agentRecommendations[0]?.recommendation.actions ?? [];

  if (kitchenActions.length > 0 && JSON.stringify(kitchenActions) === JSON.stringify(electronicsActions)) {
    violations.push(
      violation("ALL_RULES_APPLIED_IDENTICALLY", "Different contexts produced identical rule applications"),
    );
  }

  const amazonMainCtx: DesignRuleContext = {
    marketplace: MarketplaceKnowledgeId.AMAZON,
    imageContext: MarketplaceImageContext.MAIN_IMAGE,
  };
  const mainResult = executeDesignRules({ context: amazonMainCtx, agentIds: ["composition-director"] });
  const hasMandatory = mainResult.agentRecommendations[0]?.mandatoryRules.length ?? 0;
  if (hasMandatory === 0) {
    violations.push(
      violation("MISSING_CONTEXT_ANALYSIS", "Amazon main image context must trigger mandatory rules"),
    );
  }

  const conflictCtx: DesignRuleContext = {
    imageContext: MarketplaceImageContext.MAIN_IMAGE,
    businessGoal: "Luxury",
  };
  const conflictResult = executeDesignRules({ context: conflictCtx, agentIds: ["composition-director"] });
  const conflicts = conflictResult.agentRecommendations[0]?.conflictsResolved ?? [];
  if (conflicts.length === 0) {
    violations.push(
      violation("UNRESOLVABLE_CONFLICT", "Marketplace vs composition conflict must be resolvable"),
    );
  }

  for (const rec of conflictResult.agentRecommendations) {
    if (!rec.recommendation.explainable || rec.recommendation.reasons.length === 0) {
      violations.push(
        violation("UNEXPLAINABLE_RECOMMENDATION", "Recommendation lacks explanation", rec.agentId),
      );
    }
  }

  const scopedKitchen = kitchenResult.agentRecommendations[0]?.recommendation.ruleIds.length ?? 0;
  const fullCatalog = executeDesignRules({
    context: kitchenCtx,
    agentIds: ["lighting-director"],
    rules: catalog,
  });
  if (scopedKitchen >= catalog.length) {
    violations.push(
      violation("RAW_KNOWLEDGE_OBJECTS_LEAKED", "Agent received entire rule catalog without scoping"),
    );
  }

  if (fullCatalog.totalRulesMatched === 0) {
    violations.push(violation("EMPTY_AGENT_RECOMMENDATION", "No rules matched for valid context"));
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    goldenRuleSatisfied: unique.length === 0,
    contextAware: kitchenActions.length > 0 && electronicsActions.length > 0,
    conflictResolvable: conflicts.length > 0,
    explainable: conflictResult.agentRecommendations.every((r) => r.recommendation.explainable),
    stateless: true,
    seedRuleCount: catalog.length,
  };
}

export function assertDesignRulesEngine(ctx?: DesignRulesEngineContext): DesignRulesEngineReport {
  const report = validateDesignRulesEngine(ctx);
  if (!report.valid) {
    throw new Error(
      `Design rules engine violation: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export function runDesignRulesEngine(input: {
  ctx?: DesignRulesEngineContext;
}): DesignRulesEngineReport {
  return validateDesignRulesEngine(input.ctx);
}

export function isDesignRulesEngineFailure(code: string): code is DesignRulesEngineFailureCode {
  return [
    "ALL_RULES_APPLIED_IDENTICALLY",
    "MISSING_CONTEXT_ANALYSIS",
    "UNRESOLVABLE_CONFLICT",
    "UNEXPLAINABLE_RECOMMENDATION",
    "RAW_KNOWLEDGE_OBJECTS_LEAKED",
    "MISSING_RULE_EXPLANATION",
    "EMPTY_AGENT_RECOMMENDATION",
  ].includes(code);
}
