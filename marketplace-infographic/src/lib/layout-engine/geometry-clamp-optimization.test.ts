import assert from "node:assert/strict";
import { buildLayoutFromTemplate } from "./builder";
import {
  buildGeometryClampDiagnostics,
  legacyFinalHeightPct,
  GEOMETRY_CLAMP_VERSION,
} from "./geometry-clamp-optimization";
import { PRODUCT_FINAL_HEIGHT_MAX_PCT, PRODUCT_FINAL_HEIGHT_LEGACY_MAX_PCT } from "./constants";
import { getTemplate } from "./templates";
import { computeMaxProductSize } from "../compositing/commercial-calibration";
import type { CardMeaning } from "./types";

const meaning: CardMeaning = {
  title: "Тестовый товар",
  subtitle: "Качество",
  feature: "Мотор",
  badge: "ХИТ",
  emotion: "Надёжность",
  style: "Premium",
  priority: "product",
};

const posterTemplate = getTemplate("poster");
const { layout } = buildLayoutFromTemplate(posterTemplate, meaning);

assert.ok(layout.product.maxHeightPct <= PRODUCT_FINAL_HEIGHT_MAX_PCT + 0.01);
assert.ok(layout.product.maxHeightPct < PRODUCT_FINAL_HEIGHT_LEGACY_MAX_PCT);

const legacyH = legacyFinalHeightPct(posterTemplate.productScale);
assert.ok(legacyH > PRODUCT_FINAL_HEIGHT_MAX_PCT);

const diag = buildGeometryClampDiagnostics({
  layout,
  productScale: posterTemplate.productScale,
  objectScale: 1.0,
});

assert.equal(diag.geometryClampSource, "sprint8b_finalH_58");
assert.equal(diag.geometryHeightBindingBefore, "height_binding");
assert.equal(diag.geometryPolicyCeilingReachable, true);
assert.equal(GEOMETRY_CLAMP_VERSION, "1.0.0-sprint8b");

const allowed = computeMaxProductSize(layout, 1.0, "calibrated").placementAreaPct;
assert.ok(allowed >= 37, `expected geometry ceiling near policy max, got ${allowed}`);

console.log("geometry-clamp-optimization OK");
