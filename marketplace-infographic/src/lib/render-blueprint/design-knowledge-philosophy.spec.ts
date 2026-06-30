/**
 * DESIGN AI v18 — Philosophy of Design Knowledge tests (Chapter 5.1)
 */
import assert from "node:assert/strict";
import {
  DESIGN_KNOWLEDGE_PHILOSOPHY_VERSION,
  DESIGN_KNOWLEDGE_GOLDEN_RULE,
  DESIGN_KNOWLEDGE_CORE_PHILOSOPHY,
  GENERIC_AI_PIPELINE,
  DESIGN_AI_KNOWLEDGE_PIPELINE,
  KNOWLEDGE_PRIORITY_OVER_LLM,
  SEED_DESIGN_KNOWLEDGE_RULES,
  KnowledgeDomain,
  KnowledgeEvidenceSource,
  KnowledgeOrigin,
  buildStructuredKnowledgeChain,
  getSeedKnowledgeRules,
  queryKnowledgeForCategory,
  getRulesForAgent,
  validateKnowledgeRule,
  validateKnowledgeIndependence,
  validateExplainableKnowledge,
  validateKnowledgeReusability,
  validateUnifiedKnowledgeBase,
  knowledgeSupportsDecision,
  validateDesignKnowledgePhilosophy,
  assertDesignKnowledgePhilosophy,
  runDesignKnowledgePhilosophy,
  isDesignKnowledgePhilosophyFailure,
} from "./index";

function testGoldenRule() {
  assert.ok(DESIGN_KNOWLEDGE_GOLDEN_RULE.includes("Knowledge"));
  assert.ok(DESIGN_KNOWLEDGE_GOLDEN_RULE.includes("not models"));
  assert.equal(DESIGN_KNOWLEDGE_PHILOSOPHY_VERSION, "5.1.0");
  console.log("✔ golden rule — knowledge not models is the platform foundation");
}

function testCorePhilosophy() {
  assert.ok(DESIGN_KNOWLEDGE_CORE_PHILOSOPHY.includes("not an image generator"));
  assert.ok(DESIGN_KNOWLEDGE_CORE_PHILOSOPHY.includes("Design Knowledge"));
  console.log("✔ core philosophy — design decisions from knowledge, not intuition");
}

function testKnowledgeBeforeGeneration() {
  assert.deepEqual(GENERIC_AI_PIPELINE, ["user", "prompt", "llm", "image"]);
  assert.deepEqual(DESIGN_AI_KNOWLEDGE_PIPELINE, [
    "user",
    "business-goal",
    "design-knowledge",
    "agent-decisions",
    "blueprint",
    "render",
    "image",
  ]);
  assert.ok(DESIGN_AI_KNOWLEDGE_PIPELINE.indexOf("design-knowledge") < DESIGN_AI_KNOWLEDGE_PIPELINE.indexOf("render"));
  console.log("✔ knowledge before generation — image is last, not first");
}

function testKnowledgePriorityOverLlm() {
  assert.equal(KNOWLEDGE_PRIORITY_OVER_LLM, 100);
  console.log("✔ design knowledge has higher priority than internal LLM knowledge");
}

function testSeedKnowledgeRules() {
  assert.ok(SEED_DESIGN_KNOWLEDGE_RULES.length >= 5);
  const luxury = SEED_DESIGN_KNOWLEDGE_RULES.find((r) => r.id === "luxury-cosmetics-soft-lighting")!;
  assert.equal(luxury.preference, "soft_lighting");
  assert.ok(luxury.evidenceSources.includes(KnowledgeEvidenceSource.COMMERCIAL_PHOTOGRAPHY));
  assert.ok(luxury.applicableAgents.includes("lighting-director"));
  console.log("✔ seed rules — luxury cosmetics → soft lighting with evidence sources");
}

function testStructuredKnowledgeChain() {
  const rule = getSeedKnowledgeRules().find((r) => r.id === "kitchen-soft-morning-light")!;
  const chain = buildStructuredKnowledgeChain(rule);
  assert.equal(chain.category, "kitchen");
  assert.equal(chain.preference, "soft_morning_light");
  assert.ok(chain.reason.includes("appetite"));
  assert.ok(chain.evidenceSources.length >= 2);
  console.log("✔ structured knowledge — category → preference → reason → evidence");
}

function testQueryKnowledgeForCategory() {
  const medical = queryKnowledgeForCategory("medical");
  assert.equal(medical.length, 1);
  assert.equal(medical[0].preference, "white_background");
  const kitchen = queryKnowledgeForCategory("kitchen");
  assert.ok(kitchen.some((r) => r.preference === "soft_morning_light"));
  console.log("✔ query by category — kitchen and medical rules retrieved");
}

function testRulesForAgent() {
  const lightingRules = getRulesForAgent("lighting-director");
  assert.ok(lightingRules.length >= 2);
  const compositionRules = getRulesForAgent("composition-director");
  assert.ok(compositionRules.some((r) => r.preference === "large_negative_space"));
  console.log("✔ unified knowledge — same base shared across agents");
}

function testKnowledgeSupportsDecision() {
  const result = knowledgeSupportsDecision({
    category: "cosmetics",
    domain: KnowledgeDomain.LIGHTING,
    preference: "soft_lighting",
  });
  assert.equal(result.supported, true);
  assert.ok(result.chain?.reason.includes("Luxury"));
  console.log("✔ knowledge supports decision — luxury cosmetics soft lighting is a rule, not LLM opinion");
}

function testExplainableKnowledge() {
  const rules = getSeedKnowledgeRules();
  const violations = validateExplainableKnowledge(rules);
  assert.equal(violations.length, 0);
  const badRule = {
    ...rules[0],
    id: "bad-rule",
    reason: "",
    evidenceSources: [],
  };
  assert.ok(validateKnowledgeRule(badRule).some((v) => v.code === "UNEXPLAINABLE_RULE"));
  console.log("✔ explainable knowledge — every rule has reason and evidence source");
}

function testKnowledgeIndependence() {
  const rules = getSeedKnowledgeRules();
  const violations = validateKnowledgeIndependence(rules);
  assert.equal(violations.length, 0);
  const providerRule = {
    ...rules[0],
    id: "provider-bound",
    preference: "flux photorealistic 8k",
  };
  assert.ok(validateKnowledgeRule(providerRule).some((v) => v.code === "PROVIDER_DEPENDENCY"));
  console.log("✔ knowledge independence — no LLM, provider, or prompt dependency");
}

function testKnowledgeReusability() {
  const rules = getSeedKnowledgeRules();
  const violations = validateKnowledgeReusability(rules);
  assert.equal(violations.length, 0);
  const premium = rules.find((r) => r.id === "premium-large-negative-space")!;
  assert.ok(premium.applicableAgents.length >= 3);
  console.log("✔ knowledge reusability — premium negative space used by multiple agents");
}

function testUnifiedKnowledgeBase() {
  const violations = validateUnifiedKnowledgeBase(getSeedKnowledgeRules());
  assert.equal(violations.length, 0);
  console.log("✔ unified knowledge base — all creative directors share common rules");
}

function testPromptOnlyKnowledgeFails() {
  const report = validateDesignKnowledgePhilosophy({
    promptEmbeddedRules: ["use beautiful stunning 8k hyper realistic photo"],
    llmOnlyDecision: true,
    agentId: "lighting-director",
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "PROMPT_ONLY_KNOWLEDGE"));
  assert.ok(report.violations.some((v) => v.code === "LLM_RANDOM_KNOWLEDGE"));
  console.log("✔ prompt-only and LLM-random knowledge are architecturally invalid");
}

function testValidatePhilosophy() {
  const report = validateDesignKnowledgePhilosophy();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.knowledgeBeforeGeneration, true);
  assert.equal(report.unifiedBase, true);
  assert.equal(report.explainable, true);
  assert.equal(report.independent, true);
  assert.equal(report.violations.length, 0);
  console.log("✔ design knowledge philosophy validation passes for seed knowledge base");
}

function testHybridKnowledgeOrigin() {
  const premium = getSeedKnowledgeRules().find((r) => r.origin === KnowledgeOrigin.HYBRID)!;
  assert.ok(premium);
  assert.equal(premium.id, "premium-large-negative-space");
  console.log("✔ human + AI knowledge — expert curated and platform learning combined");
}

function testRunDesignKnowledgePhilosophy() {
  const report = runDesignKnowledgePhilosophy({});
  assert.equal(report.valid, true);
  assertDesignKnowledgePhilosophy();
  console.log("✔ runDesignKnowledgePhilosophy entry point works");
}

function testFailureCodes() {
  assert.equal(isDesignKnowledgePhilosophyFailure("PROMPT_ONLY_KNOWLEDGE"), true);
  assert.equal(isDesignKnowledgePhilosophyFailure("UNKNOWN"), false);
  console.log("✔ design knowledge philosophy failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testCorePhilosophy();
  testKnowledgeBeforeGeneration();
  testKnowledgePriorityOverLlm();
  testSeedKnowledgeRules();
  testStructuredKnowledgeChain();
  testQueryKnowledgeForCategory();
  testRulesForAgent();
  testKnowledgeSupportsDecision();
  testExplainableKnowledge();
  testKnowledgeIndependence();
  testKnowledgeReusability();
  testUnifiedKnowledgeBase();
  testPromptOnlyKnowledgeFails();
  testValidatePhilosophy();
  testHybridKnowledgeOrigin();
  testRunDesignKnowledgePhilosophy();
  testFailureCodes();
  console.log("\ndesign-knowledge-philosophy.spec.ts — all passed");
}

run();
