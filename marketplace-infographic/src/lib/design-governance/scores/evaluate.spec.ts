/**
 * Run: npx tsx src/lib/design-governance/scores/evaluate.ts
 */
import assert from "node:assert/strict";
import {
  buildGovernanceScorecard,
  PROFESSIONAL_SCORE_THRESHOLD,
} from "./evaluate";

function main() {
  const lowPhoto = buildGovernanceScorecard({
    compositionScore: 72,
    sceneScore: 70,
    luxuryScore: 70,
    photoScore: 60,
    ctrScore: 62,
    backgroundSource: "provider",
    renderDesignScore: 80,
  });
  assert.ok(
    lowPhoto.professional < PROFESSIONAL_SCORE_THRESHOLD,
    "capped photo score should fail threshold",
  );

  const withComposite = buildGovernanceScorecard({
    compositionScore: 72,
    sceneScore: 70,
    luxuryScore: 72,
    photoScore: 68,
    seniorAdScore: 85,
    ctrScore: 78,
    backgroundSource: "provider",
    renderDesignScore: 82,
    hasComposite: true,
  });
  assert.ok(
    withComposite.professional >= PROFESSIONAL_SCORE_THRESHOLD,
    `composite+provider should pass (got ${withComposite.professional})`,
  );

  const borderline = buildGovernanceScorecard({
    compositionScore: 70,
    sceneScore: 70,
    luxuryScore: 68,
    photoScore: 62,
    ctrScore: 65,
    backgroundSource: "provider",
    hasComposite: true,
    constitutionPassed: true,
  });
  assert.ok(
    borderline.professional >= PROFESSIONAL_SCORE_THRESHOLD,
    `composite+provider should floor professional (got ${borderline.professional})`,
  );

  const borderlineNoComposite = buildGovernanceScorecard({
    compositionScore: 70,
    sceneScore: 70,
    luxuryScore: 68,
    photoScore: 62,
    ctrScore: 65,
    backgroundSource: "provider",
    hasComposite: false,
  });
  assert.ok(
    borderlineNoComposite.professional >= 73,
    `composite floor should lift borderline (got ${borderlineNoComposite.professional})`,
  );

  console.log("governance scorecard specs OK", withComposite.professional);
}

main();
