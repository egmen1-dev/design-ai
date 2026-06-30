/**
 * Chapter 4.25 — Provider Independence types
 */
import type { ProviderId } from "./render-pipeline-types";
import type { RenderBlueprint } from "./types";

export type ProviderCapabilityProfile = {
  provider: ProviderId;
  supportsLongPrompt: boolean;
  supportsNegativePrompt: boolean;
  supportsStyleReference: boolean;
  supportsImageConditioning: boolean;
  supportsControlNet: boolean;
  maxPromptLength: number;
  preferredVocabulary: string[];
  knownWeaknesses: string[];
  knownStrengths: string[];
};

export type ProviderIndependenceViolation = {
  code:
    | "PROMPT_AS_SOURCE_OF_TRUTH"
    | "PROVIDER_VOCABULARY_IN_AGENT"
    | "PROVIDER_LOGIC_IN_AGENT"
    | "BLUEPRINT_PROVIDER_COUPLED"
    | "ADAPTER_NOT_ISOLATED"
    | "SEMANTIC_DRIFT_ACROSS_PROVIDERS"
    | "BLUEPRINT_MUTATED_BY_ADAPTER";
  message: string;
  section?: string;
  agentId?: string;
  provider?: ProviderId;
};

export type MultiProviderCompileResult = {
  provider: ProviderId;
  success: boolean;
  promptLength: number;
  semanticMarkers: string[];
  blueprintChecksum: string;
};

export type ProviderBenchmarkEntry = {
  provider: ProviderId;
  score: number;
  compileSuccess: boolean;
  promptLength: number;
};

export type ExplainabilityChain = {
  image?: string;
  renderIntent: boolean;
  blueprint: boolean;
  agentDecisions: boolean;
  providerIsExecutorOnly: boolean;
};

export type ProviderIndependenceReport = {
  independent: boolean;
  violations: ProviderIndependenceViolation[];
  capabilityProfiles: ProviderCapabilityProfile[];
  multiProviderResults: MultiProviderCompileResult[];
  benchmark: ProviderBenchmarkEntry[];
  explainability: ExplainabilityChain;
  blueprintUnchanged: boolean;
};

export type ProviderIndependenceContext = {
  providers?: ProviderId[];
  agentOutputs?: { agentId: string; texts: string[] }[];
};

export type ProviderIndependenceFailureCode = ProviderIndependenceViolation["code"];
