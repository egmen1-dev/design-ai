import assert from "node:assert/strict";
import { runVisualPipeline } from "./index";
import { materializeCommercialBlueprintIntent } from "./commercial-blueprint-materializer";
import type { LayoutSpec } from "@/lib/design/layout-spec/types";
import { compilePollinationsPrompt } from "@/lib/render-engine/adapters/pollinations-compiler";
import { analyzeProductPrompt } from "@/lib/product-analysis";

function main() {
  const analysis = analyzeProductPrompt("Строительный пылесос для ремонта 30 л");
  const { visualBlueprint } = runVisualPipeline({
    prompt: "Строительный пылесос",
    analysis,
  });

  const layoutSpec = {
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
    commercialLayout: {
      commercialIntentReceived: true,
      commercialIntentApplied: [
        "heroScale",
        "productAreaPct",
        "primaryObject",
        "scenePreference",
        "backgroundPalettePreference",
        "hierarchy",
      ],
      commercialIntentIgnored: [],
      commercialIntentReason: {},
      commercialIntegrationVersion: "1.1.0-sprint1",
      commercialDecisionId: "test",
    },
  } as Partial<LayoutSpec> as LayoutSpec;

  const materialized = materializeCommercialBlueprintIntent(visualBlueprint, layoutSpec);
  assert.equal(materialized.scene.architecture, "workshop");
  assert.ok(materialized.commercial?.diagnostics.commercialBlueprintMaterialized);
  assert.ok(materialized.commercial?.diagnostics.commercialSceneApplied);
  assert.ok(materialized.commercial?.diagnostics.commercialPaletteApplied);
  assert.ok(materialized.commercial?.diagnostics.commercialHeroApplied);
  assert.ok(
    materialized.commercial?.guidance.environmentPhrase?.includes("technical"),
  );
  console.log("✔ materializer maps scenePreference → scene.architecture");

  const legacyCompiled = compilePollinationsPrompt(visualBlueprint);
  const commercialCompiled = compilePollinationsPrompt(materialized);
  assert.notEqual(legacyCompiled.prompt, commercialCompiled.prompt);
  assert.ok(commercialCompiled.commercialDiagnostics?.commercialBlueprintMaterialized);
  assert.equal(commercialCompiled.providerCommercialVersion, "1.0.0-sprint4");
  assert.ok(commercialCompiled.modulesUsed.includes("commercial"));
  assert.ok(
    commercialCompiled.prompt.includes("technical") ||
      commercialCompiled.prompt.includes("concrete"),
  );
  assert.ok(commercialCompiled.prompt.includes("cool neutral"));
  assert.ok(commercialCompiled.prompt.includes("hero framing"));
  assert.ok(commercialCompiled.validation.ok, commercialCompiled.validation.issues.join("; "));
  console.log("✔ compilePollinationsPrompt reads only VisualSceneBlueprint commercial fields");

  const withoutLayout = materializeCommercialBlueprintIntent(visualBlueprint);
  assert.equal(withoutLayout.commercial?.diagnostics.commercialBlueprintMaterialized, false);
  console.log("✔ empty layoutSpec leaves blueprint unchanged");

  console.log("commercial-blueprint-materializer OK");
}

main();
