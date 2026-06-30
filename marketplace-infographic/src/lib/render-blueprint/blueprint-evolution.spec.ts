/**
 * DESIGN AI v18 — Blueprint Evolution tests (Chapter 4.22)
 */
import assert from "node:assert/strict";
import {
  BLUEPRINT_EVOLUTION_GOLDEN_RULE,
  BLUEPRINT_EVOLUTION_VERSION,
  EVOLUTION_PIPELINE,
  EvolutionLayer,
  SectionCompletenessState,
  LightingStyle,
  StoryType,
  SceneType,
  EnvironmentType,
  SurfaceMaterialId,
  CameraStyle,
  buildMutationHistory,
  computeEvolutionCompleteness,
  computeCompletenessScore,
  buildEvolutionSnapshot,
  validateNoBackwardModification,
  validateIncrementalGrowth,
  validateRetryEvolution,
  validateDependencyOrder,
  validateConsistency,
  validateRenderReadiness,
  validateBlueprintEvolution,
  buildEvolutionExplainability,
  evolutionStageForSection,
  layersPresent,
  isEvolutionFailure,
  frozenTestBlueprint,
  BlueprintLifecycle,
  SectionState,
} from "./index";
import type { RenderBlueprint } from "./types";

function evolvedBlueprint(): RenderBlueprint {
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.story.emotionalTone = "luxury";
  bp.scene.sceneType = SceneType.LUXURY;
  bp.scene.environment = EnvironmentType.LUXURY_INTERIOR;
  bp.composition.template = "hero_right";
  bp.composition.templateId = "hero_right";
  bp.photography.photographyStyle = "premium_hero";
  bp.lighting.lightingStyle = LightingStyle.LUXURY_WARM;
  bp.lighting.lightingScheme = "luxury_side_light";
  bp.camera.cameraStyle = CameraStyle.PREMIUM_HERO;
  bp.materials.materialWorld = SurfaceMaterialId.WHITE_MARBLE;
  bp.materials.surfaceMaterials = [
    { id: SurfaceMaterialId.WHITE_MARBLE, role: "wall", finish: "polished" },
  ];
  bp.validation.professionalScore = 88;
  bp.lifecycle.stage = BlueprintLifecycle.FROZEN;
  bp.lifecycle.sections.story = SectionState.LOCKED;
  bp.lifecycle.sections.scene = SectionState.LOCKED;
  bp.lifecycle.sections.composition = SectionState.VALIDATED;
  bp.lifecycle.sections.photography = SectionState.READY;
  bp.lifecycle.sections.lighting = SectionState.READY;
  bp.lifecycle.sections.camera = SectionState.READY;
  bp.lifecycle.sections.materials = SectionState.READY;
  bp.lifecycle.sections.validation = SectionState.VALIDATED;
  bp.meta.audit = [
    { agentId: "visual-story-director", section: "story", action: "set", at: 1000 },
    { agentId: "scene-director", section: "scene", action: "set", at: 2000 },
    { agentId: "composition-director", section: "composition", action: "set", at: 3000 },
    { agentId: "commercial-photo-director", section: "photography", action: "set", at: 4000 },
    { agentId: "lighting-director", section: "lighting", action: "set", at: 5000 },
    { agentId: "camera-director", section: "camera", action: "set", at: 6000 },
    { agentId: "material-director", section: "materials", action: "set", at: 7000 },
    { agentId: "chief-design-director", section: "validation", action: "set", at: 8000 },
  ];
  return bp;
}

function testGoldenRule() {
  assert.ok(BLUEPRINT_EVOLUTION_GOLDEN_RULE.includes("never created whole"));
  assert.equal(BLUEPRINT_EVOLUTION_VERSION, "4.22.0");
  console.log("✔ golden rule — blueprint evolves incrementally, not all at once");
}

function testEvolutionPipelineOrder() {
  assert.equal(EVOLUTION_PIPELINE[0].section, "story");
  assert.equal(EVOLUTION_PIPELINE[1].section, "scene");
  assert.equal(EVOLUTION_PIPELINE.at(-1)?.section, "validation");
  assert.equal(evolutionStageForSection("lighting")?.layer, EvolutionLayer.LIGHTING);
  console.log("✔ evolution pipeline follows story → scene → layout → photography → render");
}

function testIncrementalGrowth() {
  const step1 = frozenTestBlueprint();
  step1.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  step1.story.emotionalTone = "luxury";
  step1.meta.audit = [{ agentId: "visual-story-director", section: "story", action: "set", at: 1000 }];

  const step2 = structuredClone(step1);
  step2.scene.sceneType = SceneType.LUXURY;
  step2.scene.environment = EnvironmentType.LUXURY_INTERIOR;
  step2.meta.audit = [
    ...(step2.meta.audit ?? []),
    { agentId: "scene-director", section: "scene", action: "set", at: 2000 },
  ];

  const beforeScore = computeCompletenessScore(computeEvolutionCompleteness(step1));
  const afterScore = computeCompletenessScore(computeEvolutionCompleteness(step2));
  assert.ok(afterScore >= beforeScore);
  assert.equal(validateIncrementalGrowth(step1, step2).length, 0);
  console.log("✔ incremental growth adds scene without destroying story");
}

function testKnowledgeLayers() {
  const bp = evolvedBlueprint();
  const layers = layersPresent(bp);
  assert.ok(layers.includes(EvolutionLayer.BUSINESS));
  assert.ok(layers.includes(EvolutionLayer.SPATIAL));
  assert.ok(layers.includes(EvolutionLayer.LIGHTING));
  console.log("✔ blueprint knowledge is layered — business, spatial, lighting");
}

function testBackwardModificationForbidden() {
  const bp = evolvedBlueprint();
  const violations = validateNoBackwardModification("camera-director", ["story"], bp);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, "BACKWARD_MODIFICATION");
  console.log("✔ camera director cannot rewrite story section");
}

function testMutationHistoryVersioning() {
  const bp = evolvedBlueprint();
  const retryBp = structuredClone(bp);
  retryBp.meta.audit = [
    ...(retryBp.meta.audit ?? []),
    { agentId: "lighting-director", section: "lighting", action: "patch", at: 9000 },
  ];

  const history = buildMutationHistory(retryBp);
  const lightingVersions = history.filter((h) => h.section === "lighting");
  assert.equal(lightingVersions.length, 2);
  assert.equal(lightingVersions[1].version, 2);
  console.log("✔ mutation history tracks lighting v1 → v2 on retry");
}

function testRetryEvolutionLocalized() {
  const before = evolvedBlueprint();
  const after = structuredClone(before);
  after.lighting.lightingStyle = LightingStyle.NATURAL_WINDOW;
  after.meta.revision += 1;
  after.meta.audit = [
    ...(after.meta.audit ?? []),
    { agentId: "lighting-director", section: "lighting", action: "patch", at: 9500 },
  ];

  const violations = validateRetryEvolution(before, after, "lighting");
  assert.equal(violations.length, 0);

  const storyHistoryBefore = buildMutationHistory(before).filter((h) => h.section === "story").length;
  const storyHistoryAfter = buildMutationHistory(after).filter((h) => h.section === "story").length;
  assert.equal(storyHistoryBefore, storyHistoryAfter);
  console.log("✔ retry evolves lighting v2 while story v1 and scene v1 remain");
}

function testDependencyOrderForwardOnly() {
  const bp = evolvedBlueprint();
  const violations = validateDependencyOrder(bp);
  assert.equal(violations.length, 0);
  console.log("✔ dependencies flow forward — lighting never depends backward on story edits");
}

function testIncompleteSectionDetected() {
  const bp = evolvedBlueprint();
  delete (bp.story as { storyType?: string }).storyType;
  const violations = validateConsistency(bp).violations;
  assert.ok(violations.some((v) => v.code === "INCOMPLETE_SECTION"));
  console.log("✔ incomplete sections are detected — no unknown placeholders allowed");
}

function testUnknownSectionRejected() {
  const bp = evolvedBlueprint();
  (bp.lighting as { lightingStyle: string }).lightingStyle = "unknown";
  const completeness = computeEvolutionCompleteness(bp);
  assert.ok(completeness.some((c) => c.section === "lighting" && c.state === SectionCompletenessState.ERROR));
  console.log("✔ unknown section values are rejected");
}

function testRenderReadiness() {
  const bp = evolvedBlueprint();
  const report = validateRenderReadiness(bp);
  assert.equal(report.ready, true);
  assert.equal(report.missingSections.length, 0);
  assert.ok(report.completenessScore >= 85);
  console.log("✔ render-ready blueprint has all mandatory sections and no conflicts");
}

function testExplainabilityTrace() {
  const bp = evolvedBlueprint();
  const trace = buildEvolutionExplainability(bp);
  assert.ok(trace.length >= 8);
  assert.ok(trace.some((t) => t.section === "story" && t.version === 1));
  assert.ok(trace.every((t) => t.reason.includes("v")));
  console.log("✔ evolution explainability restores agent, version, and timestamp chain");
}

function testEvolutionSnapshot() {
  const bp = evolvedBlueprint();
  const snapshot = buildEvolutionSnapshot(bp);
  assert.ok(snapshot.completeness >= 85);
  assert.ok(snapshot.filledSections.includes("story"));
  assert.ok(snapshot.filledSections.includes("lighting"));
  console.log("✔ evolution snapshot captures revision and filled sections");
}

function testProviderIndependence() {
  const bp = evolvedBlueprint();
  const report = validateBlueprintEvolution(bp);
  assert.equal(report.providerIndependent, true);
  console.log("✔ blueprint evolution remains independent from render provider");
}

function testFullEvolutionReport() {
  const bp = evolvedBlueprint();
  const report = validateBlueprintEvolution(bp);
  assert.equal(report.valid, true);
  assert.ok(report.mutationHistory.length >= 8);
  assert.equal(report.renderReadiness.ready, true);
  console.log("✔ blueprint evolution report matches Chapter 4.22 contract");
}

function testFailureCodes() {
  assert.equal(isEvolutionFailure("BACKWARD_MODIFICATION"), true);
  assert.equal(isEvolutionFailure("NOT_REAL"), false);
  console.log("✔ evolution failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testEvolutionPipelineOrder();
  testIncrementalGrowth();
  testKnowledgeLayers();
  testBackwardModificationForbidden();
  testMutationHistoryVersioning();
  testRetryEvolutionLocalized();
  testDependencyOrderForwardOnly();
  testIncompleteSectionDetected();
  testUnknownSectionRejected();
  testRenderReadiness();
  testExplainabilityTrace();
  testEvolutionSnapshot();
  testProviderIndependence();
  testFullEvolutionReport();
  testFailureCodes();
  console.log("\nblueprint-evolution.spec.ts — all passed");
}

run();
