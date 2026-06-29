/**
 * Cover concept mapping specs
 * Run: npx tsx src/lib/design/visual-pipeline/catalogs/cover-concept.spec.ts
 */
import assert from "node:assert/strict";
import {
  isOutdoorCoverConcept,
  resolveCoverConceptFromArtDirectorMode,
  resolveCoverConceptFromEnvironment,
} from "./cover-concept";

function main() {
  assert.ok(isOutdoorCoverConcept("garden_scene"));
  assert.ok(isOutdoorCoverConcept("outdoor_lifestyle"));
  assert.ok(!isOutdoorCoverConcept("commercial_studio"));

  assert.equal(
    resolveCoverConceptFromArtDirectorMode("emotional_lifestyle", "garden_tools"),
    "garden_scene",
  );
  assert.equal(
    resolveCoverConceptFromArtDirectorMode("emotional_lifestyle", "electronics"),
    "outdoor_lifestyle",
  );
  assert.equal(resolveCoverConceptFromArtDirectorMode("premium_brand"), "premium_minimal");
  assert.equal(
    resolveCoverConceptFromArtDirectorMode("technical_catalog", "electronics"),
    "tech_showcase",
  );
  assert.equal(resolveCoverConceptFromArtDirectorMode("marketplace_ctr"), undefined);

  assert.equal(
    resolveCoverConceptFromEnvironment("sunny suburban lawn path"),
    "garden_scene",
  );
  assert.equal(
    resolveCoverConceptFromEnvironment("modern home interior wooden floor"),
    "home_interior",
  );

  console.log("cover-concept mapping specs OK");
}

main();
