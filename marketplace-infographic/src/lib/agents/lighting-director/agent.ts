import type { AgentMeta } from "../types";
import {
  runLightingDirector,
  type LightingDirectorInput,
} from "@/lib/design/visual-pipeline/directors/lighting";
import type { DirectorResult } from "@/lib/design/visual-pipeline/types";
import type { LightingDecision } from "@/lib/design/visual-pipeline/types";

export const LIGHTING_DIRECTOR_AGENT: AgentMeta = {
  id: "lighting-director",
  name: "Lighting Director",
  version: "1.0.0",
};

export function runLightingDirectorAgent(
  input: LightingDirectorInput,
): DirectorResult<LightingDecision> {
  return runLightingDirector(input);
}
