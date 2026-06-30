/**
 * DESIGN AI v18 — Agent Professional Decision Engine tests (Chapter 7.6)
 */
import assert from "node:assert/strict";
import {
  AGENT_PROFESSIONAL_DECISION_VERSION,
  AGENT_PROFESSIONAL_DECISION_GOLDEN_RULE,
  LEGACY_PROMPT_DECISION_MODEL,
  PROFESSIONAL_DECISION_PIPELINE,
  STORY_DIRECTOR_CRITERION_WEIGHTS,
  ProfessionalDecisionStage,
  ProfessionalDecisionCriterion,
  getProfessionalDecisionWeights,
  validateProfessionalDecisionPipelineStructure,
  analyzeDecisionProblem,
  generateStoryDirectorCandidates,
  generateDecisionCandidates,
  evaluateCandidateRules,
  detectDecisionConflicts,
  selectBestCandidate,
  buildDecisionExplanation,
  executeProfessionalDecision,
  validateProfessionalDecision,
  validateProfessionalDecisionWithExecution,
  assertProfessionalDecision,
  runProfessionalDecision,
  isProfessionalDecisionFailure,
  getProfessionalDecisionStage,
  mapProfessionalStageToChapter48,
  createEmptyRenderBlueprint,
  frozenTestBlueprint,
  StoryType,
  BlueprintLifecycle,
} from "./index";

function testPipelineCatalog() {
  assert.equal(PROFESSIONAL_DECISION_PIPELINE.length, 8);
  assert.equal(AGENT_PROFESSIONAL_DECISION_VERSION, "7.6.0");
  assert.equal(validateProfessionalDecisionPipelineStructure().length, 0);
  console.log("✔ decision pipeline catalog — 8 mandatory expert stages");
}

function testGoldenRule() {
  assert.ok(AGENT_PROFESSIONAL_DECISION_GOLDEN_RULE.includes("does not accept the first idea"));
  assert.deepEqual(LEGACY_PROMPT_DECISION_MODEL, ["input", "llm", "answer"]);
  console.log("✔ golden rule — professional compares alternatives, not prompt→LLM→answer");
}

function testMultiCriteriaWeights() {
  const weights = getProfessionalDecisionWeights("visual-story-director");
  assert.equal(weights.length, 5);
  const business = weights.find((w) => w.criterion === ProfessionalDecisionCriterion.BUSINESS_MATCH)!;
  assert.equal(business.weight, 0.3);
  assert.equal(STORY_DIRECTOR_CRITERION_WEIGHTS[0].weight, 0.3);
  console.log("✔ multi-criteria scoring — business match 30%, marketplace 20%");
}

function testProblemAnalysis() {
  const bp = createEmptyRenderBlueprint({ category: "kitchen", seed: 1 });
  const problem = analyzeDecisionProblem("visual-story-director", bp);
  assert.equal(problem.agentId, "visual-story-director");
  assert.ok(problem.professionalQuestion.includes("Story Pattern"));
  assert.ok(problem.professionalQuestion.includes("Business Goal"));
  console.log("✔ problem analysis — professional question before solution search");
}

function testOptionGeneration() {
  const candidates = generateStoryDirectorCandidates(0);
  assert.equal(candidates.length, 4);
  assert.ok(candidates.some((c) => c.label === "Problem → Solution"));
  assert.ok(candidates.some((c) => c.label === "Premium Product"));
  assert.ok(candidates.every((c) => c.scores.business_match !== undefined));
  console.log("✔ option generation — four story candidates with independent scores");
}

function testRuleEvaluation() {
  const bp = createEmptyRenderBlueprint({ category: "kitchen", seed: 2 });
  bp.creative.goal = "Budget";
  const candidate = generateStoryDirectorCandidates(0).find((c) => c.label === "Premium Product")!;
  const rules: string[] = [];
  const result = evaluateCandidateRules(candidate, bp, rules);
  assert.equal(result.passed, false);
  console.log("✔ rule evaluation — premium story rejected for budget business goal");
}

function testConflictDetection() {
  const bp = frozenTestBlueprint();
  bp.composition.templateId = "discount";
  const candidate = generateStoryDirectorCandidates(0).find((c) => c.label === "Premium Product")!;
  const conflicts = detectDecisionConflicts(bp, candidate);
  assert.equal(conflicts.length, 1);
  assert.ok(conflicts[0].description.includes("Premium"));
  console.log("✔ conflict detection — premium story vs discount layout");
}

function testDeterministicSelection() {
  const candidates = generateDecisionCandidates("visual-story-director", 42);
  const weights = getProfessionalDecisionWeights("visual-story-director");
  const a = selectBestCandidate(candidates, weights);
  const b = selectBestCandidate(candidates, weights);
  assert.equal(a.selectedId, b.selectedId);
  assert.equal(a.confidence, b.confidence);
  console.log("✔ deterministic decision — identical inputs yield identical selection");
}

function testDecisionExplanation() {
  const candidate = generateStoryDirectorCandidates(0)[0];
  const lines = buildDecisionExplanation(candidate, STORY_DIRECTOR_CRITERION_WEIGHTS);
  assert.ok(lines.some((l) => l.includes("Selected Pattern")));
  assert.ok(lines.some((l) => l.includes("business match")));
  console.log("✔ decision explanation — mandatory explainability with scores");
}

function testChapter48Mapping() {
  assert.equal(mapProfessionalStageToChapter48(ProfessionalDecisionStage.OPTION_GENERATION), "compare");
  assert.equal(mapProfessionalStageToChapter48(ProfessionalDecisionStage.DECISION_SELECTION), "decide");
  const stage = getProfessionalDecisionStage(ProfessionalDecisionStage.SCORING)!;
  assert.equal(stage.order, 5);
  console.log("✔ Ch 7.6 stages map to Ch 4.8 decision model");
}

async function testKitchenExecution() {
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.lifecycle.stage = BlueprintLifecycle.STORY_DEFINED;
  const report = await executeProfessionalDecision({
    agentId: "visual-story-director",
    blueprint: bp,
    context: { seed: 42 },
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.state.stagesCompleted.length, 8);
  assert.ok(report.report?.selectedOption);
  assert.ok(report.report!.alternatives.length >= 3);
  assert.ok(report.report!.reasoning.length >= 3);
  assert.equal(report.deterministic, true);
  assert.ok(report.result?.confidence);
  console.log("✔ kitchen execution — story director completes professional decision pipeline");
}

async function testSingleOptionFails() {
  const report = await executeProfessionalDecision({
    agentId: "visual-story-director",
    context: { singleOptionOnly: true, seed: 0 },
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "MISSING_ALTERNATIVES"));
  console.log("✔ first-option-only decision fails validation");
}

async function testSkipExplanationFails() {
  const report = await executeProfessionalDecision({
    agentId: "visual-story-director",
    context: { skipExplanation: true, seed: 0 },
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "MISSING_EXPLANATION"));
  console.log("✔ missing explanation fails decision validation");
}

async function testForceConflictFails() {
  const report = await executeProfessionalDecision({
    agentId: "visual-story-director",
    context: { forceConflict: true, seed: 0 },
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "UNRESOLVED_CONFLICT" || v.code === "EXECUTION_FAILED"));
  console.log("✔ unresolved conflicts block decision selection");
}

async function testValidateWithExecution() {
  const report = await validateProfessionalDecisionWithExecution({ seed: 42 });
  assert.equal(report.valid, true);
  assert.equal(report.pipelineComplete, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertProfessionalDecision();
  console.log("✔ full professional decision validation passes");
}

async function testRunEntryPoint() {
  const report = await runProfessionalDecision({ seed: 42 });
  assert.equal(report.valid, true);
  console.log("✔ runProfessionalDecision entry point works");
}

function testFailureCodes() {
  assert.equal(isProfessionalDecisionFailure("NON_DETERMINISTIC"), true);
  assert.equal(isProfessionalDecisionFailure("UNKNOWN"), false);
  console.log("✔ professional decision failure codes are catalogued");
}

async function run() {
  testPipelineCatalog();
  testGoldenRule();
  testMultiCriteriaWeights();
  testProblemAnalysis();
  testOptionGeneration();
  testRuleEvaluation();
  testConflictDetection();
  testDeterministicSelection();
  testDecisionExplanation();
  testChapter48Mapping();
  await testKitchenExecution();
  await testSingleOptionFails();
  await testSkipExplanationFails();
  await testForceConflictFails();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nagent-professional-decision.spec.ts — all passed");
}

run();
