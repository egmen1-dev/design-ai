import type { CompositionLayout } from "@/lib/composition/types";
import type { CardMeaning } from "@/lib/layout-engine/types";
import type { LayoutSpec } from "@/lib/design/layout-spec";

export type VisualNoiseMetrics = {
  objectCount: number;
  decorativeDensity: number;
  edgeClutter: number;
  backgroundComplexity: number;
};

export type VisualNoiseResult = {
  score: number;
  passed: boolean;
  busy: boolean;
  metrics: VisualNoiseMetrics;
  issues: string[];
};

export const VISUAL_NOISE_PASS_THRESHOLD = 70;
export const MAX_OBJECT_COUNT = 5;
export const MAX_DECORATIVE_DENSITY = 0.25;

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function analyzeVisualNoise(input: {
  layout: CompositionLayout;
  meaning: CardMeaning;
  layoutSpec: LayoutSpec;
  decorationCount?: number;
}): VisualNoiseResult {
  const m = input.layout.metrics;
  const issues: string[] = [];

  const objectCount =
    1 +
    (input.meaning.feature ? 1 : 0) +
    (input.meaning.badge ? 1 : 0) +
    (input.meaning.subtitle ? 1 : 0) +
    (input.decorationCount ?? 0);

  const decorativeDensity = Math.min(
    1,
    (input.decorationCount ?? 0) * 0.08 + m.plaqueAreaPct * 0.02 + m.textAreaPct * 0.005,
  );

  const edgeClutter = clamp(
    (m.minEdgeInsetPct < 4 ? 25 : 0) +
      (m.overlapPct > 2 ? 20 : 0) +
      (m.plaqueAreaPct > 12 ? 18 : 0),
  );

  const backgroundComplexity = clamp(
    input.layoutSpec.visualWeightMap.background +
      (input.layoutSpec.backgroundStyle === "minimal_interior" ? 5 : 0) +
      (m.whitespacePct < 18 ? 15 : 0),
  );

  if (objectCount > input.layoutSpec.maxSecondaryObjects + 1) {
    issues.push(`Too many objects (${objectCount})`);
  }
  if (decorativeDensity > MAX_DECORATIVE_DENSITY) {
    issues.push("Decorative density too high");
  }
  if (edgeClutter > 30) {
    issues.push("Edge clutter / overlap");
  }
  if (backgroundComplexity > 22) {
    issues.push("Background too complex");
  }

  const busy =
    objectCount > MAX_OBJECT_COUNT ||
    decorativeDensity > MAX_DECORATIVE_DENSITY ||
    edgeClutter > 35;

  const score = clamp(
    100 -
      Math.max(0, objectCount - 4) * 12 -
      decorativeDensity * 120 -
      edgeClutter * 0.8 -
      Math.max(0, backgroundComplexity - 15) * 2,
  );

  return {
    score,
    passed: score >= VISUAL_NOISE_PASS_THRESHOLD && !busy,
    busy,
    metrics: {
      objectCount,
      decorativeDensity,
      edgeClutter,
      backgroundComplexity,
    },
    issues,
  };
}
