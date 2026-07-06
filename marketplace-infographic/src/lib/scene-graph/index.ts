export {
  createSceneNode,
  appendNodeHistory,
  mergeActual,
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
  type SceneGraphBuildInput,
} from "./SceneGraphBuilder";

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

/** Feature flag: DAOS_SCENE_GRAPH_V2=1 (default OFF). Phase 1 mirror mode only. */
export function isDaosSceneGraphV2Enabled(): boolean {
  return process.env.DAOS_SCENE_GRAPH_V2 === "1";
}
