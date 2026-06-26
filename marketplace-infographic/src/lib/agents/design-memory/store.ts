import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import type { DesignMemoryStore } from "./types";
import { DESIGN_MEMORY_VERSION } from "./types";

const STORE_PATH = path.join(process.cwd(), "data", "design-memory.json");

let cache: DesignMemoryStore | null = null;

export function createEmptyStore(): DesignMemoryStore {
  return {
    learningVersion: DESIGN_MEMORY_VERSION,
    updatedAt: new Date().toISOString(),
    totalSamples: 0,
    categories: {},
    layoutWeights: {},
    fontWeights: {},
    badgeWeights: {},
    lightingWeights: {},
    backgroundWeights: {},
    compositionWeights: {},
    comboScores: {},
    recentTemplateUsage: [],
    avoidPatterns: [],
  };
}

export async function loadDesignMemoryStore(): Promise<DesignMemoryStore> {
  if (cache) return cache;
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    cache = JSON.parse(raw) as DesignMemoryStore;
    return cache;
  } catch {
    cache = createEmptyStore();
    return cache;
  }
}

export async function saveDesignMemoryStore(store: DesignMemoryStore): Promise<void> {
  store.updatedAt = new Date().toISOString();
  await mkdir(path.dirname(STORE_PATH), { recursive: true });
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
  cache = store;
}

export function getCachedDesignMemoryStore(): DesignMemoryStore | null {
  return cache;
}

export function setCachedDesignMemoryStore(store: DesignMemoryStore): void {
  cache = store;
}
