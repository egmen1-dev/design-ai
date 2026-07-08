import type { DAOSGenerationMode, DAOSGenerationPolicy } from "../config/generation-mode";

export const GENERATION_CONTEXT_SCHEMA_VERSION = "1.0.0" as const;
export const GENERATION_CONTEXT_PROTOCOL_VERSION = "daos-v3" as const;
export const GENERATION_CONTEXT_CONSTITUTION_VERSION = "3.0" as const;

export type GenerationContextOperatingModeName = "production" | "exploration";

export type GenerationContextMetadata = {
  generationId: string;
  projectId: string;
  runId: string;
  requestId?: string;
  protocolVersion: string;
  constitutionVersion: string;
  schemaVersion: string;
  createdAt: string;
};

export type GenerationContextProduct = {
  productId?: string;
  title?: string;
  imagePath?: string;
  cutoutPath?: string;
  aspectRatio?: number;
  attributes?: Record<string, string | number | boolean>;
  analysisCategory?: string;
  verified: boolean;
};

export type GenerationContextMarketplace = {
  layout: "marketplace" | "other";
  marketplaceId?: string;
  channel?: string;
  intelligenceActive: boolean;
};

export type GenerationContextCategory = {
  primary?: string;
  hints?: string[];
  genomeKey?: string;
  knowledgeCategory?: string;
};

export type GenerationContextOperatingMode = {
  mode: GenerationContextOperatingModeName;
  explorationFlags: string[];
  warnings: string[];
};

export type GenerationContextGenerationMode = {
  mode: DAOSGenerationMode;
  policy: {
    minimumFinalScore: number;
    allowFastShortcuts: boolean;
    enableDebugBundle: boolean;
  };
};

export type GenerationContextAssets = {
  backgroundUrl?: string | null;
  finalImagePath?: string;
  productImageInput?: string;
  existingImageId?: string;
};

export type GenerationContextConstraints = {
  style?: string;
  renderModel?: string;
  regenerateBackgroundOnly?: boolean;
  fastGeneration?: boolean;
  constitutionVersion?: string;
};

export type GenerationContextProvider = {
  renderProvider?: string;
  renderModel?: string;
  renderEngineVersion?: string;
  backgroundSource?: "sd" | "fallback" | "provider";
  aiSource?: string;
};

export type GenerationContextDiagnostics = {
  completenessScore: number;
  missingFields: string[];
  pipelineContextCompleteness?: number;
};

export type GenerationContext = {
  metadata: GenerationContextMetadata;
  product: GenerationContextProduct;
  marketplace: GenerationContextMarketplace;
  category: GenerationContextCategory;
  operatingMode: GenerationContextOperatingMode;
  generationMode: GenerationContextGenerationMode;
  assets: GenerationContextAssets;
  constraints: GenerationContextConstraints;
  provider: GenerationContextProvider;
  diagnostics: GenerationContextDiagnostics;
};

export type GenerationContextSnapshot = GenerationContext;

export type GenerationContextBuildInput = {
  projectId: string;
  runId: string;
  requestId?: string;
  createdAt?: string;
  productAnalysis?: {
    category?: string;
    title?: string;
    aspectRatio?: number;
    attributes?: Record<string, string | number | boolean>;
  };
  layout?: string;
  knowledgeCategory?: string;
  genomeKey?: string;
  marketIntelligenceActive?: boolean;
  marketplaceId?: string;
  generationMode: DAOSGenerationMode;
  generationPolicy: DAOSGenerationPolicy;
  productImage?: string;
  productCutoutPath?: string | null;
  finalImagePath?: string;
  backgroundUrl?: string | null;
  existingImageId?: string;
  style?: string;
  renderModel?: string;
  regenerateBackgroundOnly?: boolean;
  fastGeneration?: boolean;
  constitutionVersion?: string;
  backgroundSource?: "sd" | "fallback" | "provider";
  aiSource?: string;
  renderProvider?: string;
  renderEngineVersion?: string;
  pipelineContextCompleteness?: number;
};
