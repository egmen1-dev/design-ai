/** DAOS v2 — unified scene node with planned/actual dual state */

export type SceneStateSource =
  | "planner"
  | "compositor"
  | "scene-compositor"
  | "overlay"
  | "constitution"
  | "mirror"
  | "unknown";

export type SceneGeometry = {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
  layer?: number;
};

export type SceneGeometryActual = SceneGeometry & {
  visibleArea?: number;
  visibleAreaRatio?: number;
  alphaBBox?: SceneGeometry;
  shadowBBox?: SceneGeometry;
};

export type SceneNodeHistoryEntry = {
  stage: string;
  at: string;
  source: SceneStateSource;
  snapshot: Partial<SceneGeometryActual>;
};

export type SceneNode<TActual extends SceneGeometryActual = SceneGeometryActual> = {
  id: string;
  type: string;
  planned?: SceneGeometry;
  actual?: TActual;
  confidence: number;
  source: SceneStateSource;
  history: SceneNodeHistoryEntry[];
};

export function createSceneNode(input: {
  id: string;
  type: string;
  planned?: SceneGeometry;
  actual?: SceneGeometryActual;
  confidence?: number;
  source?: SceneStateSource;
  history?: SceneNodeHistoryEntry[];
}): SceneNode {
  return {
    id: input.id,
    type: input.type,
    planned: input.planned,
    actual: input.actual,
    confidence: input.confidence ?? (input.actual ? 0.9 : input.planned ? 0.7 : 0),
    source: input.source ?? "unknown",
    history: input.history ?? [],
  };
}

export function appendNodeHistory(
  node: SceneNode,
  entry: Omit<SceneNodeHistoryEntry, "at"> & { at?: string },
): SceneNode {
  return {
    ...node,
    history: [
      ...node.history,
      {
        ...entry,
        at: entry.at ?? new Date().toISOString(),
      },
    ],
  };
}

export function mergeActual(
  node: SceneNode,
  actual: Partial<SceneGeometryActual>,
  source: SceneStateSource,
  stage: string,
): SceneNode {
  const nextActual = { ...node.actual, ...actual } as SceneGeometryActual;
  return appendNodeHistory(
    {
      ...node,
      actual: nextActual,
      source,
      confidence: Math.max(node.confidence, 0.85),
    },
    { stage, source, snapshot: actual },
  );
}

/** Stage 2 — compositor writes factual product placement with fixed confidence. */
export function mergeCompositorActual(
  node: SceneNode,
  actual: Partial<SceneGeometryActual>,
  stage: string,
): SceneNode {
  const nextActual = { ...node.actual, ...actual } as SceneGeometryActual;
  return appendNodeHistory(
    {
      ...node,
      actual: nextActual,
      source: "scene-compositor",
      confidence: 0.95,
    },
    { stage, source: "scene-compositor", snapshot: actual },
  );
}
