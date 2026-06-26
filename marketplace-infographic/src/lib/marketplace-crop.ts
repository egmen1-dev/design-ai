/** Размеры карточки на WB и Ozon (3:4, вертикаль). Источник 1200×1200 режется по центру. */
export const MARKETPLACE_CARD = {
  ratio: 3 / 4,
  width: 900,
  height: 1200,
  /** Отступ слева при center-crop из квадрата 1200×1200 */
  cropOffsetX: (1200 - 900) / 2,
} as const;

export type MarketplaceFrame = "plain" | "wb" | "ozon";

export const MARKETPLACE_FRAMES: Record<
  MarketplaceFrame,
  { label: string; hint: string }
> = {
  plain: {
    label: "Оригинал",
    hint: "Слайд 1200×1200 — полный макет",
  },
  wb: {
    label: "WB 3:4",
    hint: "Обрезка 900×1200 по центру — как на Wildberries",
  },
  ozon: {
    label: "Ozon 3:4",
    hint: "Обрезка 900×1200 по центру — как на Ozon",
  },
};
