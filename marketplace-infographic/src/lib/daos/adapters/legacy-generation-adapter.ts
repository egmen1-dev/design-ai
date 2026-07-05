import { createProjectState, updateProjectState } from "../core/project-state";
import type { ProductBrief } from "../contracts/specs";
import {
  getDaosGenerationPolicy,
  resolveDaosGenerationMode,
  summarizeDaosGenerationPolicy,
  type DAOSGenerationMode,
} from "../config/generation-mode";

export function createLegacyDAOSState(input: {
  prompt: string;
  projectId?: string;
  runId?: string;
  generationMode?: DAOSGenerationMode;
}) {
  const projectId = input.projectId ?? crypto.randomUUID();
  const runId = input.runId ?? crypto.randomUUID();
  const generationMode = input.generationMode ?? resolveDaosGenerationMode();
  const policy = getDaosGenerationPolicy(generationMode);

  const state = createProjectState({ projectId, runId });

  const now = new Date().toISOString();
  const policySummary = summarizeDaosGenerationPolicy(policy);

  const brief: ProductBrief = {
    id: crypto.randomUUID(),
    projectId,
    version: 1,
    status: "ready",
    createdAt: now,
    updatedAt: now,
    source: "legacy-generation-adapter",
    rawPrompt: input.prompt,
    commercialGoal: "balanced",
    generationMode,
    decisionTrace: [
      {
        id: crypto.randomUUID(),
        source: "legacy-generation-adapter",
        decision: "Created ProductBrief from legacy prompt",
        reason: `Wave 1 preserves current pipeline while introducing DAOS ProjectState (mode=${generationMode}).`,
        confidence: 1,
        createdAt: now,
      },
    ],
  };

  return updateProjectState(state, {
    status: "brief_ready",
    brief,
    decisionTrace: brief.decisionTrace,
    events: [
      ...state.events,
      {
        id: crypto.randomUUID(),
        type: "generation_mode_resolved",
        source: "legacy-generation-adapter",
        createdAt: now,
        payload: {
          generationMode,
          policy: policySummary,
        },
      },
    ],
    debug: [
      ...state.debug,
      {
        id: crypto.randomUUID(),
        name: "generation-policy",
        type: "json",
        data: policySummary,
        createdAt: now,
      },
    ],
  });
}
