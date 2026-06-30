/**
 * Chapter 6.20 — Pipeline Architecture Principles types
 * Constitutional engineering principles for the entire Design Pipeline.
 */

export const PipelineArchitecturePrincipleId = {
  PLANNING_BEFORE_RENDERING: "planning_before_rendering",
  BLUEPRINT_BEFORE_PROMPT: "blueprint_before_prompt",
  AGENT_SPECIALIZATION: "agent_specialization",
  SINGLE_SOURCE_OF_TRUTH: "single_source_of_truth",
  KNOWLEDGE_DRIVEN_DECISIONS: "knowledge_driven_decisions",
  VALIDATION_BEFORE_PROGRESS: "validation_before_progress",
  LOCAL_RETRY: "local_retry",
  EXPLAINABILITY: "explainability",
  PROVIDER_INDEPENDENCE: "provider_independence",
  CONTINUOUS_LEARNING: "continuous_learning",
  COMMERCIAL_FIRST: "commercial_first",
  SCALABILITY: "scalability",
  DETERMINISTIC_WORKFLOW: "deterministic_workflow",
  OBSERVABILITY: "observability",
  FUTURE_COMPATIBILITY: "future_compatibility",
} as const;

export type PipelineArchitecturePrincipleIdValue =
  (typeof PipelineArchitecturePrincipleId)[keyof typeof PipelineArchitecturePrincipleId];

export type PipelineArchitecturePrincipleDefinition = {
  id: PipelineArchitecturePrincipleIdValue;
  number: number;
  title: string;
  principle: string;
  immutable: true;
};

export const PipelineMaturityLevel = {
  PROMPT_BASED: 1,
  BLUEPRINT_BASED: 2,
  MULTI_AGENT: 3,
  KNOWLEDGE_DRIVEN: 4,
  SELF_IMPROVING: 5,
} as const;

export type PipelineMaturityLevelId =
  (typeof PipelineMaturityLevel)[keyof typeof PipelineMaturityLevel];

export type PipelineMaturityLevelDefinition = {
  level: PipelineMaturityLevelId;
  label: string;
  summary: string;
};

export type PipelineManifestStage = {
  id: string;
  label: string;
  pipelineStageIds: string[];
  strengthens: string | null;
};

export type PipelineArchitecturePrincipleViolation = {
  code: PipelineArchitecturePrincipleFailureCode;
  principleId: PipelineArchitecturePrincipleIdValue;
  message: string;
  stageId?: string;
};

export type PipelineArchitecturePrincipleCheckResult = {
  principleId: PipelineArchitecturePrincipleIdValue;
  passed: boolean;
  violations: PipelineArchitecturePrincipleViolation[];
};

export type PipelineArchitectureConstitutionReport = {
  valid: boolean;
  violations: PipelineArchitecturePrincipleViolation[];
  principleResults: PipelineArchitecturePrincipleCheckResult[];
  principlesPassed: number;
  principlesTotal: number;
  constitutionSatisfied: boolean;
  finalGoldenRuleSatisfied: boolean;
  architectureStatementValid: boolean;
  manifestValid: boolean;
  maturityLevel: PipelineMaturityLevelId;
  targetMaturityLevel: PipelineMaturityLevelId;
  successCriteriaMet: boolean;
};

export type PipelineArchitectureConstitutionContext = {
  promptOnlyPipeline?: boolean;
  logicInPrompt?: boolean;
  chaoticAgents?: boolean;
  multipleBlueprints?: boolean;
  skipValidation?: boolean;
  skipLearning?: boolean;
  providerLocked?: boolean;
  blackBoxPipeline?: boolean;
  fullPipelineRestartOnly?: boolean;
  skipObservability?: boolean;
  nonDeterministicPlanning?: boolean;
};

export type PipelineArchitecturePrincipleFailureCode =
  | "RENDER_BEFORE_PLANNING"
  | "PROMPT_AS_SOURCE"
  | "AGENT_OVERLAP"
  | "MULTIPLE_BLUEPRINTS"
  | "LLM_INTUITION_DECISION"
  | "SKIPPED_VALIDATION"
  | "FULL_PIPELINE_RESTART"
  | "BLACK_BOX_DECISION"
  | "PROVIDER_LOCK_IN"
  | "LEARNING_SKIPPED"
  | "COMMERCIAL_IGNORED"
  | "MONOLITHIC_PIPELINE"
  | "NON_DETERMINISTIC_PLANNING"
  | "MISSING_OBSERVABILITY"
  | "NOT_FUTURE_COMPATIBLE"
  | "CONSTITUTION_INCOMPLETE";
