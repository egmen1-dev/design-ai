/**
 * Chapter 6.4 — Knowledge Retrieval Stage types
 * Distinct from Ch 5.2 KnowledgeQuery and Ch 5.16 KnowledgeRetrievalRequest.
 */
import type {
  KnowledgePackage,
  KnowledgeRetrievalConflict,
  KnowledgeRetrievalDomainId,
  RetrievedKnowledgeItem,
} from "./knowledge-retrieval-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";

export const KnowledgeRetrievalPipelineStage = {
  PROFILE_ANALYSIS: "profile_analysis",
  QUERY_BUILD: "query_build",
  DOMAIN_SELECTION: "domain_selection",
  SEMANTIC_SEARCH: "semantic_search",
  CONTEXT_FILTERING: "context_filtering",
  KNOWLEDGE_RANKING: "knowledge_ranking",
  PATTERN_RETRIEVAL: "pattern_retrieval",
  ANTI_PATTERN_RETRIEVAL: "anti_pattern_retrieval",
  PACKAGE_ASSEMBLY: "package_assembly",
  CONSISTENCY_CHECK: "consistency_check",
  VALIDATION: "validation",
  AGENT_DELIVERY: "agent_delivery",
} as const;

export type KnowledgeRetrievalPipelineStageId =
  (typeof KnowledgeRetrievalPipelineStage)[keyof typeof KnowledgeRetrievalPipelineStage];

/** Ch 6.4 Knowledge Query — business context only, no prompt */
export type PipelineKnowledgeQuery = {
  category: string;
  marketplace: string;
  style?: string;
  businessGoal: string;
  targetAudience: string[];
  priceSegment: string;
  productType: string;
  subcategory?: string;
};

export type RetrievedPatternEntry = {
  id: string;
  name: string;
  score: number;
};

export type RetrievedAntiPatternEntry = {
  id: string;
  name: string;
  severity: number;
  warning: string;
};

export type StagedDesignRule = {
  id: string;
  title: string;
  domain: KnowledgeRetrievalDomainId;
  finalScore: number;
  contextMatch: number;
  confidence: number;
  marketplaceCompatibility: number;
  historicalSuccess: number;
};

/** Ch 6.4 structured Knowledge Package — domain slices for all agents */
export type StagedKnowledgePackage = {
  query: PipelineKnowledgeQuery;
  marketplace: RetrievedKnowledgeItem[];
  style: RetrievedKnowledgeItem[];
  composition: RetrievedKnowledgeItem[];
  photography: RetrievedKnowledgeItem[];
  psychology: RetrievedKnowledgeItem[];
  consumer: RetrievedKnowledgeItem[];
  typography: RetrievedKnowledgeItem[];
  color: RetrievedKnowledgeItem[];
  patterns: RetrievedPatternEntry[];
  antiPatterns: RetrievedAntiPatternEntry[];
  rules: StagedDesignRule[];
  conflicts: KnowledgeRetrievalConflict[];
  rawPackage: KnowledgePackage;
  domainsLoaded: KnowledgeRetrievalDomainId[];
  fromCache: boolean;
  packageSize: number;
  stagesCompleted: KnowledgeRetrievalPipelineStageId[];
};

export type KnowledgeRetrievalStageInput = {
  profile: AnalyzedProductProfile;
  marketplace: string;
  style?: string;
};

export type KnowledgeRetrievalStageViolation = {
  code: KnowledgeRetrievalStageFailureCode;
  message: string;
  stage?: KnowledgeRetrievalPipelineStageId;
};

export type KnowledgeRetrievalStageReport = {
  valid: boolean;
  violations: KnowledgeRetrievalStageViolation[];
  package?: StagedKnowledgePackage;
  stagesCompleted: KnowledgeRetrievalPipelineStageId[];
  durationMs: number;
  retryRecommended: boolean;
};

export type KnowledgeRetrievalStageContext = {
  skipCache?: boolean;
  forceEmptyPackage?: boolean;
  skipDomainSelection?: boolean;
  unresolvedConflicts?: boolean;
};

export type KnowledgeRetrievalStageSystemReport = {
  valid: boolean;
  violations: KnowledgeRetrievalStageViolation[];
  goldenRuleSatisfied: boolean;
  maximumRelevanceMinimumContext: boolean;
  sharedKnowledgeBase: boolean;
  marketplaceAware: boolean;
  rankingActive: boolean;
  packageComplete: boolean;
};

export type KnowledgeRetrievalStageFailureCode =
  | "MISSING_PROFILE"
  | "QUERY_INCOMPLETE"
  | "DOMAIN_NOT_LOADED"
  | "FULL_BASE_LEAK"
  | "EMPTY_PACKAGE"
  | "UNRESOLVED_CONFLICT"
  | "MARKETPLACE_IGNORED"
  | "MISSING_RANKING"
  | "PACKAGE_INCONSISTENT"
  | "RETRIEVAL_RETRY_FAILED";
