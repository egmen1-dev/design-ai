import { WB_COVER } from "@/lib/composition/canvas";

export const CANVAS = WB_COVER;

export const PRODUCT_AREA_MIN = 55;
export const PRODUCT_AREA_TARGET_MIN = 60;
export const PRODUCT_AREA_TARGET_MAX = 70;
export const PRODUCT_AREA_MAX = 75;

export const PRODUCT_ROTATION_MAX = 5;

/**
 * Sprint 8B — product zone height clamp aligned with compositor policy (58% canvas).
 * MIN > MAX intentionally squeezes all productH values to 58% (was clamp 60..85).
 */
export const PRODUCT_FINAL_HEIGHT_MIN_PCT = 60;
export const PRODUCT_FINAL_HEIGHT_MAX_PCT = 58;
/** Pre-8B historical clamp — used for regression diagnostics only */
export const PRODUCT_FINAL_HEIGHT_LEGACY_MAX_PCT = 85;

export const PRODUCT_FINAL_WIDTH_MIN_PCT = 55;
export const PRODUCT_FINAL_WIDTH_MAX_PCT = 72;

export const HEADLINE_FONT_MIN_PX = 46;
export const HEADLINE_FONT_MAX_PX = 84;
export const HEADLINE_BLOCK_MAX_HEIGHT_PCT = 18;

export const PLAQUE_HEIGHT_MIN_PCT = 6;
export const PLAQUE_HEIGHT_MAX_PCT = 8;
export const PLAQUE_WIDTH_MAX_PCT = 45;

export const WHITESPACE_MIN_PCT = 20;

export const DESIGN_SCORE_PASS = 90;
export const MAX_LAYOUT_ATTEMPTS = 8;

export function fontPxToSizePct(px: number): number {
  return (px / CANVAS.height) * 100;
}
