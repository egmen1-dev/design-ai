import type { SceneGraph, SceneGraphDrift, SceneGraphDriftReport, SceneGraphStage } from "./SceneGraph";

export type SceneGraphValidationIssue = {
  code: string;
  message: string;
  severity: "warning" | "error";
};

export type SceneGraphValidationResult = {
  valid: boolean;
  issues: SceneGraphValidationIssue[];
};

const DRIFT_THRESHOLD = 0.05;

function num(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** Structural validation of a SceneGraph snapshot. */
export function validateSceneGraph(graph: SceneGraph): SceneGraphValidationResult {
  const issues: SceneGraphValidationIssue[] = [];

  if (graph.version !== 2) {
    issues.push({
      code: "VERSION_MISMATCH",
      message: `Expected scene graph version 2, got ${graph.version}`,
      severity: "error",
    });
  }

  if (!graph.canvas.planned?.width || !graph.canvas.planned?.height) {
    issues.push({
      code: "CANVAS_MISSING",
      message: "Canvas dimensions are required",
      severity: "error",
    });
  }

  if (!graph.product.planned && !graph.product.actual) {
    issues.push({
      code: "PRODUCT_MISSING",
      message: "Product node has neither planned nor actual geometry",
      severity: "warning",
    });
  }

  if (graph.product.planned && graph.product.actual) {
    const pw = graph.product.planned.width;
    const aw = graph.product.actual.width;
    if (pw > 0 && Math.abs(aw - pw) / pw > 0.5) {
      issues.push({
        code: "PRODUCT_WIDTH_DRIFT",
        message: `Product width drift ${(((aw - pw) / pw) * 100).toFixed(1)}% exceeds 50%`,
        severity: "warning",
      });
    }
  }

  const badgeCount = num(graph.badges.actual?.count);
  const maxBadges = num(graph.badges.actual?.maxAllowed, 99);
  if (badgeCount > maxBadges) {
    issues.push({
      code: "BADGE_OVERFLOW",
      message: `Badge count ${badgeCount} exceeds max ${maxBadges}`,
      severity: "warning",
    });
  }

  if (graph.stage === "after_compositor" && !graph.product.actual) {
    issues.push({
      code: "COMPOSITOR_ACTUAL_MISSING",
      message: "Compositor stage graph missing product.actual",
      severity: "warning",
    });
  }

  return {
    valid: !issues.some((issue) => issue.severity === "error"),
    issues,
  };
}

function computeProductArea(graph: SceneGraph, mode: "planned" | "actual"): number {
  const geom = mode === "actual" ? graph.product.actual : graph.product.planned;
  if (!geom) return 0;
  if (geom.visibleAreaRatio != null) return geom.visibleAreaRatio;
  const canvas = graph.canvas.actual ?? graph.canvas.planned;
  const area = geom.width * geom.height;
  return canvas.width * canvas.height > 0 ? area / (canvas.width * canvas.height) : 0;
}

/** Compare planned vs actual metrics between two graph stages. */
export function computeSceneGraphDrift(
  before: SceneGraph,
  after: SceneGraph,
): SceneGraphDriftReport {
  const plannedArea = computeProductArea(before, "planned");
  const actualArea = computeProductArea(after, "actual");
  const plannedWidth = before.product.planned?.width ?? 0;
  const actualWidth = after.product.actual?.width ?? 0;
  const plannedHeight = before.product.planned?.height ?? 0;
  const actualHeight = after.product.actual?.height ?? 0;

  const drift: SceneGraphDrift = {
    productAreaDrift: actualArea - plannedArea,
    productWidthDrift:
      plannedWidth > 0 ? (actualWidth - plannedWidth) / plannedWidth : 0,
    productHeightDrift:
      plannedHeight > 0 ? (actualHeight - plannedHeight) / plannedHeight : 0,
    whitespaceDrift:
      num(after.whitespace.actual?.whitespacePct) -
      num(before.whitespace.planned?.whitespacePct ?? before.whitespace.actual?.whitespacePct),
    overlayDensityDrift:
      num(after.overlay.actual?.density) - num(before.overlay.actual?.density),
    badgeCountDrift:
      num(after.badges.actual?.count) - num(before.badges.actual?.count),
    overlapDrift:
      num(after.composition.actual?.overlapPct) -
      num(before.composition.actual?.overlapPct),
  };

  const hasSignificantDrift =
    Math.abs(drift.productAreaDrift) >= DRIFT_THRESHOLD ||
    Math.abs(drift.productWidthDrift) >= DRIFT_THRESHOLD ||
    Math.abs(drift.whitespaceDrift) >= 10;

  return {
    fromStage: before.stage,
    toStage: after.stage,
    drift,
    hasSignificantDrift,
  };
}

export function validateSceneGraphPipeline(stages: Partial<Record<SceneGraphStage, SceneGraph>>): {
  stages: SceneGraphStage[];
  validations: Record<string, SceneGraphValidationResult>;
  drifts: SceneGraphDriftReport[];
} {
  const order: SceneGraphStage[] = ["planner", "after_compositor", "after_overlay", "final"];
  const present = order.filter((stage) => stages[stage] != null);
  const validations: Record<string, SceneGraphValidationResult> = {};
  const drifts: SceneGraphDriftReport[] = [];

  for (const stage of present) {
    const graph = stages[stage]!;
    validations[stage] = validateSceneGraph(graph);
  }

  for (let i = 1; i < present.length; i++) {
    const from = stages[present[i - 1]!]!;
    const to = stages[present[i]!]!;
    drifts.push(computeSceneGraphDrift(from, to));
  }

  return { stages: present, validations, drifts };
}
