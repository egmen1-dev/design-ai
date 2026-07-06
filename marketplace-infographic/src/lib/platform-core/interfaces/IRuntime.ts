import type { IProjectState } from "./IProjectState";
import type { IPlatform } from "./IPlatform";

export interface RuntimeExecutionInput {
  readonly state: IProjectState;
  readonly platformId: string;
}

export interface RuntimeExecutionResult {
  readonly state: IProjectState;
}

/** Runtime orchestration contract — sole pipeline executor. */
export interface IRuntime {
  readonly id: string;
  readonly version: string;
  execute(input: RuntimeExecutionInput): RuntimeExecutionResult | Promise<RuntimeExecutionResult>;
}

export type { IPlatform };
