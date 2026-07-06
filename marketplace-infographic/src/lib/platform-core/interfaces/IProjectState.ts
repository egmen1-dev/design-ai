import type { ProjectContext } from "../context/ProjectContext";
import type { ProjectStateData } from "../project-state/ProjectState";

/** Immutable shared project state — sole cross-platform state container. */
export interface IProjectState {
  readonly context: ProjectContext;
  readonly data: ProjectStateData;
  readonly version: number;
  withData(patch: Partial<ProjectStateData>): IProjectState;
  withContext(patch: Partial<ProjectContext>): IProjectState;
}
