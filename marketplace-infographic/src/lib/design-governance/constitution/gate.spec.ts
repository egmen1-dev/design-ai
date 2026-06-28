/**
 * Constitution gate specs — score 82 / critical auto-fix
 * Run: npx tsx src/lib/design-governance/constitution/gate.spec.ts
 */
import assert from "node:assert/strict";
import { analyzeProductPrompt } from "@/lib/product-analysis";
import { planScene } from "@/lib/design/scene-planner";
import { resolveDesignDecisions } from "../resolver/resolver";
import { runMandatoryConstitution } from "./gate";
import { buildBlueprintFromTemplate } from "@/lib/design/scene-blueprint/templates";
import { buildInitialLayoutSpec } from "@/lib/design/layout-spec";
import type { FinalDesignBlueprint } from "../blueprint/types";
import { GOVERNANCE_CONSTITUTION_THRESHOLD } from "../config";

function blueprintWithFloatingProduct(): FinalDesignBlueprint {
  const analysis = analyzeProductPrompt("Генератор 3 кВт для дачи");
  const { scene: scenePlan } = planScene({
    prompt: "Генератор 3 кВт",
    coverConceptId: "home_interior",
    seed: "float-test",
  });
  const sceneBlueprint = buildBlueprintFromTemplate("kitchen", "warm_spotlight");
  sceneBlueprint.productInteraction.groundPlane = false;
  sceneBlueprint.productInteraction.softShadow = false;
  sceneBlueprint.accent.particles = true;
  const layoutSpec = buildInitialLayoutSpec({ analysis, palette: ["#1a1a1a", "#f5f5f5"] });

  return resolveDesignDecisions({
    analysis,
    scenePlan,
    sceneBlueprint,
    layoutSpec,
  });
}

function main() {
  assert.equal(GOVERNANCE_CONSTITUTION_THRESHOLD, 80, "governance threshold default");

  const blueprint = blueprintWithFloatingProduct();
  const analysis = analyzeProductPrompt("Генератор 3 кВт для дачи");

  const result = runMandatoryConstitution({
    blueprint,
    analysis,
    sceneScore: 67,
    compositionScore: 72,
  });

  assert.equal(result.passed, true);
  const sceneReport = result.reports.find((r) => r.stage === "scene_blueprint");
  assert.ok(sceneReport, "scene report exists");
  assert.ok(
    sceneReport.overallDesignScore >= GOVERNANCE_CONSTITUTION_THRESHOLD ||
      sceneReport.violations.every((v) => v.severity !== "critical"),
    `scene score ${sceneReport.overallDesignScore} should pass governance`,
  );
  assert.equal(result.blueprint.sceneBlueprint.productInteraction.groundPlane, true);
  assert.equal(result.blueprint.sceneBlueprint.accent.particles, false);

  console.log(
    "constitution gate specs OK",
    `scene=${sceneReport.overallDesignScore}`,
    `layout=${result.reports.find((r) => r.stage === "layout_spec")?.overallDesignScore}`,
  );
}

main();
