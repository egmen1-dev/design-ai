/**
 * DAOS Wave 26 — safe extract area tests
 * Run: npx tsx src/lib/daos/tests/safe-extract-area.test.ts
 */
import assert from "node:assert/strict";
import {
  clampExtractArea,
  createSafeExtractArea,
  validateExtractArea,
} from "../compositor/safe-extract-area";

const image = { width: 900, height: 1200 };

const negative = createSafeExtractArea({ left: -20, top: -10, width: 200, height: 180 }, image);
assert.equal(negative.area.left, 0);
assert.equal(negative.area.top, 0);
assert.ok(negative.corrected);
assert.ok(negative.warnings.includes("LEFT_NEGATIVE"));
assert.ok(negative.warnings.includes("TOP_NEGATIVE"));
console.log("✓ negative left/top clamp");

const overflow = createSafeExtractArea({ left: 800, top: 1000, width: 200, height: 300 }, image);
assert.ok(overflow.area.left + overflow.area.width <= image.width);
assert.ok(overflow.area.top + overflow.area.height <= image.height);
assert.ok(overflow.corrected);
console.log("✓ too large width/height clamp");

const zero = createSafeExtractArea({ left: 100, top: 200, width: 0, height: -5 }, image);
assert.ok(zero.area.width >= 1);
assert.ok(zero.area.height >= 1);
assert.ok(zero.corrected);
console.log("✓ zero width/height fixed");

const outside = createSafeExtractArea({ left: 950, top: 1300, width: 40, height: 40 }, image);
assert.ok(outside.area.left >= 0);
assert.ok(outside.area.top >= 0);
assert.ok(outside.warnings.includes("AREA_OUTSIDE_CANVAS"));
assert.ok(outside.warnings.includes("FALLBACK_CENTERED_AREA"));
console.log("✓ area outside canvas fallback");

const valid = createSafeExtractArea({ left: 120, top: 180, width: 420, height: 520 }, image);
assert.deepEqual(valid.area, { left: 120, top: 180, width: 420, height: 520 });
assert.equal(valid.corrected, false);
assert.equal(valid.warnings.length, 0);
console.log("✓ valid area unchanged");

assert.deepEqual(validateExtractArea(valid.area, image), []);
assert.ok(clampExtractArea(valid.area, image).width >= 1);
console.log("✓ validate/clamp helpers");

console.log("\nAll safe-extract-area tests passed.");
