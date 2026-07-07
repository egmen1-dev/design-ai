import type { InfographicData } from "@/lib/infographic-template";
import type { CompositionLayout } from "@/lib/composition/types";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import { zoneAreaPct } from "@/lib/composition/canvas";

export const DAOS_WIDE_LAYOUT_MIN_ASPECT = 2.0;
export const DAOS_WIDE_LAYOUT_HERO_HEIGHT_MIN_PCT = 38;
export const DAOS_WIDE_LAYOUT_HERO_HEIGHT_MAX_PCT = 45;
export const DAOS_WIDE_LAYOUT_TEXT_ZONE_MIN_PCT = 35;
export const DAOS_WIDE_LAYOUT_TEXT_ZONE_MAX_PCT = 45;
export const DAOS_WIDE_LAYOUT_WIDTH_MIN_PCT = 85;
export const DAOS_WIDE_LAYOUT_WIDTH_MAX_PCT = 96;
export const DAOS_WIDE_LAYOUT_CROP_SAFE_MAX_PCT = 6;
export const DAOS_WIDE_LAYOUT_MAX_BADGES = 2;

export type WideProductLayoutStrategy = "standard" | "wide_bottom_hero_text_top";

export type WideProductLayoutZone = {
  topPct: number;
  heightPct: number;
  widthPct: number;
  leftPct: number;
};

export type WideProductLayoutPatchAction = {
  code: string;
  message: string;
};

export type WideProductLayoutCandidateInput = {
  productAspectRatio?: number;
  productCategory?: string;
  productHint?: string;
  compositionLayout?: CompositionLayout;
};

export type WideProductLayoutCandidate = {
  candidate: boolean;
  aspectRatio: number;
  reason: string;
};

export type WideProductLayoutPatchInput = WideProductLayoutCandidateInput & {
  layoutSpec?: LayoutSpec;
  infographicData?: InfographicData;
  compositionLayout?: CompositionLayout;
};

export type WideProductLayoutPatch = {
  enabled: boolean;
  applied: boolean;
  strategy: WideProductLayoutStrategy;
  reason: string;
  textZone: WideProductLayoutZone;
  heroZone: WideProductLayoutZone;
  maxBadges: number;
  cropSafeHorizontalPct: number;
  actions: WideProductLayoutPatchAction[];
};

export type WideProductLayoutPatchResult = {
  patch: WideProductLayoutPatch;
  layoutSpec?: LayoutSpec;
  infographicData?: InfographicData;
  compositionLayout?: CompositionLayout;
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

export function isDaosWideProductLayoutEnabled(): boolean {
  return process.env.DAOS_WIDE_PRODUCT_LAYOUT === "1";
}

function isMattressSignal(input: WideProductLayoutCandidateInput): boolean {
  const hint = input.productHint?.toLowerCase() ?? "";
  const category = input.productCategory?.toLowerCase() ?? "";
  return /матрас|mattress|\b160x200\b|\b200x160\b/.test(hint) || category === "mattress";
}

function resolveAspectRatio(input: WideProductLayoutCandidateInput): number {
  if (input.productAspectRatio != null && input.productAspectRatio > 0) {
    return input.productAspectRatio;
  }
  const product = input.compositionLayout?.product;
  if (product && product.maxHeightPct > 0) {
    return product.maxWidthPct / product.maxHeightPct;
  }
  if (isMattressSignal(input)) return 2.6;
  return 1;
}

function resolveWidthTargetPct(aspectRatio: number): number {
  const t = clamp((aspectRatio - DAOS_WIDE_LAYOUT_MIN_ASPECT) / 1.0, 0, 1);
  return DAOS_WIDE_LAYOUT_WIDTH_MIN_PCT + t * (DAOS_WIDE_LAYOUT_WIDTH_MAX_PCT - DAOS_WIDE_LAYOUT_WIDTH_MIN_PCT);
}

function resolveHeroHeightPct(aspectRatio: number): number {
  const t = clamp((aspectRatio - DAOS_WIDE_LAYOUT_MIN_ASPECT) / 1.0, 0, 1);
  return (
    DAOS_WIDE_LAYOUT_HERO_HEIGHT_MIN_PCT +
    t * (DAOS_WIDE_LAYOUT_HERO_HEIGHT_MAX_PCT - DAOS_WIDE_LAYOUT_HERO_HEIGHT_MIN_PCT)
  );
}

function resolveTextZoneHeightPct(): number {
  return (DAOS_WIDE_LAYOUT_TEXT_ZONE_MIN_PCT + DAOS_WIDE_LAYOUT_TEXT_ZONE_MAX_PCT) / 2;
}

function formatZone(zone: WideProductLayoutZone): string {
  return `top:${zone.topPct.toFixed(1)}%;h:${zone.heightPct.toFixed(1)}%;w:${zone.widthPct.toFixed(1)}%;l:${zone.leftPct.toFixed(1)}%`;
}

/** Detect whether wide product bottom-hero layout should apply. */
export function detectWideProductLayoutCandidate(
  input: WideProductLayoutCandidateInput,
): WideProductLayoutCandidate {
  const aspectRatio = resolveAspectRatio(input);
  const mattress = isMattressSignal(input);

  if (aspectRatio < DAOS_WIDE_LAYOUT_MIN_ASPECT && !mattress) {
    return { candidate: false, aspectRatio, reason: "aspect_below_wide_threshold" };
  }

  if (aspectRatio >= DAOS_WIDE_LAYOUT_MIN_ASPECT || mattress) {
    return {
      candidate: true,
      aspectRatio,
      reason: mattress ? "mattress_wide_layout" : `wide_aspect_${aspectRatio.toFixed(2)}`,
    };
  }

  return { candidate: false, aspectRatio, reason: "no_wide_layout_signal" };
}

/** Build wide product layout patch plan. */
export function createWideProductLayoutPatch(
  input: WideProductLayoutPatchInput,
): WideProductLayoutPatch {
  const enabled = isDaosWideProductLayoutEnabled();
  const detection = detectWideProductLayoutCandidate(input);
  const aspectRatio = detection.aspectRatio;
  const widthTargetPct = resolveWidthTargetPct(aspectRatio);
  const heroHeightPct = resolveHeroHeightPct(aspectRatio);
  const textZoneHeightPct = resolveTextZoneHeightPct();
  const cropSafeHorizontalPct = DAOS_WIDE_LAYOUT_CROP_SAFE_MAX_PCT;
  const bleedLeftPct = cropSafeHorizontalPct / 2;
  const heroLeftPct = clamp((100 - widthTargetPct) / 2 - bleedLeftPct, 0, 8);
  const heroTopPct = clamp(100 - heroHeightPct - 4, 52, 62);

  const heroZone: WideProductLayoutZone = {
    topPct: heroTopPct,
    heightPct: heroHeightPct,
    widthPct: widthTargetPct,
    leftPct: heroLeftPct,
  };

  const textZone: WideProductLayoutZone = {
    topPct: 4,
    heightPct: textZoneHeightPct,
    widthPct: 92,
    leftPct: 4,
  };

  const base: WideProductLayoutPatch = {
    enabled,
    applied: false,
    strategy: "standard",
    reason: enabled ? detection.reason : "wide_product_layout_disabled",
    textZone,
    heroZone,
    maxBadges: DAOS_WIDE_LAYOUT_MAX_BADGES,
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
      { code: "WIDE_BOTTOM_HERO", message: "Move product hero to bottom band" },
      { code: "TEXT_TOP_ZONE", message: "Confine headline/benefits to top zone" },
      { code: "CAP_BADGES", message: `Limit badges to ${DAOS_WIDE_LAYOUT_MAX_BADGES}` },
      { code: "SIMPLE_PLAQUES", message: "Use simple contrast plaques, not glass" },
      { code: "NO_CENTER_OVERLAY", message: "Remove center overlays over product band" },
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

function applyLayoutSpecPatch(layoutSpec: LayoutSpec, patch: WideProductLayoutPatch): void {
  layoutSpec.headlineArea = "top";
  layoutSpec.heroPosition = "center";
  layoutSpec.benefitsArea = "below_headline";
  layoutSpec.ctaArea = layoutSpec.ctaArea === "none" ? "none" : "badge_under_title";
  layoutSpec.maxIcons = Math.min(layoutSpec.maxIcons, patch.maxBadges);
  layoutSpec.maxSecondaryObjects = 0;
  layoutSpec.maxDecorativeObjects = 0;
  layoutSpec.backgroundStyle = "clean_studio";
  layoutSpec.whitespaceTarget = Math.min(layoutSpec.whitespaceTarget, 30);
  layoutSpec.heroScale = Math.max(layoutSpec.heroScale, 72);
  layoutSpec.visualWeightMap = {
    ...layoutSpec.visualWeightMap,
    hero: Math.max(layoutSpec.visualWeightMap.hero, 50),
    headline: Math.min(layoutSpec.visualWeightMap.headline, 22),
    benefits: Math.min(layoutSpec.visualWeightMap.benefits, 14),
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
        x: patch.heroZone.leftPct / 100,
        y: patch.heroZone.topPct / 100,
        width: patch.heroZone.widthPct / 100,
        height: patch.heroZone.heightPct / 100,
      },
      headline: {
        x: patch.textZone.leftPct / 100,
        y: patch.textZone.topPct / 100,
        width: patch.textZone.widthPct / 100,
        height: 0.12,
      },
      benefits: {
        x: patch.textZone.leftPct / 100,
        y: (patch.textZone.topPct + 14) / 100,
        width: 0.42,
        height: 0.22,
      },
    };
    layoutSpec.compositionTemplateId = "hero_bottom";
  }
}

function applyCompositionLayoutPatch(
  compositionLayout: CompositionLayout,
  patch: WideProductLayoutPatch,
): void {
  const hero = patch.heroZone;
  const text = patch.textZone;

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
    height: 10,
  };

  compositionLayout.subtitle = {
    ...compositionLayout.subtitle,
    left: text.leftPct,
    top: text.topPct + 11,
    width: text.widthPct * 0.85,
    height: 6,
  };

  compositionLayout.leftPanel = {
    ...compositionLayout.leftPanel,
    left: text.leftPct,
    top: text.topPct + 18,
    width: 42,
    height: Math.min(22, text.heightPct - 18),
  };

  compositionLayout.rightSidebar = {
    ...compositionLayout.rightSidebar,
    left: 72,
    top: text.topPct + 18,
    width: 22,
    height: Math.min(18, text.heightPct - 18),
  };

  compositionLayout.bullets.maxCount = patch.maxBadges;
  compositionLayout.plaques.maxTotalAreaPct = Math.min(compositionLayout.plaques.maxTotalAreaPct, 10);
  compositionLayout.textSide = "left";
  compositionLayout.safeInsetPct = Math.max(compositionLayout.safeInsetPct, 4);

  const productAreaPct = zoneAreaPct(hero.widthPct, hero.heightPct);
  const textAreaPct = zoneAreaPct(text.widthPct, Math.min(text.heightPct, 38));
  const plaqueAreaPct = Math.min(compositionLayout.metrics.plaqueAreaPct, 8);
  const whitespacePct = clamp(100 - productAreaPct - textAreaPct - plaqueAreaPct, 18, 40);

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
    "daos_wide_product_layout:bottom_hero_text_top",
  ];
}

/** Clone overlay inputs and apply wide product layout patch. */
export function applyWideProductLayoutPatch(
  input: WideProductLayoutPatchInput,
): WideProductLayoutPatchResult {
  const plan = createWideProductLayoutPatch(input);

  if (!plan.enabled || plan.strategy === "standard" || !input.compositionLayout) {
    return { patch: { ...plan, applied: false } };
  }

  const appliedActions = [...plan.actions];
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

  return {
    patch: {
      ...plan,
      applied: true,
      actions: appliedActions,
      reason: `wide_layout_${plan.strategy}`,
    },
    layoutSpec,
    infographicData,
    compositionLayout,
  };
}

export function describeWideProductLayoutZones(patch: WideProductLayoutPatch): {
  textZone: string;
  heroZone: string;
} {
  return {
    textZone: formatZone(patch.textZone),
    heroZone: formatZone(patch.heroZone),
  };
}
