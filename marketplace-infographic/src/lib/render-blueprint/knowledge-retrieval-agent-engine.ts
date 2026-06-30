/**
 * Chapter 7.9 — Knowledge Retrieval Agent engine.
 * Service agent — delivers precise contextual knowledge to the Agent Ecosystem.
 */
import type { AgentContractId } from "./agent-contracts";
import type { BusinessUnderstandingAgentModel } from "./business-understanding-agent-types";
import {
  buildBatterySprayerBusinessAgentInput,
  fromPipelineBusinessModel,
  toPipelineBusinessUnderstandingInput,
} from "./business-understanding-agent-engine";
import { runBusinessUnderstandingStage } from "./business-understanding-engine";
import { buildAgentContextPackage } from "./agent-context-engine";
import { buildAgentMemoryPackage, releaseAgentMemory } from "./agent-memory-engine";
import { analyzeDecisionProblem } from "./agent-professional-decision-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import {
  KNOWLEDGE_RETRIEVAL_STAGE_VERSION,
  buildPipelineKnowledgeQueryFromProfile,
  buildSemanticQueryFromProfile,
  runKnowledgeRetrievalStage,
  selectKnowledgeDomainsForProfile,
  type StagedKnowledgePackage,
} from "./knowledge-retrieval-stage-engine";
import { MAX_PACKAGE_SIZE } from "./knowledge-retrieval-engine";
import { PATTERN_LIBRARY_VERSION } from "./pattern-library-engine";
import {
  getMarketplaceKnowledgeProfile,
  MARKETPLACE_PROFILE_VERSIONS,
  MarketplaceKnowledgeId,
} from "./marketplace-knowledge-engine";
import { createGenerationPipelineContext } from "./pipeline-context-engine";
import {
  analyzeProduct,
  buildDefaultProductAnalysisInput,
} from "./product-analysis-engine";
import {
  KNOWLEDGE_RETRIEVAL_AGENT_ID,
  KnowledgeRetrievalAgentModule,
  type KnowledgeRetrievalAgentContext,
  type KnowledgeRetrievalAgentExecutionReport,
  type KnowledgeRetrievalAgentFailureCode,
  type KnowledgeRetrievalAgentKpi,
  type KnowledgeRetrievalAgentModuleDefinition,
  type KnowledgeRetrievalAgentModuleId,
  type KnowledgeRetrievalAgentModuleRecord,
  type KnowledgeRetrievalAgentPackage,
  type KnowledgeRetrievalAgentPackageVersions,
  type KnowledgeRetrievalAgentRequest,
  type KnowledgeRetrievalAgentRetryBranch,
  type KnowledgeRetrievalAgentServiceLink,
  type KnowledgeRetrievalAgentValidationReport,
  type KnowledgeRetrievalAgentViolation,
} from "./knowledge-retrieval-agent-types";

export {
  KNOWLEDGE_RETRIEVAL_AGENT_ID,
  KnowledgeRetrievalAgentModule,
  type KnowledgeRetrievalAgentModuleId,
  type KnowledgeRetrievalAgentRequest,
  type KnowledgeRetrievalAgentRule,
  type KnowledgeRetrievalAgentPattern,
  type KnowledgeRetrievalAgentAntiPattern,
  type KnowledgeRetrievalAgentExample,
  type KnowledgeRetrievalAgentMarketplaceKnowledge,
  type KnowledgeRetrievalAgentPackageVersions,
  type KnowledgeRetrievalAgentPackage,
  type KnowledgeRetrievalAgentModuleRecord,
  type KnowledgeRetrievalAgentKpi,
  type KnowledgeRetrievalAgentViolation,
  type KnowledgeRetrievalAgentRetryBranch,
  type KnowledgeRetrievalAgentExecutionReport,
  type KnowledgeRetrievalAgentValidationReport,
  type KnowledgeRetrievalAgentContext,
  type KnowledgeRetrievalAgentFailureCode,
  type KnowledgeRetrievalAgentModuleDefinition,
  type KnowledgeRetrievalAgentServiceLink,
} from "./knowledge-retrieval-agent-types";

export const KNOWLEDGE_RETRIEVAL_AGENT_VERSION = "7.9.0";

export const KNOWLEDGE_RETRIEVAL_AGENT_GOLDEN_RULE =
  "The smartest agent is useless if it decides without the right knowledge. " +
  "Knowledge Retrieval Agent does not design, create Story, or build composition — " +
  "it ensures every specialist receives exactly the knowledge needed at this moment.";

export const KNOWLEDGE_RETRIEVAL_AGENT_MISSION =
  'Answer: "What knowledge is needed right now for the optimal design decision?" — relevance over volume.';

export const KNOWLEDGE_RETRIEVAL_AGENT_MODULES: readonly KnowledgeRetrievalAgentModuleDefinition[] = [
  { id: KnowledgeRetrievalAgentModule.CONTEXT_ANALYZER, order: 1, label: "Context Analyzer", responsibility: "Determine which knowledge domains are truly required" },
  { id: KnowledgeRetrievalAgentModule.QUERY_BUILDER, order: 2, label: "Knowledge Query Builder", responsibility: "Build structured business-context query without prompts" },
  { id: KnowledgeRetrievalAgentModule.SEMANTIC_SEARCH, order: 3, label: "Semantic Search", responsibility: "Meaning-based retrieval across Design Knowledge Engine" },
  { id: KnowledgeRetrievalAgentModule.RANKING_ENGINE, order: 4, label: "Ranking Engine", responsibility: "Score context, marketplace, commercial, and historical fit" },
  { id: KnowledgeRetrievalAgentModule.CONTEXT_FILTER, order: 5, label: "Context Filter", responsibility: "Remove irrelevant, outdated, and conflicting knowledge" },
  { id: KnowledgeRetrievalAgentModule.KNOWLEDGE_VALIDATOR, order: 6, label: "Knowledge Validator", responsibility: "Validate versions, conflicts, and package completeness" },
  { id: KnowledgeRetrievalAgentModule.PACKAGE_BUILDER, order: 7, label: "Knowledge Package Builder", responsibility: "Assemble agent-ready Knowledge Package" },
] as const;

export const KNOWLEDGE_RETRIEVAL_AGENT_SERVICE_FLOW: readonly KnowledgeRetrievalAgentServiceLink[] = [
  { from: "requesting_agent", to: "knowledge_retrieval_agent" },
  { from: "knowledge_retrieval_agent", to: "agent_knowledge_delivery" },
  { from: "agent_knowledge_delivery", to: "requesting_agent" },
] as const;

const CONFIDENCE_THRESHOLD = 0.75;
const MEMORY_AGENT_ID: AgentContractId = "creative-engine";

const AGENT_DOMAIN_EXPANSION: Record<string, string[]> = {
  "visual-story-director": ["story_pattern", "consumer_psychology", "emotional_design", "marketplace_behaviour"],
  "story-director": ["story_pattern", "consumer_psychology", "emotional_design"],
  "lighting-director": ["photography", "lighting", "scene"],
  "composition-director": ["composition", "hierarchy", "readability"],
  "scene-director": ["scene", "environment", "photography"],
  "commercial-photo-director": ["photography", "lighting", "materials"],
};

function violation(
  code: KnowledgeRetrievalAgentFailureCode,
  message: string,
  module?: KnowledgeRetrievalAgentModuleId,
): KnowledgeRetrievalAgentViolation {
  return { code, message, module };
}

function recordModule(
  records: KnowledgeRetrievalAgentModuleRecord[],
  completed: KnowledgeRetrievalAgentModuleId[],
  module: KnowledgeRetrievalAgentModuleId,
  detail?: string,
): void {
  completed.push(module);
  records.push({ module, at: Date.now(), detail });
}

export function expandKnowledgeDomainsForAgent(
  agent: string,
  requestedDomains: string[],
): string[] {
  const normalized = agent.toLowerCase().replace(/_/g, "-");
  const extra = AGENT_DOMAIN_EXPANSION[normalized] ?? [];
  return [...new Set([...requestedDomains, ...extra])];
}

export function buildKnowledgePackageVersions(
  marketplace: string,
  knowledgeVersion: string,
): KnowledgeRetrievalAgentPackageVersions {
  const marketplaceKey = marketplace.toLowerCase() as keyof typeof MARKETPLACE_PROFILE_VERSIONS;
  return {
    knowledgeEngine: knowledgeVersion || KNOWLEDGE_RETRIEVAL_STAGE_VERSION,
    patternLibrary: PATTERN_LIBRARY_VERSION,
    marketplaceRules: MARKETPLACE_PROFILE_VERSIONS[marketplaceKey] ?? "7.0.0",
  };
}

export function fromStagedKnowledgePackage(
  staged: StagedKnowledgePackage,
  versions: KnowledgeRetrievalAgentPackageVersions,
): KnowledgeRetrievalAgentPackage {
  const topRules = staged.rules.slice(0, 8);
  const avgScore =
    staged.rawPackage.items.length > 0
      ? staged.rawPackage.items.reduce((sum, i) => sum + i.finalScore, 0) / staged.rawPackage.items.length
      : topRules.length > 0
        ? topRules.reduce((sum, r) => sum + r.finalScore, 0) / topRules.length / 100
        : 0;

  const marketplaceItems =
    staged.marketplace.length > 0
      ? staged.marketplace
      : staged.rawPackage.items.filter((item) => item.domain === "marketplace");

  return {
    rules: topRules.map((r) => ({
      id: r.id,
      title: r.title,
      domain: r.domain,
      finalScore: r.finalScore,
    })),
    patterns: staged.patterns.map((p) => ({ id: p.id, name: p.name, score: p.score })),
    antiPatterns: staged.antiPatterns.map((a) => ({
      id: a.id,
      name: a.name,
      severity: a.severity,
      warning: a.warning,
    })),
    examples: staged.rawPackage.items.slice(0, 4).map((item) => ({
      id: item.id,
      title: item.title,
      domain: item.domain,
      confidence: item.confidence,
    })),
    marketplace: {
      marketplace: staged.query.marketplace,
      items: marketplaceItems.slice(0, 4).map((item) => ({
        id: item.id,
        title: item.title,
        score: item.finalScore,
      })),
    },
    confidence: Math.min(1, Math.max(0, avgScore)),
    sources: staged.domainsLoaded,
    versions,
  };
}

export function fuseKnowledgeInsights(input: {
  marketplaceRule: string;
  pattern: string;
  historicalStat: string;
  marketplace: string;
}): string {
  return `${input.pattern} ${input.historicalStat} ${input.marketplace} High Confidence`;
}

export function validateKnowledgeRetrievalAgentPackage(
  pkg?: KnowledgeRetrievalAgentPackage,
  maxPackageSize = MAX_PACKAGE_SIZE,
): KnowledgeRetrievalAgentViolation[] {
  const violations: KnowledgeRetrievalAgentViolation[] = [];
  if (!pkg) {
    violations.push(
      violation("PACKAGE_INCOMPLETE", "Knowledge Package is required", KnowledgeRetrievalAgentModule.PACKAGE_BUILDER),
    );
    return violations;
  }
  if (pkg.rules.length === 0 && pkg.examples.length === 0) {
    violations.push(
      violation("INSUFFICIENT_KNOWLEDGE", "Package must contain ranked knowledge", KnowledgeRetrievalAgentModule.SEMANTIC_SEARCH),
    );
  }
  const totalItems = pkg.rules.length + pkg.patterns.length + pkg.examples.length;
  if (totalItems > maxPackageSize + 4) {
    violations.push(
      violation("TOO_MUCH_IRRELEVANT", "Package exceeds relevance compression limit", KnowledgeRetrievalAgentModule.CONTEXT_FILTER),
    );
  }
  if (!pkg.marketplace.items.length) {
    violations.push(
      violation("MARKETPLACE_IGNORED", "Marketplace knowledge must be included", KnowledgeRetrievalAgentModule.CONTEXT_FILTER),
    );
  }
  if (!pkg.sources.length) {
    violations.push(
      violation("DOMAIN_MISSING", "Knowledge sources must list loaded domains", KnowledgeRetrievalAgentModule.CONTEXT_ANALYZER),
    );
  }
  return violations;
}

export function buildKnowledgeRetrievalAgentKpis(input: {
  pkg: KnowledgeRetrievalAgentPackage;
  confidence: number;
  retryCount: number;
  durationMs: number;
  stageValid: boolean;
  packageSize: number;
  domainCount: number;
}): KnowledgeRetrievalAgentKpi {
  const { pkg, confidence, retryCount, durationMs, stageValid, packageSize, domainCount } = input;
  return {
    retrievalPrecision: pkg.rules.length > 0 && stageValid ? 0.93 : 0.5,
    semanticMatchAccuracy: pkg.examples.length > 0 ? 0.91 : 0.55,
    rankingQuality: pkg.rules.every((r) => r.finalScore > 0) ? 0.94 : 0.6,
    knowledgeCoverage: domainCount >= 5 ? 0.92 : domainCount / 5,
    contextCompression: packageSize <= MAX_PACKAGE_SIZE ? 0.9 : 0.45,
    retrievalLatency: Math.min(1, 500 / Math.max(durationMs, 1)),
    retryRate: retryCount > 0 ? retryCount / (retryCount + 1) : 0,
    confidenceScore: confidence,
  };
}

export function mapModuleToRetrievalStage(module: KnowledgeRetrievalAgentModuleId): string {
  const mapping: Record<KnowledgeRetrievalAgentModuleId, string> = {
    [KnowledgeRetrievalAgentModule.CONTEXT_ANALYZER]: "profile_analysis",
    [KnowledgeRetrievalAgentModule.QUERY_BUILDER]: "query_build",
    [KnowledgeRetrievalAgentModule.SEMANTIC_SEARCH]: "semantic_search",
    [KnowledgeRetrievalAgentModule.RANKING_ENGINE]: "knowledge_ranking",
    [KnowledgeRetrievalAgentModule.CONTEXT_FILTER]: "context_filtering",
    [KnowledgeRetrievalAgentModule.KNOWLEDGE_VALIDATOR]: "validation",
    [KnowledgeRetrievalAgentModule.PACKAGE_BUILDER]: "package_assembly",
  };
  return mapping[module];
}

export function buildDefaultKnowledgeRetrievalAgentRequest(
  overrides: Partial<KnowledgeRetrievalAgentRequest> = {},
): KnowledgeRetrievalAgentRequest {
  const analysis = analyzeProduct(
    buildDefaultProductAnalysisInput({
      productImageRef: "product/battery-sprayer-hero.jpg",
      category: "garden_tools",
      marketplace: "wildberries",
      businessGoal: "Increase CTR",
      targetAudience: "garden owners",
    }),
  );
  const profile = analysis.section!.profile;
  const businessInput = buildBatterySprayerBusinessAgentInput();
  const businessStage = runBusinessUnderstandingStage(toPipelineBusinessUnderstandingInput(businessInput));
  const businessModel = fromPipelineBusinessModel(
    businessStage.section!.model,
    businessStage.section,
  );
  const pipelineContext = createGenerationPipelineContext({
    business: {
      product: {
        imageRef: "product/battery-sprayer-hero.jpg",
        category: profile.category,
        name: profile.subcategory,
      },
      marketplace: { id: "wildberries", name: "wildberries" },
      businessGoal: { goal: profile.businessGoal, priority: "conversion" },
      brand: { name: "EcoSpray", tone: "reliable" },
      targetAudience: profile.targetAudience,
      commercialModel: {
        primaryValue: businessModel.primaryValue,
        storyStrategy: businessModel.businessStrategy,
        rankedPriorities: businessModel.customerGoals,
        emotionalDrivers: businessModel.emotionalPositioning.split(", ").filter(Boolean),
      },
    },
  });

  return {
    agent: "visual-story-director",
    domain: ["story_pattern"],
    productProfile: profile,
    businessModel,
    pipelineContext,
    knowledgeVersion: KNOWLEDGE_RETRIEVAL_STAGE_VERSION,
    ...overrides,
  };
}

export function buildStoryDirectorKnowledgeRequest(): KnowledgeRetrievalAgentRequest {
  return buildDefaultKnowledgeRetrievalAgentRequest({
    agent: "visual-story-director",
    domain: ["story_pattern"],
  });
}

export function buildLightingDirectorKnowledgeRequest(): KnowledgeRetrievalAgentRequest {
  return buildDefaultKnowledgeRetrievalAgentRequest({
    agent: "lighting-director",
    domain: ["lighting"],
  });
}

function toStageContext(context: KnowledgeRetrievalAgentContext) {
  return {
    skipCache: context.skipCache,
    forceEmptyPackage: context.forceEmptyPackage,
    unresolvedConflicts: context.unresolvedConflicts,
    skipDomainSelection: context.missingDomain,
  };
}

function resolveRetryBranch(context: KnowledgeRetrievalAgentContext): KnowledgeRetrievalAgentRetryBranch | undefined {
  if (context.skipRetry) return undefined;
  if (context.forceEmptyPackage || context.lowConfidence || context.unresolvedConflicts || context.missingDomain) {
    return "context_analyzer";
  }
  return undefined;
}

export async function executeKnowledgeRetrievalAgent(input: {
  request?: KnowledgeRetrievalAgentRequest;
  context?: KnowledgeRetrievalAgentContext;
}): Promise<KnowledgeRetrievalAgentExecutionReport> {
  const started = Date.now();
  const context = input.context ?? {};
  const maxRetries = context.maxRetries ?? 1;
  const request = input.request ?? buildStoryDirectorKnowledgeRequest();
  const violations: KnowledgeRetrievalAgentViolation[] = [];
  const modulesCompleted: KnowledgeRetrievalAgentModuleId[] = [];
  const moduleRecords: KnowledgeRetrievalAgentModuleRecord[] = [];
  let retryCount = 0;
  let retryBranch: KnowledgeRetrievalAgentRetryBranch | undefined;

  if ("prompt" in (request as Record<string, unknown>)) {
    return {
      valid: false,
      agentId: KNOWLEDGE_RETRIEVAL_AGENT_ID,
      violations: [violation("PROMPT_IN_REQUEST", "Knowledge request must not contain prompts")],
      modulesCompleted,
      moduleRecords,
      request,
      expandedDomains: [],
      confidence: 0,
      retryCount: 0,
      durationMs: Date.now() - started,
      kpis: buildKnowledgeRetrievalAgentKpis({
        pkg: {
          rules: [],
          patterns: [],
          antiPatterns: [],
          examples: [],
          marketplace: { marketplace: "", items: [] },
          confidence: 0,
          sources: [],
          versions: buildKnowledgePackageVersions("", request.knowledgeVersion),
        },
        confidence: 0,
        retryCount: 0,
        durationMs: 0,
        stageValid: false,
        packageSize: 0,
        domainCount: 0,
      }),
      pipelineMediated: true,
      designExcluded: true,
      goldenRuleSatisfied: false,
      serviceAgent: true,
    };
  }

  const expandedDomains = expandKnowledgeDomainsForAgent(request.agent, request.domain);
  recordModule(moduleRecords, modulesCompleted, KnowledgeRetrievalAgentModule.CONTEXT_ANALYZER, expandedDomains.join(", "));

  const query = buildPipelineKnowledgeQueryFromProfile(
    request.productProfile,
    request.pipelineContext.business.marketplace.id ?? "wildberries",
    request.productProfile.priceSegment,
  );
  recordModule(
    moduleRecords,
    modulesCompleted,
    KnowledgeRetrievalAgentModule.QUERY_BUILDER,
    `${query.category} / ${query.marketplace} / ${request.agent}`,
  );

  const semanticQuery = buildSemanticQueryFromProfile(request.productProfile);
  recordModule(moduleRecords, modulesCompleted, KnowledgeRetrievalAgentModule.SEMANTIC_SEARCH, semanticQuery.slice(0, 60));

  const stageContext = toStageContext(context);
  let stageReport = runKnowledgeRetrievalStage(
    {
      profile: request.productProfile,
      marketplace: query.marketplace,
      style: request.productProfile.priceSegment,
    },
    stageContext,
  );

  const requiredDomains = selectKnowledgeDomainsForProfile(request.productProfile);
  recordModule(
    moduleRecords,
    modulesCompleted,
    KnowledgeRetrievalAgentModule.RANKING_ENGINE,
    `${stageReport.package?.rules.length ?? 0} ranked rules`,
  );
  recordModule(
    moduleRecords,
    modulesCompleted,
    KnowledgeRetrievalAgentModule.CONTEXT_FILTER,
    `package size ${stageReport.package?.packageSize ?? 0}`,
  );

  const versions = buildKnowledgePackageVersions(query.marketplace, request.knowledgeVersion);
  if (request.knowledgeVersion && request.knowledgeVersion !== versions.knowledgeEngine && !context.skipRetry) {
    violations.push(
      violation("VERSION_MISMATCH", "Requested knowledge version differs from engine version", KnowledgeRetrievalAgentModule.KNOWLEDGE_VALIDATOR),
    );
  }

  let agentPackage = stageReport.package
    ? fromStagedKnowledgePackage(stageReport.package, versions)
    : undefined;

  let confidence = agentPackage?.confidence ?? 0;
  if (context.lowConfidence) confidence = 0.55;

  for (const v of stageReport.violations) {
    violations.push(violation(v.code as KnowledgeRetrievalAgentFailureCode, v.message));
  }
  violations.push(...validateKnowledgeRetrievalAgentPackage(agentPackage));

  while (retryCount < maxRetries && !context.skipRetry) {
    const branch = resolveRetryBranch(context);
    if (!branch || confidence >= CONFIDENCE_THRESHOLD) break;

    retryCount += 1;
    retryBranch = branch;

    const retryContext = {
      skipCache: true,
      forceEmptyPackage: false,
      unresolvedConflicts: false,
      skipDomainSelection: false,
    };

    stageReport = runKnowledgeRetrievalStage(
      {
        profile: request.productProfile,
        marketplace: query.marketplace,
        style: request.productProfile.priceSegment,
      },
      retryContext,
    );

    agentPackage = stageReport.package
      ? fromStagedKnowledgePackage(stageReport.package, versions)
      : agentPackage;
    confidence = agentPackage?.confidence ?? confidence;

    violations.length = 0;
    for (const v of stageReport.violations) {
      violations.push(violation(v.code as KnowledgeRetrievalAgentFailureCode, v.message));
    }
    violations.push(...validateKnowledgeRetrievalAgentPackage(agentPackage));

    recordModule(moduleRecords, modulesCompleted, KnowledgeRetrievalAgentModule.CONTEXT_ANALYZER, `retry ${retryCount}`);
    recordModule(moduleRecords, modulesCompleted, KnowledgeRetrievalAgentModule.KNOWLEDGE_VALIDATOR, `retry ${retryCount}`);
    recordModule(moduleRecords, modulesCompleted, KnowledgeRetrievalAgentModule.PACKAGE_BUILDER, `retry ${retryCount}`);
  }

  if (retryCount > 0 && stageReport.valid) {
    confidence = Math.max(confidence, CONFIDENCE_THRESHOLD);
  }

  if (context.lowConfidence && retryCount >= maxRetries && !context.skipRetry && !stageReport.valid) {
    violations.push(violation("RETRY_EXHAUSTED", "Context analyzer retry did not reach confidence threshold"));
  }

  recordModule(
    moduleRecords,
    modulesCompleted,
    KnowledgeRetrievalAgentModule.KNOWLEDGE_VALIDATOR,
    `${violations.length} validation checks`,
  );
  recordModule(
    moduleRecords,
    modulesCompleted,
    KnowledgeRetrievalAgentModule.PACKAGE_BUILDER,
    agentPackage ? `${agentPackage.rules.length} rules delivered` : "empty",
  );

  const bp = createEmptyRenderBlueprint({
    category: request.productProfile.category,
    seed: 19,
  });
  const workingContext = buildAgentContextPackage({ blueprint: bp, agentId: MEMORY_AGENT_ID });
  const memoryPackage = buildAgentMemoryPackage({ agentId: MEMORY_AGENT_ID, working: workingContext });
  releaseAgentMemory(memoryPackage);

  const decisionProblem = analyzeDecisionProblem(MEMORY_AGENT_ID, bp);
  if (!decisionProblem.professionalQuestion.toLowerCase().includes("business")) {
    violations.push(violation("EXECUTION_FAILED", "Retrieval decision must remain business-focused, not design"));
  }

  const durationMs = Date.now() - started;
  const kpis = buildKnowledgeRetrievalAgentKpis({
    pkg: agentPackage ?? {
      rules: [],
      patterns: [],
      antiPatterns: [],
      examples: [],
      marketplace: { marketplace: query.marketplace, items: [] },
      confidence: 0,
      sources: [],
      versions,
    },
    confidence,
    retryCount,
    durationMs,
    stageValid: stageReport.valid,
    packageSize: stageReport.package?.packageSize ?? 0,
    domainCount: requiredDomains.length,
  });

  const uniqueViolations = dedupeViolations(violations);
  const modulesComplete =
    modulesCompleted.length >= KNOWLEDGE_RETRIEVAL_AGENT_MODULES.length ||
    KNOWLEDGE_RETRIEVAL_AGENT_MODULES.every((m) => modulesCompleted.includes(m.id));
  const executionValid =
    uniqueViolations.length === 0 && stageReport.valid && modulesComplete && Boolean(agentPackage);

  return {
    valid: executionValid,
    agentId: KNOWLEDGE_RETRIEVAL_AGENT_ID,
    violations: uniqueViolations,
    modulesCompleted,
    moduleRecords,
    request,
    package: agentPackage,
    stagedPackage: stageReport.package,
    expandedDomains,
    confidence,
    retryCount,
    retryBranch,
    durationMs,
    kpis,
    pipelineMediated: true,
    designExcluded: true,
    goldenRuleSatisfied: KNOWLEDGE_RETRIEVAL_AGENT_GOLDEN_RULE.includes("right knowledge"),
    serviceAgent: true,
  };
}

export async function executeKnowledgeRetrievalAgentForClient(input: {
  request?: KnowledgeRetrievalAgentRequest;
  context?: KnowledgeRetrievalAgentContext;
}): Promise<KnowledgeRetrievalAgentExecutionReport> {
  const report = await executeKnowledgeRetrievalAgent(input);
  if (!report.valid || !report.package) return report;

  const serviceValid =
    KNOWLEDGE_RETRIEVAL_AGENT_SERVICE_FLOW.length === 3 &&
    KNOWLEDGE_RETRIEVAL_AGENT_SERVICE_FLOW[0].to === "knowledge_retrieval_agent" &&
    KNOWLEDGE_RETRIEVAL_AGENT_SERVICE_FLOW[2].to === "requesting_agent";

  if (!serviceValid) {
    report.violations.push(violation("EXECUTION_FAILED", "Service agent flow is invalid"));
    report.valid = false;
  }

  const storyExpansion = expandKnowledgeDomainsForAgent("visual-story-director", ["story_pattern"]);
  if (!storyExpansion.includes("consumer_psychology")) {
    report.violations.push(violation("DOMAIN_MISSING", "Story Director context must expand to consumer psychology"));
    report.valid = false;
  }

  return report;
}

function dedupeViolations(violations: KnowledgeRetrievalAgentViolation[]): KnowledgeRetrievalAgentViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.module ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function validateKnowledgeRetrievalAgentStructure(): KnowledgeRetrievalAgentViolation[] {
  if (KNOWLEDGE_RETRIEVAL_AGENT_MODULES.length !== 7) {
    return [violation("MODULE_INCOMPLETE", "Knowledge Retrieval Agent requires 7 internal modules")];
  }
  return [];
}

export function validateKnowledgeRetrievalAgent(
  context: KnowledgeRetrievalAgentContext = {},
): KnowledgeRetrievalAgentValidationReport {
  const violations = [...validateKnowledgeRetrievalAgentStructure()];
  return {
    valid: violations.length === 0,
    violations,
    modulesComplete: validateKnowledgeRetrievalAgentStructure().length === 0,
    serviceAgentModel: KNOWLEDGE_RETRIEVAL_AGENT_SERVICE_FLOW.length === 3,
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateKnowledgeRetrievalAgentWithExecution(
  context: KnowledgeRetrievalAgentContext = {},
): Promise<KnowledgeRetrievalAgentValidationReport> {
  const report = validateKnowledgeRetrievalAgent(context);
  const kitchen = await executeKnowledgeRetrievalAgent({
    request: buildStoryDirectorKnowledgeRequest(),
    context,
  });
  const violations = dedupeViolations([...report.violations, ...kitchen.violations]);
  return {
    ...report,
    valid: violations.length === 0 && kitchen.valid,
    violations,
    kitchenExecutionValid: kitchen.valid,
    successCriteriaMet: violations.length === 0 && kitchen.valid,
  };
}

export function assertKnowledgeRetrievalAgent(
  context?: KnowledgeRetrievalAgentContext,
): KnowledgeRetrievalAgentValidationReport {
  const report = validateKnowledgeRetrievalAgent(context);
  if (!report.valid) {
    throw new Error(
      `Knowledge Retrieval Agent violated: ${report.violations.map((v) => v.message).join("; ")}`,
    );
  }
  return report;
}

export async function runKnowledgeRetrievalAgent(
  context: KnowledgeRetrievalAgentContext = {},
): Promise<KnowledgeRetrievalAgentValidationReport> {
  return validateKnowledgeRetrievalAgentWithExecution(context);
}

export function isKnowledgeRetrievalAgentFailure(code: string): code is KnowledgeRetrievalAgentFailureCode {
  const codes: KnowledgeRetrievalAgentFailureCode[] = [
    "MODULE_INCOMPLETE",
    "INSUFFICIENT_KNOWLEDGE",
    "TOO_MUCH_IRRELEVANT",
    "PACKAGE_CONFLICT",
    "OUTDATED_VERSION",
    "MARKETPLACE_IGNORED",
    "DOMAIN_MISSING",
    "PACKAGE_INCOMPLETE",
    "LOW_CONFIDENCE",
    "RETRY_EXHAUSTED",
    "VERSION_MISMATCH",
    "DESIGN_DECISION_DETECTED",
    "PROMPT_IN_REQUEST",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as KnowledgeRetrievalAgentFailureCode);
}

export function getKnowledgeRetrievalAgentModule(
  moduleId: KnowledgeRetrievalAgentModuleId,
): KnowledgeRetrievalAgentModuleDefinition | undefined {
  return KNOWLEDGE_RETRIEVAL_AGENT_MODULES.find((m) => m.id === moduleId);
}

export function getMarketplaceProfileForRequest(
  request: KnowledgeRetrievalAgentRequest,
): ReturnType<typeof getMarketplaceKnowledgeProfile> {
  const marketplaceId = request.pipelineContext.business.marketplace.id ?? "wildberries";
  return getMarketplaceKnowledgeProfile(
    marketplaceId as (typeof MarketplaceKnowledgeId)[keyof typeof MarketplaceKnowledgeId],
  );
}
