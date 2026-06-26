import type { DesignAgent } from "../types";
import type { DesignMemoryUpdateResult } from "./types";
import { learnFromGeneration, type DesignMemoryLearnInput } from "./learn";
import { buildMemoryReport } from "./report";
import { loadDesignMemoryStore, saveDesignMemoryStore } from "./store";

export const DESIGN_MEMORY_AGENT: DesignAgent<
  DesignMemoryLearnInput,
  DesignMemoryUpdateResult
> = {
  id: "design-memory",
  name: "Design Memory AI",
  version: "1.0.0",
  run: runDesignMemory,
};

/** Design Memory AI — статистическое обучение на успешных генерациях */
export async function runDesignMemory(
  input: DesignMemoryLearnInput,
): Promise<DesignMemoryUpdateResult> {
  const store = await loadDesignMemoryStore();
  const learn = learnFromGeneration(store, input);
  await saveDesignMemoryStore(learn.store);
  return buildMemoryReport(learn.store, learn, input.category);
}

export type { DesignMemoryLearnInput } from "./learn";
export { computeOutcomeScore, learnFromGeneration } from "./learn";
export { buildMemoryReport } from "./report";
export { getMemoryLayoutBoost } from "./apply";
export {
  loadDesignMemoryStore,
  saveDesignMemoryStore,
  getCachedDesignMemoryStore,
} from "./store";
export type {
  DesignMemoryStore,
  DesignMemoryUpdateResult,
  PatternCombo,
  WeightChange,
  WeightEntry,
} from "./types";
export {
  DESIGN_MEMORY_VERSION,
  MEMORY_EMA_ALPHA,
  MEMORY_OVERUSE_THRESHOLD,
  MEMORY_OVERUSE_WINDOW,
} from "./types";
