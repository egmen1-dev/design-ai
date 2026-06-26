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

      --comp-headline-left: ${h.left}%;
      --comp-headline-top: ${h.top}%;
      --comp-headline-width: ${h.width}%;
      --comp-headline-height: ${h.height}%;
      --comp-headline-size-pct: ${h.fontSizePct};

      --comp-subtitle-size-pct: ${s.fontSizePct};

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

    .canvas-grid.layout-marketplace {
      position: relative !important;
      display: block !important;
      padding: 0 !important;
      height: 100% !important;
      gap: 0 !important;
    }

    .mp-header {
      position: absolute;
      z-index: 8;
      left: calc(var(--comp-headline-left) * var(--canvas-w-num) / 100 * 1px);
      top: calc(var(--comp-headline-top) * var(--canvas-h-num) / 100 * 1px);
      max-width: calc(var(--comp-headline-width) * var(--canvas-w-num) / 100 * 1px);
      padding: 0;
      margin: 0;
    }

    .mp-title {
      font-size: calc(var(--comp-headline-size-pct) * var(--canvas-h-num) / 100 * 1px) !important;
      max-width: 100%;
      margin: 0 !important;
      line-height: 1.05;
      overflow-wrap: break-word;
    }

    .mp-pill {
      margin-left: 0;
      margin-top: calc(var(--canvas-h-num) * 0.008px);
      max-width: calc(var(--comp-plaque-lg) * var(--canvas-w-num) / 100 * 1px);
    }

    .mp-body {
      position: absolute;
      inset: 0;
      min-height: 0 !important;
    }

    .mp-left {
      position: absolute;
      z-index: 7;
      left: calc(var(--comp-left-panel-left) * var(--canvas-w-num) / 100 * 1px);
      top: calc(var(--comp-left-panel-top) * var(--canvas-h-num) / 100 * 1px);
      width: calc(var(--comp-left-panel-width) * var(--canvas-w-num) / 100 * 1px);
      max-width: calc(var(--comp-left-panel-width) * var(--canvas-w-num) / 100 * 1px);
    }

    .mp-left-panel {
      width: 100%;
      max-height: calc(var(--comp-left-panel-height) * var(--canvas-h-num) / 100 * 1px);
      margin: 0 !important;
    }

    .mp-left-panel__hero {
      padding: calc(var(--comp-plaque-height) * var(--canvas-h-num) / 100 * 0.28px) calc(var(--comp-safe) * var(--canvas-w-num) / 100 * 0.35px);
    }

    .mp-left-panel__hero-value {
      font-size: calc(var(--comp-hero-value-size-pct) * var(--canvas-h-num) / 100 * 0.9px) !important;
    }

    .mp-left-panel__gift-visual {
      display: none;
    }

    .mp-left-panel__footer {
      padding: calc(var(--comp-plaque-height) * var(--canvas-h-num) / 100 * 0.22px) calc(var(--comp-safe) * var(--canvas-w-num) / 100 * 0.3px);
      font-size: calc(var(--comp-sidebar-label-size-pct) * var(--canvas-h-num) / 100 * 0.9px);
    }

    .mp-sidebar-wrap {
      position: absolute;
      z-index: 7;
      left: calc(var(--comp-sidebar-left) * var(--canvas-w-num) / 100 * 1px);
      top: calc(var(--comp-sidebar-top) * var(--canvas-h-num) / 100 * 1px);
      right: auto;
    }

    .mp-sidebar {
      width: calc(var(--comp-sidebar-width) * var(--canvas-w-num) / 100 * 1px);
      min-height: auto;
      max-height: calc(var(--comp-sidebar-height) * var(--canvas-h-num) / 100 * 1px);
      margin-top: 0 !important;
    }

    .mp-sidebar__value {
      font-size: calc(var(--comp-sidebar-value-size-pct) * var(--canvas-h-num) / 100 * 0.85px) !important;
    }

    .mp-sidebar__label {
      font-size: calc(var(--comp-sidebar-label-size-pct) * var(--canvas-h-num) / 100 * 1px) !important;
    }

    .mp-product {
      left: var(--comp-product-left);
      right: calc(100% - var(--comp-product-left) - var(--comp-product-width));
      top: calc(var(--comp-product-top) * var(--canvas-h-num) / 100 * 1px);
      bottom: calc(var(--comp-safe) * var(--canvas-h-num) / 100 * 1px);
      z-index: 3;
    }

    .mp-product .product-frame {
      transform: rotate(var(--comp-product-rotate)) translateX(2%) translateY(0);
    }

    .mp-product .product-photo--cutout {
      max-height: calc(var(--comp-product-height) * var(--canvas-h-num) / 100 * 1px);
      max-width: calc(var(--comp-product-width) * var(--canvas-w-num) / 100 * 1px);
    }

    .mp-footer {
      position: absolute;
      z-index: 8;
      left: 0;
      right: 0;
      bottom: calc(var(--comp-safe) * var(--canvas-h-num) / 100 * 0.6px);
      padding: 0 calc(var(--comp-safe) * var(--canvas-w-num) / 100 * 1px);
    }

    .mp-bottom-ribbon {
      max-width: calc(var(--comp-plaque-lg) * var(--canvas-w-num) / 100 * 1.4px);
    }

    .mp-glass-badge {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: calc(var(--comp-plaque-height) * var(--canvas-h-num) / 100 * 0.35px) calc(var(--comp-safe) * var(--canvas-w-num) / 100 * 0.35px);
      border-radius: calc(var(--canvas-w-num) * 0.018px);
      background: rgba(255,255,255,0.22);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255,255,255,0.35);
      box-shadow: 0 calc(var(--canvas-h-num) * 0.008px) calc(var(--canvas-h-num) * 0.02px) rgba(15,23,42,0.12);
      width: 100%;
    }

    .mp-glass-badge__value {
      font-family: var(--font-display);
      font-weight: 900;
      line-height: 0.95;
      color: var(--badge-accent, var(--accent));
      font-size: calc(var(--comp-hero-value-size-pct) * var(--canvas-h-num) / 100 * 1px) !important;
    }

    .mp-glass-badge__label {
      font-size: calc(var(--comp-sidebar-label-size-pct) * var(--canvas-h-num) / 100 * 1px);
      font-weight: 700;
      color: #334155;
      text-transform: lowercase;
    }

    .mp-pill--glass {
      background: rgba(255,255,255,0.18) !important;
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255,255,255,0.3);
      color: #0f172a !important;
    }

    .mp-left-panel,
    .mp-left-panel__gift-visual,
    .mp-left-panel__footer,
    .mp-sidebar-wrap,
    .mp-bottom-ribbon {
      display: none !important;
    }

    .mp-left-panel__hero-icon {
      font-size: calc(var(--comp-icon-size) * var(--canvas-w-num) / 100 * 0.85px) !important;
    }
  `.trim();
}
