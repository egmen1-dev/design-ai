import assert from "node:assert/strict";
import { deriveCommercialExpectations } from "./expectations";
import { evaluateCommercialFidelity } from "./evaluate";
import type { LayoutSpec } from "@/lib/design/layout-spec/types";
import path from "node:path";
import fs from "node:fs";

async function main() {
  const expectations = deriveCommercialExpectations({
    layoutSpec: {
      heroScale: 0.55,
      productAreaPct: 55,
      primaryObject: "product",
      scenePreference: "industrial_technical",
      backgroundPalettePreference: "cool_neutral",
      hierarchy: {
        headline: "H1",
        hero: "hero",
        benefits: "supporting",
        cta: "cta",
        decorative: "decorative",
      },
    } as LayoutSpec,
  });

  assert.equal(expectations.product_area, 55);
  assert.equal(expectations.product_dominance, 85);
  assert.ok(expectations.visual_hierarchy >= 70);
  console.log("✔ expectations derived from LayoutSpec only");

  const sprint5Image = path.join(
    __dirname,
    "../../../benchmark/output/sprint5/construction-vacuum-commercial.png",
  );
  const sprint4Image = path.join(
    __dirname,
    "../../../benchmark/output/sprint4/construction-vacuum-commercial.png",
  );
  const imagePath = fs.existsSync(sprint5Image)
    ? sprint5Image
    : fs.existsSync(sprint4Image)
      ? sprint4Image
      : null;

  if (!imagePath) {
    console.log("⊘ skip image evaluation — sprint4 artifact missing");
    console.log("commercial-fidelity OK (expectations only)");
    return;
  }

  const report = await evaluateCommercialFidelity({
    imagePath,
    layoutSpec: {
      heroScale: 0.55,
      productAreaPct: 55,
      primaryObject: "product",
      scenePreference: "industrial_technical",
      backgroundPalettePreference: "cool_neutral",
      hierarchy: {
        headline: "H1",
        hero: "hero",
        benefits: "supporting",
        cta: "cta",
        decorative: "decorative",
      },
      commercialLayout: {
        commercialIntentReceived: true,
        commercialIntentApplied: ["heroScale", "productAreaPct", "primaryObject"],
        commercialIntentIgnored: [],
        commercialIntentReason: {},
        commercialIntegrationVersion: "1.1.0-sprint1",
        commercialDecisionId: "test",
      },
    } as LayoutSpec,
  });
  assert.equal(report.parameters.length, 5);
  assert.equal(report.diagnostics.commercialFidelityVersion, "1.0.0-sprint5");
  assert.ok(report.diagnostics.commercialFidelityScore >= 0);
  assert.ok(report.diagnostics.commercialExpectedValues.product_area === 55);
  assert.ok(report.diagnostics.commercialMeasuredValues.product_area > 0);
  assert.ok(typeof report.diagnostics.commercialFidelityDelta.product_area === "number");
  console.log("✔ fidelity report has 5 parameters and diagnostics");
  console.log(`  score=${report.diagnostics.commercialFidelityScore}`);
  console.log("commercial-fidelity OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
