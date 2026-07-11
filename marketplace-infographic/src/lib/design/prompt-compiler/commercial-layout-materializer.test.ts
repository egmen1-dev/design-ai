import assert from "node:assert/strict";
import { createCommercialGenomeBetaDecision } from "@/lib/daos/commercial-genome-beta";
import { buildInitialLayoutSpec } from "@/lib/design/layout-spec/builder";
import { stabilizeLayoutSpecWithCommercialIntent } from "@/lib/design/layout-spec/commercial-layout-integration";
import { COMMERCIAL_LAYOUT_INTEGRATION_FLAG } from "@/lib/design/layout-spec/commercial-layout-integration";
import { planScene } from "@/lib/design/scene-planner";
import { compileRenderingPrompt } from "./compiler";
import {
  materializeCommercialLayoutIntent,
  PROMPT_COMMERCIAL_VERSION,
} from "./commercial-layout-materializer";

const ENABLED_ENV = { [COMMERCIAL_LAYOUT_INTEGRATION_FLAG]: "1" } as NodeJS.ProcessEnv;

const analysis = {
  category: "professional tool",
  priceSegment: "mass",
  brandTone: "technical",
} as import("@/lib/product-analysis").ProductAnalysis;

function commercialLayoutSpec() {
  const legacy = buildInitialLayoutSpec({ analysis });
  const decision = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    category: "professional tool",
    productTitle: "Жёлтый шуруповёрт",
    productColor: "yellow",
    mode: "generation",
  }).decision;
  return stabilizeLayoutSpecWithCommercialIntent(legacy, decision, { env: ENABLED_ENV }).layout;
}

function testMaterializerReadsHeroScale() {
  const spec = commercialLayoutSpec();
  const materialized = materializeCommercialLayoutIntent(spec);
  assert.ok(materialized.compositionClauses.some((c) => c.includes("42%")));
  assert.ok(materialized.diagnostics.commercialIntentRead.includes("heroScale"));
  console.log("✔ materializer reads heroScale from LayoutSpec");
}

function testMaterializerReadsHierarchyAndBadges() {
  const spec = commercialLayoutSpec();
  const materialized = materializeCommercialLayoutIntent(spec);
  assert.ok(materialized.diagnostics.commercialIntentRead.includes("maxIcons"));
  assert.ok(materialized.diagnostics.commercialIntentRead.includes("hierarchy"));
  assert.ok(materialized.typographyClauses.some((c) => c.includes("typography strategy")));
  console.log("✔ materializer reads hierarchy, badges, typography from LayoutSpec");
}

function testMaterializerDoesNotInventCommercialOnlyFields() {
  const legacy = buildInitialLayoutSpec({ analysis });
  const materialized = materializeCommercialLayoutIntent(legacy);
  assert.ok(materialized.diagnostics.commercialIntentIgnored.includes("scenePreference"));
  assert.ok(materialized.diagnostics.commercialIntentIgnored.includes("typographyStrategy"));
  assert.ok(materialized.diagnostics.commercialIntentIgnored.includes("backgroundPalettePreference"));
  assert.ok(materialized.diagnostics.commercialIntentIgnored.includes("primaryObject"));
  assert.equal(materialized.environmentClauses.length, 0);
  assert.ok(!materialized.typographyClauses.some((c) => c.includes("typography strategy")));
  console.log("✔ legacy LayoutSpec — commercial-only fields not invented");
}

function testPromptChangesWithCommercialLayout() {
  const scenePlan = planScene({
    prompt: "Шуруповёрт",
    seed: "sprint2-test",
  }).scene;

  const legacyPrompt = compileRenderingPrompt({
    prompt: "Шуруповёрт",
    analysis,
    scenePlan,
    layoutSpec: buildInitialLayoutSpec({ analysis }),
  }).prompt;

  const commercialPrompt = compileRenderingPrompt({
    prompt: "Шуруповёрт",
    analysis,
    scenePlan,
    layoutSpec: commercialLayoutSpec(),
  }).prompt;

  assert.notEqual(legacyPrompt, commercialPrompt);
  assert.ok(commercialPrompt.includes("product hero target area 42%"));
  assert.ok(commercialPrompt.includes("product-first dominance"));
  assert.ok(commercialPrompt.includes("maximum 2 icon elements"));
  assert.ok(commercialPrompt.includes("cool neutral background separation"));
  assert.ok(commercialPrompt.includes("industrial technical environment"));
  console.log("✔ commercial LayoutSpec changes compiled prompt");
}

function testPromptCompilerMetadataDiagnostics() {
  const scenePlan = planScene({ prompt: "test", seed: "meta" }).scene;
  const compiled = compileRenderingPrompt({
    prompt: "test",
    analysis,
    scenePlan,
    layoutSpec: commercialLayoutSpec(),
  });
  assert.equal(compiled.metadata.promptCommercial?.promptCommercialVersion, PROMPT_COMMERCIAL_VERSION);
  assert.ok((compiled.metadata.promptCommercial?.commercialIntentRead.length ?? 0) > 0);
  assert.ok((compiled.metadata.promptCommercial?.promptCommercialMappings.length ?? 0) > 0);
  console.log("✔ prompt metadata includes commercial diagnostics");
}

function testNoCommercialLogicInCompiler() {
  const source = materializeCommercialLayoutIntent.toString();
  assert.ok(!source.includes("createCommercialGenomeBetaDecision"));
  assert.ok(!source.includes("buildCommercialDecisionBeta"));
  assert.ok(!source.includes("resolveCommercialRulesBeta"));
  console.log("✔ materializer has no genome/decision imports in logic");
}

function testDeterministicPromptMaterialization() {
  const spec = commercialLayoutSpec();
  const a = materializeCommercialLayoutIntent(spec);
  const b = materializeCommercialLayoutIntent(spec);
  assert.deepEqual(a.diagnostics.commercialIntentRead, b.diagnostics.commercialIntentRead);
  assert.deepEqual(a.compositionClauses, b.compositionClauses);
  console.log("✔ prompt materialization is deterministic");
}

testMaterializerReadsHeroScale();
testMaterializerReadsHierarchyAndBadges();
testMaterializerDoesNotInventCommercialOnlyFields();
testPromptChangesWithCommercialLayout();
testPromptCompilerMetadataDiagnostics();
testNoCommercialLogicInCompiler();
testDeterministicPromptMaterialization();

console.log("All prompt commercial materializer tests passed");
