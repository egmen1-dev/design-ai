import type { IProjectState } from "../interfaces/IProjectState";

/** Runtime execution context bound to a project run. */
export interface ExecutionContext {
  readonly state: IProjectState;
  readonly startedAt: string;
  readonly traceId: string;
}

export function createExecutionContext(
  state: IProjectState,
  traceId: string,
): ExecutionContext {
  return Object.freeze({
    state,
    startedAt: new Date().toISOString(),
    traceId,
  });
}
