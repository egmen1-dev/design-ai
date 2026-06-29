import type { AgentMeta } from "../types";
import {
  runCameraDirector,
  type CameraDirectorInput,
} from "@/lib/design/visual-pipeline/directors/camera";
import type { CameraDecision, DirectorResult } from "@/lib/design/visual-pipeline/types";

export const CAMERA_DIRECTOR_AGENT: AgentMeta = {
  id: "camera-director",
  name: "Camera Director",
  version: "1.0.0",
};

export function runCameraDirectorAgent(
  input: CameraDirectorInput,
): DirectorResult<CameraDecision> {
  return runCameraDirector(input);
}
