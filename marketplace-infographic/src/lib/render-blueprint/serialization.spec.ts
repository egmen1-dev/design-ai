/**
 * DESIGN AI v18 — Serialization Rules tests (Chapter 3.12)
 */

import assert from "node:assert/strict";
import {
  createEmptyRenderBlueprint,
  serializeBlueprint,
  deserializeBlueprint,
  validateSerializable,
  computeBlueprintChecksum,
  exportBlueprintToJson,
  importBlueprintFromJson,
  assertSerializationRoundTrip,
  migrateBlueprint,
  canonicalStringify,
  COMPRESSION_THRESHOLD_BYTES,
} from "./index";

function testCanonicalJsonSortsKeys() {
  const a = canonicalStringify({ z: 1, a: 2, m: { b: 1, a: 2 } });
  const b = canonicalStringify({ a: 2, m: { a: 2, b: 1 }, z: 1 });
  assert.equal(a, b);
  assert.equal(a, '{"a":2,"m":{"a":2,"b":1},"z":1}');
  console.log("✔ canonical JSON sorts keys deterministically");
}

function testSerializeEnvelope() {
  const bp = createEmptyRenderBlueprint({ seed: 1, category: "electronics" });
  const { envelope } = serializeBlueprint(bp);
  assert.equal(envelope.schemaVersion, 1);
  assert.equal(envelope.version, 18);
  assert.equal(envelope.checksum.length, 64);
  assert.ok(envelope.metadata.serializedAt > 0);
  console.log("✔ serializeBlueprint produces envelope with version and checksum");
}

function testDeterministicChecksum() {
  const bp = createEmptyRenderBlueprint({ seed: 2, category: "electronics" });
  const e1 = serializeBlueprint(bp);
  const e2 = serializeBlueprint(bp);
  assert.equal(e1.envelope.checksum, e2.envelope.checksum);
  assert.equal(
    canonicalStringify(e1.envelope.blueprint),
    canonicalStringify(e2.envelope.blueprint),
  );
  console.log("✔ deterministic serialization — same blueprint yields same checksum");
}

function testRoundTrip() {
  const bp = createEmptyRenderBlueprint({ seed: 3, category: "cosmetics" });
  const { json } = serializeBlueprint(bp);
  const { blueprint: restored } = deserializeBlueprint(json);
  assert.equal(restored.meta.version, bp.meta.version);
  assert.equal(restored.product.category, bp.product.category);
  console.log("✔ round-trip preserves blueprint");
}

function testGoldenRule() {
  const bp = createEmptyRenderBlueprint({ seed: 4, category: "tools" });
  assert.doesNotThrow(() => assertSerializationRoundTrip(bp));
  console.log("✔ assertSerializationRoundTrip golden rule");
}

function testMigrateV17() {
  const v17 = {
    meta: {
      id: "legacy",
      version: 17,
      revision: 0,
      generator: "flux" as const,
      createdAt: Date.now(),
      seed: 1,
      retry: 0,
      layout: "marketplace" as const,
    },
    environment: "kitchen",
    product: {
      category: "x",
      subCategory: "x",
      dominantColor: ["#000"],
      materials: [],
      finish: "matte" as const,
      shape: "rect",
      cutout: true,
    },
    constraints: { noText: true },
  };
  const { blueprint } = migrateBlueprint(v17);
  assert.equal(blueprint.meta.version, 18);
  assert.ok(blueprint.scene);
  assert.equal(blueprint.scene.environment, "kitchen");
  console.log("✔ migrateBlueprint upgrades v17 to v18");
}

function testUnknownFieldsPreserved() {
  const bp = createEmptyRenderBlueprint({ seed: 5, category: "home" }) as Record<string, unknown>;
  bp.futureFeature = { enabled: true };
  const { envelope } = serializeBlueprint(bp as ReturnType<typeof createEmptyRenderBlueprint>);
  assert.deepEqual(envelope.unknownFields?.futureFeature, { enabled: true });
  const { blueprint: restored } = deserializeBlueprint(envelope);
  assert.deepEqual((restored as Record<string, unknown>).futureFeature, { enabled: true });
  console.log("✔ unknown top-level blueprint fields preserved in unknownFields");
}

function testRejectFunctions() {
  const bad = { meta: { version: 18 }, fn: () => {} };
  const result = validateSerializable(bad);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.code === "CONTAINS_FUNCTION"));
  console.log("✔ validateSerializable rejects functions");
}

function testRejectBase64() {
  const bad = {
    meta: { version: 18 },
    image:
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  };
  const result = validateSerializable(bad);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.code === "BINARY_DATA"));
  console.log("✔ validateSerializable rejects base64 binary data");
}

function testRejectSecrets() {
  const bad = { meta: { version: 18 }, apiKey: "sk-secret" };
  const result = validateSerializable(bad);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.code === "SECRET_FIELD"));
  console.log("✔ validateSerializable rejects secret field names");
}

function testRejectPrompt() {
  const bad = { meta: { version: 18 }, prompt: "generate image" };
  const result = validateSerializable(bad);
  assert.equal(result.ok, false);
  assert.ok(result.issues.some((i) => i.code === "PROMPT_STORED"));
  console.log("✔ validateSerializable rejects prompt in blueprint");
}

function testExportImport() {
  const bp = createEmptyRenderBlueprint({ seed: 6, category: "pets" });
  const json = exportBlueprintToJson(bp);
  const parsed = JSON.parse(json);
  assert.equal(parsed.version, 18);
  const restored = importBlueprintFromJson(json);
  assert.equal(restored.meta.version, 18);
  console.log("✔ export and import blueprint JSON round-trip");
}

function testChecksumMismatch() {
  const bp = createEmptyRenderBlueprint({ seed: 7, category: "garden" });
  const { envelope } = serializeBlueprint(bp);
  envelope.checksum = "deadbeef";
  assert.throws(() => deserializeBlueprint(envelope), /Checksum mismatch/);
  console.log("✔ deserialize rejects checksum mismatch");
}

function testChecksumStable() {
  const bp = createEmptyRenderBlueprint({ seed: 8, category: "appliances" });
  assert.equal(computeBlueprintChecksum(bp), computeBlueprintChecksum(bp));
  console.log("✔ computeBlueprintChecksum is stable");
}

function testCompressionThreshold() {
  assert.equal(COMPRESSION_THRESHOLD_BYTES, 256 * 1024);
  const bp = createEmptyRenderBlueprint({ seed: 9, category: "x" });
  const pad = "serialization-padding ".repeat(14_000);
  const { compressed, metadata } = serializeBlueprint(bp, { includeUnknown: { _pad: pad } });
  assert.ok(metadata.compressed);
  assert.equal(metadata.compression, "gzip");
  assert.ok(compressed && compressed.length > 0);
  const { blueprint: restored, unknownFields } = deserializeBlueprint(compressed!);
  assert.equal(restored.meta.seed, bp.meta.seed);
  assert.equal(unknownFields._pad, pad);
  console.log("✔ compression applied when payload exceeds 256 KB");
}

function main() {
  testCanonicalJsonSortsKeys();
  testSerializeEnvelope();
  testDeterministicChecksum();
  testRoundTrip();
  testGoldenRule();
  testMigrateV17();
  testUnknownFieldsPreserved();
  testRejectFunctions();
  testRejectBase64();
  testRejectSecrets();
  testRejectPrompt();
  testExportImport();
  testChecksumMismatch();
  testChecksumStable();
  testCompressionThreshold();
  console.log("\nserialization.spec.ts — all passed");
}

main();
