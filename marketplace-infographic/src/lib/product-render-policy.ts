/**
 * Промпт фона: только среда, без товара.
 * Товар накладывается отдельным PNG-cutout поверх.
 */

export const PRODUCT_BG_NEGATIVE =
  "no product, no equipment, no generator, no appliance, no trimmer, no garden tool, no power tool, no machinery, no object in foreground, no objects on grass, empty center foreground, clear foreground, backdrop only, environment only, scenery only";

export const PRODUCT_TARGET_HEIGHT_RATIO = 0.72;
export const PRODUCT_TARGET_MAX_HEIGHT_PX = 860;
export const PRODUCT_BOTTOM_PAD_PX = 28;

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
