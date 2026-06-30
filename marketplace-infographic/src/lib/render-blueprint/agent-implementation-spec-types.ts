/**
 * Chapter 7 — Agent Implementation Specification types
 */

export const UniversalAgentModelStage = {
  PIPELINE_CONTEXT: "pipeline_context",
  INPUT_ADAPTER: "input_adapter",
  KNOWLEDGE_RETRIEVAL: "knowledge_retrieval",
  DECISION_ENGINE: "decision_engine",
  RULE_ENGINE: "rule_engine",
  BLUEPRINT_GENERATOR: "blueprint_generator",
  SELF_VALIDATION: "self_validation",
  OUTPUT_ADAPTER: "output_adapter",
  PIPELINE_CONTEXT_OUT: "pipeline_context_out",
} as const;

export type UniversalAgentModelStageId =
  (typeof UniversalAgentModelStage)[keyof typeof UniversalAgentModelStage];

export const AgentInternalLayer = {
  INPUT_LAYER: "input_layer",
  CONTEXT_ANALYZER: "context_analyzer",
  KNOWLEDGE_RETRIEVAL: "knowledge_retrieval",
  DECISION_ENGINE: "decision_engine",
  RULE_VALIDATION: "rule_validation",
  BLUEPRINT_BUILDER: "blueprint_builder",
  SELF_CRITIC: "self_critic",
  OUTPUT_LAYER: "output_layer",
} as const;

export type AgentInternalLayerId =
  (typeof AgentInternalLayer)[keyof typeof AgentInternalLayer];

export const AgentSharedPrincipleId = {
  SINGLE_DOMAIN: "single_domain",
  USE_KNOWLEDGE_ENGINE: "use_knowledge_engine",
  NO_FOREIGN_BLUEPRINT_MUTATION: "no_foreign_blueprint_mutation",
  SELF_VALIDATION_REQUIRED: "self_validation_required",
  EXPLAINABLE_OUTPUT: "explainable_output",
  RETRY_SUPPORT: "retry_support",
  DETERMINISTIC_DECISIONS: "deterministic_decisions",
} as const;

export type AgentSharedPrincipleIdValue =
  (typeof AgentSharedPrincipleId)[keyof typeof AgentSharedPrincipleId];

export const AgentDocumentationSection = {
  PURPOSE: "purpose",
  RESPONSIBILITIES: "responsibilities",
  INPUT: "input",
  OUTPUT: "output",
  INTERNAL_MODULES: "internal_modules",
  DECISION_ENGINE: "decision_engine",
  KNOWLEDGE_USAGE: "knowledge_usage",
  RULE_ENGINE: "rule_engine",
  VALIDATION: "validation",
  RETRY_LOGIC: "retry_logic",
  PERFORMANCE_METRICS: "performance_metrics",
  FUTURE_EVOLUTION: "future_evolution",
  GOLDEN_RULE: "golden_rule",
} as const;

export type AgentDocumentationSectionId =
  (typeof AgentDocumentationSection)[keyof typeof AgentDocumentationSection];

export const AgentImplementationStatus = {
  IMPLEMENTED: "implemented",
  PIPELINE_STAGE: "pipeline_stage",
  PLANNED: "planned",
} as const;

export type AgentImplementationStatusId =
  (typeof AgentImplementationStatus)[keyof typeof AgentImplementationStatus];

export type UniversalAgentModelStageDefinition = {
  id: UniversalAgentModelStageId;
  order: number;
  label: string;
  moduleRef: string;
  responsibility: string;
};

export type AgentInternalLayerDefinition = {
  id: AgentInternalLayerId;
  order: number;
  label: string;
  responsibility: string;
};

export type AgentSharedPrincipleDefinition = {
  id: AgentSharedPrincipleIdValue;
  title: string;
  rule: string;
  immutable: true;
};

export type AgentDocumentationSectionDefinition = {
  id: AgentDocumentationSectionId;
  number: number;
  title: string;
  summary: string;
};

export type AgentImplementationScopeEntry = {
  id: string;
  label: string;
  contractId?: string;
  blueprintSections?: string[];
  status: AgentImplementationStatusId;
  category: "analysis" | "creative" | "technical" | "critic" | "orchestrator" | "learning";
};

export type AgentImplementationSpecViolation = {
  code: AgentImplementationSpecFailureCode;
  principleId?: AgentSharedPrincipleIdValue;
  agentId?: string;
  message: string;
};

export type AgentSharedPrincipleCheckResult = {
  principleId: AgentSharedPrincipleIdValue;
  passed: boolean;
  violations: AgentImplementationSpecViolation[];
};

export type AgentConformanceReport = {
  agentId: string;
  conforms: boolean;
  hasContract: boolean;
  hasGoldenRule: boolean;
  usesDecisionEngine: boolean;
  violations: AgentImplementationSpecViolation[];
};

export type AgentImplementationSpecReport = {
  valid: boolean;
  violations: AgentImplementationSpecViolation[];
  principleResults: AgentSharedPrincipleCheckResult[];
  principlesPassed: number;
  principlesTotal: number;
  universalModelComplete: boolean;
  internalArchitectureComplete: boolean;
  documentationTemplateComplete: boolean;
  scopeCatalogComplete: boolean;
  implementedAgentsConform: boolean;
  conformanceReports: AgentConformanceReport[];
  goldenRuleSatisfied: boolean;
  architectureStatementValid: boolean;
  successCriteriaMet: boolean;
};

export type AgentImplementationSpecContext = {
  promptOnlyAgent?: boolean;
  superAgent?: boolean;
  skipKnowledgeRetrieval?: boolean;
  mutateForeignSections?: boolean;
  skipSelfValidation?: boolean;
  blackBoxOutput?: boolean;
  noRetrySupport?: boolean;
  nonDeterministicAgent?: boolean;
  missingContract?: boolean;
};

export type AgentImplementationSpecFailureCode =
  | "PROMPT_ONLY_AGENT"
  | "SUPER_AGENT_VIOLATION"
  | "MISSING_KNOWLEDGE_USAGE"
  | "FOREIGN_BLUEPRINT_MUTATION"
  | "MISSING_SELF_VALIDATION"
  | "BLACK_BOX_OUTPUT"
  | "NO_RETRY_SUPPORT"
  | "NON_DETERMINISTIC_AGENT"
  | "MISSING_CONTRACT"
  | "INCOMPLETE_UNIVERSAL_MODEL"
  | "INCOMPLETE_INTERNAL_ARCHITECTURE"
  | "INCOMPLETE_DOCUMENTATION_TEMPLATE"
  | "INCOMPLETE_SCOPE_CATALOG"
  | "AGENT_NON_CONFORMANT"
  | "SPEC_INCOMPLETE";
