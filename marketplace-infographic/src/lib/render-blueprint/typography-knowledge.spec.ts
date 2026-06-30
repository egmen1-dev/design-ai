/**
 * DESIGN AI v18 — Typography Knowledge tests (Chapter 5.11)
 */
import assert from "node:assert/strict";
import {
  TYPOGRAPHY_KNOWLEDGE_VERSION,
  TYPOGRAPHY_KNOWLEDGE_GOLDEN_RULE,
  READABILITY_FIRST_PRINCIPLE,
  MAX_BOLD_ELEMENTS,
  RECOMMENDED_LINE_SPACING,
  TEXT_HIERARCHY_LEVELS,
  FONT_CHARACTER_GUIDANCE,
  SEED_TYPOGRAPHY_KNOWLEDGE,
  FontCharacter,
  FontWeightRole,
  TextAlignment,
  getTypographyKnowledge,
  getTextHierarchy,
  matchTypographyKnowledge,
  recommendTypographyKnowledge,
  selectFontCharacter,
  validateTypographyConsistency,
  validateTypographyBlueprint,
  applyTypographyLearningFeedback,
  validateTypographyKnowledge,
  assertTypographyKnowledge,
  runTypographyKnowledge,
  isTypographyKnowledgeFailure,
} from "./index";
import { StyleFamily } from "./style-knowledge-types";

function testGoldenRule() {
  assert.ok(TYPOGRAPHY_KNOWLEDGE_GOLDEN_RULE.includes("first seconds"));
  assert.equal(TYPOGRAPHY_KNOWLEDGE_VERSION, "5.11.0");
  console.log("✔ golden rule — typography manages perception speed and order");
}

function testReadabilityFirst() {
  const rule = getTypographyKnowledge("readability-first")!;
  assert.ok(READABILITY_FIRST_PRINCIPLE.includes("Readability"));
  assert.ok(rule.recommendation.includes("contrast"));
  console.log("✔ readability first — readability over decoration");
}

function testKnowledgeStructure() {
  const sample = SEED_TYPOGRAPHY_KNOWLEDGE[0];
  assert.ok(sample.rule);
  assert.ok(sample.purpose);
  assert.ok(sample.recommendation);
  assert.ok(sample.confidence > 0);
  console.log("✔ typography knowledge structure — rule, purpose, recommendation, confidence");
}

function testTextHierarchy() {
  const hierarchy = getTextHierarchy();
  assert.equal(hierarchy.length, 5);
  assert.equal(hierarchy[0].role, "headline");
  assert.equal(hierarchy[0].weight, FontWeightRole.HEADLINE);
  assert.equal(hierarchy[4].role, "small_notes");
  assert.deepEqual(TEXT_HIERARCHY_LEVELS, hierarchy);
  console.log("✔ text hierarchy — headline → benefit → supporting → technical → notes");
}

function testFontCharacters() {
  assert.ok(FONT_CHARACTER_GUIDANCE[FontCharacter.SANS_SERIF].includes("readability"));
  assert.ok(FONT_CHARACTER_GUIDANCE[FontCharacter.TECHNICAL].includes("Technical"));
  const luxury = selectFontCharacter({ styleId: StyleFamily.LUXURY });
  const technical = selectFontCharacter({ styleId: StyleFamily.TECHNICAL });
  assert.notEqual(luxury, technical);
  console.log("✔ font characters — sans, serif, geometric, humanist, technical, display");
}

function testFontWeightRoles() {
  assert.equal(FontWeightRole.HEADLINE, "bold");
  assert.equal(FontWeightRole.PRIMARY, "medium");
  assert.equal(FontWeightRole.SUPPORTING, "regular");
  const overBold = validateTypographyBlueprint({ boldCount: 4, hierarchyOrder: ["headline", "primary_benefit"] });
  assert.ok(overBold.violations.some((v) => v.code === "INCONSISTENT_TYPOGRAPHY"));
  assert.equal(MAX_BOLD_ELEMENTS, 2);
  console.log("✔ font weight — bold headline, medium primary, regular supporting");
}

function testLineSpacing() {
  assert.equal(RECOMMENDED_LINE_SPACING.min, 1.2);
  assert.equal(RECOMMENDED_LINE_SPACING.max, 1.6);
  const tight = validateTypographyBlueprint({
    hierarchyOrder: ["headline", "primary_benefit"],
    lineSpacing: 1.0,
  });
  assert.ok(tight.violations.some((v) => v.aspect === "lineSpacing"));
  console.log("✔ line spacing — 1.2 to 1.6 for readable body text");
}

function testStyleTypography() {
  const luxury = matchTypographyKnowledge({ styleId: StyleFamily.LUXURY });
  assert.ok(luxury.some((k) => k.id === "luxury-typography"));
  const technical = matchTypographyKnowledge({ styleId: StyleFamily.TECHNICAL });
  assert.ok(technical.some((k) => k.id === "technical-typography"));
  const lifestyle = matchTypographyKnowledge({ styleId: StyleFamily.LIFESTYLE });
  assert.ok(lifestyle.some((k) => k.id === "lifestyle-typography"));
  console.log("✔ style typography — luxury, technical, lifestyle rules");
}

function testTextContrast() {
  const low = validateTypographyBlueprint({
    hierarchyOrder: ["headline", "primary_benefit"],
    contrastRatio: 2,
  });
  assert.ok(low.violations.some((v) => v.code === "INSUFFICIENT_TEXT_CONTRAST"));
  console.log("✔ text contrast — minimum ratio enforced before render pipeline");
}

function testTextDensity() {
  const dense = validateTypographyBlueprint({
    hierarchyOrder: ["headline", "primary_benefit"],
    textDensity: 0.5,
  });
  assert.ok(dense.violations.some((v) => v.code === "EXCESSIVE_TEXT_DENSITY"));
  console.log("✔ text density — prefer concision and block splitting");
}

function testAlignmentConsistency() {
  assert.equal(
    validateTypographyConsistency({ alignments: [TextAlignment.LEFT, TextAlignment.LEFT] }),
    true,
  );
  assert.equal(
    validateTypographyConsistency({
      alignments: [TextAlignment.LEFT, TextAlignment.CENTER, TextAlignment.RIGHT],
    }),
    false,
  );
  const chaos = validateTypographyBlueprint({
    hierarchyOrder: ["headline", "primary_benefit"],
    alignment: [TextAlignment.LEFT, TextAlignment.CENTER, TextAlignment.RIGHT],
  });
  assert.ok(chaos.violations.some((v) => v.code === "ALIGNMENT_CHAOS"));
  console.log("✔ alignment — consistent alignment, no random mixing");
}

function testProductNotObscured() {
  const obscured = validateTypographyBlueprint({
    hierarchyOrder: ["headline", "primary_benefit"],
    productObscured: true,
  });
  assert.ok(obscured.violations.some((v) => v.code === "TEXT_DISTRACTS_FROM_PRODUCT"));
  console.log("✔ product priority — text must not obscure hero product");
}

function testValidateCompliantBlueprint() {
  const result = validateTypographyBlueprint({
    hierarchyOrder: ["headline", "primary_benefit", "supporting_text"],
    contrastRatio: 5,
    boldCount: 1,
    lineSpacing: 1.4,
    textDensity: 0.15,
    headlineReadable: true,
    productObscured: false,
    alignment: [TextAlignment.LEFT],
    fontCharacters: [FontCharacter.GEOMETRIC],
    sizeScaleConsistent: true,
    styleId: "luxury",
  });
  assert.equal(result.valid, true);
  assert.equal(result.retryRecommended, false);
  console.log("✔ compliant typography blueprint passes validation");
}

function testValidateViolatingBlueprint() {
  const result = validateTypographyBlueprint({
    hierarchyOrder: ["small_notes", "headline"],
    contrastRatio: 2,
    boldCount: 4,
    lineSpacing: 1.0,
    textDensity: 0.5,
    headlineReadable: false,
    productObscured: true,
    alignment: [TextAlignment.LEFT, TextAlignment.CENTER, TextAlignment.RIGHT],
    fontCharacters: [FontCharacter.DISPLAY, FontCharacter.SERIF, FontCharacter.TECHNICAL],
    sizeScaleConsistent: false,
    styleId: "luxury",
  });
  assert.equal(result.valid, false);
  assert.equal(result.retryRecommended, true);
  assert.ok(result.violations.length >= 5);
  console.log("✔ violating typography triggers local retry");
}

function testContextRecommendations() {
  const luxury = recommendTypographyKnowledge({ styleId: StyleFamily.LUXURY });
  const technical = recommendTypographyKnowledge({ styleId: StyleFamily.TECHNICAL });
  assert.ok(luxury.some((k) => k.id === "luxury-typography"));
  assert.ok(technical.some((k) => k.id === "technical-typography"));
  console.log("✔ context recommendations — style-specific typography knowledge");
}

function testTypographyLearning() {
  const rule = getTypographyKnowledge("text-hierarchy-order")!;
  const updated = applyTypographyLearningFeedback([rule], {
    knowledgeId: rule.id,
    commercialScore: 0.95,
  });
  assert.ok(updated[0].confidence > rule.confidence);
  console.log("✔ typography evolution — commercial metrics adjust confidence");
}

function testUnreadableTextFails() {
  const report = validateTypographyKnowledge({ unreadableText: true });
  assert.equal(report.valid, false);
  assert.ok(report.violations.some((v) => v.code === "UNREADABLE_TEXT"));
  console.log("✔ unreadable text is architecturally invalid");
}

function testValidateTypographyKnowledge() {
  const report = validateTypographyKnowledge();
  assert.equal(report.valid, true);
  assert.equal(report.goldenRuleSatisfied, true);
  assert.equal(report.readabilityFirst, true);
  assert.equal(report.styleAware, true);
  assert.equal(SEED_TYPOGRAPHY_KNOWLEDGE.length, 12);
  console.log("✔ typography knowledge validation passes");
}

function testRunTypographyKnowledge() {
  const report = runTypographyKnowledge({});
  assert.equal(report.valid, true);
  assertTypographyKnowledge();
  console.log("✔ runTypographyKnowledge entry point works");
}

function testFailureCodes() {
  assert.equal(isTypographyKnowledgeFailure("EXCESSIVE_TEXT_DENSITY"), true);
  assert.equal(isTypographyKnowledgeFailure("UNKNOWN"), false);
  console.log("✔ typography knowledge failure codes are catalogued");
}

function run() {
  testGoldenRule();
  testReadabilityFirst();
  testKnowledgeStructure();
  testTextHierarchy();
  testFontCharacters();
  testFontWeightRoles();
  testLineSpacing();
  testStyleTypography();
  testTextContrast();
  testTextDensity();
  testAlignmentConsistency();
  testProductNotObscured();
  testValidateCompliantBlueprint();
  testValidateViolatingBlueprint();
  testContextRecommendations();
  testTypographyLearning();
  testUnreadableTextFails();
  testValidateTypographyKnowledge();
  testRunTypographyKnowledge();
  testFailureCodes();
  console.log("\ntypography-knowledge.spec.ts — all passed");
}

run();
