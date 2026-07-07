import type { InfographicData } from "@/lib/infographic-template";
import type { CompositionLayout } from "@/lib/composition/types";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { OverlayQualityAudit } from "../audit/overlay-quality-audit";
import type { OverlayQualityAuditInput } from "../audit/overlay-quality-audit";
import { analyzeOverlayQuality } from "../audit/overlay-quality-audit";
import {
  applyGeometryPatch,
  computeWhitespaceRatio,
} from "@/lib/design/composition-director/geometry";

export const DAOS_GEOMETRY_WHITESPACE_TRIGGER = 0.35;
export const DAOS_GEOMETRY_PRODUCT_AREA_MIN = 0.45;
export const DAOS_GEOMETRY_LOW_OVERLAY_DENSITY = 0.15;
export const DAOS_GEOMETRY_WHITESPACE_TARGET = 0.28;

export type GeometryWhitespacePatchAction = {
  code: string;
  message: string;
};

export type GeometryWhitespacePatchInput = {
  layoutSpec?: LayoutSpec;
  infographicData?: InfographicData;
  compositionLayout?: CompositionLayout;
  overlayAudit?: OverlayQualityAudit;
  auditInput?: OverlayQualityAuditInput;
  law003WhitespaceViolation?: boolean;
  whitespace?: number;
  productAreaRatio?: number;
  overlayDensity?: number;
};

export type GeometryWhitespacePatch = {
  enabled: boolean;
  applied: boolean;
  actions: GeometryWhitespacePatchAction[];
  whitespaceBefore: number;
  whitespaceAfterEstimate: number;
};

export type GeometryWhitespacePatchResult = {
  patch: GeometryWhitespacePatch;
  layoutSpec?: LayoutSpec;
  infographicData?: InfographicData;
  compositionLayout?: CompositionLayout;
};

function cloneLayoutSpec(spec: LayoutSpec): LayoutSpec {
  return {
    ...spec,
    palette: [...spec.palette],
    visualWeightMap: { ...spec.visualWeightMap },
    hierarchy: spec.hierarchy ? { ...spec.hierarchy } : undefined,
    geometry: spec.geometry
      ? {
          ...spec.geometry,
          canvas: { ...spec.geometry.canvas },
          grid: { ...spec.geometry.grid },
          hero: { ...spec.geometry.hero },
          headline: { ...spec.geometry.headline },
          benefits: { ...spec.geometry.benefits },
          cta: { ...spec.geometry.cta },
        }
      : undefined,
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

function resolveWhitespace(input: GeometryWhitespacePatchInput): number {
  if (typeof input.whitespace === "number") return input.whitespace;
  const metrics = input.compositionLayout?.metrics.whitespacePct;
  if (typeof metrics === "number") return metrics / 100;
  if (input.layoutSpec?.geometry) {
    return computeWhitespaceRatio(input.layoutSpec.geometry);
  }
  const audit =
    input.overlayAudit ??
    (input.auditInput ? analyzeOverlayQuality(input.auditInput) : undefined);
  if (audit?.whitespaceRisk != null) {
    return clamp(audit.whitespaceRisk, 0, 1);
  }
  return 0;
}

function resolveProductAreaRatio(input: GeometryWhitespacePatchInput): number | undefined {
  if (typeof input.productAreaRatio === "number") return input.productAreaRatio;
  const areaPct = input.compositionLayout?.metrics.productAreaPct;
  if (typeof areaPct === "number") return areaPct / 100;
  return undefined;
}

function resolveOverlayDensity(input: GeometryWhitespacePatchInput): number {
  if (typeof input.overlayDensity === "number") return input.overlayDensity;
  const audit =
    input.overlayAudit ??
    (input.auditInput ? analyzeOverlayQuality(input.auditInput) : undefined);
  if (audit) return audit.estimatedOverlayDensity;
  const metrics = input.compositionLayout?.metrics;
  if (!metrics) return 0;
  return clamp(
    metrics.textAreaPct / 100 + metrics.plaqueAreaPct / 100 + (metrics.overlapPct / 100) * 0.5,
    0,
    1,
  );
}

function resolveLaw003(input: GeometryWhitespacePatchInput): boolean {
  if (input.law003WhitespaceViolation != null) return input.law003WhitespaceViolation;
  const audit =
    input.overlayAudit ??
    (input.auditInput ? analyzeOverlayQuality(input.auditInput) : undefined);
  return audit?.law003WhitespaceViolation ?? false;
}

function estimateWhitespaceAfter(
  compositionLayout: CompositionLayout | undefined,
  layoutSpec: LayoutSpec | undefined,
  before: number,
): number {
  if (layoutSpec?.geometry) {
    return computeWhitespaceRatio(layoutSpec.geometry);
  }
  if (compositionLayout?.metrics) {
    const productGain = (compositionLayout.metrics.productAreaPct - 40) / 400;
    const textReduction = (22 - compositionLayout.metrics.textAreaPct) / 500;
    return clamp(before - productGain - textReduction, DAOS_GEOMETRY_WHITESPACE_TARGET, before);
  }
  return clamp(before * 0.82, DAOS_GEOMETRY_WHITESPACE_TARGET, before);
}

export function isDaosGeometryWhitespacePatchEnabled(): boolean {
  return process.env.DAOS_GEOMETRY_WHITESPACE_PATCH === "1";
}

/** Build deterministic geometry whitespace patch plan. */
export function createGeometryWhitespacePatch(
  input: GeometryWhitespacePatchInput,
): GeometryWhitespacePatch {
  const whitespaceBefore = resolveWhitespace(input);
  const law003 = resolveLaw003(input);
  const productAreaRatio = resolveProductAreaRatio(input);
  const overlayDensity = resolveOverlayDensity(input);
  const trigger = law003 || whitespaceBefore > DAOS_GEOMETRY_WHITESPACE_TRIGGER;

  const actions: GeometryWhitespacePatchAction[] = [];

  if (!trigger) {
    return {
      enabled: isDaosGeometryWhitespacePatchEnabled(),
      applied: false,
      actions,
      whitespaceBefore,
      whitespaceAfterEstimate: whitespaceBefore,
    };
  }

  actions.push({
    code: "ENLARGE_HERO_TARGET",
    message: "Increase hero/product visual area target to reduce empty canvas",
  });
  actions.push({
    code: "SHIFT_OVERLAY_SAFE_ZONES",
    message: "Move overlay blocks into safe zones away from product overlap",
  });
  actions.push({
    code: "REDUCE_TEXT_COLUMN_WIDTH",
    message: "Narrow text column width to reclaim whitespace for hero",
  });
  actions.push({
    code: "LIMIT_EMPTY_BACKGROUND",
    message: "Tighten empty background zones and safe insets",
  });

  if (productAreaRatio != null && productAreaRatio < DAOS_GEOMETRY_PRODUCT_AREA_MIN) {
    actions.push({
      code: "ENLARGE_PRODUCT_TARGET",
      message: `Product area ratio ${productAreaRatio.toFixed(2)} below ${DAOS_GEOMETRY_PRODUCT_AREA_MIN}`,
    });
  }

  if (overlayDensity < DAOS_GEOMETRY_LOW_OVERLAY_DENSITY && whitespaceBefore > DAOS_GEOMETRY_WHITESPACE_TRIGGER) {
    actions.push({
      code: "LAYOUT_GEOMETRY_DIAGNOSIS",
      message:
        "Low overlay density with high whitespace — root cause is layout geometry, not text overlay",
    });
  }

  let whitespaceAfterEstimate = whitespaceBefore;
  if (productAreaRatio != null && productAreaRatio < DAOS_GEOMETRY_PRODUCT_AREA_MIN) {
    whitespaceAfterEstimate -= 0.08;
  }
  whitespaceAfterEstimate -= 0.06;
  if (overlayDensity < DAOS_GEOMETRY_LOW_OVERLAY_DENSITY) {
    whitespaceAfterEstimate -= 0.04;
  }
  whitespaceAfterEstimate = clamp(
    whitespaceAfterEstimate,
    DAOS_GEOMETRY_WHITESPACE_TARGET,
    whitespaceBefore,
  );

  return {
    enabled: isDaosGeometryWhitespacePatchEnabled(),
    applied: false,
    actions,
    whitespaceBefore,
    whitespaceAfterEstimate,
  };
}

function applyHeroEnlargement(
  layoutSpec: LayoutSpec | undefined,
  compositionLayout: CompositionLayout | undefined,
  productAreaRatio: number | undefined,
  actions: GeometryWhitespacePatchAction[],
): void {
  if (layoutSpec) {
    const heroBoost = productAreaRatio != null && productAreaRatio < DAOS_GEOMETRY_PRODUCT_AREA_MIN ? 8 : 5;
    layoutSpec.heroScale = Math.min(75, layoutSpec.heroScale + heroBoost);
    layoutSpec.whitespaceTarget = Math.min(layoutSpec.whitespaceTarget, 28);
    layoutSpec.visualWeightMap = {
      ...layoutSpec.visualWeightMap,
      hero: Math.min(72, layoutSpec.visualWeightMap.hero + 10),
      background: Math.max(2, layoutSpec.visualWeightMap.background - 4),
    };

    if (layoutSpec.geometry) {
      layoutSpec.geometry = applyGeometryPatch(layoutSpec.geometry, {
        hero: {
          width: Math.min(0.58, layoutSpec.geometry.hero.width * 1.12),
          height: Math.min(0.62, layoutSpec.geometry.hero.height * 1.1),
        },
        whitespaceRatio: DAOS_GEOMETRY_WHITESPACE_TARGET,
      });
    }
  }

  if (compositionLayout) {
    const scale = productAreaRatio != null && productAreaRatio < DAOS_GEOMETRY_PRODUCT_AREA_MIN ? 1.14 : 1.08;
    const canvasW = compositionLayout.canvas.width;
    const canvasH = compositionLayout.canvas.height;

    compositionLayout.product.width = Math.min(canvasW * 0.58, compositionLayout.product.width * scale);
    compositionLayout.product.height = Math.min(
      canvasH * 0.62,
      compositionLayout.product.height * scale,
    );
    compositionLayout.product.maxWidthPct = Math.min(58, compositionLayout.product.maxWidthPct + 6);
    compositionLayout.product.maxHeightPct = Math.min(62, compositionLayout.product.maxHeightPct + 5);
    compositionLayout.product.areaPct = Math.min(72, compositionLayout.product.areaPct + 8);

    if (compositionLayout.textSide === "left") {
      compositionLayout.product.left = Math.max(
        compositionLayout.product.left,
        canvasW * 0.48,
      );
    }

    compositionLayout.metrics = {
      ...compositionLayout.metrics,
      productAreaPct: Math.min(72, compositionLayout.metrics.productAreaPct + 8),
    };
    compositionLayout.adjustments = [
      ...compositionLayout.adjustments,
      "daos_geometry_patch:hero_enlarge",
    ];
  }

  if (productAreaRatio != null && productAreaRatio < DAOS_GEOMETRY_PRODUCT_AREA_MIN) {
    actions.push({
      code: "APPLY_PRODUCT_SCALE_BOOST",
      message: `Scaled product placement toward ${DAOS_GEOMETRY_PRODUCT_AREA_MIN} area ratio`,
    });
  }
}

function applySafeZoneShift(
  layoutSpec: LayoutSpec | undefined,
  compositionLayout: CompositionLayout | undefined,
): void {
  if (layoutSpec?.geometry) {
    const textSide = layoutSpec.headlineArea === "right" ? "right" : "left";
    const headlineX = textSide === "left" ? 0.06 : 0.54;
    layoutSpec.geometry = applyGeometryPatch(layoutSpec.geometry, {
      headline: {
        x: headlineX,
        y: Math.max(0.06, layoutSpec.geometry.headline.y),
      },
      benefits: {
        x: headlineX,
        y: layoutSpec.geometry.benefits.y,
      },
      cta: {
        x: headlineX,
        y: Math.min(0.86, layoutSpec.geometry.cta.y),
      },
    });
  }

  if (!compositionLayout) return;

  const inset = Math.min(0.1, compositionLayout.safeInsetPct + 0.03);
  compositionLayout.safeInsetPct = inset;
  const canvasW = compositionLayout.canvas.width;

  if (compositionLayout.textSide === "left") {
    compositionLayout.headline.left = Math.max(canvasW * inset, compositionLayout.headline.left);
    compositionLayout.subtitle.left = compositionLayout.headline.left;
    compositionLayout.bullets.left = compositionLayout.headline.left;
    compositionLayout.leftPanel.top = Math.max(
      compositionLayout.headline.top + compositionLayout.headline.height + 12,
      compositionLayout.leftPanel.top,
    );
  } else {
    compositionLayout.headline.left = Math.min(
      canvasW * 0.54,
      compositionLayout.headline.left + canvasW * 0.02,
    );
  }

  compositionLayout.rightSidebar.left = Math.min(
    canvasW * 0.88,
    compositionLayout.rightSidebar.left + canvasW * 0.02,
  );
  compositionLayout.adjustments = [
    ...compositionLayout.adjustments,
    "daos_geometry_patch:safe_zones",
  ];
}

function applyTextColumnReduction(
  layoutSpec: LayoutSpec | undefined,
  compositionLayout: CompositionLayout | undefined,
): void {
  if (layoutSpec?.geometry) {
    layoutSpec.geometry = applyGeometryPatch(layoutSpec.geometry, {
      headline: {
        width: Math.max(0.22, layoutSpec.geometry.headline.width * 0.88),
      },
      benefits: {
        width: Math.max(0.2, layoutSpec.geometry.benefits.width * 0.85),
        height: Math.max(0.08, layoutSpec.geometry.benefits.height * 0.9),
      },
    });
  }

  if (!compositionLayout) return;

  const canvasW = compositionLayout.canvas.width;
  const maxTextWidth = canvasW * 0.36;
  compositionLayout.headline.width = Math.min(compositionLayout.headline.width, maxTextWidth);
  compositionLayout.subtitle.width = Math.min(compositionLayout.subtitle.width, maxTextWidth * 0.95);
  compositionLayout.leftPanel.width = Math.min(compositionLayout.leftPanel.width, maxTextWidth);
  compositionLayout.bullets.width = Math.min(compositionLayout.bullets.width, maxTextWidth * 0.95);
  compositionLayout.metrics = {
    ...compositionLayout.metrics,
    textAreaPct: Math.max(6, compositionLayout.metrics.textAreaPct * 0.88),
  };
  compositionLayout.adjustments = [
    ...compositionLayout.adjustments,
    "daos_geometry_patch:text_column",
  ];
}

function applyEmptyBackgroundLimit(
  layoutSpec: LayoutSpec | undefined,
  compositionLayout: CompositionLayout | undefined,
): void {
  if (layoutSpec) {
    layoutSpec.maxDecorativeObjects = 0;
    layoutSpec.benefitsArea =
      layoutSpec.benefitsArea === "none" ? "none" : "below_headline";
  }

  if (!compositionLayout) return;

  compositionLayout.metrics = {
    ...compositionLayout.metrics,
    whitespacePct: Math.max(
      DAOS_GEOMETRY_WHITESPACE_TARGET * 100,
      compositionLayout.metrics.whitespacePct - 6,
    ),
    minEdgeInsetPct: Math.max(compositionLayout.metrics.minEdgeInsetPct, 5),
  };
  compositionLayout.plaques.maxTotalAreaPct = Math.min(
    compositionLayout.plaques.maxTotalAreaPct,
    10,
  );
  compositionLayout.adjustments = [
    ...compositionLayout.adjustments,
    "daos_geometry_patch:limit_empty_bg",
  ];
}

/** Clone layout inputs and apply geometry whitespace patch without mutating originals. */
export function applyGeometryWhitespacePatch(
  input: GeometryWhitespacePatchInput,
): GeometryWhitespacePatchResult {
  const plan = createGeometryWhitespacePatch(input);

  if (!isDaosGeometryWhitespacePatchEnabled() || !plan.actions.length) {
    return {
      patch: {
        ...plan,
        enabled: isDaosGeometryWhitespacePatchEnabled(),
        applied: false,
      },
    };
  }

  const appliedActions = [...plan.actions];
  const layoutSpec = input.layoutSpec ? cloneLayoutSpec(input.layoutSpec) : undefined;
  const infographicData = input.infographicData
    ? cloneInfographicData(input.infographicData)
    : undefined;
  const compositionLayout = input.compositionLayout
    ? cloneCompositionLayout(input.compositionLayout)
    : undefined;

  const productAreaRatio = resolveProductAreaRatio(input);

  applyHeroEnlargement(layoutSpec, compositionLayout, productAreaRatio, appliedActions);
  applySafeZoneShift(layoutSpec, compositionLayout);
  applyTextColumnReduction(layoutSpec, compositionLayout);
  applyEmptyBackgroundLimit(layoutSpec, compositionLayout);

  const whitespaceAfterEstimate = estimateWhitespaceAfter(
    compositionLayout,
    layoutSpec,
    plan.whitespaceBefore,
  );

  return {
    patch: {
      ...plan,
      enabled: true,
      applied: true,
      actions: appliedActions,
      whitespaceAfterEstimate,
    },
    layoutSpec,
    infographicData,
    compositionLayout,
  };
}
