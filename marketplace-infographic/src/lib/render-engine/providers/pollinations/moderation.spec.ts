/**
 * Pollinations moderation sanitization specs
 * Run: npx tsx src/lib/render-engine/providers/pollinations/moderation.spec.ts
 */
import assert from "node:assert/strict";
import {
  isPollinationsModerationError,
  sanitizePromptForModeration,
  stripNonLatinScript,
  buildModerationPromptVariants,
  resolveBareMinimalPrompt,
} from "./moderation";
import { buildRenderModelsChain } from "../../render-models";

function main() {
  assert.ok(
    isPollinationsModerationError(
      '{"success":false,"error":{"message":"Your request was rejected by content moderation."}}',
    ),
  );
  assert.ok(!isPollinationsModerationError("BAD_REQUEST invalid seed"));

  const cyrillic =
    "industrial workshop, Бензиновый генератор 3 кВт, rugged professional atmosphere";
  const level0 = sanitizePromptForModeration(cyrillic, 0);
  assert.ok(!level0.includes("генератор"), "Cyrillic product terms stripped");
  assert.ok(!/\bgenerator\b/i.test(level0), "generator replaced at level 0");
  assert.ok(level0.includes("professional"), "industrial softened");

  const level1 = sanitizePromptForModeration(cyrillic, 1);
  assert.ok(level1.includes("commercial product photography"));
  assert.ok(!level1.includes("rugged"), "risky mood terms dropped at level 1");

  const level2 = sanitizePromptForModeration(cyrillic, 2);
  assert.ok(level2.includes("cyclorama"));
  assert.ok(level2.length < 400, "level 2 is compact");

  const gardenPrompt =
    "sunny suburban lawn, garden path, wooden fence blurred, golden hour, clear grass foreground";
  const gardenLevel1 = sanitizePromptForModeration(gardenPrompt, 1, {
    coverConceptId: "garden_scene",
  });
  assert.ok(gardenLevel1.includes("lawn") || gardenLevel1.includes("garden"), "outdoor kept at L1");
  assert.ok(gardenLevel1.includes("outdoor commercial"), "outdoor prefix at L1");

  const gardenBare = resolveBareMinimalPrompt({ coverConceptId: "garden_scene" });
  assert.ok(!gardenBare.includes("grey studio"), "outdoor bare is not grey studio");
  assert.ok(gardenBare.includes("lawn") || gardenBare.includes("garden"), "outdoor bare keeps scene");

  const variants = buildModerationPromptVariants(cyrillic, {
    atmosphere: "rugged industrial",
    environment: "workshop studio",
  });
  assert.ok(variants.length >= 2);
  assert.notEqual(variants[0], variants[variants.length - 1]);

  assert.deepEqual(buildRenderModelsChain(), ["flux", "kontext", "seedream"]);
  assert.deepEqual(buildRenderModelsChain("gptimage")[0], "gptimage");
  assert.ok(buildRenderModelsChain("gptimage").includes("flux"));

  assert.equal(stripNonLatinScript("hello мир world"), "hello world");

  console.log("moderation specs OK", variants.length, "variants");
}

main();
