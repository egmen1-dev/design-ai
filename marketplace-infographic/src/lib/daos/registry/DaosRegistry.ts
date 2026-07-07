import type { KernelRegistry } from "@/lib/kernel/KernelRegistry";
import type { IPlatform, IPlugin, IProvider } from "@/lib/platform-core/interfaces";

/** Registry facade — platforms register themselves; kernel never imports extensions. */
export class DaosRegistry {
  constructor(private readonly registry: KernelRegistry) {}

  registerPlatform(platform: IPlatform): void {
    this.registry.registerPlatform(platform);
  }

  registerProvider(provider: IProvider): void {
    this.registry.registerProvider(provider);
  }

  registerPlugin(plugin: IPlugin): void {
    this.registry.registerPlugin(plugin);
  }

  hasPlatform(id: string): boolean {
    try {
      this.registry.resolvePlatform(id);
      return true;
    } catch {
      return false;
    }
  }

  resolvePlatform(id: string): IPlatform {
    return this.registry.resolvePlatform(id);
  }

  platformCount(): number {
    return this.registry.platformCount();
  }
}
