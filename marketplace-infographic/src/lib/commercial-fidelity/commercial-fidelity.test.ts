import assert from "node:assert/strict";
import { deriveCommercialExpectations, deriveProductAreaTargets } from "./expectations";
import { evaluateCommercialFidelity } from "./evaluate";
import type { LayoutSpec } from "@/lib/design/layout-spec/types";
import path from "node:path";
import fs from "node:fs";

const REACHABLE_LAYOUT = {
  heroScale: 0.42,
  productAreaPct: 42,
  reachableProductAreaPct: 42,
  aspirationalProductAreaPct: 55,
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
} as LayoutSpec;

async function main() {
  const expectations = deriveCommercialExpectations({ layoutSpec: REACHABLE_LAYOUT });
  const targets = deriveProductAreaTargets({ layoutSpec: REACHABLE_LAYOUT });

  assert.equal(expectations.product_area, 42);
  assert.equal(targets.reachableTarget, 42);
  assert.equal(targets.aspirationalTarget, 55);
  console.log("✔ expectations use reachable target, not aspirational 55%");

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
      ...REACHABLE_LAYOUT,
      commercialLayout: {
        commercialIntentReceived: true,
        commercialIntentApplied: ["heroScale", "productAreaPct", "reachableProductAreaPct"],
        commercialIntentIgnored: [],
        commercialIntentReason: {},
        commercialIntegrationVersion: "1.1.0-sprint1",
        commercialDecisionId: "test",
      },
    } as LayoutSpec,
  });
  assert.equal(report.parameters.length, 5);
  assert.equal(report.diagnostics.commercialFidelityVersion, "1.1.0-sprint8c");
  assert.ok(report.diagnostics.productAreaModel);
  assert.equal(report.diagnostics.productAreaModel!.reachableTarget, 42);
  assert.equal(report.diagnostics.productAreaModel!.aspirationalTarget, 55);
  assert.ok(report.diagnostics.commercialExpectedValues.product_area === 42);
  assert.ok(report.diagnostics.commercialMeasuredValues.product_area > 0);
  assert.ok(report.diagnostics.productAreaModel!.unreachableGap >= 0);
  console.log("✔ fidelity report exposes dual-target productAreaModel");
  console.log(`  score=${report.diagnostics.commercialFidelityScore}`);
  console.log("commercial-fidelity OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
