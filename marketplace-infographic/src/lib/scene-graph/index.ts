export {
  createSceneNode,
  appendNodeHistory,
  mergeActual,
  mergeCompositorActual,
  type SceneNode,
  type SceneGeometry,
  type SceneGeometryActual,
  type SceneStateSource,
  type SceneNodeHistoryEntry,
} from "./SceneNode";

export {
  SCENE_GRAPH_VERSION,
  type SceneGraph,
  type SceneGraphStage,
  type SceneGraphDrift,
  type SceneGraphDriftReport,
  type ProductNode,
  type OverlayNode,
  type TypographyNode,
  type BadgeNode,
  type WhitespaceNode,
} from "./SceneGraph";

export {
  buildSceneGraph,
  advanceSceneGraph,
  writeCompositorProductActual,
  type SceneGraphBuildInput,
} from "./SceneGraphBuilder";

export {
  isDaosSceneGraphOverlayUsesActual,
  shouldOverlayUseSceneGraphActual,
  resolveOverlayActualGateDecision,
  extractProductActualFromSceneGraph,
  productActualToOverlayBbox,
  resolveOverlayProductBbox,
  countTextZoneOverlapsWithProduct,
  moveTextZonesAwayFromProductBbox,
  buildOverlaySceneGraphDiagnostics,
  type SceneGraphProductActual,
  type OverlayProductBbox,
  type OverlaySceneGraphDiagnostics,
  type OverlaySceneGraphGateContext,
} from "./product-actual-bridge";

export {
  shouldUseSceneGraphActualForOverlay,
  explainSceneGraphActualOverlayDecision,
  estimateOverlayOverlapRisk,
  estimateLaw003RegressionWithActual,
  type OverlayActualGateInput,
  type OverlayActualGateResult,
  type OverlayActualGateDecision,
} from "./overlay-actual-gate";

export {
  validateSceneGraph,
  computeSceneGraphDrift,
  validateSceneGraphPipeline,
  type SceneGraphValidationResult,
  type SceneGraphValidationIssue,
} from "./SceneGraphValidator";

export {
  serializeSceneGraph,
  serializeSceneGraphSnapshots,
  writeSceneGraphSnapshots,
  type SceneGraphSnapshotSet,
} from "./SceneGraphSerializer";

export {
  evaluateSceneGraphLaw003,
  evaluateSceneGraphLaw014,
  evaluateSceneGraphConstitutionMirror,
  type SceneGraphConstitutionMirrorResult,
  type SceneGraphLaw003MirrorResult,
  type SceneGraphLaw014MirrorResult,
  type SceneGraphConstitutionSource,
} from "./SceneGraphConstitutionMirror";

export {
  evaluateSceneGraphLaw003V2,
  compareLaw003V1V2,
  SCENE_GRAPH_LAW003_V2_VERSION,
  type SceneGraphLaw003V2Result,
  type SceneGraphLaw003V2Metrics,
} from "./SceneGraphLaw003V2";

export {
  analyzeSceneGraphWhitespaceAttribution,
  summarizeSceneGraphWhitespaceAttribution,
  type SceneGraphWhitespaceAttributionResult,
  type SceneGraphWhitespaceAttributionSummary,
  type WhitespacePrimaryCause,
} from "./SceneGraphWhitespaceAttribution";

/** Feature flag: DAOS_SCENE_GRAPH_V2=1 (default OFF). Phase 1 mirror mode only. */
export function isDaosSceneGraphV2Enabled(): boolean {
  return process.env.DAOS_SCENE_GRAPH_V2 === "1";
}
