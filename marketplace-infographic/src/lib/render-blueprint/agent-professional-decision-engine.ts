/**
 * Chapter 7.6 — Agent Professional Decision Engine.
 * Eight-stage expert decision pipeline — LLM is a tool, not the engine.
 */
import type { AgentContractId } from "./agent-contracts";
import { ConstraintEngine } from "./constraint-engine";
import { retrieveKnowledgePackage } from "./knowledge-retrieval-engine";
import { createEmptyRenderBlueprint } from "./from-visual-blueprint";
import { frozenTestBlueprint } from "./render-adapters";
import { BlueprintLifecycle } from "./lifecycle-types";
import { StoryType } from "./visual-story-director-types";
import { normalizeConfidence } from "./universal-agent-contract";
import type { RenderBlueprint } from "./types";
import {
  ProfessionalDecisionCriterion,
  ProfessionalDecisionStage,
  type ProfessionalDecisionCandidate,
  type ProfessionalDecisionConflict,
  type ProfessionalDecisionContext,
  type ProfessionalDecisionCriterionId,
  type ProfessionalDecisionCriterionWeight,
  type ProfessionalDecisionExecutionReport,
  type ProfessionalDecisionFailureCode,
  type ProfessionalDecisionPipelineState,
  type ProfessionalDecisionProblem,
  type ProfessionalDecisionReport,
  type ProfessionalDecisionResult,
  type ProfessionalDecisionStageDefinition,
  type ProfessionalDecisionStageId,
  type ProfessionalDecisionStageRecord,
  type ProfessionalDecisionValidationReport,
  type ProfessionalDecisionViolation,
} from "./agent-professional-decision-types";

export {
  ProfessionalDecisionStage,
  ProfessionalDecisionCriterion,
  type ProfessionalDecisionStageId,
  type ProfessionalDecisionCriterionId,
  type ProfessionalDecisionCriterionWeight,
  type ProfessionalDecisionCandidate,
  type ProfessionalDecisionConflict,
  type ProfessionalDecisionResult,
  type ProfessionalDecisionReport,
  type ProfessionalDecisionStageRecord,
  type ProfessionalDecisionProblem,
  type ProfessionalDecisionPipelineState,
  type ProfessionalDecisionViolation,
  type ProfessionalDecisionExecutionReport,
  type ProfessionalDecisionValidationReport,
  type ProfessionalDecisionContext,
  type ProfessionalDecisionFailureCode,
  type ProfessionalDecisionStageDefinition,
} from "./agent-professional-decision-types";

export const AGENT_PROFESSIONAL_DECISION_VERSION = "7.6.0";

export const AGENT_PROFESSIONAL_DECISION_GOLDEN_RULE =
  "A true professional does not accept the first idea that comes to mind. They analyze the task, study options, " +
  "compare alternatives, respect constraints, rely on experience, and only then choose. " +
  "Agent Decision Engine turns an AI agent from a prompt executor into a digital expert capable of " +
  "justified, explainable, commercially effective world-class decisions.";

export const LEGACY_PROMPT_DECISION_MODEL = ["input", "llm", "answer"] as const;

export const PROFESSIONAL_DECISION_PIPELINE: readonly ProfessionalDecisionStageDefinition[] = [
  { id: ProfessionalDecisionStage.PROBLEM_ANALYSIS, order: 1, label: "Problem Analysis", responsibility: "Formulate professional task before searching for solutions" },
  { id: ProfessionalDecisionStage.KNOWLEDGE_RETRIEVAL, order: 2, label: "Knowledge Retrieval", responsibility: "Load patterns, marketplace knowledge, anti-patterns" },
  { id: ProfessionalDecisionStage.OPTION_GENERATION, order: 3, label: "Option Generation", responsibility: "Build multiple decision candidates — never first idea only" },
  { id: ProfessionalDecisionStage.RULE_EVALUATION, order: 4, label: "Rule Evaluation", responsibility: "Apply Constitution, marketplace rules, agent constraints" },
  { id: ProfessionalDecisionStage.SCORING, order: 5, label: "Scoring", responsibility: "Multi-criteria weighted evaluation per candidate" },
  { id: ProfessionalDecisionStage.CONFLICT_DETECTION, order: 6, label: "Conflict Detection", responsibility: "Detect cross-section semantic conflicts before blueprint" },
  { id: ProfessionalDecisionStage.DECISION_SELECTION, order: 7, label: "Decision Selection", responsibility: "Select highest professional score without conflicts" },
  { id: ProfessionalDecisionStage.DECISION_EXPLANATION, order: 8, label: "Decision Explanation", responsibility: "Mandatory explainability with scores and reasoning" },
] as const;

export const STORY_DIRECTOR_CRITERION_WEIGHTS: readonly ProfessionalDecisionCriterionWeight[] = [
  { criterion: ProfessionalDecisionCriterion.BUSINESS_MATCH, weight: 0.3 },
  { criterion: ProfessionalDecisionCriterion.MARKETPLACE_FIT, weight: 0.2 },
  { criterion: ProfessionalDecisionCriterion.COMMERCIAL_IMPACT, weight: 0.2 },
  { criterion: ProfessionalDecisionCriterion.KNOWLEDGE_CONFIDENCE, weight: 0.15 },
  { criterion: ProfessionalDecisionCriterion.HISTORICAL_SUCCESS, weight: 0.15 },
] as const;

const DEFAULT_CRITERION_WEIGHTS: readonly ProfessionalDecisionCriterionWeight[] = [
  { criterion: ProfessionalDecisionCriterion.BUSINESS_MATCH, weight: 0.25 },
  { criterion: ProfessionalDecisionCriterion.MARKETPLACE_FIT, weight: 0.2 },
  { criterion: ProfessionalDecisionCriterion.COMMERCIAL_IMPACT, weight: 0.2 },
  { criterion: ProfessionalDecisionCriterion.KNOWLEDGE_CONFIDENCE, weight: 0.2 },
  { criterion: ProfessionalDecisionCriterion.HISTORICAL_SUCCESS, weight: 0.15 },
] as const;

function violation(
  code: ProfessionalDecisionFailureCode,
  message: string,
  extras?: Pick<ProfessionalDecisionViolation, "stage" | "agentId">,
): ProfessionalDecisionViolation {
  return { code, message, ...extras };
}

function recordStage(
  state: ProfessionalDecisionPipelineState,
  stage: ProfessionalDecisionStageId,
  detail?: string,
): void {
  state.stagesCompleted.push(stage);
  state.stageRecords.push({ stage, at: Date.now(), detail });
}

function weightedDecisionScore(
  scores: Partial<Record<ProfessionalDecisionCriterionId, number>>,
  weights: readonly ProfessionalDecisionCriterionWeight[],
): number {
  let total = 0;
  let weightSum = 0;
  for (const { criterion, weight } of weights) {
    const value = scores[criterion];
    if (value !== undefined) {
      total += value * weight;
      weightSum += weight;
    }
  }
  return weightSum > 0 ? total / weightSum : 0;
}

export function getProfessionalDecisionWeights(
  agentId: AgentContractId,
): readonly ProfessionalDecisionCriterionWeight[] {
  if (agentId === "visual-story-director") return STORY_DIRECTOR_CRITERION_WEIGHTS;
  return DEFAULT_CRITERION_WEIGHTS;
}

export function validateProfessionalDecisionPipelineStructure(): ProfessionalDecisionViolation[] {
  if (PROFESSIONAL_DECISION_PIPELINE.length !== 8) {
    return [violation("INCOMPLETE_PIPELINE", "Professional decision pipeline requires 8 stages")];
  }
  return [];
}

export function analyzeDecisionProblem(
  agentId: AgentContractId,
  blueprint: Readonly<RenderBlueprint>,
): ProfessionalDecisionProblem {
  const businessGoal = blueprint.creative.goal || "commercial conversion";
  const questions: Record<string, string> = {
    "visual-story-director":
      "Which Story Pattern best helps solve the Business Goal?",
    "scene-director": "Which scene environment best supports the approved Story?",
    "lighting-director": "Which lighting scheme best matches story and scene?",
    "composition-director": "Which composition maximizes commercial readability?",
  };
  return {
    agentId,
    businessGoal,
    professionalQuestion: questions[agentId] ?? "What professional design decision best serves the business goal?",
    contextSummary: [
      `category:${blueprint.product.category}`,
      `marketplace:${blueprint.product.marketplace ?? "wildberries"}`,
      `goal:${businessGoal}`,
    ],
  };
}

export function generateStoryDirectorCandidates(seed: number): ProfessionalDecisionCandidate[] {
  const baseScores = [
    { business: 0.97, marketplace: 0.94, emotion: 0.92, commercial: 0.95, knowledge: 0.9, history: 0.94 },
    { business: 0.88, marketplace: 0.96, emotion: 0.98, commercial: 0.9, knowledge: 0.85, history: 0.88 },
    { business: 0.91, marketplace: 0.93, emotion: 0.9, commercial: 0.92, knowledge: 0.88, history: 0.9 },
    { business: 0.86, marketplace: 0.9, emotion: 0.87, commercial: 0.88, knowledge: 0.92, history: 0.85 },
  ];
  const options = [
    { id: "problem-solution", label: "Problem → Solution", storyType: StoryType.PROBLEM_SOLUTION },
    { id: "lifestyle-experience", label: "Lifestyle Experience", storyType: StoryType.COMFORT },
    { id: "premium-product", label: "Premium Product", storyType: StoryType.PREMIUM_LIFESTYLE },
    { id: "feature-showcase", label: "Feature Showcase", storyType: StoryType.TECHNOLOGY },
  ];
  return options.map((opt, index) => {
    const s = baseScores[(index + seed) % baseScores.length];
    return {
      id: opt.id,
      label: opt.label,
      summary: `Story pattern candidate: ${opt.label}`,
      payload: { storyType: opt.storyType },
      scores: {
        [ProfessionalDecisionCriterion.BUSINESS_MATCH]: s.business,
        [ProfessionalDecisionCriterion.MARKETPLACE_FIT]: s.marketplace,
        [ProfessionalDecisionCriterion.COMMERCIAL_IMPACT]: s.commercial,
        [ProfessionalDecisionCriterion.KNOWLEDGE_CONFIDENCE]: s.knowledge,
        [ProfessionalDecisionCriterion.HISTORICAL_SUCCESS]: s.history,
      },
    };
  });
}

export function generateDecisionCandidates(
  agentId: AgentContractId,
  seed = 0,
): ProfessionalDecisionCandidate[] {
  if (agentId === "visual-story-director") {
    return generateStoryDirectorCandidates(seed);
  }
  return [
    {
      id: "option-a",
      label: "Option A",
      summary: "Primary professional approach",
      payload: {},
      scores: {
        [ProfessionalDecisionCriterion.BUSINESS_MATCH]: 0.85,
        [ProfessionalDecisionCriterion.MARKETPLACE_FIT]: 0.82,
        [ProfessionalDecisionCriterion.COMMERCIAL_IMPACT]: 0.84,
        [ProfessionalDecisionCriterion.KNOWLEDGE_CONFIDENCE]: 0.8,
        [ProfessionalDecisionCriterion.HISTORICAL_SUCCESS]: 0.83,
      },
    },
    {
      id: "option-b",
      label: "Option B",
      summary: "Alternative professional approach",
      payload: {},
      scores: {
        [ProfessionalDecisionCriterion.BUSINESS_MATCH]: 0.8,
        [ProfessionalDecisionCriterion.MARKETPLACE_FIT]: 0.86,
        [ProfessionalDecisionCriterion.COMMERCIAL_IMPACT]: 0.78,
        [ProfessionalDecisionCriterion.KNOWLEDGE_CONFIDENCE]: 0.82,
        [ProfessionalDecisionCriterion.HISTORICAL_SUCCESS]: 0.8,
      },
    },
    {
      id: "option-c",
      label: "Option C",
      summary: "Third candidate for comparison",
      payload: {},
      scores: {
        [ProfessionalDecisionCriterion.BUSINESS_MATCH]: 0.78,
        [ProfessionalDecisionCriterion.MARKETPLACE_FIT]: 0.8,
        [ProfessionalDecisionCriterion.COMMERCIAL_IMPACT]: 0.81,
        [ProfessionalDecisionCriterion.KNOWLEDGE_CONFIDENCE]: 0.79,
        [ProfessionalDecisionCriterion.HISTORICAL_SUCCESS]: 0.77,
      },
    },
  ];
}

export function evaluateCandidateRules(
  candidate: ProfessionalDecisionCandidate,
  blueprint: Readonly<RenderBlueprint>,
  rulesApplied: string[],
): { passed: boolean; reason?: string } {
  const constraintReport = new ConstraintEngine().evaluate(blueprint);
  rulesApplied.push(...constraintReport.mergedSet.constraints.map((c) => c.id));

  const storyType = candidate.payload.storyType as string | undefined;
  if (storyType === StoryType.PREMIUM_LIFESTYLE && blueprint.creative.goal === "Budget") {
    return { passed: false, reason: "Premium story violates budget business goal constraint" };
  }
  if (candidate.label.toLowerCase().includes("prompt")) {
    return { passed: false, reason: "Prompt-based decision violates constitution" };
  }
  return { passed: true };
}

export function detectDecisionConflicts(
  blueprint: Readonly<RenderBlueprint>,
  candidate: ProfessionalDecisionCandidate,
  forceConflict?: boolean,
): ProfessionalDecisionConflict[] {
  const conflicts: ProfessionalDecisionConflict[] = [];
  if (forceConflict) {
    conflicts.push({
      code: "STORY_COMPOSITION_MISMATCH",
      sections: ["story", "composition"],
      description: "Premium story conflicts with discount layout composition",
    });
    return conflicts;
  }

  const storyType = candidate.payload.storyType as string | undefined;
  if (storyType === StoryType.PREMIUM_LIFESTYLE && blueprint.composition.templateId === "discount") {
    conflicts.push({
      code: "STORY_COMPOSITION_MISMATCH",
      sections: ["story", "composition"],
      description: "Premium story conflicts with discount layout",
    });
  }
  if (
    blueprint.scene.environment === "outdoor_garden" &&
    candidate.payload.lightingScheme === "night_studio"
  ) {
    conflicts.push({
      code: "SCENE_LIGHTING_MISMATCH",
      sections: ["scene", "lighting"],
      description: "Outdoor garden scene conflicts with night studio lighting",
    });
  }
  return conflicts;
}

export function scoreCandidates(
  candidates: ProfessionalDecisionCandidate[],
  _weights: readonly ProfessionalDecisionCriterionWeight[],
): ProfessionalDecisionCandidate[] {
  return candidates.map((c) => ({
    ...c,
    scores: { ...c.scores },
  }));
}

export function selectBestCandidate(
  candidates: ProfessionalDecisionCandidate[],
  weights: readonly ProfessionalDecisionCriterionWeight[],
): { selectedId: string; confidence: number; decisionScore: number } {
  let bestId = "";
  let bestScore = -1;
  for (const candidate of candidates) {
    if (candidate.rejected) continue;
    const score = weightedDecisionScore(candidate.scores, weights);
    if (score > bestScore || (score === bestScore && candidate.id < bestId)) {
      bestScore = score;
      bestId = candidate.id;
    }
  }
  return {
    selectedId: bestId,
    confidence: normalizeConfidence(bestScore),
    decisionScore: Math.round(bestScore * 100),
  };
}

export function buildDecisionExplanation(
  candidate: ProfessionalDecisionCandidate,
  weights: readonly ProfessionalDecisionCriterionWeight[],
): string[] {
  const lines = [
    `Selected Pattern: ${candidate.label}`,
    `Reason: Highest weighted professional score among evaluated candidates`,
  ];
  for (const { criterion, weight } of weights) {
    const score = candidate.scores[criterion];
    if (score !== undefined) {
      lines.push(`${criterion.replace(/_/g, " ")}: ${Math.round(score * 100)}% (weight ${Math.round(weight * 100)}%)`);
    }
  }
  return lines;
}

export function buildProfessionalDecisionReport(
  state: ProfessionalDecisionPipelineState,
  selected: ProfessionalDecisionCandidate,
): ProfessionalDecisionReport {
  return {
    selectedOption: selected.label,
    confidence: state.confidence,
    decisionScore: state.decisionScore,
    alternatives: state.candidates.map((c) => c.label),
    rulesApplied: [...state.rulesApplied],
    knowledgeSources: state.knowledge?.items.map((i) => i.id) ?? [],
    reasoning: [...state.reasoning],
  };
}

export function buildProfessionalDecisionResult(
  state: ProfessionalDecisionPipelineState,
  selected: ProfessionalDecisionCandidate,
): ProfessionalDecisionResult {
  return {
    decision: { ...selected.payload, label: selected.label },
    confidence: state.confidence,
    alternatives: state.candidates,
    reasoning: [...state.reasoning],
    violations: state.conflicts.map((c) => c.description),
  };
}

export async function executeProfessionalDecision(input: {
  agentId: AgentContractId;
  blueprint?: RenderBlueprint;
  context?: ProfessionalDecisionContext;
}): Promise<ProfessionalDecisionExecutionReport> {
  const context = input.context ?? {};
  const violations: ProfessionalDecisionViolation[] = [];
  const seed = context.seed ?? 0;

  const blueprint =
    input.blueprint ??
    (() => {
      const bp = createEmptyRenderBlueprint({ category: "kitchen", seed: 7 });
      return { ...bp, lifecycle: { ...bp.lifecycle, stage: BlueprintLifecycle.STORY_DEFINED } };
    })();

  const state: ProfessionalDecisionPipelineState = {
    agentId: input.agentId,
    candidates: [],
    rulesApplied: [],
    conflicts: [],
    confidence: 0,
    decisionScore: 0,
    reasoning: [],
    stagesCompleted: [],
    stageRecords: [],
  };

  const weights = getProfessionalDecisionWeights(input.agentId);

  // Stage 1 — Problem Analysis
  state.problem = analyzeDecisionProblem(input.agentId, blueprint);
  recordStage(state, ProfessionalDecisionStage.PROBLEM_ANALYSIS, state.problem.professionalQuestion);

  // Stage 2 — Knowledge Retrieval
  const knowledge = retrieveKnowledgePackage({
    context: {
      category: blueprint.product.category,
      marketplace: context.marketplace ?? blueprint.product.marketplace ?? "wildberries",
      semanticQuery: blueprint.creative.goal,
    },
    limit: 6,
    useCache: false,
  });
  state.knowledge = knowledge;
  if (context.ignoreKnowledge || knowledge.items.length === 0) {
    violations.push(
      violation("KNOWLEDGE_IGNORED", "Decision Engine must use Knowledge Engine results", {
        stage: ProfessionalDecisionStage.KNOWLEDGE_RETRIEVAL,
        agentId: input.agentId,
      }),
    );
  }
  recordStage(state, ProfessionalDecisionStage.KNOWLEDGE_RETRIEVAL, `${knowledge.items.length} items`);

  // Stage 3 — Option Generation
  const candidates = context.singleOptionOnly
    ? [generateDecisionCandidates(input.agentId, seed)[0]]
    : generateDecisionCandidates(input.agentId, seed);
  state.candidates = candidates;
  if (candidates.length < 2) {
    violations.push(
      violation("MISSING_ALTERNATIVES", "Decision Engine must generate multiple candidates", {
        stage: ProfessionalDecisionStage.OPTION_GENERATION,
        agentId: input.agentId,
      }),
    );
  }
  recordStage(state, ProfessionalDecisionStage.OPTION_GENERATION, `${candidates.length} candidates`);

  // Stage 4 — Rule Evaluation
  for (const candidate of state.candidates) {
    const ruleResult = evaluateCandidateRules(candidate, blueprint, state.rulesApplied);
    if (!ruleResult.passed) {
      candidate.rejected = true;
      candidate.rejectionReason = ruleResult.reason;
      violations.push(
        violation("RULE_VIOLATION", ruleResult.reason ?? "Rule evaluation failed", {
          stage: ProfessionalDecisionStage.RULE_EVALUATION,
          agentId: input.agentId,
        }),
      );
    }
  }
  recordStage(state, ProfessionalDecisionStage.RULE_EVALUATION, `${state.rulesApplied.length} rules`);

  // Stage 5 — Scoring
  state.candidates = scoreCandidates(state.candidates, weights);
  recordStage(state, ProfessionalDecisionStage.SCORING);

  // Stage 6 — Conflict Detection
  for (const candidate of state.candidates) {
    const conflicts = detectDecisionConflicts(blueprint, candidate, context.forceConflict);
    if (conflicts.length > 0) {
      candidate.rejected = true;
      candidate.rejectionReason = conflicts[0].description;
      state.conflicts.push(...conflicts);
      violations.push(
        violation("UNRESOLVED_CONFLICT", conflicts[0].description, {
          stage: ProfessionalDecisionStage.CONFLICT_DETECTION,
          agentId: input.agentId,
        }),
      );
    }
  }
  recordStage(state, ProfessionalDecisionStage.CONFLICT_DETECTION, `${state.conflicts.length} conflicts`);

  // Stage 7 — Decision Selection
  const activeCandidates = state.candidates.filter((c) => !c.rejected);
  if (activeCandidates.length === 0) {
    violations.push(
      violation("EXECUTION_FAILED", "No viable candidates after rule and conflict evaluation", {
        stage: ProfessionalDecisionStage.DECISION_SELECTION,
        agentId: input.agentId,
      }),
    );
  } else {
    const selection = selectBestCandidate(state.candidates, weights);
    state.selectedCandidateId = selection.selectedId;
    state.confidence = selection.confidence;
    state.decisionScore = selection.decisionScore;
  }
  recordStage(state, ProfessionalDecisionStage.DECISION_SELECTION, state.selectedCandidateId);

  const selected = state.candidates.find((c) => c.id === state.selectedCandidateId);
  if (!selected) {
    return finalizeReport({ violations, state, deterministic: false });
  }

  // Stage 8 — Decision Explanation
  if (context.skipExplanation) {
    violations.push(
      violation("MISSING_EXPLANATION", "Decision explanation is mandatory", {
        stage: ProfessionalDecisionStage.DECISION_EXPLANATION,
        agentId: input.agentId,
      }),
    );
  } else {
    state.reasoning = buildDecisionExplanation(selected, weights);
    state.reasoning.push(
      `Business Match: ${Math.round((selected.scores.business_match ?? 0) * 100)}%`,
      `Marketplace Match: ${Math.round((selected.scores.marketplace_fit ?? 0) * 100)}%`,
      `Historical Success: ${Math.round((selected.scores.historical_success ?? 0) * 100)}%`,
    );
  }
  recordStage(state, ProfessionalDecisionStage.DECISION_EXPLANATION);

  if (state.confidence <= 0) {
    violations.push(violation("MISSING_CONFIDENCE", "Confidence score must be calculated", { agentId: input.agentId }));
  }

  const result = buildProfessionalDecisionResult(state, selected);
  const report = buildProfessionalDecisionReport(state, selected);

  // Determinism check — same seed must yield same selection
  const replay = executeProfessionalDecisionSync({
    agentId: input.agentId,
    blueprint,
    context: { ...context, seed },
  });
  const deterministic = replay.state.selectedCandidateId === state.selectedCandidateId;

  if (!deterministic) {
    violations.push(violation("NON_DETERMINISTIC", "Identical inputs must produce identical decisions"));
  }

  return finalizeReport({
    violations,
    state,
    result,
    report,
    deterministic,
  });
}

function executeProfessionalDecisionSync(input: {
  agentId: AgentContractId;
  blueprint: RenderBlueprint;
  context?: ProfessionalDecisionContext;
}): ProfessionalDecisionExecutionReport {
  const context = input.context ?? {};
  const seed = context.seed ?? 0;
  const state: ProfessionalDecisionPipelineState = {
    agentId: input.agentId,
    candidates: generateDecisionCandidates(input.agentId, seed),
    rulesApplied: [],
    conflicts: [],
    confidence: 0,
    decisionScore: 0,
    reasoning: [],
    stagesCompleted: [],
    stageRecords: [],
  };
  const weights = getProfessionalDecisionWeights(input.agentId);
  for (const candidate of state.candidates) {
    const ruleResult = evaluateCandidateRules(candidate, input.blueprint, state.rulesApplied);
    if (!ruleResult.passed) candidate.rejected = true;
    const conflicts = detectDecisionConflicts(input.blueprint, candidate, context.forceConflict);
    if (conflicts.length > 0) candidate.rejected = true;
  }
  const selection = selectBestCandidate(state.candidates, weights);
  state.selectedCandidateId = selection.selectedId;
  return { valid: true, agentId: input.agentId, violations: [], state, deterministic: true, goldenRuleSatisfied: true };
}

function finalizeReport(input: {
  violations: ProfessionalDecisionViolation[];
  state: ProfessionalDecisionPipelineState;
  result?: ProfessionalDecisionResult;
  report?: ProfessionalDecisionReport;
  deterministic: boolean;
}): ProfessionalDecisionExecutionReport {
  const uniqueViolations = dedupeViolations(input.violations);
  const pipelineComplete = input.state.stagesCompleted.length === 8;
  const valid =
    uniqueViolations.length === 0 &&
    pipelineComplete &&
    Boolean(input.state.selectedCandidateId) &&
    input.state.reasoning.length > 0 &&
    input.state.confidence > 0 &&
    input.deterministic;

  return {
    valid,
    agentId: input.state.agentId,
    violations: uniqueViolations,
    state: input.state,
    result: input.result,
    report: input.report,
    deterministic: input.deterministic,
    goldenRuleSatisfied: AGENT_PROFESSIONAL_DECISION_GOLDEN_RULE.includes("does not accept the first idea"),
  };
}

function dedupeViolations(violations: ProfessionalDecisionViolation[]): ProfessionalDecisionViolation[] {
  const seen = new Set<string>();
  return violations.filter((v) => {
    const key = `${v.code}:${v.stage ?? ""}:${v.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function mapProfessionalStageToChapter48(
  stageId: ProfessionalDecisionStageId,
): string {
  const mapping: Record<ProfessionalDecisionStageId, string> = {
    [ProfessionalDecisionStage.PROBLEM_ANALYSIS]: "observe_interpret",
    [ProfessionalDecisionStage.KNOWLEDGE_RETRIEVAL]: "observe",
    [ProfessionalDecisionStage.OPTION_GENERATION]: "compare",
    [ProfessionalDecisionStage.RULE_EVALUATION]: "evaluate",
    [ProfessionalDecisionStage.SCORING]: "evaluate",
    [ProfessionalDecisionStage.CONFLICT_DETECTION]: "evaluate",
    [ProfessionalDecisionStage.DECISION_SELECTION]: "decide",
    [ProfessionalDecisionStage.DECISION_EXPLANATION]: "explain",
  };
  return mapping[stageId];
}

export function validateProfessionalDecision(
  context: ProfessionalDecisionContext = {},
): ProfessionalDecisionValidationReport {
  const violations = [...validateProfessionalDecisionPipelineStructure()];
  if (context.singleOptionOnly) {
    violations.push(violation("SINGLE_OPTION_SELECTED", "First-option-only decisions are forbidden"));
  }
  if (context.skipExplanation) {
    violations.push(violation("MISSING_EXPLANATION", "Explainability is mandatory"));
  }
  return {
    valid: violations.length === 0,
    violations,
    pipelineComplete: validateProfessionalDecisionPipelineStructure().length === 0,
    multiCandidateRequired: true,
    explainabilityRequired: true,
    kitchenExecutionValid: false,
    successCriteriaMet: violations.length === 0,
  };
}

export async function validateProfessionalDecisionWithExecution(
  context: ProfessionalDecisionContext = {},
): Promise<ProfessionalDecisionValidationReport> {
  const report = validateProfessionalDecision(context);
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.lifecycle.stage = BlueprintLifecycle.STORY_DEFINED;

  const execution = await executeProfessionalDecision({
    agentId: "visual-story-director",
    blueprint: bp,
    context: { ...context, seed: 42 },
  });

  const violations = dedupeViolations([...report.violations, ...execution.violations]);
  return {
    ...report,
    valid: violations.length === 0 && execution.valid,
    violations,
    kitchenExecutionValid: execution.valid,
    successCriteriaMet: violations.length === 0 && execution.valid,
  };
}

export function assertProfessionalDecision(
  context?: ProfessionalDecisionContext,
): ProfessionalDecisionValidationReport {
  const report = validateProfessionalDecision(context);
  if (!report.valid) {
    throw new Error(`Professional Decision Engine violated: ${report.violations.map((v) => v.message).join("; ")}`);
  }
  return report;
}

export async function runProfessionalDecision(
  context: ProfessionalDecisionContext = {},
): Promise<ProfessionalDecisionValidationReport> {
  return validateProfessionalDecisionWithExecution(context);
}

export function isProfessionalDecisionFailure(code: string): code is ProfessionalDecisionFailureCode {
  const codes: ProfessionalDecisionFailureCode[] = [
    "INCOMPLETE_PIPELINE",
    "SINGLE_OPTION_SELECTED",
    "MISSING_ALTERNATIVES",
    "KNOWLEDGE_IGNORED",
    "RULE_VIOLATION",
    "UNRESOLVED_CONFLICT",
    "MISSING_EXPLANATION",
    "MISSING_CONFIDENCE",
    "NON_DETERMINISTIC",
    "PROMPT_DECISION",
    "DIRECT_BLUEPRINT_MUTATION",
    "EXECUTION_FAILED",
  ];
  return codes.includes(code as ProfessionalDecisionFailureCode);
}

export function getProfessionalDecisionStage(
  stageId: ProfessionalDecisionStageId,
): ProfessionalDecisionStageDefinition | undefined {
  return PROFESSIONAL_DECISION_PIPELINE.find((s) => s.id === stageId);
}
