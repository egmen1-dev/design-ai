import type { CompositionLayout } from "@/lib/composition/types";
import type { InfographicData } from "@/lib/infographic-template";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import { WB_COVER, xPct, yPct } from "@/lib/composition/canvas";
import type { NormalizedCompositePlacement } from "@/lib/daos/compositor/composite-result-bridge";
import type { OverlayQualityAudit } from "@/lib/daos/audit/overlay-quality-audit";
import type { Law003RecalibrationReport } from "@/lib/daos/governance/law003-recalibration";
import { createSceneNode, mergeActual } from "./SceneNode";
import type { SceneGraph, SceneGraphStage } from "./SceneGraph";

export type SceneGraphBuildInput = {
  id: string;
  stage?: SceneGraphStage;
  compositionLayout?: CompositionLayout;
  layoutSpec?: LayoutSpec;
  infographicData?: InfographicData;
  compositePlacement?: NormalizedCompositePlacement;
  overlayAudit?: OverlayQualityAudit;
  law003Recalibration?: Law003RecalibrationReport;
  productCategory?: string;
  layoutMode?: string;
};

function pctToPx(
  leftPct: number,
  topPct: number,
  widthPct: number,
  heightPct: number,
  canvas = WB_COVER,
) {
  return {
    x: Math.round(xPct(leftPct, canvas)),
    y: Math.round(yPct(topPct, canvas)),
    width: Math.round(xPct(widthPct, canvas)),
    height: Math.round(yPct(heightPct, canvas)),
  };
}

function productPlannedFromLayout(layout?: CompositionLayout) {
  const product = layout?.product;
  const canvas = layout?.canvas ?? WB_COVER;
  if (!product) return undefined;
  return {
    x: Math.round(xPct(product.left, canvas)),
    y: Math.round(yPct(product.top, canvas)),
    width: Math.round(xPct(product.width, canvas)),
    height: Math.round(yPct(product.height, canvas)),
    rotation: product.rotationDeg,
    layer: 10,
  };
}

function countBadges(data?: InfographicData): number {
  if (!data) return 0;
  return (
    (data.callouts?.length ?? 0) +
    (data.specBlocks?.length ?? 0) +
    (data.marketplaceSidebar?.length ?? 0) +
    (data.mainBanner?.title ? 1 : 0)
  );
}

/** Build SceneGraph snapshot from pipeline state (mirror mode — non-destructive). */
export function buildSceneGraph(input: SceneGraphBuildInput): SceneGraph {
  const stage = input.stage ?? "planner";
  const canvasSize = input.compositionLayout?.canvas ?? WB_COVER;
  const metrics = input.compositionLayout?.metrics;
  const product = input.compositionLayout?.product;
  const productPlanned = productPlannedFromLayout(input.compositionLayout);

  const canvasNode = {
    ...createSceneNode({
      id: "canvas",
      type: "canvas",
      planned: {
        x: 0,
        y: 0,
        width: canvasSize.width,
        height: canvasSize.height,
        layer: 0,
      },
      actual: {
        x: 0,
        y: 0,
        width: canvasSize.width,
        height: canvasSize.height,
        layer: 0,
      },
      confidence: 1,
      source: "planner",
    }),
    type: "canvas" as const,
  };

  let productNode = {
    ...createSceneNode({
      id: "product",
      type: "product",
      planned: productPlanned,
      confidence: productPlanned ? 0.75 : 0.4,
      source: "planner",
    }),
    type: "product" as const,
  };

  if (input.compositePlacement) {
    const cp = input.compositePlacement;
    productNode = mergeActual(
      productNode,
      {
        x: cp.x,
        y: cp.y,
        width: cp.width,
        height: cp.height,
        visibleArea: cp.width * cp.height,
        visibleAreaRatio: cp.areaRatio,
        widthRatio: cp.widthRatio,
        heightRatio: cp.heightRatio,
      },
      "compositor",
      stage,
    ) as typeof productNode;
  }

  const headline = input.compositionLayout?.headline;
  const typographyNode = {
    ...createSceneNode({
      id: "typography",
      type: "typography",
      planned: headline
        ? pctToPx(headline.left, headline.top, headline.width, headline.height, canvasSize)
        : undefined,
      actual: headline
        ? {
            ...pctToPx(headline.left, headline.top, headline.width, headline.height, canvasSize),
            textAreaPct: metrics?.textAreaPct,
            headlineArea: metrics?.textAreaPct,
          }
        : undefined,
      confidence: headline ? 0.7 : 0.3,
      source: stage === "planner" ? "planner" : "overlay",
    }),
    type: "typography" as const,
  };

  const badgeCount = countBadges(input.infographicData);
  const maxBadges = input.layoutSpec?.maxIcons ?? 2;

  const graph: SceneGraph = {
    version: 2,
    id: input.id,
    stage,
    createdAt: new Date().toISOString(),
    canvas: canvasNode,
    background: createSceneNode({ id: "background", type: "background", source: "planner" }),
    product: productNode,
    overlay: {
      ...createSceneNode({
        id: "overlay",
        type: "overlay",
        actual: {
          x: 0,
          y: 0,
          width: canvasSize.width,
          height: canvasSize.height,
          elementCount: badgeCount,
          density: input.overlayAudit?.estimatedOverlayDensity,
          actualArea:
            ((metrics?.textAreaPct ?? 0) + (metrics?.plaqueAreaPct ?? 0)) / 100,
        },
        confidence: input.overlayAudit ? 0.85 : 0.5,
        source: stage === "after_overlay" || stage === "final" ? "overlay" : "planner",
      }),
      type: "overlay",
    },
    typography: typographyNode,
    badges: {
      ...createSceneNode({
        id: "badges",
        type: "badges",
        actual: { x: 0, y: 0, width: 0, height: 0, count: badgeCount, maxAllowed: maxBadges },
        confidence: 0.8,
        source: "overlay",
      }),
      type: "badges",
    },
    safeZones: {
      ...createSceneNode({
        id: "safe_zones",
        type: "safe_zones",
        planned: product
          ? pctToPx(
              product.left,
              product.top,
              product.maxWidthPct,
              product.maxHeightPct,
              canvasSize,
            )
          : undefined,
        actual: {
          insetPct: input.compositionLayout?.safeInsetPct,
          horizontalBleedPct: 0,
        },
        confidence: 0.7,
        source: "planner",
      }),
      type: "safe_zones",
    },
    whitespace: {
      ...createSceneNode({
        id: "whitespace",
        type: "whitespace",
        planned: {
          x: 0,
          y: 0,
          width: canvasSize.width,
          height: canvasSize.height,
          whitespacePct: metrics?.whitespacePct,
        },
        actual: {
          x: 0,
          y: 0,
          width: canvasSize.width,
          height: canvasSize.height,
          whitespacePct:
            input.law003Recalibration?.recalibratedWhitespace ?? metrics?.whitespacePct,
          plannedWhitespacePct: metrics?.whitespacePct,
          overlayDensity: input.overlayAudit?.estimatedOverlayDensity,
        },
        confidence: input.law003Recalibration ? 0.9 : 0.65,
        source: input.law003Recalibration ? "constitution" : "planner",
      }),
      type: "whitespace",
    },
    composition: {
      ...createSceneNode({
        id: "composition",
        type: "composition",
        planned: productPlanned,
        actual: {
          overlapPct: metrics?.overlapPct,
          productAreaPct: metrics?.productAreaPct,
          visualCenterX: product?.centerX ?? metrics?.visualCenterX,
          visualCenterY: product?.centerY ?? metrics?.visualCenterY,
        },
        confidence: metrics ? 0.8 : 0.4,
        source: "planner",
      }),
      type: "composition",
    },
    lighting: createSceneNode({ id: "lighting", type: "lighting", source: "planner" }),
    depth: createSceneNode({ id: "depth", type: "depth", source: "planner" }),
    camera: createSceneNode({ id: "camera", type: "camera", source: "planner" }),
    governance: {
      ...createSceneNode({
        id: "governance",
        type: "governance",
        actual: {
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          law003Before: input.law003Recalibration?.law003Before,
          law003After: input.law003Recalibration?.law003After,
          law014Violation: input.overlayAudit?.law014ContrastViolation,
        },
        confidence: input.law003Recalibration ? 0.92 : 0.5,
        source: "constitution",
      }),
      type: "governance",
    },
    metadata: {
      enabled: true,
      mirrorMode: true,
      sources: [stage],
      productCategory: input.productCategory,
      layoutMode: input.layoutMode,
    },
  };

  return graph;
}

/** Clone graph with new stage and optional field updates. */
export function advanceSceneGraph(
  previous: SceneGraph,
  input: Omit<SceneGraphBuildInput, "id"> & { stage: SceneGraphStage },
): SceneGraph {
  return buildSceneGraph({
    id: previous.id,
    stage: input.stage,
    compositionLayout: input.compositionLayout,
    layoutSpec: input.layoutSpec,
    infographicData: input.infographicData,
    compositePlacement: input.compositePlacement ?? extractPlacementFromGraph(previous),
    overlayAudit: input.overlayAudit,
    law003Recalibration: input.law003Recalibration,
    productCategory: input.productCategory ?? previous.metadata.productCategory,
    layoutMode: input.layoutMode ?? previous.metadata.layoutMode,
  });
}

function extractPlacementFromGraph(graph: SceneGraph): NormalizedCompositePlacement | undefined {
  const actual = graph.product.actual;
  if (!actual?.width || !actual.height) return undefined;
  const canvas = graph.canvas.actual ?? graph.canvas.planned;
  const canvasArea = canvas.width * canvas.height;
  return {
    x: actual.x,
    y: actual.y,
    width: actual.width,
    height: actual.height,
    areaRatio: actual.visibleAreaRatio ?? (actual.width * actual.height) / canvasArea,
    widthRatio: actual.widthRatio ?? actual.width / canvas.width,
    heightRatio: actual.heightRatio ?? actual.height / canvas.height,
    source: "scene_graph",
    confidence: graph.product.confidence,
  };
}
