/**
 * Chapter 5.16 — Knowledge Retrieval Engine.
 * Intelligent search, selection, and delivery of design knowledge to agents.
 */
import type { AgentContractId } from "./agent-contracts";
import { recommendDesignPatterns } from "./pattern-library-engine";
import { SEED_DESIGN_ANTI_PATTERNS } from "./anti-pattern-library-engine";
import { SEED_COLOR_KNOWLEDGE } from "./color-knowledge-engine";
import { SEED_COGNITIVE_PSYCHOLOGY_KNOWLEDGE } from "./cognitive-psychology-knowledge-engine";
import { SEED_CONSUMER_BEHAVIOR_RULES } from "./consumer-behavior-knowledge-engine";
import { MarketplaceKnowledgeId } from "./marketplace-knowledge-types";
import { SEED_PHOTOGRAPHY_KNOWLEDGE } from "./photography-knowledge-engine";
import { SEED_TYPOGRAPHY_KNOWLEDGE } from "./typography-knowledge-engine";
import {
  KnowledgeRetrievalDomain,
  RetrievalPipelineStage,
  type KnowledgePackage,
  type KnowledgePackageValidation,
  type KnowledgeRetrievalConflict,
  type KnowledgeRetrievalContext,
  type KnowledgeRetrievalDomainId,
  type KnowledgeRetrievalFailureCode,
  type KnowledgeRetrievalReport,
  type KnowledgeRetrievalRequest,
  type KnowledgeRetrievalViolation,
  type RetrievedKnowledgeItem,
  type RetrievalContext,
  type RetrievalPipelineStageId,
} from "./knowledge-retrieval-types";

export {
  KnowledgeRetrievalDomain,
  RetrievalPipelineStage,
  type KnowledgeRetrievalDomainId,
  type RetrievalPipelineStageId,
  type RetrievalContext,
  type KnowledgeRetrievalRequest,
  type RetrievedKnowledgeItem,
  type KnowledgeRetrievalConflict,
  type KnowledgePackage,
  type KnowledgePackageValidation,
  type KnowledgeRetrievalContext,
  type KnowledgeRetrievalViolation,
  type KnowledgeRetrievalReport,
  type KnowledgeRetrievalFailureCode,
} from "./knowledge-retrieval-types";

export const KNOWLEDGE_RETRIEVAL_VERSION = "5.16.0";

export const KNOWLEDGE_RETRIEVAL_GOLDEN_RULE =
  "Knowledge base value is not the number of stored rules — it is the ability to find the right knowledge " +
  "at the right moment. Retrieval Engine turns a vast library into a precise, fast, and explainable tool.";

export const MAX_PACKAGE_SIZE = 12;

export const RETRIEVAL_PIPELINE: readonly RetrievalPipelineStageId[] = [
  RetrievalPipelineStage.AGENT_REQUEST,
  RetrievalPipelineStage.CONTEXT_ANALYSIS,
  RetrievalPipelineStage.KNOWLEDGE_FILTERING,
  RetrievalPipelineStage.SEMANTIC_SEARCH,
  RetrievalPipelineStage.RULE_RANKING,
  RetrievalPipelineStage.CONFLICT_RESOLUTION,
  RetrievalPipelineStage.KNOWLEDGE_PACKAGE,
  RetrievalPipelineStage.AGENT_DELIVERY,
] as const;

export const CACHEABLE_CATEGORIES = [
  "cosmetics",
  "beauty",
  "electronics",
  "kitchen",
  "appliances",
  "furniture",
  "tools",
] as const;

export const SEMANTIC_EXPANSIONS: Record<string, string[]> = {
  premium: ["luxury", "minimal", "premium", "elegant", "warm_lighting", "quality"],
  kitchen: ["kitchen", "appliance", "warm", "lifestyle", "home", "cooking"],
  appliance: ["kitchen", "technical", "product_hero", "clean", "modern"],
  luxury: ["premium", "negative_space", "elegant", "restrained"],
  technical: ["specs", "structured", "clarity", "precision"],
  lifestyle: ["scene", "warm", "comfort", "context"],
  minimal: ["clean", "negative_space", "simple", "amazon"],
  trust: ["clean", "professional", "quality", "realism"],
  marketplace: ["thumbnail", "scan", "hero", "readability"],
};

export const AGENT_RETRIEVAL_DOMAINS: Partial<Record<AgentContractId, KnowledgeRetrievalDomainId[]>> = {
  "lighting-director": [
    KnowledgeRetrievalDomain.PHOTOGRAPHY,
    KnowledgeRetrievalDomain.COLOR,
    KnowledgeRetrievalDomain.PSYCHOLOGY,
    KnowledgeRetrievalDomain.MARKETPLACE,
    KnowledgeRetrievalDomain.DESIGN,
  ],
  "composition-director": [
    KnowledgeRetrievalDomain.COMPOSITION,
    KnowledgeRetrievalDomain.PSYCHOLOGY,
    KnowledgeRetrievalDomain.MARKETPLACE,
    KnowledgeRetrievalDomain.PATTERN,
    KnowledgeRetrievalDomain.ANTI_PATTERN,
  ],
  "visual-story-director": [
    KnowledgeRetrievalDomain.CONSUMER,
    KnowledgeRetrievalDomain.PSYCHOLOGY,
    KnowledgeRetrievalDomain.PATTERN,
    KnowledgeRetrievalDomain.DESIGN,
  ],
  "commercial-photo-director": [
    KnowledgeRetrievalDomain.PHOTOGRAPHY,
    KnowledgeRetrievalDomain.COLOR,
    KnowledgeRetrievalDomain.MARKETPLACE,
  ],
};

const retrievalCache = new Map<string, KnowledgePackage>();

function violation(
  code: KnowledgeRetrievalFailureCode,
  message: string,
  itemId?: string,
): KnowledgeRetrievalViolation {
  return { code, message, itemId };
}

function buildExplanation(item: RetrievedKnowledgeItem): string {
  return (
    `Selected because: Context Match: ${Math.round(item.contextMatch * 100)}%; ` +
    `Historical Success: ${Math.round(item.historicalSuccess * 100)}%; ` +
    `Marketplace Compatibility: ${Math.round(item.marketplaceCompatibility * 100)}%`
  );
}

function item(
  partial: Omit<RetrievedKnowledgeItem, "explanation" | "finalScore"> & { finalScore?: number },
): RetrievedKnowledgeItem {
  const contextMatch = partial.contextMatch;
  const historicalSuccess = partial.historicalSuccess;
  const marketplaceCompatibility = partial.marketplaceCompatibility;
  const confidence = partial.confidence;
  const freshness = partial.freshness;
  const finalScore =
    partial.finalScore ??
    contextMatch * 0.3 +
      confidence * 0.2 +
      partial.evidenceLevel * 0.15 +
      historicalSuccess * 0.15 +
      marketplaceCompatibility * 0.1 +
      freshness * 0.1;
  const base = { ...partial, finalScore };
  return { ...base, explanation: buildExplanation(base) };
}

export function buildRetrievalCatalog(): RetrievedKnowledgeItem[] {
  const catalog: RetrievedKnowledgeItem[] = [];
  const now = Date.now();

  for (const k of SEED_COLOR_KNOWLEDGE.slice(0, 6)) {
    catalog.push(
      item({
        id: `color-${k.id}`,
        domain: KnowledgeRetrievalDomain.COLOR,
        title: k.palette,
        summary: k.purpose,
        confidence: k.confidence,
        evidenceLevel: 0.85,
        historicalSuccess: 0.8,
        marketplaceCompatibility: 0.85,
        contextMatch: 0.5,
        freshness: 0.9,
        semanticTags: ["color", "palette", "contrast", "harmony"],
        version: "5.10.0",
        updatedAt: now,
      }),
    );
  }

  for (const k of SEED_TYPOGRAPHY_KNOWLEDGE.slice(0, 5)) {
    catalog.push(
      item({
        id: `typo-${k.id}`,
        domain: KnowledgeRetrievalDomain.TYPOGRAPHY,
        title: k.rule,
        summary: k.recommendation,
        confidence: k.confidence,
        evidenceLevel: 0.82,
        historicalSuccess: 0.78,
        marketplaceCompatibility: 0.88,
        contextMatch: 0.5,
        freshness: 0.88,
        semanticTags: ["typography", "readability", "hierarchy", "text"],
        version: "5.11.0",
        updatedAt: now,
      }),
    );
  }

  for (const k of SEED_PHOTOGRAPHY_KNOWLEDGE.slice(0, 6)) {
    catalog.push(
      item({
        id: `photo-${k.id}`,
        domain: KnowledgeRetrievalDomain.PHOTOGRAPHY,
        title: k.rule,
        summary: k.commercialRationale ?? k.examples[0]?.description ?? k.rule,
        confidence: k.confidence,
        evidenceLevel: 0.88,
        historicalSuccess: 0.82,
        marketplaceCompatibility: 0.8,
        contextMatch: 0.5,
        freshness: 0.9,
        semanticTags: ["lighting", "lens", "photography", "material", "warm_lighting"],
        version: "5.9.0",
        updatedAt: now,
      }),
    );
  }

  for (const k of SEED_COGNITIVE_PSYCHOLOGY_KNOWLEDGE.slice(0, 5)) {
    catalog.push(
      item({
        id: `psych-${k.id}`,
        domain: KnowledgeRetrievalDomain.PSYCHOLOGY,
        title: k.rule,
        summary: k.recommendation,
        confidence: k.confidence,
        evidenceLevel: 0.9,
        historicalSuccess: 0.85,
        marketplaceCompatibility: 0.86,
        contextMatch: 0.5,
        freshness: 0.87,
        semanticTags: ["attention", "trust", "cognitive", "perception"],
        version: "5.12.0",
        updatedAt: now,
      }),
    );
  }

  for (const r of SEED_CONSUMER_BEHAVIOR_RULES.slice(0, 4)) {
    catalog.push(
      item({
        id: `consumer-${r.id}`,
        domain: KnowledgeRetrievalDomain.CONSUMER,
        title: r.behavior,
        summary: r.expectedReaction,
        confidence: r.confidence,
        evidenceLevel: 0.84,
        historicalSuccess: 0.83,
        marketplaceCompatibility: 0.9,
        contextMatch: 0.5,
        freshness: 0.86,
        semanticTags: ["purchase", "trust", "marketplace", "decision"],
        version: "5.13.0",
        updatedAt: now,
      }),
    );
  }

  const patterns = recommendDesignPatterns({ marketplace: MarketplaceKnowledgeId.AMAZON }, 4);
  for (const p of patterns) {
    catalog.push(
      item({
        id: `pattern-${p.id}`,
        domain: KnowledgeRetrievalDomain.PATTERN,
        title: p.name,
        summary: p.purpose,
        confidence: p.confidence,
        evidenceLevel: 0.8,
        historicalSuccess: p.successRate,
        marketplaceCompatibility: p.marketplaceId ? 0.95 : 0.75,
        contextMatch: 0.5,
        freshness: 0.85,
        semanticTags: [p.category, p.layout, "pattern"],
        relatedPatternIds: [p.id],
        version: "5.14.0",
        updatedAt: now,
      }),
    );
  }

  for (const a of SEED_DESIGN_ANTI_PATTERNS.slice(0, 4)) {
    catalog.push(
      item({
        id: `anti-${a.id}`,
        domain: KnowledgeRetrievalDomain.ANTI_PATTERN,
        title: a.name,
        summary: a.description,
        confidence: a.confidence,
        evidenceLevel: 0.86,
        historicalSuccess: 0.88,
        marketplaceCompatibility: 0.82,
        contextMatch: 0.5,
        freshness: 0.84,
        semanticTags: ["avoid", a.category, "anti_pattern"],
        relatedAntiPatternIds: [a.id],
        constraints: a.recommendedFixes,
        version: "5.15.0",
        updatedAt: now,
      }),
    );
  }

  catalog.push(
    item({
      id: "mkt-amazon-minimal-focus",
      domain: KnowledgeRetrievalDomain.MARKETPLACE,
      title: "Amazon Minimal Product Focus",
      summary: "Clean minimal composition with maximum product emphasis on main image",
      confidence: 0.95,
      evidenceLevel: 0.9,
      historicalSuccess: 0.86,
      marketplaceCompatibility: 0.98,
      contextMatch: 0.5,
      freshness: 0.92,
      semanticTags: ["amazon", "minimal", "clean", "hero", "marketplace"],
      relatedPatternIds: ["mkt-amazon-minimal-product"],
      version: "5.5.0",
      updatedAt: now,
    }),
    item({
      id: "style-premium-kitchen",
      domain: KnowledgeRetrievalDomain.STYLE,
      title: "Premium Kitchen Style",
      summary: "Warm lighting, modern kitchen context, premium materials, minimal composition",
      confidence: 0.91,
      evidenceLevel: 0.83,
      historicalSuccess: 0.84,
      marketplaceCompatibility: 0.87,
      contextMatch: 0.5,
      freshness: 0.88,
      semanticTags: ["premium", "kitchen", "appliance", "warm_lighting", "minimal", "luxury"],
      version: "5.7.0",
      updatedAt: now,
    }),
  );

  return catalog;
}

export function analyzeRetrievalContext(ctx: RetrievalContext): {
  normalized: RetrievalContext;
  semanticTags: string[];
  agentDomains: KnowledgeRetrievalDomainId[];
} {
  const normalized: RetrievalContext = {
    ...ctx,
    category: ctx.category?.toLowerCase(),
    marketplace: ctx.marketplace?.toLowerCase(),
    styleId: ctx.styleId?.toLowerCase(),
    businessGoal: ctx.businessGoal?.toLowerCase(),
  };
  const semanticTags = new Set<string>();
  const query = [
    ctx.semanticQuery,
    ctx.category,
    ctx.styleId,
    ctx.storyType,
    ctx.businessGoal,
    ctx.marketplace,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  for (const token of query.split(/\s+/)) {
    if (!token) continue;
    semanticTags.add(token);
    const expanded = SEMANTIC_EXPANSIONS[token];
    if (expanded) expanded.forEach((t) => semanticTags.add(t));
  }

  const agentDomains = ctx.agentId
    ? (AGENT_RETRIEVAL_DOMAINS[ctx.agentId] ?? Object.values(KnowledgeRetrievalDomain))
    : Object.values(KnowledgeRetrievalDomain);

  return { normalized, semanticTags: [...semanticTags], agentDomains };
}

export function computeSemanticMatch(item: RetrievedKnowledgeItem, semanticTags: string[]): number {
  if (semanticTags.length === 0) return 0.5;
  const itemTags = new Set(item.semanticTags.map((t) => t.toLowerCase()));
  let hits = 0;
  for (const tag of semanticTags) {
    if (itemTags.has(tag)) hits += 1;
    for (const itemTag of itemTags) {
      if (itemTag.includes(tag) || tag.includes(itemTag)) hits += 0.5;
    }
  }
  return Math.min(1, hits / Math.max(semanticTags.length, 1));
}

export function computeRetrievalContextMatch(item: RetrievedKnowledgeItem, ctx: RetrievalContext): number {
  let score = computeSemanticMatch(item, analyzeRetrievalContext(ctx).semanticTags);
  const summary = item.summary ?? "";
  if (ctx.marketplace && item.semanticTags.includes(ctx.marketplace)) score += 0.15;
  if (ctx.category && summary.toLowerCase().includes(ctx.category)) score += 0.1;
  if (ctx.businessGoal && summary.toLowerCase().includes(ctx.businessGoal)) score += 0.1;
  return Math.min(1, score);
}

export function filterKnowledgeByAgent(
  items: RetrievedKnowledgeItem[],
  domains: KnowledgeRetrievalDomainId[],
): RetrievedKnowledgeItem[] {
  const allowed = new Set(domains);
  return items.filter((i) => allowed.has(i.domain));
}

export function rankKnowledgeItems(
  items: RetrievedKnowledgeItem[],
  ctx: RetrievalContext,
): RetrievedKnowledgeItem[] {
  return items
    .map((i) => {
      const contextMatch = computeRetrievalContextMatch(i, ctx);
      const marketplaceCompatibility =
        ctx.marketplace && i.domain === KnowledgeRetrievalDomain.MARKETPLACE
          ? Math.min(1, i.marketplaceCompatibility + 0.05)
          : i.marketplaceCompatibility;
      const finalScore =
        contextMatch * 0.3 +
        i.confidence * 0.2 +
        i.evidenceLevel * 0.15 +
        i.historicalSuccess * 0.15 +
        marketplaceCompatibility * 0.1 +
        i.freshness * 0.1;
      return {
        ...i,
        contextMatch,
        marketplaceCompatibility,
        finalScore,
        explanation: buildExplanation({ ...i, contextMatch, marketplaceCompatibility, finalScore }),
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
}

export function resolveKnowledgeConflicts(
  items: RetrievedKnowledgeItem[],
): { items: RetrievedKnowledgeItem[]; conflicts: KnowledgeRetrievalConflict[] } {
  const conflicts: KnowledgeRetrievalConflict[] = [];
  const winners = new Map<string, RetrievedKnowledgeItem>();

  for (const current of items) {
    let displaced = false;
    for (const [key, existing] of winners) {
      if (existing.domain !== current.domain) continue;
      const opposite =
        (existing.summary.includes("minimal") && current.summary.includes("dense")) ||
        (existing.summary.includes("luxury") && current.summary.includes("budget"));
      if (!opposite) continue;
      conflicts.push({
        itemA: existing.id,
        itemB: current.id,
        reason: `Conflicting ${existing.domain} guidance`,
        delegatedToDesignRules: true,
        resolvedWinner: existing.finalScore >= current.finalScore ? existing.id : current.id,
      });
      if (current.finalScore > existing.finalScore) {
        winners.set(key, current);
        displaced = true;
      } else {
        displaced = true;
      }
      break;
    }
    if (!displaced) winners.set(current.id, current);
  }

  return { items: [...winners.values()].sort((a, b) => b.finalScore - a.finalScore), conflicts };
}

function cacheKey(ctx: RetrievalContext, limit: number): string {
  return JSON.stringify({ ...ctx, limit });
}

export function getCachedKnowledgePackage(key: string): KnowledgePackage | undefined {
  return retrievalCache.get(key);
}

export function setCachedKnowledgePackage(key: string, pkg: KnowledgePackage): void {
  retrievalCache.set(key, pkg);
}

export function clearRetrievalCache(): void {
  retrievalCache.clear();
}

export function retrieveKnowledgePackage(
  request: KnowledgeRetrievalRequest,
  catalog: RetrievedKnowledgeItem[] = buildRetrievalCatalog(),
): KnowledgePackage {
  const limit = Math.min(request.limit ?? 8, MAX_PACKAGE_SIZE);
  const key = cacheKey(request.context, limit);

  if (request.useCache !== false && CACHEABLE_CATEGORIES.includes((request.context.category ?? "") as (typeof CACHEABLE_CATEGORIES)[number])) {
    const cached = getCachedKnowledgePackage(key);
    if (cached) return { ...cached, fromCache: true };
  }

  const { normalized, agentDomains } = analyzeRetrievalContext(request.context);
  const totalCandidates = catalog.length;

  let filtered = filterKnowledgeByAgent(catalog, agentDomains);
  if (request.requiredDomains?.length) {
    const required = new Set(request.requiredDomains);
    filtered = filtered.filter((i) => required.has(i.domain));
  }

  if (normalized.marketplace) {
    filtered = filtered.map((i) =>
      i.domain === KnowledgeRetrievalDomain.MARKETPLACE ||
      i.semanticTags.includes(normalized.marketplace!)
        ? { ...i, marketplaceCompatibility: Math.min(1, i.marketplaceCompatibility + 0.08) }
        : i,
    );
  }

  const ranked = rankKnowledgeItems(filtered, normalized);
  const { items, conflicts } = resolveKnowledgeConflicts(ranked.slice(0, limit * 2));
  const packageItems = items.slice(0, limit);

  const patterns = packageItems.flatMap((i) => i.relatedPatternIds ?? []);
  const antiPatterns = packageItems.flatMap((i) => i.relatedAntiPatternIds ?? []);

  const pkg: KnowledgePackage = {
    items: packageItems,
    patterns: [...new Set(patterns)],
    antiPatterns: [...new Set(antiPatterns)],
    conflicts,
    agentId: normalized.agentId,
    domains: [...new Set(packageItems.map((i) => i.domain))],
    explainable: packageItems.every((i) => i.explanation.length > 10),
    fromCache: false,
    totalCandidates,
    packageSize: packageItems.length,
    pipelineStages: [...RETRIEVAL_PIPELINE],
  };

  if (request.useCache !== false && CACHEABLE_CATEGORIES.includes((request.context.category ?? "") as (typeof CACHEABLE_CATEGORIES)[number])) {
    setCachedKnowledgePackage(key, pkg);
  }

  return pkg;
}

export function validateKnowledgePackage(pkg: KnowledgePackage): KnowledgePackageValidation {
  const violations: KnowledgeRetrievalViolation[] = [];

  if (pkg.packageSize > MAX_PACKAGE_SIZE) {
    violations.push(violation("PACKAGE_TOO_LARGE", `Package size ${pkg.packageSize} exceeds max ${MAX_PACKAGE_SIZE}`));
  }

  const ids = pkg.items.map((i) => i.id);
  if (new Set(ids).size !== ids.length) {
    violations.push(violation("DUPLICATE_ITEMS", "Knowledge package must not contain duplicates"));
  }

  if (pkg.packageSize === 0) {
    violations.push(violation("INSUFFICIENT_PACKAGE", "Package must contain relevant knowledge for agent"));
  }

  if (!pkg.explainable) {
    violations.push(violation("UNEXPLAINABLE_SELECTION", "Every retrieved item must be explainable"));
  }

  const unresolved = pkg.conflicts.filter((c) => !c.resolvedWinner);
  if (unresolved.length > 0) {
    violations.push(violation("CONFLICTING_MANDATORY_RULES", "Mandatory rule conflicts must be resolved"));
  }

  return {
    valid: violations.length === 0,
    violations,
    retryRecommended: violations.some((v) => v.code === "CONFLICTING_MANDATORY_RULES"),
  };
}

export function validateKnowledgeRetrieval(ctx: KnowledgeRetrievalContext = {}): KnowledgeRetrievalReport {
  const violations: KnowledgeRetrievalViolation[] = [];

  if (ctx.fullBaseLeak) {
    violations.push(violation("FULL_BASE_LEAK", "Agent must not receive entire knowledge base"));
  }
  if (ctx.keywordOnlySearch) {
    violations.push(violation("KEYWORD_ONLY_SEARCH", "Retrieval must use semantic search not keywords only"));
  }
  if (ctx.missingRanking) {
    violations.push(violation("MISSING_RANKING", "Knowledge items must be ranked"));
  }
  if (ctx.missingBusinessContext) {
    violations.push(violation("MISSING_BUSINESS_CONTEXT", "Business context must drive retrieval"));
  }
  if (ctx.unexplainableSelection) {
    violations.push(violation("UNEXPLAINABLE_SELECTION", "Selections must be explainable"));
  }

  const catalog = buildRetrievalCatalog();
  if (catalog.length < 10) {
    violations.push(violation("INSUFFICIENT_PACKAGE", "Retrieval catalog must index multiple knowledge domains"));
  }

  const semantic = retrieveKnowledgePackage({
    context: { semanticQuery: "Premium Kitchen Appliance", category: "kitchen", styleId: "premium" },
    limit: 6,
    useCache: false,
  });
  const semanticHits = semantic.items.some(
    (i) =>
      i.semanticTags.includes("kitchen") ||
      i.semanticTags.includes("premium") ||
      i.semanticTags.includes("warm_lighting"),
  );
  if (!semanticHits) {
    violations.push(violation("KEYWORD_ONLY_SEARCH", "Semantic query must return meaning-related knowledge"));
  }

  const lighting = retrieveKnowledgePackage({
    context: {
      agentId: "lighting-director",
      category: "kitchen",
      marketplace: MarketplaceKnowledgeId.AMAZON,
      businessGoal: "trust",
    },
    limit: 8,
    useCache: false,
  });
  const lightingDomains = new Set(lighting.domains);
  if (!lightingDomains.has(KnowledgeRetrievalDomain.PHOTOGRAPHY)) {
    violations.push(violation("MISSING_REQUIRED_DOMAIN", "Lighting director must receive photography knowledge"));
  }
  if (lighting.packageSize > MAX_PACKAGE_SIZE) {
    violations.push(violation("FULL_BASE_LEAK", "Package must be compact not full base"));
  }

  clearRetrievalCache();
  const first = retrieveKnowledgePackage({
    context: { category: "kitchen", marketplace: "amazon" },
    limit: 5,
    useCache: true,
  });
  const second = retrieveKnowledgePackage({
    context: { category: "kitchen", marketplace: "amazon" },
    limit: 5,
    useCache: true,
  });
  if (!second.fromCache) {
    violations.push(violation("MISSING_RANKING", "Cacheable categories must use retrieval cache"));
  }
  void first;

  const pkgValidation = validateKnowledgePackage(lighting);
  if (!pkgValidation.valid) {
    violations.push(violation("INSUFFICIENT_PACKAGE", "Valid retrieval package must pass validation"));
  }

  const explainable = lighting.items.every((i) => i.explanation.includes("Context Match"));
  if (!explainable) {
    violations.push(violation("UNEXPLAINABLE_SELECTION", "Items must include selection explanation"));
  }

  const unique = violations.filter(
    (v, i, arr) => arr.findIndex((x) => x.code === v.code && x.message === v.message) === i,
  );

  return {
    valid: unique.length === 0,
    violations: unique,
    pipeline: [...RETRIEVAL_PIPELINE],
    goldenRuleSatisfied: unique.length === 0,
    semanticRetrieval: semanticHits,
    cacheEnabled: second.fromCache,
    evolutionReady: true,
  };
}

export function assertKnowledgeRetrieval(ctx?: KnowledgeRetrievalContext): KnowledgeRetrievalReport {
  const report = validateKnowledgeRetrieval(ctx);
  if (!report.valid) {
    throw new Error(`Knowledge retrieval violation: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export function runKnowledgeRetrieval(input: {
  request?: KnowledgeRetrievalRequest;
  ctx?: KnowledgeRetrievalContext;
}): KnowledgeRetrievalReport & { package?: KnowledgePackage } {
  const report = validateKnowledgeRetrieval(input.ctx);
  const pkg = input.request ? retrieveKnowledgePackage(input.request) : undefined;
  return { ...report, package: pkg };
}

export function isKnowledgeRetrievalFailure(code: string): code is KnowledgeRetrievalFailureCode {
  return [
    "FULL_BASE_LEAK",
    "KEYWORD_ONLY_SEARCH",
    "MISSING_RANKING",
    "MISSING_BUSINESS_CONTEXT",
    "UNEXPLAINABLE_SELECTION",
    "PACKAGE_TOO_LARGE",
    "DUPLICATE_ITEMS",
    "MISSING_REQUIRED_DOMAIN",
    "CONFLICTING_MANDATORY_RULES",
    "INSUFFICIENT_PACKAGE",
  ].includes(code);
}
