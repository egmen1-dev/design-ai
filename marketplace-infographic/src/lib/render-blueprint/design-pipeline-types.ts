/**
 * Chapter 6 — Design Pipeline types
 */

export const DesignPipelineStage = {
  BUSINESS_GOAL: "business_goal",
  PRODUCT_ANALYSIS: "product_analysis",
  KNOWLEDGE_RETRIEVAL: "knowledge_retrieval",
  BUSINESS_UNDERSTANDING: "business_understanding",
  VISUAL_STORY_PLANNING: "visual_story_planning",
  SCENE_PLANNING: "scene_planning",
  COMPOSITION_PLANNING: "composition_planning",
  PHOTOGRAPHY_PLANNING: "photography_planning",
  BLUEPRINT_ASSEMBLY: "blueprint_assembly",
  CONSENSUS_VALIDATION: "consensus_validation",
  RENDER_ADAPTER: "render_adapter",
  RENDER_PROVIDER: "render_provider",
  VISION_ANALYSIS: "vision_analysis",
  COMMERCIAL_VALIDATION: "commercial_validation",
  CHIEF_DESIGN_REVIEW: "chief_design_review",
  RETRY: "retry",
  APPROVED_BLUEPRINT: "approved_blueprint",
  KNOWLEDGE_LEARNING: "knowledge_learning",
} as const;

export type DesignPipelineStageId =
  (typeof DesignPipelineStage)[keyof typeof DesignPipelineStage];

export const DesignPipelineLayer = {
  INPUT: "input",
  KNOWLEDGE: "knowledge",
  CREATIVE: "creative",
  TECHNICAL: "technical",
  RENDERING: "rendering",
  VALIDATION: "validation",
  LEARNING: "learning",
} as const;

export type DesignPipelineLayerId =
  (typeof DesignPipelineLayer)[keyof typeof DesignPipelineLayer];

export const DesignPipelinePrinciple = {
  DETERMINISTIC: "deterministic",
  STAGE_CONTRACT: "stage_contract",
  SINGLE_AGENT_RESPONSIBILITY: "single_agent_responsibility",
  INCREMENTAL_BLUEPRINT: "incremental_blueprint",
  INDEPENDENT_RETRY: "independent_retry",
  FAULT_ISOLATION: "fault_isolation",
} as const;

export type DesignPipelinePrincipleId =
  (typeof DesignPipelinePrinciple)[keyof typeof DesignPipelinePrinciple];

export type DesignPipelineStageDefinition = {
  id: DesignPipelineStageId;
  order: number;
  label: string;
  layer: DesignPipelineLayerId;
  responsibility: string;
  agentIds?: string[];
  blueprintSections?: string[];
  optional?: boolean;
  makesDesignDecision: boolean;
};

export type DesignPipelineLayerDefinition = {
  id: DesignPipelineLayerId;
  label: string;
  summary: string;
  stages: DesignPipelineStageId[];
};

export type DesignPipelineInput = {
  productImageRef: string;
  category: string;
  marketplace: string;
  brand?: string;
  targetAudience?: string;
  businessGoal: string;
  projectConstraints?: string[];
};

export type DesignPipelineOutput = {
  blueprintId: string;
  renderPrompt?: string;
  imageRef?: string;
  visionReportId?: string;
  commercialReportId?: string;
  learningPackageId?: string;
  designMemoryUpdated: boolean;
};

export type DesignPipelineStageResult = {
  stage: DesignPipelineStageId;
  passed: boolean;
  durationMs?: number;
  retried?: boolean;
  violations: DesignPipelineViolation[];
};

export type DesignPipelineViolation = {
  code: DesignPipelineFailureCode;
  stage?: DesignPipelineStageId;
  message: string;
};

export type DesignPipelineRunReport = {
  pipelineId: string;
  completed: boolean;
  approved: boolean;
  stages: DesignPipelineStageResult[];
  violations: DesignPipelineViolation[];
  output?: DesignPipelineOutput;
  retryCount: number;
  learningExecuted: boolean;
};

export type DesignPipelineSystemReport = {
  valid: boolean;
  violations: DesignPipelineViolation[];
  stageCount: number;
  layerCount: number;
  principlesSatisfied: boolean;
  goldenRuleSatisfied: boolean;
  orchestrationOnly: boolean;
  explainable: boolean;
  scalable: boolean;
  learningIntegrated: boolean;
};

export type DesignPipelineContext = {
  promptOnlyInput?: boolean;
  pipelineMakesDesignDecision?: boolean;
  skipKnowledgeRetrieval?: boolean;
  skipLearning?: boolean;
  fullBlueprintRewrite?: boolean;
  nonDeterministic?: boolean;
};

export type DesignPipelineFailureCode =
  | "PROMPT_ONLY_INPUT"
  | "PIPELINE_MAKES_DESIGN_DECISION"
  | "MISSING_STAGE_CONTRACT"
  | "INVALID_STAGE_ORDER"
  | "LAYER_GAP"
  | "BLUEPRINT_REWRITE"
  | "NON_DETERMINISTIC"
  | "FAULT_CASCADE"
  | "MISSING_KNOWLEDGE_STAGE"
  | "MISSING_LEARNING_STAGE"
  | "INCOMPLETE_OUTPUT"
  | "ORCHESTRATION_VIOLATION"
  | "PIPELINE_INCOMPLETE";
