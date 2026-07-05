import type { IProjectState } from "./IProjectState";

export interface PlatformExecutionInput {
  readonly state: IProjectState;
}

export interface PlatformExecutionResult {
  readonly state: IProjectState;
}

/** Platform contract — business intelligence only; no runtime orchestration. */
export interface IPlatform {
  readonly id: string;
  readonly version: string;
  execute(input: PlatformExecutionInput): PlatformExecutionResult | Promise<PlatformExecutionResult>;
}
