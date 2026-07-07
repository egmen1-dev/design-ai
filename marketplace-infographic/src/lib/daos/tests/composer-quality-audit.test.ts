/**
 * DAOS Wave 19 — composer quality audit tests
 * Run: npx tsx src/lib/daos/tests/composer-quality-audit.test.ts
 */
import assert from "node:assert/strict";
import {
  analyzeComposerQuality,
  summarizeComposerQualityAudit,
} from "../audit/composer-quality-audit";

const baseCanvas = { width: 900, height: 1200 };

const missing = analyzeComposerQuality({});
assert.equal(missing.productAreaRatio, undefined);
assert.ok(missing.warnings.some((w) => w.code === "COMPOSER_PRODUCT_AREA_UNKNOWN"));
assert.ok(missing.warnings.some((w) => w.code === "COMPOSER_SHADOW_CONTACT_MISSING"));
assert.ok(missing.warnings.some((w) => w.code === "COMPOSER_OVERLAY_ELEMENTS_UNKNOWN"));
assert.ok(missing.finalCompositionRisk > 0);
console.log("✓ missing inputs return safe deterministic audit");

const lowArea = analyzeComposerQuality({
  canvas: baseCanvas,
  productPlacement: { left: 350, top: 450, width: 120, height: 140 },
  overlayElements: [{ kind: "headline", areaPct: 0.08 }],
  compositingHints: { shadowType: "contact-soft" },
  hasComposite: true,
  qualityHasShadows: true,
  finalImagePath: "/generated/final.png",
  productCutoutPath: "/generated/cutout.png",
  backgroundPath: "/backgrounds/bg.png",
});
assert.ok((lowArea.productAreaRatio ?? 1) < 0.35);
assert.ok(lowArea.warnings.some((w) => w.code === "COMPOSER_PRODUCT_AREA_TOO_LOW"));
console.log("✓ low productAreaRatio triggers warning");

const highArea = analyzeComposerQuality({
  canvas: baseCanvas,
  productPlacement: { left: 40, top: 60, width: 820, height: 1050 },
  overlayElements: [{ kind: "headline", areaPct: 0.05 }],
  compositingHints: { shadowType: "contact-soft" },
  hasComposite: true,
  qualityHasShadows: true,
  finalImagePath: "/generated/final.png",
  productCutoutPath: "/generated/cutout.png",
  backgroundPath: "/backgrounds/bg.png",
});
assert.ok((highArea.productAreaRatio ?? 0) > 0.75);
assert.ok(highArea.warnings.some((w) => w.code === "COMPOSER_PRODUCT_AREA_TOO_HIGH"));
console.log("✓ high productAreaRatio triggers warning");

const fallback = analyzeComposerQuality({
  canvas: baseCanvas,
  productPlacement: { left: 220, top: 260, width: 420, height: 520 },
  overlayElements: [{ kind: "headline", areaPct: 0.1 }],
  compositingHints: { shadowType: "contact-soft" },
  hasComposite: true,
  qualityHasShadows: true,
  finalImagePath: "/generated/final.png",
  productCutoutPath: "/generated/cutout.png",
  backgroundPath: "/backgrounds/bg.png",
  renderDebug: {
    createdAt: new Date().toISOString(),
    fallbackUsed: true,
  },
});
const noFallback = analyzeComposerQuality({
  canvas: baseCanvas,
  productPlacement: { left: 220, top: 260, width: 420, height: 520 },
  overlayElements: [{ kind: "headline", areaPct: 0.1 }],
  compositingHints: { shadowType: "contact-soft" },
  hasComposite: true,
  qualityHasShadows: true,
  finalImagePath: "/generated/final.png",
  productCutoutPath: "/generated/cutout.png",
  backgroundPath: "/backgrounds/bg.png",
  renderDebug: {
    createdAt: new Date().toISOString(),
    fallbackUsed: false,
  },
});
assert.ok(fallback.finalCompositionRisk > noFallback.finalCompositionRisk);
assert.ok(fallback.warnings.some((w) => w.code === "COMPOSER_RENDER_FALLBACK_USED"));
console.log("✓ fallback raises composition risk");

const deterministicInput = {
  canvas: baseCanvas,
  productPlacement: { left: 220, top: 260, width: 420, height: 520 },
  overlayElements: [{ kind: "headline", areaPct: 0.1 }],
  compositingHints: { shadowType: "contact-soft" },
  hasComposite: true,
  qualityHasShadows: true,
  finalImagePath: "/generated/final.png",
  productCutoutPath: "/generated/cutout.png",
  backgroundPath: "/backgrounds/bg.png",
};
const first = summarizeComposerQualityAudit(analyzeComposerQuality(deterministicInput));
const second = summarizeComposerQualityAudit(analyzeComposerQuality(deterministicInput));
assert.deepEqual(first, second);
assert.ok(first.score >= 0 && first.score <= 100);
assert.ok(typeof first.finalCompositionRisk === "number");
console.log("✓ summarize score is deterministic");

console.log("\nAll composer-quality-audit tests passed.");
