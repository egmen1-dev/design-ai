import type { CompositionLayout } from "@/lib/composition/types";
import type { LayoutSpec } from "@/lib/design/layout-spec";

export type EyeFlowStep = "hero" | "headline" | "benefits" | "cta";

export type EyeFlowResult = {
  score: number;
  passed: boolean;
  order: EyeFlowStep[];
  validOrder: boolean;
  attentionLeakToBackground: number;
  penalties: string[];
};

export const EYE_FLOW_PASS_THRESHOLD = 72;

function clamp(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Validate reading order: Hero → Headline → Benefits → CTA */
export function validateEyeFlow(input: {
  layout: CompositionLayout;
  layoutSpec: LayoutSpec;
  hasBenefits: boolean;
  hasCta: boolean;
}): EyeFlowResult {
  const { layout, layoutSpec } = input;
  const penalties: string[] = [];

  const heroY = layout.product.centerY;
  const headlineY = layout.headline.top + layout.headline.height / 2;
  const benefitsY =
    layout.leftPanel.height > 0
      ? layout.leftPanel.top + layout.leftPanel.height / 2
      : layout.bullets.top + layout.bullets.height / 2;
  const ctaY = layout.subtitle.height > 0 ? layout.subtitle.top : headlineY + 40;

  const order: EyeFlowStep[] = ["hero", "headline"];
  if (input.hasBenefits) order.push("benefits");
  if (input.hasCta) order.push("cta");

  const yPositions: Record<EyeFlowStep, number> = {
    hero: heroY,
    headline: headlineY,
    benefits: benefitsY,
    cta: ctaY,
  };

  let validOrder = true;
  for (let i = 1; i < order.length; i++) {
    const prev = yPositions[order[i - 1]];
    const curr = yPositions[order[i]];
    const sameRow = Math.abs(prev - curr) < 8;
    const readingLtr = layout.textSide !== "right";
    if (!sameRow && curr < prev - 5) {
      validOrder = false;
      penalties.push(`Reading order break: ${order[i - 1]} → ${order[i]}`);
    }
    if (readingLtr && order[i] === "headline" && layout.headline.left > layout.product.centerX + 20) {
      penalties.push("Headline competes with hero horizontally");
    }
  }

  const bgWeight = layoutSpec.visualWeightMap.background;
  const attentionLeakToBackground = clamp(bgWeight + (layout.metrics.whitespacePct < 18 ? 15 : 0));
  if (attentionLeakToBackground > 18) {
    penalties.push("Attention leaks to background / empty zones");
  }

  if (layout.metrics.visualCenterX < 35 || layout.metrics.visualCenterX > 65) {
    const offCenter = Math.abs(layout.metrics.visualCenterX - 50);
    if (offCenter > 15) penalties.push("Visual mass pulls away from hero-first scan");
  }

  const score = clamp(
    100 -
      penalties.length * 12 -
      (validOrder ? 0 : 18) -
      Math.max(0, attentionLeakToBackground - 12) * 1.5,
  );

  return {
    score,
    passed: score >= EYE_FLOW_PASS_THRESHOLD && validOrder,
    order,
    validOrder,
    attentionLeakToBackground,
    penalties,
  };
}
