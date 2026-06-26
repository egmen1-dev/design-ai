/** Обложка Wildberries / Ozon — нативный рендер 900×1200 (3:4) */
export const MARKETPLACE_CARD = {
  ratio: 3 / 4,
  width: 900,
  height: 1200,
  cropOffsetX: 0,
} as const;

export type MarketplaceFrame = "plain" | "wb" | "ozon";

export const MARKETPLACE_FRAMES: Record<
  MarketplaceFrame,
  { label: string; hint: string }
> = {
  plain: {
    label: "WB 3:4",
    hint: "Обложка 900×1200 — нативный формат Wildberries",
  },
  wb: {
    label: "WB 3:4",
    hint: "900×1200 — готово к загрузке на Wildberries",
  },
  ozon: {
    label: "Ozon 3:4",
    hint: "900×1200 — готово к загрузке на Ozon",
  },
};
