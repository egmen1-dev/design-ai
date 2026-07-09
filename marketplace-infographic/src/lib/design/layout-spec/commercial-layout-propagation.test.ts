import assert from "node:assert/strict";
import {
  resolveLayoutObjectScale,
  COMMERCIAL_PROPAGATION_VERSION,
} from "./commercial-layout-propagation";
import { GEOMETRY_CEILING_OBJECT_SCALE } from "./commercial-target-propagation";
import { buildInitialLayoutSpec } from "./builder";
import type { LayoutSpec } from "./types";

function main() {
  const legacyLayout = buildInitialLayoutSpec({
    analysis: { category: "home", priceSegment: "mass", brandTone: "cozy" } as import("@/lib/product-analysis").ProductAnalysis,
  });

  const commercialLayout = {
    ...legacyLayout,
    heroScale: 0.42,
    productAreaPct: 42,
    reachableProductAreaPct: 42,
    aspirationalProductAreaPct: 55,
    commercialLayout: {
      commercialIntentReceived: true,
      commercialIntentApplied: ["heroScale", "productAreaPct", "reachableProductAreaPct"],
      commercialIntentIgnored: [],
      commercialIntentReason: {},
      commercialIntegrationVersion: "1.1.0-sprint1",
      commercialDecisionId: "test",
    },
  } as LayoutSpec;

  const templateOnly = resolveLayoutObjectScale({ templateAreaPct: 66 });
  assert.equal(templateOnly.diagnostics.commercialScaleSource, "template");
  console.log("✔ template fallback unchanged");

  const commercial = resolveLayoutObjectScale({
    layoutSpec: commercialLayout,
    templateAreaPct: 66,
  });
  assert.equal(commercial.diagnostics.commercialScaleSource, "commercial");
  assert.equal(commercial.diagnostics.commercialReachableTargetPct, 42);
  assert.equal(commercial.diagnostics.commercialAspirationalTargetPct, 55);
  assert.equal(commercial.objectScale, GEOMETRY_CEILING_OBJECT_SCALE);
  assert.equal(commercial.diagnostics.commercialPropagationMode, "geometry_ceiling_harvest");
  assert.equal(commercial.diagnostics.commercialPropagationVersion, COMMERCIAL_PROPAGATION_VERSION);
  console.log("✔ commercial path harvests geometry ceiling @ objectScale=0.75");

  const legacy = resolveLayoutObjectScale({
    layoutSpec: legacyLayout,
    templateAreaPct: 66,
  });
  assert.equal(legacy.diagnostics.commercialScaleSource, "template");
  console.log("✔ non-commercial layoutSpec uses template fallback");

  const bare = resolveLayoutObjectScale({});
  assert.equal(bare.diagnostics.commercialScaleSource, "legacy");
  assert.equal(bare.objectScale, 0.62);
  console.log("✔ empty input uses legacy default");

  console.log("commercial-layout-propagation OK");
}

main();
