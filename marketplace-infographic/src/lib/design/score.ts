import { clampPct } from "@/lib/composition/canvas";
import type { CompositionLayout } from "@/lib/composition/types";
import type { CompositionScore, DesignDNA } from "./types";

function scoreRange(value: number, min: number, max: number, weight: number): number {
  if (value >= min && value <= max) return weight;
  const dist = value < min ? min - value : value - max;
  return Math.max(0, weight - dist * 2.5);
}

/** Оценка композиции 0–100 по правилам WB */
export function scoreComposition(layout: CompositionLayout, dna: DesignDNA): CompositionScore {
  const m = layout.metrics;

  const balance = Math.max(0, 100 - Math.abs(m.visualCenterX - 50) * 3.2);
  const productSize = scoreRange(m.productAreaPct, 55, 72, 100);
  const whitespace = scoreRange(m.whitespacePct, 20, 35, 100);
  const textDensity = scoreRange(m.textAreaPct, 8, 28, 100);
  const overlap = Math.max(0, 100 - m.overlapPct * 15);
  const productInsets = [
    layout.product.left,
    layout.product.top,
    100 - (layout.product.left + layout.product.width),
    100 - (layout.product.top + layout.product.height),
  ];
  const minProductInset = Math.min(...productInsets);
  const safeArea = minProductInset >= 5 ? 100 : Math.max(0, minProductInset * 18);
  const contrast = scoreRange(dna.contrast, 45, 85, 100);
  const readability =
    layout.headline.fontSizePct >= 3.8 && m.plaqueAreaPct <= 12 ? 100 : 70;

  const total = Math.round(
    balance * 0.14 +
      productSize * 0.18 +
      whitespace * 0.16 +
      textDensity * 0.1 +
      overlap * 0.18 +
      safeArea * 0.12 +
      contrast * 0.06 +
      readability * 0.06,
  );

  return {
    total: clampPct(total, 0, 100),
    balance: Math.round(balance),
    productSize: Math.round(productSize),
    whitespace: Math.round(whitespace),
    textDensity: Math.round(textDensity),
    readability: Math.round(readability),
    contrast: Math.round(contrast),
    overlap: Math.round(overlap),
    safeArea: Math.round(safeArea),
  };
}
