import type { InfographicData } from "@/lib/infographic-template";
import type { CompositionLayout } from "@/lib/composition/types";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import { applyLayoutSpecPatch } from "@/lib/design/layout-spec/patches";
import type { OverlayQualityAudit } from "../audit/overlay-quality-audit";
import { analyzeOverlayQuality, type OverlayQualityAuditInput } from "../audit/overlay-quality-audit";
import type { NormalizedCompositePlacement } from "../compositor/composite-result-bridge";
import type {
  SceneGraphProductActual,
  OverlaySceneGraphDiagnostics,
} from "@/lib/scene-graph/product-actual-bridge";
import {
  isDaosSceneGraphOverlayUsesActual,
  resolveOverlayProductBbox,
  moveTextZonesAwayFromProductBbox,
  countTextZoneOverlapsWithProduct,
} from "@/lib/scene-graph/product-actual-bridge";

export const DAOS_CONTRAST_OVERLAP_PNG_RISK_TRIGGER = 0.75;
export const DAOS_CONTRAST_OVERLAP_MAX_ACCENT_PLAQUES = 2;
export const DAOS_CONTRAST_MIN_HERO_TEXT_RATIO = 2;
export const DAOS_CONTRAST_MAX_OVERLAP_PCT = 2;
export const DAOS_CONTRAST_HEADLINE_BOOST = 0.22;
export const DAOS_CONTRAST_BACKGROUND_DARKEN = 0.1;
export const DAOS_CONTRAST_SAFE_TEXT_WIDTH_PCT = 0.38;

export type ContrastOverlapPatchAction = {
  code: string;
  message: string;
};

export type ContrastOverlapPatchInput = {
  layoutSpec?: LayoutSpec;
  infographicData?: InfographicData;
  compositionLayout?: CompositionLayout;
  overlayAudit?: OverlayQualityAudit;
  auditInput?: OverlayQualityAuditInput;
  law014ContrastViolation?: boolean;
  overlayDensity?: number;
  pngOverlayFeelRisk?: number;
  compositePlacement?: NormalizedCompositePlacement;
  sceneGraphProductActual?: SceneGraphProductActual;
  overlayDiagnostics?: OverlaySceneGraphDiagnostics;
};

export type ContrastOverlapPatch = {
  enabled: boolean;
  applied: boolean;
  actions: ContrastOverlapPatchAction[];
  contrastOverlapBefore: number;
  contrastOverlapAfterEstimate: number;
  elementsBefore: number;
  elementsAfter: number;
  overlayDensityBefore: number;
  overlayDensityAfterEstimate: number;
  overlayUsedSceneGraphActual?: boolean;
  overlayProductActualSource?: string;
  overlayProductActualAreaRatio?: number;
  overlayAvoidedActualProductOverlap?: boolean;
};

export type ContrastOverlapPatchResult = {
  patch: ContrastOverlapPatch;
  layoutSpec?: LayoutSpec;
  infographicData?: InfographicData;
  compositionLayout?: CompositionLayout;
};

type ProductBbox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

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

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function countTemplateElements(data?: InfographicData, layoutSpec?: LayoutSpec): number {
  let count = 0;
  if (data?.headline?.trim()) count += 1;
  if (data?.mainBanner?.title?.trim()) count += 1;
  count += data?.specBlocks?.length ?? 0;
  count += data?.callouts?.length ?? 0;
  count += data?.marketplaceSidebar?.length ?? 0;
  if (data?.marketplaceGift?.trim()) count += 1;
  if (data?.marketplaceFooter?.trim()) count += 1;
  if (data?.marketplaceBottom?.trim()) count += 1;
  if (layoutSpec) {
    if (layoutSpec.benefitsArea !== "none") count += 1;
    if (layoutSpec.ctaArea !== "none") count += 1;
    count += Math.min(layoutSpec.maxIcons ?? 0, 3);
    count += Math.min(layoutSpec.maxSecondaryObjects ?? 0, 2);
  }
  return count;
}

function estimateOverlayDensity(compositionLayout?: CompositionLayout): number {
  const metrics = compositionLayout?.metrics;
  if (!metrics) return 0;
  return clamp(
    (metrics.textAreaPct ?? 0) / 100 +
      (metrics.plaqueAreaPct ?? 0) / 100 +
      ((metrics.overlapPct ?? 0) / 100) * 0.5,
    0,
    1,
  );
}

function resolveSignals(input: ContrastOverlapPatchInput): {
  law014: boolean;
  density: number;
  pngRisk: number;
} {
  const audit =
    input.overlayAudit ??
    (input.auditInput ? analyzeOverlayQuality(input.auditInput) : undefined);

  return {
    law014: input.law014ContrastViolation ?? audit?.law014ContrastViolation ?? false,
    density: input.overlayDensity ?? audit?.estimatedOverlayDensity ?? estimateOverlayDensity(input.compositionLayout),
    pngRisk: input.pngOverlayFeelRisk ?? audit?.pngOverlayFeelRisk ?? 0,
  };
}

function resolveProductBbox(
  input: ContrastOverlapPatchInput,
): ProductBbox | undefined {
  const canvas = input.compositionLayout?.canvas;
  return resolveOverlayProductBbox({
    canvas,
    sceneGraphProductActual: input.sceneGraphProductActual,
    compositePlacement: input.compositePlacement,
    compositionLayout: input.compositionLayout,
    preferSceneGraphActual: isDaosSceneGraphOverlayUsesActual(),
  });
}

function estimateContrastOverlapScore(metrics?: CompositionLayout["metrics"]): number {
  if (!metrics) return 0.5;
  const ratio = metrics.productAreaPct / Math.max(metrics.textAreaPct, 1);
  const ratioPenalty = ratio < DAOS_CONTRAST_MIN_HERO_TEXT_RATIO ? (DAOS_CONTRAST_MIN_HERO_TEXT_RATIO - ratio) * 0.25 : 0;
  const overlapPenalty = Math.max(0, metrics.overlapPct - DAOS_CONTRAST_MAX_OVERLAP_PCT) * 0.08;
  return clamp(ratioPenalty + overlapPenalty + (metrics.overlapPct > 0 ? metrics.overlapPct * 0.02 : 0), 0, 1);
}

function zonesOverlap(
  a: { left: number; top: number; width: number; height: number },
  b: ProductBbox,
): boolean {
  return !(
    a.left + a.width <= b.left ||
    b.left + b.width <= a.left ||
    a.top + a.height <= b.top ||
    b.top + b.height <= a.top
  );
}

export function isDaosContrastOverlapPatchEnabled(): boolean {
  return process.env.DAOS_CONTRAST_OVERLAP_PATCH === "1";
}

/** Build deterministic contrast/overlap patch plan from governance and placement signals. */
export function createContrastOverlapPatch(input: ContrastOverlapPatchInput): ContrastOverlapPatch {
  const signals = resolveSignals(input);
  const actions: ContrastOverlapPatchAction[] = [];
  const elementsBefore = countTemplateElements(input.infographicData, input.layoutSpec);
  const overlayDensityBefore = estimateOverlayDensity(input.compositionLayout);
  const contrastOverlapBefore = estimateContrastOverlapScore(input.compositionLayout?.metrics);
  const productBbox = resolveProductBbox(input);
  const pngTrigger = signals.pngRisk > DAOS_CONTRAST_OVERLAP_PNG_RISK_TRIGGER;

  if (signals.law014) {
    actions.push({
      code: "MOVE_TEXT_FROM_PRODUCT",
      message: "Shift headline and text blocks away from factual product bbox",
    });
    actions.push({
      code: "STRENGTHEN_READABLE_PLAQUE",
      message: "Increase readable plaque contrast for headline blocks",
    });
    actions.push({
      code: "REDUCE_DECORATIVE_OVERLAYS",
      message: "Hide decorative overlays that compete with product readability",
    });
    actions.push({
      code: "FORCE_HIGH_CONTRAST_TOKEN",
      message: "Apply high-contrast headline token and background darken",
    });

    if (!productBbox) {
      actions.push({
        code: "CONSERVATIVE_TEXT_SAFE_ZONE",
        message: "Product bbox unknown — apply conservative text-safe inset",
      });
    }
  }

  if (pngTrigger) {
    actions.push({
      code: "SIMPLE_SOLID_PLAQUES",
      message: "Use simple solid/semi-solid plaques instead of glass or shadows",
    });
    actions.push({
      code: "CAP_ACCENT_PLAQUES",
      message: `Limit accent plaques to ${DAOS_CONTRAST_OVERLAP_MAX_ACCENT_PLAQUES}`,
    });
    actions.push({
      code: "SUPPRESS_GLASS_SHADOWS",
      message: "Suppress glass overlays and decorative shadows",
    });
  }

  let contrastOverlapAfterEstimate = contrastOverlapBefore;
  if (signals.law014) {
    contrastOverlapAfterEstimate = Math.max(0, contrastOverlapBefore * 0.45);
    if (productBbox) contrastOverlapAfterEstimate *= 0.75;
  }
  if (pngTrigger) {
    contrastOverlapAfterEstimate = Math.max(0, contrastOverlapAfterEstimate * 0.9);
  }

  let overlayDensityAfterEstimate = overlayDensityBefore;
  if (signals.law014 || pngTrigger) {
    overlayDensityAfterEstimate = Math.min(overlayDensityBefore, signals.density);
    if (pngTrigger) {
      overlayDensityAfterEstimate = Math.min(overlayDensityAfterEstimate, overlayDensityBefore * 0.92);
    }
  }

  let elementsAfter = elementsBefore;
  if (pngTrigger && elementsBefore > DAOS_CONTRAST_OVERLAP_MAX_ACCENT_PLAQUES + 2) {
    elementsAfter = Math.max(
      elementsBefore - (elementsBefore - (DAOS_CONTRAST_OVERLAP_MAX_ACCENT_PLAQUES + 2)),
      DAOS_CONTRAST_OVERLAP_MAX_ACCENT_PLAQUES + 1,
    );
  }

  return {
    enabled: isDaosContrastOverlapPatchEnabled(),
    applied: false,
    actions,
    contrastOverlapBefore,
    contrastOverlapAfterEstimate,
    elementsBefore,
    elementsAfter,
    overlayDensityBefore,
    overlayDensityAfterEstimate,
  };
}

function moveTextAwayFromProduct(
  compositionLayout: CompositionLayout,
  productBbox: ProductBbox | undefined,
  actions: ContrastOverlapPatchAction[],
): void {
  const canvas = compositionLayout.canvas;
  const safeWidth = canvas.width * DAOS_CONTRAST_SAFE_TEXT_WIDTH_PCT;

  if (!productBbox) {
    compositionLayout.safeInsetPct = Math.max(compositionLayout.safeInsetPct, 0.1);
    compositionLayout.leftPanel.width = Math.min(compositionLayout.leftPanel.width, safeWidth);
    compositionLayout.headline.width = Math.min(compositionLayout.headline.width, safeWidth * 0.92);
    compositionLayout.subtitle.width = Math.min(compositionLayout.subtitle.width, safeWidth * 0.88);
    compositionLayout.bullets.width = Math.min(compositionLayout.bullets.width, safeWidth * 0.9);
    actions.push({
      code: "APPLY_TEXT_SAFE_ZONE",
      message: `Conservative text-safe zone width ${(DAOS_CONTRAST_SAFE_TEXT_WIDTH_PCT * 100).toFixed(0)}%`,
    });
    return;
  }

  const textZones = [
    compositionLayout.headline,
    compositionLayout.subtitle,
    compositionLayout.leftPanel,
    compositionLayout.bullets,
  ];

  for (const zone of textZones) {
    if (!zonesOverlap(zone, productBbox)) continue;

    if (compositionLayout.textSide === "left") {
      const maxRight = productBbox.left - canvas.width * 0.03;
      if (zone.left + zone.width > maxRight) {
        zone.width = Math.max(canvas.width * 0.18, maxRight - zone.left);
      }
      zone.left = Math.max(canvas.width * 0.04, zone.left - canvas.width * 0.02);
    } else {
      zone.left = Math.min(
        canvas.width * 0.56,
        Math.max(zone.left, productBbox.left + productBbox.width + canvas.width * 0.03),
      );
    }

    actions.push({
      code: "SHIFT_TEXT_ZONE",
      message: "Moved overlapping text zone away from product bbox",
    });
  }
}

function strengthenReadablePlaque(
  layoutSpec: LayoutSpec | undefined,
  compositionLayout: CompositionLayout,
  actions: ContrastOverlapPatchAction[],
): void {
  if (layoutSpec) {
    layoutSpec.hierarchy = {
      headline: "primary",
      hero: "primary",
      benefits: "secondary",
      cta: "secondary",
      decorative: "hidden",
    };
    layoutSpec.ctaArea = layoutSpec.ctaArea === "none" ? "none" : "badge_under_title";
  }

  compositionLayout.plaques.maxTotalAreaPct = Math.max(
    compositionLayout.plaques.maxTotalAreaPct,
    10,
  );
  compositionLayout.metrics = {
    ...compositionLayout.metrics,
    plaqueAreaPct: Math.min(
      compositionLayout.metrics.plaqueAreaPct + 1.5,
      compositionLayout.metrics.textAreaPct * 0.45,
    ),
  };

  actions.push({
    code: "READABLE_PLAQUE_OPACITY",
    message: "Strengthened readable plaque area for headline contrast",
  });
}

function reduceDecorativeOverlays(
  data: InfographicData,
  layoutSpec: LayoutSpec | undefined,
  compositionLayout: CompositionLayout,
  actions: ContrastOverlapPatchAction[],
): void {
  data.marketplaceGift = undefined;
  data.marketplaceFooter = undefined;
  data.marketplaceBottom = undefined;

  if (layoutSpec) {
    layoutSpec.maxDecorativeObjects = 0;
    layoutSpec.maxSecondaryObjects = Math.min(layoutSpec.maxSecondaryObjects, 1);
    if (layoutSpec.hierarchy) {
      layoutSpec.hierarchy.decorative = "hidden";
      layoutSpec.hierarchy.cta = "secondary";
    }
  }

  compositionLayout.metrics = {
    ...compositionLayout.metrics,
    overlapPct: Math.max(0, compositionLayout.metrics.overlapPct - 2.5),
    textAreaPct: compositionLayout.metrics.textAreaPct * 0.96,
  };

  actions.push({
    code: "TRIM_DECORATIVE_OVERLAYS",
    message: "Removed decorative marketplace overlays and reduced overlap estimate",
  });
}

function applyHighContrastToken(
  layoutSpec: LayoutSpec | undefined,
  actions: ContrastOverlapPatchAction[],
): LayoutSpec | undefined {
  if (!layoutSpec) return undefined;

  const patched = applyLayoutSpecPatch(layoutSpec, {
    headlineContrastBoost: DAOS_CONTRAST_HEADLINE_BOOST,
    backgroundDarken: DAOS_CONTRAST_BACKGROUND_DARKEN,
    removeDecorations: true,
  });

  actions.push({
    code: "APPLY_HIGH_CONTRAST_TOKEN",
    message: `Headline contrast boost ${DAOS_CONTRAST_HEADLINE_BOOST} with background darken`,
  });

  return patched;
}

function applySimplePlaqueMode(
  data: InfographicData,
  layoutSpec: LayoutSpec | undefined,
  compositionLayout: CompositionLayout,
  actions: ContrastOverlapPatchAction[],
  law014: boolean,
): void {
  const maxPlaques = DAOS_CONTRAST_OVERLAP_MAX_ACCENT_PLAQUES;

  if (data.callouts && data.callouts.length > maxPlaques) {
    data.callouts = data.callouts.slice(0, maxPlaques);
    actions.push({
      code: "TRIM_ACCENT_PLAQUES",
      message: `Trimmed accent plaques to ${maxPlaques}`,
    });
  }

  if (law014 && data.specBlocks.length > maxPlaques) {
    data.specBlocks = data.specBlocks.slice(0, maxPlaques);
  }

  if (layoutSpec) {
    layoutSpec.maxIcons = Math.min(layoutSpec.maxIcons, maxPlaques);
    layoutSpec.maxSecondaryObjects = 0;
    layoutSpec.maxDecorativeObjects = 0;
    if (layoutSpec.backgroundStyle === "soft_gradient") {
      layoutSpec.backgroundStyle = "clean_studio";
    }
  }

  if (law014) {
    compositionLayout.plaques.maxTotalAreaPct = Math.min(
      compositionLayout.plaques.maxTotalAreaPct,
      10,
    );
    compositionLayout.metrics = {
      ...compositionLayout.metrics,
      plaqueAreaPct: Math.max(5, compositionLayout.metrics.plaqueAreaPct * 0.92),
    };
  }

  compositionLayout.adjustments = [
    ...compositionLayout.adjustments,
    "daos_contrast_overlap_patch:simple_plaques",
  ];
}

function preserveWhitespace(compositionLayout: CompositionLayout): void {
  const before = compositionLayout.metrics.whitespacePct;
  compositionLayout.metrics = {
    ...compositionLayout.metrics,
    whitespacePct: Math.max(before, compositionLayout.metrics.whitespacePct),
  };
}

/** Clone overlay inputs and apply contrast/overlap patch without mutating originals. */
export function applyContrastOverlapPatch(
  input: ContrastOverlapPatchInput,
): ContrastOverlapPatchResult {
  const plan = createContrastOverlapPatch(input);

  if (!isDaosContrastOverlapPatchEnabled() || !plan.actions.length) {
    return { patch: { ...plan, enabled: isDaosContrastOverlapPatchEnabled(), applied: false } };
  }

  const signals = resolveSignals(input);
  const productBbox = resolveProductBbox(input);
  const appliedActions = [...plan.actions];
  const overlapsBefore =
    input.sceneGraphProductActual && input.compositionLayout && productBbox
      ? countTextZoneOverlapsWithProduct(input.compositionLayout, productBbox)
      : 0;

  const infographicData = input.infographicData
    ? cloneInfographicData(input.infographicData)
    : undefined;
  let layoutSpec = input.layoutSpec ? cloneLayoutSpec(input.layoutSpec) : undefined;
  const compositionLayout = input.compositionLayout
    ? cloneCompositionLayout(input.compositionLayout)
    : undefined;

  if (signals.law014 && compositionLayout) {
    moveTextAwayFromProduct(compositionLayout, productBbox, appliedActions);
    if (infographicData) {
      reduceDecorativeOverlays(infographicData, layoutSpec, compositionLayout, appliedActions);
    }
    strengthenReadablePlaque(layoutSpec, compositionLayout, appliedActions);
    layoutSpec = applyHighContrastToken(layoutSpec, appliedActions) ?? layoutSpec;

    const ratio =
      compositionLayout.metrics.productAreaPct / Math.max(compositionLayout.metrics.textAreaPct, 1);
    if (ratio < DAOS_CONTRAST_MIN_HERO_TEXT_RATIO) {
      compositionLayout.metrics = {
        ...compositionLayout.metrics,
        textAreaPct: Math.max(
          6,
          compositionLayout.metrics.productAreaPct / DAOS_CONTRAST_MIN_HERO_TEXT_RATIO,
        ),
      };
    }

    compositionLayout.metrics = {
      ...compositionLayout.metrics,
      overlapPct: Math.max(0, compositionLayout.metrics.overlapPct - 3),
    };
    compositionLayout.adjustments = [
      ...compositionLayout.adjustments,
      "daos_contrast_overlap_patch:law014",
    ];
  }

  if (signals.pngRisk > DAOS_CONTRAST_OVERLAP_PNG_RISK_TRIGGER && infographicData && compositionLayout) {
    applySimplePlaqueMode(
      infographicData,
      layoutSpec,
      compositionLayout,
      appliedActions,
      signals.law014,
    );
  }

  if (compositionLayout) {
    preserveWhitespace(compositionLayout);
  }

  const elementsAfter = countTemplateElements(infographicData, layoutSpec);
  const overlayDensityAfterEstimate = estimateOverlayDensity(compositionLayout);
  const contrastOverlapAfterEstimate = estimateContrastOverlapScore(compositionLayout?.metrics);

  const overlapsAfter =
    input.sceneGraphProductActual && compositionLayout && productBbox
      ? countTextZoneOverlapsWithProduct(compositionLayout, productBbox)
      : overlapsBefore;
  const avoidedOverlap =
    isDaosSceneGraphOverlayUsesActual() &&
    Boolean(input.sceneGraphProductActual) &&
    overlapsBefore > 0 &&
    overlapsAfter < overlapsBefore;

  const overlayDiag = input.overlayDiagnostics;
  const usedActual = isDaosSceneGraphOverlayUsesActual() && Boolean(input.sceneGraphProductActual);

  return {
    patch: {
      ...plan,
      enabled: true,
      applied: true,
      actions: appliedActions,
      elementsAfter,
      overlayDensityAfterEstimate: Math.min(plan.overlayDensityBefore, overlayDensityAfterEstimate),
      contrastOverlapAfterEstimate,
      overlayUsedSceneGraphActual: usedActual,
      overlayProductActualSource: usedActual
        ? input.sceneGraphProductActual?.source
        : overlayDiag?.overlayProductActualSource,
      overlayProductActualAreaRatio: usedActual
        ? input.sceneGraphProductActual?.areaRatio
        : overlayDiag?.overlayProductActualAreaRatio,
      overlayAvoidedActualProductOverlap: usedActual
        ? avoidedOverlap || (overlapsBefore > 0 && overlapsAfter === 0)
        : overlayDiag?.overlayAvoidedActualProductOverlap,
    },
    infographicData,
    layoutSpec,
    compositionLayout,
  };
}
