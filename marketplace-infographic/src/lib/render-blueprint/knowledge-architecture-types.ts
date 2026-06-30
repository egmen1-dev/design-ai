/**
 * Chapter 5.2 — Knowledge Architecture types
 */
import type { AgentContractId } from "./agent-contracts";
import type { KnowledgeEvidenceSourceId } from "./design-knowledge-philosophy-types";

export const KnowledgeModule = {
  MARKETPLACE: "marketplace_knowledge",
  DESIGN: "design_knowledge",
  PHOTOGRAPHY: "photography_knowledge",
  PSYCHOLOGY: "psychology_knowledge",
  TYPOGRAPHY: "typography_knowledge",
  COLOR: "color_knowledge",
  MATERIAL: "material_knowledge",
  COMPOSITION: "composition_knowledge",
  PRODUCT: "product_knowledge",
  PATTERN_LIBRARY: "pattern_library",
  ANTI_PATTERN_LIBRARY: "anti_pattern_library",
  LEARNING: "learning_knowledge",
} as const;

export type KnowledgeModuleId = (typeof KnowledgeModule)[keyof typeof KnowledgeModule];

export const KnowledgeCategory = {
  BUSINESS: "business_knowledge",
  MARKETPLACE: "marketplace_knowledge",
  DESIGN: "design_knowledge",
  VISUAL_PSYCHOLOGY: "visual_psychology",
  COMMERCIAL_PHOTOGRAPHY: "commercial_photography",
  MATERIALS: "materials",
  COMPOSITION: "composition",
  TYPOGRAPHY: "typography",
  RENDERING: "rendering",
} as const;

export type KnowledgeCategoryId = (typeof KnowledgeCategory)[keyof typeof KnowledgeCategory];

export const KnowledgeRelationshipType = {
  SUPPORTS: "supports",
  REQUIRES: "requires",
  CONTRADICTS: "contradicts",
  EXTENDS: "extends",
  INHERITS: "inherits",
} as const;

export type KnowledgeRelationshipTypeId =
  (typeof KnowledgeRelationshipType)[keyof typeof KnowledgeRelationshipType];

export const EvidenceLevel = {
  ANECDOTAL: "anecdotal",
  EXPERT: "expert",
  RESEARCH: "research",
  STATISTICAL: "statistical",
  PLATFORM_PROVEN: "platform_proven",
} as const;

export type EvidenceLevelId = (typeof EvidenceLevel)[keyof typeof EvidenceLevel];

export type KnowledgeRule = {
  id: string;
  condition: string;
  action: string;
  confidence: number;
  reason: string;
};

export type KnowledgeExample = {
  id: string;
  title: string;
  description: string;
  category?: string;
};

export type KnowledgeSource = {
  id: KnowledgeEvidenceSourceId;
  label: string;
  evidenceLevel: EvidenceLevelId;
};

export type KnowledgeMetadata = {
  author: string;
  createdAt: number;
  updatedAt: number;
  confidence: number;
  evidenceLevel: EvidenceLevelId;
  applicableCategories: string[];
  marketplaceSupport: string[];
  immutable: boolean;
  previousVersionId?: string;
};

export type KnowledgeObject = {
  id: string;
  type: string;
  category: KnowledgeCategoryId;
  module: KnowledgeModuleId;
  title: string;
  description: string;
  rules: KnowledgeRule[];
  examples: KnowledgeExample[];
  confidence: number;
  sources: KnowledgeSource[];
  version: number;
  metadata: KnowledgeMetadata;
  hierarchyPath: string[];
};

export type KnowledgeRelationship = {
  from: string;
  to: string;
  type: KnowledgeRelationshipTypeId;
  reason?: string;
};

export type KnowledgeQuery = {
  domain: string;
  category?: string;
  agentId?: AgentContractId;
  context?: Record<string, string | number | boolean>;
  filters?: {
    minConfidence?: number;
    module?: KnowledgeModuleId;
    marketplace?: string;
  };
};

export type KnowledgeResult = {
  objects: KnowledgeObject[];
  relationships: KnowledgeRelationship[];
  query: KnowledgeQuery;
  totalAvailable: number;
  scopedToAgent: boolean;
};

export type KnowledgeGraph = {
  objects: Record<string, KnowledgeObject>;
  relationships: KnowledgeRelationship[];
  modules: KnowledgeModuleId[];
  version: string;
};

export type KnowledgeArchitectureViolation = {
  code: KnowledgeArchitectureFailureCode;
  message: string;
  objectId?: string;
};

export type KnowledgeArchitectureContext = {
  graph?: KnowledgeGraph;
  agentId?: AgentContractId;
  /** Agent received entire knowledge base instead of scoped subset */
  fullBaseLeak?: boolean;
};

export type KnowledgeArchitectureReport = {
  valid: boolean;
  violations: KnowledgeArchitectureViolation[];
  graph: KnowledgeGraph;
  modules: KnowledgeModuleId[];
  goldenRuleSatisfied: boolean;
  modular: boolean;
  versioned: boolean;
  graphConnected: boolean;
};

export type KnowledgeArchitectureFailureCode =
  | "DOCUMENT_ONLY_KNOWLEDGE"
  | "MISSING_SEMANTIC_LINKS"
  | "NO_VERSIONING"
  | "INCONSISTENT_STRUCTURE"
  | "FULL_BASE_LEAK"
  | "INVALID_KNOWLEDGE_OBJECT"
  | "BROKEN_HIERARCHY"
  | "MODULE_STRUCTURE_MISMATCH";
