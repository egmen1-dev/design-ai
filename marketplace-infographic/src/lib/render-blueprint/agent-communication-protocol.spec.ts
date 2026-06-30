/**
 * DESIGN AI v18 — Agent Communication Protocol tests (Chapter 4.21)
 */
import assert from "node:assert/strict";
import {
  AGENT_COMMUNICATION_GOLDEN_RULE,
  AGENT_COMMUNICATION_PROTOCOL_VERSION,
  COMMUNICATION_MODEL,
  CommunicationPrinciple,
  LightingStyle,
  StoryType,
  SceneType,
  EnvironmentType,
  SurfaceMaterialId,
  CameraStyle,
  validateNoDirectAgentCalls,
  validateWritePermissions,
  validateReadPermissions,
  validateStructuredCommunication,
  validateSectionVersioning,
  validateImmutability,
  validatePublicationExplainability,
  validateOwnershipUniqueness,
  validateErrorIsolation,
  validateCommunicationProtocol,
  buildSectionOwnershipMap,
  buildSectionVersionHistory,
  buildAgentPublication,
  agentReadsOnlyRequiredSections,
  agentWritesOnlyOwnedSections,
  supportsLooseCoupling,
  isCommunicationFailure,
  frozenTestBlueprint,
  BlueprintLifecycle,
  SectionState,
} from "./index";

function protocolBlueprint() {
  const bp = frozenTestBlueprint();
  bp.story.storyType = StoryType.PREMIUM_LIFESTYLE;
  bp.story.emotionalTone = "luxury";
  bp.scene.sceneType = SceneType.LUXURY;
  bp.scene.environment = EnvironmentType.LUXURY_INTERIOR;
  bp.lighting.lightingStyle = LightingStyle.LUXURY_WARM;
  bp.lighting.lightingScheme = "luxury_side_light";
  bp.camera.cameraStyle = CameraStyle.PREMIUM_HERO;
  bp.materials.materialWorld = SurfaceMaterialId.WHITE_MARBLE;
  bp.materials.surfaceMaterials = [
    { id: SurfaceMaterialId.WHITE_MARBLE, role: "wall", finish: "polished" },
  ];
  bp.photography.photographyStyle = "premium_hero";
  bp.lifecycle.stage = BlueprintLifecycle.PHOTO_DEFINED;
  bp.lifecycle.sections.story = SectionState.VALIDATED;
  bp.lifecycle.sections.scene = SectionState.READY;
  bp.lifecycle.sections.lighting = SectionState.READY;
  bp.meta.audit = [
    { agentId: "visual-story-director", section: "story", action: "set", at: 1000 },
    { agentId: "scene-director", section: "scene", action: "set", at: 2000 },
    { agentId: "lighting-director", section: "lighting", action: "patch", at: 3000 },
  ];
  return bp;
}

function testGoldenRule() {
  assert.ok(AGENT_COMMUNICATION_GOLDEN_RULE.includes("never communicate"));
  assert.equal(AGENT_COMMUNICATION_PROTOCOL_VERSION, "4.21.0");
  console.log("✔ golden rule — agents communicate only through blueprint");
}

function testCommunicationModel() {
  assert.equal(COMMUNICATION_MODEL, "agent-section-blueprint-next-agent");
  console.log("✔ communication model is agent → section → blueprint → next agent");
}

function testDirectAgentCallForbidden() {
  const violations = validateNoDirectAgentCalls([
    { from: "lighting-director", to: "scene-director", method: "getScenePlan" },
  ]);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, "DIRECT_AGENT_CALL");
  assert.equal(violations[0].principle, CommunicationPrinciple.INDEPENDENT);
  console.log("✔ direct agent-to-agent calls are forbidden");
}

function testWritePermissions() {
  const violations = validateWritePermissions("camera-director", ["lighting"]);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, "FOREIGN_SECTION_WRITE");
  console.log("✔ camera director cannot write lighting section");
}

function testReadPermissions() {
  const violations = validateReadPermissions("lighting-director", ["validation"]);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, "UNAUTHORIZED_READ");
  console.log("✔ lighting director does not read unrelated validation section");
}

function testSectionOwnership() {
  const ownership = buildSectionOwnershipMap();
  const story = ownership.find((o) => o.section === "story");
  const scene = ownership.find((o) => o.section === "scene");
  const lighting = ownership.find((o) => o.section === "lighting");
  assert.equal(story?.owner, "visual-story-director");
  assert.equal(scene?.owner, "scene-director");
  assert.equal(lighting?.owner, "lighting-director");
  assert.ok(story?.readers.includes("scene-director"));
  console.log("✔ each section has a single owner with declared readers");
}

function testStructuredNotPrompt() {
  const bp = protocolBlueprint();
  const clean = validateStructuredCommunication(bp);
  assert.equal(clean.length, 0);

  const bpPrompt = protocolBlueprint();
  bpPrompt.story.narrative = "beautiful luxury product photo with stunning lighting";
  const violations = validateStructuredCommunication(bpPrompt, ["story"]);
  assert.ok(violations.some((v) => v.code === "PROMPT_SEMANTICS"));
  console.log("✔ agents exchange semantic contracts, not prompt text");
}

function testSemanticFieldsRequired() {
  const bp = protocolBlueprint();
  delete (bp.story as { storyType?: string }).storyType;
  const violations = validateStructuredCommunication(bp, ["story"]);
  assert.ok(violations.some((v) => v.code === "UNSTRUCTURED_TEXT"));
  console.log("✔ structured sections require contract fields like storyType");
}

function testSectionVersioning() {
  const bp = protocolBlueprint();
  const history = buildSectionVersionHistory(bp);
  assert.ok(history.some((h) => h.section === "story" && h.version === 1));
  assert.ok(history.some((h) => h.section === "lighting" && h.version === 1));

  const retryBp = protocolBlueprint();
  retryBp.meta.audit = [
    ...(retryBp.meta.audit ?? []),
    { agentId: "lighting-director", section: "lighting", action: "patch", at: 4000 },
  ];
  const retryHistory = buildSectionVersionHistory(retryBp);
  const lighting = retryHistory.find((h) => h.section === "lighting");
  assert.equal(lighting?.version, 2);
  console.log("✔ section versioning tracks story v1 → lighting v2 on retry");
}

function testImmutablePublishedSection() {
  const bp = protocolBlueprint();
  bp.lifecycle.sections.story = SectionState.LOCKED;
  const violations = validateImmutability(bp, "visual-story-director", ["story"]);
  assert.equal(violations.length, 1);
  assert.equal(violations[0].code, "IMMUTABLE_SECTION_MUTATION");
  console.log("✔ published story section is immutable — new version required");
}

function testExplainabilityRequired() {
  const missing = validatePublicationExplainability({
    agentId: "scene-director",
    result: { confidence: 0.9, decisionTrace: [], warnings: [] },
  });
  assert.equal(missing.length, 1);
  assert.equal(missing[0].code, "MISSING_EXPLANATION");

  const ok = validatePublicationExplainability({
    agentId: "scene-director",
    result: {
      confidence: 0.9,
      decisionTrace: ["Selected luxury interior to match premium lifestyle story"],
      warnings: [],
    },
  });
  assert.equal(ok.length, 0);
  console.log("✔ every publication requires decisionTrace explainability");
}

function testErrorIsolation() {
  const isolated = validateErrorIsolation({
    agentId: "lighting-director",
    failedSection: "lighting",
    corruptedSections: ["lighting"],
  });
  assert.equal(isolated.length, 0);

  const spread = validateErrorIsolation({
    agentId: "lighting-director",
    failedSection: "lighting",
    corruptedSections: ["lighting", "scene"],
  });
  assert.equal(spread.length, 1);
  assert.equal(spread[0].code, "ERROR_NOT_ISOLATED");
  console.log("✔ agent errors must not corrupt unrelated sections");
}

function testLooseCoupling() {
  const lightingReads = agentReadsOnlyRequiredSections("lighting-director");
  const lightingWrites = agentWritesOnlyOwnedSections("lighting-director");
  assert.ok(lightingReads.includes("scene"));
  assert.ok(!lightingReads.includes("validation"));
  assert.deepEqual(lightingWrites, ["lighting"]);

  assert.equal(
    supportsLooseCoupling({
      id: "design-memory",
      reads: ["story", "scene", "lighting", "validation"],
      writes: [],
    }),
    true,
  );
  console.log("✔ loose coupling — new agent reads/writes without changing existing agents");
}

function testFivePrinciplesReport() {
  const bp = protocolBlueprint();
  const report = validateCommunicationProtocol(bp, {
    agentId: "lighting-director",
    result: {
      confidence: 0.88,
      decisionTrace: ["Aligned warm luxury lighting with story and scene"],
      warnings: [],
    },
    mutationSections: ["lighting"],
  });

  assert.equal(report.valid, true);
  assert.equal(report.model, COMMUNICATION_MODEL);
  assert.equal(report.principles[CommunicationPrinciple.IMMUTABLE], true);
  assert.equal(report.principles[CommunicationPrinciple.STRUCTURED], true);
  assert.equal(report.principles[CommunicationPrinciple.VERSIONED], true);
  assert.equal(report.principles[CommunicationPrinciple.EXPLAINABLE], true);
  assert.equal(report.principles[CommunicationPrinciple.INDEPENDENT], true);
  console.log("✔ five principles — immutable, structured, versioned, explainable, independent");
}

function testOwnershipUniqueness() {
  const violations = validateOwnershipUniqueness();
  assert.equal(violations.length, 0);
  console.log("✔ exclusive section ownership has no conflicts");
}

function testAgentPublication() {
  const publication = buildAgentPublication(
    "scene-director",
    { confidence: 0.91, decisionTrace: ["Luxury interior matches premium story"] },
    ["scene"],
    5000,
  );
  assert.equal(publication.agentId, "scene-director");
  assert.ok(publication.decisionTrace.length >= 1);
  console.log("✔ agent publication packages section with explainability");
}

function testFailureCodes() {
  assert.equal(isCommunicationFailure("DIRECT_AGENT_CALL"), true);
  assert.equal(isCommunicationFailure("UNKNOWN"), false);
  console.log("✔ communication failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testCommunicationModel();
  testDirectAgentCallForbidden();
  testWritePermissions();
  testReadPermissions();
  testSectionOwnership();
  testStructuredNotPrompt();
  testSemanticFieldsRequired();
  testSectionVersioning();
  testImmutablePublishedSection();
  testExplainabilityRequired();
  testErrorIsolation();
  testLooseCoupling();
  testFivePrinciplesReport();
  testOwnershipUniqueness();
  testAgentPublication();
  testFailureCodes();
  console.log("\nagent-communication-protocol.spec.ts — all passed");
}

run();
