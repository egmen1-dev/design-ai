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
    photoScore: 82,
    seniorAdScore: 85,
    ctrScore: 78,
    backgroundSource: "provider",
    renderDesignScore: 82,
  });
  assert.ok(
    withComposite.professional >= PROFESSIONAL_SCORE_THRESHOLD,
    `composite-quality inputs should pass (got ${withComposite.professional})`,
  );

  console.log("governance scorecard specs OK", withComposite.professional);
}

main();
