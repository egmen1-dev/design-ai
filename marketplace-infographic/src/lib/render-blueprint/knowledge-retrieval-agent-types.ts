/**
 * Chapter 7.9 — Knowledge Retrieval Agent types
 * Intelligent agent specification — distinct from Ch 6.4 pipeline stage API.
 */
import type { BusinessUnderstandingAgentModel } from "./business-understanding-agent-types";
import type { GenerationPipelineContext } from "./pipeline-context-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";

export const KNOWLEDGE_RETRIEVAL_AGENT_ID = "knowledge-retrieval" as const;

/** Ch 7.9 internal agent modules (7) */
export const KnowledgeRetrievalAgentModule = {
  CONTEXT_ANALYZER: "context_analyzer",
  QUERY_BUILDER: "query_builder",
  SEMANTIC_SEARCH: "semantic_search",
  RANKING_ENGINE: "ranking_engine",
  CONTEXT_FILTER: "context_filter",
  KNOWLEDGE_VALIDATOR: "knowledge_validator",
  PACKAGE_BUILDER: "package_builder",
} as const;

export type KnowledgeRetrievalAgentModuleId =
  (typeof KnowledgeRetrievalAgentModule)[keyof typeof KnowledgeRetrievalAgentModule];

/** Ch 7.9 KnowledgeRequest — agent contract (no prompt) */
export type KnowledgeRetrievalAgentRequest = {
  agent: string;
  domain: string[];
  productProfile: AnalyzedProductProfile;
  businessModel: BusinessUnderstandingAgentModel;
  pipelineContext: GenerationPipelineContext;
  knowledgeVersion: string;
};

export type KnowledgeRetrievalAgentRule = {
  id: string;
  title: string;
  domain: string;
  finalScore: number;
};

export type KnowledgeRetrievalAgentPattern = {
  id: string;
  name: string;
  score: number;
};

export type KnowledgeRetrievalAgentAntiPattern = {
  id: string;
  name: string;
  severity: number;
  warning: string;
};

export type KnowledgeRetrievalAgentExample = {
  id: string;
  title: string;
  domain: string;
  confidence: number;
};

export type KnowledgeRetrievalAgentMarketplaceKnowledge = {
  marketplace: string;
  items: { id: string; title: string; score: number }[];
};

export type KnowledgeRetrievalAgentPackageVersions = {
  knowledgeEngine: string;
  patternLibrary: string;
  marketplaceRules: string;
};

/** Ch 7.9 KnowledgePackage — agent output contract */
export type KnowledgeRetrievalAgentPackage = {
  rules: KnowledgeRetrievalAgentRule[];
  patterns: KnowledgeRetrievalAgentPattern[];
  antiPatterns: KnowledgeRetrievalAgentAntiPattern[];
  examples: KnowledgeRetrievalAgentExample[];
  marketplace: KnowledgeRetrievalAgentMarketplaceKnowledge;
  confidence: number;
  sources: string[];
  versions: KnowledgeRetrievalAgentPackageVersions;
};

export type KnowledgeRetrievalAgentModuleRecord = {
  module: KnowledgeRetrievalAgentModuleId;
  at: number;
  detail?: string;
};

export type KnowledgeRetrievalAgentKpi = {
  retrievalPrecision: number;
  semanticMatchAccuracy: number;
  rankingQuality: number;
  knowledgeCoverage: number;
  contextCompression: number;
  retrievalLatency: number;
  retryRate: number;
  confidenceScore: number;
};

export type KnowledgeRetrievalAgentViolation = {
  code: KnowledgeRetrievalAgentFailureCode;
  module?: KnowledgeRetrievalAgentModuleId;
  message: string;
};

export type KnowledgeRetrievalAgentRetryBranch = "context_analyzer" | "full";

export type KnowledgeRetrievalAgentExecutionReport = {
  valid: boolean;
  agentId: typeof KNOWLEDGE_RETRIEVAL_AGENT_ID;
  violations: KnowledgeRetrievalAgentViolation[];
  modulesCompleted: KnowledgeRetrievalAgentModuleId[];
  moduleRecords: KnowledgeRetrievalAgentModuleRecord[];
  request: KnowledgeRetrievalAgentRequest;
  package?: KnowledgeRetrievalAgentPackage;
  stagedPackage?: import("./knowledge-retrieval-stage-types").StagedKnowledgePackage;
  expandedDomains: string[];
  confidence: number;
  retryCount: number;
  retryBranch?: KnowledgeRetrievalAgentRetryBranch;
  durationMs: number;
  kpis: KnowledgeRetrievalAgentKpi;
  pipelineMediated: boolean;
  designExcluded: boolean;
  goldenRuleSatisfied: boolean;
  serviceAgent: boolean;
};

export type KnowledgeRetrievalAgentValidationReport = {
  valid: boolean;
  violations: KnowledgeRetrievalAgentViolation[];
  modulesComplete: boolean;
  serviceAgentModel: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type KnowledgeRetrievalAgentContext = {
  skipCache?: boolean;
  forceEmptyPackage?: boolean;
  unresolvedConflicts?: boolean;
  lowConfidence?: boolean;
  missingDomain?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type KnowledgeRetrievalAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "INSUFFICIENT_KNOWLEDGE"
  | "TOO_MUCH_IRRELEVANT"
  | "PACKAGE_CONFLICT"
  | "OUTDATED_VERSION"
  | "MARKETPLACE_IGNORED"
  | "DOMAIN_MISSING"
  | "PACKAGE_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "VERSION_MISMATCH"
  | "DESIGN_DECISION_DETECTED"
  | "PROMPT_IN_REQUEST"
  | "EXECUTION_FAILED";

export type KnowledgeRetrievalAgentModuleDefinition = {
  id: KnowledgeRetrievalAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type KnowledgeRetrievalAgentServiceLink = {
  from: string;
  to: string;
};
