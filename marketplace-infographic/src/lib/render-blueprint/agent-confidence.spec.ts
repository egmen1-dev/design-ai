/**
 * DESIGN AI v18 — Agent Confidence Model tests (Chapter 4.9)
 */
import assert from "node:assert/strict";
import {
  AGENT_CONFIDENCE_GOLDEN_RULE,
  ConfidenceLevel,
  ConfidenceLifecycleAction,
  buildAgentContextPackage,
  calculateConfidence,
  classifyConfidenceLevel,
  clearConfidenceHistory,
  computeAlternativeStability,
  computeInputCompleteness,
  confidenceFromContext,
  confidenceIsNotApproval,
  createEmptyRenderBlueprint,
  getConfidenceHistory,
  recordConfidenceHistory,
  resolveLifecycleAction,
  validateConfidenceScore,
  calibrateConfidence,
  buildConfidencePropagation,
  attachConfidenceToDecisionTrace,
  DEFAULT_CONFIDENCE_THRESHOLDS,
  SectionState,
} from "./index";

function testGoldenRule() {
  assert.ok(AGENT_CONFIDENCE_GOLDEN_RULE.includes("mandatory"));
  console.log("✔ golden rule — confidence is mandatory for every decision");
}

function testUnifiedScale() {
  const report = validateConfidenceScore(0.82);
  assert.equal(report.valid, true);
  assert.equal(validateConfidenceScore(1.5).valid, false);
  assert.equal(validateConfidenceScore(-0.1).valid, false);
  console.log("✔ confidence uses unified 0.0..1.0 scale");
}

function testConfidenceLevels() {
  assert.equal(classifyConfidenceLevel(0.95), ConfidenceLevel.VERY_HIGH);
  assert.equal(classifyConfidenceLevel(0.82), ConfidenceLevel.HIGH);
  assert.equal(classifyConfidenceLevel(0.68), ConfidenceLevel.MEDIUM);
  assert.equal(classifyConfidenceLevel(0.5), ConfidenceLevel.LOW);
  assert.equal(classifyConfidenceLevel(0.2), ConfidenceLevel.CRITICAL);
  console.log("✔ confidence levels map to five bands");
}

function testLifecycleThresholds() {
  assert.equal(resolveLifecycleAction(0.85), ConfidenceLifecycleAction.NONE);
  assert.equal(resolveLifecycleAction(0.55), ConfidenceLifecycleAction.CONSENSUS);
  assert.equal(resolveLifecycleAction(0.35), ConfidenceLifecycleAction.RETRY);
  assert.equal(
    resolveLifecycleAction(0.55, { ...DEFAULT_CONFIDENCE_THRESHOLDS, review: 0.7 }),
    ConfidenceLifecycleAction.CONSENSUS,
  );
  console.log("✔ lifecycle thresholds trigger consensus and retry");
}

function testInputCompletenessPenalty() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const ctx = buildAgentContextPackage({ blueprint: bp, agentId: "scene-director" });
  const incomplete = computeInputCompleteness("scene-director", ctx);
  assert.equal(incomplete.score, 0);
  assert.ok(incomplete.missing.includes("story"));

  bp.lifecycle.sections.story = SectionState.READY;
  bp.lifecycle.sections.creative = SectionState.READY;
  bp.lifecycle.sections.product = SectionState.READY;
  const complete = computeInputCompleteness(
    "scene-director",
    buildAgentContextPackage({ blueprint: bp, agentId: "scene-director" }),
  );
  assert.equal(complete.score, 1);
  console.log("✔ missing inputs reduce confidence via completeness factor");
}

function testConflictPenalty() {
  const high = calculateConfidence({
    agentId: "composition-director",
    factors: {
      inputCompleteness: 0.9,
      knowledgeMatch: 0.85,
      constraintSatisfaction: 0.9,
      alternativeStability: 0.85,
      reasoningConsistency: 0.9,
    },
    conflictCount: 0,
  });
  const conflicted = calculateConfidence({
    agentId: "composition-director",
    factors: high.factors,
    conflictCount: 2,
  });
  assert.ok(conflicted.value < high.value);
  assert.ok(conflicted.penalties.conflicts > 0);
  console.log("✔ conflicts reduce confidence");
}

function testAlternativeStability() {
  const unstable = computeAlternativeStability([
    { alternativeId: "a", scores: {} as never, weightedTotal: 0.81, notes: [] },
    { alternativeId: "b", scores: {} as never, weightedTotal: 0.8, notes: [] },
  ]);
  assert.ok(unstable.instabilityPenalty > 0);

  const stable = computeAlternativeStability([
    { alternativeId: "a", scores: {} as never, weightedTotal: 0.92, notes: [] },
    { alternativeId: "b", scores: {} as never, weightedTotal: 0.6, notes: [] },
  ]);
  assert.ok(stable.clearWinnerBonus > 0);
  console.log("✔ close alternatives lower stability; clear winner raises confidence");
}

function testKnowledgeAgreementBonus() {
  const aligned = calculateConfidence({
    agentId: "visual-story-director",
    factors: {
      inputCompleteness: 0.9,
      knowledgeMatch: 0.9,
      constraintSatisfaction: 0.85,
      alternativeStability: 0.8,
      reasoningConsistency: 0.85,
    },
    knowledgeAligned: true,
  });
  const neutral = calculateConfidence({
    agentId: "visual-story-director",
    factors: aligned.factors,
    knowledgeAligned: false,
  });
  assert.ok(aligned.value > neutral.value);
  assert.ok(aligned.bonuses.knowledgeAgreement > 0);
  console.log("✔ knowledge agreement increases confidence");
}

function testConfidenceFromContext() {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  bp.lifecycle.sections.story = SectionState.READY;
  bp.lifecycle.sections.creative = SectionState.READY;
  bp.lifecycle.sections.product = SectionState.READY;
  const ctx = buildAgentContextPackage({ blueprint: bp, agentId: "scene-director" });
  const score = confidenceFromContext({
    agentId: "scene-director",
    context: ctx,
    knowledgeAligned: true,
    reasoningSteps: 4,
  });
  assert.ok(score.value >= 0.6);
  assert.equal(score.agentId, "scene-director");
  console.log("✔ confidence computed from context factors");
}

function testConfidenceIsNotApproval() {
  assert.equal(confidenceIsNotApproval(0.95, false), true);
  assert.equal(confidenceIsNotApproval(0.95, true), false);
  console.log("✔ high confidence does not override failed validation");
}

function testConfidenceHistory() {
  clearConfidenceHistory();
  const score = calculateConfidence({
    agentId: "lighting-director",
    factors: {
      inputCompleteness: 0.8,
      knowledgeMatch: 0.75,
      constraintSatisfaction: 0.8,
      alternativeStability: 0.7,
      reasoningConsistency: 0.8,
    },
  });
  recordConfidenceHistory(score, { pipelineId: "pipe-1", revision: 3 });
  const history = getConfidenceHistory("lighting-director");
  assert.equal(history.length, 1);
  assert.equal(history[0].confidence, score.value);
  console.log("✔ confidence history recorded for analytics");
}

function testPropagationNoAveraging() {
  const propagated = buildConfidencePropagation([
    { agentId: "visual-story-director", confidence: 0.93, level: ConfidenceLevel.VERY_HIGH },
    { agentId: "scene-director", confidence: 0.81, level: ConfidenceLevel.HIGH },
    { agentId: "composition-director", confidence: 0.88, level: ConfidenceLevel.HIGH },
  ]);
  assert.equal(propagated.length, 3);
  assert.notEqual(propagated[0].confidence, propagated[1].confidence);
  console.log("✔ pipeline keeps per-agent confidence without averaging");
}

function testCalibration() {
  const calibrated = calibrateConfidence(0.9, {
    agentId: "scene-director",
    scale: 0.8,
    bias: -0.1,
    sampleCount: 100,
    observedAccuracy: 0.7,
  });
  assert.ok(calibrated < 0.9);
  console.log("✔ calibration profile adjusts overconfident agents");
}

function testAttachToDecisionTrace() {
  const score = calculateConfidence({
    agentId: "composition-director",
    factors: {
      inputCompleteness: 0.88,
      knowledgeMatch: 0.8,
      constraintSatisfaction: 0.85,
      alternativeStability: 0.82,
      reasoningConsistency: 0.86,
    },
  });
  const attached = attachConfidenceToDecisionTrace({ confidence: 0.5 }, score);
  assert.equal(attached.confidence, score.value);
  assert.equal(attached.confidenceLevel, score.level);
  console.log("✔ confidence attaches to decision trace for replay");
}

function run() {
  testGoldenRule();
  testUnifiedScale();
  testConfidenceLevels();
  testLifecycleThresholds();
  testInputCompletenessPenalty();
  testConflictPenalty();
  testAlternativeStability();
  testKnowledgeAgreementBonus();
  testConfidenceFromContext();
  testConfidenceIsNotApproval();
  testConfidenceHistory();
  testPropagationNoAveraging();
  testCalibration();
  testAttachToDecisionTrace();
  console.log("\nagent-confidence.spec.ts — all passed");
}

run();
