import { clampPct, zoneAreaPct } from "./canvas";
import type { CompositionLayout, CompositionZone } from "./types";

function zonesOverlap(a: CompositionZone, b: CompositionZone): boolean {
  return (
    a.width > 0 &&
    b.width > 0 &&
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

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
      test: () => next.metrics.productAreaPct < 55,
      fix: () => {
        const scale = Math.sqrt(58 / Math.max(1, next.metrics.productAreaPct));
        const width = clampPct(next.product.width * scale, 42, 74);
        const height = clampPct(next.product.height * scale, 68, 90);
        next.product = {
          ...next.product,
          width,
          height,
          maxWidthPct: width,
          maxHeightPct: height,
          areaPct: zoneAreaPct(width, height),
          left: clampPct(next.product.left, 5, 100 - width - 5),
          top: clampPct(next.product.top, 8, 100 - height - 5),
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
      test: () => next.metrics.overlapPct > 0.5,
      fix: () => {
        const product = next.product;
        if (zonesOverlap(product, next.headline)) {
          next.headline = {
            ...next.headline,
            top: clampPct(Math.min(next.headline.top, product.top - next.headline.height - 1), 4, 12),
            left:
              next.textSide === "left"
                ? clampPct(next.headline.left, 5, product.left - next.headline.width - 1)
                : clampPct(
                    next.headline.left,
                    product.left + product.width + 1,
                    100 - next.headline.width - 5,
                  ),
          };
        }
        if (next.leftPanel.width > 0 && zonesOverlap(product, next.leftPanel)) {
          next.leftPanel = {
            ...next.leftPanel,
            top: clampPct(product.top - next.leftPanel.height - 2, 14, 28),
          };
        }
        if (zonesOverlap(product, next.bullets)) {
          next.bullets = {
            ...next.bullets,
            top: clampPct(product.top + product.height + 2, 62, 78),
            left:
              next.textSide === "left"
                ? clampPct(next.bullets.left, 5, product.left - 2)
                : clampPct(product.left + product.width + 2, 72, 88),
          };
        }
        if (zonesOverlap(product, next.subtitle)) {
          next.subtitle = {
            ...next.subtitle,
            top: clampPct(product.top - next.subtitle.height - 1, 4, 14),
          };
        }
        if (next.rightSidebar.width > 0 && zonesOverlap(product, next.rightSidebar)) {
          next.rightSidebar = {
            ...next.rightSidebar,
            left: clampPct(product.left + product.width + 2, 72, 90),
          };
        }
        adjustments.push("text_product_overlap_resolved");
      },
      issue: "text_overlaps_product",
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

  for (let pass = 0; pass < 2; pass++) {
    for (const rule of rules) {
      if (rule.test()) {
        if (!issues.includes(rule.issue)) issues.push(rule.issue);
        rule.fix();
      }
    }
  }

  const plaqueArea =
    zoneAreaPct(next.leftPanel.width, next.leftPanel.height) +
    zoneAreaPct(next.rightSidebar.width, next.rightSidebar.height);

  const productAreaPct = zoneAreaPct(next.product.width, next.product.height);
  const textAreaPct =
    zoneAreaPct(next.headline.width, next.headline.height) +
    zoneAreaPct(next.subtitle.width, next.subtitle.height) +
    zoneAreaPct(next.bullets.width, next.bullets.height);

  let overlapPct = 0;
  const textZones = [next.headline, next.subtitle, next.leftPanel, next.rightSidebar, next.bullets];
  for (const zone of textZones) {
    if (zone.width > 0 && zonesOverlap(next.product, zone)) {
      overlapPct += zoneAreaPct(
        Math.min(next.product.left + next.product.width, zone.left + zone.width) -
          Math.max(next.product.left, zone.left),
        Math.min(next.product.top + next.product.height, zone.top + zone.height) -
          Math.max(next.product.top, zone.top),
      );
    }
  }

  const usedArea = productAreaPct + textAreaPct + plaqueArea - overlapPct;

  const metrics = {
    ...next.metrics,
    productAreaPct,
    textAreaPct,
    plaqueAreaPct: plaqueArea,
    whitespacePct: Math.max(0, 100 - usedArea),
    overlapPct,
    minEdgeInsetPct: Math.min(
      next.product.left,
      next.product.top,
      100 - (next.product.left + next.product.width),
      100 - (next.product.top + next.product.height),
      next.headline.left,
      next.headline.top,
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
