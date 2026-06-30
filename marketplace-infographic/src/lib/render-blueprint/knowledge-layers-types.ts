/**
 * Chapter 5.4 — Knowledge Layers types
 */
import type { AgentContractId } from "./agent-contracts";

export const KnowledgeLayer = {
  BUSINESS: "business",
  MARKETPLACE: "marketplace",
  DESIGN: "design",
  PHOTOGRAPHY: "photography",
  PSYCHOLOGY: "psychology",
  RENDERING: "rendering",
  LEARNING: "learning",
} as const;

export type KnowledgeLayerId = (typeof KnowledgeLayer)[keyof typeof KnowledgeLayer];

export type KnowledgeLayerDefinition = {
  id: KnowledgeLayerId;
  name: string;
  summary: string;
  responsibility: string;
  version: string;
  dynamic: boolean;
  agents: AgentContractId[];
};

export type LayerKnowledgeEntry = {
  id: string;
  layer: KnowledgeLayerId;
  topic: string;
  rule: string;
  reason: string;
};

export type LayerVersionRecord = {
  layer: KnowledgeLayerId;
  version: string;
  publishedAt: number;
  previousVersion?: string;
  immutable: boolean;
};

export type CrossLayerReasoningInput = {
  business?: string;
  psychology?: string;
  photography?: string;
  marketplace?: string;
  design?: string;
};

export type CrossLayerDecision = {
  decision: string;
  layersUsed: KnowledgeLayerId[];
  reasoning: string[];
  priorityResolved: boolean;
};

export type LayerConflict = {
  higherLayer: KnowledgeLayerId;
  lowerLayer: KnowledgeLayerId;
  higherDecision: string;
  lowerDecision: string;
  resolution: string;
};

export type LayerValidationResult = {
  layer: KnowledgeLayerId;
  valid: boolean;
  violations: string[];
  compatibleWith: KnowledgeLayerId[];
};

export type KnowledgeLayersContext = {
  unavailableLayers?: KnowledgeLayerId[];
  layerMutationLeak?: { from: KnowledgeLayerId; to: KnowledgeLayerId };
  monolithicStore?: boolean;
  missingCrossLayer?: boolean;
};

export type KnowledgeLayersViolation = {
  code: KnowledgeLayersFailureCode;
  message: string;
  layer?: KnowledgeLayerId;
};

export type KnowledgeLayersReport = {
  valid: boolean;
  violations: KnowledgeLayersViolation[];
  layers: KnowledgeLayerDefinition[];
  stack: KnowledgeLayerId[];
  priority: KnowledgeLayerId[];
  goldenRuleSatisfied: boolean;
  independent: boolean;
  crossLayerCapable: boolean;
};

export type KnowledgeLayersFailureCode =
  | "MONOLITHIC_KNOWLEDGE_STORE"
  | "MISSING_LAYER_BOUNDARY"
  | "LAYER_MUTATION_LEAK"
  | "UNKNOWN_KNOWLEDGE_ORIGIN"
  | "MISSING_CROSS_LAYER_REASONING"
  | "RENDERING_OVERRIDES_BUSINESS"
  | "LEARNING_BLOCKS_PIPELINE"
  | "INVALID_LAYER_VERSION";
