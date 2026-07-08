/**
 * DAOS Wave 25 — composite result placement bridge tests
 * Run: npx tsx src/lib/daos/tests/composite-result-bridge.test.ts
 */
import assert from "node:assert/strict";
import {
  extractCompositeProductPlacement,
  normalizeCompositePlacement,
} from "../compositor/composite-result-bridge";

const canvas = { width: 900, height: 1200 };

assert.equal(extractCompositeProductPlacement(null), undefined);
assert.equal(extractCompositeProductPlacement({}), undefined);
assert.equal(extractCompositeProductPlacement("bad"), undefined);
console.log("✓ unknown safe");

const extracted = extractCompositeProductPlacement({
  productPlacement: { left: 120, top: 180, width: 420, height: 520 },
  mergedPath: "/merged/test.png",
});
assert.ok(extracted);
assert.equal(extracted?.source, "productPlacement");
assert.equal(extracted?.bounds.width, 420);
console.log("✓ bbox extracted");

const normalized = normalizeCompositePlacement({
  compositeResult: {
    productPlacement: { left: 100, top: 150, width: 600, height: 700 },
  },
  canvas,
});
assert.ok(normalized);
assert.equal(normalized?.x, 100);
assert.equal(normalized?.y, 150);
assert.ok(Math.abs(normalized!.areaRatio - (600 * 700) / (900 * 1200)) < 0.0001);
assert.ok(Math.abs(normalized!.widthRatio - 600 / 900) < 0.0001);
assert.ok(Math.abs(normalized!.heightRatio - 700 / 1200) < 0.0001);
assert.equal(normalized?.source, "productPlacement");
console.log("✓ normalized ratios correct");

const missing = normalizeCompositePlacement({ compositeResult: { mergedPath: "/merged/x.png" }, canvas });
assert.equal(missing, undefined);
console.log("✓ missing placement safe");

console.log("\nAll composite-result-bridge tests passed.");
