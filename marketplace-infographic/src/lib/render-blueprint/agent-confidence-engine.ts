/**
 * Chapter 4.9 — Agent Confidence Model engine.
 * Unified 0.0..1.0 confidence scale — decision reliability, not design quality.
 */
import type { AgentContractId } from "./agent-contracts";
import type { AgentContextPackage } from "./agent-context-types";
import { getAgentDependency, validateAgentDependencies } from "./agent-dependency-engine";
import type { DecisionEvaluation } from "./agent-decision-types";
import { normalizeConfidence } from "./universal-agent-contract";
import {
  ConfidenceLevel,
  ConfidenceLifecycleAction,
  type AgentConfidenceScore,
  type ConfidenceCalculationInput,
  type ConfidenceCalibrationProfile,
  type ConfidenceFactors,
  type ConfidenceHistoryEntry,
  type ConfidenceLevelId,
  type ConfidenceLifecycleActionId,
  type ConfidencePropagationEntry,
  type ConfidenceThresholds,
  type ConfidenceValidationReport,
} from "./agent-confidence-types";

export {
  ConfidenceLevel,
  ConfidenceLifecycleAction,
  type ConfidenceLevelId,
  type ConfidenceLifecycleActionId,
  type ConfidenceFactors,
  type ConfidenceThresholds,
  type ConfidenceCalculationInput,
  type AgentConfidenceScore,
  type ConfidencePropagationEntry,
  type ConfidenceHistoryEntry,
  type ConfidenceCalibrationProfile,
  type ConfidenceValidationReport,
} from "./agent-confidence-types";

export const AGENT_CONFIDENCE_VERSION = "4.9.0";

export const AGENT_CONFIDENCE_GOLDEN_RULE =
  "Confidence is mandatory for every intelligent decision. " +
  "An agent must report not only what it decided, but how confident it is that the decision is correct.";

export const CONFIDENCE_SCALE_MIN = 0;
export const CONFIDENCE_SCALE_MAX = 1;

export const DEFAULT_CONFIDENCE_THRESHOLDS: ConfidenceThresholds = {
  review: 0.6,
  consensus: 0.6,
  retry: 0.4,
};

const FACTOR_WEIGHTS: Record<keyof ConfidenceFactors, number> = {
  inputCompleteness: 0.25,
  knowledgeMatch: 0.2,
  constraintSatisfaction: 0.2,
  alternativeStability: 0.2,
  reasoningConsistency: 0.15,
};

const LEVEL_BANDS: { level: ConfidenceLevelId; min: number; max: number }[] = [
  { level: ConfidenceLevel.VERY_HIGH, min: 0.9, max: 1 },
  { level: ConfidenceLevel.HIGH, min: 0.75, max: 0.89 },
  { level: ConfidenceLevel.MEDIUM, min: 0.6, max: 0.74 },
  { level: ConfidenceLevel.LOW, min: 0.4, max: 0.59 },
  { level: ConfidenceLevel.CRITICAL, min: 0, max: 0.39 },
];

const CONFLICT_PENALTY = 0.08;
const MISSING_INPUT_PENALTY = 0.12;
const KNOWLEDGE_BONUS = 0.05;
const CLEAR_WINNER_BONUS = 0.04;
const INSTABILITY_PENALTY = 0.1;

const confidenceHistory: ConfidenceHistoryEntry[] = [];

function clampConfidence(value: number): number {
  return Math.min(CONFIDENCE_SCALE_MAX, Math.max(CONFIDENCE_SCALE_MIN, normalizeConfidence(value)));
}

export function validateConfidenceScore(value: number): ConfidenceValidationReport {
  const violations: string[] = [];
  if (!Number.isFinite(value)) violations.push("Confidence must be a finite number");
  if (value < CONFIDENCE_SCALE_MIN || value > CONFIDENCE_SCALE_MAX) {
    violations.push(`Confidence must be ${CONFIDENCE_SCALE_MIN}..${CONFIDENCE_SCALE_MAX}, got ${value}`);
  }
  return { valid: violations.length === 0, violations };
}

export function classifyConfidenceLevel(value: number): ConfidenceLevelId {
  const v = clampConfidence(value);
  for (const band of LEVEL_BANDS) {
    if (v >= band.min && v <= band.max + (band.max === 1 ? 0.001 : 0)) {
      return band.level;
    }
  }
  return ConfidenceLevel.CRITICAL;
}

export function resolveLifecycleAction(
  confidence: number,
  thresholds: ConfidenceThresholds = DEFAULT_CONFIDENCE_THRESHOLDS,
): ConfidenceLifecycleActionId {
  const v = clampConfidence(confidence);
  if (v < thresholds.retry) return ConfidenceLifecycleAction.RETRY;
  if (v < thresholds.consensus) return ConfidenceLifecycleAction.CONSENSUS;
  if (v < thresholds.review) return ConfidenceLifecycleAction.REVIEW;
  return ConfidenceLifecycleAction.NONE;
}

export function computeInputCompleteness(
  agentId: AgentContractId,
  context: AgentContextPackage,
): { score: number; missing: string[] } {
  const dep = getAgentDependency(agentId);
  const validation = validateAgentDependencies(agentId, context.blueprint);
  const missing = validation.missing.filter((s) => s !== "meta");
  const required = dep.consumes.filter((s) => s !== "meta");
  if (required.length === 0) return { score: 1, missing: [] };
  const present = required.length - missing.length;
  return { score: clampConfidence(present / required.length), missing };
}

export function computeAlternativeStability(
  evaluations: DecisionEvaluation[] = [],
): { score: number; instabilityPenalty: number; clearWinnerBonus: number } {
  if (evaluations.length < 2) {
    return { score: 0.7, instabilityPenalty: 0, clearWinnerBonus: 0 };
  }

  const totals = evaluations
    .map((e) => e.weightedTotal ?? weightedFromScores(e.scores))
    .sort((a, b) => b - a);
  const gap = totals[0] - totals[1];

  if (gap < 0.05) {
    return { score: 0.45, instabilityPenalty: INSTABILITY_PENALTY, clearWinnerBonus: 0 };
  }
  if (gap > 0.15) {
    return { score: 0.95, instabilityPenalty: 0, clearWinnerBonus: CLEAR_WINNER_BONUS };
  }
  return { score: 0.75, instabilityPenalty: 0, clearWinnerBonus: 0 };
}

function weightedFromScores(scores: DecisionEvaluation["scores"]): number {
  let total = 0;
  let weight = 0;
  for (const [key, value] of Object.entries(FACTOR_WEIGHTS)) {
    const score = scores[key as keyof ConfidenceFactors];
    if (score !== undefined) {
      total += score * value;
      weight += value;
    }
  }
  return weight > 0 ? total / weight : 0;
}

export function weightedFactorScore(factors: ConfidenceFactors): number {
  let total = 0;
  for (const [key, weight] of Object.entries(FACTOR_WEIGHTS) as [keyof ConfidenceFactors, number][]) {
    total += clampConfidence(factors[key]) * weight;
  }
  return clampConfidence(total);
}

export function calculateConfidence(input: ConfidenceCalculationInput): AgentConfidenceScore {
  const factors = {
    inputCompleteness: clampConfidence(input.factors.inputCompleteness),
    knowledgeMatch: clampConfidence(input.factors.knowledgeMatch),
    constraintSatisfaction: clampConfidence(input.factors.constraintSatisfaction),
    alternativeStability: clampConfidence(input.factors.alternativeStability),
    reasoningConsistency: clampConfidence(input.factors.reasoningConsistency),
  };

  let value = weightedFactorScore(factors);

  const conflictCount = input.conflictCount ?? 0;
  const conflictPenalty = Math.min(0.4, conflictCount * CONFLICT_PENALTY);
  value -= conflictPenalty;

  const missingCount = input.missingInputs?.length ?? 0;
  const missingPenalty = Math.min(0.36, missingCount * MISSING_INPUT_PENALTY);
  value -= missingPenalty;

  let instabilityPenalty = 0;
  let clearWinnerBonus = 0;
  if (input.evaluations?.length) {
    const stability = computeAlternativeStability(input.evaluations);
    factors.alternativeStability = stability.score;
    instabilityPenalty = stability.instabilityPenalty;
    clearWinnerBonus = stability.clearWinnerBonus;
    value = value - instabilityPenalty * 0.5 + clearWinnerBonus;
  }

  let knowledgeBonus = 0;
  if (input.knowledgeAligned) {
    knowledgeBonus = KNOWLEDGE_BONUS;
    value += knowledgeBonus;
  }

  value = clampConfidence(value);
  const level = classifyConfidenceLevel(value);

  return {
    agentId: input.agentId,
    value,
    level,
    factors,
    penalties: {
      conflicts: conflictPenalty,
      missingInputs: missingPenalty,
      instability: instabilityPenalty,
    },
    bonuses: {
      knowledgeAgreement: knowledgeBonus,
      clearWinner: clearWinnerBonus,
    },
    recommendedAction: resolveLifecycleAction(value),
    timestamp: Date.now(),
  };
}

export function calibrateConfidence(
  raw: number,
  profile: ConfidenceCalibrationProfile,
): number {
  const scaled = raw * profile.scale + profile.bias;
  return clampConfidence(scaled);
}

export function confidenceFromContext(input: {
  agentId: AgentContractId;
  context: AgentContextPackage;
  evaluations?: DecisionEvaluation[];
  conflictCount?: number;
  knowledgeAligned?: boolean;
  reasoningSteps?: number;
  constraintsSatisfied?: number;
  constraintsTotal?: number;
}): AgentConfidenceScore {
  const completeness = computeInputCompleteness(input.agentId, input.context);
  const constraintTotal = input.constraintsTotal ?? 1;
  const constraintSatisfied = input.constraintsSatisfied ?? constraintTotal;

  return calculateConfidence({
    agentId: input.agentId,
    factors: {
      inputCompleteness: completeness.score,
      knowledgeMatch: input.knowledgeAligned ? 0.9 : 0.65,
      constraintSatisfaction: clampConfidence(constraintSatisfied / constraintTotal),
      alternativeStability: 0.75,
      reasoningConsistency: clampConfidence(
        (input.reasoningSteps ?? 3) >= 2 ? 0.85 : 0.55,
      ),
    },
    conflictCount: input.conflictCount,
    missingInputs: completeness.missing,
    evaluations: input.evaluations,
    knowledgeAligned: input.knowledgeAligned,
  });
}

export function recordConfidenceHistory(
  score: AgentConfidenceScore,
  meta: { pipelineId?: string; revision?: number } = {},
): ConfidenceHistoryEntry {
  const entry: ConfidenceHistoryEntry = {
    agentId: score.agentId,
    confidence: score.value,
    level: score.level,
    timestamp: score.timestamp,
    pipelineId: meta.pipelineId,
    revision: meta.revision,
  };
  confidenceHistory.push(entry);
  return entry;
}

export function getConfidenceHistory(agentId?: AgentContractId): ConfidenceHistoryEntry[] {
  if (!agentId) return [...confidenceHistory];
  return confidenceHistory.filter((e) => e.agentId === agentId);
}

export function clearConfidenceHistory(): void {
  confidenceHistory.length = 0;
}

/** Pipeline stores per-agent confidence separately — no averaging */
export function buildConfidencePropagation(
  entries: ConfidencePropagationEntry[],
): ConfidencePropagationEntry[] {
  return entries.map((e) => ({
    ...e,
    level: classifyConfidenceLevel(e.confidence),
  }));
}

export function confidenceIsNotApproval(confidence: number, validationPassed: boolean): boolean {
  return confidence >= 0.9 && !validationPassed;
}

export function attachConfidenceToDecisionTrace(
  trace: { confidence: number },
  score: AgentConfidenceScore,
): { confidence: number; confidenceLevel: ConfidenceLevelId; confidenceFactors: ConfidenceFactors } {
  return {
    confidence: score.value,
    confidenceLevel: score.level,
    confidenceFactors: score.factors,
  };
}

export function defaultCalibrationProfile(agentId: AgentContractId): ConfidenceCalibrationProfile {
  return { agentId, scale: 1, bias: 0, sampleCount: 0 };
}
