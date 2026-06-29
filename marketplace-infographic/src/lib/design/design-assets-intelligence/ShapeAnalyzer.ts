import type { ParametricBadgeModel, ShapeStyleModel } from "./types";

export function analyzeShapeFromBadge(model: ParametricBadgeModel): ShapeStyleModel {
  return {
    name: `${model.style}_shape`,
    radius: model.radius,
    borderWidth: model.borderWidth,
    depth: model.shadow === "hard" ? 3 : model.shadow === "medium" ? 2 : 1,
    gradient: model.gradient !== "flat" && model.gradient !== "transparent",
    shadow: model.shadow,
    glass: model.style === "glass",
    neumorphism: model.style === "neumorphism",
    outline: model.style === "outline",
    styleFamily: model.style,
  };
}

export const SEED_SHAPES: ShapeStyleModel[] = [
  {
    name: "glassmorphism_soft",
    radius: 20,
    borderWidth: 1,
    depth: 2,
    gradient: true,
    shadow: "soft",
    glass: true,
    neumorphism: false,
    outline: false,
    styleFamily: "glassmorphism",
  },
  {
    name: "minimal_outline",
    radius: 8,
    borderWidth: 2,
    depth: 0,
    gradient: false,
    shadow: "none",
    glass: false,
    neumorphism: false,
    outline: true,
    styleFamily: "minimal",
  },
  {
    name: "soft_ui_pill",
    radius: 999,
    borderWidth: 0,
    depth: 1,
    gradient: true,
    shadow: "soft",
    glass: false,
    neumorphism: false,
    outline: false,
    styleFamily: "soft ui",
  },
];
