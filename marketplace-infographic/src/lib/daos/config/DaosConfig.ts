import type { KernelConfiguration } from "@/lib/kernel/KernelConfiguration";

/** DAOS configuration facade — no hardcoded runtime values in Wave 1. */
export class DaosConfig {
  constructor(private readonly configuration: KernelConfiguration) {}

  has(name: string): boolean {
    return this.configuration.has(name);
  }

  get<T = unknown>(name: string): T {
    return this.configuration.get(name) as T;
  }

  getArchitectureVersion(): string {
    try {
      const arch = this.get<{ version?: string }>("architecture");
      return arch.version ?? "2.0";
    } catch {
      return "2.0";
    }
  }
}
