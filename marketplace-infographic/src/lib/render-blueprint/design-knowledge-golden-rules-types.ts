/**
 * Chapter 5.20 — Golden Rules of Design Knowledge types
 */

export const DesignKnowledgeGoldenRuleId = {
  KNOWLEDGE_BEFORE_GENERATION: "knowledge_before_generation",
  KNOWLEDGE_IS_INDEPENDENT: "knowledge_is_independent",
  EVERY_RULE_NEEDS_EVIDENCE: "every_rule_needs_evidence",
  EVERYTHING_MUST_BE_EXPLAINABLE: "everything_must_be_explainable",
  KNOWLEDGE_NEVER_DISAPPEARS: "knowledge_never_disappears",
  VALIDATION_BEFORE_USAGE: "validation_before_usage",
  LEARNING_NEVER_STOPS: "learning_never_stops",
  KNOWLEDGE_IS_SHARED: "knowledge_is_shared",
  KNOWLEDGE_OVER_PROMPT: "knowledge_over_prompt",
  BUSINESS_BEFORE_BEAUTY: "business_before_beauty",
  CONSISTENCY_BEFORE_CREATIVITY: "consistency_before_creativity",
  PATTERN_AND_ANTI_PATTERN_TOGETHER: "pattern_and_anti_pattern_together",
  HUMAN_KNOWLEDGE_COMES_FIRST: "human_knowledge_comes_first",
  KNOWLEDGE_MUST_EVOLVE_SAFELY: "knowledge_must_evolve_safely",
  KNOWLEDGE_IS_THE_CORE_ASSET: "knowledge_is_the_core_asset",
} as const;

export type DesignKnowledgeGoldenRuleIdValue =
  (typeof DesignKnowledgeGoldenRuleId)[keyof typeof DesignKnowledgeGoldenRuleId];

export type DesignKnowledgeGoldenRuleDefinition = {
  id: DesignKnowledgeGoldenRuleIdValue;
  number: number;
  title: string;
  principle: string;
  immutable: true;
};

export type DesignKnowledgeGoldenRuleViolation = {
  code: DesignKnowledgeGoldenRuleFailureCode;
  ruleId: DesignKnowledgeGoldenRuleIdValue;
  message: string;
  entryId?: string;
};

export type DesignKnowledgeGoldenRuleCheckResult = {
  ruleId: DesignKnowledgeGoldenRuleIdValue;
  passed: boolean;
  violations: DesignKnowledgeGoldenRuleViolation[];
};

export type DesignKnowledgeConstitutionReport = {
  valid: boolean;
  violations: DesignKnowledgeGoldenRuleViolation[];
  ruleResults: DesignKnowledgeGoldenRuleCheckResult[];
  rulesPassed: number;
  rulesTotal: number;
  constitutionSatisfied: boolean;
  finalGoldenRuleSatisfied: boolean;
  architectureStatementValid: boolean;
};

export type DesignKnowledgeConstitutionContext = {
  agentDecisionWithoutKnowledge?: boolean;
  promptOnlyKnowledge?: boolean;
  localHiddenRules?: boolean;
  deletePublishedKnowledge?: boolean;
  skipValidation?: boolean;
  stopLearning?: boolean;
  beautyWithoutBusiness?: boolean;
  incompatibleCreativity?: boolean;
  patternsWithoutAntiPatterns?: boolean;
  replaceExpertWithoutReview?: boolean;
  unsafeEvolution?: boolean;
};

export type DesignKnowledgeGoldenRuleFailureCode =
  | "LLM_INTUITION_OVERRIDE"
  | "KNOWLEDGE_NOT_INDEPENDENT"
  | "MISSING_EVIDENCE"
  | "UNEXPLAINABLE_KNOWLEDGE"
  | "KNOWLEDGE_DELETED"
  | "UNVALIDATED_KNOWLEDGE"
  | "LEARNING_STOPPED"
  | "FRAGMENTED_KNOWLEDGE"
  | "PROMPT_AS_KNOWLEDGE"
  | "BEAUTY_WITHOUT_BUSINESS"
  | "INCONSISTENT_CREATIVITY"
  | "MISSING_ANTI_PATTERNS"
  | "EXPERT_KNOWLEDGE_REPLACED"
  | "UNSAFE_EVOLUTION"
  | "CORE_ASSET_VIOLATION"
  | "CONSTITUTION_INCOMPLETE";
