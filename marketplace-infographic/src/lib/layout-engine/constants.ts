import { WB_COVER } from "@/lib/composition/canvas";

export const CANVAS = WB_COVER;

export const PRODUCT_AREA_MIN = 55;
export const PRODUCT_AREA_TARGET_MIN = 60;
export const PRODUCT_AREA_TARGET_MAX = 70;
export const PRODUCT_AREA_MAX = 75;

export const PRODUCT_ROTATION_MAX = 5;

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
