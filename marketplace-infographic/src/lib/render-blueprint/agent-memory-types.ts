/**
 * Chapter 4.7 — Agent Memory Model types
 */
import type { AgentContractId } from "./agent-contracts";
import type { AgentContextPackage } from "./agent-context-types";

export const MemoryLayer = {
  RUNTIME: "runtime",
  WORKING: "working",
  KNOWLEDGE: "knowledge",
  REFERENCE: "reference",
  LEARNING: "learning",
} as const;

export type MemoryLayerId = (typeof MemoryLayer)[keyof typeof MemoryLayer];

export const MemoryOwner = {
  AGENT: "agent",
  LIFECYCLE_MANAGER: "lifecycle_manager",
  KNOWLEDGE_ENGINE: "knowledge_engine",
  REFERENCE_PROVIDERS: "reference_providers",
  DESIGN_MEMORY: "design_memory",
} as const;

export type MemoryOwnerId = (typeof MemoryOwner)[keyof typeof MemoryOwner];

export type MemoryLayerDefinition = {
  id: MemoryLayerId;
  owner: MemoryOwnerId;
  mutable: boolean;
  summary: string;
};

export type KnowledgeMemory = {
  designGenome: {
    version: string;
    compositionLaws: string[];
    colorTheory: string[];
    typographyRules: string[];
    photographyGuidelines: string[];
  };
  marketplacePatterns: Record<string, string[]>;
};

export type ReferenceMemory = {
  productCategories: Record<string, { subCategories: string[]; typicalMaterials: string[] }>;
  trendSnapshots: { id: string; marketplace: string; season: string; keywords: string[] }[];
  materialLibrary: Record<string, { finish: string; reflectance: number }>;
  sceneLibrary: Record<string, { environment: string; lighting: string }>;
  lightingCatalog: Record<string, { preset: string; temperature: number }>;
  compositionTemplates: { id: string; name: string; ruleOfThirds: boolean }[];
};

export type LearningMemory = {
  successfulCombinations: { scene: string; lighting: string; score: number }[];
  failedCombinations: { scene: string; lighting: string; reason: string }[];
  templateWeights: Record<string, number>;
  sceneWeights: Record<string, number>;
  palettePreferences: Record<string, string[]>;
  generationStats: { totalRuns: number; approvalRate: number };
};

/** Agent-owned scratch space — destroyed after Execute() */
export type RuntimeMemory = {
  locals: Record<string, unknown>;
  scratch: unknown[];
};

export type AgentMemoryAccess = {
  agentId: AgentContractId;
  layers: MemoryLayerId[];
  knowledgeTopics?: string[];
  referenceTopics?: string[];
  learningTopics?: string[];
};

export type AgentMemoryPackage = {
  agentId: AgentContractId;
  pipelineId: string;
  revision: number;
  working: Readonly<AgentContextPackage>;
  knowledge: Readonly<KnowledgeMemory>;
  reference: Readonly<ReferenceMemory>;
  learning: Readonly<LearningMemory>;
  runtime: RuntimeMemory;
  accessedLayers: MemoryLayerId[];
};

export type MemoryProjection = {
  agentId: AgentContractId;
  layers: MemoryLayerId[];
  knowledgeTopics: string[];
  referenceTopics: string[];
  projectedBytes: number;
  fullBytes: number;
};

export type MemoryViolationCode =
  | "UNAUTHORIZED_LAYER"
  | "UNAUTHORIZED_MUTATION"
  | "RUNTIME_LEAK"
  | "SECRET_DETECTED"
  | "NON_SERIALIZABLE"
  | "SHARED_MEMORY"
  | "WORKING_MUTATION";

export type MemoryViolation = {
  code: MemoryViolationCode;
  message: string;
  layer?: MemoryLayerId;
};

export type MemoryValidationReport = {
  valid: boolean;
  agentId: AgentContractId;
  violations: MemoryViolation[];
};

export type MemoryExplainabilityEntry = {
  layer: MemoryLayerId;
  label: string;
  used: boolean;
  owner: MemoryOwnerId;
};

export type MemoryExplainabilityReport = {
  agentId: AgentContractId;
  entries: MemoryExplainabilityEntry[];
  declaredLayers: MemoryLayerId[];
};

export type SerializedMemoryReplay = {
  version: string;
  agentId: AgentContractId;
  pipelineId: string;
  revision: number;
  accessedLayers: MemoryLayerId[];
  working: AgentContextPackage;
  knowledge: KnowledgeMemory;
  reference: ReferenceMemory;
  learning: LearningMemory;
  capturedAt: number;
};

export type AgentMemoryBuildInput = {
  agentId: AgentContractId;
  working: AgentContextPackage;
  knowledge?: KnowledgeMemory;
  reference?: ReferenceMemory;
  learning?: LearningMemory;
};
