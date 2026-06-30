/**
 * DESIGN AI v18 — Agent Decision Model tests (Chapter 4.8)
 */
import assert from "node:assert/strict";
import {
  AGENT_DECISION_GOLDEN_RULE,
  AgentDecisionSession,
  DECISION_STAGE_ORDER,
  DecisionQualityCriterion,
  DecisionStage,
  buildAgentContextPackage,
  buildAgentMemoryPackage,
  buildTraceFromState,
  createEmptyRenderBlueprint,
  defaultAlternativesForAgent,
  detectPromptThinkingViolation,
  evaluateDecisionQuality,
  pickBestAlternative,
  scoreAlternative,
  serializeDecisionReplay,
  deserializeDecisionReplay,
  traceFromSession,
  validateAgentDecision,
  updatesToMutations,
} from "./index";

function runCompositionPipeline(confidence = 0.82) {
  const bp = createEmptyRenderBlueprint({ category: "electronics" });
  const working = buildAgentContextPackage({ blueprint: bp, agentId: "composition-director" });
  const memory = buildAgentMemoryPackage({ agentId: "composition-director", working });
  const alternatives = defaultAlternativesForAgent("composition-director");
  const evaluations = alternatives.map((alt, index) => {
    const scores = scoreAlternative([`suited for ${alt.label}`], confidence - index * 0.05);
    return {
      alternativeId: alt.id,
      scores,
      weightedTotal: scores[DecisionQualityCriterion.CORRECTNESS] * 0.2 +
        scores[DecisionQualityCriterion.COMMERCIAL_VALUE] * 0.2 +
        scores[DecisionQualityCriterion.VISUAL_QUALITY] * 0.2,
      notes: [`Evaluated ${alt.label}`],
    };
  });

  const selectedId = pickBestAlternative(alternatives, evaluations);
  const mutations = updatesToMutations(
    { composition: { ...bp.composition, heroScale: 0.72 } },
    "composition-director",
    bp.meta.revision,
    "Composition decision",
  );

  const session = new AgentDecisionSession("composition-director")
    .observeFromContext(working, memory)
    .interpret(["Premium electronics", "Minimal composition", "Dark background"])
    .reason([
      "Hero product must dominate frame",
      "Buyer sees technical clarity first",
      "Marketplace requires headline space",
    ])
    .compare(alternatives)
    .evaluate(evaluations)
    .decide(selectedId, confidence)
    .explain([
      "Selected minimal framing for technical electronics",
      "Rejected luxury and lifestyle for readability",
    ])
    .publish(mutations);

  return { session, mutations, selectedId };
}

function testGoldenRule() {
  assert.ok(AGENT_DECISION_GOLDEN_RULE.includes("not a prompt"));
  console.log("✔ golden rule — agents decide design outcomes, not prompts");
}

function testEightStageOrder() {
  assert.equal(DECISION_STAGE_ORDER.length, 8);
  assert.equal(DECISION_STAGE_ORDER[0], DecisionStage.OBSERVE);
  assert.equal(DECISION_STAGE_ORDER[7], DecisionStage.PUBLISH);
  console.log("✔ decision pipeline defines eight mandatory stages");
}

function testFullDecisionPipeline() {
  const { session } = runCompositionPipeline();
  const report = validateAgentDecision(session.state);
  assert.equal(report.valid, true);
  assert.equal(session.state.stages.length, 8);
  assert.equal(session.state.completed, true);
  console.log("✔ agent completes observe through publish without skipped stages");
}

function testMinimumTwoAlternatives() {
  const session = new AgentDecisionSession("scene-director");
  assert.throws(
    () =>
      session
        .observe(["Story", "Scene"])
        .interpret(["Premium product"])
        .reason(["What environment fits?"])
        .compare([{ id: "only", label: "Only", summary: "single", scores: {} }]),
    /at least two alternatives/,
  );
  console.log("✔ compare stage requires at least two alternatives");
}

function testSingleSelectedDecision() {
  const { session, selectedId } = runCompositionPipeline();
  assert.equal(session.state.selectedAlternativeId, selectedId);
  const active = session.state.alternatives.filter((a) => !a.rejected);
  assert.equal(active.length, 1);
  console.log("✔ only one active decision after decide stage");
}

function testExplainabilityRequired() {
  const { session } = runCompositionPipeline();
  const trace = traceFromSession(session);
  assert.ok(trace.reasoning.length > 0);
  assert.ok(trace.rejectedAlternatives.length >= 1);
  assert.ok(trace.inputs.length > 0);
  console.log("✔ decision trace captures inputs, reasoning, and rejected alternatives");
}

function testPublishMutationsOnly() {
  const { session, mutations } = runCompositionPipeline();
  assert.equal(session.state.mutations.length, mutations.length);
  assert.ok(session.toDecisionTraceStrings().every((line) => !line.toLowerCase().includes("prompt")));
  console.log("✔ publish stage emits mutations — no direct blueprint mutation");
}

function testPromptThinkingViolation() {
  const violation = detectPromptThinkingViolation("Use negative prompt tokens in generation");
  assert.ok(violation);
  assert.equal(violation?.code, "PROMPT_THINKING");

  const provider = detectPromptThinkingViolation("Best for Pollinations generation");
  assert.ok(provider);
  assert.equal(provider?.code, "PROVIDER_REFERENCE");
  console.log("✔ prompt and provider references violate decision model");
}

function testDecisionQualityEvaluation() {
  const scores = scoreAlternative(["commercial readability"], 0.8);
  const report = evaluateDecisionQuality(scores);
  assert.equal(report.complete, true);
  assert.ok(report.scores[DecisionQualityCriterion.COMMERCIAL_VALUE] >= 0.55);
  console.log("✔ decision quality evaluated across six criteria");
}

function testSkippedStageDetected() {
  const state = runCompositionPipeline().session.state;
  state.stages = state.stages.slice(0, 5);
  state.completed = false;
  const report = validateAgentDecision(state);
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "STAGE_SKIPPED"));
  console.log("✔ skipped stages fail validation");
}

function testDecisionReplaySerialization() {
  const { session } = runCompositionPipeline();
  const json = serializeDecisionReplay(session);
  const replay = deserializeDecisionReplay(json);
  assert.equal(replay.trace.agentId, "composition-director");
  assert.equal(replay.pipeline.completed, true);
  assert.equal(replay.trace.stagesCompleted.length, 8);
  console.log("✔ decision trace serializes for replay and debug");
}

function testTraceFromState() {
  const { session } = runCompositionPipeline();
  const trace = buildTraceFromState(session.state);
  assert.equal(trace.agentId, "composition-director");
  assert.ok(trace.alternatives.includes("Minimal"));
  console.log("✔ trace can be rebuilt from pipeline state");
}

function run() {
  testGoldenRule();
  testEightStageOrder();
  testFullDecisionPipeline();
  testMinimumTwoAlternatives();
  testSingleSelectedDecision();
  testExplainabilityRequired();
  testPublishMutationsOnly();
  testPromptThinkingViolation();
  testDecisionQualityEvaluation();
  testSkippedStageDetected();
  testDecisionReplaySerialization();
  testTraceFromState();
  console.log("\nagent-decision.spec.ts — all passed");
}

run();
