/**
 * DAOS Wave 18 — v17 prompt compressor tests
 * Run: npx tsx src/lib/daos/tests/v17-prompt-compressor.test.ts
 */
import assert from "node:assert/strict";
import {
  applyDaosV17PromptCompressionToPayload,
  compressDaosV17PromptAdditions,
  DAOS_V17_PROMPT_COMPRESSION_MAX_CHARS,
  DAOS_V17_RELEVANCE_THRESHOLD,
  isDaosV17PromptCompressionEnabled,
  scoreDaosPromptAdditionRelevance,
} from "../adapters/v17-prompt-compressor";
import { attachDaosV17PromptBridgeToPayload } from "../adapters/v17-prompt-bridge";
import { analyzeDaosMeaningLoss } from "../debug/daos-meaning-loss";
import type { CompiledRenderPayload } from "@/lib/render-engine/types";

function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
  const previous: Record<string, string | undefined> = {};
  for (const key of Object.keys(vars)) {
    previous[key] = process.env[key];
    const value = vars[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  try {
    fn();
  } finally {
    for (const key of Object.keys(vars)) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

const longBridgeBlock = [
  "DAOS V17 CONTEXT:",
  "Commercial goal: Premium cordless drill for professionals",
  "Main message: Professional torque drill",
  "USP: Professional torque; 65 Nm; best-in-class",
  "Creative concept: Power in your hand",
  "Visual scene: Industrial studio with macro grip hero",
  "Composition: hero_right with negative space left",
  "Render strategy: hybrid_shadow_scene",
  "Missing specs: lighting, trustDrivers, marketSnippet",
  "Modules must not ignore: layout_coordinates, hierarchy, typography_zones, ctr_wording",
].join("\n");

const longModulesBlock = [
  "DAOS V17 MODULES:",
  "[layout_coordinates] hero right, negative space left, product zone center 0.62 0.48",
  "[hierarchy] main Professional torque drill, secondary 65 Nm",
  "[typography_zones] headline top safe, subhead lower third",
  "[ctr_wording] CTR wording intent: main message: Professional torque drill; click trigger: Shop now; trust driver: 2-year warranty",
].join("\n");

const compressed = compressDaosV17PromptAdditions({
  bridgeBlock: longBridgeBlock,
  modulesBlock: longModulesBlock,
  ctrBlock: "[ctr_wording] CTR wording intent: main message: Professional torque drill",
  maxTotalChars: DAOS_V17_PROMPT_COMPRESSION_MAX_CHARS,
  visualScene: "Industrial studio with macro grip hero",
  mainMessage: "Professional torque drill",
  commercialGoal: "Premium cordless drill for professionals",
  creativeConcept: "Power in your hand",
});

assert.ok(compressed.compressedLength <= DAOS_V17_PROMPT_COMPRESSION_MAX_CHARS);
assert.ok(compressed.originalLength > compressed.compressedLength);
assert.ok(!compressed.compressedText.includes("Missing specs"));
assert.ok(!compressed.compressedText.includes("Modules must not ignore"));
console.log("✓ compresses to <=450 and drops low-priority bridge noise");

const duplicateInput = {
  bridgeBlock: [
    "DAOS V17 CONTEXT:",
    "Commercial goal: Premium cordless drill",
    "Main message: Professional torque drill",
    "Visual scene: Industrial studio hero",
  ].join("\n"),
  modulesBlock: [
    "DAOS V17 MODULES:",
    "[hierarchy] main Professional torque drill, commercial Premium cordless drill",
  ].join("\n"),
  maxTotalChars: DAOS_V17_PROMPT_COMPRESSION_MAX_CHARS,
  visualScene: "Industrial studio hero",
  mainMessage: "Professional torque drill",
  commercialGoal: "Premium cordless drill",
};

const deduped = compressDaosV17PromptAdditions(duplicateInput);
const normalized = deduped.compressedText.toLowerCase();
const torqueCount = (normalized.match(/professional torque drill/g) ?? []).length;
assert.ok(torqueCount <= 2);
console.log("✓ removes duplicate commercial phrases");

const lowRelevanceScore = scoreDaosPromptAdditionRelevance({
  bridgeBlock: [
    "DAOS V17 CONTEXT:",
    "Commercial goal: synergy leverage innovative",
    "Missing specs: lighting, trustDrivers, marketSnippet, composition",
    "Modules must not ignore: layout_coordinates, hierarchy, typography_zones, ctr_wording",
  ].join("\n"),
  modulesBlock: [
    "DAOS V17 MODULES:",
    "[ctr_wording] CTR wording intent: main message: synergy leverage innovative best-in-class holistic cutting-edge",
  ].join("\n"),
  ctrBlock:
    "[ctr_wording] CTR wording intent: main message: synergy leverage innovative best-in-class holistic cutting-edge",
  maxTotalChars: DAOS_V17_PROMPT_COMPRESSION_MAX_CHARS,
});

assert.ok(lowRelevanceScore < DAOS_V17_RELEVANCE_THRESHOLD);

const highRelevanceScore = scoreDaosPromptAdditionRelevance({
  bridgeBlock: longBridgeBlock,
  modulesBlock: longModulesBlock,
  maxTotalChars: DAOS_V17_PROMPT_COMPRESSION_MAX_CHARS,
  visualScene: "Industrial studio with macro grip hero",
  mainMessage: "Professional torque drill",
  creativeConcept: "Power in your hand",
});

assert.ok(highRelevanceScore >= DAOS_V17_RELEVANCE_THRESHOLD);
console.log("✓ relevance gate thresholds behave as expected");

const basePayload: CompiledRenderPayload = {
  model: "flux",
  prompt: "studio backdrop, empty foreground",
  width: 900,
  height: 1200,
  modulesUsed: ["scene"],
  modulesIgnored: ["layout_coordinates", "hierarchy", "typography_zones", "ctr_wording"],
};

withEnv(
  {
    DAOS_V17_PROMPT_BRIDGE: "1",
    DAOS_V17_PROMPT_COMPRESSION: "1",
  },
  () => {
    assert.equal(isDaosV17PromptCompressionEnabled(), true);

    const bridged = attachDaosV17PromptBridgeToPayload(basePayload, {
      commercialGoal: "synergy leverage innovative",
      mainMessage: "synergy leverage innovative",
      visualScene: "pending",
      creativeConcept: "holistic cutting-edge",
      missingSpecs: ["lighting", "trustDrivers", "composition", "marketSnippet"],
      completenessScore: 0.4,
      warnings: ["generic"],
    });

    const additions = bridged.prompt.slice(basePayload.prompt.length).trim();
    const compressedPayload = applyDaosV17PromptCompressionToPayload(
      {
        ...bridged,
        daosV17Bridge: { applied: true, length: additions.length, preview: additions, modulesAddressed: [] },
      },
      { basePrompt: basePayload.prompt },
    );

    assert.equal(compressedPayload.prompt, basePayload.prompt);
    assert.equal(compressedPayload.daosV17Compression?.additionsSkipped, true);
    assert.equal(compressedPayload.daosV17Compression?.skipReason, "low_relevance");
    assert.equal(basePayload.prompt, "studio backdrop, empty foreground");
    console.log("✓ low relevance skips additions without mutating base payload");
  },
);

withEnv(
  {
    DAOS_V17_PROMPT_BRIDGE: "1",
    DAOS_V17_MODULES_BRIDGE: "1",
    DAOS_V17_PROMPT_COMPRESSION: "1",
  },
  () => {
    const additionsText = `${longBridgeBlock}\n\n${longModulesBlock}`;
    const fullPrompt = `${basePayload.prompt}\n\n${additionsText}`;
    const source: CompiledRenderPayload = {
      ...basePayload,
      prompt: fullPrompt,
      daosV17Bridge: {
        applied: true,
        length: longBridgeBlock.length,
        preview: longBridgeBlock.slice(0, 120),
        modulesAddressed: ["layout_coordinates", "hierarchy"],
      },
      daosV17Modules: {
        applied: true,
        length: longModulesBlock.length,
        preview: longModulesBlock.slice(0, 120),
        modulesCompiled: ["layout_coordinates", "hierarchy", "typography_zones", "ctr_wording"],
        modulesStillIgnored: [],
      },
    };

    const compressedPayload = applyDaosV17PromptCompressionToPayload(source, {
      basePrompt: basePayload.prompt,
      visualScene: "Industrial studio with macro grip hero",
      mainMessage: "Professional torque drill",
      creativeConcept: "Power in your hand",
    });

    assert.notEqual(compressedPayload, source);
    assert.equal(source.prompt, fullPrompt);
    assert.ok(compressedPayload.prompt.length > basePayload.prompt.length);
    assert.ok(
      (compressedPayload.daosV17Compression?.compressedAdditionLength ?? 0) <=
        DAOS_V17_PROMPT_COMPRESSION_MAX_CHARS,
    );
    assert.equal(compressedPayload.daosV17Compression?.additionsSkipped, false);
    console.log("✓ high relevance keeps compressed additions without mutating source payload");

    const meaning = analyzeDaosMeaningLoss(
      {
        projectId: "p1",
        runId: "r1",
        status: "active",
        architectureVersion: "v2",
        decisionTrace: [],
        events: [],
        debug: [],
        renderBlueprint: {
          id: "rb1",
          projectId: "p1",
          version: 1,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          source: "test",
          decisionTrace: [],
          renderStrategy: "hybrid_shadow_scene",
          promptAllowedOnlyInAdapter: true,
        },
      },
      {
        daosV17PromptCompressionEnabled: true,
        renderDebug: {
          createdAt: new Date().toISOString(),
          daosPromptCompressionEnabled: true,
          daosPromptAdditionsSkipped: true,
        },
      },
    );
    assert.ok(
      meaning.warnings.some((w) => w.code === "DAOS_PROMPT_ADDITIONS_SKIPPED_LOW_RELEVANCE"),
    );
    console.log("✓ meaning-loss surfaces skipped-low-relevance warning");
  },
);

withEnv({ DAOS_V17_PROMPT_COMPRESSION: undefined }, () => {
  const passthrough = applyDaosV17PromptCompressionToPayload(
    {
      ...basePayload,
      prompt: `${basePayload.prompt}\n\n${longBridgeBlock}`,
      daosV17Bridge: {
        applied: true,
        length: longBridgeBlock.length,
        preview: longBridgeBlock,
        modulesAddressed: [],
      },
    },
    { basePrompt: basePayload.prompt },
  );
  assert.equal(passthrough.prompt.includes("DAOS V17 CONTEXT:"), true);
  assert.equal(passthrough.daosV17Compression, undefined);
  console.log("✓ compression flag off leaves payload unchanged");
});

console.log("\nAll v17-prompt-compressor tests passed.");
