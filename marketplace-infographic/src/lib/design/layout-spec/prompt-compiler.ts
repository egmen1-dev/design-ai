import type { CreativeDirectorResult } from "@/lib/design-process/creative-concept";
import type { LayoutSpec } from "./types";

/** Compile structured design instructions — no free-form prose */
export function compileDesignInstructionsFromLayoutSpec(
  spec: LayoutSpec,
  creative: CreativeDirectorResult,
): string {
  const lines = [
    "## LAYOUT SPEC (HARD CONSTRAINTS — DO NOT VIOLATE)",
    "",
    `HERO: position=${spec.heroPosition}, scale=${Math.round(spec.heroScale * 100)}% canvas focus`,
    `HEADLINE: area=${spec.headlineArea}, max 2 lines, high contrast`,
    `BENEFITS: area=${spec.benefitsArea}, max 1 bullet for cover`,
    `CTA: area=${spec.ctaArea}`,
    `WHITESPACE: target ${spec.whitespaceTarget}% (range 20–35%)`,
    `OBJECTS: 1 primary product, max ${spec.maxSecondaryObjects} secondary, max ${spec.maxIcons} icons`,
    `COLORS: exactly ${spec.maxColors} colors — ${spec.palette.join(", ")}`,
    `BACKGROUND: ${spec.backgroundStyle}, clean, no clutter, no busy patterns`,
    `LIGHTING: ${spec.lightingStyle}`,
    "",
    "VISUAL WEIGHT MAP (% attention budget):",
    `  hero=${spec.visualWeightMap.hero}%`,
    `  headline=${spec.visualWeightMap.headline}%`,
    `  benefits=${spec.visualWeightMap.benefits}%`,
    `  cta=${spec.visualWeightMap.cta}%`,
    `  background=${spec.visualWeightMap.background}% (must stay low)`,
    "",
    "HIERARCHY: Hero → Headline → Benefits → CTA",
    "FORBIDDEN: decorative particles, extra props, text in background, more than 1 hero object",
    "",
    `CREATIVE ANCHOR (do not change idea): ${creative.creativeConcept.title}`,
    `ONE THOUGHT: ${creative.oneThought.headline}`,
  ];
  return lines.join("\n");
}

export function compileSceneConstraintsFromLayoutSpec(spec: LayoutSpec): string {
  return [
    "layout spec constraints:",
    `clean ${spec.backgroundStyle} background`,
    `whitespace approximately ${spec.whitespaceTarget}%`,
    `lighting ${spec.lightingStyle}`,
    "maximum 1 foreground object zone empty for product",
    `no more than ${spec.maxSecondaryObjects} secondary scene elements`,
    "no decorative particles",
    "no text",
    "soft bokeh background",
    spec.backgroundStyle === "dark_premium" ? "dark muted backdrop 20% darker than mid-tone" : "",
  ]
    .filter(Boolean)
    .join(", ");
}

export function compileLayoutSpecJson(spec: LayoutSpec): string {
  return JSON.stringify(spec, null, 2);
}
