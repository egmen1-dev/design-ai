import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const CONFIG_FILES = [
  "architecture",
  "runtime",
  "providers",
  "platforms",
  "marketplaces",
  "learning",
  "plugins",
] as const;

export type ConfigurationName = (typeof CONFIG_FILES)[number];

/** Minimal YAML parser for flat/nested config documents (no external dependency). */
function parseSimpleYaml(content: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  const stack: { indent: number; obj: Record<string, unknown> }[] = [
    { indent: -1, obj: root },
  ];

  for (const line of content.split("\n")) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const indent = line.search(/\S/);
    const trimmed = line.trim();
    if (trimmed.startsWith("- ")) {
      const parent = stack[stack.length - 1]?.obj;
      const lastKey = Object.keys(parent).pop();
      if (!lastKey) continue;
      const existing = parent[lastKey];
      const arr = Array.isArray(existing) ? existing : [];
      arr.push(trimmed.slice(2).trim().replace(/^["']|["']$/g, ""));
      parent[lastKey] = arr;
      continue;
    }
    const colon = trimmed.indexOf(":");
    if (colon === -1) continue;
    const key = trimmed.slice(0, colon).trim();
    const value = trimmed.slice(colon + 1).trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1]!.indent) {
      stack.pop();
    }
    const current = stack[stack.length - 1]!.obj;
    if (!value) {
      const child: Record<string, unknown> = {};
      current[key] = child;
      stack.push({ indent, obj: child });
    } else {
      current[key] =
        value === "true" ? true : value === "false" ? false : value.replace(/^["']|["']$/g, "");
    }
  }
  return root;
}

/** Loads architecture config files — nothing hardcoded. */
export class ConfigurationManager {
  private readonly store = new Map<ConfigurationName, Record<string, unknown>>();

  register(name: ConfigurationName, data: Record<string, unknown>): void {
    this.store.set(name, Object.freeze(structuredClone(data)));
  }

  get(name: ConfigurationName): Record<string, unknown> {
    const value = this.store.get(name);
    if (!value) {
      throw new Error(`Configuration not loaded: ${name}`);
    }
    return value;
  }

  has(name: ConfigurationName): boolean {
    return this.store.has(name);
  }

  loadFromDirectory(configDir: string): void {
    for (const name of CONFIG_FILES) {
      const filePath = join(configDir, `${name}.yaml`);
      if (!existsSync(filePath)) continue;
      const raw = readFileSync(filePath, "utf8");
      this.register(name, parseSimpleYaml(raw));
    }
  }

  static createWithDefaults(configDir: string): ConfigurationManager {
    const manager = new ConfigurationManager();
    manager.loadFromDirectory(configDir);
    return manager;
  }
}
