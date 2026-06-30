/**
 * Chapter 5.7 — Style Knowledge types
 */
import type { AgentContractId } from "./agent-contracts";

export const StyleFamily = {
  LUXURY: "luxury",
  MINIMAL: "minimal",
  MODERN: "modern",
  PREMIUM: "premium",
  TECHNICAL: "technical",
  LIFESTYLE: "lifestyle",
  NATURAL: "natural",
  INDUSTRIAL: "industrial",
  MEDICAL: "medical",
  ECO: "eco",
} as const;

export type StyleFamilyId = (typeof StyleFamily)[keyof typeof StyleFamily];

export const StyleTaxonomyRoot = {
  COMMERCIAL: "commercial",
} as const;

export type StyleTaxonomyRootId = (typeof StyleTaxonomyRoot)[keyof typeof StyleTaxonomyRoot];

export type StyleProfile = {
  id: string;
  name: string;
  description: string;
  family: StyleFamilyId;
  parentId?: string;
  visualCharacteristics: string[];
  recommendedCategories: string[];
  forbiddenCategories: string[];
  psychologicalEffects: string[];
  constraints: string[];
  confidence: number;
  version: string;
};

export type StyleSelectionContext = {
  category?: string;
  audience?: string;
  marketplace?: string;
  imageContext?: string;
  businessGoal?: string;
  priceSegment?: string;
};

export type ComposedStyleProfile = StyleProfile & {
  composedFrom: [string, string];
};

export type StyleBlueprintCheck = {
  styleId: string;
  scene?: string;
  lighting?: string;
  composition?: string;
  materials?: string;
  typography?: string;
  camera?: string;
  visualDensity?: "low" | "medium" | "high";
};

export type StyleConsistencyViolation = {
  agent: string;
  aspect: string;
  expected: string;
  actual: string;
};

export type StyleBlueprintValidation = {
  valid: boolean;
  styleId: string;
  violations: StyleConsistencyViolation[];
  readyForConsensus: boolean;
  retryRecommended: boolean;
};

export type AgentStyleGuidance = {
  agentId: AgentContractId;
  styleId: string;
  directives: string[];
  forbidden: string[];
};

export type StyleKnowledgeContext = {
  decorativeOnlyStyle?: boolean;
  missingConstraints?: boolean;
  noAudienceLink?: boolean;
  noCategoryLink?: boolean;
  inconsistentAgentInterpretation?: boolean;
  unvalidatedNewStyle?: boolean;
};

export type StyleKnowledgeViolation = {
  code: StyleKnowledgeFailureCode;
  message: string;
  styleId?: string;
};

export type StyleKnowledgeReport = {
  valid: boolean;
  violations: StyleKnowledgeViolation[];
  profiles: StyleProfile[];
  families: StyleFamilyId[];
  goldenRuleSatisfied: boolean;
  structured: boolean;
  compositionCapable: boolean;
  evolutionReady: boolean;
};

export type StyleKnowledgeFailureCode =
  | "DECORATIVE_STYLE_ONLY"
  | "MISSING_STYLE_CONSTRAINTS"
  | "NO_AUDIENCE_LINK"
  | "NO_CATEGORY_LINK"
  | "INCONSISTENT_AGENT_INTERPRETATION"
  | "UNVALIDATED_NEW_STYLE"
  | "STYLE_CONSISTENCY_VIOLATED"
  | "FORBIDDEN_CATEGORY_STYLE"
  | "UNKNOWN_STYLE";
