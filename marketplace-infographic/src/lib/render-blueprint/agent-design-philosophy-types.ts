/**
 * Chapter 7.1 — Agent Design Philosophy types
 */

export const AgentDesignPhilosophyPrincipleId = {
  SPECIALIZATION: "specialization",
  RESPONSIBILITY: "responsibility",
  EXPLAINABILITY: "explainability",
  KNOWLEDGE_DRIVEN_DESIGN: "knowledge_driven_design",
  DETERMINISM: "determinism",
  MINIMAL_AUTHORITY: "minimal_authority",
  VALIDATION: "validation",
  COOPERATION: "cooperation",
  ISOLATION: "isolation",
  CONTINUOUS_IMPROVEMENT: "continuous_improvement",
  COMMERCIAL_THINKING: "commercial_thinking",
  FUTURE_COMPATIBILITY: "future_compatibility",
} as const;

export type AgentDesignPhilosophyPrincipleIdValue =
  (typeof AgentDesignPhilosophyPrincipleId)[keyof typeof AgentDesignPhilosophyPrincipleId];

export type AgentDesignPhilosophyPrincipleDefinition = {
  id: AgentDesignPhilosophyPrincipleIdValue;
  number: number;
  title: string;
  principle: string;
  immutable: true;
};

export type AgentProfessionalTrait = {
  id: string;
  label: string;
  summary: string;
};

export type HumanStudioRole = {
  id: string;
  label: string;
  strengthens: string | null;
};

export type BlueprintSectionOwnership = {
  section: string;
  ownerId: string;
  ownerLabel: string;
};

export type AgentCooperationLink = {
  agentId: string;
  label: string;
  strengthens: string | null;
};

export type AgentDesignPhilosophyViolation = {
  code: AgentDesignPhilosophyFailureCode;
  principleId?: AgentDesignPhilosophyPrincipleIdValue;
  agentId?: string;
  message: string;
};

export type AgentDesignPhilosophyPrincipleCheckResult = {
  principleId: AgentDesignPhilosophyPrincipleIdValue;
  passed: boolean;
  violations: AgentDesignPhilosophyViolation[];
};

export type AgentDesignPhilosophyReport = {
  valid: boolean;
  violations: AgentDesignPhilosophyViolation[];
  principleResults: AgentDesignPhilosophyPrincipleCheckResult[];
  principlesPassed: number;
  principlesTotal: number;
  philosophySatisfied: boolean;
  goldenRuleSatisfied: boolean;
  architectureStatementValid: boolean;
  agentOathValid: boolean;
  humanStudioModelValid: boolean;
  successCriteriaMet: boolean;
};

export type AgentDesignPhilosophyContext = {
  superAgent?: boolean;
  promptOnlyAgent?: boolean;
  mutateForeignBlueprint?: boolean;
  blackBoxDecision?: boolean;
  llmOnlyDecision?: boolean;
  nonDeterministic?: boolean;
  excessiveContext?: boolean;
  skipValidation?: boolean;
  directAgentCall?: boolean;
  skipLearning?: boolean;
  beautyWithoutBusiness?: boolean;
  llmLocked?: boolean;
};

export type AgentDesignPhilosophyFailureCode =
  | "SUPER_AGENT"
  | "PROMPT_ONLY_AGENT"
  | "FOREIGN_BLUEPRINT_MUTATION"
  | "BLACK_BOX_DECISION"
  | "LLM_ONLY_DECISION"
  | "NON_DETERMINISTIC"
  | "EXCESSIVE_CONTEXT"
  | "MISSING_VALIDATION"
  | "DIRECT_AGENT_CALL"
  | "LEARNING_SKIPPED"
  | "BEAUTY_WITHOUT_BUSINESS"
  | "LLM_LOCK_IN"
  | "OWNERSHIP_VIOLATION"
  | "COOPERATION_BROKEN"
  | "PHILOSOPHY_INCOMPLETE";
