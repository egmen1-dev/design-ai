import type { CompositionLayout } from "./types";

/** Генерирует CSS-переменные из композиции (% + calc от размера холста) */
export function compositionToCssBlock(layout: CompositionLayout): string {
  const { canvas: c, product: p, headline: h, subtitle: s, leftPanel: lp, rightSidebar: rs, plaques, icon, safeInsetPct } =
    layout;

  return `
    :root {
      --canvas-w-num: ${c.width};
      --canvas-h-num: ${c.height};
      --canvas-w: ${c.width}px;
      --canvas-h: ${c.height}px;
      --comp-safe: ${safeInsetPct}%;

      --comp-product-left: ${p.left}%;
      --comp-product-top: ${p.top}%;
      --comp-product-width: ${p.maxWidthPct}%;
      --comp-product-height: ${p.maxHeightPct}%;
      --comp-product-rotate: ${p.rotationDeg}deg;
      --comp-product-center-x: ${p.centerX}%;
      --comp-product-center-y: ${p.centerY}%;

      --comp-headline-left: ${h.left}%;
      --comp-headline-top: ${h.top}%;
      --comp-headline-width: ${h.width}%;
      --comp-headline-height: ${h.height}%;
      --comp-headline-size-pct: ${h.fontSizePct};

      --comp-subtitle-size-pct: ${s.fontSizePct};
      --comp-subtitle-top: ${s.top}%;

      --comp-left-panel-left: ${lp.left}%;
      --comp-left-panel-top: ${lp.top}%;
      --comp-left-panel-width: ${lp.width}%;
      --comp-left-panel-height: ${lp.height}%;

      --comp-sidebar-left: ${rs.left}%;
      --comp-sidebar-top: ${rs.top}%;
      --comp-sidebar-width: ${rs.width}%;
      --comp-sidebar-height: ${rs.height}%;

      --comp-plaque-sm: ${plaques.smallWidthPct}%;
      --comp-plaque-md: ${plaques.mediumWidthPct}%;
      --comp-plaque-lg: ${plaques.largeWidthPct}%;
      --comp-plaque-height: ${plaques.heightPct}%;

      --comp-icon-size: ${icon.sizePct}%;
      --comp-icon-gap: ${icon.textGapPct}%;

      --comp-sidebar-value-size-pct: ${h.fontSizePct * 1.85};
      --comp-sidebar-label-size-pct: ${h.fontSizePct * 0.38};
      --comp-hero-value-size-pct: ${h.fontSizePct * 1.35};
    }

    .mp-title {
      font-size: calc(var(--comp-headline-size-pct) * var(--canvas-h-num) / 100 * 1px) !important;
      max-width: var(--comp-headline-width);
      margin-top: var(--comp-headline-top);
      margin-left: var(--comp-headline-left);
    }

    .mp-pill {
      margin-left: var(--comp-headline-left);
      margin-top: 1.2%;
    }

    .mp-left-panel {
      width: calc(var(--comp-left-panel-width) * var(--canvas-w-num) / 100 * 1px);
      margin-left: var(--comp-left-panel-left);
      margin-top: calc(var(--comp-left-panel-top) * var(--canvas-h-num) / 100 * 1px - var(--comp-headline-top) * var(--canvas-h-num) / 100 * 1px);
    }

    .mp-left-panel__hero-value {
      font-size: calc(var(--comp-hero-value-size-pct) * var(--canvas-h-num) / 100 * 1px) !important;
    }

    .mp-sidebar {
      width: calc(var(--comp-sidebar-width) * var(--canvas-w-num) / 100 * 1px);
      min-height: calc(var(--comp-sidebar-height) * var(--canvas-h-num) / 100 * 1px);
      max-height: calc(var(--comp-sidebar-height) * var(--canvas-h-num) / 100 * 1px);
      margin-top: calc(var(--comp-sidebar-top) * var(--canvas-h-num) / 100 * 1px);
    }

    .mp-sidebar__value {
      font-size: calc(var(--comp-sidebar-value-size-pct) * var(--canvas-h-num) / 100 * 1px) !important;
    }

    .mp-sidebar__label {
      font-size: calc(var(--comp-sidebar-label-size-pct) * var(--canvas-h-num) / 100 * 1px) !important;
    }

    .mp-product {
      left: var(--comp-product-left);
      right: calc(100% - var(--comp-product-left) - var(--comp-product-width));
      top: calc(var(--comp-product-top) * var(--canvas-h-num) / 100 * 1px);
      bottom: calc(var(--comp-safe) * var(--canvas-h-num) / 100 * 1px);
    }

    .mp-product .product-frame {
      transform: rotate(var(--comp-product-rotate)) translateX(4%) translateY(0);
    }

    .mp-product .product-photo--cutout {
      max-height: calc(var(--comp-product-height) * var(--canvas-h-num) / 100 * 1px);
      max-width: calc(var(--comp-product-width) * var(--canvas-w-num) / 100 * 1px);
    }

    .mp-left-panel__gift-icon .material-symbols-outlined,
    .mp-left-panel__hero-icon {
      font-size: calc(var(--comp-icon-size) * var(--canvas-w-num) / 100 * 1px) !important;
    }
  `.trim();
}
