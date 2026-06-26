/**
 * Политика рендера товара на инфографике.
 *
 * РАЗРЕШЕНО только:
 * - вырезка фона (imgly / sharp)
 * - масштаб и позиция на холсте
 * - тень под товаром (drop-shadow / ellipse)
 *
 * ЗАПРЕЩЕНО:
 * - генерация / дорисовка / inpainting товара через SD/FLUX
 * - «улучшение» формы, добавление деталей, запчастей, кнопок
 * - встраивание товара в AI-фон (merge с HF-слоем) — только отдельный PNG-cutout поверх фона
 * - цветокоррекция, меняющая вид товара (brightness/saturation modulate)
 */

export const PRODUCT_BG_NEGATIVE =
  "no product, no equipment, no generator, no appliance, no object in foreground, no machinery, empty center foreground, backdrop only, environment only";

export const PRODUCT_TARGET_HEIGHT_RATIO = 0.58;
export const PRODUCT_TARGET_MAX_HEIGHT_PX = 720;
export const PRODUCT_BOTTOM_PAD_PX = 40;
