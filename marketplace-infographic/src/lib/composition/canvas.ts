/** Wildberries / Ozon обложка товара 3:4 */
export const WB_COVER = {
  width: 900,
  height: 1200,
  ratio: 3 / 4,
} as const;

export type CanvasSize = typeof WB_COVER;

/** Процент от ширины холста → px */
export function xPct(pct: number, canvas: CanvasSize = WB_COVER): number {
  return Math.round((pct / 100) * canvas.width);
}

/** Процент от высоты холста → px */
export function yPct(pct: number, canvas: CanvasSize = WB_COVER): number {
  return Math.round((pct / 100) * canvas.height);
}

/** Площадь зоны в % от всего кадра */
export function zoneAreaPct(widthPct: number, heightPct: number): number {
  return (widthPct / 100) * (heightPct / 100) * 100;
}

export function clampPct(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
