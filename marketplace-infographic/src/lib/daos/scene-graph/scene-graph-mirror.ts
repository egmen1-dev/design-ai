import type { CompositionLayout } from "@/lib/composition/types";
import type { InfographicData } from "@/lib/infographic-template";
import type { LayoutSpec } from "@/lib/design/layout-spec";
import type { NormalizedCompositePlacement } from "@/lib/daos/compositor/composite-result-bridge";
import type { OverlayQualityAudit } from "@/lib/daos/audit/overlay-quality-audit";
import type { Law003RecalibrationReport } from "@/lib/daos/governance/law003-recalibration";
import {
  buildSceneGraph,
  advanceSceneGraph,
  computeSceneGraphDrift,
  validateSceneGraphPipeline,
  serializeSceneGraphSnapshots,
  writeSceneGraphSnapshots,
  isDaosSceneGraphV2Enabled,
  type SceneGraph,
  type SceneGraphDriftReport,
  type SceneGraphSnapshotSet,
} from "@/lib/scene-graph";

export type SceneGraphMirrorContext = {
  projectId: string;
  runId: string;
};

export type SceneGraphMirrorInput = {
  compositionLayout?: CompositionLayout;
  layoutSpec?: LayoutSpec;
  infographicData?: InfographicData;
  compositePlacement?: NormalizedCompositePlacement;
  overlayAudit?: OverlayQualityAudit;
  law003Recalibration?: Law003RecalibrationReport;
  productCategory?: string;
  layoutMode?: string;
};

/** Phase 1 mirror — records pipeline state into SceneGraph without changing behavior. */
export class SceneGraphMirror {
  private readonly enabled: boolean;
  private readonly context: SceneGraphMirrorContext;
  private readonly graphId: string;
  private before?: SceneGraph;
  private afterCompositor?: SceneGraph;
  private afterOverlay?: SceneGraph;
  private final?: SceneGraph;
  private drifts: SceneGraphDriftReport[] = [];

  constructor(context: SceneGraphMirrorContext) {
    this.enabled = isDaosSceneGraphV2Enabled();
    this.context = context;
    this.graphId = `${context.projectId}-${context.runId}`;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  capturePlanner(input: SceneGraphMirrorInput): void {
    if (!this.enabled) return;
    this.before = buildSceneGraph({
      id: this.graphId,
      stage: "planner",
      ...input,
    });
  }

  captureAfterCompositor(input: SceneGraphMirrorInput): void {
    if (!this.enabled || !this.before) return;
    this.afterCompositor = advanceSceneGraph(this.before, {
      stage: "after_compositor",
      ...input,
    });
    this.drifts.push(computeSceneGraphDrift(this.before, this.afterCompositor));
  }

  captureAfterOverlay(input: SceneGraphMirrorInput): void {
    if (!this.enabled) return;
    const base = this.afterCompositor ?? this.before;
    if (!base) return;
    this.afterOverlay = advanceSceneGraph(base, {
      stage: "after_overlay",
      ...input,
    });
    this.drifts.push(computeSceneGraphDrift(base, this.afterOverlay));
  }

  captureFinal(input: SceneGraphMirrorInput): void {
    if (!this.enabled) return;
    const base = this.afterOverlay ?? this.afterCompositor ?? this.before;
    if (!base) return;
    this.final = advanceSceneGraph(base, {
      stage: "final",
      ...input,
    });
    this.drifts.push(computeSceneGraphDrift(base, this.final));
  }

  getSnapshots(): SceneGraphSnapshotSet {
    return {
      before: this.before,
      afterCompositor: this.afterCompositor,
      afterOverlay: this.afterOverlay,
      final: this.final,
      drifts: this.drifts.length > 0 ? this.drifts : undefined,
    };
  }

  getPipelineValidation() {
    if (!this.enabled) return undefined;
    const snapshots = this.getSnapshots();
    return validateSceneGraphPipeline({
      planner: snapshots.before,
      after_compositor: snapshots.afterCompositor,
      after_overlay: snapshots.afterOverlay,
      final: snapshots.final,
    });
  }

  getSerializedSnapshots() {
    return serializeSceneGraphSnapshots(this.getSnapshots());
  }

  getDriftSummary(): {
    productAreaDrift: number;
    whitespaceDrift: number;
    hasSignificantDrift: boolean;
  } | undefined {
    if (!this.enabled || this.drifts.length === 0) return undefined;
    const total = this.drifts.reduce(
      (acc, report) => ({
        productAreaDrift: acc.productAreaDrift + report.drift.productAreaDrift,
        whitespaceDrift: acc.whitespaceDrift + report.drift.whitespaceDrift,
        hasSignificantDrift: acc.hasSignificantDrift || report.hasSignificantDrift,
      }),
      { productAreaDrift: 0, whitespaceDrift: 0, hasSignificantDrift: false },
    );
    return total;
  }

  async writeSnapshots(): Promise<{ written: string[]; errors: string[] }> {
    if (!this.enabled) return { written: [], errors: [] };
    return writeSceneGraphSnapshots(
      this.context.projectId,
      this.context.runId,
      this.getSnapshots(),
    );
  }
}

export function createSceneGraphMirror(context: SceneGraphMirrorContext): SceneGraphMirror {
  return new SceneGraphMirror(context);
}
