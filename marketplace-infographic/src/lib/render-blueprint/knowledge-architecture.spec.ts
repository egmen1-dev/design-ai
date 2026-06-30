/**
 * DESIGN AI v18 — Knowledge Architecture tests (Chapter 5.2)
 */
import assert from "node:assert/strict";
import {
  KNOWLEDGE_ARCHITECTURE_VERSION,
  KNOWLEDGE_ARCHITECTURE_GOLDEN_RULE,
  KNOWLEDGE_ENGINE_MODULES,
  KnowledgeModule,
  KnowledgeCategory,
  KnowledgeRelationshipType,
  AGENT_KNOWLEDGE_ACCESS,
  knowledgeObjectFromRule,
  buildHierarchyPath,
  buildSeedKnowledgeGraph,
  buildPhotographyHierarchyObjects,
  publishKnowledgeVersion,
  getAgentKnowledgeModules,
  queryKnowledge,
  getSemanticNeighbors,
  validateKnowledgeObject,
  validateKnowledgeConsistency,
  validateImmutableVersioning,
  validateKnowledgeArchitecture,
  assertKnowledgeArchitecture,
  runKnowledgeArchitecture,
  isKnowledgeArchitectureFailure,
  getSeedKnowledgeRules,
  EvidenceLevel,
} from "./index";

function testGoldenRule() {
  assert.ok(KNOWLEDGE_ARCHITECTURE_GOLDEN_RULE.includes("not a collection of documents"));
  assert.ok(KNOWLEDGE_ARCHITECTURE_GOLDEN_RULE.includes("knowledge graph"));
  assert.equal(KNOWLEDGE_ARCHITECTURE_VERSION, "5.2.0");
  console.log("✔ golden rule — interconnected knowledge objects, not documents");
}

function testKnowledgeEngineModules() {
  assert.ok(KNOWLEDGE_ENGINE_MODULES.length >= 12);
  assert.ok(KNOWLEDGE_ENGINE_MODULES.includes(KnowledgeModule.PHOTOGRAPHY));
  assert.ok(KNOWLEDGE_ENGINE_MODULES.includes(KnowledgeModule.PATTERN_LIBRARY));
  assert.ok(KNOWLEDGE_ENGINE_MODULES.includes(KnowledgeModule.LEARNING));
  console.log("✔ high-level architecture — 12 independent knowledge modules");
}

function testKnowledgeObjectStructure() {
  const rule = getSeedKnowledgeRules()[0];
  const obj = knowledgeObjectFromRule(rule);
  assert.equal(obj.type, "design_rule");
  assert.ok(obj.rules.length >= 1);
  assert.ok(obj.examples.length >= 1);
  assert.ok(obj.sources.length >= 1);
  assert.equal(obj.metadata.immutable, true);
  assert.ok(obj.hierarchyPath.length >= 2);
  assert.ok(obj.confidence >= 0 && obj.confidence <= 1);
  console.log("✔ knowledge object — rules, examples, sources, metadata, hierarchy");
}

function testPhotographyHierarchy() {
  const nodes = buildPhotographyHierarchyObjects();
  const soft = nodes.find((n) => n.id === "photography-soft-lighting")!;
  assert.ok(soft.hierarchyPath.includes("Photography/Lighting/Soft Lighting"));
  console.log("✔ knowledge hierarchy — photography → lighting → soft lighting → window");
}

function testSemanticGraph() {
  const graph = buildSeedKnowledgeGraph();
  assert.ok(graph.relationships.length >= 3);
  const luxuryNeighbors = getSemanticNeighbors("luxury-cosmetics-soft-lighting", graph);
  assert.ok(luxuryNeighbors.some((r) => r.type === KnowledgeRelationshipType.SUPPORTS));
  console.log("✔ semantic connections — luxury supports premium, graph not flat rule list");
}

function testImmutableVersioning() {
  const rule = getSeedKnowledgeRules()[0];
  const v1 = knowledgeObjectFromRule(rule);
  const v2 = publishKnowledgeVersion(v1, { description: "Updated luxury lighting guidance", confidence: 0.95 });
  assert.equal(v2.version, 2);
  assert.equal(v2.metadata.previousVersionId, v1.id);
  assert.equal(v1.version, 1);
  const violations = validateImmutableVersioning(v1, v2);
  assert.equal(violations.length, 0);
  console.log("✔ immutable knowledge — v1 unchanged, v2 published with version link");
}

function testAgentScopedAccess() {
  const lightingModules = getAgentKnowledgeModules("lighting-director");
  assert.ok(lightingModules.includes(KnowledgeModule.PHOTOGRAPHY));
  assert.ok(lightingModules.includes(KnowledgeModule.PSYCHOLOGY));
  assert.ok(!lightingModules.includes(KnowledgeModule.TYPOGRAPHY));

  const result = queryKnowledge({
    domain: "lighting",
    agentId: "lighting-director",
  });
  assert.equal(result.scopedToAgent, true);
  assert.ok(result.objects.length < result.totalAvailable);
  assert.ok(!result.objects.some((o) => o.module === KnowledgeModule.TYPOGRAPHY));
  console.log("✔ knowledge access — lighting director gets photography/psychology, not typography");
}

function testKnowledgeApi() {
  const result = queryKnowledge({
    domain: "kitchen",
    category: "kitchen",
    filters: { minConfidence: 0.8, marketplace: "WB" },
  });
  assert.ok(result.objects.some((o) => o.id === "kitchen-soft-morning-light"));
  assert.ok(result.query.domain === "kitchen");
  console.log("✔ knowledge API — query returns structured KnowledgeResult, not files");
}

function testCompositionDirectorModules() {
  const modules = AGENT_KNOWLEDGE_ACCESS["composition-director"];
  assert.ok(modules.includes(KnowledgeModule.COMPOSITION));
  assert.ok(modules.includes(KnowledgeModule.TYPOGRAPHY));
  assert.ok(modules.includes(KnowledgeModule.MARKETPLACE));
  console.log("✔ modular structure — composition uses composition + typography + marketplace independently");
}

function testHierarchyPathBuilder() {
  const path = buildHierarchyPath("lighting", "soft_morning_light");
  assert.equal(path[0], "lighting");
  assert.ok(path[path.length - 1].includes("Morning"));
  console.log("✔ hierarchy path — multi-level detail from domain and preference");
}

function testValidateKnowledgeObject() {
  const obj = knowledgeObjectFromRule(getSeedKnowledgeRules()[0]);
  assert.equal(validateKnowledgeObject(obj).length, 0);
  console.log("✔ knowledge object validation — consistent structure and metadata");
}

function testValidateConsistency() {
  const graph = buildSeedKnowledgeGraph();
  const violations = validateKnowledgeConsistency(graph);
  assert.equal(violations.length, 0);
  console.log("✔ knowledge consistency — unified confidence format and metadata");
}

function testFullBaseLeakFails() {
  const report = validateKnowledgeArchitecture({
    fullBaseLeak: true,
    agentId: "lighting-director",
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "FULL_BASE_LEAK"));
  console.log("✔ full base leak — agents must not receive entire knowledge base");
}

function testValidateArchitecture() {
  const report = validateKnowledgeArchitecture();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.modular, true);
  assert.equal(report.versioned, true);
  assert.equal(report.graphConnected, true);
  assert.ok(Object.keys(report.graph.objects).length >= 8);
  console.log("✔ knowledge architecture validation passes for seed graph");
}

function testMedicalCategory() {
  const result = queryKnowledge({ category: "medical" });
  const medical = result.objects.find((o) => o.id === "medical-white-background");
  assert.ok(medical);
  assert.equal(medical!.category, KnowledgeCategory.DESIGN);
  console.log("✔ category query — medical white background knowledge object retrieved");
}

function testRunKnowledgeArchitecture() {
  const report = runKnowledgeArchitecture({});
  assert.equal(report.valid, true);
  assertKnowledgeArchitecture();
  console.log("✔ runKnowledgeArchitecture entry point works");
}

function testFailureCodes() {
  assert.equal(isKnowledgeArchitectureFailure("MISSING_SEMANTIC_LINKS"), true);
  assert.equal(isKnowledgeArchitectureFailure("UNKNOWN"), false);
  console.log("✔ knowledge architecture failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testKnowledgeEngineModules();
  testKnowledgeObjectStructure();
  testPhotographyHierarchy();
  testSemanticGraph();
  testImmutableVersioning();
  testAgentScopedAccess();
  testKnowledgeApi();
  testCompositionDirectorModules();
  testHierarchyPathBuilder();
  testValidateKnowledgeObject();
  testValidateConsistency();
  testFullBaseLeakFails();
  testValidateArchitecture();
  testMedicalCategory();
  testRunKnowledgeArchitecture();
  testFailureCodes();
  console.log("\nknowledge-architecture.spec.ts — all passed");
}

run();
