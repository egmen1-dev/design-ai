/**
 * Chapter 7.24 — Chief Design Director Agent types
 * Supreme orchestrator — final approve/retry decision before Render Pipeline.
 */
import type { AgentContractId } from "./agent-contracts";
import type { AntiPatternDirectorAgentReport } from "./anti-pattern-director-agent-types";
import type { CameraDirectorAgentBlueprint } from "./camera-director-agent-types";
import type { CommercialCriticAgentReport } from "./commercial-critic-agent-types";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { LightingDirectorAgentBlueprint } from "./lighting-director-agent-types";
import type { MarketplaceDirectorAgentBlueprint } from "./marketplace-director-agent-types";
import type { MaterialDirectorAgentBlueprint } from "./material-director-agent-types";
import type { PatternDirectorAgentBlueprint } from "./pattern-director-agent-types";
import type { PhotographyDirectorAgentBlueprint } from "./photography-director-agent-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import type { SeniorArtDirectorAgentReport } from "./senior-art-director-agent-types";
import type { TypographyDirectorAgentBlueprint } from "./typography-director-agent-types";
import type { VisionCriticAgentReport } from "./vision-critic-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";

export const CHIEF_DESIGN_DIRECTOR_AGENT_ID: AgentContractId = "chief-design-director";

/** Ch 7.24 internal agent modules (7) */
export const ChiefDesignDirectorAgentModule = {
  BLUEPRINT_AUDITOR: "blueprint_auditor",
  EXPERT_CONSENSUS_ENGINE: "expert_consensus_engine",
  CONFLICT_RESOLVER: "conflict_resolver",
  PRIORITY_PLANNER: "priority_planner",
  APPROVAL_ENGINE: "approval_engine",
  DIRECTOR_VALIDATOR: "director_validator",
  FINAL_DECISION_BUILDER: "final_decision_builder",
} as const;

export type ChiefDesignDirectorAgentModuleId =
  (typeof ChiefDesignDirectorAgentModule)[keyof typeof ChiefDesignDirectorAgentModule];

export const ChiefDesignDirectorAgentApprovalLevel = {
  APPROVED: "Approved",
  APPROVED_WITH_MINOR_NOTES: "Approved With Minor Notes",
  RETRY_REQUIRED: "Retry Required",
  REJECTED: "Rejected",
} as const;

export type ChiefDesignDirectorAgentApprovalLevelId =
  (typeof ChiefDesignDirectorAgentApprovalLevel)[keyof typeof ChiefDesignDirectorAgentApprovalLevel];

export type ChiefDesignDirectorAgentProblem = {
  id: string;
  category: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  sourceAgent?: string;
};

export type ChiefDesignDirectorAgentRetryPriority = {
  rank: number;
  domain: string;
  agents: string[];
  reason: string;
};

/** Ch 7.24 ChiefDesignDirectorInput — agent contract */
export type ChiefDesignDirectorAgentInput = {
  storyBlueprint: VisualStoryDirectorAgentBlueprint;
  sceneBlueprint: SceneDirectorAgentBlueprint;
  layoutBlueprint: CompositionDirectorAgentBlueprint;
  photographyBlueprint: PhotographyDirectorAgentBlueprint;
  lightingBlueprint: LightingDirectorAgentBlueprint;
  cameraBlueprint: CameraDirectorAgentBlueprint;
  materialBlueprint: MaterialDirectorAgentBlueprint;
  typographyBlueprint: TypographyDirectorAgentBlueprint;
  marketplaceBlueprint: MarketplaceDirectorAgentBlueprint;
  patternBlueprint: PatternDirectorAgentBlueprint;
  antiPatternReport: AntiPatternDirectorAgentReport;
  visionReport: VisionCriticAgentReport;
  commercialReport: CommercialCriticAgentReport;
  artDirectorReport: SeniorArtDirectorAgentReport;
};

/** Ch 7.24 FinalDesignDecision — agent output contract */
export type ChiefDesignDirectorAgentFinalDecision = {
  approved: boolean;
  overallScore: number;
  retryRequired: boolean;
  retryPriority: ChiefDesignDirectorAgentRetryPriority[];
  criticalProblems: ChiefDesignDirectorAgentProblem[];
  approvalLevel: ChiefDesignDirectorAgentApprovalLevelId;
  directorComments: string[];
  confidence: number;
};

export type ChiefDesignDirectorAgentModuleRecord = {
  module: ChiefDesignDirectorAgentModuleId;
  at: number;
  detail?: string;
};

export type ChiefDesignDirectorAgentKpi = {
  approvalAccuracy: number;
  retryPrecision: number;
  consensusQuality: number;
  commercialSuccessRate: number;
  finalDecisionStability: number;
  falseApprovalRate: number;
  confidenceScore: number;
};

export type ChiefDesignDirectorAgentViolationRecord = {
  code: ChiefDesignDirectorAgentFailureCode;
  module?: ChiefDesignDirectorAgentModuleId;
  message: string;
};

export type ChiefDesignDirectorAgentRetryBranch = "consensus_conflict_approval" | "full";

export type ChiefDesignDirectorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof CHIEF_DESIGN_DIRECTOR_AGENT_ID;
  violations: ChiefDesignDirectorAgentViolationRecord[];
  modulesCompleted: ChiefDesignDirectorAgentModuleId[];
  moduleRecords: ChiefDesignDirectorAgentModuleRecord[];
  input: ChiefDesignDirectorAgentInput;
  decision?: ChiefDesignDirectorAgentFinalDecision;
  confidence: number;
  retryCount: number;
  retryBranch?: ChiefDesignDirectorAgentRetryBranch;
  durationMs: number;
  kpis: ChiefDesignDirectorAgentKpi;
  pipelineMediated: boolean;
  doesNotExecuteRetry: boolean;
  goldenRuleSatisfied: boolean;
};

export type ChiefDesignDirectorAgentValidationReport = {
  valid: boolean;
  violations: ChiefDesignDirectorAgentViolationRecord[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type ChiefDesignDirectorAgentContext = {
  missingBlueprint?: boolean;
  expertConflict?: boolean;
  lowOverallScore?: boolean;
  criticalAntiPattern?: boolean;
  injectCriticalProblem?: boolean;
  lowConfidence?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type ChiefDesignDirectorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "MISSING_BLUEPRINT"
  | "EXPERT_CONFLICT_UNRESOLVED"
  | "LOW_OVERALL_SCORE"
  | "CRITICAL_PROBLEM_MISSED"
  | "FALSE_APPROVAL"
  | "DECISION_INCOMPLETE"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type ChiefDesignDirectorAgentModuleDefinition = {
  id: ChiefDesignDirectorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type ChiefDesignDirectorAgentPipelineLink = {
  from: string;
  to: string;
};
