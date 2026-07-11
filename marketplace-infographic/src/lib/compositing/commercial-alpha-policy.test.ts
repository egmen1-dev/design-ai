import assert from "node:assert/strict";
import {
  PRODUCT_ALPHA_MAX_HEIGHT_PX,
  PRODUCT_ALPHA_MAX_WIDTH_PX,
  PRODUCT_MAX_WIDTH_PX,
  PRODUCT_TARGET_MAX_HEIGHT_PX,
} from "@/lib/product-render-policy";
import {
  buildCommercialAlphaPolicyDiagnostics,
  COMMERCIAL_ALPHA_POLICY_VERSION,
} from "./commercial-alpha-policy";

const diagnostics = buildCommercialAlphaPolicyDiagnostics();

assert.equal(PRODUCT_ALPHA_MAX_WIDTH_PX, PRODUCT_MAX_WIDTH_PX);
assert.equal(PRODUCT_ALPHA_MAX_HEIGHT_PX, PRODUCT_TARGET_MAX_HEIGHT_PX);
assert.equal(diagnostics.alphaPolicyConsistency, true);
assert.equal(diagnostics.alphaPolicySource, "aligned");
assert.equal(diagnostics.alphaPolicyWidth, 612);
assert.equal(diagnostics.alphaPolicyHeight, 696);
assert.equal(diagnostics.alphaPolicyWarnings.length, 0);
assert.equal(COMMERCIAL_ALPHA_POLICY_VERSION, "1.0.0-sprint7b");

console.log("commercial-alpha-policy OK");
