import type { IProjectState } from "../interfaces/IProjectState";
import type { ProjectContext } from "../context/ProjectContext";
import { createProjectContext } from "../context/ProjectContext";
import {
  createProjectStateData,
  type DecisionTraceEntry,
  type ProjectStateData,
} from "./types";

function freezeState(state: ProjectState): IProjectState {
  return Object.freeze(state);
}

/** Immutable ProjectState — single shared state for all platforms. */
export class ProjectState implements IProjectState {
  readonly context: ProjectContext;
  readonly data: ProjectStateData;
  readonly version: number;

  private constructor(context: ProjectContext, data: ProjectStateData, version: number) {
    this.context = context;
    this.data = data;
    this.version = version;
  }

  static create(
    context: ProjectContext,
    data: Partial<ProjectStateData> = {},
    version = 1,
  ): IProjectState {
    return freezeState(
      new ProjectState(createProjectContext(context), createProjectStateData(data), version),
    );
  }

  withData(patch: Partial<ProjectStateData>): IProjectState {
    return freezeState(
      new ProjectState(this.context, createProjectStateData({ ...this.data, ...patch }), this.version + 1),
    );
  }

  withContext(patch: Partial<ProjectContext>): IProjectState {
    return freezeState(
      new ProjectState(
        createProjectContext({ ...this.context, ...patch }),
        this.data,
        this.version + 1,
      ),
    );
  }

  withDecision(entry: DecisionTraceEntry): IProjectState {
    return this.withData({
      decisionTrace: Object.freeze([...this.data.decisionTrace, Object.freeze(entry)]),
    });
  }
}

export type { ProjectStateData, DecisionTraceEntry };
