/**
 * DESIGN AI v18 — Agent Memory Model tests (Chapter 7.5)
 */
import assert from "node:assert/strict";
import {
  AGENT_MEMORY_MODEL_VERSION,
  AGENT_MEMORY_MODEL_GOLDEN_RULE,
  AGENT_MEMORY_TIER_STACK,
  AGENT_MEMORY_LIFECYCLE_FLOW,
  AGENT_MEMORY_OPTIMIZATION_STRATEGIES,
  AgentMemoryTier,
  AgentMemoryModelOwner,
  AgentMemoryAccessPermission,
  AgentMemoryLifecycleStage,
  getAgentMemoryTierAccess,
  getMemoryTierOwner,
  tierIsAgentMutable,
  buildMemoryConsistencyVersions,
  buildMemorySnapshot,
  validateMemoryTierStructure,
  validateMemoryTierAccess,
  validateDesignMemoryDirectWrite,
  validateAnalyticsNotInDecision,
  validateWorkingMemoryReleased,
  validateMemoryIsolation,
  mapMemoryTierToChapter47Layer,
  buildAgentContextPackage,
  buildAgentMemoryPackage,
  createEmptyRenderBlueprint,
  executeAgentMemorySession,
  validateAgentMemoryModel,
  validateAgentMemoryModelWithExecution,
  assertAgentMemoryModel,
  runAgentMemoryModel,
  isAgentMemoryModelFailure,
  getAgentMemoryTier,
  MemoryLayer,
  StoryType,
  frozenTestBlueprint,
  BlueprintLifecycle,
} from "./index";

function testTierCatalog() {
  assert.equal(AGENT_MEMORY_TIER_STACK.length, 6);
  assert.equal(AGENT_MEMORY_MODEL_VERSION, "7.5.0");
  assert.equal(validateMemoryTierStructure().length, 0);
  console.log("✔ memory tier catalog — 6 distinct tiers");
}

function testGoldenRule() {
  assert.ok(AGENT_MEMORY_MODEL_GOLDEN_RULE.includes("remember only what it needs"));
  console.log("✔ golden rule — agent remembers now, platform remembers tomorrow");
}

function testTierOwnership() {
  assert.equal(getMemoryTierOwner(AgentMemoryTier.WORKING), AgentMemoryModelOwner.AGENT);
  assert.equal(getMemoryTierOwner(AgentMemoryTier.PIPELINE), AgentMemoryModelOwner.PIPELINE_ORCHESTRATOR);
  assert.equal(getMemoryTierOwner(AgentMemoryTier.DESIGN), AgentMemoryModelOwner.LEARNING_ENGINE);
  assert.equal(getMemoryTierOwner(AgentMemoryTier.KNOWLEDGE), AgentMemoryModelOwner.KNOWLEDGE_ENGINE);
  assert.equal(getMemoryTierOwner(AgentMemoryTier.ANALYTICS), AgentMemoryModelOwner.OBSERVABILITY_PLATFORM);
  assert.equal(tierIsAgentMutable(AgentMemoryTier.WORKING), true);
  assert.equal(tierIsAgentMutable(AgentMemoryTier.DESIGN), false);
  console.log("✔ each memory tier has a defined owner and mutability policy");
}

function testMemoryLifecycleFlow() {
  assert.equal(AGENT_MEMORY_LIFECYCLE_FLOW.length, 5);
  assert.equal(AGENT_MEMORY_LIFECYCLE_FLOW[0], AgentMemoryLifecycleStage.WORKING);
  assert.equal(AGENT_MEMORY_LIFECYCLE_FLOW[4], AgentMemoryLifecycleStage.KNOWLEDGE_UPDATE);
  console.log("✔ memory lifecycle — working → pipeline → learning → design → knowledge");
}

function testConsistencyVersions() {
  const versions = buildMemoryConsistencyVersions();
  assert.equal(versions.knowledgeVersion, "5.1");
  assert.equal(versions.patternVersion, "18.4");
  assert.equal(versions.marketplaceVersion, "7.2");
  console.log("✔ memory consistency — knowledge, pattern, marketplace versions tracked");
}

function testMemorySnapshot() {
  const bp = createEmptyRenderBlueprint({ category: "kitchen", seed: 1 });
  const ctx = buildAgentContextPackage({ blueprint: bp, agentId: "visual-story-director" });
  const versions = buildMemoryConsistencyVersions();
  const snapshot = buildMemorySnapshot({
    pipelineContext: ctx,
    constraints: bp.constraints.set,
    versions,
    decisionReports: ["Selected premium lifestyle story"],
  });
  assert.ok(snapshot.snapshotId);
  assert.equal(snapshot.blueprintId, bp.meta.id);
  assert.equal(snapshot.decisionReports.length, 1);
  console.log("✔ memory snapshot — pipeline context, blueprint, versions, reports");
}

function testStoryDirectorAccess() {
  const access = getAgentMemoryTierAccess("visual-story-director");
  assert.equal(access.tiers[AgentMemoryTier.PIPELINE], AgentMemoryAccessPermission.READ);
  assert.equal(access.tiers[AgentMemoryTier.DESIGN], AgentMemoryAccessPermission.READ);
  assert.equal(access.tiers[AgentMemoryTier.KNOWLEDGE], AgentMemoryAccessPermission.READ);
  assert.equal(access.tiers[AgentMemoryTier.WORKING], AgentMemoryAccessPermission.WRITE);
  assert.equal(access.tiers[AgentMemoryTier.ANALYTICS], AgentMemoryAccessPermission.NONE);
  console.log("✔ story director reads pipeline, design, knowledge — no analytics");
}

function testUnauthorizedTierAccess() {
  const violations = validateMemoryTierAccess("lighting-director", AgentMemoryTier.DESIGN, "read");
  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, "UNAUTHORIZED_TIER_ACCESS");
  console.log("✔ lighting director cannot read design memory");
}

function testDesignMemoryDirectWriteForbidden() {
  const violations = validateDesignMemoryDirectWrite("visual-story-director", true);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, "DESIGN_MEMORY_DIRECT_WRITE");
  console.log("✔ agents cannot write design memory directly");
}

function testAnalyticsNotInDecision() {
  const violations = validateAnalyticsNotInDecision("visual-story-director", true);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, "ANALYTICS_IN_DECISION");
  console.log("✔ analytics memory never feeds decision engine");
}

function testWorkingMemoryReleased() {
  const clean = validateWorkingMemoryReleased(
    { locals: {}, scratch: [], reasoningNotes: [], tempScores: {} },
    false,
  );
  assert.equal(clean.length, 0);

  const leak = validateWorkingMemoryReleased(
    { locals: { x: 1 }, scratch: [], reasoningNotes: [], tempScores: {} },
    false,
  );
  assert.equal(leak.length, 1);
  assert.equal(leak[0].code, "WORKING_MEMORY_LEAK");
  console.log("✔ working memory must be destroyed after agent completes");
}

function testMemoryIsolation() {
  const bp = createEmptyRenderBlueprint({ category: "kitchen", seed: 2 });
  const ctxA = buildAgentContextPackage({ blueprint: bp, agentId: "visual-story-director" });
  const ctxB = buildAgentContextPackage({ blueprint: bp, agentId: "scene-director" });
  const pkgA = buildAgentMemoryPackage({ agentId: "visual-story-director", working: ctxA });
  const pkgB = buildAgentMemoryPackage({ agentId: "scene-director", working: ctxB });
  assert.equal(validateMemoryIsolation([pkgA, pkgB]).length, 0);

  const sharedCtx = buildAgentContextPackage({ blueprint: bp, agentId: "scene-director" });
  const pkgShared = buildAgentMemoryPackage({ agentId: "scene-director", working: sharedCtx });
  const pkgSame = buildAgentMemoryPackage({ agentId: "lighting-director", working: sharedCtx });
  const shared = validateMemoryIsolation([pkgShared, pkgSame]);
  assert.equal(shared.length, 1);
  assert.equal(shared[0].code, "SHARED_WORKING_MEMORY");
  console.log("✔ working memory isolated — agents never share scratch space");
}

function testChapter47Mapping() {
  assert.equal(mapMemoryTierToChapter47Layer(AgentMemoryTier.WORKING), MemoryLayer.RUNTIME);
  assert.equal(mapMemoryTierToChapter47Layer(AgentMemoryTier.PIPELINE), MemoryLayer.WORKING);
  assert.equal(mapMemoryTierToChapter47Layer(AgentMemoryTier.DESIGN), MemoryLayer.LEARNING);
  const tier = getAgentMemoryTier(AgentMemoryTier.KNOWLEDGE)!;
  assert.equal(tier.lifetime, "long_term");
  console.log("✔ Ch 7.5 tiers map to Ch 4.7 memory layers");
}

function testOptimizationStrategies() {
  assert.equal(AGENT_MEMORY_OPTIMIZATION_STRATEGIES.length, 5);
  console.log("✔ memory optimization — compression, lazy load, semantic retrieval");
}

async function testKitchenExecution() {
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.lifecycle.stage = BlueprintLifecycle.STORY_DEFINED;
  const report = await executeAgentMemorySession({
    agentId: "visual-story-director",
    blueprint: bp,
  });
  assert.equal(report.valid, true, report.violations.map((v) => v.message).join("; "));
  assert.equal(report.workingMemoryReleased, true);
  assert.equal(report.statelessVerified, true);
  assert.ok(report.snapshot);
  assert.ok(report.tiersAccessed.includes(AgentMemoryTier.WORKING));
  assert.equal(report.lifecycleStagesCompleted.length, 5);
  console.log("✔ kitchen execution — story director memory session with snapshot and release");
}

async function testRetainWorkingMemoryFails() {
  const report = await executeAgentMemorySession({
    agentId: "visual-story-director",
    context: { retainWorkingMemory: true },
  });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "WORKING_MEMORY_LEAK"));
  console.log("✔ retaining working memory fails stateless validation");
}

async function testValidateWithExecution() {
  const report = await validateAgentMemoryModelWithExecution();
  assert.equal(report.valid, true);
  assert.equal(report.tiersComplete, true);
  assert.equal(report.kitchenExecutionValid, true);
  assertAgentMemoryModel();
  console.log("✔ full agent memory model validation passes");
}

async function testRunEntryPoint() {
  const report = await runAgentMemoryModel();
  assert.equal(report.valid, true);
  console.log("✔ runAgentMemoryModel entry point works");
}

function testFailureCodes() {
  assert.equal(isAgentMemoryModelFailure("WORKING_MEMORY_LEAK"), true);
  assert.equal(isAgentMemoryModelFailure("UNKNOWN"), false);
  console.log("✔ memory model failure codes are catalogued");
}

async function run() {
  testTierCatalog();
  testGoldenRule();
  testTierOwnership();
  testMemoryLifecycleFlow();
  testConsistencyVersions();
  testMemorySnapshot();
  testStoryDirectorAccess();
  testUnauthorizedTierAccess();
  testDesignMemoryDirectWriteForbidden();
  testAnalyticsNotInDecision();
  testWorkingMemoryReleased();
  testMemoryIsolation();
  testChapter47Mapping();
  testOptimizationStrategies();
  await testKitchenExecution();
  await testRetainWorkingMemoryFails();
  await testValidateWithExecution();
  await testRunEntryPoint();
  testFailureCodes();
  console.log("\nagent-memory-model.spec.ts — all passed");
}

run();
