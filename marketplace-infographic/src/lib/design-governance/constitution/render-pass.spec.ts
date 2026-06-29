/**
 * Governance render-pass specs
 * Run: npx tsx src/lib/design-governance/constitution/render-pass.spec.ts
 */
import assert from "node:assert/strict";
import type { ConstitutionReport } from "@/lib/design/design-constitution";
import { constitutionPassedForGovernanceRender } from "./gate";

function report(stage: ConstitutionReport["stage"], passed: boolean): ConstitutionReport {
  return {
    constitutionId: "marketplace_v1",
    constitutionVersion: "1.2",
    stage,
    passed,
    overallDesignScore: passed ? 85 : 72,
    scores: {
      compositionScore: 80,
      hierarchyScore: 80,
      whitespaceScore: 80,
      luxuryScore: 80,
      typographyScore: 80,
      contrastScore: 80,
      marketplaceScore: 80,
      brandScore: 80,
      visualNoiseScore: 80,
      overallDesignScore: passed ? 85 : 72,
    },
    entries: [],
    violations: [],
    patchesApplied: [],
    attempts: 1,
  };
}

function main() {
  assert.equal(
    constitutionPassedForGovernanceRender([
      report("scene_blueprint", true),
      report("layout_spec", true),
      report("rendered_critique", false),
    ]),
    true,
    "rendered_critique must not block when mandatory stages passed",
  );

  assert.equal(
    constitutionPassedForGovernanceRender([
      report("scene_blueprint", true),
      report("layout_spec", false),
      report("rendered_critique", false),
    ]),
    false,
    "failed mandatory layout_spec must block",
  );

  console.log("render-pass specs OK");
}

main();
