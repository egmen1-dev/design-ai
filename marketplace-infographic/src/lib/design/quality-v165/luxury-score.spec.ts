/**
 * Unit test strategy (v16.5) — run with: npx tsx src/lib/design/quality-v165/luxury-score.spec.ts
 */
import assert from "node:assert/strict";
import { LAYOUT_SPEC_DEFAULTS } from "@/lib/design/layout-spec";
import { computeLuxuryScore } from "./luxury-score";
import { validateEyeFlow } from "./eye-flow";
import { analyzeVisualNoise } from "./visual-noise";
import type { CompositionLayout } from "@/lib/composition/types";

const mockLayout = (overrides: Partial<CompositionLayout["metrics"]> = {}): CompositionLayout =>
  ({
    canvas: { width: 900, height: 1200 },
    safeInsetPct: 5,
    product: { left: 45, top: 20, width: 50, height: 55, centerX: 70, centerY: 48, maxWidthPct: 50, maxHeightPct: 55, areaPct: 65, rotationDeg: 0 },
    headline: { left: 5, top: 8, width: 38, height: 12, fontSizePct: 5 },
    subtitle: { left: 5, top: 22, width: 30, height: 5, fontSizePct: 2.5 },
    leftPanel: { left: 5, top: 35, width: 32, height: 8 },
    rightSidebar: { left: 0, top: 0, width: 0, height: 0 },
    bullets: { left: 0, top: 0, width: 0, height: 0, itemHeightPct: 0, gapPct: 0, maxCount: 1 },
    plaques: { smallWidthPct: 8, mediumWidthPct: 12, largeWidthPct: 16, heightPct: 6, maxTotalAreaPct: 8 },
    icon: { sizePct: 3, textGapPct: 1 },
    textSide: "left",
    metrics: {
      productAreaPct: 65,
      textAreaPct: 12,
      plaqueAreaPct: 6,
      whitespacePct: 28,
      overlapPct: 0,
      visualCenterX: 58,
      visualCenterY: 48,
      minEdgeInsetPct: 5,
      ...overrides,
    },
    valid: true,
    issues: [],
    adjustments: [],
  }) as CompositionLayout;

// LuxuryScore passes premium layout
{
  const r = computeLuxuryScore({
    layout: mockLayout(),
    meaning: { title: "Электричество всегда под рукой", subtitle: "", feature: "3 кВт", badge: "", emotion: "", style: "", priority: "product" },
    layoutSpec: LAYOUT_SPEC_DEFAULTS,
  });
  assert.ok(r.total >= 75, `expected luxury >= 75, got ${r.total}`);
}

// LuxuryScore fails cluttered layout
{
  const r = computeLuxuryScore({
    layout: mockLayout({ whitespacePct: 12, overlapPct: 5, textAreaPct: 22 }),
    meaning: { title: "Очень длинный заголовок который не помещается в одну строку каталога", subtitle: "x", feature: "a", badge: "b", emotion: "", style: "", priority: "product" },
    layoutSpec: LAYOUT_SPEC_DEFAULTS,
  });
  assert.ok(r.total < 75, `expected luxury < 75, got ${r.total}`);
}

// Eye flow valid order
{
  const r = validateEyeFlow({
    layout: mockLayout(),
    layoutSpec: LAYOUT_SPEC_DEFAULTS,
    hasBenefits: true,
    hasCta: false,
  });
  assert.equal(r.validOrder, true);
}

// Visual noise rejects busy scene
{
  const r = analyzeVisualNoise({
    layout: mockLayout({ whitespacePct: 14, plaqueAreaPct: 14 }),
    meaning: { title: "T", subtitle: "s", feature: "f", badge: "b", emotion: "", style: "", priority: "product" },
    layoutSpec: LAYOUT_SPEC_DEFAULTS,
    decorationCount: 4,
  });
  assert.equal(r.busy, true);
}

console.log("quality-v165 specs OK");
