import type { KnowledgeCategory } from "@/lib/design/knowledge-engine/types";
import type { BadgeStyleKind } from "./types";

const styleLayoutBoost = new Map<string, number>();

const STYLE_LAYOUT_AFFINITY: Record<BadgeStyleKind, string[]> = {
  glass: ["glass", "modern", "floating", "commercial"],
  minimal: ["minimal", "studio", "focus"],
  premium: ["premium", "luxury", "editorial"],
  tech: ["technical", "modern", "grid"],
  modern: ["modern", "commercial", "asymmetric"],
  soft: ["lifestyle", "floating", "studio"],
  outline: ["minimal", "technical", "grid"],
  neumorphism: ["studio", "floating", "glass"],
  brutalism: ["poster", "magazine", "asymmetric"],
};

export function refreshAssetsLayoutCache(
  category: KnowledgeCategory,
  badgeStyle?: BadgeStyleKind,
): void {
  if (!badgeStyle) return;
  const layouts = STYLE_LAYOUT_AFFINITY[badgeStyle] ?? [];
  for (const layout of layouts) {
    styleLayoutBoost.set(`${category}:${layout}`, 8);
  }
}

export function getAssetsIntelligenceLayoutBoost(
  category: KnowledgeCategory,
  layoutTemplate: string,
): number {
  return styleLayoutBoost.get(`${category}:${layoutTemplate}`) ?? 0;
}
