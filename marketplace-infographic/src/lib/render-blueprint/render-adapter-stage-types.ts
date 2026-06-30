/**
 * Chapter 6.12 — Render Adapter Stage types
 * Distinct from Ch 4.17 AdapterRenderIntent and CompiledProviderRequest.
 */
import type { AssemblyConflict, PipelineAssemblyMetadata } from "./blueprint-assembly-stage-types";
import type { BusinessUnderstandingSection } from "./business-understanding-types";
import type { StagedKnowledgePackage } from "./knowledge-retrieval-stage-types";
import type { AnalyzedProductProfile } from "./product-analysis-types";
import type { PlannedConsensusReport } from "./consensus-validation-stage-types";
import type { ConstraintSet } from "./constraint-types";
import type { CompiledProviderRequest } from "./render-pipeline-types";
import type { AdapterRenderIntent, PromptBlockTrace, SemanticBlock } from "./render-adapter-types";
import type { RenderBlueprint } from "./types";

export const RenderAdapterStage = {
  INPUT_ASSEMBLY: "input_assembly",
  PROVIDER_PROFILE_LOAD: "provider_profile_load",
  BLUEPRINT_PREPARATION: "blueprint_preparation",
  SEMANTIC_TRANSLATION: "semantic_translation",
  PROMPT_COMPILATION: "prompt_compilation",
  NEGATIVE_PROMPT_GENERATION: "negative_prompt_generation",
  PROMPT_OPTIMIZATION: "prompt_optimization",
  PARAMETER_MAPPING: "parameter_mapping",
  MARKETPLACE_ADAPTATION: "marketplace_adaptation",
  CONSTRAINT_ENFORCEMENT: "constraint_enforcement",
  CAPABILITY_NEGOTIATION: "capability_negotiation",
  REQUEST_ASSEMBLY: "request_assembly",
  EXPLAINABILITY: "explainability",
  VALIDATION: "validation",
  STAGE_COMPLETE: "stage_complete",
} as const;

export type RenderAdapterStageId =
  (typeof RenderAdapterStage)[keyof typeof RenderAdapterStage];

/** Ch 6.12 ProviderProfile — spec interface for adapter compilation */
export type StageProviderProfile = {
  provider: string;
  supportedFeatures: string[];
  promptStyle: string;
  negativePromptSupport: boolean;
  maxPromptLength: number;
  aspectRatioSupport: string[];
  qualityControls: string[];
};

/** Ch 6.12 PlannedRenderRequest — provider-facing request after stage adaptation */
export type PlannedRenderRequest = {
  provider: string;
  positivePrompt: string;
  negativePrompt: string;
  width: number;
  height: number;
  seed: number;
  aspectRatio: string;
  quality: string;
  guidance?: number;
  steps?: number;
};

export type MarketplaceRenderDimensions = {
  width: number;
  height: number;
  aspectRatio: string;
};

export type RenderAdapterStageInput = {
  profile: AnalyzedProductProfile;
  business: BusinessUnderstandingSection;
  blueprint: RenderBlueprint;
  constraintSet: ConstraintSet;
  metadata: PipelineAssemblyMetadata;
  knowledge: StagedKnowledgePackage;
  assemblyConflicts: AssemblyConflict[];
  consensusReport: PlannedConsensusReport;
  marketplace: string;
  providerId: string;
};

export type RenderAdapterStageSection = {
  plannedRequest: PlannedRenderRequest;
  providerProfile: StageProviderProfile;
  adapterIntent: AdapterRenderIntent;
  compiledRequest: CompiledProviderRequest;
  semanticBlocks: SemanticBlock[];
  promptBlocks: PromptBlockTrace[];
  marketplaceDimensions: MarketplaceRenderDimensions;
  blueprint: RenderBlueprint;
  stagesCompleted: RenderAdapterStageId[];
  confidence: number;
};

export type RenderAdapterStageViolation = {
  code: RenderAdapterStageFailureCode;
  message: string;
  stage?: RenderAdapterStageId;
};

export type RenderAdapterStageReport = {
  valid: boolean;
  violations: RenderAdapterStageViolation[];
  section?: RenderAdapterStageSection;
  stagesCompleted: RenderAdapterStageId[];
  durationMs: number;
};

export type RenderAdapterStageContext = {
  missingBlueprint?: boolean;
  unapprovedConsensus?: boolean;
  unsupportedProvider?: boolean;
  alterDesignDecision?: boolean;
  providerId?: string;
  marketplace?: string;
};

export type RenderAdapterStageSystemReport = {
  valid: boolean;
  violations: RenderAdapterStageViolation[];
  goldenRuleSatisfied: boolean;
  providerIndependent: boolean;
  marketplaceAdapted: boolean;
  negativePromptHandled: boolean;
  explainabilityComplete: boolean;
  downstreamReady: boolean;
};

export type RenderAdapterStageFailureCode =
  | "MISSING_BLUEPRINT"
  | "CONSENSUS_NOT_APPROVED"
  | "UNSUPPORTED_PROVIDER"
  | "PROMPT_NOT_FORMED"
  | "INVALID_PARAMETERS"
  | "CONSTRAINT_VIOLATION"
  | "CREATIVE_ADDITION"
  | "BLUEPRINT_DRIFT"
  | "PROVIDER_UNSUPPORTED"
  | "DESIGN_DECISION_DETECTED"
  | "BLUEPRINT_NOT_FROZEN";
