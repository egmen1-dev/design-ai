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
import { layoutPassesHardLaws } from "./layout-harden";

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
  const layoutReport = result.reports.find((r) => r.stage === "layout_spec");
  assert.ok(sceneReport, "scene report exists");
  assert.ok(layoutReport, "layout report exists");
  assert.ok(
    sceneReport.overallDesignScore >= GOVERNANCE_CONSTITUTION_THRESHOLD,
    `scene score ${sceneReport.overallDesignScore} must reach threshold ${GOVERNANCE_CONSTITUTION_THRESHOLD}`,
  );
  assert.ok(
    layoutReport.overallDesignScore >= GOVERNANCE_CONSTITUTION_THRESHOLD,
    `layout score ${layoutReport.overallDesignScore} must reach threshold ${GOVERNANCE_CONSTITUTION_THRESHOLD}`,
  );
  assert.equal(result.blueprint.sceneBlueprint.productInteraction.groundPlane, true);
  assert.equal(result.blueprint.sceneBlueprint.accent.particles, false);

  console.log(
    "constitution gate specs OK",
    `scene=${sceneReport.overallDesignScore}`,
    `layout=${result.reports.find((r) => r.stage === "layout_spec")?.overallDesignScore}`,
  );

  // layout_spec score 79 (below old threshold 80) must pass after hardening
  const badLayout = blueprintWithFloatingProduct();
  badLayout.layoutSpec = {
    ...badLayout.layoutSpec,
    whitespaceTarget: 19,
    heroScale: 0.52,
    visualWeightMap: { hero: 30, headline: 28, benefits: 18, cta: 12, background: 15 },
  };
  const layoutFixed = runMandatoryConstitution({
    blueprint: badLayout,
    analysis,
    sceneScore: 67,
    compositionScore: 72,
  });
  const fixedLayoutReport = layoutFixed.reports.find((r) => r.stage === "layout_spec");
  assert.ok(fixedLayoutReport, "layout report exists");
  assert.ok(
    fixedLayoutReport.overallDesignScore >= GOVERNANCE_CONSTITUTION_THRESHOLD,
    `degraded layout must auto-fix to ${GOVERNANCE_CONSTITUTION_THRESHOLD}+, got ${fixedLayoutReport.overallDesignScore}`,
  );
  assert.ok(layoutPassesHardLaws(layoutFixed.blueprint.layoutSpec));
}

main();
