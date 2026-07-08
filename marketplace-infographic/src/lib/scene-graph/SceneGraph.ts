import type { SceneGeometry, SceneGeometryActual, SceneNode } from "./SceneNode";

export const SCENE_GRAPH_VERSION = 2 as const;

export type SceneGraphStage =
  | "planner"
  | "after_compositor"
  | "after_overlay"
  | "final";

export type WhitespaceNode = SceneNode & {
  type: "whitespace";
  actual?: SceneGeometryActual & {
    whitespacePct?: number;
    plannedWhitespacePct?: number;
    overlayDensity?: number;
  };
};

export type ProductNode = SceneNode & {
  type: "product";
  actual?: SceneGeometryActual & {
    areaRatio?: number;
    widthRatio?: number;
    heightRatio?: number;
  };
};

export type OverlayNode = SceneNode & {
  type: "overlay";
  actual?: SceneGeometryActual & {
    elementCount?: number;
    density?: number;
    actualArea?: number;
  };
};

export type TypographyNode = SceneNode & {
  type: "typography";
  actual?: SceneGeometryActual & {
    headlineArea?: number;
    textAreaPct?: number;
  };
};

export type BadgeNode = SceneNode & {
  type: "badges";
  actual?: SceneGeometryActual & {
    count?: number;
    maxAllowed?: number;
  };
};

export type SafeZonesNode = SceneNode & {
  type: "safe_zones";
  actual?: SceneGeometryActual & {
    insetPct?: number;
    horizontalBleedPct?: number;
  };
};

export type CompositionNode = SceneNode & {
  type: "composition";
  actual?: SceneGeometryActual & {
    overlapPct?: number;
    productAreaPct?: number;
    visualCenterX?: number;
    visualCenterY?: number;
  };
};

export type GovernanceNode = SceneNode & {
  type: "governance";
  actual?: SceneGeometryActual & {
    law003Before?: boolean;
    law003After?: boolean;
    law014Violation?: boolean;
  };
};

export type SceneGraph = {
  version: typeof SCENE_GRAPH_VERSION;
  id: string;
  stage: SceneGraphStage;
  createdAt: string;
  canvas: SceneNode & { type: "canvas"; planned: SceneGeometry; actual?: SceneGeometryActual };
  background: SceneNode & { type: "background" };
  product: ProductNode;
  overlay: OverlayNode;
  typography: TypographyNode;
  badges: BadgeNode;
  safeZones: SafeZonesNode;
  whitespace: WhitespaceNode;
  composition: CompositionNode;
  lighting: SceneNode & { type: "lighting" };
  depth: SceneNode & { type: "depth" };
  camera: SceneNode & { type: "camera" };
  governance: GovernanceNode;
  metadata: {
    enabled: boolean;
    mirrorMode: boolean;
    sources: string[];
    productCategory?: string;
    layoutMode?: string;
    wideProductTemplateApplied?: boolean;
    wideProductTemplateStrategy?: string;
    wideProductHeroZone?: string;
    wideProductTextZone?: string;
  };
};

export type SceneGraphDrift = {
  productAreaDrift: number;
  productPositionDrift: number;
  productSizeDrift: number;
  productWidthDrift: number;
  productHeightDrift: number;
  whitespaceDrift: number;
  overlayDensityDrift: number;
  badgeCountDrift: number;
  overlapDrift: number;
};

export type SceneGraphDriftReport = {
  fromStage: SceneGraphStage;
  toStage: SceneGraphStage;
  drift: SceneGraphDrift;
  hasSignificantDrift: boolean;
};
