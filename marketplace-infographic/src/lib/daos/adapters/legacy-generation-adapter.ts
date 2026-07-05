import { createProjectState, updateProjectState } from "../core/project-state";
import type { ProductBrief } from "../contracts/specs";

export function createLegacyDAOSState(input: {
  prompt: string;
  projectId?: string;
  runId?: string;
}) {
  const projectId = input.projectId ?? crypto.randomUUID();
  const runId = input.runId ?? crypto.randomUUID();

  const state = createProjectState({ projectId, runId });

  const now = new Date().toISOString();

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
    decisionTrace: [
      {
        id: crypto.randomUUID(),
        source: "legacy-generation-adapter",
        decision: "Created ProductBrief from legacy prompt",
        reason: "Wave 1 preserves current pipeline while introducing DAOS ProjectState.",
        confidence: 1,
        createdAt: now,
      },
    ],
  };

  return updateProjectState(state, {
    status: "brief_ready",
    brief,
    decisionTrace: brief.decisionTrace,
  });
}
