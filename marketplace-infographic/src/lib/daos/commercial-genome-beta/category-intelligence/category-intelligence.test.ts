import assert from "node:assert/strict";
import { createCommercialGenomeBetaDecision } from "../commercial-genome-beta";
import {
  applyCategoryIntelligence,
  getCategoryProfile,
  isCategoryIntelligenceEnabled,
  resolveCategoryIntelligenceKey,
  WAVE1_CATEGORY_KEYS,
} from "./index";

function testResolveCategoryKeys() {
  assert.equal(resolveCategoryIntelligenceKey({ productTitle: "Органайзер для дома" }), "home");
  assert.equal(resolveCategoryIntelligenceKey({ productTitle: "Блендер кухонный профессиональный" }), "kitchen");
  assert.equal(resolveCategoryIntelligenceKey({ productTitle: "Увлажнитель воздуха 5л" }), "humidifier");
  assert.equal(resolveCategoryIntelligenceKey({ productTitle: "Мойка высокого давления Karcher" }), "pressure-wash");
  assert.equal(resolveCategoryIntelligenceKey({ category: "kitchen", productTitle: "x" }), "kitchen");
  assert.equal(resolveCategoryIntelligenceKey({ productTitle: "Дрель ударная" }), null);
  console.log("✔ resolveCategoryIntelligenceKey matches wave-1 categories");
}

function testProfilesComplete() {
  for (const key of WAVE1_CATEGORY_KEYS) {
    const p = getCategoryProfile(key);
    assert.ok(p.commercialLaws.length >= 2, `${key} laws`);
    assert.ok(p.visualPattern.length > 5, `${key} visualPattern`);
    assert.ok(p.attentionRules.dominanceFloor >= 48, `${key} dominanceFloor`);
    assert.ok(p.compositionRules.productAreaTarget >= 0.43, `${key} productArea`);
    assert.ok(p.typographyRules.direction.length > 5, `${key} typography`);
    assert.ok(p.backgroundRules.contrastDirection.length > 5, `${key} background`);
  }
  console.log("✔ wave-1 profiles have all rule dimensions");
}

function testApplyOverridesDominance() {
  const base = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    productTitle: "Органайзер для дома",
    mode: "generation",
  }).decision;
  const { decision, intelligence } = applyCategoryIntelligence({
    decision: base,
    productTitle: "Органайзер для дома",
  });
  assert.equal(intelligence.key, "home");
  assert.equal(decision.productAreaTarget, 0.45);
  assert.equal(decision.maxCharacteristics, 1);
  assert.equal(decision.environmentDirection, "light_modern_clean");
  assert.equal(decision.backgroundContrastDirection, "light_background");
  assert.ok(decision.antiRules.length > base.antiRules.length);
  console.log("✔ home profile applies dominance and background overrides");
}

function testFlagGatedIntegration() {
  const envOff = { DAOS_COMMERCIAL_GENOME_BETA: "1", DAOS_CATEGORY_INTELLIGENCE: "0" } as NodeJS.ProcessEnv;
  const envOn = { DAOS_COMMERCIAL_GENOME_BETA: "1", DAOS_CATEGORY_INTELLIGENCE: "1" } as NodeJS.ProcessEnv;
  assert.equal(isCategoryIntelligenceEnabled(envOff), false);
  assert.equal(isCategoryIntelligenceEnabled(envOn), true);

  const prev = process.env.DAOS_CATEGORY_INTELLIGENCE;
  process.env.DAOS_COMMERCIAL_GENOME_BETA = "1";
  process.env.DAOS_CATEGORY_INTELLIGENCE = "0";
  const off = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    productTitle: "Блендер кухонный",
    mode: "generation",
  });
  assert.equal(off.categoryIntelligence?.key, null);

  process.env.DAOS_CATEGORY_INTELLIGENCE = "1";
  const on = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    productTitle: "Блендер кухонный",
    mode: "generation",
  });
  assert.equal(on.categoryIntelligence?.key, "kitchen");
  assert.equal(on.decision.productAreaTarget, 0.45);

  if (prev === undefined) delete process.env.DAOS_CATEGORY_INTELLIGENCE;
  else process.env.DAOS_CATEGORY_INTELLIGENCE = prev;
  console.log("✔ DAOS_CATEGORY_INTELLIGENCE flag gates layer");
}

function testPressureWashIndustrial() {
  process.env.DAOS_COMMERCIAL_GENOME_BETA = "1";
  process.env.DAOS_CATEGORY_INTELLIGENCE = "1";
  const result = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    productTitle: "Мойка высокого давления 180 бар",
    mode: "generation",
  });
  assert.equal(result.categoryIntelligence?.key, "pressure-wash");
  assert.equal(result.decision.environmentDirection, "clean_industrial_technical");
  assert.equal(result.decision.backgroundContrastDirection, "cool_neutral_separation");
  console.log("✔ pressure-wash profile uses industrial environment + cool background");
}

function main() {
  testResolveCategoryKeys();
  testProfilesComplete();
  testApplyOverridesDominance();
  testFlagGatedIntegration();
  testPressureWashIndustrial();
  console.log("==> category-intelligence tests OK");
}

main();
