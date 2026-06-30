/**
 * Chapter 6.13 — Rendering Stage types
 * Distinct from Ch 3.11 ProviderResponse and RenderPipelineResult.
 */
import type { PipelineAssemblyMetadata } from "./blueprint-assembly-stage-types";
import type { PlannedRenderRequest } from "./render-adapter-stage-types";
import type { StageProviderProfile } from "./render-adapter-stage-types";
import type { CompiledProviderRequest } from "./render-pipeline-types";

export const RenderingStage = {
  INPUT_ASSEMBLY: "input_assembly",
  REQUEST_VALIDATION: "request_validation",
  PROVIDER_DISPATCH: "provider_dispatch",
  API_COMMUNICATION: "api_communication",
  GENERATION_EXECUTION: "generation_execution",
  RESPONSE_RECEIPT: "response_receipt",
  TECHNICAL_QUALITY_GATE: "technical_quality_gate",
  ERROR_HANDLING: "error_handling",
  RETRY_PLANNING: "retry_planning",
  STORAGE_PERSISTENCE: "storage_persistence",
  METADATA_RECORDING: "metadata_recording",
  REPRODUCIBILITY_ARCHIVE: "reproducibility_archive",
  VISION_HANDOFF: "vision_handoff",
  VALIDATION: "validation",
  STAGE_COMPLETE: "stage_complete",
} as const;

export type RenderingStageId = (typeof RenderingStage)[keyof typeof RenderingStage];

export const RenderingRetryLevel = {
  PROVIDER: "provider_retry",
  ADAPTER: "adapter_retry",
  PIPELINE: "pipeline_retry",
} as const;

export type RenderingRetryLevelId =
  (typeof RenderingRetryLevel)[keyof typeof RenderingRetryLevel];

/** Ch 6.13 StageRenderRequest — executor input (from adapter, not blueprint) */
export type StageRenderRequest = {
  provider: string;
  prompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  seed: number;
  aspectRatio: string;
  quality: string;
  guidance?: number;
  steps?: number;
};

/** Ch 6.13 PlannedRenderResult — spec RenderResult */
export type PlannedRenderResult = {
  image: string;
  metadata: Record<string, unknown>;
  generationTime: number;
  provider: string;
  warnings: string[];
};

/** Ch 6.13 RenderProvider contract */
export type StageRenderProvider = {
  generate(request: StageRenderRequest): PlannedRenderResult | Promise<PlannedRenderResult>;
};

export type RenderingGenerationMetadata = {
  provider: string;
  generationTimeMs: number;
  pipelineVersion: string;
  knowledgeVersion: string;
  blueprintId: string;
  seed: number;
  width: number;
  height: number;
  warnings: string[];
};

export type RenderingStorageRecord = {
  imageRef: string;
  blueprintId: string;
  prompt: string;
  negativePrompt: string;
  provider: string;
  generationTimeMs: number;
  pipelineVersion: string;
  knowledgeVersion: string;
  storedAt: number;
};

export type RenderingRetryRecommendation = {
  level: RenderingRetryLevelId;
  reason: string;
  maxAttempts: number;
  attemptsUsed: number;
};

export type RenderingStageInput = {
  renderRequest: PlannedRenderRequest;
  compiledRequest: CompiledProviderRequest;
  blueprintMetadata: PipelineAssemblyMetadata;
  blueprintId: string;
  providerProfile: StageProviderProfile;
};

export type RenderingStageSection = {
  plannedResult: PlannedRenderResult;
  renderRequest: StageRenderRequest;
  storageRecord: RenderingStorageRecord;
  generationMetadata: RenderingGenerationMetadata;
  retryRecommendation: RenderingRetryRecommendation;
  imageRef: string;
  stagesCompleted: RenderingStageId[];
  confidence: number;
  visionReady: boolean;
};

export type RenderingStageViolation = {
  code: RenderingStageFailureCode;
  message: string;
  stage?: RenderingStageId;
};

export type RenderingStageReport = {
  valid: boolean;
  violations: RenderingStageViolation[];
  section?: RenderingStageSection;
  stagesCompleted: RenderingStageId[];
  durationMs: number;
};

export type RenderingStageContext = {
  missingRequest?: boolean;
  simulateNetworkError?: boolean;
  simulateProviderFailure?: boolean;
  simulateCorruptedImage?: boolean;
  simulateTimeout?: boolean;
  forcePipelineRetry?: boolean;
  provider?: StageRenderProvider;
  providerId?: string;
  marketplace?: string;
  maxProviderRetries?: number;
};

export type RenderingStageSystemReport = {
  valid: boolean;
  violations: RenderingStageViolation[];
  goldenRuleSatisfied: boolean;
  providerIndependent: boolean;
  retrySupported: boolean;
  metadataComplete: boolean;
  storagePersisted: boolean;
  technicalGatePassed: boolean;
  downstreamReady: boolean;
};

export type RenderingStageFailureCode =
  | "MISSING_RENDER_REQUEST"
  | "INVALID_PARAMETERS"
  | "PROVIDER_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT_ERROR"
  | "MISSING_IMAGE"
  | "CORRUPTED_IMAGE"
  | "RESOLUTION_MISMATCH"
  | "INVALID_FORMAT"
  | "MISSING_METADATA"
  | "STORAGE_FAILED"
  | "DESIGN_DECISION_DETECTED"
  | "VISION_NOT_READY";
