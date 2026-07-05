import type { IPlatform, IPlugin, IProvider } from "@/lib/platform-core/interfaces";
import type { IProjectState } from "@/lib/platform-core/interfaces/IProjectState";
import type { ProjectContext } from "@/lib/platform-core/context/ProjectContext";

export type KernelPhase = "created" | "initializing" | "ready" | "executing" | "shutting_down" | "stopped";

export interface KernelHealthStatus {
  readonly phase: KernelPhase;
  readonly ready: boolean;
  readonly uptimeMs: number;
  readonly platformCount: number;
  readonly providerCount: number;
  readonly eventCount: number;
}

export interface KernelExecuteInput {
  readonly state: IProjectState;
  readonly platformId: string;
}

export interface KernelExecuteResult {
  readonly state: IProjectState;
  readonly platformId: string;
  readonly durationMs: number;
}

export interface KernelOptions {
  readonly configDir?: string;
}

export type { IPlatform, IProvider, IPlugin, IProjectState, ProjectContext };
