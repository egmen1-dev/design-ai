/**
 * Chapter 5.16 — Knowledge Retrieval Engine types
 */
import type { AgentContractId } from "./agent-contracts";

export const KnowledgeRetrievalDomain = {
  MARKETPLACE: "marketplace",
  DESIGN: "design",
  COMPOSITION: "composition",
  PHOTOGRAPHY: "photography",
  COLOR: "color",
  TYPOGRAPHY: "typography",
  PSYCHOLOGY: "psychology",
  CONSUMER: "consumer",
  STYLE: "style",
  PATTERN: "pattern",
  ANTI_PATTERN: "anti_pattern",
} as const;

export type KnowledgeRetrievalDomainId =
  (typeof KnowledgeRetrievalDomain)[keyof typeof KnowledgeRetrievalDomain];

export const RetrievalPipelineStage = {
  AGENT_REQUEST: "agent_request",
  CONTEXT_ANALYSIS: "context_analysis",
  KNOWLEDGE_FILTERING: "knowledge_filtering",
  SEMANTIC_SEARCH: "semantic_search",
  RULE_RANKING: "rule_ranking",
  CONFLICT_RESOLUTION: "conflict_resolution",
  KNOWLEDGE_PACKAGE: "knowledge_package",
  AGENT_DELIVERY: "agent_delivery",
} as const;

export type RetrievalPipelineStageId =
  (typeof RetrievalPipelineStage)[keyof typeof RetrievalPipelineStage];

/** Distinct from Ch 5.2 KnowledgeQuery */
export type RetrievalContext = {
  category?: string;
  marketplace?: string;
  styleId?: string;
  storyType?: string;
  audience?: string;
  brandId?: string;
  agentId?: AgentContractId;
  businessGoal?: string;
  semanticQuery?: string;
};

export type KnowledgeRetrievalRequest = {
  context: RetrievalContext;
  limit?: number;
  useCache?: boolean;
  requiredDomains?: KnowledgeRetrievalDomainId[];
};

export type RetrievedKnowledgeItem = {
  id: string;
  domain: KnowledgeRetrievalDomainId;
  title: string;
  summary: string;
  confidence: number;
  evidenceLevel: number;
  historicalSuccess: number;
  marketplaceCompatibility: number;
  contextMatch: number;
  freshness: number;
  finalScore: number;
  explanation: string;
  constraints?: string[];
  relatedPatternIds?: string[];
  relatedAntiPatternIds?: string[];
  semanticTags: string[];
  version: string;
  updatedAt: number;
};

export type KnowledgeRetrievalConflict = {
  itemA: string;
  itemB: string;
  reason: string;
  resolvedWinner?: string;
  delegatedToDesignRules?: boolean;
};

export type KnowledgePackage = {
  items: RetrievedKnowledgeItem[];
  patterns: string[];
  antiPatterns: string[];
  conflicts: KnowledgeRetrievalConflict[];
  agentId?: AgentContractId;
  domains: KnowledgeRetrievalDomainId[];
  explainable: boolean;
  fromCache: boolean;
  totalCandidates: number;
  packageSize: number;
  pipelineStages: RetrievalPipelineStageId[];
};

export type KnowledgePackageValidation = {
  valid: boolean;
  violations: KnowledgeRetrievalViolation[];
  retryRecommended: boolean;
};

export type KnowledgeRetrievalContext = {
  fullBaseLeak?: boolean;
  keywordOnlySearch?: boolean;
  missingRanking?: boolean;
  missingBusinessContext?: boolean;
  unexplainableSelection?: boolean;
};

export type KnowledgeRetrievalViolation = {
  code: KnowledgeRetrievalFailureCode;
  message: string;
  itemId?: string;
};

export type KnowledgeRetrievalReport = {
  valid: boolean;
  violations: KnowledgeRetrievalViolation[];
  pipeline: RetrievalPipelineStageId[];
  goldenRuleSatisfied: boolean;
  semanticRetrieval: boolean;
  cacheEnabled: boolean;
  evolutionReady: boolean;
};

export type KnowledgeRetrievalFailureCode =
  | "FULL_BASE_LEAK"
  | "KEYWORD_ONLY_SEARCH"
  | "MISSING_RANKING"
  | "MISSING_BUSINESS_CONTEXT"
  | "UNEXPLAINABLE_SELECTION"
  | "PACKAGE_TOO_LARGE"
  | "DUPLICATE_ITEMS"
  | "MISSING_REQUIRED_DOMAIN"
  | "CONFLICTING_MANDATORY_RULES"
  | "INSUFFICIENT_PACKAGE";
