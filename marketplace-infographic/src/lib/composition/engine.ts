import { WB_COVER, clampPct, zoneAreaPct } from "./canvas";
import { resolveProductDimensions } from "./category-rules";
import type {
  CompositionInput,
  CompositionLayout,
  CompositionMetrics,
  CompositionZone,
} from "./types";
import { validateAndAdjustComposition } from "./validate";

function zoneOverlap(a: CompositionZone, b: CompositionZone): number {
  const x1 = Math.max(a.left, b.left);
  const y1 = Math.max(a.top, b.top);
  const x2 = Math.min(a.left + a.width, b.left + b.width);
  const y2 = Math.min(a.top + a.height, b.top + b.height);
  if (x2 <= x1 || y2 <= y1) return 0;
  return zoneAreaPct(x2 - x1, y2 - y1);
}

function estimateMetrics(layout: Omit<CompositionLayout, "metrics" | "valid" | "issues" | "adjustments">): CompositionMetrics {
  const zones = [
    layout.product,
    layout.headline,
    layout.subtitle,
    layout.leftPanel,
    layout.rightSidebar,
    layout.bullets,
  ].filter((z) => z.width > 0 && z.height > 0);

  const productAreaPct = zoneAreaPct(layout.product.width, layout.product.height);
  const textAreaPct =
    zoneAreaPct(layout.headline.width, layout.headline.height) +
    zoneAreaPct(layout.subtitle.width, layout.subtitle.height) +
    zoneAreaPct(layout.bullets.width, layout.bullets.height);

  const plaqueAreaPct =
    zoneAreaPct(layout.leftPanel.width, layout.leftPanel.height) +
    zoneAreaPct(layout.rightSidebar.width, layout.rightSidebar.height);

  let overlapPct = 0;
  for (let i = 0; i < zones.length; i++) {
    for (let j = i + 1; j < zones.length; j++) {
      if (zones[i] === layout.product || zones[j] === layout.product) {
        overlapPct += zoneOverlap(zones[i], zones[j]);
      }
    }
  }

  const usedArea = Math.min(100, productAreaPct + textAreaPct + plaqueAreaPct - overlapPct);
  const whitespacePct = Math.max(0, 100 - usedArea);

  const minEdgeInsetPct = Math.min(
    layout.product.left,
    layout.product.top,
    100 - (layout.product.left + layout.product.width),
    100 - (layout.product.top + layout.product.height),
    layout.headline.left,
    layout.headline.top,
  );

  const visualCenterX =
    (layout.product.centerX * productAreaPct +
      (layout.headline.left + layout.headline.width / 2) * textAreaPct) /
    Math.max(1, productAreaPct + textAreaPct);

  const visualCenterY =
    (layout.product.centerY * productAreaPct +
      (layout.headline.top + layout.headline.height / 2) * textAreaPct) /
    Math.max(1, productAreaPct + textAreaPct);

  return {
    productAreaPct,
    textAreaPct,
    plaqueAreaPct,
    whitespacePct,
    overlapPct,
    visualCenterX,
    visualCenterY,
    minEdgeInsetPct,
  };
}

/** Design Composition Engine — все размеры в % от холста WB 900×1200 */
export function computeComposition(input: CompositionInput): CompositionLayout {
  const safeInsetPct = 6;
  const textSide: "left" | "right" = "left";

  const productDims = resolveProductDimensions(input.category, input.objectScale ?? 0.78);

  const productCenterX =
    textSide === "left"
      ? clampPct(productDims.centerX + 2, 45, 58)
      : clampPct(productDims.centerX - 2, 42, 55);

  const product: CompositionLayout["product"] = {
    left: clampPct(productCenterX - productDims.maxWidthPct / 2, safeInsetPct, 100 - safeInsetPct - productDims.maxWidthPct),
    top: clampPct(productDims.centerY - productDims.maxHeightPct / 2, safeInsetPct + 8, 100 - safeInsetPct - productDims.maxHeightPct),
    width: productDims.maxWidthPct,
    height: productDims.maxHeightPct,
    centerX: productCenterX,
    centerY: productDims.centerY,
    maxWidthPct: productDims.maxWidthPct,
    maxHeightPct: productDims.maxHeightPct,
    areaPct: productDims.areaPct,
    rotationDeg: input.layout === "marketplace" ? -19 : -12,
  };

  const headline: CompositionLayout["headline"] = {
    left: clampPct(5.5, safeInsetPct, 12),
    top: clampPct(5.5, safeInsetPct, 10),
    width: clampPct(58, 40, 65),
    height: clampPct(14, 10, 18),
    fontSizePct: clampPct(4.8, 4, 5.8),
  };

  const subtitle: CompositionLayout["subtitle"] = {
    left: headline.left,
    top: headline.top + headline.height + 1.2,
    width: clampPct(52, 35, 60),
    height: clampPct(5.5, 4, 8),
    fontSizePct: headline.fontSizePct * 0.52,
  };

  const leftPanel: CompositionZone = input.hasLeftPanel
    ? {
        left: safeInsetPct,
        top: clampPct(22, 18, 28),
        width: clampPct(17.5, 14, 22),
        height: clampPct(28, 22, 32),
      }
    : { left: 0, top: 0, width: 0, height: 0 };

  const rightSidebar: CompositionZone = input.hasRightSidebar
    ? {
        left: 100 - clampPct(12.5, 10, 15),
        top: clampPct(20, 16, 26),
        width: clampPct(12.5, 10, 15),
        height: clampPct(32, 26, 36),
      }
    : { left: 0, top: 0, width: 0, height: 0 };

  const bulletCount = Math.min(5, Math.max(0, input.bulletCount));
  const bullets: CompositionLayout["bullets"] = {
    left: textSide === "left" ? leftPanel.left : 100 - 28,
    top: clampPct(52, 45, 58),
    width: clampPct(26, 20, 32),
    height: clampPct(Math.min(30, bulletCount * 5.5), 18, 30),
    itemHeightPct: clampPct(4.2, 3, 5),
    gapPct: clampPct(1.4, 1, 2),
    maxCount: 5,
  };

  const plaques: CompositionLayout["plaques"] = {
    smallWidthPct: 8,
    mediumWidthPct: 12,
    largeWidthPct: 18,
    heightPct: 6,
    maxTotalAreaPct: 12,
  };

  const icon = {
    sizePct: clampPct(4.2, 3, 6),
    textGapPct: clampPct(1.5, 1, 2),
  };

  const logo: CompositionZone | undefined = input.hasLogo
    ? {
        left: 100 - safeInsetPct - 12,
        top: safeInsetPct,
        width: 12,
        height: 5.5,
      }
    : undefined;

  const draft: Omit<CompositionLayout, "metrics" | "valid" | "issues" | "adjustments"> = {
    canvas: { width: WB_COVER.width, height: WB_COVER.height },
    safeInsetPct,
    product,
    headline,
    subtitle,
    leftPanel,
    rightSidebar,
    bullets,
    plaques,
    icon,
    logo,
    textSide,
  };

  const metrics = estimateMetrics(draft);
  const base: CompositionLayout = {
    ...draft,
    metrics,
    valid: true,
    issues: [],
    adjustments: [],
  };

  return validateAndAdjustComposition(base);
}
