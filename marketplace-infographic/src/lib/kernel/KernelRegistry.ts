import type { ArchitectureRegistry } from "@/lib/platform-core/registry/ArchitectureRegistry";
import type { IPlatform, IPlugin, IProvider } from "@/lib/platform-core/interfaces";

/** Registry service — platforms, providers, plugins. No business logic. */
export class KernelRegistry {
  constructor(private readonly registry: ArchitectureRegistry) {}

  registerPlatform(platform: IPlatform): void {
    this.registry.platforms.register(platform.id, platform);
  }

  registerProvider(provider: IProvider): void {
    this.registry.providers.register(provider.id, provider);
  }

  registerPlugin(plugin: IPlugin): void {
    this.registry.plugins.register(plugin.id, plugin);
  }

  resolvePlatform(id: string): IPlatform {
    return this.registry.platforms.resolvePlatform(id);
  }

  resolveProvider(id: string): IProvider {
    return this.registry.providers.resolveProvider(id);
  }

  platformCount(): number {
    return this.registry.platforms.list().length;
  }

  providerCount(): number {
    return this.registry.providers.list().length;
  }
}
