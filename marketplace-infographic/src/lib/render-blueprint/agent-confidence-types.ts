/**
 * Chapter 4.9 — Agent Confidence Model types
 */
import type { AgentContractId } from "./agent-contracts";
import type { DecisionEvaluation } from "./agent-decision-types";

export const ConfidenceLevel = {
  VERY_HIGH: "very_high",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  CRITICAL: "critical",
} as const;

export type ConfidenceLevelId = (typeof ConfidenceLevel)[keyof typeof ConfidenceLevel];

export const ConfidenceLifecycleAction = {
  NONE: "none",
  REVIEW: "review",
  CONSENSUS: "consensus",
  RETRY: "retry",
} as const;

export type ConfidenceLifecycleActionId =
  (typeof ConfidenceLifecycleAction)[keyof typeof ConfidenceLifecycleAction];

export type ConfidenceFactors = {
  inputCompleteness: number;
  knowledgeMatch: number;
  constraintSatisfaction: number;
  alternativeStability: number;
  reasoningConsistency: number;
};

export type ConfidenceThresholds = {
  review: number;
  consensus: number;
  retry: number;
};

export type ConfidenceCalculationInput = {
  agentId: AgentContractId;
  factors: ConfidenceFactors;
  conflictCount?: number;
  missingInputs?: string[];
  evaluations?: DecisionEvaluation[];
  knowledgeAligned?: boolean;
};

export type AgentConfidenceScore = {
  agentId: AgentContractId;
  value: number;
  level: ConfidenceLevelId;
  factors: ConfidenceFactors;
  penalties: { conflicts: number; missingInputs: number; instability: number };
  bonuses: { knowledgeAgreement: number; clearWinner: number };
  recommendedAction: ConfidenceLifecycleActionId;
  timestamp: number;
};

export type ConfidencePropagationEntry = {
  agentId: AgentContractId;
  section?: string;
  confidence: number;
  level: ConfidenceLevelId;
};

export type ConfidenceHistoryEntry = {
  agentId: AgentContractId;
  confidence: number;
  level: ConfidenceLevelId;
  timestamp: number;
  pipelineId?: string;
  revision?: number;
};

export type ConfidenceCalibrationProfile = {
  agentId: AgentContractId;
  /** Multiplier applied after raw score — 1.0 = neutral */
  scale: number;
  /** Offset after scale */
  bias: number;
  sampleCount: number;
  observedAccuracy?: number;
};

export type ConfidenceValidationReport = {
  valid: boolean;
  violations: string[];
};
