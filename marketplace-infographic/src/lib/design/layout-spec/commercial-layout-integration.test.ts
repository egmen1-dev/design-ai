import assert from "node:assert/strict";
import type { CommercialDecisionBeta } from "@/lib/daos/commercial-genome-beta/types";
import { createCommercialGenomeBetaDecision } from "@/lib/daos/commercial-genome-beta";
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
    productAreaTarget: 0.55,
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
  assert.equal(result.diagnostics.commercialIntentApplied.length, 0);
  assert.equal(result.layout.commercialLayout, undefined);
  console.log("✔ flag off preserves legacy LayoutSpec");
}

function testProductAreaTargetApplied() {
  const result = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, sampleDecision(), {
    env: ENABLED_ENV,
  });
  assert.equal(result.layout.heroScale, 0.55);
  assert.equal(result.layout.productAreaPct, 55);
  assert.ok(result.diagnostics.commercialIntentApplied.includes("heroScale"));
  console.log("✔ productAreaTarget applies to heroScale");
}

function testHeroDominanceApplied() {
  const result = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, sampleDecision(), {
    env: ENABLED_ENV,
  });
  assert.equal(result.layout.primaryObject, "product");
  console.log("✔ heroDominance applies to primaryObject");
}

function testBadgeLimitApplied() {
  const result = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, sampleDecision(), {
    env: ENABLED_ENV,
  });
  assert.equal(result.layout.maxIcons, 2);
  assert.equal(result.layout.maxBadges, 2);
  console.log("✔ badgeLimit applies to maxIcons and maxBadges");
}

function testTypographyApplied() {
  const result = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, sampleDecision(), {
    env: ENABLED_ENV,
  });
  assert.equal(
    result.layout.typographyStrategy,
    "one main message, strong result-oriented headline",
  );
  assert.equal(result.layout.maxCharacteristics, 4);
  console.log("✔ typography and maxCharacteristics apply");
}

function testHierarchyApplied() {
  const result = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, sampleDecision(), {
    env: ENABLED_ENV,
  });
  assert.ok(result.layout.hierarchy);
  assert.equal(result.layout.hierarchy!.hero, "hero");
  assert.equal(result.layout.hierarchy!.headline, "H1");
  console.log("✔ visualHierarchy applies to hierarchy");
}

function testEnvironmentApplied() {
  const result = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, sampleDecision(), {
    env: ENABLED_ENV,
  });
  assert.equal(result.layout.scenePreference, "industrial_technical");
  console.log("✔ environmentDirection applies to scenePreference");
}

function testBackgroundApplied() {
  const result = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, sampleDecision(), {
    env: ENABLED_ENV,
  });
  assert.equal(result.layout.backgroundPalettePreference, "cool_neutral");
  console.log("✔ backgroundContrastDirection applies to backgroundPalettePreference");
}

function testDeterministicIntegration() {
  const decision = createCommercialGenomeBetaDecision({
    marketplace: "wildberries",
    category: "electronics",
    productTitle: "Deterministic Product",
    productColor: "yellow",
    mode: "generation",
  }).decision;

  const first = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, decision, {
    env: ENABLED_ENV,
  });
  const second = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, decision, {
    env: ENABLED_ENV,
  });

  assert.equal(deriveCommercialDecisionId(decision), first.diagnostics.commercialDecisionId);
  assert.deepEqual(first.layout, second.layout);
  assert.deepEqual(
    first.diagnostics.commercialIntentApplied,
    second.diagnostics.commercialIntentApplied,
  );
  console.log("✔ integration is deterministic");
}

function testAdditiveIntegration() {
  const analysis = {
    category: "electronics",
    priceSegment: "mass",
    brandTone: "neutral",
  } as import("@/lib/product-analysis").ProductAnalysis;

  const legacy = buildInitialLayoutSpec({ analysis });
  const stabilized = stabilizeLayoutSpecWithCommercialIntent(legacy, sampleDecision(), {
    env: ENABLED_ENV,
  }).layout;

  assert.notEqual(stabilized.heroScale, legacy.heroScale);
  assert.equal(legacy.heroPosition, stabilized.heroPosition);
  assert.equal(legacy.palette.join(","), stabilized.palette.join(","));
  console.log("✔ integration is additive — only commercial fields change");
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

function testDebugBundleWhenRequested() {
  const result = applyCommercialIntentToLayoutSpec(LAYOUT_SPEC_DEFAULTS, sampleDecision(), {
    env: ENABLED_ENV,
    includeDebugBundle: true,
  });
  assert.ok(result.debugBundle);
  assert.equal(result.debugBundle!.commercialIntentReceived, true);
  assert.ok(result.debugBundle!.commercialIntentApplied.length > 0);
  assert.ok(result.debugBundle!.commercialIntentIgnored.includes("mainMessage"));
  console.log("✔ debug bundle includes commercial intent diagnostics");
}

testFlagOffPreservesLegacyLayout();
testProductAreaTargetApplied();
testHeroDominanceApplied();
testBadgeLimitApplied();
testTypographyApplied();
testHierarchyApplied();
testEnvironmentApplied();
testBackgroundApplied();
testDeterministicIntegration();
testAdditiveIntegration();
testTerminalStabilizerMatchesApply();
testDebugBundleWhenRequested();

console.log("All commercial layout integration tests passed");
