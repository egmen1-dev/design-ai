import { clampPct, zoneAreaPct } from "./canvas";
import type { CompositionLayout, CompositionZone } from "./types";

function shrinkZone(zone: CompositionZone, factor: number): CompositionZone {
  const cx = zone.left + zone.width / 2;
  const cy = zone.top + zone.height / 2;
  const w = zone.width * factor;
  const h = zone.height * factor;
  return {
    left: cx - w / 2,
    top: cy - h / 2,
    width: w,
    height: h,
  };
}

/** Проверка композиции и авто-коррекция по правилам WB */
export function validateAndAdjustComposition(layout: CompositionLayout): CompositionLayout {
  const issues: string[] = [];
  const adjustments: string[] = [];
  let next = { ...layout };

  const rules = [
    {
      test: () => next.metrics.productAreaPct < 45,
      fix: () => {
        next.product = {
          ...next.product,
          width: clampPct(next.product.width * 1.08, 38, 72),
          height: clampPct(next.product.height * 1.06, 68, 88),
        };
        adjustments.push("product_area_increased");
      },
      issue: "product_too_small",
    },
    {
      test: () => next.metrics.productAreaPct > 82,
      fix: () => {
        next.product = {
          ...next.product,
          width: next.product.width * 0.94,
          height: next.product.height * 0.94,
        };
        adjustments.push("product_area_reduced");
      },
      issue: "product_too_large",
    },
    {
      test: () => next.metrics.whitespacePct < 15,
      fix: () => {
        if (next.leftPanel.width > 0) {
          next.leftPanel = shrinkZone(next.leftPanel, 0.9);
        }
        if (next.rightSidebar.width > 0) {
          next.rightSidebar = shrinkZone(next.rightSidebar, 0.9);
        }
        next.headline = { ...next.headline, fontSizePct: next.headline.fontSizePct * 0.92 };
        adjustments.push("elements_shrunk_for_whitespace");
      },
      issue: "whitespace_low",
    },
    {
      test: () => next.metrics.minEdgeInsetPct < 5,
      fix: () => {
        next.product = {
          ...next.product,
          left: clampPct(next.product.left, 5, 100 - next.product.width - 5),
          top: clampPct(next.product.top, 8, 100 - next.product.height - 5),
        };
        adjustments.push("product_inset_fixed");
      },
      issue: "safe_area_violation",
    },
    {
      test: () => next.metrics.plaqueAreaPct > 12,
      fix: () => {
        next.plaques = {
          ...next.plaques,
          smallWidthPct: next.plaques.smallWidthPct * 0.88,
          mediumWidthPct: next.plaques.mediumWidthPct * 0.88,
          largeWidthPct: next.plaques.largeWidthPct * 0.88,
          heightPct: next.plaques.heightPct * 0.9,
        };
        if (next.leftPanel.width > 0) next.leftPanel = shrinkZone(next.leftPanel, 0.88);
        if (next.rightSidebar.width > 0) next.rightSidebar = shrinkZone(next.rightSidebar, 0.88);
        adjustments.push("plaques_shrunk");
      },
      issue: "plaques_too_large",
    },
    {
      test: () => {
        const balance = Math.abs(next.metrics.visualCenterX - 50);
        return balance > 20;
      },
      fix: () => {
        const shift = next.textSide === "left" ? -2 : 2;
        next.product = {
          ...next.product,
          centerX: clampPct(next.product.centerX + shift, 45, 58),
          left: clampPct(next.product.left + shift, 5, 100 - next.product.width - 5),
        };
        adjustments.push("visual_balance_corrected");
      },
      issue: "visual_imbalance",
    },
  ];

  for (const rule of rules) {
    if (rule.test()) {
      issues.push(rule.issue);
      rule.fix();
    }
  }

  const plaqueArea =
    zoneAreaPct(next.leftPanel.width, next.leftPanel.height) +
    zoneAreaPct(next.rightSidebar.width, next.rightSidebar.height);

  const usedArea =
    zoneAreaPct(next.product.width, next.product.height) +
    zoneAreaPct(next.headline.width, next.headline.height) +
    zoneAreaPct(next.subtitle.width, next.subtitle.height) +
    plaqueArea;

  const metrics = {
    ...next.metrics,
    plaqueAreaPct: plaqueArea,
    whitespacePct: Math.max(0, 100 - usedArea),
    minEdgeInsetPct: Math.min(
      next.product.left,
      next.headline.left,
      next.headline.top,
      100 - (next.rightSidebar.left + next.rightSidebar.width),
    ),
  };

  return {
    ...next,
    metrics,
    issues,
    adjustments,
    valid: issues.length === 0,
  };
}
