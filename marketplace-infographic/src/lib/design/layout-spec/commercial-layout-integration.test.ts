import assert from "node:assert/strict";
import type { CommercialDecisionBeta } from "@/lib/daos/commercial-genome-beta/types";
import { createCommercialGenomeBetaDecision } from "@/lib/daos/commercial-genome-beta";
import {
  ASPIRATIONAL_PRODUCT_AREA_TARGET,
  REACHABLE_PRODUCT_AREA_TARGET,
} from "@/lib/daos/commercial-genome-beta/product-area-targets";
import { buildInitialLayoutSpec } from "./builder";
import { LAYOUT_SPEC_DEFAULTS } from "./types";
import {
  applyCommercialIntentToLayoutSpec,
  COMMERCIAL_LAYOUT_INTEGRATION_FLAG,
  deriveCommercialDecisionId,
  stabilizeLayoutSpecWithCommercialIntent,
} from "./commercial-layout-integration";

const ENABLED_ENV = {
  [COMMERCIAL_LAYOUT_INTEGRATION_FLAG]: "1",
} as NodeJS.ProcessEnv;

const DISABLED_ENV = {
  [COMMERCIAL_LAYOUT_INTEGRATION_FLAG]: "0",
} as NodeJS.ProcessEnv;

function sampleDecision(overrides?: Partial<CommercialDecisionBeta>): CommercialDecisionBeta {
  return {
    mainMessage: "Test message",
    heroDominance: "product_first",
    productAreaTarget: REACHABLE_PRODUCT_AREA_TARGET,
    productAreaAspirationalTarget: ASPIRATIONAL_PRODUCT_AREA_TARGET,
    maxCharacteristics: 4,
    badgeLimit: 2,
    environmentDirection: "clean_industrial_technical",
    backgroundContrastDirection: "cool_neutral_separation",
    typographyDirection: "one main message, strong result-oriented headline",
    visualHierarchy: ["product", "headline", "characteristics", "logo"],
    antiRules: ["no clutter"],
    selectedRules: ["WB-HERO-001", "WB-HIER-002"],
    decisionTrace: ["trace"],
    ...overrides,
  };
}

function testFlagOffPreservesLegacyLayout() {
  const legacy = { ...LAYOUT_SPEC_DEFAULTS };
  const result = applyCommercialIntentToLayoutSpec(legacy, sampleDecision(), {
    env: DISABLED_ENV,
  });
  assert.deepEqual(result.layout, legacy);
  assert.equal(result.layout.commercialLayout, undefined);
  console.log("✔ flag off preserves legacy LayoutSpec");
}

function testReachableProductAreaTargetApplied() {
  const result = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, sampleDecision(), {
    env: ENABLED_ENV,
  });
  assert.equal(result.layout.heroScale, REACHABLE_PRODUCT_AREA_TARGET);
  assert.equal(result.layout.productAreaPct, 42);
  assert.equal(result.layout.reachableProductAreaPct, 42);
  assert.equal(result.layout.aspirationalProductAreaPct, 55);
  console.log("✔ reachable productAreaTarget applies to heroScale");
}

function testGenomeDecisionUsesReachableNotAspirational() {
  const decision = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    category: "electronics",
    productTitle: "Test",
    mode: "generation",
  }).decision;
  assert.equal(decision.productAreaTarget, REACHABLE_PRODUCT_AREA_TARGET);
  assert.equal(decision.productAreaAspirationalTarget, ASPIRATIONAL_PRODUCT_AREA_TARGET);
  console.log("✔ genome decision separates reachable vs aspirational targets");
}

function testHeroDominanceApplied() {
  const result = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, sampleDecision(), {
    env: ENABLED_ENV,
  });
  assert.equal(result.layout.primaryObject, "product");
  console.log("✔ heroDominance applies to primaryObject");
}

function testDeterministicIntegration() {
  const decision = sampleDecision();
  const first = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, decision, {
    env: ENABLED_ENV,
  });
  const second = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, decision, {
    env: ENABLED_ENV,
  });
  assert.equal(deriveCommercialDecisionId(decision), first.diagnostics.commercialDecisionId);
  assert.deepEqual(first.layout, second.layout);
  console.log("✔ integration is deterministic");
}

function testTerminalStabilizerMatchesApply() {
  const decision = sampleDecision();
  const viaApply = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, decision, {
    env: ENABLED_ENV,
  });
  const viaStabilize = stabilizeLayoutSpecWithCommercialIntent(LAYOUT_SPEC_DEFAULTS, decision, {
    env: ENABLED_ENV,
  });
  assert.deepEqual(viaApply.layout, viaStabilize.layout);
  console.log("✔ stabilizeLayoutSpecWithCommercialIntent is the terminal gate");
}

testFlagOffPreservesLegacyLayout();
testReachableProductAreaTargetApplied();
testGenomeDecisionUsesReachableNotAspirational();
testHeroDominanceApplied();
testDeterministicIntegration();
testTerminalStabilizerMatchesApply();
console.log("All commercial layout integration tests passed");
