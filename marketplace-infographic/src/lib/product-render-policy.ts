/**
 * Промпт фона: только среда, без товара.
 * Холст WB 900×1200 (3:4).
 */

import { WB_COVER } from "@/lib/composition/canvas";

export const PRODUCT_TARGET_HEIGHT_RATIO = 0.68;
export const PRODUCT_TARGET_MAX_HEIGHT_PX = Math.round(WB_COVER.height * 0.72);
export const PRODUCT_MAX_WIDTH_PX = Math.round(WB_COVER.width * 0.84);
export const PRODUCT_BOTTOM_PAD_PX = Math.round(WB_COVER.height * 0.04);
export const PRODUCT_SIDE_MARGIN_PX = Math.round(WB_COVER.width * 0.07);

export const PRODUCT_BG_NEGATIVE =
  "no product, no equipment, no generator, no appliance, no trimmer, no garden tool, no power tool, no machinery, no object in foreground, no objects on grass, empty center foreground, clear foreground, backdrop only, environment only, scenery only";

const PRODUCT_WORDS =
  /\b(trim(?:m)?er|generator|appliance|tool|product|equipment|machinery|device|object|weed whacker|grass cutter|триммер|генератор|товар|инструмент|техник[аи]|косилк[аи]|бензопил[аы])\b/gi;

/** Убирает из промпта фона упоминания товара — иначе FLUX рисует призрак за cutout */
export function stripProductFromBackgroundPrompt(prompt: string): string {
  return prompt
    .replace(/center space for[\w\s,-]*/gi, "clear empty lawn foreground")
    .replace(/space in center for[\w\s,-]*/gi, "clear empty center foreground")
    .replace(/room for[\w\s,-]*product[\w\s,-]*/gi, "clear empty foreground")
    .replace(PRODUCT_WORDS, "")
    .replace(/\s{2,}/g, " ")
    .replace(/,\s*,/g, ",")
    .trim();
}
