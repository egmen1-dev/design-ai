/**
 * Chapter 6.2 — Pipeline Context types
 * Single source of truth for each generation — distinct from Ch 3.14 PipelineContext pool.
 */

import type { AgentContractId } from "./agent-contracts";
import type { KnowledgePackage } from "./knowledge-retrieval-engine";
import type { RenderBlueprint } from "./types";

export const PipelineContextSection = {
  BUSINESS: "business",
  KNOWLEDGE: "knowledge",
  CREATIVE: "creative",
  TECHNICAL: "technical",
  RENDER: "render",
  VALIDATION: "validation",
  LEARNING: "learning",
} as const;

export type PipelineContextSectionId =
  (typeof PipelineContextSection)[keyof typeof PipelineContextSection];

export const PipelineContextLifecycle = {
  CREATED: "created",
  ENRICHED: "enriched",
  CREATIVE_READY: "creative_ready",
  TECHNICAL_READY: "technical_ready",
  RENDER_READY: "render_ready",
  VALIDATED: "validated",
  LEARNING_READY: "learning_ready",
  ARCHIVED: "archived",
} as const;

export type PipelineContextLifecycleId =
  (typeof PipelineContextLifecycle)[keyof typeof PipelineContextLifecycle];

export type ProductContext = {
  imageRef: string;
  category: string;
  name?: string;
};

export type MarketplaceContext = {
  id: string;
  name: string;
};

export type BusinessGoalContext = {
  goal: string;
  priority?: string;
};

export type BrandProfile = {
  name: string;
  tone?: string;
};

export type AudienceProfile = {
  segment: string;
  locale?: string;
};

export type BusinessContextSection = {
  product: ProductContext;
  marketplace: MarketplaceContext;
  businessGoal: BusinessGoalContext;
  brand: BrandProfile;
  targetAudience: AudienceProfile;
};

export type KnowledgeContextSection = {
  package: KnowledgePackage;
  loadedAt: number;
  version: string;
};

export type CreativeContextSection = {
  story: Record<string, unknown>;
  style: Record<string, unknown>;
  scene: Record<string, unknown>;
};

export type TechnicalContextSection = {
  camera: Record<string, unknown>;
  lighting: Record<string, unknown>;
  materials: Record<string, unknown>;
  composition: Record<string, unknown>;
};

export type RenderContextSection = {
  provider: string;
  compiledPrompt?: string;
  settings: Record<string, unknown>;
  status: "pending" | "running" | "completed" | "failed";
};

export type ValidationContextSection = {
  consensusPassed: boolean;
  visionScore?: number;
  commercialScore?: number;
  chiefApproved: boolean;
  violations: string[];
};

export type LearningContextSection = {
  packageId?: string;
  designMemoryUpdated: boolean;
  feedbackCollected: boolean;
};

export type PipelineMetadata = {
  constraints: string[];
  revision: number;
  createdAt: number;
  updatedAt: number;
};

/** Ch 6.2 Pipeline Context — generation working memory (SSOT) */
export type GenerationPipelineContext = {
  pipelineId: string;
  projectId: string;
  business: BusinessContextSection;
  knowledge: KnowledgeContextSection;
  creative: CreativeContextSection;
  technical: TechnicalContextSection;
  render: RenderContextSection;
  validation: ValidationContextSection;
  learning: LearningContextSection;
  blueprint: RenderBlueprint;
  metadata: PipelineMetadata;
  lifecycle: PipelineContextLifecycleId;
};

export type PipelineContextPatch = {
  agentId: AgentContractId;
  section: PipelineContextSectionId;
  blueprintSection?: string;
  changes: Record<string, unknown>;
  reason: string;
};

export type PipelineContextSnapshot = {
  id: string;
  pipelineId: string;
  label: string;
  lifecycle: PipelineContextLifecycleId;
  context: GenerationPipelineContext;
  createdAt: number;
  blueprintRevision: number;
};

export type PipelineContextAuditEntry = {
  id: string;
  pipelineId: string;
  agentId: AgentContractId;
  changedFields: string[];
  timestamp: number;
  reason: string;
  blueprintRevision: number;
};

export type AgentContextView = {
  agentId: AgentContractId;
  sections: PipelineContextSectionId[];
  business: Partial<BusinessContextSection>;
  knowledge?: KnowledgeContextSection;
  creative?: Partial<CreativeContextSection>;
  technical?: Partial<TechnicalContextSection>;
  blueprint: RenderBlueprint;
};

export type PipelineContextViolation = {
  code: PipelineContextFailureCode;
  message: string;
  agentId?: AgentContractId;
  section?: PipelineContextSectionId;
};

export type PipelineContextConsistencyReport = {
  valid: boolean;
  violations: PipelineContextViolation[];
  conflicts: string[];
  missingRequired: string[];
};

export type PipelineContextSystemReport = {
  valid: boolean;
  violations: PipelineContextViolation[];
  goldenRuleSatisfied: boolean;
  singleSourceOfTruth: boolean;
  snapshotCapable: boolean;
  recoveryCapable: boolean;
  auditTrailActive: boolean;
  scalable: boolean;
};

export type PipelineContextOptions = {
  directMutation?: boolean;
  duplicateContext?: boolean;
  missingSnapshot?: boolean;
  noAudit?: boolean;
  crossSectionPatch?: boolean;
  damagedContext?: boolean;
};

export type PipelineContextFailureCode =
  | "DIRECT_MUTATION"
  | "DUPLICATE_CONTEXT"
  | "OWNERSHIP_VIOLATION"
  | "CONTEXT_CONFLICT"
  | "MISSING_REQUIRED_DATA"
  | "MISSING_SNAPSHOT"
  | "NO_AUDIT_TRAIL"
  | "DAMAGED_CONTEXT"
  | "INVALID_LIFECYCLE"
  | "CROSS_SECTION_WRITE"
  | "RECOVERY_FAILED"
  | "CONTEXT_INCOMPLETE";
