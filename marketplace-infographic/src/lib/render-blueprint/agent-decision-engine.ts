/**
 * Chapter 4.8 — Agent Decision Model engine.
 * Eight-stage pipeline: Observe → Interpret → Reason → Compare → Evaluate → Decide → Explain → Publish
 */
import type { AgentContractId } from "./agent-contracts";
import { explainContextUsage } from "./agent-context-engine";
import type { AgentContextPackage } from "./agent-context-types";
import { explainMemoryUsage } from "./agent-memory-engine";
import type { AgentMemoryPackage } from "./agent-memory-types";
import type { BlueprintMutation } from "./mutation-types";
import { validateSerializable } from "./serialization";
import { normalizeConfidence } from "./universal-agent-contract";
import {
  DECISION_STAGE_ORDER,
  DecisionConstraintKind,
  DecisionQualityCriterion,
  DecisionStage,
  type AgentDecisionTrace,
  type DecisionAlternative,
  type DecisionEvaluation,
  type DecisionPipelineState,
  type DecisionQualityCriterionId,
  type DecisionQualityReport,
  type DecisionStageId,
  type DecisionStageRecord,
  type DecisionValidationReport,
  type DecisionViolation,
  type SerializedDecisionReplay,
} from "./agent-decision-types";

export {
  DecisionStage,
  DecisionQualityCriterion,
  DecisionConstraintKind,
  DECISION_STAGE_ORDER,
  type DecisionStageId,
  type DecisionQualityCriterionId,
  type DecisionConstraintKindId,
  type DecisionAlternative,
  type DecisionEvaluation,
  type AgentDecisionTrace,
  type DecisionStageRecord,
  type DecisionPipelineState,
  type DecisionViolation,
  type DecisionViolationCode,
  type DecisionValidationReport,
  type DecisionQualityReport,
  type SerializedDecisionReplay,
} from "./agent-decision-types";

export const AGENT_DECISION_VERSION = "4.8.0";

export const AGENT_DECISION_GOLDEN_RULE =
  "An intelligent agent decides a professional design outcome — not a prompt. " +
  "If an agent thinks in prompts instead of design decisions, the Agent Ecosystem architecture is violated.";

const DECISION_REPLAY_VERSION = "4.8.0";

const PROMPT_THINKING_PATTERN =
  /\b(prompt|negative prompt|compiled prompt|system prompt)\b/i;

const PROVIDER_PATTERN = /\b(flux|gpt-?image|sdxl|pollinations|imagen|dall-?e)\b/i;

const DEFAULT_CONSTRAINTS: import("./agent-decision-types").DecisionConstraintKindId[] = [
  DecisionConstraintKind.DESIGN_LAWS,
  DecisionConstraintKind.MARKETPLACE_RULES,
  DecisionConstraintKind.PRODUCT_FIDELITY,
  DecisionConstraintKind.BLUEPRINT_CONSISTENCY,
];

const QUALITY_WEIGHTS: Record<DecisionQualityCriterionId, number> = {
  [DecisionQualityCriterion.CORRECTNESS]: 0.2,
  [DecisionQualityCriterion.CONSISTENCY]: 0.15,
  [DecisionQualityCriterion.COMMERCIAL_VALUE]: 0.2,
  [DecisionQualityCriterion.VISUAL_QUALITY]: 0.2,
  [DecisionQualityCriterion.EXPLAINABILITY]: 0.15,
  [DecisionQualityCriterion.CONFIDENCE]: 0.1,
};

const QUALITY_MINIMUM = 0.55;

function violation(
  code: import("./agent-decision-types").DecisionViolationCode,
  message: string,
  stage?: DecisionStageId,
): DecisionViolation {
  return { code, message, stage };
}

function assertStageOrder(stages: DecisionStageRecord[], next: DecisionStageId): void {
  const completed = stages.map((s) => s.stage);
  const expected = DECISION_STAGE_ORDER[completed.length];
  if (expected !== next) {
    throw new Error(
      `Decision stage out of order: expected ${expected}, got ${next} (completed: ${completed.join(", ")})`,
    );
  }
}

function weightedScore(scores: Partial<Record<DecisionQualityCriterionId, number>>): number {
  let total = 0;
  let weight = 0;
  for (const [criterion, w] of Object.entries(QUALITY_WEIGHTS) as [DecisionQualityCriterionId, number][]) {
    const score = scores[criterion];
    if (score !== undefined) {
      total += score * w;
      weight += w;
    }
  }
  return weight > 0 ? total / weight : 0;
}

/** Session tracking mandatory eight-stage decision pipeline */
export class AgentDecisionSession {
  readonly state: DecisionPipelineState;

  constructor(agentId: AgentContractId) {
    this.state = {
      agentId,
      startedAt: Date.now(),
      stages: [],
      inputs: [],
      interpretation: [],
      reasoning: [],
      alternatives: [],
      evaluations: [],
      explanation: [],
      constraints: [...DEFAULT_CONSTRAINTS],
      mutations: [],
      confidence: 0,
      completed: false,
    };
  }

  private record(stage: DecisionStageId, summary: string, data?: Record<string, unknown>): void {
    assertStageOrder(this.state.stages, stage);
    this.state.stages.push({ stage, at: Date.now(), summary, data });
  }

  /** Stage 1 — Observe: collect facts only, no conclusions */
  observe(inputs: string[]): this {
    this.record(DecisionStage.OBSERVE, `Observed ${inputs.length} input facts`, { count: inputs.length });
    this.state.inputs = [...inputs];
    return this;
  }

  observeFromContext(context: AgentContextPackage, memory?: AgentMemoryPackage): this {
    const explain = explainContextUsage(this.state.agentId, context);
    const inputs = explain.entries.filter((e) => e.used && e.available).map((e) => e.label);
    if (memory) {
      const mem = explainMemoryUsage(this.state.agentId);
      inputs.push(...mem.entries.filter((e) => e.used).map((e) => e.label));
    }
    return this.observe(inputs);
  }

  /** Stage 2 — Interpret: translate facts into professional context */
  interpret(lines: string[]): this {
    this.record(DecisionStage.INTERPRET, `Interpreted ${lines.length} context lines`);
    this.state.interpretation = [...lines];
    return this;
  }

  /** Stage 3 — Reason: professional reasoning questions and answers */
  reason(lines: string[]): this {
    this.record(DecisionStage.REASON, `Recorded ${lines.length} reasoning steps`);
    this.state.reasoning = [...lines];
    return this;
  }

  /** Stage 4 — Compare: register alternatives — never accept first idea */
  compare(alternatives: DecisionAlternative[]): this {
    if (alternatives.length < 2) {
      throw new Error("Decision Model requires at least two alternatives when comparison applies");
    }
    this.record(DecisionStage.COMPARE, `Compared ${alternatives.length} alternatives`);
    this.state.alternatives = alternatives.map((a) => ({ ...a }));
    return this;
  }

  /** Stage 5 — Evaluate: score each alternative */
  evaluate(evaluations: DecisionEvaluation[]): this {
    this.record(DecisionStage.EVALUATE, `Evaluated ${evaluations.length} alternatives`);
    this.state.evaluations = [...evaluations];
    for (const alt of this.state.alternatives) {
      const ev = evaluations.find((e) => e.alternativeId === alt.id);
      if (ev) alt.scores = { ...ev.scores };
    }
    return this;
  }

  /** Stage 6 — Decide: single selected alternative */
  decide(alternativeId: string, confidence: number): this {
    const alt = this.state.alternatives.find((a) => a.id === alternativeId);
    if (!alt) throw new Error(`Unknown alternative: ${alternativeId}`);
    this.record(DecisionStage.DECIDE, `Selected ${alt.label}`, { alternativeId });
    this.state.selectedAlternativeId = alternativeId;
    this.state.confidence = normalizeConfidence(confidence);
    for (const other of this.state.alternatives) {
      if (other.id !== alternativeId) {
        other.rejected = true;
        other.rejectionReason = other.rejectionReason ?? "Lower evaluation score";
      }
    }
    return this;
  }

  /** Stage 7 — Explain: mandatory explainability */
  explain(lines: string[]): this {
    this.record(DecisionStage.EXPLAIN, `Explained decision in ${lines.length} statements`);
    this.state.explanation = [...lines];
    return this;
  }

  /** Stage 8 — Publish: mutations only — never direct blueprint mutation */
  publish(mutations: BlueprintMutation[]): this {
    this.record(DecisionStage.PUBLISH, `Published ${mutations.length} mutations`);
    this.state.mutations = [...mutations];
    this.state.completed = true;
    return this;
  }

  buildTrace(): AgentDecisionTrace {
    const selected = this.state.alternatives.find((a) => a.id === this.state.selectedAlternativeId);
    const selectedLabel = selected?.label ?? this.state.selectedAlternativeId ?? "";
    const rejected = this.state.alternatives
      .filter((a) => a.rejected)
      .map((a) => `${a.label}: ${a.rejectionReason ?? "rejected"}`);

    const qualityScores: Partial<Record<DecisionQualityCriterionId, number>> = {};
    const selectedEval = this.state.evaluations.find(
      (e) => e.alternativeId === this.state.selectedAlternativeId,
    );
    if (selectedEval) Object.assign(qualityScores, selectedEval.scores);

    return {
      agentId: this.state.agentId,
      timestamp: Date.now(),
      inputs: [...this.state.inputs],
      alternatives: this.state.alternatives.map((a) => a.label),
      selectedDecision: selectedLabel,
      reasoning: [...this.state.reasoning, ...this.state.explanation].join("; "),
      confidence: this.state.confidence,
      stagesCompleted: this.state.stages.map((s) => s.stage),
      constraintsConsidered: [...this.state.constraints],
      rejectedAlternatives: rejected,
      qualityScores,
    };
  }

  toDecisionTraceStrings(): string[] {
    const trace = this.buildTrace();
    return [
      `observe: ${trace.inputs.join(", ")}`,
      `interpret: ${this.state.interpretation.join(" → ")}`,
      `reason: ${this.state.reasoning.join("; ")}`,
      `compare: ${trace.alternatives.join(" vs ")}`,
      `decide: ${trace.selectedDecision}`,
      `explain: ${this.state.explanation.join("; ")}`,
    ].filter((line) => !line.endsWith(": ") && !line.endsWith(": ;"));
  }
}

export function evaluateDecisionQuality(
  scores: Partial<Record<DecisionQualityCriterionId, number>>,
  minimum = QUALITY_MINIMUM,
): DecisionQualityReport {
  const full = {} as Record<DecisionQualityCriterionId, number>;
  const failing: DecisionQualityCriterionId[] = [];

  for (const criterion of Object.values(DecisionQualityCriterion) as DecisionQualityCriterionId[]) {
    const value = scores[criterion] ?? 0;
    full[criterion] = value;
    if (value < minimum) failing.push(criterion);
  }

  const weighted = weightedScore(scores);
  return {
    complete: failing.length === 0 && weighted >= minimum,
    scores: full,
    minimumScore: minimum,
    failingCriteria: failing,
  };
}

export function detectPromptThinkingViolation(text: string): DecisionViolation | null {
  if (PROVIDER_PATTERN.test(text)) {
    return violation(
      "PROVIDER_REFERENCE",
      "Decision references render provider — agents must be provider-independent",
    );
  }
  if (PROMPT_THINKING_PATTERN.test(text)) {
    return violation(
      "PROMPT_THINKING",
      "Decision references prompt engineering instead of design outcome",
    );
  }
  return null;
}

export function validateAgentDecision(state: DecisionPipelineState): DecisionValidationReport {
  const violations: DecisionViolation[] = [];
  const agentId = state.agentId;

  for (let i = 0; i < DECISION_STAGE_ORDER.length; i++) {
    const expected = DECISION_STAGE_ORDER[i];
    const actual = state.stages[i]?.stage;
    if (!actual) {
      violations.push(
        violation("STAGE_SKIPPED", `Missing decision stage: ${expected}`, expected),
      );
      break;
    }
    if (actual !== expected) {
      violations.push(
        violation("STAGE_OUT_OF_ORDER", `Expected ${expected}, got ${actual}`, actual),
      );
      break;
    }
  }

  if (state.alternatives.length > 0 && state.alternatives.length < 2) {
    violations.push(
      violation(
        "INSUFFICIENT_ALTERNATIVES",
        "At least two alternatives required when comparison stage applies",
        DecisionStage.COMPARE,
      ),
    );
  }

  if (!state.selectedAlternativeId && state.alternatives.length > 0) {
    violations.push(
      violation("MISSING_SELECTED_DECISION", "No alternative selected", DecisionStage.DECIDE),
    );
  }

  const active = state.alternatives.filter((a) => !a.rejected);
  if (active.length > 1) {
    violations.push(
      violation(
        "MULTIPLE_ACTIVE_DECISIONS",
        "Only one decision may be active",
        DecisionStage.DECIDE,
      ),
    );
  }

  if (!state.explanation.length) {
    violations.push(
      violation("MISSING_EXPLANATION", "Decision explanation is required", DecisionStage.EXPLAIN),
    );
  }

  if (state.confidence < 0 || state.confidence > 1) {
    violations.push(violation("INVALID_CONFIDENCE", `Confidence must be 0.0..1.0, got ${state.confidence}`));
  }

  if (!state.constraints.length) {
    violations.push(violation("MISSING_CONSTRAINTS", "Decision must consider constraints"));
  }

  const allText = [
    ...state.reasoning,
    ...state.explanation,
    ...state.interpretation,
    state.selectedAlternativeId ?? "",
  ].join(" ");

  const promptViolation = detectPromptThinkingViolation(allText);
  if (promptViolation) violations.push(promptViolation);

  const selectedEval = state.evaluations.find((e) => e.alternativeId === state.selectedAlternativeId);
  if (selectedEval) {
    const quality = evaluateDecisionQuality(selectedEval.scores);
    if (!quality.complete) {
      violations.push(
        violation(
          "QUALITY_THRESHOLD",
          `Decision quality below threshold: ${quality.failingCriteria.join(", ")}`,
          DecisionStage.EVALUATE,
        ),
      );
    }
  }

  const trace = state.completed ? buildTraceFromState(state) : undefined;

  return { valid: violations.length === 0, agentId, violations, trace };
}

export function buildTraceFromState(state: DecisionPipelineState): AgentDecisionTrace {
  const selected = state.alternatives.find((a) => a.id === state.selectedAlternativeId);
  const selectedLabel = selected?.label ?? state.selectedAlternativeId ?? "";
  const rejected = state.alternatives
    .filter((a) => a.rejected)
    .map((a) => `${a.label}: ${a.rejectionReason ?? "rejected"}`);

  const qualityScores: Partial<Record<DecisionQualityCriterionId, number>> = {};
  const selectedEval = state.evaluations.find((e) => e.alternativeId === state.selectedAlternativeId);
  if (selectedEval) Object.assign(qualityScores, selectedEval.scores);

  return {
    agentId: state.agentId,
    timestamp: Date.now(),
    inputs: [...state.inputs],
    alternatives: state.alternatives.map((a) => a.label),
    selectedDecision: selectedLabel,
    reasoning: [...state.reasoning, ...state.explanation].join("; "),
    confidence: state.confidence,
    stagesCompleted: state.stages.map((s) => s.stage),
    constraintsConsidered: [...state.constraints],
    rejectedAlternatives: rejected,
    qualityScores,
  };
}

/** Rebuild trace from completed session without re-running validations */
export function traceFromSession(session: AgentDecisionSession): AgentDecisionTrace {
  return session.buildTrace();
}

export function serializeDecisionReplay(session: AgentDecisionSession): string {
  const payload: SerializedDecisionReplay = {
    version: DECISION_REPLAY_VERSION,
    trace: session.buildTrace(),
    pipeline: structuredClone(session.state),
  };
  const validation = validateSerializable(payload);
  if (!validation.ok) {
    throw new Error(
      `Decision replay not serializable: ${validation.issues.map((i) => i.message).join("; ")}`,
    );
  }
  return JSON.stringify(payload);
}

export function deserializeDecisionReplay(json: string): SerializedDecisionReplay {
  const parsed = JSON.parse(json) as SerializedDecisionReplay;
  if (!parsed.version || !parsed.trace) {
    throw new Error("Invalid decision replay payload");
  }
  return parsed;
}

export function defaultAlternativesForAgent(agentId: AgentContractId): DecisionAlternative[] {
  switch (agentId) {
    case "scene-director":
      return [
        { id: "studio", label: "Studio", summary: "Clean controlled environment", scores: {} },
        { id: "lifestyle", label: "Lifestyle", summary: "Contextual interior scene", scores: {} },
        { id: "outdoor", label: "Outdoor", summary: "Natural daylight context", scores: {} },
      ];
    case "composition-director":
      return [
        { id: "minimal", label: "Minimal", summary: "Large negative space", scores: {} },
        { id: "luxury", label: "Luxury", summary: "Premium centered hero", scores: {} },
        { id: "lifestyle", label: "Lifestyle", summary: "Dynamic offset framing", scores: {} },
      ];
    default:
      return [
        { id: "option-a", label: "Option A", summary: "Primary approach", scores: {} },
        { id: "option-b", label: "Option B", summary: "Alternative approach", scores: {} },
      ];
  }
}

export function scoreAlternative(
  notes: string[],
  baseConfidence: number,
): Record<DecisionQualityCriterionId, number> {
  const c = normalizeConfidence(baseConfidence);
  return {
    [DecisionQualityCriterion.CORRECTNESS]: c,
    [DecisionQualityCriterion.CONSISTENCY]: Math.min(1, c + 0.05),
    [DecisionQualityCriterion.COMMERCIAL_VALUE]: c,
    [DecisionQualityCriterion.VISUAL_QUALITY]: c,
    [DecisionQualityCriterion.EXPLAINABILITY]: notes.length > 0 ? 0.85 : 0.5,
    [DecisionQualityCriterion.CONFIDENCE]: c,
  };
}

export function pickBestAlternative(
  alternatives: DecisionAlternative[],
  evaluations: DecisionEvaluation[],
): string {
  let best = alternatives[0]?.id ?? "";
  let bestScore = -1;
  for (const ev of evaluations) {
    const score = ev.weightedTotal ?? weightedScore(ev.scores);
    if (score > bestScore) {
      bestScore = score;
      best = ev.alternativeId;
    }
  }
  return best;
}
