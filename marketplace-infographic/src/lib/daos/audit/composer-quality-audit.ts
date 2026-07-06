import type { DAOSRenderDebugArtifact } from "../debug/render-debug-bridge";

export type ComposerOverlayElement = {
  kind: string;
  areaPct?: number;
};

export type ComposerQualityAuditInput = {
  finalImagePath?: string;
  productCutoutPath?: string | null;
  backgroundPath?: string | null;
  canvas?: { width: number; height: number };
  overlayElements?: ComposerOverlayElement[] | "unknown";
  renderDebug?: DAOSRenderDebugArtifact;
  debugBundle?: {
    specs?: {
      visualBlueprint?: {
        productPlacement?: string;
      };
    };
  };
  productAreaRatio?: number;
  productPlacement?: { left: number; top: number; width: number; height: number };
  plannedProductAreaRatio?: number;
  compositingHints?: {
    shadowType?: string;
    reflection?: boolean;
    lightDirection?: string;
  };
  sceneShadowProfile?: string;
  hasComposite?: boolean;
  qualityHasShadows?: boolean;
};

export type ComposerQualityWarning = {
  code: string;
  message: string;
};

export type ComposerQualityAudit = {
  productAreaRatio?: number;
  productPlacementRisk: number;
  backgroundContrastRisk: number;
  overlayDensityRisk: number;
  cutoutIntegrationRisk: number;
  shadowMissingRisk: number;
  finalCompositionRisk: number;
  warnings: ComposerQualityWarning[];
  recommendations: string[];
};

export type ComposerQualityAuditSummary = {
  score: number;
  productAreaRatio?: number;
  finalCompositionRisk: number;
  warningCodes: string[];
  notes: string[];
};

const PRODUCT_AREA_MIN = 0.35;
const PRODUCT_AREA_MAX = 0.75;
const EDGE_INSET_MIN_PCT = 0.04;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function asRecord(input: unknown): Record<string, unknown> {
  if (input && typeof input === "object" && !Array.isArray(input)) {
    return input as Record<string, unknown>;
  }
  return {};
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function asNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function parseProductAreaFromBlueprint(bundle?: ComposerQualityAuditInput["debugBundle"]): number | undefined {
  const visual = bundle?.specs?.visualBlueprint;
  const placement = visual?.productPlacement;
  if (!placement) return undefined;
  const match = placement.match(/productareapct[:=]\s*(\d+(?:\.\d+)?)/i);
  if (!match) return undefined;
  return Number(match[1]) / 100;
}

function resolveCanvas(input: ComposerQualityAuditInput): { width: number; height: number } | undefined {
  if (input.canvas?.width && input.canvas?.height) return input.canvas;
  const renderRequest = asRecord(input.renderDebug?.renderRequestSummary);
  const canvas = asRecord(renderRequest.canvas);
  const width = asNumber(canvas.width);
  const height = asNumber(canvas.height);
  if (width && height) return { width, height };
  return undefined;
}

function resolveProductAreaRatio(input: ComposerQualityAuditInput): number | undefined {
  if (typeof input.productAreaRatio === "number") {
    return clamp01(input.productAreaRatio);
  }

  const canvas = resolveCanvas(input);
  if (input.productPlacement && canvas) {
    const area = input.productPlacement.width * input.productPlacement.height;
    const canvasArea = canvas.width * canvas.height;
    if (canvasArea > 0) return clamp01(area / canvasArea);
  }

  if (typeof input.plannedProductAreaRatio === "number") {
    return clamp01(input.plannedProductAreaRatio);
  }

  const fromBlueprint = parseProductAreaFromBlueprint(input.debugBundle);
  if (typeof fromBlueprint === "number") return fromBlueprint;

  return undefined;
}

function hasShadowContactInfo(input: ComposerQualityAuditInput): boolean {
  if (input.qualityHasShadows === true) return true;
  if (input.hasComposite === true && input.compositingHints?.shadowType) return true;
  if (input.sceneShadowProfile && input.sceneShadowProfile !== "none") return true;
  return false;
}

function computeProductPlacementRisk(input: ComposerQualityAuditInput): number {
  const canvas = resolveCanvas(input);
  const hasBackground = Boolean(input.backgroundPath?.trim());
  const hasPlacement = Boolean(input.productPlacement);

  if (hasBackground && !hasPlacement && input.hasComposite !== true) {
    return 0.85;
  }

  if (!hasPlacement || !canvas) {
    return hasBackground ? 0.55 : 0.35;
  }

  const { left, top, width, height } = input.productPlacement!;
  const right = left + width;
  const bottom = top + height;
  const edgeInsetX = Math.min(left, canvas.width - right) / canvas.width;
  const edgeInsetY = Math.min(top, canvas.height - bottom) / canvas.height;
  const minInset = Math.min(edgeInsetX, edgeInsetY);

  let risk = 0.15;
  if (minInset < EDGE_INSET_MIN_PCT) risk += 0.35;
  if (left < 0 || top < 0 || right > canvas.width || bottom > canvas.height) risk += 0.25;

  if (
    typeof input.plannedProductAreaRatio === "number" &&
    typeof input.productAreaRatio === "number"
  ) {
    const drift = Math.abs(input.plannedProductAreaRatio - input.productAreaRatio);
    if (drift > 0.12) risk += 0.2;
  }

  return clamp01(risk);
}

function computeBackgroundContrastRisk(input: ComposerQualityAuditInput): number {
  let risk = 0.2;
  if (!input.backgroundPath?.trim()) risk += 0.35;
  if (input.renderDebug?.fallbackUsed === true) risk += 0.25;
  if (input.backgroundPath && input.hasComposite !== true) risk += 0.2;
  return clamp01(risk);
}

function computeOverlayDensityRisk(input: ComposerQualityAuditInput): number {
  if (input.overlayElements === "unknown" || input.overlayElements == null) return 0.55;

  const elements = input.overlayElements ?? [];
  if (!elements.length) return 0.15;

  const knownAreas = elements
    .map((element) => element.areaPct)
    .filter((value): value is number => typeof value === "number" && value >= 0);
  if (!knownAreas.length) return 0.4;

  const totalAreaPct = knownAreas.reduce((sum, value) => sum + value, 0);
  if (totalAreaPct > 45) return 0.8;
  if (totalAreaPct > 30) return 0.55;
  if (totalAreaPct < 8) return 0.25;
  return 0.2;
}

function computeCutoutIntegrationRisk(input: ComposerQualityAuditInput): number {
  let risk = 0.15;
  const hasBackground = Boolean(input.backgroundPath?.trim());

  if (hasBackground && !input.productCutoutPath?.trim()) risk += 0.45;
  if (hasBackground && input.hasComposite !== true) risk += 0.25;
  if (!input.finalImagePath?.trim()) risk += 0.2;
  return clamp01(risk);
}

function computeShadowMissingRisk(input: ComposerQualityAuditInput): number {
  if (hasShadowContactInfo(input)) return 0.1;
  if (input.hasComposite === true) return 0.45;
  return 0.65;
}

function computeFinalCompositionRisk(input: {
  productPlacementRisk: number;
  backgroundContrastRisk: number;
  overlayDensityRisk: number;
  cutoutIntegrationRisk: number;
  shadowMissingRisk: number;
  fallbackUsed?: boolean;
}): number {
  const weighted =
    input.productPlacementRisk * 0.24 +
    input.backgroundContrastRisk * 0.18 +
    input.overlayDensityRisk * 0.16 +
    input.cutoutIntegrationRisk * 0.22 +
    input.shadowMissingRisk * 0.2;

  let risk = weighted;
  if (input.fallbackUsed) risk += 0.12;
  return clamp01(risk);
}

/** Deterministic composer/final-card quality audit from available metadata only. */
export function analyzeComposerQuality(input: ComposerQualityAuditInput): ComposerQualityAudit {
  const warnings: ComposerQualityWarning[] = [];
  const recommendations = new Set<string>();

  const productAreaRatio = resolveProductAreaRatio(input);
  const productPlacementRisk = computeProductPlacementRisk({
    ...input,
    productAreaRatio,
  });
  const backgroundContrastRisk = computeBackgroundContrastRisk(input);
  const overlayDensityRisk = computeOverlayDensityRisk(input);
  const cutoutIntegrationRisk = computeCutoutIntegrationRisk(input);
  const shadowMissingRisk = computeShadowMissingRisk(input);
  const finalCompositionRisk = computeFinalCompositionRisk({
    productPlacementRisk,
    backgroundContrastRisk,
    overlayDensityRisk,
    cutoutIntegrationRisk,
    shadowMissingRisk,
    fallbackUsed: input.renderDebug?.fallbackUsed === true,
  });

  if (productAreaRatio != null) {
    if (productAreaRatio < PRODUCT_AREA_MIN) {
      warnings.push({
        code: "COMPOSER_PRODUCT_AREA_TOO_LOW",
        message: `Product area ratio ${productAreaRatio.toFixed(2)} is below minimum ${PRODUCT_AREA_MIN}`,
      });
      recommendations.add("Increase product scale or placement area on the final canvas.");
    }
    if (productAreaRatio > PRODUCT_AREA_MAX) {
      warnings.push({
        code: "COMPOSER_PRODUCT_AREA_TOO_HIGH",
        message: `Product area ratio ${productAreaRatio.toFixed(2)} exceeds maximum ${PRODUCT_AREA_MAX}`,
      });
      recommendations.add("Reduce product scale to preserve text/overlay safe zones.");
    }
  } else {
    warnings.push({
      code: "COMPOSER_PRODUCT_AREA_UNKNOWN",
      message: "Product area ratio could not be derived from placement or layout metadata",
    });
  }

  if (!hasShadowContactInfo(input)) {
    warnings.push({
      code: "COMPOSER_SHADOW_CONTACT_MISSING",
      message: "No shadow/contact metadata available for the composite stage",
    });
    recommendations.add("Capture compositing shadow hints or composite result before HTML render.");
  }

  if (input.overlayElements === "unknown" || input.overlayElements == null) {
    warnings.push({
      code: "COMPOSER_OVERLAY_ELEMENTS_UNKNOWN",
      message: "Overlay elements were not available for density audit",
    });
  }

  if (input.backgroundPath?.trim() && !input.productPlacement && input.hasComposite !== true) {
    warnings.push({
      code: "COMPOSER_PLACEMENT_UNKNOWN_WITH_BACKGROUND",
      message: "Background is present but actual product placement is unknown",
    });
    recommendations.add("Persist composite productPlacement in debug bundle for post-render audit.");
  }

  if (input.renderDebug?.fallbackUsed === true) {
    warnings.push({
      code: "COMPOSER_RENDER_FALLBACK_USED",
      message: "Render fallback was used; composition risk elevated",
    });
    recommendations.add("Review render fallback reason before trusting final composition quality.");
  }

  if (cutoutIntegrationRisk >= 0.6) {
    recommendations.add("Verify product cutout path and merged composite before HTML overlay render.");
  }
  if (overlayDensityRisk >= 0.55) {
    recommendations.add("Review overlay density against marketplace safe zones.");
  }
  if (finalCompositionRisk >= 0.55) {
    recommendations.add("Treat final card quality as at-risk until composition metadata improves.");
  }

  if (recommendations.size === 0) {
    recommendations.add("Composer metadata looks sufficient for this run.");
  }

  return {
    productAreaRatio,
    productPlacementRisk,
    backgroundContrastRisk,
    overlayDensityRisk,
    cutoutIntegrationRisk,
    shadowMissingRisk,
    finalCompositionRisk,
    warnings,
    recommendations: [...recommendations],
  };
}

/** Summarize audit into a single score and short notes for diagnostics/benchmark. */
export function summarizeComposerQualityAudit(
  audit: ComposerQualityAudit,
): ComposerQualityAuditSummary {
  const warningPenalty = audit.warnings.length * 6;
  const riskPenalty = audit.finalCompositionRisk * 45;
  const areaPenalty =
    audit.productAreaRatio != null &&
    (audit.productAreaRatio < PRODUCT_AREA_MIN || audit.productAreaRatio > PRODUCT_AREA_MAX)
      ? 12
      : 0;

  const score = clampScore(100 - riskPenalty - warningPenalty - areaPenalty);
  const notes = [
    `finalCompositionRisk=${audit.finalCompositionRisk.toFixed(2)}`,
    `shadowMissingRisk=${audit.shadowMissingRisk.toFixed(2)}`,
    `cutoutIntegrationRisk=${audit.cutoutIntegrationRisk.toFixed(2)}`,
  ];

  if (audit.productAreaRatio != null) {
    notes.unshift(`productAreaRatio=${audit.productAreaRatio.toFixed(2)}`);
  }

  return {
    score,
    productAreaRatio: audit.productAreaRatio,
    finalCompositionRisk: audit.finalCompositionRisk,
    warningCodes: audit.warnings.map((warning) => warning.code),
    notes,
  };
}

export function overlayElementsFromCompositionLayout(
  layout?: {
    headline?: { width: number; height: number };
    subtitle?: { width: number; height: number };
    bullets?: { width: number; height: number; maxCount?: number };
    plaques?: { maxTotalAreaPct?: number };
    leftPanel?: { width: number; height: number };
    rightSidebar?: { width: number; height: number };
    logo?: { width: number; height: number };
    canvas: { width: number; height: number };
  },
): ComposerOverlayElement[] | "unknown" {
  if (!layout?.canvas?.width || !layout.canvas?.height) return "unknown";

  const canvasArea = layout.canvas.width * layout.canvas.height;
  if (canvasArea <= 0) return "unknown";

  const zoneAreaPct = (zone?: { width: number; height: number }): number | undefined => {
    if (!zone) return undefined;
    return (zone.width * zone.height) / canvasArea;
  };

  const elements: ComposerOverlayElement[] = [];
  const headlineArea = zoneAreaPct(layout.headline);
  if (headlineArea != null) elements.push({ kind: "headline", areaPct: headlineArea });
  const subtitleArea = zoneAreaPct(layout.subtitle);
  if (subtitleArea != null) elements.push({ kind: "subtitle", areaPct: subtitleArea });
  const bulletsArea = zoneAreaPct(layout.bullets);
  if (bulletsArea != null) {
    elements.push({
      kind: "bullets",
      areaPct: bulletsArea * Math.max(1, layout.bullets?.maxCount ?? 1),
    });
  }
  if (layout.plaques?.maxTotalAreaPct != null) {
    elements.push({ kind: "plaques", areaPct: layout.plaques.maxTotalAreaPct });
  }
  const leftPanelArea = zoneAreaPct(layout.leftPanel);
  if (leftPanelArea != null) elements.push({ kind: "leftPanel", areaPct: leftPanelArea });
  const rightSidebarArea = zoneAreaPct(layout.rightSidebar);
  if (rightSidebarArea != null) elements.push({ kind: "rightSidebar", areaPct: rightSidebarArea });
  const logoArea = zoneAreaPct(layout.logo);
  if (logoArea != null) elements.push({ kind: "logo", areaPct: logoArea });

  return elements.length ? elements : "unknown";
}
