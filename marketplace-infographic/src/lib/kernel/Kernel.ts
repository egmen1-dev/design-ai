import { join } from "node:path";
import { PlatformCore } from "@/lib/platform-core/PlatformCore";
import type { IPlatform, IPlugin, IProvider } from "@/lib/platform-core/interfaces";
import type { IProjectState } from "@/lib/platform-core/interfaces/IProjectState";
import type { ProjectContext } from "@/lib/platform-core/context/ProjectContext";
import { KernelConfiguration } from "./KernelConfiguration";
import { KernelEvents } from "./KernelEvents";
import { KernelHealth } from "./KernelHealth";
import { KernelLifecycle } from "./KernelLifecycle";
import { KernelMetrics } from "./KernelMetrics";
import { KernelRegistry } from "./KernelRegistry";
import { KernelRuntime } from "./KernelRuntime";
import type { KernelExecuteInput, KernelExecuteResult, KernelHealthStatus, KernelOptions } from "./types";

const DEFAULT_CONFIG = join(process.cwd(), "config");

/**
 * DAOS Kernel — heart of Design AI OS.
 * Owns orchestration. Never owns business logic.
 * Every execution passes through the Kernel.
 */
export class Kernel {
  private readonly core: PlatformCore;
  readonly registry: KernelRegistry;
  readonly configuration: KernelConfiguration;
  readonly events: KernelEvents;
  readonly metrics: KernelMetrics;
  readonly health: KernelHealth;
  private readonly lifecycle: KernelLifecycle;
  private readonly runtime: KernelRuntime;
  private initialized = false;

  constructor(options: KernelOptions = {}) {
    this.core = new PlatformCore({ configDir: options.configDir });
    this.registry = new KernelRegistry(this.core.registry);
    this.configuration = new KernelConfiguration(this.core.configuration);
    this.events = new KernelEvents();
    this.metrics = new KernelMetrics();
    this.health = new KernelHealth();
    this.lifecycle = new KernelLifecycle(
      this.configuration,
      this.registry,
      this.events,
      this.metrics,
      this.health,
    );
    this.runtime = new KernelRuntime(this.registry, this.events, this.metrics);
  }

  async initialize(configDir = DEFAULT_CONFIG): Promise<void> {
    await this.lifecycle.startup(configDir);
    this.initialized = true;
  }

  registerPlatform(platform: IPlatform): void {
    this.assertReady();
    this.registry.registerPlatform(platform);
  }

  registerProvider(provider: IProvider): void {
    this.assertReady();
    this.registry.registerProvider(provider);
  }

  registerPlugin(plugin: IPlugin): void {
    this.assertReady();
    this.registry.registerPlugin(plugin);
  }

  createProject(context: ProjectContext): IProjectState {
    this.assertReady();
    const state = this.core.createProjectState(context);
    this.events.emit("project:created", { projectId: context.projectId, runId: context.runId });
    this.metrics.increment("projects.created");
    return state;
  }

  async execute(input: KernelExecuteInput): Promise<KernelExecuteResult> {
    this.assertReady();
    this.health.setPhase("executing");
    try {
      return await this.runtime.execute(input);
    } finally {
      this.health.setPhase("ready");
    }
  }

  async shutdown(): Promise<void> {
    await this.lifecycle.shutdown();
    this.initialized = false;
  }

  getHealth(): KernelHealthStatus {
    return this.health.status(this.registry, this.events);
  }

  /** Version manager — delegated from platform-core. */
  get versions() {
    return this.core.versions;
  }

  private assertReady(): void {
    if (!this.initialized) {
      throw new Error("Kernel not initialized — call initialize() first");
    }
  }
}

export default Kernel;
