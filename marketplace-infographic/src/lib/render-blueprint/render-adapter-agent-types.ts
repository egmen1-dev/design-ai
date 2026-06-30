/**
 * Chapter 7.27 — Render Adapter Agent types
 * Bridge between Agent Ecosystem and image generation providers.
 */
import type { AgentContractId } from "./agent-contracts";
import type { CameraDirectorAgentBlueprint } from "./camera-director-agent-types";
import type { CompositionDirectorAgentBlueprint } from "./composition-director-agent-types";
import type { LightingDirectorAgentBlueprint } from "./lighting-director-agent-types";
import type { MarketplaceDirectorAgentBlueprint } from "./marketplace-director-agent-types";
import type { MaterialDirectorAgentBlueprint } from "./material-director-agent-types";
import type { PatternDirectorAgentBlueprint } from "./pattern-director-agent-types";
import type { PhotographyDirectorAgentBlueprint } from "./photography-director-agent-types";
import type { RenderOrchestratorAgentSession } from "./render-orchestrator-agent-types";
import type { SceneDirectorAgentBlueprint } from "./scene-director-agent-types";
import type { TypographyDirectorAgentBlueprint } from "./typography-director-agent-types";
import type { VisualStoryDirectorAgentBlueprint } from "./visual-story-director-agent-types";

export const RENDER_ADAPTER_AGENT_ID: AgentContractId = "render-adapter";

/** Ch 7.27 internal agent modules (7) */
export const RenderAdapterAgentModule = {
  BLUEPRINT_TRANSLATOR: "blueprint_translator",
  PROVIDER_ADAPTER: "provider_adapter",
  PROMPT_COMPILER: "prompt_compiler",
  NEGATIVE_PROMPT_BUILDER: "negative_prompt_builder",
  PARAMETER_OPTIMIZER: "parameter_optimizer",
  PAYLOAD_VALIDATOR: "payload_validator",
  RENDER_PAYLOAD_BUILDER: "render_payload_builder",
} as const;

export type RenderAdapterAgentModuleId =
  (typeof RenderAdapterAgentModule)[keyof typeof RenderAdapterAgentModule];

/** Ch 7.27 ProviderProfile — provider capability contract */
export type RenderAdapterAgentProviderProfile = {
  provider: string;
  supportedFeatures: string[];
  promptStyle: "natural" | "artistic" | "technical" | "composition";
  negativePromptSupport: boolean;
  maxPromptLength: number;
  aspectRatioSupport: string[];
  qualityControls: string[];
};

export type RenderAdapterAgentSceneTranslation = {
  storyLine: string;
  sceneLine: string;
  lightingLine: string;
  cameraLine: string;
  materialLine: string;
  compositionLine: string;
};

/** Ch 7.27 RenderAdapterInput — agent contract */
export type RenderAdapterAgentInput = {
  renderSession: RenderOrchestratorAgentSession;
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
  providerProfile: RenderAdapterAgentProviderProfile;
};

/** Ch 7.27 RenderPayload — agent output contract */
export type RenderAdapterAgentPayload = {
  provider: string;
  prompt: string;
  negativePrompt: string;
  renderParameters: Record<string, string | number | boolean>;
  providerOptions: Record<string, string | number | boolean>;
  estimatedComplexity: number;
  confidence: number;
};

export type RenderAdapterAgentModuleRecord = {
  module: RenderAdapterAgentModuleId;
  at: number;
  detail?: string;
};

export type RenderAdapterAgentKpi = {
  promptAccuracy: number;
  providerCompatibility: number;
  renderQuality: number;
  promptCompression: number;
  retryEfficiency: number;
  providerSuccessRate: number;
  confidenceScore: number;
};

export type RenderAdapterAgentViolationRecord = {
  code: RenderAdapterAgentFailureCode;
  module?: RenderAdapterAgentModuleId;
  message: string;
};

export type RenderAdapterAgentRetryBranch = "prompt_conflict" | "provider_incompatible" | "full";

export type RenderAdapterAgentExecutionReport = {
  valid: boolean;
  agentId: typeof RENDER_ADAPTER_AGENT_ID;
  violations: RenderAdapterAgentViolationRecord[];
  modulesCompleted: RenderAdapterAgentModuleId[];
  moduleRecords: RenderAdapterAgentModuleRecord[];
  input: RenderAdapterAgentInput;
  payload?: RenderAdapterAgentPayload;
  confidence: number;
  retryCount: number;
  retryBranch?: RenderAdapterAgentRetryBranch;
  durationMs: number;
  kpis: RenderAdapterAgentKpi;
  pipelineMediated: boolean;
  doesNotMakeDesignDecisions: boolean;
  goldenRuleSatisfied: boolean;
};

export type RenderAdapterAgentValidationReport = {
  valid: boolean;
  violations: RenderAdapterAgentViolationRecord[];
  modulesComplete: boolean;
  pipelinePositionValid: boolean;
  kitchenExecutionValid: boolean;
  successCriteriaMet: boolean;
};

export type RenderAdapterAgentContext = {
  promptConflict?: boolean;
  providerIncompatible?: boolean;
  missingBlueprintTranslation?: boolean;
  injectContradictoryPrompt?: boolean;
  lowConfidence?: boolean;
  skipRetry?: boolean;
  maxRetries?: number;
};

export type RenderAdapterAgentFailureCode =
  | "MODULE_INCOMPLETE"
  | "BLUEPRINT_LOST_IN_TRANSLATION"
  | "PROMPT_CONFLICT"
  | "PROVIDER_INCOMPATIBLE"
  | "PAYLOAD_INCOMPLETE"
  | "PARAMETER_MISMATCH"
  | "LOW_CONFIDENCE"
  | "RETRY_EXHAUSTED"
  | "DIRECT_AGENT_HANDOFF"
  | "EXECUTION_FAILED";

export type RenderAdapterAgentModuleDefinition = {
  id: RenderAdapterAgentModuleId;
  order: number;
  label: string;
  responsibility: string;
};

export type RenderAdapterAgentPipelineLink = {
  from: string;
  to: string;
};
