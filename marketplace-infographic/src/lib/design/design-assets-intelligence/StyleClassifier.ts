import type { BadgeStyleKind, FontStyleTag, ParametricBadgeModel } from "./types";

export function classifyBadgeStyle(model: ParametricBadgeModel): BadgeStyleKind {
  return model.style;
}

export function classifyFontStyles(tags: FontStyleTag[]): string {
  return tags.slice(0, 4).join(", ");
}

export function visualComplexity(model: ParametricBadgeModel): "low" | "medium" | "high" {
  let score = 0;
  if (model.shadow !== "none") score += 1;
  if (model.gradient !== "flat") score += 1;
  if (model.iconPosition !== "none") score += 1;
  if (model.borderWidth > 1) score += 1;
  if (model.style === "glass" || model.style === "neumorphism") score += 1;
  if (score <= 1) return "low";
  if (score <= 3) return "medium";
  return "high";
}
