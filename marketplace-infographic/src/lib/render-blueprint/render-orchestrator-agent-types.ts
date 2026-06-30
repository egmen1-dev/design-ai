/**
 * Chapter 7.26 — Render Orchestrator Agent types
 * Central coordinator for final image generation pipeline.
 */
import type { AgentContractId } from "./agent-contracts";
import type { ChiefDesignDirectorAgentFinalDecision } from "./chief-design-director-agent-types";
import type { CameraDirectorAgentBlueprint } from "./camera-director-agent-types";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { LightingDirectorAgentBlueprint } from "./lighting-director-agent-types";
import type { MarketplaceDirectorAgentBlueprint } from "./marketplace-director-agent-types";
import type { MaterialDirectorAgentBlueprint } from "./material-director-agent-types";
import type { PatternDirectorAgentBlueprint } from "./pattern-director-agent-types";
import type { PhotographyDirectorAgentBlueprint } from "./photography-director-agent-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import type { TypographyDirectorAgentBlueprint } from "./typography-director-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";

export const RENDER_ORCHESTRATOR_AGENT_ID: AgentContractId = "render-orchestrator";

/** Ch 7.26 internal agent modules (6) */
export const RenderOrchestratorAgentModule = {
  BLUEPRINT_COLLECTOR: "blueprint_collector",
  DEPENDENCY_RESOLVER: "dependency_resolver",
  RENDER_PLANNER: "render_planner",
  EXECUTION_SCHEDULER: "execution_scheduler",
  PIPELINE_VALIDATOR: "pipeline_validator",
  RENDER_SESSION_BUILDER: "render_session_builder",
} as const;

export type RenderOrchestratorAgentModuleId =
  (typeof RenderOrchestratorAgentModule)[keyof typeof RenderOrchestratorAgentModule];

export const RenderOrchestratorAgentSessionStatus = {
  READY: "ready",
  SCHEDULED: "scheduled",
  RUNNING: "running",
  FAILED: "failed",
  COMPLETED: "completed",
} as const;

export type RenderOrchestratorAgentSessionStatusId =
  (typeof RenderOrchestratorAgentSessionStatus)[keyof typeof RenderOrchestratorAgentSessionStatus];

export const RenderOrchestratorAgentRenderStrategy = {
  SINGLE_PASS: "single_pass",
  MULTI_PASS: "multi_pass",
  HIGH_QUALITY: "high_quality",
} as const;

export type RenderOrchestratorAgentRenderStrategyId =
  (typeof RenderOrchestratorAgentRenderStrategy)[keyof typeof RenderOrchestratorAgentRenderStrategy];

export type RenderOrchestratorAgentStagePlan = {
  id: string;
  name: string;
  order: number;
  parallelGroup?: number;
  status: "pending" | "ready" | "completed";
};

/** Ch 7.26 RenderPlan — agent render plan contract */
export type RenderOrchestratorAgentRenderPlan = {
  strategy: RenderOrchestratorAgentRenderStrategyId;
  stages: RenderOrchestratorAgentStagePlan[];
};

/** Ch 7.26 RenderOrchestratorInput — agent contract */
export type RenderOrchestratorAgentInput = {
  finalDecision: ChiefDesignDirectorAgentFinalDecision;
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
  preferredProvider?: string;
};

/** Ch 7.26 RenderSession — agent output contract */
export type RenderOrchestratorAgentSession = {
  sessionId: string;
  renderPlan: RenderOrchestratorAgentRenderPlan;
  executionOrder: string[];
  provider: string;
  estimatedTime: number;
  status: RenderOrchestratorAgentSessionStatusId;
  confidence: number;
};

export type RenderOrchestratorAgentModuleRecord = {
  module: RenderOrchestratorAgentModuleId;
  at: number;
  detail?: string;
};

export type RenderOrchestratorAgentKpi = {
  renderSuccessRate: number;
  averageRenderTime: number;
  retryEfficiency: number;
  providerStability: number;
  resourceUtilization: number;
  pipelineReliability: number;
  confidenceScore: number;
};

export type RenderOrchestratorAgentViolationRecord = {
  code: RenderOrchestratorAgentFailureCode;
  module?: RenderOrchestratorAgentModuleId;
  message: string;
};

export type RenderOrchestratorAgentRetryBranch = "provider_failover" | "stage_local_retry" | "full";

export type RenderOrchestratorAgentExecutionReport = {
  valid: boolean;
  agentId: typeof RENDER_ORCHESTRATOR_AGENT_ID;
  violations: RenderOrchestratorAgentViolationRecord[];
  modulesCompleted: RenderOrchestratorAgentModuleId[];
  moduleRecords: RenderOrchestratorAgentModuleRecord[];
  input: RenderOrchestratorAgentInput;
  session?: RenderOrchestratorAgentSession;
  confidence: number;
  retryCount: number;
  retryBranch?: RenderOrchestratorAgentRetryBranch;
  durationMs: number;
  kpis: RenderOrchestratorAgentKpi;
  pipelineMediated: boolean;
  doesNotMakeDesignDecisions: boolean;
  goldenRuleSatisfied: boolean;
};

export type RenderOrchestratorAgentValidationReport = {
  valid: boolean;
  violations: RenderOrchestratorAgentViolationRecord[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type RenderOrchestratorAgentContext = {
  missingApproval?: boolean;
  missingBlueprint?: boolean;
  dependencyConflict?: boolean;
  providerUnavailable?: boolean;
  overlayRenderError?: boolean;
  compositeError?: boolean;
  lowConfidence?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type RenderOrchestratorAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "MISSING_APPROVAL"
  | "MISSING_BLUEPRINT"
  | "DEPENDENCY_CONFLICT"
  | "PROVIDER_UNAVAILABLE"
  | "SESSION_INCOMPLETE"
  | "PIPELINE_BLOCKED"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type RenderOrchestratorAgentModuleDefinition = {
  id: RenderOrchestratorAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type RenderOrchestratorAgentPipelineLink = {
  from: string;
  to: string;
};

export type RenderOrchestratorAgentBlueprintAudit = {
  complete: boolean;
  collected: string[];
  missing: string[];
};

export type RenderOrchestratorAgentDependencyReport = {
  valid: boolean;
  conflicts: string[];
};
