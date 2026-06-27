import type { CompositionLayout } from "@/lib/composition/types";
import type { CardMeaning } from "@/lib/layout-engine/types";
import type { LayoutSpec } from "@/lib/design/layout-spec";

export type LuxuryScoreBreakdown = {
  whitespace: number;
  contrast: number;
  lighting: number;
  typography: number;
  colorDiscipline: number;
  visualNoise: number;
};

export type LuxuryScoreResult = {
  total: number;
  passed: boolean;
  breakdown: LuxuryScoreBreakdown;
  issues: string[];
};

export const LUXURY_PASS_THRESHOLD = 75;

const WEIGHTS = {
  whitespace: 0.25,
  contrast: 0.2,
  lighting: 0.2,
  typography: 0.15,
  colorDiscipline: 0.1,
  visualNoise: 0.1,
};

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function computeLuxuryScore(input: {
  layout: CompositionLayout;
  meaning: CardMeaning;
  layoutSpec: LayoutSpec;
  paletteSize?: number;
}): LuxuryScoreResult {
  const m = input.layout.metrics;
  const issues: string[] = [];

  const wsTarget = input.layoutSpec.whitespaceTarget;
  const whitespace = clamp(
    100 - Math.abs(m.whitespacePct - wsTarget) * 4 - (m.whitespacePct < 20 ? 30 : 0),
  );
  if (m.whitespacePct < 20) issues.push("Whitespace below 20%");
  if (m.whitespacePct < wsTarget - 5) issues.push("Below target whitespace");

  const hierarchyRatio = m.productAreaPct / Math.max(m.textAreaPct, 1);
  const contrast = clamp(
    (hierarchyRatio >= 2.5 ? 92 : 70) -
      (m.overlapPct > 2 ? 25 : 0) -
      (input.meaning.title.length > 55 ? 12 : 0),
  );
  if (m.overlapPct > 2) issues.push("Text/product overlap hurts contrast");

  const lighting = clamp(
    input.layoutSpec.lightingStyle === "rim_dark" || input.layoutSpec.backgroundStyle === "dark_premium"
      ? 88
      : 78,
  );

  const titleLen = input.meaning.title.length;
  const typography = clamp(
    (titleLen <= 42 ? 94 : titleLen <= 58 ? 80 : 65) - (m.textAreaPct > 18 ? 15 : 0),
  );
  if (titleLen > 58) issues.push("Headline too long for premium typography");

  const colors = input.paletteSize ?? input.layoutSpec.palette.length;
  const colorDiscipline = clamp(100 - Math.max(0, colors - input.layoutSpec.maxColors) * 20);
  if (colors > input.layoutSpec.maxColors) issues.push("Too many colors");

  const elementCount =
    1 +
    (input.meaning.feature ? 1 : 0) +
    (input.meaning.badge ? 1 : 0) +
    (input.meaning.subtitle ? 1 : 0);
  const visualNoise = clamp(
    100 -
      (elementCount > 4 ? 35 : elementCount > 3 ? 18 : 0) -
      (m.plaqueAreaPct > 10 ? 20 : 0) -
      (m.overlapPct > 1 ? 10 : 0),
  );
  if (elementCount > 4) issues.push("Too many UI objects for luxury look");

  const breakdown: LuxuryScoreBreakdown = {
    whitespace,
    contrast,
    lighting,
    typography,
    colorDiscipline,
    visualNoise,
  };

  const total = clamp(
    breakdown.whitespace * WEIGHTS.whitespace +
      breakdown.contrast * WEIGHTS.contrast +
      breakdown.lighting * WEIGHTS.lighting +
      breakdown.typography * WEIGHTS.typography +
      breakdown.colorDiscipline * WEIGHTS.colorDiscipline +
      breakdown.visualNoise * WEIGHTS.visualNoise,
  );

  return {
    total,
    passed: total >= LUXURY_PASS_THRESHOLD,
    breakdown,
    issues,
  };
}
