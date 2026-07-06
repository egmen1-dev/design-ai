import type { CompositionLayout, CompositionZone } from "@/lib/composition/types";
import { xPct, yPct } from "@/lib/composition/canvas";
import type { NormalizedCompositePlacement } from "@/lib/daos/compositor/composite-result-bridge";
import type { SceneGraph } from "./SceneGraph";
import { isDaosSceneGraphV2Enabled } from "./index";

export type SceneGraphProductActual = {
  x: number;
  y: number;
  width: number;
  height: number;
  areaRatio: number;
  widthRatio: number;
  heightRatio: number;
  visibleArea?: number;
  source: string;
  confidence: number;
};

export type OverlayProductBbox = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export type OverlaySceneGraphDiagnostics = {
  overlayUsedSceneGraphActual: boolean;
  overlayProductActualSource?: string;
  overlayProductActualAreaRatio?: number;
  overlayAvoidedActualProductOverlap?: boolean;
};

/** Stage 3 — overlay reads ProductNode.actual when V2 is on (unless forced planned). */
export function isDaosSceneGraphOverlayUsesActual(): boolean {
  return isDaosSceneGraphV2Enabled() && process.env.DAOS_SCENE_GRAPH_OVERLAY_PLANNED !== "1";
}

export function extractProductActualFromSceneGraph(
  graph?: SceneGraph,
): SceneGraphProductActual | undefined {
  const actual = graph?.product.actual;
  if (!actual?.width || !actual.height) return undefined;

  const canvas = graph!.canvas.actual ?? graph!.canvas.planned;
  const canvasArea = canvas.width * canvas.height;
  const visibleArea = actual.visibleArea ?? actual.width * actual.height;

  return {
    x: actual.x,
    y: actual.y,
    width: actual.width,
    height: actual.height,
    areaRatio:
      actual.areaRatio ??
      actual.visibleAreaRatio ??
      (canvasArea > 0 ? visibleArea / canvasArea : 0),
    widthRatio: actual.widthRatio ?? (canvas.width > 0 ? actual.width / canvas.width : 0),
    heightRatio: actual.heightRatio ?? (canvas.height > 0 ? actual.height / canvas.height : 0),
    visibleArea,
    source: graph!.product.source,
    confidence: graph!.product.confidence,
  };
}

export function productActualToOverlayBbox(actual: SceneGraphProductActual): OverlayProductBbox {
  return {
    left: actual.x,
    top: actual.y,
    width: actual.width,
    height: actual.height,
  };
}

function zoneLooksLikePercent(zone: CompositionZone): boolean {
  return zone.left <= 100 && zone.top <= 100 && zone.width <= 100 && zone.height <= 100;
}

export function compositionZoneToPixels(
  zone: CompositionZone,
  canvas: { width: number; height: number },
): OverlayProductBbox {
  if (zoneLooksLikePercent(zone)) {
    return {
      left: xPct(zone.left, canvas),
      top: yPct(zone.top, canvas),
      width: xPct(zone.width, canvas),
      height: yPct(zone.height, canvas),
    };
  }
  return { left: zone.left, top: zone.top, width: zone.width, height: zone.height };
}

function placementLooksLikeRatio(placement: NormalizedCompositePlacement): boolean {
  return placement.width <= 1 && placement.height <= 1 && placement.x <= 1 && placement.y <= 1;
}

export function resolveOverlayProductBbox(input: {
  canvas?: { width: number; height: number };
  sceneGraphProductActual?: SceneGraphProductActual;
  compositePlacement?: NormalizedCompositePlacement;
  compositionLayout?: CompositionLayout;
  preferSceneGraphActual?: boolean;
}): OverlayProductBbox | undefined {
  const canvas = input.canvas ?? input.compositionLayout?.canvas;
  if (!canvas?.width || !canvas.height) return undefined;

  if (input.preferSceneGraphActual && input.sceneGraphProductActual) {
    return productActualToOverlayBbox(input.sceneGraphProductActual);
  }

  if (input.compositePlacement) {
    const cp = input.compositePlacement;
    if (placementLooksLikeRatio(cp)) {
      return {
        left: cp.x * canvas.width,
        top: cp.y * canvas.height,
        width: cp.width * canvas.width,
        height: cp.height * canvas.height,
      };
    }
    return { left: cp.x, top: cp.y, width: cp.width, height: cp.height };
  }

  const product = input.compositionLayout?.product;
  if (!product || product.width <= 0 || product.height <= 0) return undefined;
  return compositionZoneToPixels(product, canvas);
}

export function zonesOverlap(
  a: OverlayProductBbox,
  b: OverlayProductBbox,
): boolean {
  return !(
    a.left + a.width <= b.left ||
    b.left + b.width <= a.left ||
    a.top + a.height <= b.top ||
    b.top + b.height <= a.top
  );
}

export function countTextZoneOverlapsWithProduct(
  compositionLayout: CompositionLayout | undefined,
  productBbox: OverlayProductBbox | undefined,
): number {
  if (!compositionLayout || !productBbox) return 0;
  const canvas = compositionLayout.canvas;
  const textZones = [
    compositionLayout.headline,
    compositionLayout.subtitle,
    compositionLayout.leftPanel,
    compositionLayout.bullets,
  ];
  let overlaps = 0;
  for (const zone of textZones) {
    const px = compositionZoneToPixels(zone, canvas);
    if (zonesOverlap(px, productBbox)) overlaps += 1;
  }
  return overlaps;
}

export function moveTextZonesAwayFromProductBbox(
  compositionLayout: CompositionLayout,
  productBbox: OverlayProductBbox,
): boolean {
  const canvas = compositionLayout.canvas;
  const textZones = [
    compositionLayout.headline,
    compositionLayout.subtitle,
    compositionLayout.leftPanel,
    compositionLayout.bullets,
  ];
  let moved = false;

  for (const zone of textZones) {
    const px = compositionZoneToPixels(zone, canvas);
    if (!zonesOverlap(px, productBbox)) continue;

    if (compositionLayout.textSide === "left") {
      const maxRight = productBbox.left - canvas.width * 0.03;
      if (px.left + px.width > maxRight) {
        const newWidth = Math.max(canvas.width * 0.18, maxRight - px.left);
        if (zoneLooksLikePercent(zone)) {
          zone.width = (newWidth / canvas.width) * 100;
        } else {
          zone.width = newWidth;
        }
      }
      const newLeft = Math.max(canvas.width * 0.04, px.left - canvas.width * 0.02);
      if (zoneLooksLikePercent(zone)) {
        zone.left = (newLeft / canvas.width) * 100;
      } else {
        zone.left = newLeft;
      }
    } else {
      const newLeft = Math.min(
        canvas.width * 0.56,
        Math.max(px.left, productBbox.left + productBbox.width + canvas.width * 0.03),
      );
      if (zoneLooksLikePercent(zone)) {
        zone.left = (newLeft / canvas.width) * 100;
      } else {
        zone.left = newLeft;
      }
    }
    moved = true;
  }

  if (moved) {
    compositionLayout.safeInsetPct = Math.max(compositionLayout.safeInsetPct, 0.1);
    compositionLayout.metrics = {
      ...compositionLayout.metrics,
      overlapPct: Math.max(0, compositionLayout.metrics.overlapPct - 2),
    };
    compositionLayout.adjustments = [
      ...compositionLayout.adjustments,
      "daos_scene_graph:avoid_actual_product_overlap",
    ];
  }

  return moved;
}

export function buildOverlaySceneGraphDiagnostics(input: {
  sceneGraphProductActual?: SceneGraphProductActual;
  compositionLayout?: CompositionLayout;
  avoidedOverlap?: boolean;
}): OverlaySceneGraphDiagnostics {
  const used = isDaosSceneGraphOverlayUsesActual() && Boolean(input.sceneGraphProductActual);
  return {
    overlayUsedSceneGraphActual: used,
    overlayProductActualSource: used ? input.sceneGraphProductActual?.source : undefined,
    overlayProductActualAreaRatio: used ? input.sceneGraphProductActual?.areaRatio : undefined,
    overlayAvoidedActualProductOverlap: used ? Boolean(input.avoidedOverlap) : undefined,
  };
}
