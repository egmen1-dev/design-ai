import type { IProjectState } from "../interfaces/IProjectState";

export type ProjectLifecyclePhase =
  | "created"
  | "running"
  | "paused"
  | "completed"
  | "failed"
  | "archived";

export interface LifecycleTransition {
  readonly phase: ProjectLifecyclePhase;
  readonly timestamp: string;
}

/** Project lifecycle tracking — no business logic. */
export class ProjectLifecycle {
  private phase: ProjectLifecyclePhase = "created";
  private readonly history: LifecycleTransition[] = [];

  getPhase(): ProjectLifecyclePhase {
    return this.phase;
  }

  transition(phase: ProjectLifecyclePhase): void {
    this.phase = phase;
    this.history.push(Object.freeze({ phase, timestamp: new Date().toISOString() }));
  }

  getHistory(): readonly LifecycleTransition[] {
    return Object.freeze([...this.history]);
  }

  applyToState(state: IProjectState): IProjectState {
    return state.withData({
      project: Object.freeze({
        ...state.data.project,
        lifecyclePhase: this.phase,
      }),
    });
  }
}
