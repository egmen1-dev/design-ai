import { clampPct, zoneAreaPct, WB_COVER } from "@/lib/composition/canvas";
import type { CompositionLayout, CompositionMetrics } from "@/lib/composition/types";
import type { CardMeaning, LayoutTemplate, ProductShapeHint } from "./types";
import {
  PLAQUE_HEIGHT_MAX_PCT,
  PLAQUE_HEIGHT_MIN_PCT,
  PLAQUE_WIDTH_MAX_PCT,
  PRODUCT_AREA_MAX,
  PRODUCT_AREA_MIN,
  PRODUCT_ROTATION_MAX,
  fontPxToSizePct,
} from "./constants";
import { fitHeadlineFontSize } from "./headline";

function estimatePlaqueWidthPct(text: string): number {
  const px = Math.min(text.length * 9 + 24, (PLAQUE_WIDTH_MAX_PCT / 100) * WB_COVER.width);
  return (px / WB_COVER.width) * 100;
}

function computeMetrics(layout: Omit<CompositionLayout, "metrics" | "valid" | "issues" | "adjustments">): CompositionMetrics {
  const productAreaPct = zoneAreaPct(layout.product.width, layout.product.height);
  const textAreaPct =
    zoneAreaPct(layout.headline.width, layout.headline.height) +
    zoneAreaPct(layout.subtitle.width, layout.subtitle.height);
  const plaqueAreaPct =
    zoneAreaPct(layout.leftPanel.width, layout.leftPanel.height) +
    zoneAreaPct(layout.rightSidebar.width, layout.rightSidebar.height);
  let overlapPct = 0;
  const textZones = [layout.headline, layout.subtitle, layout.leftPanel, layout.bullets];
  for (const z of textZones) {
    if (z.width > 0 && zonesOverlap(layout.product, z)) {
      overlapPct += 5;
    }
  }
  const used = productAreaPct + textAreaPct + plaqueAreaPct - overlapPct;
  return {
    productAreaPct,
    textAreaPct,
    plaqueAreaPct,
    whitespacePct: Math.max(0, 100 - used),
    overlapPct,
    visualCenterX: layout.product.centerX,
    visualCenterY: layout.product.centerY,
    minEdgeInsetPct: Math.min(layout.product.left, layout.product.top, 5),
  };
}

function zonesOverlap(
  a: { left: number; top: number; width: number; height: number },
  b: { left: number; top: number; width: number; height: number },
): boolean {
  return (
    a.left < b.left + b.width &&
    a.left + a.width > b.left &&
    a.top < b.top + b.height &&
    a.top + a.height > b.top
  );
}

/** Строит CompositionLayout из шаблона — без LLM */
export function buildLayoutFromTemplate(
  template: LayoutTemplate,
  meaning: CardMeaning,
  productShape: ProductShapeHint = "standard",
): { layout: CompositionLayout; headlineFontPx: number } {
  const scale = template.productScale;
  const productW = clampPct(scale * 100 * 0.92, 58, 74);
  const productH = clampPct(scale * 100 * 1.05, 62, 88);
  let area = zoneAreaPct(productW, productH);
  if (area < PRODUCT_AREA_MIN) {
    const k = Math.sqrt(PRODUCT_AREA_MIN / area);
    area = PRODUCT_AREA_MIN;
  }
  if (area > PRODUCT_AREA_MAX) {
    const k = Math.sqrt(PRODUCT_AREA_MAX / area);
  }
  const finalW = clampPct(productW, 55, 72);
  const finalH = clampPct(productH, 60, 85);

  const centerX = template.productCenterX;
  const centerY =
    productShape === "wide" ? template.productCenterYWide : template.productCenterY;

  const productLeft = clampPct(centerX - finalW / 2, 5, 100 - finalW - 5);
  const productTop = clampPct(centerY - finalH / 2, 8, 100 - finalH - 5);

  const rotation = Math.max(
    -PRODUCT_ROTATION_MAX,
    Math.min(PRODUCT_ROTATION_MAX, template.rotationDeg),
  );

  const headlineFit = fitHeadlineFontSize(meaning.title, template.headlineWidth);
  const headlineLeft =
    template.textSide === "right"
      ? clampPct(100 - template.headlineWidth - 6, 6, 50)
      : clampPct(6, 5, 14);

  const headline = {
    left: headlineLeft,
    top: template.headlineTop,
    width: template.headlineWidth,
    height: headlineFit.blockHeightPct,
    fontSizePct: headlineFit.fontSizePct,
  };

  const subtitle = {
    left: headline.left,
    top: headline.top + headline.height + 0.8,
    width: clampPct(template.headlineWidth * 0.85, 20, 50),
    height: 4,
    fontSizePct: fontPxToSizePct(28),
  };

  const plaqueH = (PLAQUE_HEIGHT_MIN_PCT + PLAQUE_HEIGHT_MAX_PCT) / 2;
  const plaqueW = clampPct(estimatePlaqueWidthPct(meaning.feature), 12, PLAQUE_WIDTH_MAX_PCT);

  const leftPanel =
    template.featureSide === "left" && meaning.feature
      ? {
          left: clampPct(6, 5, 12),
          top: clampPct(headline.top + headline.height + 8, 22, 38),
          width: plaqueW,
          height: plaqueH,
        }
      : { left: 0, top: 0, width: 0, height: 0 };

  const rightSidebar = { left: 0, top: 0, width: 0, height: 0 };

  const draft: Omit<CompositionLayout, "metrics" | "valid" | "issues" | "adjustments"> = {
    canvas: { width: WB_COVER.width, height: WB_COVER.height },
    safeInsetPct: 6,
    product: {
      left: productLeft,
      top: productTop,
      width: finalW,
      height: finalH,
      centerX,
      centerY,
      maxWidthPct: finalW,
      maxHeightPct: finalH,
      areaPct: zoneAreaPct(finalW, finalH),
      rotationDeg: rotation,
    },
    headline,
    subtitle,
    leftPanel,
    rightSidebar,
    bullets: { left: 0, top: 0, width: 0, height: 0, itemHeightPct: 0, gapPct: 0, maxCount: 0 },
    plaques: {
      smallWidthPct: plaqueW * 0.85,
      mediumWidthPct: plaqueW,
      largeWidthPct: Math.min(PLAQUE_WIDTH_MAX_PCT, plaqueW * 1.1),
      heightPct: plaqueH,
      maxTotalAreaPct: 10,
    },
    icon: { sizePct: 3.5, textGapPct: 1.2 },
    textSide: template.textSide === "right" ? "right" : "left",
    scenarioId: template.id,
    seed: template.id,
  };

  const metrics = computeMetrics(draft);
  return {
    layout: { ...draft, metrics, valid: true, issues: [], adjustments: [] },
    headlineFontPx: headlineFit.fontPx,
  };
}
