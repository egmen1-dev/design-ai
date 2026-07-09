import assert from "node:assert/strict";
import { buildInitialLayoutSpec } from "./builder";
import {
  resolveLayoutObjectScale,
  layoutObjectScaleFromTemplate,
  COMMERCIAL_PROPAGATION_VERSION,
} from "./commercial-layout-propagation";
import type { LayoutSpec } from "./types";

function main() {
  const legacyLayout = buildInitialLayoutSpec({
    analysis: { category: "home", priceSegment: "mass", brandTone: "cozy" } as import("@/lib/product-analysis").ProductAnalysis,
  });

  const commercialLayout = {
    ...legacyLayout,
    heroScale: 0.55,
    productAreaPct: 55,
    commercialLayout: {
      commercialIntentReceived: true,
      commercialIntentApplied: ["heroScale", "productAreaPct"],
      commercialIntentIgnored: [],
      commercialIntentReason: {},
      commercialIntegrationVersion: "1.1.0-sprint1",
      commercialDecisionId: "test",
    },
  } as LayoutSpec;

  const templateOnly = resolveLayoutObjectScale({ templateAreaPct: 66 });
  assert.equal(templateOnly.diagnostics.commercialScaleSource, "template");
  assert.equal(templateOnly.objectScale, layoutObjectScaleFromTemplate(66));
  console.log("✔ template fallback unchanged");

  const commercial = resolveLayoutObjectScale({
    layoutSpec: commercialLayout,
    templateAreaPct: 66,
  });
  assert.equal(commercial.diagnostics.commercialScaleSource, "commercial");
  assert.equal(commercial.diagnostics.commercialScaleExpected, 55);
  assert.equal(commercial.objectScale, 0.55);
  assert.ok(commercial.diagnostics.commercialScaleDelta < 0);
  assert.equal(commercial.diagnostics.commercialPropagationVersion, COMMERCIAL_PROPAGATION_VERSION);
  console.log("✔ commercial LayoutSpec drives objectScale");

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
