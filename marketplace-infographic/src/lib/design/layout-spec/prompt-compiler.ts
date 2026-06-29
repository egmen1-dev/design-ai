import type { CreativeDirectorResult } from "@/lib/design-process/creative-concept";
import type { LayoutSpec } from "./types";
import { hierarchyPromptBlock } from "@/lib/design/composition-director";

/** Compile structured design instructions — no free-form prose */
export function compileDesignInstructionsFromLayoutSpec(
  spec: LayoutSpec,
  creative: CreativeDirectorResult,
): string {
  const geoBlock = spec.geometry
    ? [
        "GEOMETRY (normalized 0–1 — DO NOT INVENT COORDINATES):",
        `canvas ${spec.geometry.canvas.width}×${spec.geometry.canvas.height}`,
        `hero x=${spec.geometry.hero.x.toFixed(2)} y=${spec.geometry.hero.y.toFixed(2)} w=${spec.geometry.hero.width.toFixed(2)} h=${spec.geometry.hero.height.toFixed(2)} rot=${spec.geometry.hero.rotation ?? 0}°`,
        `headline x=${spec.geometry.headline.x.toFixed(2)} y=${spec.geometry.headline.y.toFixed(2)} w=${spec.geometry.headline.width.toFixed(2)}`,
        `benefits y=${spec.geometry.benefits.y.toFixed(2)} w=${spec.geometry.benefits.width.toFixed(2)}`,
        `cta y=${spec.geometry.cta.y.toFixed(2)}`,
        `whitespace ratio ${(spec.visualWeight ? 1 - spec.visualWeight.hero - spec.visualWeight.headline - spec.visualWeight.benefits - spec.visualWeight.cta : spec.whitespaceTarget / 100).toFixed(2)}`,
      ].join("\n")
    : "";

  const weightBlock = spec.visualWeight
    ? `visual weight hero=${spec.visualWeight.hero.toFixed(2)} headline=${spec.visualWeight.headline.toFixed(2)} benefits=${spec.visualWeight.benefits.toFixed(2)} cta=${spec.visualWeight.cta.toFixed(2)} bg=${spec.visualWeight.background.toFixed(2)}`
    : [
        `hero=${spec.visualWeightMap.hero}%`,
        `headline=${spec.visualWeightMap.headline}%`,
        `benefits=${spec.visualWeightMap.benefits}%`,
        `cta=${spec.visualWeightMap.cta}%`,
        `background=${spec.visualWeightMap.background}%`,
      ].join(" ");

  const lines = [
    "## LAYOUT SPEC (HARD CONSTRAINTS — DO NOT VIOLATE)",
    spec.compositionTemplateId ? `TEMPLATE: ${spec.compositionTemplateId}` : "",
    geoBlock,
    spec.hierarchy ? hierarchyPromptBlock(spec.hierarchy) : "",
    "",
    `HERO: position=${spec.heroPosition}, scale=${Math.round(spec.heroScale * 100)}% canvas focus`,
    `HEADLINE: area=${spec.headlineArea}, max 2 lines, high contrast`,
    `BENEFITS: area=${spec.benefitsArea}, max 1 bullet for cover`,
    `CTA: area=${spec.ctaArea}`,
    `WHITESPACE: target ${spec.whitespaceTarget}% (range 20–35%)`,
    `OBJECTS: 1 primary, max ${spec.maxSecondaryObjects} secondary, max ${spec.maxDecorativeObjects ?? 1} decorative`,
    `COLORS: exactly ${spec.maxColors} — ${spec.palette.join(", ")}`,
    `BACKGROUND: ${spec.backgroundStyle}`,
    `LIGHTING: ${spec.lightingStyle}`,
    "",
    "VISUAL WEIGHT:",
    weightBlock,
    "",
    "EYE FLOW: Hero → Headline → Benefits → CTA",
    "FORBIDDEN: floating cutout, dead center hero, perfect symmetry, decorative noise",
    "",
    `CREATIVE ANCHOR: ${creative.creativeConcept.title}`,
    `ONE THOUGHT: ${creative.oneThought.headline}`,
  ].filter(Boolean);
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
