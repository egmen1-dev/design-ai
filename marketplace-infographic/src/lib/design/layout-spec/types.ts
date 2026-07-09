/** Structured layout contract — compiled into prompts, not free-form prose */
import type {
  CompositionTemplateId,
  HierarchyLevel,
  LayoutGeometry,
  NormalizedVisualWeight,
} from "@/lib/design/composition-director/types";

export type { LayoutGeometry, NormalizedVisualWeight, CompositionTemplateId };

export type HierarchyMap = Record<
  "headline" | "hero" | "benefits" | "cta" | "decorative",
  HierarchyLevel
>;

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

export type PrimaryObjectPreference = "product" | string;

export type BackgroundPalettePreference =
  | "cool_neutral"
  | "green_neutral"
  | "light_neutral"
  | "medium_contrast";

export type ScenePreference =
  | "industrial_technical"
  | "outdoor_natural"
  | "light_modern"
  | "commercial_studio";

export type CommercialLayoutDiagnostics = {
  commercialLayoutApplied: boolean;
  commercialDecisionId: string;
  commercialMappings: Array<{
    source: string;
    target: string;
    from: unknown;
    to: unknown;
  }>;
  ignoredCommercialMappings: string[];
  layoutCommercialVersion: string;
};

export type LayoutSpec = {
  /** v16.7 — Composition Director template */
  compositionTemplateId?: CompositionTemplateId;
  /** v16.7 — deterministic geometry (0–1 normalized) */
  geometry?: LayoutGeometry;
  /** v16.7 — normalized weight ratios */
  visualWeight?: NormalizedVisualWeight;
  /** v16.7 — hierarchy levels for Prompt Builder */
  hierarchy?: HierarchyMap;
  heroPosition: HeroPosition;
  /** Target product area % (55–75) */
  heroScale: number;
  /** Explicit product area % mirror of heroScale when commercial intent is applied */
  productAreaPct?: number;
  /** Commercial Genome — dominant object preference */
  primaryObject?: PrimaryObjectPreference;
  /** Commercial Genome — max benefit/characteristic lines */
  maxCharacteristics?: number;
  /** Commercial Genome — headline typography strategy */
  typographyStrategy?: string;
  /** Commercial Genome — badge/icon ceiling */
  maxBadges?: number;
  /** Commercial Genome — background palette separation intent */
  backgroundPalettePreference?: BackgroundPalettePreference;
  /** Commercial Genome — scene/environment preference */
  scenePreference?: ScenePreference;
  /** Commercial Genome → Layout integration diagnostics (layout runtime owned) */
  commercialLayout?: CommercialLayoutDiagnostics;
  headlineArea: TextAreaSide;
  benefitsArea: BenefitsArea;
  ctaArea: CtaArea;
  /** Target whitespace % (20–35) */
  whitespaceTarget: number;
  maxIcons: number;
  /** Max secondary objects (decorations, extra plaques) */
  maxSecondaryObjects: number;
  maxDecorativeObjects?: number;
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
