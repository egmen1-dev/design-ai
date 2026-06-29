import type { BadgeStyleKind, ParametricBadgeModel, ReferenceImageMeta } from "./types";

const QUERY_STYLE_MAP: Array<{ pattern: RegExp; style: BadgeStyleKind }> = [
  { pattern: /glass/i, style: "glass" },
  { pattern: /premium|luxury/i, style: "premium" },
  { pattern: /minimal/i, style: "minimal" },
  { pattern: /tech|digital/i, style: "tech" },
  { pattern: /modern/i, style: "modern" },
  { pattern: /soft/i, style: "soft" },
];

const STYLE_DEFAULTS: Record<BadgeStyleKind, ParametricBadgeModel> = {
  glass: {
    style: "glass",
    radius: 18,
    paddingX: 26,
    paddingY: 14,
    borderWidth: 1,
    shadow: "soft",
    gradient: "blue_glass",
    opacity: 92,
    cornerStyle: "rounded",
    stretchMode: "center",
    iconPosition: "left",
    adaptive: true,
    fillColor: "rgba(255,255,255,0.22)",
    borderColor: "rgba(255,255,255,0.45)",
    textColor: "#ffffff",
  },
  minimal: {
    style: "minimal",
    radius: 8,
    paddingX: 20,
    paddingY: 10,
    borderWidth: 1,
    shadow: "none",
    gradient: "flat",
    opacity: 100,
    cornerStyle: "rounded",
    stretchMode: "fit",
    iconPosition: "none",
    adaptive: true,
    fillColor: "#111827",
    textColor: "#ffffff",
  },
  premium: {
    style: "premium",
    radius: 24,
    paddingX: 28,
    paddingY: 12,
    borderWidth: 2,
    shadow: "medium",
    gradient: "gold_dark",
    opacity: 100,
    cornerStyle: "pill",
    stretchMode: "center",
    iconPosition: "left",
    adaptive: true,
    fillColor: "#1a1a2e",
    borderColor: "#d4af37",
    textColor: "#f8fafc",
  },
  tech: {
    style: "tech",
    radius: 6,
    paddingX: 22,
    paddingY: 11,
    borderWidth: 2,
    shadow: "hard",
    gradient: "cyan_dark",
    opacity: 100,
    cornerStyle: "sharp",
    stretchMode: "expand",
    iconPosition: "left",
    adaptive: true,
    fillColor: "#0f172a",
    borderColor: "#06b6d4",
    textColor: "#e0f2fe",
  },
  modern: {
    style: "modern",
    radius: 14,
    paddingX: 24,
    paddingY: 12,
    borderWidth: 0,
    shadow: "soft",
    gradient: "brand",
    opacity: 100,
    cornerStyle: "rounded",
    stretchMode: "center",
    iconPosition: "left",
    adaptive: true,
  },
  soft: {
    style: "soft",
    radius: 20,
    paddingX: 24,
    paddingY: 13,
    borderWidth: 0,
    shadow: "soft",
    gradient: "pastel",
    opacity: 95,
    cornerStyle: "pill",
    stretchMode: "fit",
    iconPosition: "none",
    adaptive: true,
    fillColor: "#f1f5f9",
    textColor: "#0f172a",
  },
  outline: {
    style: "outline",
    radius: 12,
    paddingX: 22,
    paddingY: 10,
    borderWidth: 2,
    shadow: "none",
    gradient: "transparent",
    opacity: 100,
    cornerStyle: "rounded",
    stretchMode: "fit",
    iconPosition: "left",
    adaptive: true,
    borderColor: "currentColor",
    textColor: "currentColor",
  },
  neumorphism: {
    style: "neumorphism",
    radius: 16,
    paddingX: 24,
    paddingY: 12,
    borderWidth: 0,
    shadow: "soft",
    gradient: "neu_flat",
    opacity: 100,
    cornerStyle: "rounded",
    stretchMode: "center",
    iconPosition: "none",
    adaptive: true,
    fillColor: "#e8ecf1",
    textColor: "#334155",
  },
  brutalism: {
    style: "brutalism",
    radius: 0,
    paddingX: 20,
    paddingY: 10,
    borderWidth: 4,
    shadow: "hard",
    gradient: "flat",
    opacity: 100,
    cornerStyle: "sharp",
    stretchMode: "expand",
    iconPosition: "none",
    adaptive: true,
    fillColor: "#fef08a",
    borderColor: "#111",
    textColor: "#111",
  },
};

export function inferStyleFromReference(ref: ReferenceImageMeta): BadgeStyleKind {
  const text = `${ref.query} ${ref.title ?? ""}`;
  for (const rule of QUERY_STYLE_MAP) {
    if (rule.pattern.test(text)) return rule.style;
  }
  return "modern";
}

/** Анализ референса → параметрическая модель (не PNG) */
export function analyzeBadgeReference(ref: ReferenceImageMeta): ParametricBadgeModel {
  const style = inferStyleFromReference(ref);
  const base = { ...STYLE_DEFAULTS[style] };

  if (/100|500|wb/i.test(ref.query)) {
    base.paddingX += 2;
    base.radius += 1;
  }
  if (/glass/i.test(ref.query)) {
    base.opacity = 88;
    base.borderWidth = 1;
  }
  if (/premium/i.test(ref.query)) {
    base.shadow = "medium";
    base.cornerStyle = "pill";
  }

  return base;
}

export function analyzeBadgeReferences(refs: ReferenceImageMeta[]): ParametricBadgeModel[] {
  const seen = new Set<string>();
  const models: ParametricBadgeModel[] = [];

  for (const ref of refs) {
    const style = inferStyleFromReference(ref);
    if (seen.has(style)) continue;
    seen.add(style);
    models.push(analyzeBadgeReference(ref));
  }

  return models;
}

export function badgeModelKey(model: ParametricBadgeModel): string {
  return `${model.style}_r${model.radius}_p${model.paddingX}`;
}

export { STYLE_DEFAULTS };
