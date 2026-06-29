import type { CompositionLayout } from "@/lib/composition/types";
import type { CardMeaning, LayoutTemplateId } from "@/lib/layout-engine/types";
import type { CreativeDirectorResult } from "@/lib/design-process/creative-concept";
import type { ProductAnalysis } from "@/lib/product-analysis";
import type { VisualStoryDirectorResult } from "@/lib/agents/visual-story-director/types";
import {
  LAYOUT_SPEC_DEFAULTS,
  type BackgroundStyle,
  type HeroPosition,
  type LayoutSpec,
  type LightingStyle,
  type TextAreaSide,
} from "./types";

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function heroFromTemplate(id?: LayoutTemplateId): HeroPosition {
  if (!id) return "right";
  if (id.includes("left") || id === "magazine" || id === "editorial") return "left";
  if (id === "minimal" || id === "focus" || id === "floating") return "center";
  return "right";
}

function backgroundStyleFromCreative(creative?: CreativeDirectorResult): BackgroundStyle {
  const mood = creative?.creativeConcept.emotion?.toLowerCase() ?? "";
  if (/luxury|premium|editorial/.test(mood)) return "dark_premium";
  if (/home|cozy|lifestyle/.test(mood)) return "minimal_interior";
  if (/tech|sport/.test(mood)) return "soft_gradient";
  return "clean_studio";
}

export function buildInitialLayoutSpec(input: {
  creative?: CreativeDirectorResult;
  analysis: ProductAnalysis;
  genomeTemplateId?: LayoutTemplateId;
  storyDirection?: VisualStoryDirectorResult;
  palette?: string[];
}): LayoutSpec {
  const templateId = input.genomeTemplateId;
  const heroPosition = heroFromTemplate(templateId);
  const headlineArea: TextAreaSide =
    templateId === "magazine" || templateId === "editorial" ? "top" : "left";

  const palette = input.palette?.slice(0, 4) ?? LAYOUT_SPEC_DEFAULTS.palette;

  const premium = input.analysis.priceSegment === "premium";
  const whitespaceTarget = premium ? 32 : 28;

  return {
    ...LAYOUT_SPEC_DEFAULTS,
    heroPosition,
    heroScale: premium ? 0.7 : 0.66,
    headlineArea,
    benefitsArea: input.creative?.oneThought.deferredSpecs?.length ? "below_headline" : "left_panel",
    whitespaceTarget,
    maxIcons: 1,
    maxSecondaryObjects: 2,
    maxColors: 4,
    palette: palette.length >= 3 ? palette : LAYOUT_SPEC_DEFAULTS.palette,
    backgroundStyle: backgroundStyleFromCreative(input.creative),
    lightingStyle: premium ? "rim_dark" : "soft_key_top_left",
    visualWeightMap: {
      hero: 48,
      headline: 26,
      benefits: 12,
      cta: 8,
      background: 6,
    },
  };
}

export function layoutSpecFromComposition(
  layout: CompositionLayout,
  meaning: CardMeaning,
  palette?: string[],
): LayoutSpec {
  const m = layout.metrics;
  const secondary =
    (meaning.feature ? 1 : 0) + (meaning.badge ? 1 : 0) + (meaning.subtitle ? 1 : 0);

  const heroPosition: HeroPosition =
    layout.product.centerX < 42 ? "left" : layout.product.centerX > 58 ? "right" : "center";

  return {
    ...LAYOUT_SPEC_DEFAULTS,
    heroPosition,
    heroScale: clamp(m.productAreaPct / 100, 0.5, 0.8),
    headlineArea: layout.textSide === "right" ? "right" : "left",
    benefitsArea: layout.leftPanel.width > 0 ? "left_panel" : "none",
    ctaArea: meaning.badge ? "badge_under_title" : "none",
    whitespaceTarget: clamp(m.whitespacePct, 20, 35),
    maxIcons: 1,
    maxSecondaryObjects: clamp(secondary, 0, 3),
    maxColors: 4,
    palette: palette?.slice(0, 4) ?? LAYOUT_SPEC_DEFAULTS.palette,
    backgroundStyle: LAYOUT_SPEC_DEFAULTS.backgroundStyle,
    lightingStyle: LAYOUT_SPEC_DEFAULTS.lightingStyle,
    visualWeightMap: {
      hero: clamp(m.productAreaPct * 0.65, 30, 55),
      headline: clamp(m.textAreaPct * 1.2, 15, 35),
      benefits: clamp(m.plaqueAreaPct * 1.5, 5, 20),
      cta: meaning.badge ? 10 : 5,
      background: clamp(100 - m.productAreaPct - m.textAreaPct - m.plaqueAreaPct, 4, 25),
    },
  };
}
