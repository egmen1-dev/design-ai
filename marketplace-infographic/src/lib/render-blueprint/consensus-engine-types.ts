/**
 * Chapter 4.23 — Consensus Engine types
 */
import type { BlueprintMutation } from "./mutation-types";
import type { BlueprintSection } from "./types";

export const ConflictType = {
  SEMANTIC: "semantic",
  STRUCTURAL: "structural",
  VISUAL: "visual",
  MARKETPLACE: "marketplace",
  PROVIDER: "provider",
} as const;

export type ConflictTypeId = (typeof ConflictType)[keyof typeof ConflictType];

export const ConflictSeverity = {
  CRITICAL: "critical",
  MAJOR: "major",
  MINOR: "minor",
  INFO: "info",
} as const;

export type ConflictSeverityId = (typeof ConflictSeverity)[keyof typeof ConflictSeverity];

export type BlueprintConflict = {
  code: string;
  type: ConflictTypeId;
  severity: ConflictSeverityId;
  sections: BlueprintSection[];
  message: string;
  explanation: string;
};

export type BlueprintWarning = {
  code: string;
  section: BlueprintSection;
  message: string;
  severity: ConflictSeverityId;
};

export type AgreementPair = {
  from: BlueprintSection;
  to: BlueprintSection;
  agreement: number;
};

export type AgreementMatrix = {
  sections: Record<BlueprintSection, number>;
  pairs: AgreementPair[];
  weakestSection?: BlueprintSection;
};

/** Chapter 4.23 — cross-agent consistency report for Chief Design Director */
export type ConsensusReport = {
  overallConsistency: number;
  conflicts: BlueprintConflict[];
  warnings: BlueprintWarning[];
  agreementMatrix: AgreementMatrix;
  requiresRetry: boolean;
  recommendedMutations: BlueprintMutation[];
  confidence: number;
};

export type ConsensusContext = {
  agentConfidences?: Record<string, number>;
  knowledgeRules?: Record<string, number>;
  provider?: string;
};

export type ConsensusExplainabilityReport = {
  agentId: "consensus-engine";
  crossLinksChecked: AgreementPair[];
  criticalConflicts: string[];
  reasoning: string[];
};

export type ConsensusValidationReport = {
  valid: boolean;
  violations: string[];
  report?: ConsensusReport;
};

export type ConsensusFailureCode =
  | "SECTION_ONLY_ANALYSIS"
  | "MISSING_SEMANTIC_CHECK"
  | "CRITICAL_CONFLICT_SKIPPED"
  | "UNEXPLAINABLE_CONFLICT"
  | "VOTING_INSTEAD_OF_LOGIC";
