import type { InfographicData } from "@/lib/infographic-template";
import type { CompositionLayout } from "@/lib/composition/types";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import { zoneAreaPct } from "@/lib/composition/canvas";

export const DAOS_WIDE_TEMPLATE_MIN_ASPECT = 2.0;
export const DAOS_WIDE_TEMPLATE_HERO_HEIGHT_MIN_PCT = 38;
export const DAOS_WIDE_TEMPLATE_HERO_HEIGHT_MAX_PCT = 45;
export const DAOS_WIDE_TEMPLATE_TEXT_ZONE_MIN_PCT = 35;
export const DAOS_WIDE_TEMPLATE_TEXT_ZONE_MAX_PCT = 45;
export const DAOS_WIDE_TEMPLATE_WIDTH_MIN_PCT = 90;
export const DAOS_WIDE_TEMPLATE_WIDTH_MAX_PCT = 96;
export const DAOS_WIDE_TEMPLATE_CROP_SAFE_MAX_PCT = 6;
export const DAOS_WIDE_TEMPLATE_MAX_BADGES = 2;
export const DAOS_WIDE_TEMPLATE_OVERLAY_DENSITY_MIN = 0.1;
export const DAOS_WIDE_TEMPLATE_OVERLAY_DENSITY_MAX = 0.25;
export const DAOS_WIDE_TEMPLATE_MIN_HERO_TEXT_RATIO = 2;

export type WideProductTemplateStrategy = "standard" | "wide_bottom_hero_text_top";

export type WideProductTemplateZone = {
  topPct: number;
  heightPct: number;
  widthPct: number;
  leftPct: number;
};

export type WideProductTemplateCandidateInput = {
  productAspectRatio?: number;
  productCategory?: string;
  productHint?: string;
  compositionLayout?: CompositionLayout;
};

export type WideProductTemplateCandidate = {
  candidate: boolean;
  aspectRatio: number;
  reason: string;
};

export type WideProductTemplateInput = WideProductTemplateCandidateInput & {
  layoutSpec?: LayoutSpec;
  infographicData?: InfographicData;
  compositionLayout?: CompositionLayout;
};

export type WideProductTemplate = {
  enabled: boolean;
  applied: boolean;
  strategy: WideProductTemplateStrategy;
  reason: string;
  textZone: WideProductTemplateZone;
  heroZone: WideProductTemplateZone;
  maxBadges: number;
  targetHeroTextRatio: number;
  targetOverlayDensityMin: number;
  targetOverlayDensityMax: number;
  cropSafeHorizontalPct: number;
  actions: Array<{ code: string; message: string }>;
};

export type WideProductTemplateApplyResult = {
  template: WideProductTemplate;
  layoutSpec?: LayoutSpec;
  infographicData?: InfographicData;
  compositionLayout?: CompositionLayout;
  layoutMode?: string;
  heroZoneLabel?: string;
  textZoneLabel?: string;
};

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function cloneLayoutSpec(spec: LayoutSpec): LayoutSpec {
  return {
    ...spec,
    palette: [...spec.palette],
    visualWeightMap: { ...spec.visualWeightMap },
    hierarchy: spec.hierarchy ? { ...spec.hierarchy } : undefined,
    geometry: spec.geometry ? { ...spec.geometry } : undefined,
    visualWeight: spec.visualWeight ? { ...spec.visualWeight } : undefined,
  };
}

function cloneInfographicData(data: InfographicData): InfographicData {
  return {
    ...data,
    specBlocks: data.specBlocks.map((block) => ({ ...block })),
    callouts: data.callouts?.map((callout) => ({ ...callout })),
    mainBanner: data.mainBanner ? { ...data.mainBanner } : undefined,
    marketplaceSidebar: data.marketplaceSidebar?.map((item) => ({ ...item })),
  };
}

function cloneCompositionLayout(layout: CompositionLayout): CompositionLayout {
  return {
    ...layout,
    canvas: { ...layout.canvas },
    product: { ...layout.product },
    headline: { ...layout.headline },
    subtitle: { ...layout.subtitle },
    leftPanel: { ...layout.leftPanel },
    rightSidebar: { ...layout.rightSidebar },
    bullets: { ...layout.bullets },
    plaques: { ...layout.plaques },
    icon: { ...layout.icon },
    logo: layout.logo ? { ...layout.logo } : undefined,
    metrics: { ...layout.metrics },
    issues: [...layout.issues],
    adjustments: [...layout.adjustments],
    dna: layout.dna,
  };
}

export function isDaosWideProductTemplateEnabled(): boolean {
  return process.env.DAOS_WIDE_PRODUCT_TEMPLATE === "1";
}

const WIDE_PRODUCT_SIGNAL =
  /матрас|mattress|диван|sofa|кровать|bed|ковёр|ковер|carpet|стол|table|\b160x200\b|\b200x160\b/i;

function isWideProductSignal(input: WideProductTemplateCandidateInput): boolean {
  const hint = input.productHint ?? "";
  const category = input.productCategory ?? "";
  return WIDE_PRODUCT_SIGNAL.test(hint) || WIDE_PRODUCT_SIGNAL.test(category);
}

function resolveAspectRatio(input: WideProductTemplateCandidateInput): number {
  if (input.productAspectRatio != null && input.productAspectRatio > 0) {
    return input.productAspectRatio;
  }
  const product = input.compositionLayout?.product;
  if (product && product.maxHeightPct > 0) {
    return product.maxWidthPct / product.maxHeightPct;
  }
  if (isWideProductSignal(input)) return 2.6;
  return 1;
}

function resolveWidthTargetPct(aspectRatio: number): number {
  const t = clamp((aspectRatio - DAOS_WIDE_TEMPLATE_MIN_ASPECT) / 1.0, 0, 1);
  return (
    DAOS_WIDE_TEMPLATE_WIDTH_MIN_PCT +
    t * (DAOS_WIDE_TEMPLATE_WIDTH_MAX_PCT - DAOS_WIDE_TEMPLATE_WIDTH_MIN_PCT)
  );
}

function resolveHeroHeightPct(aspectRatio: number): number {
  const t = clamp((aspectRatio - DAOS_WIDE_TEMPLATE_MIN_ASPECT) / 1.0, 0, 1);
  return (
    DAOS_WIDE_TEMPLATE_HERO_HEIGHT_MIN_PCT +
    t * (DAOS_WIDE_TEMPLATE_HERO_HEIGHT_MAX_PCT - DAOS_WIDE_TEMPLATE_HERO_HEIGHT_MIN_PCT)
  );
}

function resolveTextZoneHeightPct(): number {
  return (DAOS_WIDE_TEMPLATE_TEXT_ZONE_MIN_PCT + DAOS_WIDE_TEMPLATE_TEXT_ZONE_MAX_PCT) / 2;
}

function formatZone(zone: WideProductTemplateZone): string {
  return `top:${zone.topPct.toFixed(1)}%;h:${zone.heightPct.toFixed(1)}%;w:${zone.widthPct.toFixed(1)}%;l:${zone.leftPct.toFixed(1)}%`;
}

/** Detect whether wide product template should apply. */
export function detectWideProductTemplateCandidate(
  input: WideProductTemplateCandidateInput,
): WideProductTemplateCandidate {
  const aspectRatio = resolveAspectRatio(input);
  const wideSignal = isWideProductSignal(input);

  if (aspectRatio < DAOS_WIDE_TEMPLATE_MIN_ASPECT && !wideSignal) {
    return { candidate: false, aspectRatio, reason: "aspect_below_wide_threshold" };
  }

  if (aspectRatio >= DAOS_WIDE_TEMPLATE_MIN_ASPECT || wideSignal) {
    return {
      candidate: true,
      aspectRatio,
      reason: wideSignal ? "wide_product_category_signal" : `wide_aspect_${aspectRatio.toFixed(2)}`,
    };
  }

  return { candidate: false, aspectRatio, reason: "no_wide_template_signal" };
}

/** Build wide product template plan (zones + targets). */
export function createWideProductTemplate(input: WideProductTemplateInput): WideProductTemplate {
  const enabled = isDaosWideProductTemplateEnabled();
  const detection = detectWideProductTemplateCandidate(input);
  const aspectRatio = detection.aspectRatio;
  const widthTargetPct = resolveWidthTargetPct(aspectRatio);
  const heroHeightPct = resolveHeroHeightPct(aspectRatio);
  const textZoneHeightPct = resolveTextZoneHeightPct();
  const cropSafeHorizontalPct = DAOS_WIDE_TEMPLATE_CROP_SAFE_MAX_PCT;
  const bleedLeftPct = cropSafeHorizontalPct / 2;
  const heroLeftPct = clamp((100 - widthTargetPct) / 2 - bleedLeftPct, 0, 5);
  const heroTopPct = clamp(100 - heroHeightPct - 4, 52, 62);

  const heroZone: WideProductTemplateZone = {
    topPct: heroTopPct,
    heightPct: heroHeightPct,
    widthPct: widthTargetPct,
    leftPct: heroLeftPct,
  };

  const textZone: WideProductTemplateZone = {
    topPct: 4,
    heightPct: textZoneHeightPct,
    widthPct: 92,
    leftPct: 4,
  };

  const base: WideProductTemplate = {
    enabled,
    applied: false,
    strategy: "standard",
    reason: enabled ? detection.reason : "wide_product_template_disabled",
    textZone,
    heroZone,
    maxBadges: DAOS_WIDE_TEMPLATE_MAX_BADGES,
    targetHeroTextRatio: DAOS_WIDE_TEMPLATE_MIN_HERO_TEXT_RATIO,
    targetOverlayDensityMin: DAOS_WIDE_TEMPLATE_OVERLAY_DENSITY_MIN,
    targetOverlayDensityMax: DAOS_WIDE_TEMPLATE_OVERLAY_DENSITY_MAX,
    cropSafeHorizontalPct,
    actions: [],
  };

  if (!enabled || !detection.candidate || !input.compositionLayout) {
    return base;
  }

  return {
    ...base,
    strategy: "wide_bottom_hero_text_top",
    actions: [
      { code: "WIDE_BOTTOM_HERO", message: "Product hero band at bottom (90–96% width)" },
      { code: "TEXT_TOP_ZONE", message: "Headline/benefits confined to top zone" },
      { code: "CAP_BADGES", message: `Limit badges to ${DAOS_WIDE_TEMPLATE_MAX_BADGES}` },
      { code: "SOLID_PLAQUES", message: "Solid contrast plaques only" },
      { code: "NO_TEXT_OVER_PRODUCT", message: "No text overlapping product band" },
      { code: "HERO_TEXT_RATIO", message: `Target hero/text ratio >= ${DAOS_WIDE_TEMPLATE_MIN_HERO_TEXT_RATIO}` },
    ],
  };
}

function applyInfographicPatch(data: InfographicData, maxBadges: number): void {
  if (data.callouts && data.callouts.length > maxBadges) {
    data.callouts = data.callouts.slice(0, maxBadges);
  }
  if (data.specBlocks.length > maxBadges) {
    data.specBlocks = data.specBlocks.slice(0, maxBadges);
  }
  if (data.marketplaceSidebar && data.marketplaceSidebar.length > maxBadges) {
    data.marketplaceSidebar = data.marketplaceSidebar.slice(0, maxBadges);
  }
  data.marketplaceGift = undefined;
  data.marketplaceFooter = undefined;
  data.marketplaceBottom = undefined;
}

function applyLayoutSpecPatch(layoutSpec: LayoutSpec, template: WideProductTemplate): void {
  layoutSpec.headlineArea = "top";
  layoutSpec.heroPosition = "center";
  layoutSpec.benefitsArea = "below_headline";
  layoutSpec.ctaArea = layoutSpec.ctaArea === "none" ? "none" : "badge_under_title";
  layoutSpec.maxIcons = Math.min(layoutSpec.maxIcons, template.maxBadges);
  layoutSpec.maxSecondaryObjects = 0;
  layoutSpec.maxDecorativeObjects = 0;
  layoutSpec.backgroundStyle = "clean_studio";
  layoutSpec.whitespaceTarget = Math.min(layoutSpec.whitespaceTarget, 30);
  layoutSpec.heroScale = Math.max(layoutSpec.heroScale, 72);
  layoutSpec.visualWeightMap = {
    ...layoutSpec.visualWeightMap,
    hero: Math.max(layoutSpec.visualWeightMap.hero, 50),
    headline: Math.min(layoutSpec.visualWeightMap.headline, 20),
    benefits: Math.min(layoutSpec.visualWeightMap.benefits, 12),
    cta: Math.min(layoutSpec.visualWeightMap.cta, 8),
  };
  if (layoutSpec.hierarchy) {
    layoutSpec.hierarchy = {
      ...layoutSpec.hierarchy,
      headline: "primary",
      hero: "primary",
      benefits: "secondary",
      cta: "tertiary",
      decorative: "hidden",
    };
  }
  if (layoutSpec.geometry) {
    layoutSpec.geometry = {
      ...layoutSpec.geometry,
      hero: {
        x: template.heroZone.leftPct / 100,
        y: template.heroZone.topPct / 100,
        width: template.heroZone.widthPct / 100,
        height: template.heroZone.heightPct / 100,
      },
      headline: {
        x: template.textZone.leftPct / 100,
        y: template.textZone.topPct / 100,
        width: template.textZone.widthPct / 100,
        height: 0.1,
      },
      benefits: {
        x: template.textZone.leftPct / 100,
        y: (template.textZone.topPct + 12) / 100,
        width: 0.4,
        height: 0.18,
      },
    };
    layoutSpec.compositionTemplateId = "hero_bottom";
  }
}

function resolveOverlayMetrics(productAreaPct: number): { textAreaPct: number; plaqueAreaPct: number } {
  const maxTextForRatio = productAreaPct / DAOS_WIDE_TEMPLATE_MIN_HERO_TEXT_RATIO;
  const targetOverlayMid =
    (DAOS_WIDE_TEMPLATE_OVERLAY_DENSITY_MIN + DAOS_WIDE_TEMPLATE_OVERLAY_DENSITY_MAX) / 2;
  const textAreaPct = clamp(Math.min(maxTextForRatio, targetOverlayMid * 100 * 0.65), 8, 16);
  const plaqueAreaPct = clamp(targetOverlayMid * 100 - textAreaPct, 4, 10);
  return { textAreaPct, plaqueAreaPct };
}

function zonesOverlapVertically(
  textZone: WideProductTemplateZone,
  heroZone: WideProductTemplateZone,
): boolean {
  const textBottom = textZone.topPct + textZone.heightPct;
  return textBottom > heroZone.topPct;
}

function applyCompositionLayoutPatch(
  compositionLayout: CompositionLayout,
  template: WideProductTemplate,
): void {
  const hero = template.heroZone;
  const text = template.textZone;

  compositionLayout.product = {
    ...compositionLayout.product,
    left: hero.leftPct,
    top: hero.topPct,
    width: hero.widthPct,
    height: hero.heightPct,
    maxWidthPct: hero.widthPct,
    maxHeightPct: hero.heightPct,
    areaPct: zoneAreaPct(hero.widthPct, hero.heightPct),
    centerX: (hero.leftPct + hero.widthPct / 2) / 100,
    centerY: (hero.topPct + hero.heightPct / 2) / 100,
    rotationDeg: 0,
  };

  compositionLayout.headline = {
    ...compositionLayout.headline,
    left: text.leftPct,
    top: text.topPct,
    width: text.widthPct,
    height: 9,
  };

  compositionLayout.subtitle = {
    ...compositionLayout.subtitle,
    left: text.leftPct,
    top: text.topPct + 10,
    width: text.widthPct * 0.85,
    height: 5,
  };

  compositionLayout.leftPanel = {
    ...compositionLayout.leftPanel,
    left: text.leftPct,
    top: text.topPct + 16,
    width: 40,
    height: Math.min(20, text.heightPct - 16),
  };

  compositionLayout.rightSidebar = {
    ...compositionLayout.rightSidebar,
    left: 72,
    top: text.topPct + 16,
    width: 20,
    height: Math.min(16, text.heightPct - 16),
  };

  compositionLayout.bullets.maxCount = template.maxBadges;
  compositionLayout.plaques.maxTotalAreaPct = Math.min(compositionLayout.plaques.maxTotalAreaPct, 10);
  compositionLayout.textSide = "left";
  compositionLayout.safeInsetPct = Math.max(compositionLayout.safeInsetPct, 4);

  const productAreaPct = zoneAreaPct(hero.widthPct, hero.heightPct);
  const { textAreaPct, plaqueAreaPct } = resolveOverlayMetrics(productAreaPct);
  const whitespacePct = clamp(100 - productAreaPct - textAreaPct - plaqueAreaPct, 18, 38);

  compositionLayout.metrics = {
    ...compositionLayout.metrics,
    productAreaPct,
    textAreaPct,
    plaqueAreaPct,
    whitespacePct,
    overlapPct: 0,
    visualCenterX: compositionLayout.product.centerX,
    visualCenterY: compositionLayout.product.centerY,
  };

  compositionLayout.adjustments = [
    ...compositionLayout.adjustments,
    "daos_wide_product_template:bottom_hero_text_top",
  ];

  if (zonesOverlapVertically(text, hero)) {
    compositionLayout.issues = [
      ...compositionLayout.issues,
      "wide_template_text_hero_overlap_risk",
    ];
  }
}

/** Apply wide product template to layout inputs (clone-then-mutate). */
export function applyWideProductTemplate(
  input: WideProductTemplateInput,
): WideProductTemplateApplyResult {
  const plan = createWideProductTemplate(input);

  if (!plan.enabled || plan.strategy === "standard" || !input.compositionLayout) {
    return { template: { ...plan, applied: false } };
  }

  const infographicData = input.infographicData
    ? cloneInfographicData(input.infographicData)
    : undefined;
  const layoutSpec = input.layoutSpec ? cloneLayoutSpec(input.layoutSpec) : undefined;
  const compositionLayout = cloneCompositionLayout(input.compositionLayout);

  if (infographicData) {
    applyInfographicPatch(infographicData, plan.maxBadges);
  }
  if (layoutSpec) {
    applyLayoutSpecPatch(layoutSpec, plan);
  }
  applyCompositionLayoutPatch(compositionLayout, plan);

  const heroZoneLabel = formatZone(plan.heroZone);
  const textZoneLabel = formatZone(plan.textZone);

  return {
    template: {
      ...plan,
      applied: true,
      reason: `wide_template_${plan.strategy}`,
      actions: [...plan.actions],
    },
    layoutSpec,
    infographicData,
    compositionLayout,
    layoutMode: "wide_bottom_hero",
    heroZoneLabel,
    textZoneLabel,
  };
}

export function describeWideProductTemplateZones(template: WideProductTemplate): {
  textZone: string;
  heroZone: string;
} {
  return {
    textZone: formatZone(template.textZone),
    heroZone: formatZone(template.heroZone),
  };
}
