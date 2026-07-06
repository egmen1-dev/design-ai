/**
 * DAOS Wave 20 — overlay quality audit tests
 * Run: npx tsx src/lib/daos/tests/overlay-quality-audit.test.ts
 */
import assert from "node:assert/strict";
import type { ConstitutionReport } from "@/lib/design/design-constitution";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import { analyzeOverlayQuality } from "../audit/overlay-quality-audit";

function lawReport(lawId: string, passed: boolean): ConstitutionReport {
  return {
    constitutionId: "marketplace_v1",
    constitutionVersion: "1.2",
    stage: "rendered_critique",
    passed,
    overallDesignScore: passed ? 90 : 70,
    scores: {
      compositionScore: 80,
      hierarchyScore: 80,
      whitespaceScore: passed ? 85 : 55,
      luxuryScore: 80,
      typographyScore: 80,
      contrastScore: passed ? 85 : 60,
      marketplaceScore: 80,
      brandScore: 80,
      visualNoiseScore: 80,
      overallDesignScore: passed ? 90 : 70,
    },
    entries: [
      {
        lawId,
        lawName: lawId,
        passed,
        severity: "error",
        reason: passed ? undefined : `${lawId} failed`,
      },
    ],
    violations: passed ? [] : [{ lawId, message: `${lawId} violation`, severity: "error" }],
    patchesApplied: [],
    attempts: 1,
  };
}

const baseLayoutSpec: LayoutSpec = {
  heroPosition: "right",
  heroScale: 62,
  headlineArea: "left",
  benefitsArea: "left_panel",
  ctaArea: "badge_under_title",
  whitespaceTarget: 28,
  maxIcons: 2,
  maxSecondaryObjects: 1,
  maxColors: 4,
  palette: ["#111111", "#ffffff"],
  backgroundStyle: "clean_studio",
  lightingStyle: "soft_key_top_left",
  visualWeightMap: { hero: 62, headline: 12, benefits: 10, cta: 6, background: 10 },
  hierarchy: {
    headline: "primary",
    hero: "primary",
    benefits: "secondary",
    cta: "secondary",
    decorative: "hidden",
  },
};

const lowDensity = analyzeOverlayQuality({
  canvas: { width: 900, height: 1200 },
  overlayElements: [{ kind: "headline", areaPct: 0.08 }],
  layoutSpec: baseLayoutSpec,
  compositionMetrics: {
    textAreaPct: 10,
    plaqueAreaPct: 4,
    whitespacePct: 30,
    overlapPct: 1,
  },
  hasComposite: true,
});

const highDensity = analyzeOverlayQuality({
  canvas: { width: 900, height: 1200 },
  overlayElements: [
    { kind: "headline", areaPct: 0.12 },
    { kind: "subtitle", areaPct: 0.08 },
    { kind: "bullets", areaPct: 0.15 },
    { kind: "plaques", areaPct: 0.12 },
    { kind: "leftPanel", areaPct: 0.1 },
    { kind: "badge", areaPct: 0.05 },
    { kind: "logo", areaPct: 0.04 },
  ],
  layoutSpec: baseLayoutSpec,
  compositionMetrics: {
    textAreaPct: 28,
    plaqueAreaPct: 20,
    whitespacePct: 58,
    overlapPct: 6,
  },
  governanceReport: [lawReport("LAW_003", false)],
  hasComposite: true,
});

assert.ok(highDensity.score < lowDensity.score);
assert.ok(highDensity.warnings.some((w) => w.code === "OVERLAY_ELEMENT_COUNT_HIGH"));
assert.ok(highDensity.warnings.some((w) => w.code === "OVERLAY_DENSITY_HIGH"));
console.log("✓ high density lowers score");

const law003 = analyzeOverlayQuality({
  governanceReport: [lawReport("LAW_003", false)],
  layoutSpec: baseLayoutSpec,
  compositionMetrics: { whitespacePct: 56 },
});
assert.equal(law003.law003WhitespaceViolation, true);
assert.ok(law003.warnings.some((w) => w.code === "LAW_003_WHITESPACE_VIOLATION"));
console.log("✓ LAW_003 detected");

const law014 = analyzeOverlayQuality({
  governanceReport: [lawReport("LAW_014", false)],
  layoutSpec: baseLayoutSpec,
  compositionMetrics: { overlapPct: 6 },
});
assert.equal(law014.law014ContrastViolation, true);
assert.ok(law014.warnings.some((w) => w.code === "LAW_014_CONTRAST_VIOLATION"));
console.log("✓ LAW_014 detected");

const lowComposerRisk = analyzeOverlayQuality({
  layoutSpec: baseLayoutSpec,
  composerQualityAudit: { finalCompositionRisk: 0.2 } as never,
  diagnosticReport: { finalQuality: { issues: [], notPngOverlay: 95 } as never },
  hasComposite: true,
});
const highComposerRisk = analyzeOverlayQuality({
  layoutSpec: baseLayoutSpec,
  composerQualityAudit: { finalCompositionRisk: 0.62 } as never,
  diagnosticReport: {
    finalQuality: { issues: ["png_overlay_feel"], notPngOverlay: 70 } as never,
  },
  hasComposite: false,
});
assert.ok(highComposerRisk.pngOverlayFeelRisk > lowComposerRisk.pngOverlayFeelRisk);
console.log("✓ pngOverlayFeelRisk escalates with composer risk");

const deterministic = analyzeOverlayQuality({
  layoutSpec: baseLayoutSpec,
  overlayElements: [{ kind: "headline", areaPct: 0.1 }],
  compositionMetrics: { textAreaPct: 12, whitespacePct: 30, overlapPct: 2 },
  hasComposite: true,
});
const deterministicAgain = analyzeOverlayQuality({
  layoutSpec: baseLayoutSpec,
  overlayElements: [{ kind: "headline", areaPct: 0.1 }],
  compositionMetrics: { textAreaPct: 12, whitespacePct: 30, overlapPct: 2 },
  hasComposite: true,
});
assert.deepEqual(deterministic, deterministicAgain);
console.log("✓ audit is deterministic");

console.log("\nAll overlay-quality-audit tests passed.");
