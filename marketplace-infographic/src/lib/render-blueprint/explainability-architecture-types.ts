/**
 * Chapter 4.26 — Explainability Architecture types
 */
import type { AgentContractId } from "./agent-contracts";
import type { BlueprintSection } from "./types";

export type DecisionMetadata = {
  agent: string;
  reason: string;
  confidence: number;
  knowledgeSources: string[];
  dependencies: string[];
  timestamp: number;
  version: number;
};

export type StructuredReason = {
  summary: string;
  commercialGoal?: string;
  audienceFit?: string;
  visualEffect?: string;
  knowledgeSources: string[];
  tags: string[];
};

export type ExplainableDecision = {
  decision: unknown;
  reason: string;
  structuredReason: StructuredReason;
  confidence: number;
  dependencies: string[];
  alternatives: string[];
  metadata: DecisionMetadata;
};

export type ExplainabilityDecisionGraphNode = {
  section: BlueprintSection;
  owner: AgentContractId | null;
  decision: unknown;
  reason: string;
  confidence: number;
  dependencies: BlueprintSection[];
  version: number;
};

export type ExplainabilityDecisionGraphEdge = {
  from: BlueprintSection;
  to: BlueprintSection;
  reason: string;
};

export type ExplainabilityDecisionGraph = {
  nodes: ExplainabilityDecisionGraphNode[];
  edges: ExplainabilityDecisionGraphEdge[];
  topologicalOrder: BlueprintSection[];
};

export type ConfidenceChainEntry = {
  section: BlueprintSection;
  confidence: number;
  propagatedConfidence: number;
  weakestUpstream?: BlueprintSection;
};

export type ConfidenceChainResult = {
  entries: ConfidenceChainEntry[];
  overallConfidence: number;
  weakestLink: BlueprintSection | null;
};

export type TraceabilityChain = {
  element: string;
  section: BlueprintSection;
  owner: AgentContractId | null;
  upstream: Array<{ section: BlueprintSection; decision: string; reason: string }>;
};

export type HumanReadableEntry = {
  label: string;
  value: string;
  reason?: string;
};

export type HumanReadableReport = {
  title: string;
  entries: HumanReadableEntry[];
  pipeline: string[];
};

export type RetryExplainabilityChange = {
  section: BlueprintSection;
  owner: AgentContractId | null;
  decisionBefore: unknown;
  decisionAfter: unknown;
  reason: string;
  initiatedBy: string;
  expectedEffect: string;
};

export type DebugTrace = {
  mode: "debug" | "production";
  decisions: ExplainableDecision[];
  graph: ExplainabilityDecisionGraph;
  confidenceChain: ConfidenceChainResult;
  mutations: Array<{
    section: BlueprintSection;
    agentId: string;
    action: string;
    timestamp: number;
  }>;
  retries: RetryExplainabilityChange[];
  blueprintRecoverable: boolean;
};

export type ExplainabilityViolation = {
  code: ExplainabilityFailureCode;
  message: string;
  section?: BlueprintSection;
  agentId?: string;
};

export type ExplainabilityArchitectureContext = {
  mode?: "debug" | "production";
  agentConfidences?: Record<string, number>;
  retryChanges?: RetryExplainabilityChange[];
  previousBlueprint?: import("./types").RenderBlueprint;
};

export type ExplainabilityArchitectureReport = {
  explainable: boolean;
  violations: ExplainabilityViolation[];
  ownership: Record<BlueprintSection, AgentContractId | null>;
  graph: ExplainabilityDecisionGraph;
  confidenceChain: ConfidenceChainResult;
  humanReport: HumanReadableReport;
  debugTrace?: DebugTrace;
  goldenRuleSatisfied: boolean;
};

export type ExplainabilityFailureCode =
  | "UNEXPLAINABLE_DECISION"
  | "MISSING_OWNER"
  | "MISSING_REASON"
  | "MISSING_DEPENDENCIES"
  | "MISSING_CONFIDENCE"
  | "RETRY_WITHOUT_EXPLANATION"
  | "BLUEPRINT_NOT_RECOVERABLE"
  | "DECISION_WITHOUT_EFFECT";
