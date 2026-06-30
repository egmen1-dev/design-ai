/**
 * Chapter 6.4 — Knowledge Retrieval Stage engine.
 * Pipeline bridge between Product Analysis and Agent Ecosystem — selects, never mutates knowledge.
 */
import { SEED_DESIGN_ANTI_PATTERNS } from "./anti-pattern-library-engine";
import { buildDefaultPipelineInput } from "./design-pipeline-engine";
import {
  CACHEABLE_CATEGORIES,
  MAX_PACKAGE_SIZE,
  retrieveKnowledgePackage,
  validateKnowledgePackage,
} from "./knowledge-retrieval-engine";
import {
  KnowledgeRetrievalDomain,
  type KnowledgeRetrievalDomainId,
  type RetrievedKnowledgeItem,
} from "./knowledge-retrieval-types";
import {
  applyContextPatch,
  PipelineContextSection,
  type GenerationPipelineContext,
} from "./pipeline-context-engine";
import {
  analyzeProduct,
  buildDefaultProductAnalysisInput,
  buildProductAnalysisInputFromPipeline,
} from "./product-analysis-engine";
import type { AnalyzedProductProfile } from "./product-analysis-types";
import { recommendDesignPatterns } from "./pattern-library-engine";
import { PriceSegment } from "./product-analysis-types";
import {
  KnowledgeRetrievalPipelineStage,
  type KnowledgeRetrievalPipelineStageId,
  type KnowledgeRetrievalStageContext,
  type KnowledgeRetrievalStageFailureCode,
  type KnowledgeRetrievalStageInput,
  type KnowledgeRetrievalStageReport,
  type KnowledgeRetrievalStageSystemReport,
  type KnowledgeRetrievalStageViolation,
  type PipelineKnowledgeQuery,
  type RetrievedAntiPatternEntry,
  type RetrievedPatternEntry,
  type StagedDesignRule,
  type StagedKnowledgePackage,
} from "./knowledge-retrieval-stage-types";

export {
  KnowledgeRetrievalPipelineStage,
  type KnowledgeRetrievalPipelineStageId,
  type PipelineKnowledgeQuery,
  type RetrievedPatternEntry,
  type RetrievedAntiPatternEntry,
  type StagedDesignRule,
  type StagedKnowledgePackage,
  type KnowledgeRetrievalStageInput,
  type KnowledgeRetrievalStageViolation,
  type KnowledgeRetrievalStageReport,
  type KnowledgeRetrievalStageContext,
  type KnowledgeRetrievalStageSystemReport,
  type KnowledgeRetrievalStageFailureCode,
} from "./knowledge-retrieval-stage-types";

export const KNOWLEDGE_RETRIEVAL_STAGE_VERSION = "6.4.0";

export const KNOWLEDGE_RETRIEVAL_STAGE_GOLDEN_RULE =
  "Knowledge becomes valuable not when stored in the database, but when the right knowledge reaches " +
  "the right agent at the right moment. Knowledge Retrieval Stage turns the vast Design Knowledge Engine " +
  "into a precise, context-dependent, intelligent source of decisions for the whole Agent Ecosystem.";

export const KNOWLEDGE_RETRIEVAL_STAGE_PIPELINE: readonly KnowledgeRetrievalPipelineStageId[] = [
  KnowledgeRetrievalPipelineStage.PROFILE_ANALYSIS,
  KnowledgeRetrievalPipelineStage.QUERY_BUILD,
  KnowledgeRetrievalPipelineStage.DOMAIN_SELECTION,
  KnowledgeRetrievalPipelineStage.SEMANTIC_SEARCH,
  KnowledgeRetrievalPipelineStage.CONTEXT_FILTERING,
  KnowledgeRetrievalPipelineStage.KNOWLEDGE_RANKING,
  KnowledgeRetrievalPipelineStage.PATTERN_RETRIEVAL,
  KnowledgeRetrievalPipelineStage.ANTI_PATTERN_RETRIEVAL,
  KnowledgeRetrievalPipelineStage.PACKAGE_ASSEMBLY,
  KnowledgeRetrievalPipelineStage.CONSISTENCY_CHECK,
  KnowledgeRetrievalPipelineStage.VALIDATION,
  KnowledgeRetrievalPipelineStage.AGENT_DELIVERY,
] as const;

export const KNOWLEDGE_RETRIEVAL_STAGE_POSITION = [
  "product-analyzer",
  "knowledge-retrieval",
  "visual-story-director",
] as const;

export const STAGE_CACHEABLE_CATEGORIES = [
  ...CACHEABLE_CATEGORIES,
  "garden_tools",
  "garden",
  "cosmetics",
] as const;

const GARDEN_DOMAIN_SET: KnowledgeRetrievalDomainId[] = [
  KnowledgeRetrievalDomain.MARKETPLACE,
  KnowledgeRetrievalDomain.COMPOSITION,
  KnowledgeRetrievalDomain.PHOTOGRAPHY,
  KnowledgeRetrievalDomain.CONSUMER,
  KnowledgeRetrievalDomain.COLOR,
  KnowledgeRetrievalDomain.STYLE,
  KnowledgeRetrievalDomain.TYPOGRAPHY,
  KnowledgeRetrievalDomain.PATTERN,
  KnowledgeRetrievalDomain.ANTI_PATTERN,
];

const KITCHEN_DOMAIN_SET: KnowledgeRetrievalDomainId[] = [
  KnowledgeRetrievalDomain.MARKETPLACE,
  KnowledgeRetrievalDomain.COMPOSITION,
  KnowledgeRetrievalDomain.PHOTOGRAPHY,
  KnowledgeRetrievalDomain.CONSUMER,
  KnowledgeRetrievalDomain.COLOR,
  KnowledgeRetrievalDomain.STYLE,
  KnowledgeRetrievalDomain.DESIGN,
  KnowledgeRetrievalDomain.PATTERN,
  KnowledgeRetrievalDomain.ANTI_PATTERN,
];

function violation(
  code: KnowledgeRetrievalStageFailureCode,
  message: string,
  stage?: KnowledgeRetrievalPipelineStageId,
): KnowledgeRetrievalStageViolation {
  return { code, message, stage };
}

export function buildPipelineKnowledgeQueryFromProfile(
  profile: AnalyzedProductProfile,
  marketplace: string,
  style?: string,
): PipelineKnowledgeQuery {
  return {
    category: profile.category,
    subcategory: profile.subcategory,
    marketplace: marketplace.toLowerCase(),
    style,
    businessGoal: profile.businessGoal,
    targetAudience: [profile.targetAudience.segment],
    priceSegment: profile.priceSegment,
    productType: profile.productType,
  };
}

export function selectKnowledgeDomainsForProfile(
  profile: AnalyzedProductProfile,
): KnowledgeRetrievalDomainId[] {
  const key = profile.subcategory.toLowerCase();
  if (key.includes("sprayer") || key.includes("garden") || profile.category.toLowerCase().includes("garden")) {
    return [...GARDEN_DOMAIN_SET];
  }
  if (profile.priceSegment === PriceSegment.PREMIUM || profile.category.toLowerCase().includes("kitchen")) {
    return [...KITCHEN_DOMAIN_SET];
  }
  return [
    KnowledgeRetrievalDomain.MARKETPLACE,
    KnowledgeRetrievalDomain.COMPOSITION,
    KnowledgeRetrievalDomain.PHOTOGRAPHY,
    KnowledgeRetrievalDomain.CONSUMER,
    KnowledgeRetrievalDomain.PATTERN,
    KnowledgeRetrievalDomain.ANTI_PATTERN,
  ];
}

export function buildSemanticQueryFromProfile(profile: AnalyzedProductProfile): string {
  return [
    profile.subcategory,
    profile.category,
    profile.productType,
    profile.priceSegment,
    profile.businessGoal,
    ...profile.primaryBenefits.slice(0, 2),
    ...profile.useCases.slice(0, 2),
  ]
    .filter(Boolean)
    .join(" ");
}

export function filterKnowledgeByMarketplaceContext(
  items: RetrievedKnowledgeItem[],
  query: PipelineKnowledgeQuery,
): RetrievedKnowledgeItem[] {
  return items
    .map((item) => {
      let marketplaceCompatibility = item.marketplaceCompatibility;
      const tags = item.semanticTags.map((t) => t.toLowerCase());
      const mkt = query.marketplace.toLowerCase();

      if (tags.includes("amazon") && mkt !== "amazon" && !tags.includes(mkt)) {
        marketplaceCompatibility = Math.max(0, marketplaceCompatibility - 0.45);
      }
      if (tags.includes("luxury") && query.priceSegment === PriceSegment.BUDGET) {
        marketplaceCompatibility = Math.max(0, marketplaceCompatibility - 0.35);
      }
      if (tags.includes(mkt)) {
        marketplaceCompatibility = Math.min(1, marketplaceCompatibility + 0.12);
      }

      const finalScore = Math.max(
        0,
        item.finalScore - (item.marketplaceCompatibility - marketplaceCompatibility) * 0.1,
      );

      return { ...item, marketplaceCompatibility, finalScore };
    })
    .filter((item) => item.marketplaceCompatibility > 0.2);
}

export function sliceItemsByDomain(
  items: RetrievedKnowledgeItem[],
  domain: KnowledgeRetrievalDomainId,
): RetrievedKnowledgeItem[] {
  return items.filter((i) => i.domain === domain);
}

export function retrievePatternsForStage(
  query: PipelineKnowledgeQuery,
  limit = 3,
): RetrievedPatternEntry[] {
  const patterns = recommendDesignPatterns(
    {
      category: query.subcategory ?? query.category,
      marketplace: query.marketplace,
      businessGoal: query.businessGoal,
      priceTier: query.priceSegment,
    },
    limit + 2,
  );

  return patterns.slice(0, limit).map((p, index) => ({
    id: p.id,
    name: p.name,
    score: Math.max(70, 96 - index * 4),
  }));
}

export function retrieveAntiPatternsForStage(
  query: PipelineKnowledgeQuery,
  limit = 4,
): RetrievedAntiPatternEntry[] {
  const categoryKey = (query.subcategory ?? query.category).toLowerCase();
  const relevant = SEED_DESIGN_ANTI_PATTERNS.filter((a) => {
    if (categoryKey.includes("garden") || categoryKey.includes("sprayer")) {
      return ["comp-", "photo-", "biz-"].some((prefix) => a.id.startsWith(prefix));
    }
    return true;
  });

  return relevant.slice(0, limit).map((a) => ({
    id: a.id,
    name: a.name,
    severity: a.severityScore,
    warning: a.description,
  }));
}

export function buildStagedDesignRules(items: RetrievedKnowledgeItem[]): StagedDesignRule[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    domain: item.domain,
    finalScore: Math.round(item.finalScore * 1000) / 10,
    contextMatch: Math.round(item.contextMatch * 100),
    confidence: Math.round(item.confidence * 100),
    marketplaceCompatibility: Math.round(item.marketplaceCompatibility * 100),
    historicalSuccess: Math.round(item.historicalSuccess * 100),
  }));
}

export function assembleStagedKnowledgePackage(
  query: PipelineKnowledgeQuery,
  rawPackage: ReturnType<typeof retrieveKnowledgePackage>,
  patterns: RetrievedPatternEntry[],
  antiPatterns: RetrievedAntiPatternEntry[],
  stagesCompleted: KnowledgeRetrievalPipelineStageId[],
): StagedKnowledgePackage {
  const filtered = filterKnowledgeByMarketplaceContext(rawPackage.items, query);
  const rules = buildStagedDesignRules(filtered);

  return {
    query,
    marketplace: sliceItemsByDomain(filtered, KnowledgeRetrievalDomain.MARKETPLACE),
    style: sliceItemsByDomain(filtered, KnowledgeRetrievalDomain.STYLE),
    composition: sliceItemsByDomain(filtered, KnowledgeRetrievalDomain.COMPOSITION),
    photography: sliceItemsByDomain(filtered, KnowledgeRetrievalDomain.PHOTOGRAPHY),
    psychology: sliceItemsByDomain(filtered, KnowledgeRetrievalDomain.PSYCHOLOGY),
    consumer: sliceItemsByDomain(filtered, KnowledgeRetrievalDomain.CONSUMER),
    typography: sliceItemsByDomain(filtered, KnowledgeRetrievalDomain.TYPOGRAPHY),
    color: sliceItemsByDomain(filtered, KnowledgeRetrievalDomain.COLOR),
    patterns,
    antiPatterns,
    rules,
    conflicts: rawPackage.conflicts,
    rawPackage,
    domainsLoaded: rawPackage.domains,
    fromCache: rawPackage.fromCache,
    packageSize: filtered.length,
    stagesCompleted,
  };
}

export function validateStagedKnowledgePackage(
  pkg: StagedKnowledgePackage,
  requiredDomains: KnowledgeRetrievalDomainId[],
  context: KnowledgeRetrievalStageContext = {},
): KnowledgeRetrievalStageViolation[] {
  const violations: KnowledgeRetrievalStageViolation[] = [];

  if (pkg.packageSize === 0) {
    violations.push(violation("EMPTY_PACKAGE", "Knowledge package must contain relevant items"));
  }
  if (pkg.packageSize > MAX_PACKAGE_SIZE) {
    violations.push(violation("FULL_BASE_LEAK", `Package size ${pkg.packageSize} exceeds maximum relevance limit`));
  }

  const domainCoverage = requiredDomains.filter(
    (domain) =>
      pkg.rawPackage.items.some((i) => i.domain === domain) ||
      (domain === KnowledgeRetrievalDomain.PATTERN && pkg.patterns.length > 0) ||
      (domain === KnowledgeRetrievalDomain.ANTI_PATTERN && pkg.antiPatterns.length > 0),
  ).length;
  const minimumCoverage = Math.min(5, requiredDomains.length);
  if (domainCoverage < minimumCoverage) {
    violations.push(
      violation(
        "DOMAIN_NOT_LOADED",
        `Insufficient domain coverage: ${domainCoverage}/${minimumCoverage}`,
        KnowledgeRetrievalPipelineStage.DOMAIN_SELECTION,
      ),
    );
  }

  if (!pkg.rawPackage.items.some((i) => i.domain === KnowledgeRetrievalDomain.MARKETPLACE)) {
    violations.push(
      violation("MARKETPLACE_IGNORED", "Marketplace knowledge must be loaded", KnowledgeRetrievalPipelineStage.CONTEXT_FILTERING),
    );
  }

  const unresolved = pkg.conflicts.filter((c) => !c.resolvedWinner && !c.delegatedToDesignRules);
  if (unresolved.length > 0 || context.unresolvedConflicts) {
    violations.push(
      violation(
        "UNRESOLVED_CONFLICT",
        "Knowledge conflicts must be delegated to Design Rules Engine",
        KnowledgeRetrievalPipelineStage.CONSISTENCY_CHECK,
      ),
    );
  }

  const rawValidation = validateKnowledgePackage(pkg.rawPackage);
  if (!rawValidation.valid) {
    violations.push(
      ...rawValidation.violations.map((v) =>
        violation("PACKAGE_INCONSISTENT", v.message, KnowledgeRetrievalPipelineStage.VALIDATION),
      ),
    );
  }

  if (pkg.rules.length > 0 && !pkg.rules.every((r) => r.finalScore > 0)) {
    violations.push(
      violation("MISSING_RANKING", "All knowledge items must be ranked", KnowledgeRetrievalPipelineStage.KNOWLEDGE_RANKING),
    );
  }

  return violations;
}

export function runKnowledgeRetrievalStage(
  input: KnowledgeRetrievalStageInput,
  context: KnowledgeRetrievalStageContext = {},
): KnowledgeRetrievalStageReport {
  const started = Date.now();
  const stagesCompleted: KnowledgeRetrievalPipelineStageId[] = [];

  if (!input.profile?.category) {
    return {
      valid: false,
      violations: [violation("MISSING_PROFILE", "Product Profile is required", KnowledgeRetrievalPipelineStage.PROFILE_ANALYSIS)],
      stagesCompleted,
      durationMs: Date.now() - started,
      retryRecommended: true,
    };
  }

  stagesCompleted.push(KnowledgeRetrievalPipelineStage.PROFILE_ANALYSIS);

  const query = buildPipelineKnowledgeQueryFromProfile(input.profile, input.marketplace, input.style);
  if (!query.businessGoal || !query.marketplace) {
    return {
      valid: false,
      violations: [violation("QUERY_INCOMPLETE", "Knowledge query requires business goal and marketplace", KnowledgeRetrievalPipelineStage.QUERY_BUILD)],
      stagesCompleted,
      durationMs: Date.now() - started,
      retryRecommended: true,
    };
  }
  stagesCompleted.push(KnowledgeRetrievalPipelineStage.QUERY_BUILD);

  const requiredDomains = context.skipDomainSelection
    ? Object.values(KnowledgeRetrievalDomain)
    : selectKnowledgeDomainsForProfile(input.profile);
  stagesCompleted.push(KnowledgeRetrievalPipelineStage.DOMAIN_SELECTION);

  const categoryKey = (input.profile.subcategory ?? input.profile.category).toLowerCase().replace(/\s+/g, "_");
  const useCache = !context.skipCache && STAGE_CACHEABLE_CATEGORIES.includes(categoryKey as (typeof STAGE_CACHEABLE_CATEGORIES)[number]);

  const rawPackage = context.forceEmptyPackage
    ? {
        items: [],
        patterns: [],
        antiPatterns: [],
        conflicts: [],
        domains: [],
        explainable: true,
        fromCache: false,
        totalCandidates: 0,
        packageSize: 0,
        pipelineStages: [],
      }
    : retrieveKnowledgePackage({
        context: {
          category: input.profile.subcategory,
          marketplace: input.marketplace,
          audience: input.profile.targetAudience.segment,
          businessGoal: input.profile.businessGoal,
          styleId: input.style ?? input.profile.priceSegment,
          semanticQuery: buildSemanticQueryFromProfile(input.profile),
        },
        limit: MAX_PACKAGE_SIZE,
        useCache,
        requiredDomains,
      });

  stagesCompleted.push(
    KnowledgeRetrievalPipelineStage.SEMANTIC_SEARCH,
    KnowledgeRetrievalPipelineStage.CONTEXT_FILTERING,
    KnowledgeRetrievalPipelineStage.KNOWLEDGE_RANKING,
  );

  const patterns = retrievePatternsForStage(query);
  stagesCompleted.push(KnowledgeRetrievalPipelineStage.PATTERN_RETRIEVAL);

  const antiPatterns = retrieveAntiPatternsForStage(query);
  stagesCompleted.push(KnowledgeRetrievalPipelineStage.ANTI_PATTERN_RETRIEVAL);

  const staged = assembleStagedKnowledgePackage(query, rawPackage, patterns, antiPatterns, stagesCompleted);
  stagesCompleted.push(KnowledgeRetrievalPipelineStage.PACKAGE_ASSEMBLY);

  const violations = validateStagedKnowledgePackage(staged, requiredDomains, context);
  stagesCompleted.push(KnowledgeRetrievalPipelineStage.CONSISTENCY_CHECK);

  if (violations.length > 0 && !context.forceEmptyPackage) {
    const retryable = violations.some((v) =>
      ["EMPTY_PACKAGE", "UNRESOLVED_CONFLICT", "PACKAGE_INCONSISTENT"].includes(v.code),
    );
    if (retryable) {
      const retryPackage = retrieveKnowledgePackage({
        context: {
          category: input.profile.category,
          marketplace: input.marketplace,
          businessGoal: input.profile.businessGoal,
          semanticQuery: buildSemanticQueryFromProfile(input.profile),
        },
        limit: MAX_PACKAGE_SIZE,
        useCache: false,
      });
      const retryStaged = assembleStagedKnowledgePackage(
        query,
        retryPackage,
        patterns,
        antiPatterns,
        stagesCompleted,
      );
      const retryViolations = validateStagedKnowledgePackage(retryStaged, requiredDomains, context);
      if (retryViolations.length < violations.length) {
        stagesCompleted.push(KnowledgeRetrievalPipelineStage.VALIDATION, KnowledgeRetrievalPipelineStage.AGENT_DELIVERY);
        return {
          valid: retryViolations.length === 0,
          violations: retryViolations,
          package: retryStaged,
          stagesCompleted,
          durationMs: Date.now() - started,
          retryRecommended: retryViolations.some((v) => v.code === "UNRESOLVED_CONFLICT"),
        };
      }
      violations.push(
        violation("RETRIEVAL_RETRY_FAILED", "Retrieval retry did not improve package quality", KnowledgeRetrievalPipelineStage.VALIDATION),
      );
    }
  }

  stagesCompleted.push(KnowledgeRetrievalPipelineStage.VALIDATION, KnowledgeRetrievalPipelineStage.AGENT_DELIVERY);

  return {
    valid: violations.length === 0,
    violations,
    package: staged,
    stagesCompleted,
    durationMs: Date.now() - started,
    retryRecommended: violations.some((v) => v.code === "UNRESOLVED_CONFLICT"),
  };
}

export function enrichPipelineContextWithKnowledgeRetrieval(
  ctx: GenerationPipelineContext,
  staged: StagedKnowledgePackage,
): { context: GenerationPipelineContext; violations: KnowledgeRetrievalStageViolation[] } {
  const patch = applyContextPatch(ctx, {
    agentId: "product-analyzer",
    section: PipelineContextSection.KNOWLEDGE,
    changes: {
      package: staged.rawPackage,
      loadedAt: Date.now(),
      version: KNOWLEDGE_RETRIEVAL_STAGE_VERSION,
    },
    reason: "Knowledge Retrieval Stage loaded shared knowledge package",
  });

  return {
    context: patch.context,
    violations: patch.violations as KnowledgeRetrievalStageViolation[],
  };
}

export function runKnowledgeRetrievalStageFromPipeline(
  context: KnowledgeRetrievalStageContext = {},
): KnowledgeRetrievalStageReport {
  const pipelineInput = buildDefaultPipelineInput();
  const analysis = analyzeProduct(buildProductAnalysisInputFromPipeline(pipelineInput));
  if (!analysis.section) {
    return {
      valid: false,
      violations: [violation("MISSING_PROFILE", "Product Analysis must complete before Knowledge Retrieval")],
      stagesCompleted: [],
      durationMs: 0,
      retryRecommended: true,
    };
  }
  return runKnowledgeRetrievalStage(
    {
      profile: analysis.section.profile,
      marketplace: pipelineInput.marketplace,
      style: analysis.section.profile.priceSegment,
    },
    context,
  );
}

export function validateKnowledgeRetrievalStage(
  context: KnowledgeRetrievalStageContext = {},
): KnowledgeRetrievalStageSystemReport {
  const violations: KnowledgeRetrievalStageViolation[] = [];

  const kitchen = runKnowledgeRetrievalStageFromPipeline(context);
  if (!kitchen.valid || !kitchen.package) {
    violations.push(...kitchen.violations);
  } else {
    if (kitchen.package.packageSize > MAX_PACKAGE_SIZE) {
      violations.push(violation("FULL_BASE_LEAK", "Stage must not load entire knowledge base"));
    }
    if (kitchen.package.rules.length === 0) {
      violations.push(violation("EMPTY_PACKAGE", "Kitchen retrieval must produce ranked rules"));
    }
  }

  const gardenAnalysis = analyzeProduct(
    buildDefaultProductAnalysisInput({
      category: "garden_tools",
      marketplace: "wildberries",
      businessGoal: "Increase CTR",
      targetAudience: "garden owners",
    }),
  );
  const garden = runKnowledgeRetrievalStage(
    {
      profile: gardenAnalysis.section!.profile,
      marketplace: "wildberries",
    },
    context,
  );
  if (!garden.valid || !garden.package) {
    violations.push(...garden.violations);
  } else {
    const domains = selectKnowledgeDomainsForProfile(gardenAnalysis.section!.profile);
    if (!domains.includes(KnowledgeRetrievalDomain.MARKETPLACE)) {
      violations.push(violation("DOMAIN_NOT_LOADED", "Garden profile must load marketplace domain"));
    }
    if (garden.package.patterns.length === 0) {
      violations.push(violation("EMPTY_PACKAGE", "Pattern retrieval must return top patterns"));
    }
    if (garden.package.antiPatterns.length === 0) {
      violations.push(violation("EMPTY_PACKAGE", "Anti-pattern retrieval must warn agents"));
    }
    const amazonOnly = garden.package.rawPackage.items.every((i) => i.semanticTags.includes("amazon"));
    if (amazonOnly && garden.package.query.marketplace === "wildberries") {
      violations.push(violation("MARKETPLACE_IGNORED", "Wildberries project must not receive Amazon-only rules"));
    }
  }

  const semanticGarden = buildSemanticQueryFromProfile(gardenAnalysis.section!.profile);
  if (!semanticGarden.toLowerCase().includes("sprayer") && !semanticGarden.toLowerCase().includes("battery")) {
    violations.push(violation("QUERY_INCOMPLETE", "Semantic query must include product subcategory"));
  }

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    maximumRelevanceMinimumContext: kitchen.package ? kitchen.package.packageSize <= MAX_PACKAGE_SIZE : false,
    sharedKnowledgeBase: !!kitchen.package?.rawPackage,
    marketplaceAware: !!garden.package && garden.package.query.marketplace === "wildberries",
    rankingActive: !!kitchen.package?.rules.every((r) => r.finalScore > 0),
    packageComplete: !!kitchen.package && !!garden.package,
  };
}

export function assertKnowledgeRetrievalStage(
  context: KnowledgeRetrievalStageContext = {},
): KnowledgeRetrievalStageSystemReport {
  const report = validateKnowledgeRetrievalStage(context);
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Knowledge Retrieval Stage validation failed: ${messages}`);
  }
  return report;
}

export function runKnowledgeRetrievalStageValidation(
  context: KnowledgeRetrievalStageContext = {},
): KnowledgeRetrievalStageSystemReport {
  return validateKnowledgeRetrievalStage(context);
}

export function isKnowledgeRetrievalStageFailure(code: string): code is KnowledgeRetrievalStageFailureCode {
  const codes: KnowledgeRetrievalStageFailureCode[] = [
    "MISSING_PROFILE",
    "QUERY_INCOMPLETE",
    "DOMAIN_NOT_LOADED",
    "FULL_BASE_LEAK",
    "EMPTY_PACKAGE",
    "UNRESOLVED_CONFLICT",
    "MARKETPLACE_IGNORED",
    "MISSING_RANKING",
    "PACKAGE_INCONSISTENT",
    "RETRIEVAL_RETRY_FAILED",
  ];
  return codes.includes(code as KnowledgeRetrievalStageFailureCode);
}
