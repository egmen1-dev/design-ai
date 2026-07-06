import type { ConfigurationManager } from "@/lib/platform-core/configuration/ConfigurationManager";

/** Configuration service — loads architecture.yaml views. Nothing hardcoded. */
export class KernelConfiguration {
  constructor(private readonly configuration: ConfigurationManager) {}

  loadFromDirectory(configDir: string): void {
    this.configuration.loadFromDirectory(configDir);
  }

  get(name: string): Record<string, unknown> {
    return this.configuration.get(name as Parameters<ConfigurationManager["get"]>[0]);
  }

  has(name: string): boolean {
    return this.configuration.has(name as Parameters<ConfigurationManager["has"]>[0]);
  }
}
