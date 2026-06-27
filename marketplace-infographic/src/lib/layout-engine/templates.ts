import { getMemoryLayoutBoost } from "@/lib/agents/design-memory/apply";
import { getKnowledgeLayoutBoost } from "@/lib/design/knowledge-engine";
import { getMarketIntelligenceLayoutBoost } from "@/lib/design/market-intelligence";
import { getAssetsIntelligenceLayoutBoost } from "@/lib/design/design-assets-intelligence";
import { getTrendIntelligenceLayoutBoost } from "@/lib/design/trend-intelligence";
import type { KnowledgeCategory } from "@/lib/design/knowledge-engine";
import type { ProductCategory } from "@/lib/product-analysis";
import type { LayoutTemplate, LayoutTemplateId } from "./types";

/** 20 шаблонов — только сетка, координаты вычисляет движок */
export const LAYOUT_TEMPLATES: LayoutTemplate[] = [
  { id: "hero_left", label: "Hero Left", textSide: "left", productScale: 0.66, productCenterX: 58, productCenterY: 52, productCenterYWide: 58, rotationDeg: -3, headlineTop: 6, headlineWidth: 42, headlineMaxHeightPct: 16, featureSide: "left", suitsWide: true, suitsTall: true, suitsPriority: ["product", "balanced"] },
  { id: "hero_right", label: "Hero Right", textSide: "right", productScale: 0.65, productCenterX: 42, productCenterY: 52, productCenterYWide: 58, rotationDeg: 3, headlineTop: 6, headlineWidth: 40, headlineMaxHeightPct: 16, featureSide: "right", suitsWide: true, suitsTall: true, suitsPriority: ["product", "balanced"] },
  { id: "premium", label: "Premium", textSide: "left", productScale: 0.64, productCenterX: 54, productCenterY: 50, productCenterYWide: 56, rotationDeg: -2, headlineTop: 7, headlineWidth: 38, headlineMaxHeightPct: 14, featureSide: "left", suitsWide: false, suitsTall: true, suitsPriority: ["product", "balanced"] },
  { id: "magazine", label: "Magazine", textSide: "left", productScale: 0.62, productCenterX: 56, productCenterY: 54, productCenterYWide: 60, rotationDeg: -4, headlineTop: 5, headlineWidth: 44, headlineMaxHeightPct: 17, featureSide: "bottom", suitsWide: true, suitsTall: false, suitsPriority: ["balanced", "text"] },
  { id: "minimal", label: "Minimal", textSide: "left", productScale: 0.68, productCenterX: 52, productCenterY: 50, productCenterYWide: 55, rotationDeg: 0, headlineTop: 8, headlineWidth: 36, headlineMaxHeightPct: 12, featureSide: "left", suitsWide: true, suitsTall: true, suitsPriority: ["product"] },
  { id: "poster", label: "Poster", textSide: "top", productScale: 0.70, productCenterX: 50, productCenterY: 56, productCenterYWide: 62, rotationDeg: 0, headlineTop: 5, headlineWidth: 70, headlineMaxHeightPct: 14, featureSide: "bottom", suitsWide: true, suitsTall: true, suitsPriority: ["product"] },
  { id: "lifestyle", label: "Lifestyle", textSide: "left", productScale: 0.63, productCenterX: 57, productCenterY: 53, productCenterYWide: 59, rotationDeg: -5, headlineTop: 6, headlineWidth: 40, headlineMaxHeightPct: 16, featureSide: "left", suitsWide: true, suitsTall: false, suitsPriority: ["product", "balanced"] },
  { id: "studio", label: "Studio", textSide: "left", productScale: 0.65, productCenterX: 50, productCenterY: 50, productCenterYWide: 54, rotationDeg: -1, headlineTop: 7, headlineWidth: 38, headlineMaxHeightPct: 15, featureSide: "left", suitsWide: false, suitsTall: true, suitsPriority: ["product"] },
  { id: "technical", label: "Technical", textSide: "left", productScale: 0.64, productCenterX: 55, productCenterY: 51, productCenterYWide: 57, rotationDeg: 0, headlineTop: 5.5, headlineWidth: 42, headlineMaxHeightPct: 14, featureSide: "left", suitsWide: false, suitsTall: true, suitsPriority: ["text", "balanced"] },
  { id: "luxury", label: "Luxury", textSide: "right", productScale: 0.63, productCenterX: 48, productCenterY: 49, productCenterYWide: 55, rotationDeg: 2, headlineTop: 8, headlineWidth: 35, headlineMaxHeightPct: 13, featureSide: "right", suitsWide: false, suitsTall: true, suitsPriority: ["product"] },
  { id: "diagonal", label: "Diagonal", textSide: "left", productScale: 0.66, productCenterX: 60, productCenterY: 54, productCenterYWide: 60, rotationDeg: -5, headlineTop: 5, headlineWidth: 38, headlineMaxHeightPct: 16, featureSide: "left", suitsWide: true, suitsTall: false, suitsPriority: ["product"] },
  { id: "floating", label: "Floating", textSide: "left", productScale: 0.67, productCenterX: 50, productCenterY: 48, productCenterYWide: 54, rotationDeg: 0, headlineTop: 6, headlineWidth: 40, headlineMaxHeightPct: 15, featureSide: "bottom", suitsWide: true, suitsTall: true, suitsPriority: ["product"] },
  { id: "split", label: "Split", textSide: "left", productScale: 0.62, productCenterX: 62, productCenterY: 52, productCenterYWide: 58, rotationDeg: -3, headlineTop: 6, headlineWidth: 36, headlineMaxHeightPct: 16, featureSide: "left", suitsWide: false, suitsTall: true, suitsPriority: ["balanced"] },
  { id: "focus", label: "Focus", textSide: "top", productScale: 0.69, productCenterX: 50, productCenterY: 55, productCenterYWide: 61, rotationDeg: 0, headlineTop: 4.5, headlineWidth: 72, headlineMaxHeightPct: 13, featureSide: "bottom", suitsWide: true, suitsTall: true, suitsPriority: ["product"] },
  { id: "grid", label: "Grid", textSide: "left", productScale: 0.64, productCenterX: 54, productCenterY: 52, productCenterYWide: 58, rotationDeg: -2, headlineTop: 6, headlineWidth: 41, headlineMaxHeightPct: 15, featureSide: "left", suitsWide: true, suitsTall: true, suitsPriority: ["balanced"] },
  { id: "asymmetric", label: "Asymmetric", textSide: "right", productScale: 0.65, productCenterX: 58, productCenterY: 53, productCenterYWide: 59, rotationDeg: 4, headlineTop: 5.5, headlineWidth: 37, headlineMaxHeightPct: 16, featureSide: "right", suitsWide: true, suitsTall: false, suitsPriority: ["product", "balanced"] },
  { id: "editorial", label: "Editorial", textSide: "right", productScale: 0.61, productCenterX: 46, productCenterY: 50, productCenterYWide: 56, rotationDeg: -4, headlineTop: 7, headlineWidth: 34, headlineMaxHeightPct: 14, featureSide: "right", suitsWide: false, suitsTall: true, suitsPriority: ["text", "balanced"] },
  { id: "modern", label: "Modern", textSide: "left", productScale: 0.66, productCenterX: 53, productCenterY: 51, productCenterYWide: 57, rotationDeg: -1, headlineTop: 6.5, headlineWidth: 43, headlineMaxHeightPct: 15, featureSide: "left", suitsWide: true, suitsTall: true, suitsPriority: ["balanced"] },
  { id: "glass", label: "Glass", textSide: "left", productScale: 0.64, productCenterX: 55, productCenterY: 52, productCenterYWide: 58, rotationDeg: 0, headlineTop: 6, headlineWidth: 40, headlineMaxHeightPct: 15, featureSide: "left", suitsWide: true, suitsTall: true, suitsPriority: ["product", "balanced"] },
  { id: "commercial", label: "Commercial", textSide: "left", productScale: 0.67, productCenterX: 52, productCenterY: 51, productCenterYWide: 57, rotationDeg: -2, headlineTop: 5.5, headlineWidth: 44, headlineMaxHeightPct: 16, featureSide: "left", suitsWide: true, suitsTall: true, suitsPriority: ["product", "balanced"] },
];

export function getTemplate(id: LayoutTemplateId): LayoutTemplate {
  return LAYOUT_TEMPLATES.find((t) => t.id === id) ?? LAYOUT_TEMPLATES[0];
}

export function rankTemplatesForProduct(
  shape: import("./types").ProductShapeHint,
  priority: import("./types").CardMeaning["priority"],
  seed: string,
  category?: ProductCategory,
  knowledgeCategory?: KnowledgeCategory,
): LayoutTemplate[] {
  const jitter = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % 100;
  return [...LAYOUT_TEMPLATES]
    .map((t) => {
      let score = 50;
      if (t.suitsPriority.includes(priority)) score += 20;
      if (shape === "wide" && t.suitsWide) score += 15;
      if (shape === "tall" && t.suitsTall) score += 15;
      if (shape === "standard") score += 8;
      score += (jitter + t.id.length) % 12;
      score += getMemoryLayoutBoost(t.id, category);
      if (knowledgeCategory) {
        score += getKnowledgeLayoutBoost(knowledgeCategory, t.id);
        score += getMarketIntelligenceLayoutBoost(knowledgeCategory, t.id);
        score += getAssetsIntelligenceLayoutBoost(knowledgeCategory, t.id);
        score += getTrendIntelligenceLayoutBoost(knowledgeCategory, t.id);
      }
      return { t, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.t);
}
