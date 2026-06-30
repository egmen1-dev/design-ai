/**
 * Chapter 5.1 — Philosophy of Design Knowledge types
 */
import type { AgentContractId } from "./agent-contracts";

export const KnowledgeEvidenceSource = {
  INDUSTRIAL_DESIGN: "industrial_design",
  COMMERCIAL_PHOTOGRAPHY: "commercial_photography",
  UX: "ux",
  MARKETING: "marketing",
  COGNITIVE_PSYCHOLOGY: "cognitive_psychology",
  MARKETPLACE_RESEARCH: "marketplace_research",
  SALES_STATISTICS: "sales_statistics",
  PLATFORM_DATA: "platform_data",
  EXPERT_CURATED: "expert_curated",
} as const;

export type KnowledgeEvidenceSourceId =
  (typeof KnowledgeEvidenceSource)[keyof typeof KnowledgeEvidenceSource];

export const KnowledgeDomain = {
  STORY: "story",
  SCENE: "scene",
  LIGHTING: "lighting",
  CAMERA: "camera",
  COMPOSITION: "composition",
  PHOTOGRAPHY: "photography",
  MATERIALS: "materials",
  TYPOGRAPHY: "typography",
  OVERLAY: "overlay",
  MARKETPLACE: "marketplace",
} as const;

export type KnowledgeDomainId = (typeof KnowledgeDomain)[keyof typeof KnowledgeDomain];

export const KnowledgeOrigin = {
  EXPERT: "expert",
  PLATFORM_LEARNING: "platform_learning",
  HYBRID: "hybrid",
} as const;

export type KnowledgeOriginId = (typeof KnowledgeOrigin)[keyof typeof KnowledgeOrigin];

/** Structured design knowledge rule — not prompt, not document */
export type DesignKnowledgeRule = {
  id: string;
  category: string;
  subCategory?: string;
  domain: KnowledgeDomainId;
  preference: string;
  reason: string;
  evidenceSources: KnowledgeEvidenceSourceId[];
  applicableAgents: AgentContractId[];
  reusable: boolean;
  origin: KnowledgeOriginId;
  version: number;
  priority: number;
};

export type StructuredKnowledgeChain = {
  category: string;
  preference: string;
  reason: string;
  evidenceSources: KnowledgeEvidenceSourceId[];
  domain: KnowledgeDomainId;
};

export type KnowledgePhilosophyViolation = {
  code: DesignKnowledgePhilosophyFailureCode;
  message: string;
  ruleId?: string;
};

export type DesignKnowledgePhilosophyContext = {
  rules?: DesignKnowledgeRule[];
  agentId?: AgentContractId;
  category?: string;
  /** Rules that exist only inside prompt strings */
  promptEmbeddedRules?: string[];
  /** Agent relied on unstructured LLM knowledge */
  llmOnlyDecision?: boolean;
};

export type DesignKnowledgePhilosophyReport = {
  valid: boolean;
  violations: KnowledgePhilosophyViolation[];
  rules: DesignKnowledgeRule[];
  pipeline: string[];
  goldenRuleSatisfied: boolean;
  knowledgeBeforeGeneration: boolean;
  unifiedBase: boolean;
  explainable: boolean;
  independent: boolean;
};

export type DesignKnowledgePhilosophyFailureCode =
  | "PROMPT_ONLY_KNOWLEDGE"
  | "LLM_RANDOM_KNOWLEDGE"
  | "MISSING_EVIDENCE_SOURCE"
  | "UNEXPLAINABLE_RULE"
  | "NOT_REUSABLE"
  | "LLM_DEPENDENCY"
  | "PROVIDER_DEPENDENCY"
  | "PROMPT_DEPENDENCY"
  | "FRAGMENTED_KNOWLEDGE_BASE"
  | "KNOWLEDGE_MIXED_WITH_PIPELINE";
