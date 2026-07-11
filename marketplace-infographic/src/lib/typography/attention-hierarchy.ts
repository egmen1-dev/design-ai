/**
 * Quality Cycle 5 — Attention Hierarchy (typography overlay governance).
 * Reduces headline visual weight without changing LayoutSpec, Geometry, or Compositor.
 */
import type { AttentionCompetitionMetrics } from "@/lib/typography/attention-metrics";
import { measureAttentionCompetition } from "@/lib/typography/attention-metrics";
import { computeSaliencyGrid } from "@/lib/typography/attention-heatmap";
import { WB_COVER } from "@/lib/composition/canvas";

export type AttentionHierarchyDiagnostics = {
  enabled: boolean;
  law101Passed: boolean;
  law101Warning?: string;
  attentionHierarchyScore: number;
  productVisualWeight: number;
  headlineVisualWeight: number;
  benefitsVisualWeight: number;
  badgeVisualWeight: number;
  backgroundCompetition: number;
  primaryFocusRatio: number;
  attentionCompetitionIndex: number;
  productDominanceScore: number;
  peakX: number;
  peakY: number;
  peakOnProduct: boolean;
  version: "1.0.0-quality-cycle-5";
};

export function attentionHierarchyEnabled(): boolean {
  return process.env.DAOS_ATTENTION_HIERARCHY !== "0";
}

export type TypographyOverlayMode = "standard" | "relaxed";

/** Additive CSS — de-emphasizes headline bar while preserving readability. */
export function buildAttentionHierarchyCss(mode: TypographyOverlayMode = "standard"): string {
  if (!attentionHierarchyEnabled()) return "";

  const relaxed = mode === "relaxed";
  const headlineFactor = relaxed ? 0.42 : 0.62;
  const sidebarOpacity = relaxed ? 0.72 : 0.92;
  const barOpacity = relaxed ? 0.28 : 0.38;

  return `
    /* DAOS Attention Hierarchy — Cycle 5 */
    .wb-top {
      z-index: 6 !important;
      top: calc(var(--comp-headline-top) * var(--canvas-h-num) / 100 * 1px + var(--canvas-h-num) * 0.012px) !important;
      padding-right: calc(var(--comp-safe) * var(--canvas-w-num) / 100 * 0.5px);
    }

    .wb-top__bar {
      padding: calc(var(--canvas-h-num) * 0.009px) calc(var(--canvas-w-num) * 0.022px) !important;
      background: linear-gradient(
        90deg,
        rgba(15, 23, 42, ${barOpacity}) 0%,
        rgba(15, 23, 42, ${relaxed ? 0.14 : 0.22}) 55%,
        rgba(15, 23, 42, ${relaxed ? 0.04 : 0.08}) 100%
      ) !important;
      border-bottom: none !important;
    }

    .wb-top__title {
      font-weight: 600 !important;
      font-size: calc(var(--comp-headline-size-pct) * var(--canvas-h-num) / 100 * ${headlineFactor}px) !important;
      letter-spacing: -0.01em !important;
      color: rgba(255, 255, 255, 0.9) !important;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.45);
      max-width: 58% !important;
      line-height: 1.15 !important;
    }

    .wb-side {
      opacity: ${sidebarOpacity};
    }

    .wb-side .plaque__text {
      font-weight: ${relaxed ? 600 : 650} !important;
      font-size: calc(var(--canvas-h-num) * ${relaxed ? 0.014 : 0.017}px) !important;
    }

    .mp-pill__text {
      font-weight: 600 !important;
      font-size: calc(var(--comp-subtitle-size-pct) * var(--canvas-h-num) / 100 * ${relaxed ? 0.68 : 0.82}px) !important;
    }

    .mp-bottom-ribbon__text {
      font-weight: ${relaxed ? 600 : 650} !important;
      font-size: calc(var(--comp-subtitle-size-pct) * var(--canvas-h-num) / 100 * ${relaxed ? 0.75 : 0.9}px) !important;
    }
    ${relaxed ? `.mp-sidebar-wrap { opacity: 0.78 !important; }` : ""}
  `.trim();
}

export function computeAttentionHierarchyScore(metrics: {
  productVisualWeight: number;
  headlineVisualWeight: number;
  primaryFocusRatio: number;
  attentionCompetitionIndex: number;
  peakOnProduct: boolean;
}): number {
  const focus = Math.min(100, metrics.primaryFocusRatio * 200);
  const competition = Math.max(0, 100 - metrics.attentionCompetitionIndex * 2.2);
  const weightGap = Math.min(
    100,
    Math.max(0, (metrics.productVisualWeight - metrics.headlineVisualWeight) * 3),
  );
  const peakBonus = metrics.peakOnProduct ? 15 : 0;
  return Number(
    Math.min(100, focus * 0.35 + competition * 0.25 + weightGap * 0.25 + peakBonus).toFixed(1),
  );
}

export function evaluateLaw101(metrics: {
  productVisualWeight: number;
  headlineVisualWeight: number;
  badgeVisualWeight: number;
  typographyCompetition: number;
  backgroundCompetition: number;
  primaryFocusRatio: number;
}): { passed: boolean; warning?: string } {
  if (metrics.headlineVisualWeight >= metrics.productVisualWeight) {
    return {
      passed: false,
      warning: `LAW_101: Headline VW ${metrics.headlineVisualWeight} ≥ Product VW ${metrics.productVisualWeight}`,
    };
  }
  if (metrics.primaryFocusRatio < 0.32) {
    return {
      passed: false,
      warning: `LAW_101: Primary focus ratio ${metrics.primaryFocusRatio} below 0.32`,
    };
  }
  if (metrics.badgeVisualWeight > metrics.headlineVisualWeight * 1.2) {
    return {
      passed: false,
      warning: "LAW_101: Badge attention exceeds headline — hierarchy inverted",
    };
  }
  return { passed: true };
}

export function buildAttentionHierarchyDiagnostics(
  metrics: AttentionCompetitionMetrics & { peakX?: number; peakY?: number },
): AttentionHierarchyDiagnostics {
  const peakX = metrics.peakX ?? 0.5;
  const peakY = metrics.peakY ?? 0.5;
  const peakOnProduct = peakX > 0.35 && peakY > 0.25;
  const law = evaluateLaw101({
    productVisualWeight: metrics.productVisualWeight,
    headlineVisualWeight: metrics.headlineVisualWeight,
    badgeVisualWeight: metrics.badgeVisualWeight,
    typographyCompetition: metrics.typographyCompetition,
    backgroundCompetition: metrics.backgroundCompetition,
    primaryFocusRatio: metrics.primaryFocusRatio,
  });

  return {
    enabled: attentionHierarchyEnabled(),
    law101Passed: law.passed,
    law101Warning: law.warning,
    attentionHierarchyScore: computeAttentionHierarchyScore({
      productVisualWeight: metrics.productVisualWeight,
      headlineVisualWeight: metrics.headlineVisualWeight,
      primaryFocusRatio: metrics.primaryFocusRatio,
      attentionCompetitionIndex: metrics.attentionCompetitionIndex,
      peakOnProduct,
    }),
    productVisualWeight: metrics.productVisualWeight,
    headlineVisualWeight: metrics.headlineVisualWeight,
    benefitsVisualWeight: metrics.typographyCompetition,
    badgeVisualWeight: metrics.badgeVisualWeight,
    backgroundCompetition: metrics.backgroundCompetition,
    primaryFocusRatio: metrics.primaryFocusRatio,
    attentionCompetitionIndex: metrics.attentionCompetitionIndex,
    productDominanceScore: metrics.productDominanceScore,
    peakX,
    peakY,
    peakOnProduct,
    version: "1.0.0-quality-cycle-5",
  };
}

function saliencyPeak(grid: Float32Array): { peakX: number; peakY: number } {
  let peak = 0;
  let peakIdx = 0;
  for (let i = 0; i < grid.length; i++) {
    if (grid[i]! > peak) {
      peak = grid[i]!;
      peakIdx = i;
    }
  }
  const W = WB_COVER.width;
  return {
    peakX: Number(((peakIdx % W) / W).toFixed(3)),
    peakY: Number((Math.floor(peakIdx / W) / WB_COVER.height).toFixed(3)),
  };
}

export async function captureAttentionHierarchy(imagePath: string): Promise<AttentionHierarchyDiagnostics> {
  const metrics = await measureAttentionCompetition(imagePath);
  const grid = await computeSaliencyGrid(imagePath);
  const peak = saliencyPeak(grid);
  return buildAttentionHierarchyDiagnostics({ ...metrics, ...peak });
}
