import type { CompositionLayout } from "@/lib/composition/types";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { ComposerQualityAudit } from "./composer-quality-audit";
import type { OverlayQualityAudit } from "./overlay-quality-audit";

export type ProductBounds = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type ProductScaleAuditInput = {
  canvas?: { width: number; height: number };
  productCutoutPath?: string | null;
  finalImagePath?: string;
  productBounds?: ProductBounds;
  placement?: ProductBounds;
  compositionLayout?: CompositionLayout;
  layoutSpec?: LayoutSpec;
  composerQualityAudit?: ComposerQualityAudit;
  overlayQualityAudit?: OverlayQualityAudit;
};

export type ProductScaleWarning = {
  code: string;
  message: string;
};

export type ProductScaleAudit = {
  productAreaRatio?: number;
  productWidthRatio?: number;
  productHeightRatio?: number;
  productDominanceScore: number;
  emptySpaceEstimate: number;
  scaleRisk: number;
  placementRisk: number;
  sceneFillRisk: number;
  warnings: ProductScaleWarning[];
  recommendations: string[];
  score: number;
};

export type ProductScaleAuditSummary = {
  score: number;
  productDominanceScore: number;
  productWidthRatio?: number;
  productHeightRatio?: number;
  emptySpaceEstimate: number;
  sceneFillRisk: number;
  warningCodes: string[];
  notes: string[];
};

const PRODUCT_SCALE_WARN = 0.45;
const EMPTY_SPACE_WARN = 0.45;
const DOMINANCE_WARN = 70;
const PLANNED_ACTUAL_GAP = 0.08;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function resolveCanvas(input: ProductScaleAuditInput): { width: number; height: number } | undefined {
  if (input.canvas?.width && input.canvas?.height) return input.canvas;
  if (input.compositionLayout?.canvas?.width && input.compositionLayout?.canvas?.height) {
    return input.compositionLayout.canvas;
  }
  if (input.layoutSpec?.geometry?.canvas?.width && input.layoutSpec?.geometry?.canvas?.height) {
    return input.layoutSpec.geometry.canvas;
  }
  return undefined;
}

function boundsFromCompositionProduct(
  layout?: CompositionLayout,
): ProductBounds | undefined {
  if (!layout?.product) return undefined;
  return {
    left: layout.product.left,
    top: layout.product.top,
    width: layout.product.width,
    height: layout.product.height,
  };
}

function resolvePlacementBounds(input: ProductScaleAuditInput): ProductBounds | undefined {
  if (input.placement) return input.placement;
  if (input.productBounds) return input.productBounds;
  return boundsFromCompositionProduct(input.compositionLayout);
}

function ratioFromBounds(
  bounds: ProductBounds | undefined,
  canvas: { width: number; height: number } | undefined,
): {
  productAreaRatio?: number;
  productWidthRatio?: number;
  productHeightRatio?: number;
} {
  if (!bounds || !canvas?.width || !canvas?.height) {
    return {};
  }
  const canvasArea = canvas.width * canvas.height;
  if (canvasArea <= 0) return {};
  return {
    productAreaRatio: clamp01((bounds.width * bounds.height) / canvasArea),
    productWidthRatio: clamp01(bounds.width / canvas.width),
    productHeightRatio: clamp01(bounds.height / canvas.height),
  };
}

function resolveProductAreaRatio(input: ProductScaleAuditInput): number | undefined {
  const canvas = resolveCanvas(input);
  const fromPlacement = ratioFromBounds(resolvePlacementBounds(input), canvas).productAreaRatio;
  if (fromPlacement != null) return fromPlacement;

  if (typeof input.composerQualityAudit?.productAreaRatio === "number") {
    return clamp01(input.composerQualityAudit.productAreaRatio);
  }

  const plannedPct = input.compositionLayout?.metrics?.productAreaPct;
  if (typeof plannedPct === "number") return clamp01(plannedPct / 100);

  const heroScale = input.layoutSpec?.heroScale;
  if (typeof heroScale === "number") return clamp01(heroScale / 100);

  return undefined;
}

function resolveWidthHeightRatios(
  input: ProductScaleAuditInput,
  productAreaRatio?: number,
): { productWidthRatio?: number; productHeightRatio?: number } {
  const canvas = resolveCanvas(input);
  const fromBounds = ratioFromBounds(resolvePlacementBounds(input), canvas);
  if (fromBounds.productWidthRatio != null && fromBounds.productHeightRatio != null) {
    return fromBounds;
  }

  if (productAreaRatio != null) {
    const side = Math.sqrt(productAreaRatio);
    return {
      productWidthRatio: clamp01(side),
      productHeightRatio: clamp01(side),
    };
  }

  return {};
}

function resolveEmptySpaceEstimate(input: ProductScaleAuditInput, productAreaRatio?: number): number {
  const whitespacePct = input.compositionLayout?.metrics?.whitespacePct;
  if (typeof whitespacePct === "number") {
    return clamp01(whitespacePct / 100);
  }

  const overlayWhitespace = input.overlayQualityAudit?.whitespaceRisk;
  if (typeof overlayWhitespace === "number" && overlayWhitespace > 0) {
    return clamp01(overlayWhitespace);
  }

  const textPct = input.compositionLayout?.metrics?.textAreaPct ?? 0;
  const plaquePct = input.compositionLayout?.metrics?.plaqueAreaPct ?? 0;
  const occupied = (productAreaRatio ?? 0) + textPct / 100 + plaquePct / 100;
  return clamp01(Math.max(0, 1 - occupied));
}

function computeProductDominanceScore(
  productAreaRatio: number | undefined,
  emptySpaceEstimate: number,
  productWidthRatio?: number,
  productHeightRatio?: number,
): number {
  let score = 100;
  if (productAreaRatio != null) {
    if (productAreaRatio < PRODUCT_SCALE_WARN) score -= (PRODUCT_SCALE_WARN - productAreaRatio) * 120;
    else score += Math.min(8, (productAreaRatio - PRODUCT_SCALE_WARN) * 20);
  } else {
    score -= 25;
  }

  if (productWidthRatio != null && productWidthRatio < PRODUCT_SCALE_WARN) {
    score -= (PRODUCT_SCALE_WARN - productWidthRatio) * 60;
  }
  if (productHeightRatio != null && productHeightRatio < PRODUCT_SCALE_WARN) {
    score -= (PRODUCT_SCALE_WARN - productHeightRatio) * 60;
  }

  if (emptySpaceEstimate > EMPTY_SPACE_WARN) {
    score -= (emptySpaceEstimate - EMPTY_SPACE_WARN) * 90;
  }

  return clampScore(score);
}

function computeScaleRisk(productAreaRatio?: number, productWidthRatio?: number, productHeightRatio?: number): number {
  let risk = 0;
  if (productAreaRatio != null) {
    if (productAreaRatio < PRODUCT_SCALE_WARN) risk += (PRODUCT_SCALE_WARN - productAreaRatio) * 1.4;
    if (productAreaRatio < 0.35) risk += 0.2;
  } else {
    risk += 0.35;
  }
  if (productWidthRatio != null && productWidthRatio < PRODUCT_SCALE_WARN) {
    risk += (PRODUCT_SCALE_WARN - productWidthRatio) * 0.8;
  }
  if (productHeightRatio != null && productHeightRatio < PRODUCT_SCALE_WARN) {
    risk += (PRODUCT_SCALE_WARN - productHeightRatio) * 0.8;
  }
  return clamp01(risk);
}

function computePlacementRisk(
  input: ProductScaleAuditInput,
  productAreaRatio?: number,
): number {
  let risk = 0;
  if (!input.placement && !input.productBounds) risk += 0.25;
  if (!input.productCutoutPath?.trim()) risk += 0.15;
  if (!input.finalImagePath?.trim()) risk += 0.1;

  const planned =
    input.compositionLayout?.metrics?.productAreaPct != null
      ? input.compositionLayout.metrics.productAreaPct / 100
      : input.layoutSpec?.heroScale != null
        ? clamp01(input.layoutSpec.heroScale / 100)
        : undefined;

  if (planned != null && productAreaRatio != null && planned - productAreaRatio > PLANNED_ACTUAL_GAP) {
    risk += clamp01((planned - productAreaRatio) * 1.2);
  }

  if (input.composerQualityAudit?.productPlacementRisk != null) {
    risk = clamp01(risk * 0.6 + input.composerQualityAudit.productPlacementRisk * 0.4);
  }

  return clamp01(risk);
}

function computeSceneFillRisk(emptySpaceEstimate: number, productAreaRatio?: number): number {
  let risk = 0;
  if (emptySpaceEstimate > EMPTY_SPACE_WARN) {
    risk += (emptySpaceEstimate - EMPTY_SPACE_WARN) * 1.5;
  }
  if (productAreaRatio != null && productAreaRatio < PRODUCT_SCALE_WARN) {
    risk += (PRODUCT_SCALE_WARN - productAreaRatio) * 0.9;
  }
  if (emptySpaceEstimate > 0.5 && (productAreaRatio ?? 1) < 0.4) {
    risk += 0.15;
  }
  return clamp01(risk);
}

function computeScore(input: {
  productDominanceScore: number;
  scaleRisk: number;
  placementRisk: number;
  sceneFillRisk: number;
  warnings: ProductScaleWarning[];
}): number {
  let score = input.productDominanceScore;
  score -= input.scaleRisk * 18;
  score -= input.placementRisk * 12;
  score -= input.sceneFillRisk * 16;
  score -= Math.min(20, input.warnings.length * 4);
  return clampScore(score);
}

/** Deterministic product scale / scene fill audit from compositor and layout metadata. */
export function analyzeProductScale(input: ProductScaleAuditInput): ProductScaleAudit {
  const warnings: ProductScaleWarning[] = [];
  const recommendations = new Set<string>();

  const canvas = resolveCanvas(input);
  const productAreaRatio = resolveProductAreaRatio(input);
  const { productWidthRatio, productHeightRatio } = resolveWidthHeightRatios(input, productAreaRatio);
  const emptySpaceEstimate = resolveEmptySpaceEstimate(input, productAreaRatio);
  const productDominanceScore = computeProductDominanceScore(
    productAreaRatio,
    emptySpaceEstimate,
    productWidthRatio,
    productHeightRatio,
  );
  const scaleRisk = computeScaleRisk(productAreaRatio, productWidthRatio, productHeightRatio);
  const placementRisk = computePlacementRisk(input, productAreaRatio);
  const sceneFillRisk = computeSceneFillRisk(emptySpaceEstimate, productAreaRatio);

  if (!canvas) {
    warnings.push({
      code: "PRODUCT_SCALE_INPUT_MISSING",
      message: "Canvas dimensions unavailable for product scale audit",
    });
  }

  if (!input.placement && !input.productBounds && !input.compositionLayout?.product) {
    warnings.push({
      code: "PRODUCT_SCALE_PLACEMENT_MISSING",
      message: "No compositor placement or layout product bounds available",
    });
    recommendations.add("Persist composite productPlacement in debug bundle.");
  }

  if (productAreaRatio != null && productAreaRatio < PRODUCT_SCALE_WARN) {
    warnings.push({
      code: "PRODUCT_SCALE_AREA_LOW",
      message: `Product area ratio ${productAreaRatio.toFixed(2)} is below ${PRODUCT_SCALE_WARN}`,
    });
    recommendations.add("Increase compositor product scale — HTML/layout patches will not raise final productAreaRatio.");
  }

  if (productWidthRatio != null && productWidthRatio < PRODUCT_SCALE_WARN) {
    warnings.push({
      code: "PRODUCT_SCALE_WIDTH_LOW",
      message: `Product width ratio ${productWidthRatio.toFixed(2)} is below ${PRODUCT_SCALE_WARN}`,
    });
  }

  if (productHeightRatio != null && productHeightRatio < PRODUCT_SCALE_WARN) {
    warnings.push({
      code: "PRODUCT_SCALE_HEIGHT_LOW",
      message: `Product height ratio ${productHeightRatio.toFixed(2)} is below ${PRODUCT_SCALE_WARN}`,
    });
  }

  if (emptySpaceEstimate > EMPTY_SPACE_WARN) {
    warnings.push({
      code: "SCENE_FILL_EMPTY_HIGH",
      message: `Empty space estimate ${emptySpaceEstimate.toFixed(2)} exceeds ${EMPTY_SPACE_WARN}`,
    });
    recommendations.add("Reduce scene empty fill — enlarge compositor placement or tighten background crop.");
  }

  if (productDominanceScore < DOMINANCE_WARN) {
    warnings.push({
      code: "PRODUCT_DOMINANCE_LOW",
      message: `Product dominance score ${productDominanceScore} is below ${DOMINANCE_WARN}`,
    });
  }

  const law003 = input.overlayQualityAudit?.law003WhitespaceViolation === true;
  if (law003 && productAreaRatio != null && productAreaRatio < PRODUCT_SCALE_WARN) {
    warnings.push({
      code: "LAW_003_COMPOSITOR_SCALE_RECOMMENDED",
      message:
        "LAW_003 whitespace violation with low product area — recommend compositor scale patch, not overlay patch",
    });
    recommendations.add(
      "Apply compositor product scale patch (not overlay/layout patch) to address LAW_003 whitespace.",
    );
  }

  const plannedArea =
    input.compositionLayout?.metrics?.productAreaPct != null
      ? input.compositionLayout.metrics.productAreaPct / 100
      : undefined;
  const actualFromPlacement = input.placement && canvas
    ? clamp01((input.placement.width * input.placement.height) / (canvas.width * canvas.height))
    : undefined;

  if (
    plannedArea != null &&
    actualFromPlacement != null &&
    plannedArea - actualFromPlacement > PLANNED_ACTUAL_GAP
  ) {
    warnings.push({
      code: "COMPOSITOR_VS_LAYOUT_GAP",
      message: `Planned product area ${plannedArea.toFixed(2)} vs compositor placement ${actualFromPlacement.toFixed(2)}`,
    });
    recommendations.add(
      "Compositor placement is smaller than layout plan — geometry patch cannot fix final productAreaRatio.",
    );
  }

  if (!input.productCutoutPath?.trim()) {
    warnings.push({
      code: "PRODUCT_CUTOUT_PATH_MISSING",
      message: "Product cutout path missing — cutout bounds audit incomplete",
    });
  }

  if (recommendations.size === 0) {
    recommendations.add("Product scale and scene fill metadata look within expected guardrails.");
  }

  const score = computeScore({
    productDominanceScore,
    scaleRisk,
    placementRisk,
    sceneFillRisk,
    warnings,
  });

  return {
    productAreaRatio,
    productWidthRatio,
    productHeightRatio,
    productDominanceScore,
    emptySpaceEstimate,
    scaleRisk,
    placementRisk,
    sceneFillRisk,
    warnings,
    recommendations: [...recommendations],
    score,
  };
}

/** Compact product scale audit summary for diagnostics and benchmark export. */
export function summarizeProductScaleAudit(audit: ProductScaleAudit): ProductScaleAuditSummary {
  return {
    score: audit.score,
    productDominanceScore: audit.productDominanceScore,
    productWidthRatio: audit.productWidthRatio,
    productHeightRatio: audit.productHeightRatio,
    emptySpaceEstimate: audit.emptySpaceEstimate,
    sceneFillRisk: audit.sceneFillRisk,
    warningCodes: audit.warnings.map((warning) => warning.code),
    notes: [
      audit.productAreaRatio != null
        ? `productAreaRatio=${audit.productAreaRatio.toFixed(2)}`
        : "productAreaRatio=unknown",
      `scaleRisk=${audit.scaleRisk.toFixed(2)}`,
      `placementRisk=${audit.placementRisk.toFixed(2)}`,
    ],
  };
}
