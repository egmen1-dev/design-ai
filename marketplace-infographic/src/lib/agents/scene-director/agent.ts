import type { DesignAgent } from "../types";
import { runSceneDirector } from "@/lib/design/scene-blueprint";
import type { SceneDirectorInput, SceneDirectorResult } from "@/lib/design/scene-blueprint";

export const SCENE_DIRECTOR_AGENT: DesignAgent<SceneDirectorInput, SceneDirectorResult> = {
  id: "scene-director",
  name: "Scene Director",
  version: "1.0.0",
  run: (input) => runSceneDirector(input),
};

export { runSceneDirector };
export type { SceneDirectorInput, SceneDirectorResult };
