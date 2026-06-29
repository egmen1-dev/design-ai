/**
 * Chapter 3.14 — Stage budgets and parallel execution catalog
 */
import type { ParallelExecutionGroup } from "./performance-types";
import { DEFAULT_STAGE_TIME_BUDGET_MS } from "./performance-types";

/** Recommended stage time budgets (ms) — provider render excluded */
export const STAGE_TIME_BUDGET_MS = DEFAULT_STAGE_TIME_BUDGET_MS;

/** Parallel groups allowed when no HARD dependency exists (Ch 3.14) */
export const PERFORMANCE_PARALLEL_GROUPS: ParallelExecutionGroup[] = [
  {
    id: "intelligence-bootstrap",
    agents: ["product-analyzer", "creative-engine"],
    sequential: false,
  },
  {
    id: "visual-pipeline-trio",
    agents: ["lighting-director", "camera-director", "material-director"],
    sequential: false,
  },
  {
    id: "post-composite",
    agents: ["commercial-photo-director", "critics", "governance"],
    sequential: false,
  },
];

/** Mandatory sequential chain */
export const PERFORMANCE_SEQUENTIAL_CHAIN = [
  "visual-story-director",
  "scene-director",
  "composition-director",
] as const;

export const STORY_SCENE_PHOTOGRAPHY_CHAIN = ["story", "scene", "photography"] as const;

export function stageBudgetFor(stage: keyof typeof STAGE_TIME_BUDGET_MS): number {
  return STAGE_TIME_BUDGET_MS[stage];
}

export function isOverBudget(stage: keyof typeof STAGE_TIME_BUDGET_MS, durationMs: number): boolean {
  return durationMs > STAGE_TIME_BUDGET_MS[stage];
}
