/** Structured layout contract — compiled into prompts, not free-form prose */
export type HeroPosition = "left" | "right" | "center";
export type TextAreaSide = "left" | "right" | "top";
export type BenefitsArea = "left_panel" | "below_headline" | "none";
export type CtaArea = "badge_under_title" | "bottom_left" | "none";
export type BackgroundStyle =
  | "clean_studio"
  | "soft_gradient"
  | "minimal_interior"
  | "dark_premium";
export type LightingStyle = "soft_key_top_left" | "rim_dark" | "natural_warm";

export type VisualWeightMap = {
  hero: number;
  headline: number;
  benefits: number;
  cta: number;
  background: number;
};

export type LayoutSpec = {
  heroPosition: HeroPosition;
  /** Target product area % (55–75) */
  heroScale: number;
  headlineArea: TextAreaSide;
  benefitsArea: BenefitsArea;
  ctaArea: CtaArea;
  /** Target whitespace % (20–35) */
  whitespaceTarget: number;
  maxIcons: number;
  /** Max secondary objects (decorations, extra plaques) */
  maxSecondaryObjects: number;
  maxColors: number;
  palette: string[];
  backgroundStyle: BackgroundStyle;
  lightingStyle: LightingStyle;
  visualWeightMap: VisualWeightMap;
};

export type LayoutSpecPatch = Partial<LayoutSpec> & {
  /** Relative hero scale delta, e.g. 0.15 = +15% */
  heroScaleDelta?: number;
  /** Background darkness delta 0–1 */
  backgroundDarken?: number;
  /** Headline contrast boost 0–1 */
  headlineContrastBoost?: number;
  removeDecorations?: boolean;
  reduceObjectCount?: number;
};

export const LAYOUT_SPEC_DEFAULTS: LayoutSpec = {
  heroPosition: "right",
  heroScale: 0.68,
  headlineArea: "left",
  benefitsArea: "left_panel",
  ctaArea: "badge_under_title",
  whitespaceTarget: 28,
  maxIcons: 1,
  maxSecondaryObjects: 2,
  maxColors: 4,
  palette: ["#1a1a2e", "#f8fafc", "#f97316", "#64748b"],
  backgroundStyle: "clean_studio",
  lightingStyle: "soft_key_top_left",
  visualWeightMap: {
    hero: 45,
    headline: 25,
    benefits: 15,
    cta: 8,
    background: 7,
  },
};
