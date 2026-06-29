import type { AgentMeta } from "../types";
import {
  runMaterialDirector,
  type MaterialDirectorInput,
} from "@/lib/design/visual-pipeline/directors/material";
import type { DirectorResult, MaterialDecision } from "@/lib/design/visual-pipeline/types";

export const MATERIAL_DIRECTOR_AGENT: AgentMeta = {
  id: "material-director",
  name: "Material Director",
  version: "1.0.0",
};

export function runMaterialDirectorAgent(
  input: MaterialDirectorInput,
): DirectorResult<MaterialDecision> {
  return runMaterialDirector(input);
}
