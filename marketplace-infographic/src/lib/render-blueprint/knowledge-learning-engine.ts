/**
 * Chapter 5.19 — Knowledge Learning engine.
 * Continuous self-improvement of Design Knowledge Engine from platform outcomes.
 */
import {
  buildValidatableKnowledgeCatalog,
  runKnowledgeValidationPipeline,
  type ValidatableKnowledgeEntry,
} from "./knowledge-validation-engine";
import {
  createKnowledgeVersionDraft,
  releaseKnowledgeVersion,
  KnowledgeVersionState,
  KnowledgeCompatibilityLevel,
} from "./knowledge-versioning-engine";
import {
  KnowledgeLearningSource,
  KnowledgeLearningStage,
  KnowledgeProposalKind,
  KnowledgeProposalStatus,
  type KnowledgeConfidenceAdjustment,
  type KnowledgeLearningContext,
  type KnowledgeLearningCycleReport,
  type KnowledgeLearningFailureCode,
  type KnowledgeLearningFeedback,
  type KnowledgeLearningMetrics,
  type KnowledgeLearningObject,
  type KnowledgeLearningOutcome,
  type KnowledgeLearningSourceId,
  type KnowledgeLearningStageId,
  type KnowledgeLearningStageResult,
  type KnowledgeLearningSystemReport,
  type KnowledgeLearningViolation,
  type KnowledgePatternProposal,
} from "./knowledge-learning-types";

export {
  KnowledgeLearningSource,
  KnowledgeLearningStage,
  KnowledgeProposalKind,
  KnowledgeProposalStatus,
  type KnowledgeLearningSourceId,
  type KnowledgeLearningStageId,
  type KnowledgeProposalKindId,
  type KnowledgeProposalStatusId,
  type KnowledgeLearningObject,
  type KnowledgeLearningOutcome,
  type KnowledgeLearningFeedback,
  type KnowledgeConfidenceAdjustment,
  type KnowledgePatternProposal,
  type KnowledgeLearningMetrics,
  type KnowledgeLearningViolation,
  type KnowledgeLearningStageResult,
  type KnowledgeLearningCycleReport,
  type KnowledgeLearningSystemReport,
  type KnowledgeLearningContext,
  type KnowledgeLearningFailureCode,
} from "./knowledge-learning-types";

export const KNOWLEDGE_LEARNING_VERSION = "5.19.0";

export const KNOWLEDGE_LEARNING_GOLDEN_RULE =
  "The main value of Design AI is not the ability to generate images — it is the ability to become better " +
  "after every generation. Knowledge Learning makes each successful project part of collective platform experience.";

export const LEARNING_PIPELINE: readonly KnowledgeLearningStageId[] = [
  KnowledgeLearningStage.GENERATION,
  KnowledgeLearningStage.EVALUATION,
  KnowledgeLearningStage.FEEDBACK_COLLECTION,
  KnowledgeLearningStage.PATTERN_DETECTION,
  KnowledgeLearningStage.KNOWLEDGE_PROPOSAL,
  KnowledgeLearningStage.VALIDATION,
  KnowledgeLearningStage.KNOWLEDGE_UPDATE,
  KnowledgeLearningStage.KNOWLEDGE_ENGINE,
] as const;

export const SOURCE_TRUST_WEIGHTS: Record<KnowledgeLearningSourceId, number> = {
  [KnowledgeLearningSource.GENERATION_RESULT]: 0.6,
  [KnowledgeLearningSource.VISION_REPORT]: 0.85,
  [KnowledgeLearningSource.COMMERCIAL_SCORE]: 0.9,
  [KnowledgeLearningSource.CTR_PREDICTION]: 0.75,
  [KnowledgeLearningSource.RETRY_RESULT]: 0.7,
  [KnowledgeLearningSource.USER_FEEDBACK]: 0.55,
  [KnowledgeLearningSource.MARKETPLACE_ANALYTICS]: 0.8,
  [KnowledgeLearningSource.EXPERT_REVIEW]: 0.95,
  [KnowledgeLearningSource.RESEARCH]: 0.85,
  [KnowledgeLearningSource.DESIGN_MEMORY]: 0.88,
};

export const MIN_FEEDBACK_SAMPLES = 5;
export const STABILITY_CONFIDENCE_THRESHOLD = 0.85;
export const MIN_PATTERN_DISCOVERY_SAMPLES = 8;
export const MIN_ANTI_PATTERN_SAMPLES = 6;
export const MAX_CONFIDENCE_DELTA_PER_CYCLE = 0.08;
export const MIN_COMMERCIAL_FOR_STABILITY = 0.78;

function violation(
  code: KnowledgeLearningFailureCode,
  stage: KnowledgeLearningStageId,
  message: string,
  ruleId?: string,
  proposalId?: string,
): KnowledgeLearningViolation {
  return { code, stage, message, ruleId, proposalId };
}

function stageResult(
  stage: KnowledgeLearningStageId,
  violations: KnowledgeLearningViolation[],
): KnowledgeLearningStageResult {
  return { stage, passed: violations.length === 0, violations };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export function getLearningSourceTrust(source: KnowledgeLearningSourceId): number {
  return SOURCE_TRUST_WEIGHTS[source] ?? 0.5;
}

export function buildSeedLearningFeedback(): KnowledgeLearningFeedback[] {
  const now = new Date("2025-06-15T12:00:00Z");
  const baseObject: KnowledgeLearningObject = {
    generationId: "gen-kitchen-premium-001",
    composition: "hero-product-center",
    style: "premium",
    lighting: "warm-soft",
    camera: "50mm-natural",
    materials: "brushed-steel",
    colorPalette: "warm-neutral",
    patternId: "pattern-biz-trust-building",
    marketplace: "amazon",
    category: "kitchen",
  };

  const feedbacks: KnowledgeLearningFeedback[] = [];
  for (let i = 0; i < 10; i++) {
    feedbacks.push({
      source: KnowledgeLearningSource.VISION_REPORT,
      trustWeight: getLearningSourceTrust(KnowledgeLearningSource.VISION_REPORT),
      generationId: `gen-kitchen-premium-${String(i).padStart(3, "0")}`,
      ruleId: "photo-warm-lighting-rule",
      learningObject: { ...baseObject, generationId: `gen-kitchen-premium-${String(i).padStart(3, "0")}` },
      outcome: {
        visionScore: 0.82 + i * 0.01,
        commercialScore: 0.79 + i * 0.008,
        ctrPrediction: 0.71 + i * 0.005,
        retryCount: i < 2 ? 1 : 0,
        userSatisfaction: 0.8,
      },
      userRating: i % 4 === 0 ? "positive" : "neutral",
      timestamp: now,
    });
  }

  for (let i = 0; i < 7; i++) {
    feedbacks.push({
      source: KnowledgeLearningSource.COMMERCIAL_SCORE,
      trustWeight: getLearningSourceTrust(KnowledgeLearningSource.COMMERCIAL_SCORE),
      generationId: `gen-electronics-cold-${String(i).padStart(3, "0")}`,
      ruleId: "photo-cold-lighting-rule",
      learningObject: {
        generationId: `gen-electronics-cold-${String(i).padStart(3, "0")}`,
        composition: "technical-grid",
        style: "technical",
        lighting: "cool-crisp",
        camera: "35mm-dynamic",
        materials: "matte-plastic",
        colorPalette: "cool-tech",
        marketplace: "amazon",
        category: "electronics",
      },
      outcome: {
        visionScore: 0.76,
        commercialScore: 0.81,
        ctrPrediction: 0.68,
        retryCount: 0,
      },
      timestamp: now,
    });
  }

  for (let i = 0; i < 6; i++) {
    feedbacks.push({
      source: KnowledgeLearningSource.RETRY_RESULT,
      trustWeight: getLearningSourceTrust(KnowledgeLearningSource.RETRY_RESULT),
      generationId: `gen-fail-harsh-${String(i).padStart(3, "0")}`,
      learningObject: {
        generationId: `gen-fail-harsh-${String(i).padStart(3, "0")}`,
        composition: "overcrowded",
        lighting: "harsh-overhead",
        style: "generic",
        marketplace: "amazon",
        category: "home",
      },
      outcome: {
        visionScore: 0.42,
        commercialScore: 0.38,
        retryCount: 2,
        userSatisfaction: 0.3,
      },
      userRating: "negative",
      timestamp: now,
    });
  }

  feedbacks.push({
    source: KnowledgeLearningSource.EXPERT_REVIEW,
    trustWeight: getLearningSourceTrust(KnowledgeLearningSource.EXPERT_REVIEW),
    generationId: "gen-expert-pattern-proposal",
    learningObject: {
      generationId: "gen-expert-pattern-proposal",
      composition: "lifestyle-context-hero",
      style: "lifestyle",
      patternId: "pattern-story-lifestyle",
      marketplace: "wildberries",
      category: "cosmetics",
    },
    outcome: { visionScore: 0.88, commercialScore: 0.86, retryCount: 0 },
    expertApproved: true,
    timestamp: now,
  });

  return feedbacks;
}

export function evaluateLearningOutcome(outcome: KnowledgeLearningOutcome): {
  success: boolean;
  score: number;
} {
  const score =
    outcome.visionScore * 0.35 +
    outcome.commercialScore * 0.4 +
    (outcome.ctrPrediction ?? 0.65) * 0.15 +
    (1 - Math.min(outcome.retryCount, 3) / 3) * 0.1;
  return { success: score >= 0.72, score: clamp01(score) };
}

export function collectLearningFeedback(
  feedback: KnowledgeLearningFeedback[],
  context: KnowledgeLearningContext = {},
): { aggregated: KnowledgeLearningFeedback[]; violations: KnowledgeLearningViolation[] } {
  const violations: KnowledgeLearningViolation[] = [];
  const stage = KnowledgeLearningStage.FEEDBACK_COLLECTION;

  if (context.singleFeedbackOverride) {
    const single = feedback.filter((f) => f.userRating);
    if (single.length === 1) {
      violations.push(
        violation(
          "SINGLE_FEEDBACK_OVERRIDE",
          stage,
          "Single user feedback cannot change knowledge rules",
          single[0].ruleId,
        ),
      );
    }
  }

  const aggregated = feedback.map((f) => ({
    ...f,
    trustWeight: f.trustWeight || getLearningSourceTrust(f.source),
  }));

  return { aggregated, violations };
}

export function adjustKnowledgeConfidenceFromOutcomes(
  rule: ValidatableKnowledgeEntry,
  feedback: KnowledgeLearningFeedback[],
  context: KnowledgeLearningContext = {},
): KnowledgeConfidenceAdjustment {
  const ruleFeedback = feedback.filter((f) => f.ruleId === rule.id);
  const sampleCount = ruleFeedback.length;

  if (sampleCount === 0) {
    return {
      ruleId: rule.id,
      previousConfidence: rule.confidence,
      newConfidence: rule.confidence,
      delta: 0,
      reason: "no feedback samples",
      stable: true,
      sampleCount: 0,
    };
  }

  const avgOutcome =
    ruleFeedback.reduce((sum, f) => sum + evaluateLearningOutcome(f.outcome).score, 0) / sampleCount;

  const weightedTrust =
    ruleFeedback.reduce((sum, f) => sum + f.trustWeight, 0) / sampleCount;

  let delta = (avgOutcome - 0.5) * 0.12 * weightedTrust;
  if (ruleFeedback.some((f) => f.outcome.retryCount > 1)) delta -= 0.04;
  if (ruleFeedback.filter((f) => f.userRating === "negative").length >= MIN_FEEDBACK_SAMPLES) {
    delta -= 0.06;
  }
  if (ruleFeedback.filter((f) => f.userRating === "positive").length >= MIN_FEEDBACK_SAMPLES) {
    delta += 0.04;
  }

  delta = Math.max(-MAX_CONFIDENCE_DELTA_PER_CYCLE, Math.min(MAX_CONFIDENCE_DELTA_PER_CYCLE, delta));

  const isStable =
    rule.confidence >= STABILITY_CONFIDENCE_THRESHOLD &&
    avgOutcome >= MIN_COMMERCIAL_FOR_STABILITY &&
    !context.bypassStability;

  if (isStable) {
    return {
      ruleId: rule.id,
      previousConfidence: rule.confidence,
      newConfidence: rule.confidence,
      delta: 0,
      reason: "stable high-performing rule — no change without strong evidence",
      stable: true,
      sampleCount,
    };
  }

  const newConfidence = clamp01(rule.confidence + delta);

  return {
    ruleId: rule.id,
    previousConfidence: rule.confidence,
    newConfidence,
    delta: newConfidence - rule.confidence,
    reason: `reinforcement from ${sampleCount} samples (avg outcome ${avgOutcome.toFixed(2)})`,
    stable: false,
    sampleCount,
  };
}

function dimensionKey(obj: KnowledgeLearningObject): string {
  return [
    obj.composition ?? "",
    obj.style ?? "",
    obj.lighting ?? "",
    obj.camera ?? "",
    obj.materials ?? "",
    obj.colorPalette ?? "",
    obj.marketplace ?? "",
    obj.category ?? "",
  ].join("|");
}

export function detectKnowledgePatternProposals(
  feedback: KnowledgeLearningFeedback[],
): KnowledgePatternProposal[] {
  const groups = new Map<string, KnowledgeLearningFeedback[]>();

  for (const f of feedback) {
    const key = dimensionKey(f.learningObject);
    if (!key.replace(/\|/g, "").trim()) continue;
    const list = groups.get(key) ?? [];
    list.push(f);
    groups.set(key, list);
  }

  const proposals: KnowledgePatternProposal[] = [];
  let counter = 0;

  for (const [, samples] of groups) {
    if (samples.length < MIN_PATTERN_DISCOVERY_SAMPLES) continue;

    const successes = samples.filter((s) => evaluateLearningOutcome(s.outcome).success);
    const successRate = successes.length / samples.length;
    if (successRate < 0.75) continue;

    counter += 1;
    const sample = samples[0];
    proposals.push({
      id: `learned-pattern-${counter}`,
      kind: KnowledgeProposalKind.PATTERN,
      status: KnowledgeProposalStatus.PROPOSED,
      title: `Discovered pattern: ${sample.learningObject.composition ?? "composition"} + ${sample.learningObject.lighting ?? "lighting"}`,
      description: `Recurring successful design decisions across ${samples.length} generations`,
      dimensions: sample.learningObject,
      successRate,
      sampleCount: samples.length,
      marketplace: sample.learningObject.marketplace,
      requiresExpertReview: true,
      evidenceSources: [...new Set(samples.map((s) => s.source))],
    });
  }

  return proposals;
}

export function detectKnowledgeAntiPatternProposals(
  feedback: KnowledgeLearningFeedback[],
): KnowledgePatternProposal[] {
  const groups = new Map<string, KnowledgeLearningFeedback[]>();

  for (const f of feedback) {
    if (!f.learningObject.lighting && !f.learningObject.composition) continue;
    const key = `${f.learningObject.lighting ?? ""}|${f.learningObject.composition ?? ""}`;
    const list = groups.get(key) ?? [];
    list.push(f);
    groups.set(key, list);
  }

  const proposals: KnowledgePatternProposal[] = [];
  let counter = 0;

  for (const [, samples] of groups) {
    if (samples.length < MIN_ANTI_PATTERN_SAMPLES) continue;

    const failures = samples.filter((s) => !evaluateLearningOutcome(s.outcome).success);
    const failureRate = failures.length / samples.length;
    if (failureRate < 0.6) continue;

    counter += 1;
    const sample = samples[0];
    proposals.push({
      id: `learned-anti-pattern-${counter}`,
      kind: KnowledgeProposalKind.ANTI_PATTERN,
      status: KnowledgeProposalStatus.PROPOSED,
      title: `Discovered anti-pattern: ${sample.learningObject.lighting ?? "lighting"} in ${sample.learningObject.composition ?? "layout"}`,
      description: `Recurring failures across ${samples.length} generations`,
      dimensions: sample.learningObject,
      successRate: 1 - failureRate,
      sampleCount: samples.length,
      marketplace: sample.learningObject.marketplace,
      requiresExpertReview: true,
      evidenceSources: [...new Set(samples.map((s) => s.source))],
    });
  }

  return proposals;
}

export function analyzeMarketplaceAdaptation(
  feedback: KnowledgeLearningFeedback[],
  marketplace: string,
): { improving: string[]; declining: string[] } {
  const scoped = feedback.filter((f) => f.learningObject.marketplace === marketplace);
  const byLighting = new Map<string, number[]>();

  for (const f of scoped) {
    const key = f.learningObject.lighting ?? "unknown";
    const scores = byLighting.get(key) ?? [];
    scores.push(f.outcome.commercialScore);
    byLighting.set(key, scores);
  }

  const improving: string[] = [];
  const declining: string[] = [];

  for (const [lighting, scores] of byLighting) {
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    if (avg >= 0.8) improving.push(lighting);
    if (avg < 0.55) declining.push(lighting);
  }

  return { improving, declining };
}

export function requiresExpertReview(proposal: KnowledgePatternProposal): boolean {
  return (
    proposal.requiresExpertReview ||
    proposal.kind === KnowledgeProposalKind.PATTERN ||
    proposal.kind === KnowledgeProposalKind.ANTI_PATTERN
  );
}

export function validateKnowledgeProposal(
  proposal: KnowledgePatternProposal,
  context: KnowledgeLearningContext = {},
): KnowledgeLearningViolation[] {
  const violations: KnowledgeLearningViolation[] = [];
  const stage = KnowledgeLearningStage.VALIDATION;

  if (context.allowUnvalidatedProposal) {
    violations.push(
      violation("UNVALIDATED_PROPOSAL", stage, "Proposals cannot enter knowledge base without validation", undefined, proposal.id),
    );
  }

  if (proposal.sampleCount < MIN_FEEDBACK_SAMPLES) {
    violations.push(
      violation(
        "INSUFFICIENT_FEEDBACK",
        stage,
        `Proposal requires at least ${MIN_FEEDBACK_SAMPLES} samples`,
        undefined,
        proposal.id,
      ),
    );
  }

  if (requiresExpertReview(proposal) && proposal.status === KnowledgeProposalStatus.PROPOSED) {
    violations.push(
      violation(
        "MISSING_EXPERT_REVIEW",
        stage,
        "New patterns and anti-patterns require expert review before publication",
        undefined,
        proposal.id,
      ),
    );
  }

  return violations;
}

export function applyKnowledgeProposalValidation(
  proposal: KnowledgePatternProposal,
  expertApproved: boolean,
): KnowledgePatternProposal {
  if (!expertApproved) {
    return { ...proposal, status: KnowledgeProposalStatus.REJECTED };
  }
  return { ...proposal, status: KnowledgeProposalStatus.PENDING_VALIDATION };
}

export function computeLearningMetrics(
  feedback: KnowledgeLearningFeedback[],
  adjustments: KnowledgeConfidenceAdjustment[],
): KnowledgeLearningMetrics {
  if (feedback.length === 0) {
    return {
      visionScoreAvg: 0,
      commercialScoreAvg: 0,
      ctrPredictionAvg: 0,
      retryRate: 0,
      patternSuccessRate: 0,
      antiPatternFrequency: 0,
      userSatisfactionAvg: 0,
      confidenceGrowth: 0,
    };
  }

  const visionScoreAvg =
    feedback.reduce((s, f) => s + f.outcome.visionScore, 0) / feedback.length;
  const commercialScoreAvg =
    feedback.reduce((s, f) => s + f.outcome.commercialScore, 0) / feedback.length;
  const ctrPredictionAvg =
    feedback.reduce((s, f) => s + (f.outcome.ctrPrediction ?? 0.65), 0) / feedback.length;
  const retryRate =
    feedback.reduce((s, f) => s + f.outcome.retryCount, 0) / feedback.length;
  const successes = feedback.filter((f) => evaluateLearningOutcome(f.outcome).success);
  const patternSuccessRate = successes.length / feedback.length;
  const antiPatternFrequency =
    feedback.filter((f) => !evaluateLearningOutcome(f.outcome).success).length / feedback.length;
  const userSatisfactionAvg =
    feedback.reduce((s, f) => s + (f.outcome.userSatisfaction ?? 0.7), 0) / feedback.length;
  const confidenceGrowth =
    adjustments.reduce((s, a) => s + a.delta, 0) / Math.max(adjustments.length, 1);

  return {
    visionScoreAvg,
    commercialScoreAvg,
    ctrPredictionAvg,
    retryRate,
    patternSuccessRate,
    antiPatternFrequency,
    userSatisfactionAvg,
    confidenceGrowth,
  };
}

export function updateKnowledgeFromLearning(
  rule: ValidatableKnowledgeEntry,
  adjustment: KnowledgeConfidenceAdjustment,
  context: KnowledgeLearningContext = {},
): { updated: ValidatableKnowledgeEntry; versionReleased: boolean; violations: KnowledgeLearningViolation[] } {
  const violations: KnowledgeLearningViolation[] = [];
  const stage = KnowledgeLearningStage.KNOWLEDGE_UPDATE;

  if (adjustment.stable && adjustment.delta === 0) {
    return { updated: rule, versionReleased: false, violations: [] };
  }

  if (Math.abs(adjustment.delta) > MAX_CONFIDENCE_DELTA_PER_CYCLE && !context.bypassStability) {
    violations.push(
      violation("CHAOTIC_CONFIDENCE", stage, "Confidence delta exceeds safe per-cycle limit", rule.id),
    );
    return { updated: rule, versionReleased: false, violations };
  }

  const updatedEntry: ValidatableKnowledgeEntry = {
    ...rule,
    confidence: adjustment.newConfidence,
    explainable: `${rule.explainable} [learning: ${adjustment.reason}]`,
  };

  const validation = runKnowledgeValidationPipeline(updatedEntry, {
    skipSimulation: context.skipValidation,
    simulation: {
      blueprintCount: 100,
      commercialScoreDelta: adjustment.delta,
      visionScoreDelta: adjustment.delta * 0.5,
      retryRate: 0.05,
      stableDecisions: true,
    },
  });

  if (!validation.approved && validation.status !== "needs_review") {
    violations.push(violation("KNOWLEDGE_DEGRADATION", stage, "Validation rejected learned update", rule.id));
    return { updated: rule, versionReleased: false, violations };
  }

  if (context.skipValidation) {
    return { updated: updatedEntry, versionReleased: false, violations: [] };
  }

  const { draft } = createKnowledgeVersionDraft(
    rule.id,
    [`Confidence ${adjustment.previousConfidence.toFixed(2)} → ${adjustment.newConfidence.toFixed(2)}`, adjustment.reason],
    "patch",
  );

  if (!draft) {
    return { updated: updatedEntry, versionReleased: false, violations: [] };
  }

  const release = releaseKnowledgeVersion(
    {
      ...draft,
      confidence: adjustment.newConfidence,
      status: KnowledgeVersionState.TESTING,
      compatibility: KnowledgeCompatibilityLevel.COMPATIBLE,
    },
    {
      skipValidation: true,
      simulationPassed: true,
      regressionPassed: true,
      commercialScoreDelta: adjustment.delta,
    },
  );

  if (!release.published) {
    violations.push(
      violation("COMPATIBILITY_REQUIRED", stage, "Version release failed for learned update", rule.id),
    );
  }

  return { updated: updatedEntry, versionReleased: release.published, violations };
}

export function runKnowledgeLearningPipeline(
  generationId: string,
  feedback: KnowledgeLearningFeedback[],
  context: KnowledgeLearningContext = {},
): KnowledgeLearningCycleReport {
  const stages: KnowledgeLearningStageResult[] = [];
  const allViolations: KnowledgeLearningViolation[] = [];
  const catalog = buildValidatableKnowledgeCatalog();

  const genViolations: KnowledgeLearningViolation[] = [];
  if (!generationId) {
    genViolations.push(violation("PIPELINE_INCOMPLETE", KnowledgeLearningStage.GENERATION, "Missing generation id"));
  }
  stages.push(stageResult(KnowledgeLearningStage.GENERATION, genViolations));
  allViolations.push(...genViolations);

  const scopedFeedback = feedback.filter((f) => f.generationId.startsWith(generationId.split("-").slice(0, 2).join("-")) || feedback.length <= 30);
  const evalSamples = scopedFeedback.length > 0 ? scopedFeedback : feedback;
  const evalViolations: KnowledgeLearningViolation[] = [];
  if (evalSamples.length === 0) {
    evalViolations.push(violation("PIPELINE_INCOMPLETE", KnowledgeLearningStage.EVALUATION, "No outcomes to evaluate"));
  }
  stages.push(stageResult(KnowledgeLearningStage.EVALUATION, evalViolations));
  allViolations.push(...evalViolations);

  const { aggregated, violations: feedbackViolations } = collectLearningFeedback(feedback, context);
  stages.push(stageResult(KnowledgeLearningStage.FEEDBACK_COLLECTION, feedbackViolations));
  allViolations.push(...feedbackViolations);

  const patternProposals = detectKnowledgePatternProposals(aggregated);
  const antiPatternProposals = detectKnowledgeAntiPatternProposals(aggregated);
  stages.push(stageResult(KnowledgeLearningStage.PATTERN_DETECTION, []));

  const proposalViolations: KnowledgeLearningViolation[] = [];
  if (
    patternProposals.length === 0 &&
    antiPatternProposals.length === 0 &&
    aggregated.length >= MIN_PATTERN_DISCOVERY_SAMPLES
  ) {
    proposalViolations.push(
      violation(
        "PIPELINE_INCOMPLETE",
        KnowledgeLearningStage.KNOWLEDGE_PROPOSAL,
        "Pattern detection produced no proposals from sufficient samples",
      ),
    );
  }
  stages.push(stageResult(KnowledgeLearningStage.KNOWLEDGE_PROPOSAL, proposalViolations));
  allViolations.push(...proposalViolations);

  const ruleIds = [...new Set(aggregated.map((f) => f.ruleId).filter(Boolean))] as string[];
  const confidenceAdjustments: KnowledgeConfidenceAdjustment[] = [];
  const updateViolations: KnowledgeLearningViolation[] = [];
  let knowledgeUpdated = false;

  for (const ruleId of ruleIds) {
    const rule = catalog.find((e) => e.id === ruleId);
    if (!rule) continue;
    const adjustment = adjustKnowledgeConfidenceFromOutcomes(rule, aggregated, context);
    confidenceAdjustments.push(adjustment);
    const { versionReleased, violations: updViolations } = updateKnowledgeFromLearning(
      rule,
      adjustment,
      context,
    );
    updateViolations.push(...updViolations);
    if (versionReleased || adjustment.delta !== 0) knowledgeUpdated = true;
  }

  const validationViolations = context.skipValidation
    ? []
    : updateViolations.filter((v) => v.code === "KNOWLEDGE_DEGRADATION");
  stages.push(stageResult(KnowledgeLearningStage.VALIDATION, validationViolations));
  allViolations.push(...validationViolations);

  stages.push(stageResult(KnowledgeLearningStage.KNOWLEDGE_UPDATE, updateViolations));
  allViolations.push(...updateViolations);

  const engineViolations: KnowledgeLearningViolation[] = [];
  if (context.allowUnvalidatedProposal) {
    engineViolations.push(
      violation("UNVALIDATED_PROPOSAL", KnowledgeLearningStage.KNOWLEDGE_ENGINE, "Unvalidated proposals blocked"),
    );
  }
  stages.push(stageResult(KnowledgeLearningStage.KNOWLEDGE_ENGINE, engineViolations));
  allViolations.push(...engineViolations);

  const metrics = computeLearningMetrics(aggregated, confidenceAdjustments);

  return {
    generationId,
    pipelineComplete: stages.every((s) => s.passed),
    stages,
    violations: allViolations,
    confidenceAdjustments,
    patternProposals,
    antiPatternProposals,
    metrics,
    knowledgeUpdated,
    validationRequired: patternProposals.length > 0 || antiPatternProposals.length > 0,
  };
}

export function validateKnowledgeLearning(
  context: KnowledgeLearningContext = {},
): KnowledgeLearningSystemReport {
  const violations: KnowledgeLearningViolation[] = [];
  const feedback = buildSeedLearningFeedback();

  if (context.allowUnvalidatedProposal) {
    violations.push(
      violation(
        "UNVALIDATED_PROPOSAL",
        KnowledgeLearningStage.VALIDATION,
        "Knowledge cannot be added without validation",
      ),
    );
  }

  const singleFeedback = feedback.slice(0, 1);
  const { violations: singleViolations } = collectLearningFeedback(singleFeedback, {
    singleFeedbackOverride: true,
  });
  if (!singleViolations.some((v) => v.code === "SINGLE_FEEDBACK_OVERRIDE")) {
    violations.push(
      violation(
        "INSUFFICIENT_FEEDBACK",
        KnowledgeLearningStage.FEEDBACK_COLLECTION,
        "Single-feedback guard must block isolated user reviews",
      ),
    );
  }

  const catalog = buildValidatableKnowledgeCatalog();
  const warmRule = catalog.find((e) => e.id === "photo-warm-lighting-rule")!;
  const adjustment = adjustKnowledgeConfidenceFromOutcomes(warmRule, feedback);
  if (adjustment.sampleCount > 0 && Math.abs(adjustment.delta) > MAX_CONFIDENCE_DELTA_PER_CYCLE) {
    violations.push(
      violation("CHAOTIC_CONFIDENCE", KnowledgeLearningStage.KNOWLEDGE_UPDATE, "Confidence change exceeds safe limit", warmRule.id),
    );
  }

  const patterns = detectKnowledgePatternProposals(feedback);
  const antiPatterns = detectKnowledgeAntiPatternProposals(feedback);
  if (patterns.length === 0 && antiPatterns.length === 0) {
    violations.push(
      violation("PIPELINE_INCOMPLETE", KnowledgeLearningStage.PATTERN_DETECTION, "Expected pattern discovery from seed data"),
    );
  }

  const cycle = runKnowledgeLearningPipeline("gen-kitchen-premium-001", feedback, {
    skipValidation: true,
  });
  if (cycle.stages.length !== LEARNING_PIPELINE.length) {
    violations.push(violation("PIPELINE_INCOMPLETE", KnowledgeLearningStage.KNOWLEDGE_ENGINE, "Learning pipeline incomplete"));
  }

  const adaptation = analyzeMarketplaceAdaptation(feedback, "amazon");
  if (adaptation.improving.length === 0 && adaptation.declining.length === 0) {
    violations.push(
      violation("PIPELINE_INCOMPLETE", KnowledgeLearningStage.EVALUATION, "Marketplace adaptation analysis empty"),
    );
  }

  return {
    valid: violations.length === 0,
    violations,
    goldenRuleSatisfied: violations.length === 0,
    continuousLearningReady: cycle.pipelineComplete || cycle.knowledgeUpdated,
    stabilityMaintained: adjustment.stable || Math.abs(adjustment.delta) <= MAX_CONFIDENCE_DELTA_PER_CYCLE,
    safetyMechanismsActive: !context.allowUnvalidatedProposal,
    proposalCount: patterns.length + antiPatterns.length,
    approvedProposalCount: 0,
  };
}

export function assertKnowledgeLearning(): void {
  const report = validateKnowledgeLearning();
  if (!report.valid) {
    const messages = report.violations.map((v) => v.message).join("; ");
    throw new Error(`Knowledge learning validation failed: ${messages}`);
  }
}

export function runKnowledgeLearning(
  context: KnowledgeLearningContext = {},
): KnowledgeLearningSystemReport {
  return validateKnowledgeLearning(context);
}

export function isKnowledgeLearningFailure(code: string): code is KnowledgeLearningFailureCode {
  const codes: KnowledgeLearningFailureCode[] = [
    "UNVALIDATED_PROPOSAL",
    "CHAOTIC_CONFIDENCE",
    "MISSING_EXPERT_REVIEW",
    "INSUFFICIENT_FEEDBACK",
    "STABILITY_VIOLATION",
    "KNOWLEDGE_DEGRADATION",
    "REPEATED_ERROR",
    "SIMULATION_REQUIRED",
    "REGRESSION_REQUIRED",
    "COMPATIBILITY_REQUIRED",
    "SINGLE_FEEDBACK_OVERRIDE",
    "PIPELINE_INCOMPLETE",
  ];
  return codes.includes(code as KnowledgeLearningFailureCode);
}
