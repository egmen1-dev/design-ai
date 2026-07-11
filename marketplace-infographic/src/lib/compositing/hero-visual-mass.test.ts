import assert from "node:assert/strict";
import {
  computeHeroMaxProductSize,
  getHeroVisualMassPolicy,
  isFlatWideSilhouette,
  isHeroVisualMassEnabled,
  resolveHeroObjectScale,
} from "./hero-visual-mass";

function testFlagGating() {
  assert.equal(isHeroVisualMassEnabled({ DAOS_HERO_VISUAL_MASS: "0" } as NodeJS.ProcessEnv), false);
  assert.equal(isHeroVisualMassEnabled({ DAOS_HERO_VISUAL_MASS: "1" } as NodeJS.ProcessEnv), true);
  console.log("✔ hero visual mass flag gating");
}

function testObjectScaleBoost() {
  const env = { DAOS_HERO_VISUAL_MASS: "1" } as NodeJS.ProcessEnv;
  const boosted = resolveHeroObjectScale(0.75, env);
  assert.ok(boosted > 0.75, `expected boost, got ${boosted}`);
  assert.ok(boosted <= 0.92, `expected cap, got ${boosted}`);
  console.log("✔ objectScale multiplier applied");
}

function testFlatWideDetection() {
  assert.equal(isFlatWideSilhouette(400, 300), true);
  assert.equal(isFlatWideSilhouette(300, 400), false);
  console.log("✔ flat-wide silhouette detection");
}

function testHeroSizeExceedsLegacy() {
  const env = { DAOS_HERO_VISUAL_MASS: "1" } as NodeJS.ProcessEnv;
  const policy = getHeroVisualMassPolicy(env);
  assert.equal(policy.enabled, true);

  const legacy = computeHeroMaxProductSize({
    compositionLayout: undefined,
    objectScale: 0.75,
    canvasMaxW: 612,
    canvasMaxH: 580,
    productMaxW: 612,
    productMaxH: 696,
    flatWide: false,
    env: { DAOS_HERO_VISUAL_MASS: "0" } as NodeJS.ProcessEnv,
  });
  const hero = computeHeroMaxProductSize({
    compositionLayout: undefined,
    objectScale: 0.75,
    canvasMaxW: 612,
    canvasMaxH: 580,
    productMaxW: 612,
    productMaxH: 696,
    flatWide: true,
    env,
  });

  assert.ok(hero.maxW > legacy.maxW, `width ${hero.maxW} should exceed ${legacy.maxW}`);
  assert.ok(hero.maxH > legacy.maxH, `height ${hero.maxH} should exceed ${legacy.maxH}`);
  console.log("✔ hero mass sizing exceeds legacy");
}

function main() {
  testFlagGating();
  testObjectScaleBoost();
  testFlatWideDetection();
  testHeroSizeExceedsLegacy();
  console.log("==> hero-visual-mass tests OK");
}

main();
