import { join } from "node:path";
import { Kernel } from "@/lib/kernel/Kernel";
import type { IPlatform, IPlugin, IProvider } from "@/lib/platform-core/interfaces";
import type { IProjectState } from "@/lib/platform-core/interfaces/IProjectState";
import type { ProjectContext } from "@/lib/platform-core/context/ProjectContext";
import { DaosConfig } from "@/lib/daos/config/DaosConfig";
import { DaosRegistry } from "@/lib/daos/registry/DaosRegistry";
import { DaosEventBus } from "@/lib/daos/events/DaosEventBus";
import { DebugBundle } from "@/lib/daos/debug/DebugBundle";
import { DaosRuntime } from "@/lib/daos/runtime/Runtime";
import {
  LegacyDesignPipelineAdapter,
  LegacyOverlayAdapter,
  LegacyPromptAdapter,
  LegacyRenderAdapter,
} from "@/lib/daos/adapters";

const DEFAULT_CONFIG_DIR = join(process.cwd(), "config");

export interface DaosCoreOptions {
  readonly configDir?: string;
  readonly runtimeEnabled?: boolean;
}

/**
 * DAOS Core — Wave 1 foundation beside legacy pipeline.
 * Expand first. Replace later.
 */
export class DaosCore {
  private readonly kernel: Kernel;
  readonly config: DaosConfig;
  readonly registry: DaosRegistry;
  readonly events: DaosEventBus;
  readonly runtime: DaosRuntime;
  readonly debug: DebugBundle;
  readonly adapters: {
    readonly designPipeline: LegacyDesignPipelineAdapter;
    readonly prompt: LegacyPromptAdapter;
    readonly render: LegacyRenderAdapter;
    readonly overlay: LegacyOverlayAdapter;
  };

  private initialized = false;

  constructor(options: DaosCoreOptions = {}) {
    const configDir = options.configDir ?? DEFAULT_CONFIG_DIR;
    this.kernel = new Kernel({ configDir });
    this.config = new DaosConfig(this.kernel.configuration);
    this.registry = new DaosRegistry(this.kernel.registry);
    this.events = new DaosEventBus();
    this.debug = new DebugBundle();
    this.runtime = new DaosRuntime(this.kernel, this.events, {
      enabled: options.runtimeEnabled ?? false,
    });
    this.adapters = Object.freeze({
      designPipeline: new LegacyDesignPipelineAdapter(),
      prompt: new LegacyPromptAdapter(),
      render: new LegacyRenderAdapter(),
      overlay: new LegacyOverlayAdapter(),
    });
  }

  async initialize(configDir = DEFAULT_CONFIG_DIR): Promise<void> {
    await this.kernel.initialize(configDir);
    this.initialized = true;
    this.events.emit("daos:initialized", {
      architectureVersion: this.config.getArchitectureVersion(),
    });
  }

  createProject(context: ProjectContext): IProjectState {
    this.assertReady();
    const state = this.kernel.createProject(context);
    this.debug.record("project", "created", {
      projectId: context.projectId,
      runId: context.runId,
    });
    return state;
  }

  registerPlatform(platform: IPlatform): void {
    this.assertReady();
    this.kernel.registerPlatform(platform);
  }

  registerProvider(provider: IProvider): void {
    this.assertReady();
    this.kernel.registerProvider(provider);
  }

  registerPlugin(plugin: IPlugin): void {
    this.assertReady();
    this.kernel.registerPlugin(plugin);
  }

  /** Rollback — disable runtime, legacy path continues. */
  disableRuntime(): void {
    this.runtime.disable();
  }

  enableRuntime(): void {
    this.runtime.enable();
  }

  async shutdown(): Promise<void> {
    this.debug.record("daos", "shutdown", { events: this.events.count() });
    await this.kernel.shutdown();
    this.initialized = false;
  }

  private assertReady(): void {
    if (!this.initialized) {
      throw new Error("DaosCore not initialized — call initialize() first");
    }
  }
}
