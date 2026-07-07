import { mkdir, writeFile } from "fs/promises";
import path from "path";
import type { SceneGraph, SceneGraphDriftReport } from "./SceneGraph";

export type SceneGraphSnapshotSet = {
  before?: SceneGraph;
  afterCompositor?: SceneGraph;
  afterOverlay?: SceneGraph;
  final?: SceneGraph;
  drifts?: SceneGraphDriftReport[];
  constitutionMirror?: import("./SceneGraphConstitutionMirror").SceneGraphConstitutionMirrorResult;
  whitespaceAttribution?: import("./SceneGraphWhitespaceAttribution").SceneGraphWhitespaceAttributionResult;
};

export type SceneGraphSerializeOptions = {
  pretty?: boolean;
};

/** Serialize SceneGraph to JSON string. */
export function serializeSceneGraph(
  graph: SceneGraph,
  options?: SceneGraphSerializeOptions,
): string {
  return JSON.stringify(graph, null, options?.pretty === false ? undefined : 2);
}

/** Serialize full snapshot set for debug bundle. */
export function serializeSceneGraphSnapshots(snapshots: SceneGraphSnapshotSet): {
  sceneGraphBefore: SceneGraph | undefined;
  sceneGraphAfterCompositor: SceneGraph | undefined;
  sceneGraphAfterOverlay: SceneGraph | undefined;
  sceneGraphFinal: SceneGraph | undefined;
  sceneGraphDrifts: SceneGraphDriftReport[] | undefined;
} {
  return {
    sceneGraphBefore: snapshots.before,
    sceneGraphAfterCompositor: snapshots.afterCompositor,
    sceneGraphAfterOverlay: snapshots.afterOverlay,
    sceneGraphFinal: snapshots.final,
    sceneGraphDrifts: snapshots.drifts,
  };
}

const SNAPSHOT_FILES = {
  before: "sceneGraphBefore.json",
  afterCompositor: "sceneGraphAfterCompositor.json",
  afterOverlay: "sceneGraphAfterOverlay.json",
  final: "sceneGraphFinal.json",
  drifts: "sceneGraphDrifts.json",
  constitutionMirror: "sceneGraphConstitutionMirror.json",
  whitespaceAttribution: "sceneGraphWhitespaceAttribution.json",
} as const;

/** Write scene graph JSON files alongside daos-debug-bundle. */
export async function writeSceneGraphSnapshots(
  projectId: string,
  runId: string,
  snapshots: SceneGraphSnapshotSet,
  options?: { baseDir?: string },
): Promise<{ written: string[]; errors: string[] }> {
  const dir = path.join(
    options?.baseDir ?? process.cwd(),
    "generated",
    "daos-debug",
    projectId,
    runId,
  );
  const written: string[] = [];
  const errors: string[] = [];

  await mkdir(dir, { recursive: true });

  const entries: Array<
    [keyof typeof SNAPSHOT_FILES, SceneGraph | SceneGraphDriftReport[] | Record<string, unknown> | undefined]
  > = [
    ["before", snapshots.before],
    ["afterCompositor", snapshots.afterCompositor],
    ["afterOverlay", snapshots.afterOverlay],
    ["final", snapshots.final],
    ["drifts", snapshots.drifts],
    ["constitutionMirror", snapshots.constitutionMirror],
    ["whitespaceAttribution", snapshots.whitespaceAttribution],
  ];

  for (const [key, payload] of entries) {
    if (!payload) continue;
    const filePath = path.join(dir, SNAPSHOT_FILES[key]);
    try {
      await writeFile(filePath, JSON.stringify(payload, null, 2), "utf8");
      written.push(path.join("generated", "daos-debug", projectId, runId, SNAPSHOT_FILES[key]));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }

  return { written, errors };
}
