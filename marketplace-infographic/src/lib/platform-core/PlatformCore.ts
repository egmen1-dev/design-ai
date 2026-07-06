import { ArchitectureRegistry } from "./registry/ArchitectureRegistry";
import { ConfigurationManager } from "./configuration/ConfigurationManager";
import { VersionManager } from "./versioning/VersionManager";
import { ProjectLifecycle } from "./lifecycle/ProjectLifecycle";
import { ProjectState } from "./project-state/ProjectState";
import type { IProjectState } from "./interfaces/IProjectState";
import type { ProjectContext } from "./context/ProjectContext";
import { createProjectContext } from "./context/ProjectContext";

export interface PlatformCoreOptions {
  readonly configDir?: string;
}

/**
 * Platform Core — foundation of Design AI OS.
 * Zero business logic. Registration, state, config, versioning only.
 */
export class PlatformCore {
  readonly registry: ArchitectureRegistry;
  readonly versions: VersionManager;
  readonly configuration: ConfigurationManager;
  readonly lifecycle: ProjectLifecycle;

  constructor(options: PlatformCoreOptions = {}) {
    this.registry = new ArchitectureRegistry();
    this.versions = new VersionManager();
    this.configuration = new ConfigurationManager();
    this.lifecycle = new ProjectLifecycle();
    if (options.configDir) {
      this.configuration.loadFromDirectory(options.configDir);
    }
  }

  createProjectState(context: ProjectContext): IProjectState {
    const start = performance.now();
    const state = ProjectState.create(createProjectContext(context));
    const elapsed = performance.now() - start;
    if (elapsed > 5) {
      console.warn(`ProjectState creation exceeded 5ms: ${elapsed.toFixed(2)}ms`);
    }
    return state;
  }

  resolvePlatform(id: string) {
    const start = performance.now();
    const platform = this.registry.platforms.resolvePlatform(id);
    const elapsed = performance.now() - start;
    if (elapsed > 1) {
      console.warn(`Registry lookup exceeded 1ms: ${elapsed.toFixed(2)}ms`);
    }
    return platform;
  }
}

export {
  ProjectState,
  ArchitectureRegistry,
  ConfigurationManager,
  VersionManager,
  ProjectLifecycle,
  createProjectContext,
};
export type { IProjectState, ProjectContext };
