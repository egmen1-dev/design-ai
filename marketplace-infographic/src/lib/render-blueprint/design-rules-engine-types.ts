/**
 * Chapter 5.6 — Design Rules Engine types
 */
import type { AgentContractId } from "./agent-contracts";

export const RuleKind = {
  MANDATORY: "mandatory",
  ADVISORY: "advisory",
} as const;

export type RuleKindId = (typeof RuleKind)[keyof typeof RuleKind];

export const RuleDomain = {
  MARKETPLACE: "marketplace",
  LIGHTING: "lighting",
  COMPOSITION: "composition",
  PHOTOGRAPHY: "photography",
  PSYCHOLOGY: "psychology",
  MATERIAL: "material",
  BUSINESS: "business",
} as const;

export type RuleDomainId = (typeof RuleDomain)[keyof typeof RuleDomain];

export type RuleCondition = {
  field: string;
  operator: "eq" | "in" | "contains";
  value: string | string[];
};

export type DesignRuleRecommendation = {
  action: string;
  summary: string;
  reason: string;
};

/** Distinct from Ch 5.2 KnowledgeSource */
export type DesignRuleKnowledgeSource = {
  id: string;
  label: string;
  evidenceLevel: number;
};

export type DesignRule = {
  id: string;
  domain: string;
  conditions: RuleCondition[];
  recommendation: DesignRuleRecommendation;
  priority: number;
  confidence: number;
  constraints: string[];
  sources: DesignRuleKnowledgeSource[];
  kind: RuleKindId;
  historicalSuccess?: number;
  agentIds?: AgentContractId[];
  conflictsWith?: string[];
};

export type DesignRuleContext = {
  product?: string;
  category?: string;
  marketplace?: string;
  audience?: string;
  scene?: string;
  brand?: string;
  businessGoal?: string;
  story?: string;
  imageContext?: string;
  priceSegment?: string;
};

export type RuleScoreWeights = {
  priority: number;
  confidence: number;
  contextMatch: number;
  historicalSuccess: number;
};

export type RuleMatchResult = {
  rule: DesignRule;
  contextMatch: number;
  score: number;
  matched: boolean;
  mandatory: boolean;
};

export type DesignRuleConflict = {
  ruleA: string;
  ruleB: string;
  resolution: string;
  winner: string;
};

export type ComposedRecommendation = {
  actions: string[];
  summary: string;
  reasons: string[];
  ruleIds: string[];
  explainable: boolean;
  finalScore: number;
};

export type AgentRuleRecommendation = {
  agentId: AgentContractId;
  recommendation: ComposedRecommendation;
  mandatoryRules: DesignRule[];
  advisoryRules: RuleMatchResult[];
  conflictsResolved: DesignRuleConflict[];
};

export type DesignRulesExecutionResult = {
  agentRecommendations: AgentRuleRecommendation[];
  stateless: true;
  totalRulesEvaluated: number;
  totalRulesMatched: number;
};

export type RuleLearningFeedback = {
  ruleId: string;
  visionScore?: number;
  commercialScore?: number;
  retryCount?: number;
  userRating?: "positive" | "negative";
};

export type DesignRulesEngineContext = {
  skipContextAnalysis?: boolean;
  unresolvableConflict?: { ruleA: string; ruleB: string };
  unexplainableRecommendation?: boolean;
  rawKnowledgeLeak?: boolean;
  identicalApplication?: boolean;
};

export type DesignRulesEngineViolation = {
  code: DesignRulesEngineFailureCode;
  message: string;
  ruleId?: string;
};

export type DesignRulesEngineReport = {
  valid: boolean;
  violations: DesignRulesEngineViolation[];
  goldenRuleSatisfied: boolean;
  contextAware: boolean;
  conflictResolvable: boolean;
  explainable: boolean;
  stateless: boolean;
  seedRuleCount: number;
};

export type DesignRulesEngineFailureCode =
  | "ALL_RULES_APPLIED_IDENTICALLY"
  | "MISSING_CONTEXT_ANALYSIS"
  | "UNRESOLVABLE_CONFLICT"
  | "UNEXPLAINABLE_RECOMMENDATION"
  | "RAW_KNOWLEDGE_OBJECTS_LEAKED"
  | "MISSING_RULE_EXPLANATION"
  | "EMPTY_AGENT_RECOMMENDATION";
