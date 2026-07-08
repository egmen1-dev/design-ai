import type { InfographicData } from "@/lib/infographic-template";
import type { CompositionLayout } from "@/lib/composition/types";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { OverlayQualityAudit } from "../audit/overlay-quality-audit";
import type { ComposerOverlayElement } from "../audit/composer-quality-audit";
import { analyzeOverlayQuality, type OverlayQualityAuditInput } from "../audit/overlay-quality-audit";
import type {
  SceneGraphProductActual,
  OverlaySceneGraphDiagnostics,
  OverlaySceneGraphGateContext,
} from "@/lib/scene-graph/product-actual-bridge";
import {
  resolveOverlayActualGateDecision,
  resolveOverlayProductBbox,
  moveTextZonesAwayFromProductBbox,
  countTextZoneOverlapsWithProduct,
} from "@/lib/scene-graph/product-actual-bridge";

export const DAOS_OVERLAY_PATCH_MAX_VISIBLE_BADGES = 2;
export const DAOS_OVERLAY_PATCH_MAX_ELEMENTS = 5;
export const DAOS_OVERLAY_PATCH_DENSITY_TRIGGER = 0.35;
export const DAOS_OVERLAY_PATCH_CONTRAST_TRIGGER = 0.5;
export const DAOS_OVERLAY_PATCH_PNG_RISK_TRIGGER = 0.75;

export type OverlayLayoutPatchAction = {
  code: string;
  message: string;
};

export type OverlayLayoutPatchInput = {
  layoutSpec?: LayoutSpec;
  infographicData?: InfographicData;
  compositionLayout?: CompositionLayout;
  overlayElements?: ComposerOverlayElement[] | "unknown";
  overlayAudit?: OverlayQualityAudit;
  auditInput?: OverlayQualityAuditInput;
  law003WhitespaceViolation?: boolean;
  law014ContrastViolation?: boolean;
  overlayDensity?: number;
  contrastRisk?: number;
  pngOverlayFeelRisk?: number;
  sceneGraphProductActual?: SceneGraphProductActual;
  overlayDiagnostics?: OverlaySceneGraphDiagnostics;
  overlayGateContext?: OverlaySceneGraphGateContext;
};

export type OverlayLayoutPatch = {
  enabled: boolean;
  applied: boolean;
  actions: OverlayLayoutPatchAction[];
  beforeDensity: number;
  afterDensity: number;
  elementsBefore: number;
  elementsAfter: number;
  suppressParametricBadge?: boolean;
  headlineContrastBoost?: number;
  overlayUsedSceneGraphActual?: boolean;
  overlayProductActualSource?: string;
  overlayProductActualAreaRatio?: number;
  overlayAvoidedActualProductOverlap?: boolean;
  overlayActualGateDecision?: "actual" | "planned";
  overlayActualGateReasons?: string[];
  overlayActualGateConfidence?: number;
};

export type OverlayLayoutPatchResult = {
  patch: OverlayLayoutPatch;
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

function estimateDensity(
  compositionLayout?: CompositionLayout,
  overlayAudit?: OverlayQualityAudit,
): number {
  if (overlayAudit) return overlayAudit.estimatedOverlayDensity;
  const metrics = compositionLayout?.metrics;
  if (!metrics) return 0;
  return Math.min(
    1,
    (metrics.textAreaPct ?? 0) / 100 +
      (metrics.plaqueAreaPct ?? 0) / 100 +
      ((metrics.overlapPct ?? 0) / 100) * 0.5,
  );
}

function shortenText(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function resolveSignals(input: OverlayLayoutPatchInput): {
  law003: boolean;
  law014: boolean;
  density: number;
  contrastRisk: number;
  pngRisk: number;
} {
  const audit =
    input.overlayAudit ??
    (input.auditInput ? analyzeOverlayQuality(input.auditInput) : undefined);

  return {
    law003: input.law003WhitespaceViolation ?? audit?.law003WhitespaceViolation ?? false,
    law014: input.law014ContrastViolation ?? audit?.law014ContrastViolation ?? false,
    density: input.overlayDensity ?? audit?.estimatedOverlayDensity ?? estimateDensity(input.compositionLayout),
    contrastRisk: input.contrastRisk ?? audit?.contrastRisk ?? 0,
    pngRisk: input.pngOverlayFeelRisk ?? audit?.pngOverlayFeelRisk ?? 0,
  };
}

export function isDaosOverlayPatchEnabled(): boolean {
  return process.env.DAOS_OVERLAY_PATCH === "1";
}

/** Build deterministic overlay patch plan from governance/audit signals. */
export function createOverlayLayoutPatch(input: OverlayLayoutPatchInput): OverlayLayoutPatch {
  const signals = resolveSignals(input);
  const actions: OverlayLayoutPatchAction[] = [];
  const elementsBefore = countTemplateElements(input.infographicData, input.layoutSpec);
  const beforeDensity = estimateDensity(input.compositionLayout, input.overlayAudit);

  const whitespaceTrigger =
    signals.law003 || signals.density > DAOS_OVERLAY_PATCH_DENSITY_TRIGGER;
  const contrastTrigger =
    signals.law014 || signals.contrastRisk > DAOS_OVERLAY_PATCH_CONTRAST_TRIGGER;
  const pngTrigger = signals.pngRisk > DAOS_OVERLAY_PATCH_PNG_RISK_TRIGGER;

  if (whitespaceTrigger) {
    actions.push({
      code: "REDUCE_OVERLAY_DENSITY",
      message: "Cap visible badges and overlay elements to improve whitespace",
    });
    actions.push({
      code: "HIDE_DECORATIVE_ELEMENTS",
      message: "Remove decorative callouts and secondary footer/gift blocks",
    });
    actions.push({
      code: "SHORTEN_SECONDARY_TEXT",
      message: "Shorten secondary banner and spec labels",
    });
  }

  if (contrastTrigger) {
    actions.push({
      code: "BOOST_READABLE_PLAQUE",
      message: "Increase readable plaque/background contrast for headline blocks",
    });
    actions.push({
      code: "INCREASE_TEXT_CONTRAST",
      message: "Apply headline contrast boost token",
    });
    actions.push({
      code: "SPREAD_SAFE_ZONES",
      message: "Increase safe inset and reduce text/product overlap zones",
    });
  }

  if (pngTrigger) {
    actions.push({
      code: "MINIMAL_OVERLAY_MODE",
      message: "Reduce plaque count and suppress glass/badge overlays",
    });
    actions.push({
      code: "REMOVE_EXTRA_SHADOWS",
      message: "Drop decorative secondary objects that amplify PNG-overlay feel",
    });
  }

  let elementsAfter = elementsBefore;
  if (whitespaceTrigger || pngTrigger) {
    elementsAfter = Math.min(elementsAfter, DAOS_OVERLAY_PATCH_MAX_ELEMENTS);
  }

  let afterDensity = beforeDensity;
  if (whitespaceTrigger) afterDensity *= 0.72;
  if (contrastTrigger) afterDensity *= 0.92;
  if (pngTrigger) afterDensity *= 0.8;
  afterDensity = Math.min(afterDensity, DAOS_OVERLAY_PATCH_DENSITY_TRIGGER);

  return {
    enabled: isDaosOverlayPatchEnabled(),
    applied: false,
    actions,
    beforeDensity,
    afterDensity,
    elementsBefore,
    elementsAfter,
    suppressParametricBadge: pngTrigger,
    headlineContrastBoost: contrastTrigger ? 0.18 : undefined,
  };
}

function applyWhitespacePatch(
  data: InfographicData,
  layoutSpec: LayoutSpec | undefined,
  compositionLayout: CompositionLayout | undefined,
  actions: OverlayLayoutPatchAction[],
): void {
  const maxBadges = DAOS_OVERLAY_PATCH_MAX_VISIBLE_BADGES;
  const maxElements = DAOS_OVERLAY_PATCH_MAX_ELEMENTS;

  if (data.callouts && data.callouts.length > maxBadges) {
    data.callouts = data.callouts.slice(0, maxBadges);
    actions.push({
      code: "TRIM_CALLOUTS",
      message: `Trimmed callouts to ${maxBadges}`,
    });
  }

  if (data.specBlocks.length > maxBadges) {
    data.specBlocks = data.specBlocks.slice(0, maxBadges);
    actions.push({
      code: "TRIM_SPEC_BLOCKS",
      message: `Kept top ${maxBadges} spec blocks`,
    });
  }

  if (data.marketplaceSidebar && data.marketplaceSidebar.length > maxBadges) {
    data.marketplaceSidebar = data.marketplaceSidebar.slice(0, maxBadges);
  }

  data.marketplaceGift = undefined;
  data.marketplaceFooter = undefined;
  data.marketplaceBottom = undefined;

  if (data.mainBanner?.description) {
    data.mainBanner.description = shortenText(data.mainBanner.description, 72);
  }

  for (const block of data.specBlocks) {
    block.label = shortenText(block.label, 36);
    if (block.hint) block.hint = shortenText(block.hint, 48);
  }

  if (layoutSpec) {
    layoutSpec.maxIcons = Math.min(layoutSpec.maxIcons, maxBadges);
    layoutSpec.maxSecondaryObjects = 0;
    layoutSpec.maxDecorativeObjects = 0;
    layoutSpec.whitespaceTarget = Math.min(layoutSpec.whitespaceTarget, 28);
    layoutSpec.visualWeightMap = {
      ...layoutSpec.visualWeightMap,
      benefits: Math.min(layoutSpec.visualWeightMap.benefits, 8),
      cta: Math.min(layoutSpec.visualWeightMap.cta, 6),
    };
  }

  if (compositionLayout) {
    compositionLayout.safeInsetPct = Math.min(0.12, compositionLayout.safeInsetPct + 0.02);
    compositionLayout.metrics = {
      ...compositionLayout.metrics,
      textAreaPct: Math.max(8, compositionLayout.metrics.textAreaPct * 0.82),
      plaqueAreaPct: Math.max(4, compositionLayout.metrics.plaqueAreaPct * 0.75),
      whitespacePct: Math.min(35, Math.max(compositionLayout.metrics.whitespacePct, 28)),
    };
    compositionLayout.bullets.maxCount = Math.min(compositionLayout.bullets.maxCount, maxBadges);
    compositionLayout.plaques.maxTotalAreaPct = Math.min(
      compositionLayout.plaques.maxTotalAreaPct,
      12,
    );
    compositionLayout.adjustments = [
      ...compositionLayout.adjustments,
      "daos_overlay_patch:whitespace",
    ];
  }

  const remaining = countTemplateElements(data, layoutSpec);
  if (remaining > maxElements) {
    actions.push({
      code: "CAP_OVERLAY_ELEMENTS",
      message: `Overlay elements capped from ${remaining} toward ${maxElements}`,
    });
  }
}

function applyContrastPatch(
  layoutSpec: LayoutSpec | undefined,
  compositionLayout: CompositionLayout | undefined,
  headlineContrastBoost: number | undefined,
  actions: OverlayLayoutPatchAction[],
  sceneGraphProductActual?: SceneGraphProductActual,
  overlayGateContext?: OverlaySceneGraphGateContext,
): boolean {
  let avoidedOverlap = false;

  if (compositionLayout && sceneGraphProductActual) {
    const gate = resolveOverlayActualGateDecision({
      sceneGraphProductActual,
      compositionLayout,
      gateContext: overlayGateContext,
    });
    if (gate.decision === "actual") {
      const productBbox = resolveOverlayProductBbox({
        canvas: compositionLayout.canvas,
        sceneGraphProductActual,
        compositionLayout,
        gateDecision: gate,
      });
      if (productBbox) {
        const overlapsBefore = countTextZoneOverlapsWithProduct(compositionLayout, productBbox);
        avoidedOverlap = moveTextZonesAwayFromProductBbox(compositionLayout, productBbox);
        if (avoidedOverlap || overlapsBefore > 0) {
          actions.push({
            code: "SCENE_GRAPH_ACTUAL_SAFE_ZONE",
            message: "Repositioned text zones using factual compositor product bbox",
          });
        }
        const factualAreaPct = sceneGraphProductActual.areaRatio * 100;
        compositionLayout.metrics = {
          ...compositionLayout.metrics,
          productAreaPct: factualAreaPct,
        };
      }
    }
  }

  if (layoutSpec?.hierarchy) {
    layoutSpec.hierarchy.headline = "primary";
    layoutSpec.hierarchy.hero = "primary";
    layoutSpec.hierarchy.benefits = "secondary";
    layoutSpec.hierarchy.decorative = "hidden";
  }

  if (compositionLayout) {
    const overlap = compositionLayout.metrics.overlapPct;
    compositionLayout.metrics = {
      ...compositionLayout.metrics,
      overlapPct: Math.max(0, overlap - 2),
      textAreaPct: compositionLayout.metrics.textAreaPct * 0.95,
    };

    if (compositionLayout.textSide === "left") {
      compositionLayout.headline.left = Math.max(0.04, compositionLayout.headline.left);
      compositionLayout.subtitle.left = Math.max(0.04, compositionLayout.subtitle.left);
    } else {
      compositionLayout.headline.left = Math.min(
        0.52,
        compositionLayout.headline.left + 0.02,
      );
    }

    compositionLayout.leftPanel.width = Math.min(
      compositionLayout.leftPanel.width,
      compositionLayout.canvas.width * 0.42,
    );
    compositionLayout.adjustments = [
      ...compositionLayout.adjustments,
      "daos_overlay_patch:contrast",
    ];
  }

  if (headlineContrastBoost != null) {
    actions.push({
      code: "APPLY_HEADLINE_CONTRAST_BOOST",
      message: `Headline contrast boost ${headlineContrastBoost.toFixed(2)}`,
    });
  }

  return avoidedOverlap;
}

function applyPngFeelPatch(
  data: InfographicData,
  layoutSpec: LayoutSpec | undefined,
  compositionLayout: CompositionLayout | undefined,
  actions: OverlayLayoutPatchAction[],
): void {
  if (data.callouts?.length) {
    data.callouts = data.callouts.slice(0, 1);
    actions.push({ code: "TRIM_PLAQUES", message: "Reduced callout plaques to 1" });
  }

  if (data.specBlocks.length > 2) {
    data.specBlocks = data.specBlocks.slice(0, 2);
  }

  if (layoutSpec) {
    layoutSpec.maxIcons = Math.min(layoutSpec.maxIcons, 1);
    layoutSpec.maxSecondaryObjects = 0;
    layoutSpec.maxDecorativeObjects = 0;
    layoutSpec.ctaArea = layoutSpec.ctaArea === "none" ? "none" : "badge_under_title";
  }

  if (compositionLayout) {
    compositionLayout.plaques.maxTotalAreaPct = Math.min(
      compositionLayout.plaques.maxTotalAreaPct,
      8,
    );
    compositionLayout.metrics = {
      ...compositionLayout.metrics,
      plaqueAreaPct: Math.max(4, compositionLayout.metrics.plaqueAreaPct * 0.65),
    };
    compositionLayout.adjustments = [
      ...compositionLayout.adjustments,
      "daos_overlay_patch:png_feel",
    ];
  }
}

/** Clone overlay inputs and apply patch plan without mutating originals. */
export function applyOverlayLayoutPatch(
  input: OverlayLayoutPatchInput,
): OverlayLayoutPatchResult {
  const plan = createOverlayLayoutPatch(input);

  if (!isDaosOverlayPatchEnabled() || !plan.actions.length) {
    return { patch: { ...plan, enabled: isDaosOverlayPatchEnabled(), applied: false } };
  }

  const appliedActions = [...plan.actions];
  const infographicData = input.infographicData
    ? cloneInfographicData(input.infographicData)
    : undefined;
  const layoutSpec = input.layoutSpec ? cloneLayoutSpec(input.layoutSpec) : undefined;
  const compositionLayout = input.compositionLayout
    ? cloneCompositionLayout(input.compositionLayout)
    : undefined;

  const signals = resolveSignals(input);

  if (signals.law003 || signals.density > DAOS_OVERLAY_PATCH_DENSITY_TRIGGER) {
    if (infographicData) {
      applyWhitespacePatch(infographicData, layoutSpec, compositionLayout, appliedActions);
    }
  }

  let avoidedActualOverlap = false;
  if (signals.law014 || signals.contrastRisk > DAOS_OVERLAY_PATCH_CONTRAST_TRIGGER) {
    avoidedActualOverlap = applyContrastPatch(
      layoutSpec,
      compositionLayout,
      plan.headlineContrastBoost,
      appliedActions,
      input.sceneGraphProductActual,
      input.overlayGateContext,
    );
  }

  if (signals.pngRisk > DAOS_OVERLAY_PATCH_PNG_RISK_TRIGGER) {
    if (infographicData) {
      applyPngFeelPatch(infographicData, layoutSpec, compositionLayout, appliedActions);
    }
  }

  const elementsAfter = countTemplateElements(infographicData, layoutSpec);
  let afterDensity = estimateDensity(compositionLayout, input.overlayAudit);
  if (compositionLayout?.metrics) {
    afterDensity = Math.min(
      1,
      compositionLayout.metrics.textAreaPct / 100 +
        compositionLayout.metrics.plaqueAreaPct / 100 +
        (compositionLayout.metrics.overlapPct / 100) * 0.5,
    );
  }

  const gate = resolveOverlayActualGateDecision({
    sceneGraphProductActual: input.sceneGraphProductActual,
    compositionLayout,
    gateContext: input.overlayGateContext,
  });
  const usedActual = gate.decision === "actual" && Boolean(input.sceneGraphProductActual);

  return {
    patch: {
      ...plan,
      enabled: true,
      applied: true,
      actions: appliedActions,
      elementsAfter,
      afterDensity,
      overlayUsedSceneGraphActual: usedActual,
      overlayProductActualSource: usedActual
        ? input.sceneGraphProductActual?.source
        : input.overlayDiagnostics?.overlayProductActualSource,
      overlayProductActualAreaRatio: usedActual
        ? input.sceneGraphProductActual?.areaRatio
        : input.overlayDiagnostics?.overlayProductActualAreaRatio,
      overlayAvoidedActualProductOverlap: usedActual
        ? avoidedActualOverlap
        : input.overlayDiagnostics?.overlayAvoidedActualProductOverlap,
      overlayActualGateDecision: gate.decision,
      overlayActualGateReasons: gate.reasons,
      overlayActualGateConfidence: gate.confidence,
    },
    infographicData,
    layoutSpec,
    compositionLayout,
  };
}
